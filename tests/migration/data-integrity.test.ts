import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Data Migration Validation', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('should validate user data migration integrity', async () => {
    // Check that all users have required fields
    const usersWithMissingData = await prisma.user.findMany({
      where: {
        OR: [
          { namaLengkap: null },
          { username: null },
          { password: null },
        ]
      }
    })
    
    expect(usersWithMissingData).toHaveLength(0)
    
    // Check unique constraints
    const usernames = await prisma.user.findMany({
      select: { username: true }
    })
    
    const uniqueUsernames = new Set(usernames.map(u => u.username))
    expect(uniqueUsernames.size).toBe(usernames.length)
  })

  test('should validate workload data migration integrity', async () => {
    // Check workload data completeness
    const workloadsWithMissingData = await prisma.workload.findMany({
      where: {
        OR: [
          { nama: null },
          { user_id: null },
          { status: null },
          { tgl_deadline: null },
        ]
      }
    })
    
    expect(workloadsWithMissingData).toHaveLength(0)
    
    // Check foreign key relationships
    const workloadsWithInvalidUsers = await prisma.workload.findMany({
      where: {
        user: null
      }
    })
    
    expect(workloadsWithInvalidUsers).toHaveLength(0)
  })

  test('should validate calendar events migration integrity', async () => {
    // Check calendar events data completeness
    const eventsWithMissingData = await prisma.calendar_events.findMany({
      where: {
        OR: [
          { title: null },
          { start_date: null },
          { end_date: null },
          { created_by: null },
        ]
      }
    })
    
    expect(eventsWithMissingData).toHaveLength(0)
    
    // Check date consistency
    const eventsWithInvalidDates = await prisma.calendar_events.findMany({
      where: {
        start_date: {
          gt: prisma.calendar_events.fields.end_date
        }
      }
    })
    
    expect(eventsWithInvalidDates).toHaveLength(0)
  })

  test('should validate audit log migration integrity', async () => {
    // Check audit logs exist for critical operations
    const auditLogs = await prisma.audit_log.findMany()
    
    // Should have some audit logs from test setup
    expect(auditLogs.length).toBeGreaterThan(0)
    
    // Check audit log data completeness
    const logsWithMissingData = await prisma.audit_log.findMany({
      where: {
        OR: [
          { action: null },
          { table_name: null },
          { user_name: null },
          { timestamp: null },
        ]
      }
    })
    
    expect(logsWithMissingData).toHaveLength(0)
  })

  test('should validate business trip todo relationships', async () => {
    // Check calendar_todos relationships
    const invalidTodoRelationships = await prisma.calendar_todos.findMany({
      where: {
        OR: [
          { calendar_event_id: null },
          { workload_id: null },
        ]
      }
    })
    
    expect(invalidTodoRelationships).toHaveLength(0)
    
    // Check that business trips have valid todo links
    const businessTrips = await prisma.calendar_events.findMany({
      where: { is_business_trip: true },
      include: { calendar_todos: true }
    })
    
    // Business trips should have associated todos (if any exist)
    businessTrips.forEach(trip => {
      if (trip.calendar_todos.length > 0) {
        trip.calendar_todos.forEach(todo => {
          expect(todo.calendar_event_id).toBe(trip.id)
          expect(todo.workload_id).toBeTruthy()
        })
      }
    })
  })

  test('should validate data type consistency', async () => {
    // Check boolean fields
    const users = await prisma.user.findMany({
      select: { isActive: true }
    })
    
    users.forEach(user => {
      expect(typeof user.isActive).toBe('boolean')
    })
    
    // Check enum values
    const workloads = await prisma.workload.findMany({
      select: { status: true }
    })
    
    const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']
    workloads.forEach(workload => {
      expect(validStatuses).toContain(workload.status)
    })
    
    const usersWithRoles = await prisma.user.findMany({
      select: { role: true }
    })
    
    const validRoles = ['USER', 'ADMIN']
    usersWithRoles.forEach(user => {
      expect(validRoles).toContain(user.role)
    })
  })

  test('should validate timestamp consistency', async () => {
    // Check that created_at is before updated_at
    const usersWithInvalidTimestamps = await prisma.user.findMany({
      where: {
        createdAt: {
          gt: prisma.user.fields.updatedAt
        }
      }
    })
    
    expect(usersWithInvalidTimestamps).toHaveLength(0)
    
    // Check that timestamps are reasonable (not in future, not too old)
    const now = new Date()
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    
    const usersWithFutureTimestamps = await prisma.user.findMany({
      where: {
        createdAt: {
          gt: now
        }
      }
    })
    
    expect(usersWithFutureTimestamps).toHaveLength(0)
  })

  test('should validate database constraints and indexes', async () => {
    // Test unique constraint on usernames
    try {
      await prisma.user.create({
        data: {
          namaLengkap: 'Duplicate Test',
          username: 'testuser', // This should fail due to unique constraint
          password: 'hashedpassword',
          role: 'USER',
        }
      })
      
      // If we get here, the unique constraint is not working
      fail('Username unique constraint is not working')
    } catch (error: any) {
      expect(error.code).toBe('P2002') // Prisma unique constraint violation
    }
  })

  test('should validate cascading delete behavior', async () => {
    // Create a test user with workloads
    const testUser = await prisma.user.create({
      data: {
        namaLengkap: 'Cascade Test User',
        username: 'cascadetest',
        password: 'hashedpassword',
        role: 'USER',
      }
    })
    
    const testWorkload = await prisma.workload.create({
      data: {
        nama: 'Cascade Test Workload',
        deskripsi: 'Test workload for cascade delete',
        user_id: testUser.id,
        status: 'TODO',
        tgl_deadline: new Date('2024-12-31'),
        estimasi_jam: 8,
      }
    })
    
    // Delete user should handle workloads appropriately
    await prisma.user.delete({
      where: { id: testUser.id }
    })
    
    // Check that workload handling follows business rules
    const orphanedWorkload = await prisma.workload.findUnique({
      where: { id: testWorkload.id }
    })
    
    // Depending on business rules, workload might be:
    // 1. Deleted (cascade delete)
    // 2. Assigned to another user
    // 3. Marked as unassigned
    // This test should match your actual business logic
    expect(orphanedWorkload).toBeNull() // Assuming cascade delete
  })

  test('should validate data consistency across relationships', async () => {
    // Check workload assignments are valid
    const workloadsWithUsers = await prisma.workload.findMany({
      include: { user: true }
    })
    
    workloadsWithUsers.forEach(workload => {
      expect(workload.user).toBeTruthy()
      expect(workload.user.isActive).toBe(true) // Active users only
    })
    
    // Check calendar event creators exist
    const eventsWithCreators = await prisma.calendar_events.findMany({
      include: { creator: true }
    })
    
    eventsWithCreators.forEach(event => {
      expect(event.creator).toBeTruthy()
    })
    
    // Check event participants are valid users
    const participantsWithUsers = await prisma.event_participants.findMany({
      include: { user: true }
    })
    
    participantsWithUsers.forEach(participant => {
      expect(participant.user).toBeTruthy()
      expect(participant.user.isActive).toBe(true)
    })
  })

  test('should validate performance after migration', async () => {
    // Test query performance on large datasets
    const startTime = performance.now()
    
    const result = await prisma.user.findMany({
      include: {
        workloads: {
          take: 10
        }
      },
      take: 100
    })
    
    const endTime = performance.now()
    const queryTime = endTime - startTime
    
    console.log(`Query took ${queryTime}ms`)
    expect(queryTime).toBeLessThan(1000) // Should complete within 1 second
    expect(result.length).toBeGreaterThan(0)
  })
})