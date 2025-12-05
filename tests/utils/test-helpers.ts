import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Test database utilities
export class TestDatabase {
  private static prisma: PrismaClient

  static getInstance() {
    if (!this.prisma) {
      this.prisma = new PrismaClient({
        datasourceProvider: 'postgresql',
        datasources: {
          db: {
            url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
          }
        }
      })
    }
    return this.prisma
  }

  static async cleanup() {
    const prisma = this.getInstance()
    
    // Clean up in reverse dependency order
    await prisma.audit_log.deleteMany()
    await prisma.calendar_todos.deleteMany()
    await prisma.event_participants.deleteMany()
    await prisma.calendar_events.deleteMany()
    await prisma.workload.deleteMany()
    await prisma.user.deleteMany()
    
    await prisma.$disconnect()
  }

  static async seed() {
    const prisma = this.getInstance()
    
    // Create test users
    const testUser = await prisma.user.create({
      data: {
        id: 'test-user-id',
        namaLengkap: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        role: 'USER',
        isActive: true,
        nip: '123456789',
        golongan: 'III/a',
        jabatan: 'Staff'
      }
    })

    const testAdmin = await prisma.user.create({
      data: {
        id: 'test-admin-id',
        namaLengkap: 'Test Admin',
        username: 'testadmin',
        email: 'admin@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        role: 'ADMIN',
        isActive: true,
      }
    })

    // Create test workloads
    await prisma.workload.createMany({
      data: [
        {
          id: 'test-workload-1',
          nama: 'Test Workload 1',
          deskripsi: 'Testing workload description',
          user_id: testUser.id,
          status: 'TODO',
          tgl_mulai: new Date('2024-01-15'),
          tgl_deadline: new Date('2024-01-25'),
          estimasi_jam: 8
        },
        {
          id: 'test-workload-2',
          nama: 'Test Workload 2',
          deskripsi: 'Another test workload',
          user_id: testUser.id,
          status: 'IN_PROGRESS',
          tgl_mulai: new Date('2024-01-20'),
          tgl_deadline: new Date('2024-01-30'),
          estimasi_jam: 16
        }
      ]
    })

    // Create test calendar events
    await prisma.calendar_events.createMany({
      data: [
        {
          id: 'test-event-1',
          title: 'Test Meeting',
          start_date: new Date('2024-02-01T09:00:00Z'),
          end_date: new Date('2024-02-01T10:00:00Z'),
          description: 'Test meeting description',
          location: 'Conference Room A',
          is_business_trip: false,
          created_by: testUser.id
        },
        {
          id: 'test-event-2',
          title: 'Test Business Trip',
          start_date: new Date('2024-02-05T08:00:00Z'),
          end_date: new Date('2024-02-07T17:00:00Z'),
          description: 'Test business trip',
          location: 'Jakarta',
          is_business_trip: true,
          created_by: testUser.id
        }
      ]
    })

    return { testUser, testAdmin }
  }
}

// API testing utilities
export class APITestHelper {
  static createMockRequest(
    url: string, 
    method: string = 'GET', 
    body?: any, 
    user?: any
  ): NextRequest {
    const request = new NextRequest(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (user) {
      // Mock authenticated user
      ;(request as any).user = user
    }

    return request
  }

  static async extractResponseData(response: NextResponse) {
    const data = await response.json()
    return {
      status: response.status,
      data
    }
  }
}

// Mock data generators
export class MockDataGenerator {
  static user(overrides: Partial<any> = {}) {
    return {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      namaLengkap: 'Test User',
      username: `testuser${Math.random().toString(36).substr(2, 6)}`,
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'USER',
      isActive: true,
      nip: '123456789',
      golongan: 'III/a',
      jabatan: 'Staff',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }
  }

  static workload(overrides: Partial<any> = {}) {
    return {
      id: `workload-${Math.random().toString(36).substr(2, 9)}`,
      nama: 'Test Workload',
      deskripsi: 'Test workload description',
      user_id: 'test-user-id',
      status: 'TODO',
      tgl_mulai: new Date(),
      tgl_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      estimasi_jam: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }
  }

