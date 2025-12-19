const fs = require('fs');
const path = require('path');

class RollbackManager {
    constructor() {
        this.sqlitePath = process.env.SQLITE_DB_PATH || './database.sqlite';
        this.backupPattern = /\.backup\.\d+$/;
    }

    async rollback() {
        console.log('🔄 Starting rollback to SQLite...');
        
        try {
            // Find latest backup
            const backupFile = this.findLatestBackup();
            
            if (!backupFile) {
                throw new Error('No SQLite backup found for rollback');
            }
            
            // Restore from backup
            this.restoreFromBackup(backupFile);
            
            console.log('✅ Rollback completed successfully!');
            console.log(`📁 Restored from backup: ${backupFile}`);
        } catch (error) {
            console.error('❌ Rollback failed:', error.message);
            throw error;
        }
    }

    findLatestBackup() {
        const dir = path.dirname(this.sqlitePath);
        const baseName = path.basename(this.sqlitePath);
        
        if (!fs.existsSync(dir)) {
            console.log(`⚠️ Directory ${dir} does not exist`);
            return null;
        }
        
        const files = fs.readdirSync(dir)
            .filter(file => file.startsWith(baseName) && this.backupPattern.test(file))
            .sort((a, b) => {
                const timeA = parseInt(a.match(/\.backup\.(\d+)$/)[1]);
                const timeB = parseInt(b.match(/\.backup\.(\d+)$/)[1]);
                return timeB - timeA; // Sort in descending order
            });
        
        return files.length > 0 ? path.join(dir, files[0]) : null;
    }

    restoreFromBackup(backupFile) {
        if (!fs.existsSync(backupFile)) {
            throw new Error(`Backup file not found: ${backupFile}`);
        }
        
        // Create current backup before rollback
        if (fs.existsSync(this.sqlitePath)) {
            const currentBackup = `${this.sqlitePath}.before_rollback.${Date.now()}`;
            fs.copyFileSync(this.sqlitePath, currentBackup);
            console.log(`💾 Current database backed up to ${currentBackup}`);
        }
        
        // Ensure directory exists
        const dir = path.dirname(this.sqlitePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Restore from backup
        fs.copyFileSync(backupFile, this.sqlitePath);
        console.log(`📁 Restored database from ${backupFile} to ${this.sqlitePath}`);
    }

    listBackups() {
        console.log('📋 Available SQLite backups:');
        
        const backupFile = this.findLatestBackup();
        if (!backupFile) {
            console.log('  No backups found');
            return [];
        }
        
        const dir = path.dirname(this.sqlitePath);
        const baseName = path.basename(this.sqlitePath);
        
        const files = fs.readdirSync(dir)
            .filter(file => file.startsWith(baseName) && this.backupPattern.test(file))
            .sort((a, b) => {
                const timeA = parseInt(a.match(/\.backup\.(\d+)$/)[1]);
                const timeB = parseInt(b.match(/\.backup\.(\d+)$/)[1]);
                return timeB - timeA; // Sort in descending order
            });
        
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const timestamp = parseInt(file.match(/\.backup\.(\d+)$/)[1]);
            const date = new Date(timestamp).toLocaleString();
            const stats = fs.statSync(fullPath);
            console.log(`  ${file} - ${date} (${stats.size} bytes)`);
        });
        
        return files;
    }
}

// Run rollback if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const rollbackManager = new RollbackManager();
    
    if (command === 'list') {
        rollbackManager.listBackups();
    } else if (command === 'rollback' || !command) {
        rollbackManager.rollback()
            .then(() => {
                console.log('Rollback completed successfully');
                process.exit(0);
            })
            .catch((error) => {
                console.error('Rollback failed:', error);
                process.exit(1);
            });
    } else {
        console.log('Usage:');
        console.log('  node rollback-to-sqlite.js [list|rollback]');
        console.log('  list    - List available backups');
        console.log('  rollback - Rollback to latest backup (default)');
        process.exit(1);
    }
}

module.exports = RollbackManager;