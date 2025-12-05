import { GET, POST } from '@/app/api/employees/route'
import { NextRequest } from 'next/server'
import { AuthService } from '@/lib/auth/jwt'

// Mock dependencies
jest.mock('@/lib/auth/middleware', () => ({
  requireAuth: (handler: Function) => handler,
  requireAdmin: (handler: Function) => handler,
  withCORS: (handler: Function) => handler,
}))

jest.mock('@/lib/database/prisma', () => ({
  DatabaseOperations: {
    getUsers: jest.fn(),
    createAuditLog: jest.fn(),
  },
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth/jwt', () => ({
  AuthService: {
    hashPassword: jest.fn(),
  },
}))

describe('/api/employees', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/employees', () => {
    it('should return all employees successfully', async () => {
      const mockEmployees = [
        {
          id: '1',
          namaLengkap: 'John Doe',
          username: 'johndoe',
          role: 'USER',
          isActive: true,
        },
      ]

      const { DatabaseOperations } = require('@/lib/database/prisma')
      DatabaseOperations.getUsers.mockResolvedValue(mockEmployees)

      const request = new NextRequest('http://localhost:3000/api/employees')
      request.user = { userId: 'test-user', role: 'ADMIN' }

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockEmployees)
      expect(data.count).toBe(1)
    })

    it('should handle filtering by role', async () => {
      const mockAdmins = [
        {
          id: '1',
          namaLengkap: 'Admin User',
          username: 'admin',
          role: 'ADMIN',
          isActive: true,
        },
      ]

      const { DatabaseOperations } = require('@/lib/database/prisma')
      DatabaseOperations.getUsers.mockResolvedValue(mockAdmins)

      const request = new NextRequest('http://localhost:3000/api/employees?role=ADMIN')
      request.user = { userId: 'test-user', role: 'ADMIN' }

      const response = await GET(request)
      const data = await response.json()

      expect(DatabaseOperations.getUsers).toHaveBeenCalledWith({
        role: 'ADMIN',
      })
      expect(data.data).toEqual(mockAdmins)
    })

    it('should handle search filtering', async () => {
      const { DatabaseOperations } = require('@/lib/database/prisma')
      DatabaseOperations.getUsers.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/employees?search=John')
      request.user = { userId: 'test-user', role: 'ADMIN' }

      await GET(request)

      expect(DatabaseOperations.getUsers).toHaveBeenCalledWith({
        search: 'John',
      })
    })

    it('should handle database errors gracefully', async () => {
      const { DatabaseOperations } = require('@/lib/database/prisma')
      DatabaseOperations.getUsers.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/employees')
      request.user = { userId: 'test-user', role: 'ADMIN' }

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch employees')
    })
  })

  describe('POST /api/employees', () => {
    it('should create new employee successfully', async () => {
      const mockHashedPassword = 'hashed-password'
      const mockNewEmployee = {
        id: '2',
        namaLengkap: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        role: 'USER',
        isActive: true,
        nip: '123456',
        golongan: 'III/a',
        jabatan: 'Staff',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      AuthService.hashPassword.mockResolvedValue(mockHashedPassword)

      const { prisma, DatabaseOperations } = require('@/lib/database/prisma')
      prisma.user.findUnique.mockResolvedValue(null) // Username doesn't exist
      prisma.user.create.mockResolvedValue(mockNewEmployee)
      DatabaseOperations.createAuditLog.mockResolvedValue(undefined)

      const requestBody = {
        namaLengkap: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        nip: '123456',
        golongan: 'III/a',
        jabatan: 'Staff',
        password: 'password123',
      }

      const request = new NextRequest('http://localhost:3000/api/employees', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      request.user = { userId: 'admin-user', namaLengkap: 'Admin User' }

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockNewEmployee)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          namaLengkap: 'Jane Smith',
          username: 'janesmith',
          password: mockHashedPassword,
        }),
        select: expect.any(Object),
      })
    })

    it('should validate required fields', async () => {
      const requestBody = {
        // Missing required fields
      }

      const request = new NextRequest('http://localhost:3000/api/employees', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      request.user = { userId: 'admin-user', namaLengkap: 'Admin User' }

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })

    it('should reject duplicate usernames', async () => {
      const { prisma } = require('@/lib/database/prisma')
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' }) // Username exists

      const requestBody = {
        namaLengkap: 'Jane Smith',
        username: 'existinguser',
        password: 'password123',
      }

      const request = new NextRequest('http://localhost:3000/api/employees', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      request.user = { userId: 'admin-user', namaLengkap: 'Admin User' }

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Username sudah digunakan')
    })

    it('should use default password when not provided', async () => {
      const mockHashedPassword = 'hashed-default-password'
      const mockNewEmployee = {
        id: '2',
        namaLengkap: 'Jane Smith',
        username: 'janesmith',
        role: 'USER',
        isActive: true,
      }

      AuthService.hashPassword.mockResolvedValue(mockHashedPassword)

      const { prisma, DatabaseOperations } = require('@/lib/database/prisma')
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue(mockNewEmployee)
      DatabaseOperations.createAuditLog.mockResolvedValue(undefined)

      const requestBody = {
        namaLengkap: 'Jane Smith',
        username: 'janesmith',
        // No password provided
      }

      const request = new NextRequest('http://localhost:3000/api/employees', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      request.user = { userId: 'admin-user', namaLengkap: 'Admin User' }

      await POST(request)

      expect(AuthService.hashPassword).toHaveBeenCalledWith('HPSB2025!')
    })

    it('should handle database creation errors', async () => {
      const { prisma } = require('@/lib/database/prisma')
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        namaLengkap: 'Jane Smith',
        username: 'janesmith',
        password: 'password123',
      }

      const request = new NextRequest('http://localhost:3000/api/employees', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      request.user = { userId: 'admin-user', namaLengkap: 'Admin User' }

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Gagal membuat pegawai baru')
    })
  })
})