  static calendarEvent(overrides: Partial<any> = {}) {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    const end = new Date(start.getTime() + 60 * 60 * 1000) // 1 hour later

    return {
      id: `event-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Test Event',
      start_date: start,
      end_date: end,
      description: 'Test event description',
      location: 'Test Location',
      is_business_trip: false,
      created_by: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  static async measureTime<T>(
    operation: () => Promise<T>,
    name: string
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    const result = await operation()
    const end = performance.now()
    const duration = end - start

    console.log(`${name} took ${duration}ms`)
    return { result, duration }
  }

  static createTimeoutAssertion(maxTime: number, operation: string) {
    return (actualTime: number) => {
      if (actualTime > maxTime) {
        throw new Error(
          `${operation} took ${actualTime}ms, which exceeds the maximum of ${maxTime}ms`
        )
      }
    }
  }
}

// Test environment utilities
export class TestEnvironment {
  static isCI() {
    return process.env.CI === 'true'
  }

  static isDevelopment() {
    return process.env.NODE_ENV === 'development'
  }

  static getTimeouts() {
    // Longer timeouts in CI environment
    return {
      short: this.isCI() ? 10000 : 5000,
      medium: this.isCI() ? 30000 : 15000,
      long: this.isCI() ? 60000 : 30000,
    }
  }

  static skipIfCI(reason: string = 'Test skipped in CI environment') {
    return this.isCI() ? { skip: reason } : {}
  }

  static skipIfNotCI(reason: string = 'Test only runs in CI environment') {
    return !this.isCI() ? { skip: reason } : {}
  }
}

// Authentication utilities for testing
export class AuthTestHelper {
  static mockAdminUser() {
    return {
      userId: 'test-admin-id',
      namaLengkap: 'Test Admin',
      username: 'testadmin',
      role: 'ADMIN',
      isActive: true,
    }
  }

  static mockRegularUser() {
    return {
      userId: 'test-user-id',
      namaLengkap: 'Test User',
      username: 'testuser',
      role: 'USER',
      isActive: true,
    }
  }

  static createAuthenticatedRequest(
    url: string,
    user: any,
    method: string = 'GET',
    body?: any
  ) {
    const request = APITestHelper.createMockRequest(url, method, body)
    ;(request as any).user = user
    return request
  }
}

// Visual testing utilities
export class VisualTestHelper {
  static getScreenshotOptions(name: string) {
    return {
      mode: 'css' as const,
      fullPage: true,
      clip: undefined,
      animations: 'disabled' as const,
      caret: 'hide' as const,
      scale: 'css' as const,
      threshold: 0.1,
      maxDiffPixels: 1000,
    }
  }

  static async waitForStableContent(page: any, timeout: number = 5000) {
    // Wait for network to be idle
    await page.waitForLoadState('networkidle')
    
    // Wait for any loading indicators to disappear
    const loadingSelector = '[data-testid="loading"], [aria-label="Loading"]'
    try {
      await page.waitForSelector(loadingSelector, { state: 'hidden', timeout: 2000 })
    } catch {
      // Loading indicator might not exist, which is fine
    }

    // Wait for dynamic content to stabilize
    await page.waitForTimeout(1000)
  }
}

// Error handling utilities
export class ErrorTestHelper {
  static async expectToThrow(
    operation: () => Promise<any>,
    expectedError?: string | RegExp
  ) {
    try {
      await operation()
      throw new Error('Expected operation to throw, but it did not')
    } catch (error: any) {
      if (expectedError) {
        if (typeof expectedError === 'string') {
          expect(error.message).toContain(expectedError)
        } else {
          expect(error.message).toMatch(expectedError)
        }
      }
      return error
    }
  }

  static createMockError(message: string, code?: string) {
    const error = new Error(message) as any
    if (code) {
      error.code = code
    }
    return error
  }
}