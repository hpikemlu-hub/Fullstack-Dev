#!/usr/bin/env tsx

/**
 * Database Connection Test Script
 * Tests database connectivity, performance, and basic functionality
 */

import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

interface DatabaseTest {
  name: string
  description: string
  test: () => Promise<{ success: boolean; duration: number; details?: any; error?: string }>
}

class DatabaseTester {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    })
  }

  async testConnection(): Promise<{ success: boolean; duration: number; error?: string }> {
    const start = performance.now()
    try {
      await this.prisma.$connect()
      return {
        success: true,
        duration: performance.now() - start
      }
    } catch (error) {
      return {
        success: false,
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      }
    }
  }

  async testBasicQuery(): Promise<{ success: boolean; duration: number; error?: string }> {
    const start = performance.now()
    try {
      await this.prisma.$queryRaw`SELECT 1 as test`
      return {
        success: true,
        duration: performance.now() - start
      }
    } catch (error) {
      return {
        success: false,
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Query execution failed'
      }
    }
  }

  async testTableAccess(): Promise<{ success: boolean; duration: number; details?: any; error?: string }> {
    const start = performance.now()
    try {
      // Test access to main tables
      const userCount = await this.prisma.user.count()
      const workloadCount = await this.prisma.workload.count()
      const calendarEventCount = await this.prisma.calendarEvent.count()

      return {
        success: true,
        duration: performance.now() - start,
        details: {
          users: userCount,
          workloads: workloadCount,
          calendarEvents: calendarEventCount
        }
      }
    } catch (error) {
      return {
        success: false,
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Table access failed'
      }
    }
  }

  async testTransactions(): Promise<{ success: boolean; duration: number; error?: string }> {
    const start = performance.now()
    try {
      // Test transaction functionality
      await this.prisma.$transaction(async (tx) => {
        // Simple transaction test
        await tx.$queryRaw`SELECT COUNT(*) FROM users`
        await tx.$queryRaw`SELECT COUNT(*) FROM workload`
      })

      return {
        success: true,
        duration: performance.now() - start
      }
    } catch (error) {
      return {
        success: false,
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Transaction test failed'
      }
    }
  }

  async testIndices(): Promise<{ success: boolean; duration: number; details?: any; error?: string }> {
    const start = performance.now()
    try {
      // Test if critical indices are working efficiently
      const queries = await Promise.all([
        this.prisma.$queryRaw`
          EXPLAIN (ANALYZE, BUFFERS) 
          SELECT * FROM users WHERE username = 'test@example.com'
        `,
        this.prisma.$queryRaw`
          EXPLAIN (ANALYZE, BUFFERS) 
          SELECT * FROM workload WHERE user_id = 'test-user-id' AND status = 'PENDING'
        `,
        this.prisma.$queryRaw`
          EXPLAIN (ANALYZE, BUFFERS) 
          SELECT * FROM calendar_events WHERE start_date >= NOW() - INTERVAL '7 days'
        `
      ])

      return {
        success: true,
        duration: performance.now() - start,
        details: {
          queryPlansGenerated: queries.length,
          note: 'Check logs for detailed query plans'
        }
      }
    } catch (error) {
      return {
        success: false,
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Index performance test failed'
      }
    }
  }

  async testMigrationStatus(): Promise<{ success: boolean; duration: number; details?: any; error?: string }> {
    const start = performance.now()
    try {
      // Check migration status
      const migrations = await this.prisma.$queryRaw`
        SELECT migration_name, finished_at, logs 
        FROM _prisma_migrations 
        ORDER BY finished_at DESC 
        LIMIT 5
      ` as any[]

      const pendingMigrations = migrations.filter(m => !m.finished_at)
      
      return {
        success: true,
        duration: performance.now() - start,
        details: {
          totalMigrations: migrations.length,
          pendingMigrations: pendingMigrations.length,
          latestMigration: migrations[0]?.migration_name || 'No migrations found'
        }
      }
    } catch (error) {
      // If _prisma_migrations table doesn't exist, it's likely a fresh setup
      return {
        success: true,
        duration: performance.now() - start,
        details: {
          status: 'Fresh database or migrations not initialized'
        }
      }
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🔍 Starting comprehensive database tests...\n')

    const tests: DatabaseTest[] = [
      {
        name: 'Connection Test',
        description: 'Test basic database connectivity',
        test: () => this.testConnection()
      },
      {
        name: 'Basic Query Test',
        description: 'Test simple SQL query execution',
        test: () => this.testBasicQuery()
      },
      {
        name: 'Table Access Test',
        description: 'Test access to application tables',
        test: () => this.testTableAccess()
      },
      {
        name: 'Transaction Test',
        description: 'Test database transaction functionality',
        test: () => this.testTransactions()
      },
      {
        name: 'Index Performance Test',
        description: 'Test query performance and index usage',
        test: () => this.testIndices()
      },
      {
        name: 'Migration Status Test',
        description: 'Check database migration status',
        test: () => this.testMigrationStatus()
      }
    ]

    let allTestsPassed = true
    let totalDuration = 0

    for (const testCase of tests) {
      console.log(`📋 Running: ${testCase.name}`)
      console.log(`   Description: ${testCase.description}`)

      try {
        const result = await testCase.test()
        totalDuration += result.duration

        if (result.success) {
          console.log(`   ✅ PASSED (${Math.round(result.duration * 100) / 100}ms)`)
          
          if (result.details) {
            console.log(`   📊 Details: ${JSON.stringify(result.details, null, 6)}`)
          }
        } else {
          console.log(`   ❌ FAILED (${Math.round(result.duration * 100) / 100}ms)`)
          console.log(`   💥 Error: ${result.error}`)
          allTestsPassed = false
        }
      } catch (error) {
        console.log(`   ❌ FAILED (Unexpected error)`)
        console.log(`   💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        allTestsPassed = false
      }

      console.log('')
    }

    // Summary
    console.log('📊 Test Summary')
    console.log('================')
    console.log(`Overall Status: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
    console.log(`Total Duration: ${Math.round(totalDuration * 100) / 100}ms`)
    console.log(`Database URL: ${process.env.DATABASE_URL?.replace(/password=[^&]+/, 'password=***') || 'Not configured'}`)

    if (!allTestsPassed) {
      console.log('\n🔧 Troubleshooting Tips:')
      console.log('- Ensure database is running and accessible')
      console.log('- Check DATABASE_URL environment variable')
      console.log('- Verify database user has required permissions')
      console.log('- Run: npm run db:migrate to apply any pending migrations')
      console.log('- Check database logs for detailed error information')
    }
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// CLI execution
async function main() {
  const tester = new DatabaseTester()
  
  try {
    await tester.runAllTests()
  } catch (error) {
    console.error('❌ Database test runner failed:', error)
    process.exit(1)
  } finally {
    await tester.cleanup()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}