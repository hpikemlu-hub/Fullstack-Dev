// Authentication Middleware
// Replaces Supabase RLS with JWT-based route protection

import { NextRequest, NextResponse } from 'next/server'
import { AuthService, TokenPayload } from './jwt'

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload
}

// Extract token from Authorization header or cookies
function extractToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Try cookies
  const tokenCookie = request.cookies.get('accessToken')
  if (tokenCookie) {
    return tokenCookie.value
  }
  
  return null
}

// Middleware to require authentication
export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const token = extractToken(request)
      
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Token tidak ditemukan' },
          { status: 401 }
        )
      }
      
      const payload = AuthService.verifyAccessToken(token)
      if (!payload) {
        return NextResponse.json(
          { success: false, error: 'Token tidak valid atau expired' },
          { status: 401 }
        )
      }
      
      // Add user info to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = payload
      
      return handler(authenticatedRequest)
      
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

// Middleware to require admin role
export function requireAdmin(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return requireAuth(async (request: AuthenticatedRequest): Promise<NextResponse> => {
    if (request.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    return handler(request)
  })
}

// Middleware to allow both authenticated and specific user access
export function requireOwnerOrAdmin(
  getResourceUserId: (request: AuthenticatedRequest) => Promise<string | null>
) {
  return requireAuth(async (request: AuthenticatedRequest): Promise<NextResponse> => {
    const currentUserId = request.user!.userId
    const isAdmin = request.user!.role === 'ADMIN'
    
    if (isAdmin) {
      // Admins can access everything
      return NextResponse.next()
    }
    
    // Check if user owns the resource
    const resourceUserId = await getResourceUserId(request)
    if (resourceUserId && resourceUserId === currentUserId) {
      return NextResponse.next()
    }
    
    return NextResponse.json(
      { success: false, error: 'Access denied' },
      { status: 403 }
    )
  })
}

// Optional authentication (doesn't fail if no token)
export function optionalAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const token = extractToken(request)
      
      if (token) {
        const payload = AuthService.verifyAccessToken(token)
        if (payload) {
          const authenticatedRequest = request as AuthenticatedRequest
          authenticatedRequest.user = payload
        }
      }
      
      return handler(request as AuthenticatedRequest)
      
    } catch (error) {
      console.error('Optional auth middleware error:', error)
      return handler(request as AuthenticatedRequest)
    }
  }
}

// CORS handling for API routes
export function withCORS(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      })
    }
    
    const response = await handler(request)
    
    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    return response
  }
}

// Rate limiting middleware (simple implementation)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const now = Date.now()
    const windowStart = now - windowMs
    
    const current = rateLimitMap.get(ip) || { count: 0, lastReset: now }
    
    // Reset if window has passed
    if (current.lastReset < windowStart) {
      current.count = 0
      current.lastReset = now
    }
    
    current.count++
    rateLimitMap.set(ip, current)
    
    if (current.count > maxRequests) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      )
    }
    
    return handler(request)
  }
}

// Input validation middleware
export function withValidation<T>(
  schema: {
    parse: (data: unknown) => T
  },
  handler: (req: NextRequest, data: T) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body = await request.json()
      const validatedData = schema.parse(body)
      
      return handler(request, validatedData)
      
    } catch (error) {
      console.error('Validation error:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      )
    }
  }
}