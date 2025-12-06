// Unified Fullstack Database Client
// Replaces Supabase client with Prisma

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty'
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database operation utilities
export class DatabaseOperations {
  
  // Users Management
  static async getUsers(filters?: {
    role?: 'ADMIN' | 'USER'
    isActive?: boolean
    search?: string
  }) {
    const where: any = {}
    
    if (filters?.role) where.role = filters.role
    if (filters?.isActive !== undefined) where.isActive = filters.isActive
    if (filters?.search) {
      where.OR = [
        { namaLengkap: { contains: filters.search, mode: 'insensitive' } },
        { nip: { contains: filters.search, mode: 'insensitive' } },
        { jabatan: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } }
      ]
    }
    
    return await prisma.user.findMany({
      where,
      select: {
        id: true,
        namaLengkap: true,
        nip: true,
        golongan: true,
        jabatan: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { namaLengkap: 'asc' }
    })
  }
  
  static async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        namaLengkap: true,
        nip: true,
        golongan: true,
        jabatan: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
  }
  
  static async getUserByCredentials(username: string) {
    return await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        isActive: true
      },
      select: {
        id: true,
        namaLengkap: true,
        username: true,
        email: true,
        password: true,
        role: true
      }
    })
  }
  
  // Workload Management
  static async getWorkloads(filters?: {
    userId?: string
    status?: 'DONE' | 'ON_PROGRESS' | 'PENDING'
    type?: string
    fungsi?: string
  }) {
    const where: any = {}
    
    if (filters?.userId) where.userId = filters.userId
    if (filters?.status) where.status = filters.status
    if (filters?.type) where.type = filters.type
    if (filters?.fungsi) where.fungsi = filters.fungsi
    
    return await prisma.workload.findMany({
      where,
      include: {
        user: {
          select: {
            namaLengkap: true,
            username: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { tglDiterima: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  }
  
  static async getWorkloadById(id: string) {
    return await prisma.workload.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            namaLengkap: true,
            username: true
          }
        }
      }
    })
  }
  
  // Calendar Events
  static async getCalendarEvents(filters?: {
    start?: Date
    end?: Date
    creatorId?: string
  }) {
    const where: any = {}
    
    if (filters?.creatorId) where.creatorId = filters.creatorId
    if (filters?.start || filters?.end) {
      where.OR = [
        {
          startDate: {
            ...(filters.start && { gte: filters.start }),
            ...(filters.end && { lte: filters.end })
          }
        },
        {
          endDate: {
            ...(filters.start && { gte: filters.start }),
            ...(filters.end && { lte: filters.end })
          }
        },
        ...(filters.start && filters.end ? [{
          AND: [
            { startDate: { lte: filters.start } },
            { endDate: { gte: filters.end } }
          ]
        }] : [])
      ]
    }
    
    return await prisma.calendarEvent.findMany({
      where,
      include: {
        creator: {
          select: {
            namaLengkap: true,
            username: true
          }
        }
      },
      orderBy: { startDate: 'asc' }
    })
  }
  
  // Dashboard Statistics
  static async getDashboardStats() {
    const [
      totalWorkload,
      doneWorkload,
      onProgressWorkload, 
      pendingWorkload,
      activeUsers,
      upcomingEvents
    ] = await Promise.all([
      prisma.workload.count(),
      prisma.workload.count({ where: { status: 'DONE' } }),
      prisma.workload.count({ where: { status: 'ON_PROGRESS' } }),
      prisma.workload.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.calendarEvent.count({
        where: {
          startDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          }
        }
      })
    ])
    
    // Weekly statistics
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    weekStart.setHours(0, 0, 0, 0)
    
    const prevWeekStart = new Date(weekStart)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
    
    const [weeklyTotal, weeklyDone, prevWeeklyTotal] = await Promise.all([
      prisma.workload.count({
        where: {
          tglDiterima: { gte: weekStart }
        }
      }),
      prisma.workload.count({
        where: {
          status: 'DONE',
          tglDiterima: { gte: weekStart }
        }
      }),
      prisma.workload.count({
        where: {
          tglDiterima: {
            gte: prevWeekStart,
            lt: weekStart
          }
        }
      })
    ])
    
    const completionRate = totalWorkload > 0 ? Math.round((doneWorkload / totalWorkload) * 100) : 0
    const efficiencyScore = weeklyTotal > 0 ? Math.round((weeklyDone / weeklyTotal) * 100) : 0
    const weeklyProductivityPercent = prevWeeklyTotal > 0 
      ? Math.round(((weeklyTotal - prevWeeklyTotal) / prevWeeklyTotal) * 100)
      : 0
    
    return {
      totals: {
        total: totalWorkload,
        doneTotal: doneWorkload,
        onProgressTotal: onProgressWorkload,
        pendingTotal: pendingWorkload
      },
      weekly: {
        weeklyTotal,
        weeklyDone,
        prevWeeklyTotal,
        weeklyProductivityPercent
      },
      rates: {
        completionRate,
        efficiencyScore
      },
      users: {
        activeUsers
      },
      events: {
        upcomingEvents
      }
    }
  }
  
  // Audit Logging
  static async createAuditLog(data: {
    userId?: string
    userName: string
    action: string
    tableName: string
    recordId?: string
    oldValues?: any
    newValues?: any
    details?: string
    ipAddress?: string
    userAgent?: string
  }) {
    return await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        tableName: data.tableName,
        recordId: data.recordId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    })
  }
}

// Connection health check
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'connected', message: 'Database connection successful' }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { status: 'error', message: 'Database connection failed' }
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect()
}