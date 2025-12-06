// Employees API Route
// Migrated from Supabase to Prisma with JWT authentication

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin, withCORS } from '@/lib/auth/middleware'
import { DatabaseOperations, prisma } from '@/lib/database/prisma'
import { AuthService } from '@/lib/auth/jwt'
import { z } from 'zod'

// GET /api/employees - Fetch all employees
export const GET = withCORS(
  requireAuth(async (request) => {
    try {
      const { searchParams } = new URL(request.url)
      const role = searchParams.get('role') as 'ADMIN' | 'USER' | null
      const active = searchParams.get('active')
      const search = searchParams.get('search')

      const filters: any = {}
      
      if (role) filters.role = role
      if (active !== null) filters.isActive = active === 'true'
      if (search) filters.search = search

      const employees = await DatabaseOperations.getUsers(filters)

      return NextResponse.json({
        success: true,
        data: employees,
        count: employees.length
      })

    } catch (error) {
      console.error('Employee fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch employees' },
        { status: 500 }
      )
    }
  })
)

// Validation schema for creating employees
const createEmployeeSchema = z.object({
  namaLengkap: z.string().min(1, 'Nama lengkap harus diisi'),
  nip: z.string().optional(),
  golongan: z.string().optional(),
  jabatan: z.string().optional(),
  username: z.string().min(1, 'Username harus diisi'),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
  isActive: z.boolean().default(true),
  password: z.string().min(6, 'Password minimal 6 karakter').optional()
})

// POST /api/employees - Create new employee
export const POST = withCORS(
  requireAdmin(async (request) => {
    try {
      const body = await request.json()
      const validatedData = createEmployeeSchema.parse(body)

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: validatedData.username }
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Username sudah digunakan' },
          { status: 400 }
        )
      }

      // Hash password (use default if not provided)
      const password = validatedData.password || 'HPSB2025!'
      const hashedPassword = await AuthService.hashPassword(password)

      // Prepare employee data
      const employeeData = {
        namaLengkap: validatedData.namaLengkap,
        nip: validatedData.role === 'ADMIN' ? null : validatedData.nip,
        golongan: validatedData.role === 'ADMIN' ? null : validatedData.golongan,
        jabatan: validatedData.role === 'ADMIN' ? null : validatedData.jabatan,
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        isActive: validatedData.isActive
      }

      const newEmployee = await prisma.user.create({
        data: employeeData,
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

      // Create audit log
      await DatabaseOperations.createAuditLog({
        userId: request.user?.userId,
        userName: request.user?.namaLengkap || 'System',
        action: 'CREATE',
        tableName: 'users',
        recordId: newEmployee.id,
        newValues: newEmployee,
        details: `Created new employee: ${newEmployee.namaLengkap}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      })

      return NextResponse.json({
        success: true,
        data: newEmployee,
        message: `Pegawai ${newEmployee.namaLengkap} berhasil ditambahkan`
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: error.issues[0]?.message || 'Validation error' },
          { status: 400 }
        )
      }

      console.error('Employee creation error:', error)
      return NextResponse.json(
        { success: false, error: 'Gagal membuat pegawai baru' },
        { status: 500 }
      )
    }
  })
)

// Handle OPTIONS for CORS
export const OPTIONS = withCORS(async () => {
  return new NextResponse(null, { status: 200 })
})