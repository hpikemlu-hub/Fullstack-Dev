import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from 'redis'

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  environment: string
  services: {
    database: {
      status: 'up' | 'down' | 'slow'
      responseTime?: number
      error?: string
    }
    redis?: {
      status: 'up' | 'down' | 'slow'
      responseTime?: number
      error?: string
    }
    memory: {
      status: 'up' | 'down' | 'slow'
      heapUsed: number
      heapTotal: number
      external: number
      rss: number
    }
  }
  checks: {
    [key: string]: boolean | string
  }
}

const startTime = Date.now()

async function checkDatabase(): Promise<{ status: 'up' | 'down' | 'slow', responseTime: number, error?: string }> {
  const start = Date.now()
  let prisma: PrismaClient | null = null
  
  try {
    prisma = new PrismaClient()
    
    // Simple connectivity test
    await prisma.$queryRaw`SELECT 1`
    
    const responseTime = Date.now() - start
    return {
      status: responseTime > 1000 ? 'slow' : 'up',
      responseTime
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Database connection failed'
    }
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

async function checkRedis(): Promise<{ status: 'up' | 'down' | 'slow', responseTime: number, error?: string }> {
  const start = Date.now()
  
  if (!process.env.REDIS_URL) {
    return {
      status: 'down',
      responseTime: 0,
      error: 'Redis URL not configured'
    }
  }

  let redis: any = null
  
  try {
    redis = createClient({ url: process.env.REDIS_URL })
    await redis.connect()
    await redis.ping()
    
    const responseTime = Date.now() - start
    return {
      status: responseTime > 500 ? 'slow' : 'up',
      responseTime
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Redis connection failed'
    }
  } finally {
    if (redis) {
      try {
        await redis.quit()
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

function checkMemory(): { status: 'up' | 'down' | 'slow', heapUsed: number, heapTotal: number, external: number, rss: number } {
  const memUsage = process.memoryUsage()
  const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
  
  let status: 'up' | 'down' | 'slow' = 'up'
  if (heapUsagePercent > 90) {
    status = 'down'
  } else if (heapUsagePercent > 80) {
    status = 'slow'
  }

  return {
    status,
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
    external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100, // MB
    rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100 // MB
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const start = Date.now()
  
  try {
    // Perform health checks
    const [dbCheck, redisCheck] = await Promise.allSettled([
      checkDatabase(),
      checkRedis()
    ])
    
    const memCheck = checkMemory()
    
    // Build health response
    const healthResponse: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbCheck.status === 'fulfilled' ? dbCheck.value : { status: 'down', error: 'Health check failed' },
        memory: memCheck
      },
      checks: {
        database: dbCheck.status === 'fulfilled' && dbCheck.value.status !== 'down',
        memory: memCheck.status !== 'down',
        environment: !!process.env.DATABASE_URL
      }
    }
    
    // Add Redis if configured
    if (process.env.REDIS_URL) {
      healthResponse.services.redis = redisCheck.status === 'fulfilled' ? redisCheck.value : { status: 'down', error: 'Health check failed' }
      healthResponse.checks.redis = redisCheck.status === 'fulfilled' && redisCheck.value.status !== 'down'
    }
    
    // Determine overall health status
    const hasFailures = Object.values(healthResponse.checks).some(check => !check)
    const hasSlowServices = Object.values(healthResponse.services).some(service => 
      service && typeof service === 'object' && 'status' in service && service.status === 'slow'
    )
    
    if (hasFailures) {
      healthResponse.status = 'unhealthy'
    } else if (hasSlowServices) {
      healthResponse.status = 'degraded'
    }
    
    // Add response time to checks
    healthResponse.checks.responseTime = (Date.now() - start) < 5000
    
    // Return appropriate HTTP status
    const httpStatus = healthResponse.status === 'healthy' ? 200 : 
                      healthResponse.status === 'degraded' ? 200 : 503
    
    return NextResponse.json(healthResponse, {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    // Critical error in health check itself
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: { status: 'down', error: 'Health check failed' },
        memory: { status: 'down', heapUsed: 0, heapTotal: 0, external: 0, rss: 0 }
      },
      checks: {
        healthEndpoint: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown health check error'
      }
    }
    
    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}

// Support HEAD requests for simple health checks
export async function HEAD(): Promise<NextResponse> {
  try {
    // Quick database connectivity test for HEAD requests
    const prisma = new PrismaClient()
    await prisma.$queryRaw`SELECT 1`
    await prisma.$disconnect()
    
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}