import { FullConfig } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...')

  // Clean up test database
  const prisma = new PrismaClient({
    datasourceProvider: 'postgresql',
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      }
    }
  })

  try {
    // Clean up test data (optional - keep for debugging)
    if (process.env.CLEAN_TEST_DATA === 'true') {
      await prisma.$executeRaw`TRUNCATE TABLE users, workload, calendar_events RESTART IDENTITY CASCADE`
      console.log('✅ Test data cleaned up')
    }
  } catch (error) {
    console.warn('⚠️ Warning: Could not clean test data:', error)
  } finally {
    await prisma.$disconnect()
  }

  // Clean up auth files
  try {
    if (fs.existsSync('tests/auth/user.json')) {
      fs.unlinkSync('tests/auth/user.json')
    }
    if (fs.existsSync('tests/auth/admin.json')) {
      fs.unlinkSync('tests/auth/admin.json')
    }
    console.log('✅ Auth files cleaned up')
  } catch (error) {
    console.warn('⚠️ Warning: Could not clean auth files:', error)
  }

  console.log('✅ Global teardown completed')
}

export default globalTeardown