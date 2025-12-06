import { chromium, FullConfig } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...')
  
  // Initialize test database
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      }
    }
  })

  try {
    // Clean and setup test data
    await prisma.$executeRaw`TRUNCATE TABLE users, workload, calendar_events RESTART IDENTITY CASCADE`
    
    // Create test users
    const testUsers = [
      {
        id: 'test-user-id',
        namaLengkap: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
        role: 'USER' as const,
        isActive: true,
        nip: '123456789',
        golongan: 'III/a',
        jabatan: 'Staff'
      },
      {
        id: 'test-admin-id', 
        namaLengkap: 'Test Admin',
        username: 'testadmin',
        email: 'admin@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
        role: 'ADMIN' as const,
        isActive: true,
      }
    ]

    for (const user of testUsers) {
      await prisma.user.upsert({
        where: { username: user.username },
        update: user,
        create: user
      })
    }

    // Create sample workload data
    await prisma.workload.createMany({
      data: [
        {
          id: 'test-workload-1',
          nama: 'Test Workload 1',
          type: 'ADMIN',
          deskripsi: 'Testing workload description',
          userId: 'test-user-id',
          status: 'PENDING',
          tglDiterima: new Date('2024-01-15'),
          tglDeadline: new Date('2024-01-25'),
          estimatedHours: 8
        },
        {
          id: 'test-workload-2',
          nama: 'Test Workload 2',
          type: 'ADMIN', 
          deskripsi: 'Another test workload',
          userId: 'test-user-id',
          status: 'PENDING',
          tglDiterima: new Date('2024-01-20'),
          tglDeadline: new Date('2024-01-30'),
          estimatedHours: 16
        }
      ]
    })

    // Create sample calendar events
    await prisma.calendarEvent.createMany({
      data: [
        {
          id: 'test-event-1',
          title: 'Test Meeting',
          startDate: new Date('2024-02-01T09:00:00Z'),
          endDate: new Date('2024-02-01T10:00:00Z'),
          description: 'Test meeting description',
          location: 'Conference Room A',
          creatorId: 'test-user-id'
        },
        {
          id: 'test-event-2',
          title: 'Test Business Trip',
          startDate: new Date('2024-02-05T08:00:00Z'),
          endDate: new Date('2024-02-07T17:00:00Z'),
          description: 'Test business trip',
          location: 'Jakarta',
          creatorId: 'test-user-id'
        }
      ]
    })

    console.log('✅ Test data setup completed')
  } catch (error) {
    console.error('❌ Error setting up test data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }

  // Setup authentication states
  const browser = await chromium.launch()
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

  // User authentication
  const userContext = await browser.newContext({ baseURL })
  const userPage = await userContext.newPage()
  await userPage.goto('/auth/login')
  await userPage.fill('[data-testid="username"]', 'testuser')
  await userPage.fill('[data-testid="password"]', 'password')
  await userPage.click('[data-testid="login-button"]')
  await userPage.waitForURL('/dashboard')
  await userContext.storageState({ path: 'tests/auth/user.json' })
  await userContext.close()

  // Admin authentication
  const adminContext = await browser.newContext({ baseURL })
  const adminPage = await adminContext.newPage()
  await adminPage.goto('/auth/login')
  await adminPage.fill('[data-testid="username"]', 'testadmin')
  await adminPage.fill('[data-testid="password"]', 'password')
  await adminPage.click('[data-testid="login-button"]')
  await adminPage.waitForURL('/dashboard')
  await adminContext.storageState({ path: 'tests/auth/admin.json' })
  await adminContext.close()

  await browser.close()
  
  console.log('✅ Global setup completed successfully')
}

export default globalSetup