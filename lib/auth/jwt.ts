// JWT Authentication System
// Replaces Supabase Auth with custom JWT implementation

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/database/prisma'
import { User } from '@prisma/client'

export interface TokenPayload {
  userId: string
  username: string
  email?: string
  role: 'ADMIN' | 'USER'
  namaLengkap: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface SessionData extends TokenPayload {
  id: string
  authenticated: boolean
}

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be defined in environment variables')
}

export class AuthService {
  
  // Generate access and refresh tokens
  static generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'workload-app',
      audience: 'workload-users'
    })
    
    const refreshToken = jwt.sign(
      { userId: payload.userId },
      JWT_REFRESH_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        issuer: 'workload-app',
        audience: 'workload-users'
      }
    )
    
    return { accessToken, refreshToken }
  }
  
  // Verify access token
  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        issuer: 'workload-app',
        audience: 'workload-users'
      }) as TokenPayload
      
      return payload
    } catch (error) {
      console.error('Access token verification failed:', error)
      return null
    }
  }
  
  // Verify refresh token
  static verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'workload-app',
        audience: 'workload-users'
      }) as { userId: string }
      
      return payload
    } catch (error) {
      console.error('Refresh token verification failed:', error)
      return null
    }
  }
  
  // Authenticate user with username/password
  static async authenticate(username: string, password: string): Promise<{
    success: boolean
    user?: SessionData
    tokens?: AuthTokens
    error?: string
  }> {
    try {
      // Find user by username or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: username }
          ],
          isActive: true
        },
        select: {
          id: true,
          namaLengkap: true,
          username: true,
          email: true,
          password: true,
          role: true
        }
      })
      
      if (!user) {
        return {
          success: false,
          error: 'Username atau email tidak ditemukan'
        }
      }
      
      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password)
      if (!passwordValid) {
        return {
          success: false,
          error: 'Password tidak valid'
        }
      }
      
      // Create token payload
      const tokenPayload: TokenPayload = {
        userId: user.id,
        username: user.username,
        email: user.email || undefined,
        role: user.role,
        namaLengkap: user.namaLengkap
      }
      
      // Generate tokens
      const tokens = this.generateTokens(tokenPayload)
      
      // Store refresh token in database
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days
      
      await prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt
        }
      })
      
      // Create session data
      const sessionData: SessionData = {
        ...tokenPayload,
        id: user.id,
        authenticated: true
      }
      
      return {
        success: true,
        user: sessionData,
        tokens
      }
      
    } catch (error) {
      console.error('Authentication error:', error)
      return {
        success: false,
        error: 'Terjadi kesalahan sistem'
      }
    }
  }
  
  // Refresh access token
  static async refreshAccessToken(refreshToken: string): Promise<{
    success: boolean
    tokens?: AuthTokens
    error?: string
  }> {
    try {
      // Verify refresh token
      const payload = this.verifyRefreshToken(refreshToken)
      if (!payload) {
        return {
          success: false,
          error: 'Refresh token tidak valid'
        }
      }
      
      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
          user: {
            select: {
              id: true,
              namaLengkap: true,
              username: true,
              email: true,
              role: true,
              isActive: true
            }
          }
        }
      })
      
      if (!storedToken || !storedToken.user.isActive || storedToken.expiresAt < new Date()) {
        // Clean up expired token
        if (storedToken) {
          await prisma.refreshToken.delete({ where: { id: storedToken.id } })
        }
        
        return {
          success: false,
          error: 'Refresh token expired atau tidak valid'
        }
      }
      
      // Generate new tokens
      const tokenPayload: TokenPayload = {
        userId: storedToken.user.id,
        username: storedToken.user.username,
        email: storedToken.user.email || undefined,
        role: storedToken.user.role,
        namaLengkap: storedToken.user.namaLengkap
      }
      
      const newTokens = this.generateTokens(tokenPayload)
      
      // Update refresh token in database
      const newExpiresAt = new Date()
      newExpiresAt.setDate(newExpiresAt.getDate() + 7)
      
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          token: newTokens.refreshToken,
          expiresAt: newExpiresAt
        }
      })
      
      return {
        success: true,
        tokens: newTokens
      }
      
    } catch (error) {
      console.error('Token refresh error:', error)
      return {
        success: false,
        error: 'Gagal memperbarui token'
      }
    }
  }
  
  // Logout (invalidate refresh token)
  static async logout(refreshToken: string): Promise<boolean> {
    try {
      await prisma.refreshToken.delete({
        where: { token: refreshToken }
      })
      return true
    } catch (error) {
      console.error('Logout error:', error)
      return false
    }
  }
  
  // Hash password for new users
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12)
  }
  
  // Clean up expired refresh tokens
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
      return result.count
    } catch (error) {
      console.error('Token cleanup error:', error)
      return 0
    }
  }
}