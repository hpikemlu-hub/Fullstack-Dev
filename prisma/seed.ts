// Database Seeding Script
// Creates initial data for development and testing

import { PrismaClient } from '@prisma/client'
import { AuthService } from '../lib/auth/jwt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await AuthService.hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      namaLengkap: 'Administrator',
      username: 'admin',
      email: 'admin@workload.dev',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true
    }
  })

  // Create sample users
  const userPassword = await AuthService.hashPassword('user123')
  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'ajeng.widianty' },
      update: {},
      create: {
        namaLengkap: 'Ajeng Widianty',
        nip: '198501012010032001',
        golongan: 'III/c',
        jabatan: 'Analis Kebijakan',
        username: 'ajeng.widianty',
        email: 'ajeng.widianty@workload.dev',
        password: userPassword,
        role: 'USER',
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { username: 'budi.santoso' },
      update: {},
      create: {
        namaLengkap: 'Budi Santoso',
        nip: '198601022011031002',
        golongan: 'III/b',
        jabatan: 'Pranata Humas',
        username: 'budi.santoso',
        email: 'budi.santoso@workload.dev',
        password: userPassword,
        role: 'USER',
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { username: 'siti.nurhaliza' },
      update: {},
      create: {
        namaLengkap: 'Siti Nurhaliza',
        nip: '199001012015032003',
        golongan: 'III/a',
        jabatan: 'Perencana',
        username: 'siti.nurhaliza',
        email: 'siti.nurhaliza@workload.dev',
        password: userPassword,
        role: 'USER',
        isActive: true
      }
    })
  ])

  console.log(`✅ Created ${users.length + 1} users`)

  // Create sample workloads
  const workloads = await Promise.all([
    prisma.workload.create({
      data: {
        userId: users[0].id,
        nama: 'Analisis Kebijakan Bilateral Indonesia-Malaysia',
        type: 'Analisis',
        deskripsi: 'Melakukan analisis mendalam terhadap kebijakan bilateral antara Indonesia dan Malaysia',
        status: 'ON_PROGRESS',
        tglDiterima: new Date('2024-01-15'),
        tglDeadline: new Date('2024-02-28'),
        fungsi: 'Politik',
        priority: 'HIGH',
        estimatedHours: 80
      }
    }),
    prisma.workload.create({
      data: {
        userId: users[1].id,
        nama: 'Penyusunan Press Release ASEAN Summit',
        type: 'Media Relations',
        deskripsi: 'Menyusun dan mengedit press release untuk ASEAN Summit 2024',
        status: 'PENDING',
        tglDiterima: new Date('2024-01-20'),
        tglDeadline: new Date('2024-02-15'),
        fungsi: 'Komunikasi',
        priority: 'MEDIUM',
        estimatedHours: 16
      }
    }),
    prisma.workload.create({
      data: {
        userId: users[2].id,
        nama: 'Perencanaan Anggaran Direktorat 2024',
        type: 'Perencanaan',
        deskripsi: 'Menyusun rencana anggaran direktorat untuk tahun 2024',
        status: 'DONE',
        tglDiterima: new Date('2024-01-01'),
        tglDeadline: new Date('2024-01-31'),
        fungsi: 'Administrasi',
        priority: 'HIGH',
        estimatedHours: 40,
        actualHours: 35
      }
    })
  ])

  console.log(`✅ Created ${workloads.length} workloads`)

  // Create sample calendar events
  const events = await Promise.all([
    prisma.calendarEvent.create({
      data: {
        creatorId: admin.id,
        title: 'Rapat Koordinasi Bulanan',
        description: 'Rapat koordinasi rutin untuk evaluasi kinerja dan perencanaan',
        participants: JSON.stringify(['admin', 'ajeng.widianty', 'budi.santoso', 'siti.nurhaliza']),
        location: 'Ruang Rapat Direktorat',
        startDate: new Date('2024-02-01T09:00:00'),
        endDate: new Date('2024-02-01T11:00:00'),
        color: '#0d6efd'
      }
    }),
    prisma.calendarEvent.create({
      data: {
        creatorId: users[0].id,
        title: 'Pertemuan dengan Delegasi Malaysia',
        description: 'Diskusi kebijakan bilateral Indonesia-Malaysia',
        participants: JSON.stringify(['ajeng.widianty', 'budi.santoso']),
        location: 'Gedung Pancasila',
        dipa: 'DIPA-001/2024',
        startDate: new Date('2024-02-05T14:00:00'),
        endDate: new Date('2024-02-05T16:00:00'),
        color: '#28a745'
      }
    }),
    prisma.calendarEvent.create({
      data: {
        creatorId: users[1].id,
        title: 'Konferensi Pers ASEAN Summit',
        description: 'Konferensi pers persiapan ASEAN Summit 2024',
        participants: JSON.stringify(['budi.santoso', 'admin']),
        location: 'Media Center Kemlu',
        startDate: new Date('2024-02-10T10:00:00'),
        endDate: new Date('2024-02-10T12:00:00'),
        color: '#dc3545'
      }
    })
  ])

  console.log(`✅ Created ${events.length} calendar events`)

  // Create settings
  const settings = await Promise.all([
    prisma.settings.upsert({
      where: { key: 'app_name' },
      update: {},
      create: {
        key: 'app_name',
        value: 'Workload Management System',
        description: 'Application name'
      }
    }),
    prisma.settings.upsert({
      where: { key: 'app_version' },
      update: {},
      create: {
        key: 'app_version',
        value: JSON.stringify('2.0.0'),
        description: 'Application version'
      }
    }),
    prisma.settings.upsert({
      where: { key: 'max_file_size' },
      update: {},
      create: {
        key: 'max_file_size',
        value: JSON.stringify(10485760),
        description: 'Maximum file upload size in bytes (10MB)'
      }
    }),
    prisma.settings.upsert({
      where: { key: 'allowed_file_types' },
      update: {},
      create: {
        key: 'allowed_file_types',
        value: JSON.stringify(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']),
        description: 'Allowed file upload types'
      }
    }),
    prisma.settings.upsert({
      where: { key: 'default_workload_priority' },
      update: {},
      create: {
        key: 'default_workload_priority',
        value: JSON.stringify('MEDIUM'),
        description: 'Default priority for new workloads'
      }
    })
  ])

  console.log(`✅ Created ${settings.length} settings`)

  // Create sample audit logs
  const auditLogs = await Promise.all([
    prisma.auditLog.create({
      data: {
        userId: admin.id,
        userName: 'Administrator',
        action: 'CREATE',
        tableName: 'users',
        recordId: users[0].id,
        newValues: JSON.stringify({ namaLengkap: users[0].namaLengkap, role: users[0].role }),
        details: 'Created new user account',
        ipAddress: '127.0.0.1',
        userAgent: 'System Seeder'
      }
    }),
    prisma.auditLog.create({
      data: {
        userId: users[0].id,
        userName: users[0].namaLengkap,
        action: 'CREATE',
        tableName: 'workload',
        recordId: workloads[0].id,
        newValues: JSON.stringify({ nama: workloads[0].nama, status: workloads[0].status }),
        details: 'Created new workload',
        ipAddress: '127.0.0.1',
        userAgent: 'System Seeder'
      }
    })
  ])

  console.log(`✅ Created ${auditLogs.length} audit logs`)

  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\nCreated:')
  console.log(`- 1 admin user (username: admin, password: admin123)`)
  console.log(`- ${users.length} regular users (password: user123)`)
  console.log(`- ${workloads.length} sample workloads`)
  console.log(`- ${events.length} calendar events`)
  console.log(`- ${settings.length} application settings`)
  console.log(`- ${auditLogs.length} audit log entries`)
  console.log('\nYou can now start the application with: npm run dev')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })