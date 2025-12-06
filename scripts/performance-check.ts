#!/usr/bin/env tsx

/**
 * Performance Check Script
 * Monitors application performance and identifies bottlenecks
 */

import { performance } from 'perf_hooks'
import http from 'http'
import https from 'https'

interface PerformanceTest {
  name: string
  url: string
  method: 'GET' | 'POST' | 'HEAD'
  headers?: Record<string, string>
  body?: string
  expectedStatus?: number
  timeout: number
}

interface PerformanceResult {
  name: string
  url: string
  status: 'pass' | 'fail' | 'slow'
  responseTime: number
  statusCode?: number
  contentLength?: number
  error?: string
  metrics: {
    dns?: number
    connection?: number
    firstByte?: number
    download?: number
  }
}

class PerformanceChecker {
  private baseUrl: string
  private timeout: number

  constructor(baseUrl: string = 'http://localhost:3000', timeout: number = 10000) {
    this.baseUrl = baseUrl
    this.timeout = timeout
  }

  private async performRequest(test: PerformanceTest): Promise<PerformanceResult> {
    return new Promise((resolve) => {
      const startTime = performance.now()
      const url = test.url.startsWith('http') ? test.url : `${this.baseUrl}${test.url}`
      const isHttps = url.startsWith('https')
      const request = isHttps ? https : http

      let dnsStart: number
      let connectionStart: number
      let firstByteStart: number

      const parsedUrl = new URL(url)
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: test.method,
        headers: {
          'User-Agent': 'Performance-Checker/1.0',
          ...test.headers
        },
        timeout: test.timeout
      }

      const req = request.request(options, (res) => {
        firstByteStart = performance.now()
        
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          const endTime = performance.now()
          const totalTime = endTime - startTime

          const result: PerformanceResult = {
            name: test.name,
            url: test.url,
            status: this.determineStatus(totalTime, res.statusCode, test.expectedStatus),
            responseTime: Math.round(totalTime * 100) / 100,
            statusCode: res.statusCode,
            contentLength: Buffer.byteLength(data),
            metrics: {
              firstByte: firstByteStart ? Math.round((firstByteStart - startTime) * 100) / 100 : undefined,
              download: Math.round((endTime - (firstByteStart || endTime)) * 100) / 100
            }
          }

          resolve(result)
        })
      })

      req.on('error', (error) => {
        resolve({
          name: test.name,
          url: test.url,
          status: 'fail',
          responseTime: performance.now() - startTime,
          error: error.message,
          metrics: {}
        })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({
          name: test.name,
          url: test.url,
          status: 'fail',
          responseTime: test.timeout,
          error: 'Request timeout',
          metrics: {}
        })
      })

      if (test.body) {
        req.write(test.body)
      }

