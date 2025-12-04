// Authentication Logout API Route
import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (refreshToken) {
      // Invalidate refresh token in database
      await AuthService.logout(refreshToken)
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout berhasil'
    })

    // Clear cookies
    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}