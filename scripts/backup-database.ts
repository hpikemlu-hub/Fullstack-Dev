#!/usr/bin/env tsx

/**
 * Database Backup Script
 * Creates automated backups of PostgreSQL database with compression and retention
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

interface BackupConfig {
  databaseUrl: string
  backupDir: string
  retentionDays: number
  compression: boolean
  includeSchema: boolean
  includeData: boolean
}

class DatabaseBackup {
  private config: BackupConfig

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      databaseUrl: process.env.DATABASE_URL || '',
      backupDir: config.backupDir || './backups',
      retentionDays: config.retentionDays || 30,
      compression: config.compression ?? true,
      includeSchema: config.includeSchema ?? true,
      includeData: config.includeData ?? true
    }

    if (!this.config.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }
  }

  private parseDatabaseUrl(url: string) {
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
    if (!match) {
      throw new Error('Invalid DATABASE_URL format')
    }

    return {
      username: match[1],
      password: match[2],
      hostname: match[3],
      port: match[4],
      database: match[5]
    }
  }

  private generateBackupFilename(format: 'sql' | 'custom' = 'sql'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const env = process.env.NODE_ENV || 'development'
    const extension = format === 'custom' ? 'dump' : 'sql'
    return `workload_${env}_${timestamp}.${extension}`
  }

  private async ensureBackupDirectory(): Promise<void> {
    if (!existsSync(this.config.backupDir)) {
      mkdirSync(this.config.backupDir, { recursive: true })
      console.log(`Created backup directory: ${this.config.backupDir}`)
    }
  }

  async createBackup(): Promise<string> {
    console.log('🔄 Starting database backup...')
    
    await this.ensureBackupDirectory()
    
    const dbConfig = this.parseDatabaseUrl(this.config.databaseUrl)
    const backupFilename = this.generateBackupFilename()
    const backupPath = path.join(this.config.backupDir, backupFilename)
    
    // Build pg_dump command
    let command = `PGPASSWORD="${dbConfig.password}" pg_dump`
    command += ` -h "${dbConfig.hostname}"`
    command += ` -p ${dbConfig.port}`
    command += ` -U "${dbConfig.username}"`
    command += ` -d "${dbConfig.database}"`
    command += ` --no-password`
    command += ` --verbose`
    
    if (this.config.includeSchema) {
      command += ` --clean --if-exists --create`
    } else {
      command += ` --data-only`
    }
    
    if (!this.config.includeData) {
      command += ` --schema-only`
    }
    
    command += ` -f "${backupPath}"`
    
    try {
      console.log('📊 Running pg_dump...')
      const { stdout, stderr } = await execAsync(command)
      
      if (stderr && !stderr.includes('NOTICE:')) {
        console.warn('⚠️ Backup warnings:', stderr)
      }
      
      console.log('✅ Database backup completed')
      
      // Compress backup if enabled
      if (this.config.compression) {
        console.log('🗜️ Compressing backup...')
        await execAsync(`gzip "${backupPath}"`)
        const compressedPath = `${backupPath}.gz`
        console.log(`✅ Backup compressed: ${compressedPath}`)
        return compressedPath
      }
      
      return backupPath
      
    } catch (error) {
      console.error('❌ Backup failed:', error)
      throw error
    }
  }

  async cleanupOldBackups(): Promise<void> {
    console.log('🧹 Cleaning up old backups...')
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)
    
    try {
      // Find and remove old backup files
      const command = `find "${this.config.backupDir}" -name "workload_*.sql*" -type f -mtime +${this.config.retentionDays} -delete`
      await execAsync(command)
      console.log(`✅ Removed backups older than ${this.config.retentionDays} days`)
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error)
    }
  }

  async verifyBackup(backupPath: string): Promise<boolean> {
    console.log('🔍 Verifying backup integrity...')
    
    try {
      if (backupPath.endsWith('.gz')) {
        // Test gzip file integrity
        await execAsync(`gzip -t "${backupPath}"`)
        console.log('✅ Compressed backup integrity verified')
      } else {
        // Basic SQL file verification
        const { stdout } = await execAsync(`head -n 10 "${backupPath}"`)
        if (!stdout.includes('PostgreSQL database dump')) {
          throw new Error('Backup file does not appear to be a valid PostgreSQL dump')
        }
        console.log('✅ Backup file format verified')
      }
      
      return true
    } catch (error) {
      console.error('❌ Backup verification failed:', error)
      return false
    }
  }
}

// CLI execution
async function main() {
  try {
    const backup = new DatabaseBackup({
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      compression: process.env.BACKUP_COMPRESSION !== 'false'
    })
    
    console.log('🚀 Database Backup Utility')
    console.log('==========================')
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`Retention: ${backup['config'].retentionDays} days`)
    console.log(`Compression: ${backup['config'].compression ? 'enabled' : 'disabled'}`)
    console.log('')
    
    // Create backup
    const backupPath = await backup.createBackup()
    
    // Verify backup
    const isValid = await backup.verifyBackup(backupPath)
    if (!isValid) {
      console.error('❌ Backup verification failed!')
      process.exit(1)
    }
    
    // Cleanup old backups
    await backup.cleanupOldBackups()
    
    console.log('')
    console.log('📋 Backup Summary:')
    console.log(`  File: ${backupPath}`)
    console.log(`  Size: ${await getFileSize(backupPath)}`)
    console.log(`  Date: ${new Date().toISOString()}`)
    console.log('')
    console.log('✅ Backup process completed successfully!')
    
  } catch (error) {
    console.error('❌ Backup process failed:', error)
    process.exit(1)
  }
}

async function getFileSize(filePath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`ls -lh "${filePath}" | awk '{print $5}'`)
    return stdout.trim()
  } catch {
    return 'Unknown'
  }
}

// Run if called directly
if (require.main === module) {
  main()
}