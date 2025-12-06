import { NextRequest, NextResponse } from 'next/server'

interface MetricsData {
  timestamp: string
  uptime: number
  process: {
    cpu_usage_percent: number
    memory_usage_mb: number
    memory_usage_percent: number
    heap_used_mb: number
    heap_total_mb: number
    external_mb: number
    rss_mb: number
  }
  system: {
    node_version: string
    platform: string
    arch: string
    environment: string
    version: string
  }
  http: {
    active_handles: number
    active_requests: number
  }
}

const startTime = Date.now()
let requestCount = 0
let totalResponseTime = 0

// Simple in-memory metrics (in production, consider using a proper metrics library)
const metrics = {
  http_requests_total: 0,
  http_request_duration_ms: 0,
  process_start_time_seconds: Math.floor(startTime / 1000)
}

function getMetrics(): MetricsData {
  const memUsage = process.memoryUsage()
  const uptime = process.uptime()
  
  return {
    timestamp: new Date().toISOString(),
    uptime: uptime * 1000, // Convert to milliseconds
    process: {
      cpu_usage_percent: 0, // Would need additional calculation for real CPU usage
      memory_usage_mb: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
      memory_usage_percent: 0, // Would need system total memory
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      external_mb: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
      rss_mb: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100
    },
    system: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    },
    http: {
      active_handles: (process as any)._getActiveHandles().length,
      active_requests: (process as any)._getActiveRequests().length
    }
  }
}

function getPrometheusMetrics(): string {
  const memUsage = process.memoryUsage()
  const uptime = process.uptime()
  
  // Format metrics in Prometheus format
  const prometheusMetrics = `
# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds counter
process_uptime_seconds ${uptime}

# HELP process_start_time_seconds Start time of the process since unix epoch in seconds
# TYPE process_start_time_seconds gauge
process_start_time_seconds ${metrics.process_start_time_seconds}

# HELP nodejs_heap_size_used_bytes Process heap space size used in bytes
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes ${memUsage.heapUsed}

# HELP nodejs_heap_size_total_bytes Process heap space size total in bytes
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes ${memUsage.heapTotal}

# HELP nodejs_external_memory_bytes Nodejs external memory size in bytes
# TYPE nodejs_external_memory_bytes gauge
nodejs_external_memory_bytes ${memUsage.external}

# HELP process_resident_memory_bytes Resident memory size in bytes
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes ${memUsage.rss}

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.http_requests_total}

# HELP nodejs_active_handles Number of active libuv handles
# TYPE nodejs_active_handles gauge
nodejs_active_handles ${(process as any)._getActiveHandles().length}

# HELP nodejs_active_requests Number of active libuv requests
# TYPE nodejs_active_requests gauge
nodejs_active_requests ${(process as any)._getActiveRequests().length}

# HELP nodejs_version_info Node.js version info
# TYPE nodejs_version_info gauge
nodejs_version_info{version="${process.version}",platform="${process.platform}",arch="${process.arch}"} 1
`.trim()

  return prometheusMetrics
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')
  
  // Increment request counter
  metrics.http_requests_total++
  
  try {
    if (format === 'prometheus') {
      // Return Prometheus format for monitoring systems
      const prometheusMetrics = getPrometheusMetrics()
      
      return new NextResponse(prometheusMetrics, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    } else {
      // Return JSON format for general consumption
      const metricsData = getMetrics()
      
      return NextResponse.json(metricsData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Support HEAD requests
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 })
}