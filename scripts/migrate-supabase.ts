#!/usr/bin/env tsx
// Supabase to PostgreSQL Migration Script
// Migrates all data from current Supabase instance to new PostgreSQL database

import { createClient } from '@supabase/supabase-js'
import { prisma } from '../lib/database/prisma'
import { AuthService } from '../lib/auth/jwt'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '../.env.local' })
dotenv.config({ path: '.env.local' })

// Supabase connection (from existing app)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface MigrationStats {
  users: { total: number; migrated: number; errors: number }
  workloads: { total: number; migrated: number; errors: number }
  calendarEvents: { total: number; migrated: number; errors: number }
  auditLogs: { total: number; migrated: number; errors: number }
  eKinerja: { total: number; migrated: number; errors: number }
}

class SupabaseMigration {
  private stats: MigrationStats = {
    users: { total: 0, migrated: 0, errors: 0 },
    workloads: { total: 0, migrated: 0, errors: 0 },
    calendarEvents: { total: 0, migrated: 0, errors: 0 },
    auditLogs: { total: 0, migrated: 0, errors: 0 },
    eKinerja: { total: 0, migrated: 0, errors: 0 }
  }

  async run(dryRun: boolean = false) {
    console.log('🚀 Starting Supabase to PostgreSQL migration...')
    console.log(`📋 Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`)
    console.log('=' * 60)

    try {
      // Check connections
      await this.checkConnections()

      if (!dryRun) {
        // Clear existing data (for fresh migration)
        await this.clearExistingData()
      }

      // Migrate in order (respecting foreign key dependencies)
      await this.migrateUsers(dryRun)
      await this.migrateWorkloads(dryRun)
      await this.migrateCalendarEvents(dryRun)
      await this.migrateAuditLogs(dryRun)
      await this.migrateEKinerja(dryRun)

      // Post-migration tasks
      if (!dryRun) {
        await this.postMigrationTasks()
      }

      this.printSummary()

    } catch (error) {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  }

  async checkConnections() {
    console.log('🔍 Checking database connections...')

    // Check Supabase
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`)
    }

    // Check PostgreSQL
    await prisma.$queryRaw`SELECT 1`

    console.log('✅ Database connections verified')
  }

  async clearExistingData() {
    console.log('🧹 Clearing existing data...')
    
    await prisma.auditLog.deleteMany()
    await prisma.calendarEvent.deleteMany()
    await prisma.workload.deleteMany()
    await prisma.eKinerja.deleteMany()
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()
    
    console.log('✅ Existing data cleared')
  }

  async migrateUsers(dryRun: boolean) {
    console.log('👥 Migrating users...')

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    this.stats.users.total = users?.length || 0

    if (!users || users.length === 0) {
      console.log('⚠️  No users found to migrate')
      return
    }

    for (const user of users) {
      try {
        const userData = {
          id: user.id,
          namaLengkap: user.nama_lengkap,
          nip: user.nip,
          golongan: user.golongan,
          jabatan: user.jabatan,
          username: user.username,
          email: user.email,
          password: user.password || await AuthService.hashPassword('HPSB2025!'), // Default password
          role: user.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
          isActive: user.is_active ?? true,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at || user.created_at)
        }

        if (!dryRun) {
          await prisma.user.create({ data: userData })
        }

        this.stats.users.migrated++
        console.log(`  ✅ ${userData.namaLengkap} (${userData.username})`)

      } catch (error) {
        this.stats.users.errors++
        console.error(`  ❌ Failed to migrate user ${user.nama_lengkap}: ${error}`)
      }
    }
  }

  async migrateWorkloads(dryRun: boolean) {
    console.log('💼 Migrating workloads...')

    const { data: workloads, error } = await supabase
      .from('workload')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch workloads: ${error.message}`)
    }

    this.stats.workloads.total = workloads?.length || 0

    if (!workloads || workloads.length === 0) {
      console.log('⚠️  No workloads found to migrate')
      return
    }