      req.end()
    })
  }

  private determineStatus(
    responseTime: number, 
    statusCode?: number, 
    expectedStatus?: number
  ): 'pass' | 'fail' | 'slow' {
    if (statusCode && expectedStatus && statusCode !== expectedStatus) {
      return 'fail'
    }
    
    if (statusCode && statusCode >= 400) {
      return 'fail'
    }
    
    if (responseTime > 2000) {
      return 'fail'
    }
    
    if (responseTime > 1000) {
      return 'slow'
    }
    
    return 'pass'
  }

  private getDefaultTests(): PerformanceTest[] {
    return [
      {
        name: 'Home Page Load',
        url: '/',
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000
      },
      {
        name: 'Health Check',
        url: '/api/health',
        method: 'GET',
        expectedStatus: 200,
        timeout: 3000
      },
      {
        name: 'Metrics Endpoint',
        url: '/api/metrics',
        method: 'GET',
        expectedStatus: 200,
        timeout: 3000
      },
      {
        name: 'Login Page',
        url: '/auth/login',
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000
      },
      {
        name: 'Dashboard',
        url: '/dashboard',
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000
      },
      {
        name: 'Employees API',
        url: '/api/employees',
        method: 'GET',
        timeout: 3000
      },
      {
        name: 'Workload API',
        url: '/api/workload',
        method: 'GET',
        timeout: 3000
      },
      {
        name: 'Calendar Events API',
        url: '/api/calendar/events',
        method: 'GET',
        timeout: 3000
      },
      {
        name: 'Static Assets',
        url: '/_next/static/chunks/webpack.js',
        method: 'HEAD',
        timeout: 2000
      },
      {
        name: 'Favicon',
        url: '/favicon.ico',
        method: 'HEAD',
        timeout: 1000
      }
    ]
  }

  async runPerformanceTests(customTests?: PerformanceTest[]): Promise<PerformanceResult[]> {
    const tests = customTests || this.getDefaultTests()
    console.log(`🚀 Running ${tests.length} performance tests against ${this.baseUrl}`)
    console.log('=' .repeat(80))

    const results: PerformanceResult[] = []

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i]
      console.log(`\n📊 Test ${i + 1}/${tests.length}: ${test.name}`)
      console.log(`   URL: ${test.method} ${test.url}`)

      const result = await this.performRequest(test)
      results.push(result)

      // Display result
      const statusIcon = result.status === 'pass' ? '✅' : result.status === 'slow' ? '⚠️' : '❌'
      console.log(`   ${statusIcon} Status: ${result.status.toUpperCase()}`)
      console.log(`   ⏱️  Response Time: ${result.responseTime}ms`)
      
      if (result.statusCode) {
        console.log(`   🔢 HTTP Status: ${result.statusCode}`)
      }
      
      if (result.contentLength) {
        console.log(`   📦 Content Length: ${result.contentLength} bytes`)
      }
      
      if (result.metrics.firstByte) {
        console.log(`   🥇 First Byte: ${result.metrics.firstByte}ms`)
      }
      
      if (result.error) {
        console.log(`   💥 Error: ${result.error}`)
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return results
  }

  generateReport(results: PerformanceResult[]): void {
    console.log('\n' + '=' .repeat(80))
    console.log('📈 PERFORMANCE REPORT')
    console.log('=' .repeat(80))

    // Summary statistics
    const totalTests = results.length
    const passedTests = results.filter(r => r.status === 'pass').length
    const slowTests = results.filter(r => r.status === 'slow').length
    const failedTests = results.filter(r => r.status === 'fail').length
    
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests
    const maxResponseTime = Math.max(...results.map(r => r.responseTime))
    const minResponseTime = Math.min(...results.map(r => r.responseTime))

    console.log(`\n📊 Summary:`)
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   ✅ Passed: ${passedTests} (${Math.round(passedTests / totalTests * 100)}%)`)
    console.log(`   ⚠️  Slow: ${slowTests} (${Math.round(slowTests / totalTests * 100)}%)`)
    console.log(`   ❌ Failed: ${failedTests} (${Math.round(failedTests / totalTests * 100)}%)`)

    console.log(`\n⏱️  Response Times:`)
    console.log(`   Average: ${Math.round(avgResponseTime * 100) / 100}ms`)
    console.log(`   Fastest: ${minResponseTime}ms`)
    console.log(`   Slowest: ${maxResponseTime}ms`)

    // Performance categories
    console.log(`\n🎯 Performance Categories:`)
    console.log(`   🚀 Excellent (< 200ms): ${results.filter(r => r.responseTime < 200).length}`)
    console.log(`   👍 Good (200-500ms): ${results.filter(r => r.responseTime >= 200 && r.responseTime < 500).length}`)
    console.log(`   😐 Acceptable (500-1000ms): ${results.filter(r => r.responseTime >= 500 && r.responseTime < 1000).length}`)
    console.log(`   🐌 Slow (1000-2000ms): ${results.filter(r => r.responseTime >= 1000 && r.responseTime < 2000).length}`)
    console.log(`   🚨 Too Slow (> 2000ms): ${results.filter(r => r.responseTime >= 2000).length}`)

    // Failed tests details
    const failedResults = results.filter(r => r.status === 'fail')
    if (failedResults.length > 0) {
      console.log(`\n❌ Failed Tests:`)
      failedResults.forEach(result => {
        console.log(`   • ${result.name}: ${result.error || `HTTP ${result.statusCode}`}`)
      })
    }

    // Slow tests details
    const slowResults = results.filter(r => r.status === 'slow')
    if (slowResults.length > 0) {
      console.log(`\n⚠️  Slow Tests:`)
      slowResults.forEach(result => {
        console.log(`   • ${result.name}: ${result.responseTime}ms`)
      })
    }

    // Recommendations
    console.log(`\n💡 Recommendations:`)
    if (failedTests > 0) {
      console.log(`   • Fix ${failedTests} failing endpoint(s)`)
    }
    if (slowTests > 0) {
      console.log(`   • Optimize ${slowTests} slow endpoint(s)`)
    }
    if (avgResponseTime > 500) {
      console.log(`   • Overall performance needs improvement (avg: ${Math.round(avgResponseTime)}ms)`)
    }
    if (failedTests === 0 && slowTests === 0) {
      console.log(`   • 🎉 All tests passed! Performance is excellent.`)
    }
  }
}

// CLI execution
async function main() {
  const baseUrl = process.env.BASE_URL || process.argv[2] || 'http://localhost:3000'
  const checker = new PerformanceChecker(baseUrl)

  console.log('🔍 Performance Monitoring Tool')
  console.log('==============================')
  console.log(`Target: ${baseUrl}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)

  try {
    const results = await checker.runPerformanceTests()
    checker.generateReport(results)

    // Exit code based on results
    const hasFailures = results.some(r => r.status === 'fail')
    const hasSlowTests = results.some(r => r.status === 'slow')
    
    const exitCode = hasFailures ? 2 : hasSlowTests ? 1 : 0
    process.exit(exitCode)

  } catch (error) {
    console.error('❌ Performance check failed:', error)
    process.exit(2)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}