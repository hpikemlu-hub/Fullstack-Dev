// Dashboard Statistics API Route
// Migrated from Supabase to Prisma with enhanced caching

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withCORS } from '@/lib/auth/middleware'
import { DatabaseOperations } from '@/lib/database/prisma'
import { Redis } from 'ioredis'

// Initialize Redis client (optional caching)
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null

// GET /api/dashboard/stats - Get dashboard statistics
export const GET = withCORS(
  async (request: NextRequest) => {
    try {
      const cacheKey = 'dashboard:stats'
      
      // Try to get from cache first
      if (redis) {
        try {
          const cached = await redis.get(cacheKey)
          if (cached) {
            const data = JSON.parse(cached)
            return NextResponse.json({
              success: true,
              data,
              cached: true
            })
          }
        } catch (cacheError) {
          console.warn('Cache read error:', cacheError)
        }
      }

      // Get fresh data from database
      const stats = await DatabaseOperations.getDashboardStats()

      // Cache the result for 5 minutes
      if (redis) {
        try {
          await redis.setex(cacheKey, 300, JSON.stringify(stats))
        } catch (cacheError) {
          console.warn('Cache write error:', cacheError)
        }
      }

      return NextResponse.json({
        success: true,
        data: stats,
        cached: false
      })

    } catch (error) {
      console.error('Dashboard stats error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch dashboard statistics' 
        },
        { status: 500 }
      )
    }
  }
)

// Handle OPTIONS for CORS
export const OPTIONS = withCORS(async () => {
  return new NextResponse(null, { status: 200 })
})