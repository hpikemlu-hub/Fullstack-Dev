#!/usr/bin/env tsx

/**
 * Health Check Script
 * Comprehensive health monitoring for the application and its dependencies
 */

import { PrismaClient } from '@prisma/client'
import { createClient } from 'redis'
import http from 'http'
import https from 'https'

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  services: {
    [key: string]: {
      status: 'up' | 'down' | 'slow'
      responseTime?: number
      error?: string
      details?: any
    }
  }
  version: string
  uptime: number
}

class HealthChecker {
  private prisma: PrismaClient
  private startTime: number

  constructor() {
    this.prisma = new PrismaClient()
    this.startTime = Date.now()
  }

  async checkDatabase(): Promise<{ status: 'up' | 'down' | 'slow', responseTime: number, error?: string }> {
    const start = Date.now()
    try {
      // Simple query to check database connection
      await this.prisma.$queryRaw`SELECT 1`
      const responseTime = Date.now() - start

      // Check if response time is acceptable (< 1000ms)
      const status = responseTime > 1000 ? 'slow' : 'up'
      
      return { status, responseTime }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown database error'
      }
    }
  }

  async checkRedis(): Promise<{ status: 'up' | 'down' | 'slow', responseTime: number, error?: string }> {
    const start = Date.now()
    try {
      if (!process.env.REDIS_URL) {
        return { status: 'down', responseTime: 0, error: 'Redis URL not configured' }
      }

      const redis = createClient({ url: process.env.REDIS_URL })
      await redis.connect()
      
      // Simple ping to check Redis connection
      await redis.ping()
      await redis.quit()
      
      const responseTime = Date.now() - start
      const status = responseTime > 500 ? 'slow' : 'up'
      
      return { status, responseTime }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown Redis error'
      }
    }
  }

  async checkExternalAPI(url: string, name: string): Promise<{ status: 'up' | 'down' | 'slow', responseTime: number, error?: string }> {
    const start = Date.now()
    return new Promise((resolve) => {
      const request = url.startsWith('https') ? https : http
      
      const req = request.get(url, (res) => {
        const responseTime = Date.now() - start
        const status = res.statusCode === 200 ? (responseTime > 2000 ? 'slow' : 'up') : 'down'
        
        resolve({
          status,
          responseTime,
          error: res.statusCode !== 200 ? `HTTP ${res.statusCode}` : undefined
        })
      })

      req.on('error', (error) => {
        resolve({
          status: 'down',
          responseTime: Date.now() - start,
          error: error.message
        })
      })

      // 5 second timeout
      req.setTimeout(5000, () => {
        req.destroy()
        resolve({
          status: 'down',
          responseTime: Date.now() - start,
          error: 'Request timeout'
        })
      })
    })
  }

  async checkDiskSpace(): Promise<{ status: 'up' | 'down' | 'slow', details: any, error?: string }> {
    try {
      const fs = await import('fs')
      const stats = await fs.promises.statfs('.')
      
      const totalSpace = stats.blocks * stats.bsize
      const freeSpace = stats.bavail * stats.bsize
      const usedPercent = ((totalSpace - freeSpace) / totalSpace) * 100

      const status = usedPercent > 90 ? 'down' : usedPercent > 80 ? 'slow' : 'up'
      
      return {
        status,
        details: {
          totalGB: Math.round(totalSpace / 1024 / 1024 / 1024 * 100) / 100,
          freeGB: Math.round(freeSpace / 1024 / 1024 / 1024 * 100) / 100,
          usedPercent: Math.round(usedPercent * 100) / 100
        }
      }
    } catch (error) {
      return {
        status: 'down',
        details: {},
        error: error instanceof Error ? error.message : 'Unable to check disk space'
      }
    }
  }

  async checkMemory(): Promise<{ status: 'up' | 'down' | 'slow', details: any }> {
    const used = process.memoryUsage()
    const totalMem = await import('os').then(os => os.totalmem())
    const freeMem = await import('os').then(os => os.freemem())
    
    const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100
    const heapUsagePercent = (used.heapUsed / used.heapTotal) * 100

    const status = memUsagePercent > 90 || heapUsagePercent > 90 ? 'down' : 
                   memUsagePercent > 80 || heapUsagePercent > 80 ? 'slow' : 'up'

    return {
      status,
      details: {
        heapUsedMB: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotalMB: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
        heapUsagePercent: Math.round(heapUsagePercent * 100) / 100,
        systemMemUsagePercent: Math.round(memUsagePercent * 100) / 100
      }
    }
  }

  async performHealthCheck(): Promise<HealthStatus> {
    console.log('🔍 Performing comprehensive health check...')
    
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDiskSpace(),
      this.checkMemory(),
      // Add external API checks if needed
      // this.checkExternalAPI('https://api.example.com/health', 'External API')
    ])

    const services: HealthStatus['services'] = {}
    
    // Database check
    if (checks[0].status === 'fulfilled') {
      services.database = checks[0].value
    } else {
      services.database = { status: 'down', error: 'Health check failed' }
    }

    // Redis check
    if (checks[1].status === 'fulfilled') {
      services.redis = checks[1].value
    } else {
      services.redis = { status: 'down', error: 'Health check failed' }
    }

    // Disk check
    if (checks[2].status === 'fulfilled') {
      services.disk = checks[2].value
    } else {
      services.disk = { status: 'down', error: 'Health check failed' }
    }

    // Memory check
    if (checks[3].status === 'fulfilled') {
      services.memory = checks[3].value
    } else {
      services.memory = { status: 'down', error: 'Health check failed' }
    }

    // Determine overall health status
    const serviceStatuses = Object.values(services).map(s => s.status)
    const overallStatus = serviceStatuses.includes('down') ? 'unhealthy' :
                         serviceStatuses.includes('slow') ? 'degraded' : 'healthy'

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - this.startTime
    }

    return healthStatus
  }

  async cleanup() {
    await this.prisma.$disconnect()
  }
}

// CLI execution
async function main() {
  const checker = new HealthChecker()
  
  try {
    const healthStatus = await checker.performHealthCheck()
    
    // Pretty print results
    console.log('\n📊 Health Check Results:')
    console.log('========================')
    console.log(`Overall Status: ${healthStatus.status.toUpperCase()}`)
    console.log(`Timestamp: ${healthStatus.timestamp}`)
    console.log(`Uptime: ${Math.round(healthStatus.uptime / 1000)}s`)
    console.log(`Version: ${healthStatus.version}`)
    console.log('\nService Details:')
    
    Object.entries(healthStatus.services).forEach(([service, details]) => {
      const statusEmoji = details.status === 'up' ? '✅' : details.status === 'slow' ? '⚠️' : '❌'
      console.log(`${statusEmoji} ${service}: ${details.status.toUpperCase()}`)
      
      if (details.responseTime) {
        console.log(`   Response Time: ${details.responseTime}ms`)
      }
      
      if (details.details) {
        console.log(`   Details: ${JSON.stringify(details.details, null, 4)}`)
      }
      
      if (details.error) {
        console.log(`   Error: ${details.error}`)
      }
    })

    // Exit with appropriate code
    const exitCode = healthStatus.status === 'healthy' ? 0 : 
                     healthStatus.status === 'degraded' ? 1 : 2
    
    if (process.env.NODE_ENV !== 'development') {
      process.exit(exitCode)
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error)
    process.exit(2)
  } finally {
    await checker.cleanup()
  }
}

// Export for use in API routes
export { HealthChecker, type HealthStatus }

// Run if called directly
if (require.main === module) {
  main()
}