    for (const workload of workloads) {
      try {
        // Map status values
        let status: 'DONE' | 'ON_PROGRESS' | 'PENDING' = 'PENDING'
        if (workload.status === 'done') status = 'DONE'
        else if (workload.status === 'on-progress') status = 'ON_PROGRESS'

        const workloadData = {
          id: workload.id,
          userId: workload.user_id,
          nama: workload.nama,
          type: workload.type,
          deskripsi: workload.deskripsi,
          status,
          tglDiterima: workload.tgl_diterima ? new Date(workload.tgl_diterima) : null,
          tglDeadline: workload.tgl_deadline ? new Date(workload.tgl_deadline) : null,
          fungsi: workload.fungsi,
          priority: 'MEDIUM', // Default priority for existing data
          createdAt: new Date(workload.created_at),
          updatedAt: new Date(workload.updated_at || workload.created_at)
        }

        if (!dryRun) {
          await prisma.workload.create({ data: workloadData })
        }

        this.stats.workloads.migrated++
        console.log(`  ✅ ${workloadData.nama} (${workloadData.type})`)

      } catch (error) {
        this.stats.workloads.errors++
        console.error(`  ❌ Failed to migrate workload ${workload.nama}: ${error}`)
      }
    }
  }

  async migrateCalendarEvents(dryRun: boolean) {
    console.log('📅 Migrating calendar events...')

    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch calendar events: ${error.message}`)
    }

    this.stats.calendarEvents.total = events?.length || 0

    if (!events || events.length === 0) {
      console.log('⚠️  No calendar events found to migrate')
      return
    }

    for (const event of events) {
      try {
        const eventData = {
          id: event.id,
          creatorId: event.creator_id,
          title: event.title,
          description: event.description,
          participants: event.participants || [],
          location: event.location,
          dipa: event.dipa,
          startDate: new Date(event.start_date),
          endDate: new Date(event.end_date),
          color: event.color || '#0d6efd',
          isCompleted: event.is_completed || false,
          completedAt: event.completed_at ? new Date(event.completed_at) : null,
          createdAt: new Date(event.created_at),
          updatedAt: new Date(event.updated_at || event.created_at)
        }

        if (!dryRun) {
          await prisma.calendarEvent.create({ data: eventData })
        }

        this.stats.calendarEvents.migrated++
        console.log(`  ✅ ${eventData.title} (${eventData.startDate.toDateString()})`)

      } catch (error) {
        this.stats.calendarEvents.errors++
        console.error(`  ❌ Failed to migrate calendar event ${event.title}: ${error}`)
      }
    }
  }

  async migrateAuditLogs(dryRun: boolean) {
    console.log('📋 Migrating audit logs...')

    const { data: logs, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`)
    }

    this.stats.auditLogs.total = logs?.length || 0

    if (!logs || logs.length === 0) {
      console.log('⚠️  No audit logs found to migrate')
      return
    }

    for (const log of logs) {
      try {
        const logData = {
          id: log.id,
          userId: log.user_id,
          userName: log.user_name,
          action: log.action,
          tableName: log.table_name,
          recordId: log.record_id,
          oldValues: log.old_values,
          newValues: log.new_values,
          details: log.details,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          createdAt: new Date(log.created_at)
        }

        if (!dryRun) {
          await prisma.auditLog.create({ data: logData })
        }

        this.stats.auditLogs.migrated++

      } catch (error) {
        this.stats.auditLogs.errors++
        console.error(`  ❌ Failed to migrate audit log: ${error}`)
      }
    }

    console.log(`  ✅ Migrated ${this.stats.auditLogs.migrated} audit logs`)
  }

  async migrateEKinerja(dryRun: boolean) {
    console.log('📄 Migrating e-kinerja records...')

    const { data: records, error } = await supabase
      .from('e_kinerja')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch e-kinerja records: ${error.message}`)
    }

    this.stats.eKinerja.total = records?.length || 0

    if (!records || records.length === 0) {
      console.log('⚠️  No e-kinerja records found to migrate')
      return
    }

    for (const record of records) {
      try {
        const recordData = {
          id: record.id,
          tglSurat: record.tgl_surat ? new Date(record.tgl_surat) : null,
          noSurat: record.no_surat,
          perihal: record.perihal,
          kepada: record.kepada,
          jenisSurat: record.jenis_surat,
          tujuan: record.tujuan,
          urlDokumen: record.url_dokumen,
          filePath: record.file_path,
          createdById: record.created_by,
          createdAt: new Date(record.created_at),
          updatedAt: new Date(record.updated_at || record.created_at)
        }

        if (!dryRun) {
          await prisma.eKinerja.create({ data: recordData })
        }

        this.stats.eKinerja.migrated++
        console.log(`  ✅ ${recordData.perihal || 'No subject'}`)

      } catch (error) {
        this.stats.eKinerja.errors++
        console.error(`  ❌ Failed to migrate e-kinerja record: ${error}`)
      }
    }
  }

  async postMigrationTasks() {
    console.log('🔧 Running post-migration tasks...')

    // Update sequences for auto-increment fields
    await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"users"', 'id'), coalesce(max(id::numeric), 0) + 1, false) FROM "users"`

    // Create default settings
    const settings = [
      {
        key: 'app_name',
        value: 'Workload HPI Sosbud',
        description: 'Application name'
      },
      {
        key: 'app_version',
        value: '2.0.0',
        description: 'Application version'
      },
      {
        key: 'max_file_size',
        value: 10485760,
        description: 'Maximum file upload size in bytes (10MB)'
      },
      {
        key: 'allowed_file_types',
        value: ['pdf', 'doc', 'docx', 'jpg', 'png'],
        description: 'Allowed file upload types'
      }
    ]

    for (const setting of settings) {
      await prisma.settings.upsert({
        where: { key: setting.key },
        update: { value: setting.value, description: setting.description },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description
        }
      })
    }

    console.log('✅ Post-migration tasks completed')
  }

  printSummary() {
    console.log('\n' + '=' * 60)
    console.log('📊 MIGRATION SUMMARY')
    console.log('=' * 60)

    const tables = [
      { name: 'Users', stats: this.stats.users },
      { name: 'Workloads', stats: this.stats.workloads },
      { name: 'Calendar Events', stats: this.stats.calendarEvents },
      { name: 'Audit Logs', stats: this.stats.auditLogs },
      { name: 'E-Kinerja', stats: this.stats.eKinerja }
    ]

    for (const table of tables) {
      const { total, migrated, errors } = table.stats
      const successRate = total > 0 ? ((migrated / total) * 100).toFixed(1) : '0.0'
      
      console.log(`${table.name}:`)
      console.log(`  Total: ${total} | Migrated: ${migrated} | Errors: ${errors} | Success: ${successRate}%`)
    }

    const totalRecords = Object.values(this.stats).reduce((sum, stat) => sum + stat.total, 0)
    const totalMigrated = Object.values(this.stats).reduce((sum, stat) => sum + stat.migrated, 0)
    const totalErrors = Object.values(this.stats).reduce((sum, stat) => sum + stat.errors, 0)

    console.log('\nOVERALL:')
    console.log(`  Total Records: ${totalRecords}`)
    console.log(`  Successfully Migrated: ${totalMigrated}`)
    console.log(`  Errors: ${totalErrors}`)
    console.log(`  Success Rate: ${totalRecords > 0 ? ((totalMigrated / totalRecords) * 100).toFixed(1) : '0.0'}%`)

    if (totalErrors === 0) {
      console.log('\n🎉 Migration completed successfully!')
    } else {
      console.log('\n⚠️  Migration completed with some errors. Check logs above.')
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run') || args.includes('-d')
  const help = args.includes('--help') || args.includes('-h')

  if (help) {
    console.log(`
Supabase to PostgreSQL Migration Tool

Usage:
  npm run migrate:supabase [options]

Options:
  --dry-run, -d    Run migration in dry-run mode (no data changes)
  --help, -h       Show this help message

Examples:
  npm run migrate:supabase --dry-run    # Test migration without changes
  npm run migrate:supabase              # Run actual migration
`)
    process.exit(0)
  }

  const migration = new SupabaseMigration()
  await migration.run(dryRun)
}

// Run migration
if (require.main === module) {
  main().catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}

export { SupabaseMigration }