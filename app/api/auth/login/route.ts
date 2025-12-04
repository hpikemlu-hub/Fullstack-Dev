// Authentication Login API Route
// Replaces Supabase Auth with JWT authentication

import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/jwt'
import { withCORS, withRateLimit, withValidation } from '@/lib/auth/middleware'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

export const POST = withCORS(
  withRateLimit(
    10, // 10 requests
    15 * 60 * 1000, // per 15 minutes
    withValidation(
      loginSchema,
      async (request: NextRequest, data: { username: string; password: string }) => {
        try {
          const { username, password } = data
          
          // Authenticate user
          const authResult = await AuthService.authenticate(username, password)
          
          if (!authResult.success) {
            return NextResponse.json(
              { 
                success: false, 
                error: authResult.error 
              },
              { status: 401 }
            )
          }
          
          // Set HTTP-only cookies
          const response = NextResponse.json({
            success: true,
            message: 'Login berhasil',
            user: authResult.user
          })
          
          // Set access token cookie
          response.cookies.set('accessToken', authResult.tokens!.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
          })
          
          // Set refresh token cookie
          response.cookies.set('refreshToken', authResult.tokens!.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
          })
          
          return response
          
        } catch (error) {
          console.error('Login API error:', error)
          return NextResponse.json(
            { 
              success: false, 
              error: 'Terjadi kesalahan sistem' 
            },
            { status: 500 }
          )
        }
      }
    )
  )
)

// Handle OPTIONS for CORS
export const OPTIONS = withCORS(async () => {
  return new NextResponse(null, { status: 200 })
})