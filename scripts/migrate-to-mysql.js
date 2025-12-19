const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

class SQLiteToMySQLMigrator {
    constructor() {
        this.sqlitePath = process.env.SQLITE_DB_PATH || './database.sqlite';
        this.mysqlConfig = {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        };
    }

    async migrate() {
        console.log('🚀 Starting SQLite to MySQL migration...');
        
        try {
            // Validate MySQL configuration
            this.validateMySQLConfig();
            
            // Backup SQLite database
            await this.backupSQLiteDatabase();
            
            // Connect to both databases
            const sqliteDb = await this.connectToSQLite();
            const mysqlConnection = await this.connectToMySQL();
            
            // Create MySQL tables if they don't exist
            await this.createMySQLTables(mysqlConnection);
            
            // Migrate data
            await this.migrateUsers(sqliteDb, mysqlConnection);
            await this.migrateWorkloads(sqliteDb, mysqlConnection);
            
            // Verify migration
            await this.verifyMigration(sqliteDb, mysqlConnection);
            
            // Close connections
            await sqliteDb.close();
            await mysqlConnection.end();
            
            console.log('✅ Migration completed successfully!');
            console.log('📝 Migration summary:');
            console.log(`  - SQLite database: ${this.sqlitePath}`);
            console.log(`  - MySQL database: ${this.mysqlConfig.database}@${this.mysqlConfig.host}`);
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    }

    validateMySQLConfig() {
        const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            throw new Error(`Missing required MySQL environment variables: ${missingVars.join(', ')}`);
        }
        
        console.log('✅ MySQL configuration validated');
        console.log(`📍 Host: ${this.mysqlConfig.host}:${this.mysqlConfig.port}`);
        console.log(`🗄️  Database: ${this.mysqlConfig.database}`);
        console.log(`👤 User: ${this.mysqlConfig.user}`);
    }

    async backupSQLiteDatabase() {
        if (!fs.existsSync(this.sqlitePath)) {
            throw new Error(`SQLite database not found at ${this.sqlitePath}`);
        }
        
        const backupPath = `${this.sqlitePath}.backup.${Date.now()}`;
        fs.copyFileSync(this.sqlitePath, backupPath);
        console.log(`💾 SQLite database backed up to ${backupPath}`);
    }

    async connectToSQLite() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.sqlitePath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Connected to SQLite database');
                    resolve(db);
                }
            });
        });
    }

    async connectToMySQL() {
        try {
            const connection = await mysql.createConnection(this.mysqlConfig);
            console.log('✅ Connected to MySQL database');
            return connection;
        } catch (error) {
            throw new Error(`Failed to connect to MySQL: ${error.message}`);
        }
    }

    async createMySQLTables(connection) {
        console.log('🔧 Creating MySQL tables...');
        
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                nama VARCHAR(100) NOT NULL,
                nip VARCHAR(20),
                golongan VARCHAR(20),
                jabatan VARCHAR(100),
                role ENUM('Admin', 'User') DEFAULT 'User',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_role (role)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        const createWorkloadsTable = `
            CREATE TABLE IF NOT EXISTS workloads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                nama VARCHAR(100) NOT NULL,
                type VARCHAR(50),
                deskripsi TEXT,
                status ENUM('New', 'In Progress', 'Completed', 'On Hold', 'Cancelled') DEFAULT 'New',
                tgl_diterima DATE,
                fungsi VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        try {
            await connection.execute(createUsersTable);
            await connection.execute(createWorkloadsTable);
            console.log('✅ MySQL tables created/verified successfully');
        } catch (error) {
            throw new Error(`Failed to create MySQL tables: ${error.message}`);
        }
    }

    async migrateUsers(sqliteDb, mysqlConnection) {
        console.log('👥 Migrating users...');
        
        const users = await this.getAllUsers(sqliteDb);
        console.log(`Found ${users.length} users to migrate`);
        
        if (users.length === 0) {
            console.log('⚠️ No users found in SQLite database');
            return;
        }
        
        for (const user of users) {
            await this.insertUser(mysqlConnection, user);
        }
        
        console.log('✅ Users migration completed');
    }

    async getAllUsers(sqliteDb) {
        return new Promise((resolve, reject) => {
            sqliteDb.all('SELECT * FROM users', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async insertUser(mysqlConnection, user) {
        const sql = `
            INSERT INTO users (id, username, password, nama, nip, golongan, jabatan, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            password = VALUES(password),
            nama = VALUES(nama),
            nip = VALUES(nip),
            golongan = VALUES(golongan),
            jabatan = VALUES(jabatan),
            role = VALUES(role)
        `;
        
        const params = [
            user.id,
            user.username,
            user.password,
            user.nama,
            user.nip,
            user.golongan,
            user.jabatan,
            user.role,
            user.created_at
        ];
        
        try {
            await mysqlConnection.execute(sql, params);
        } catch (error) {
            console.error(`❌ Failed to migrate user ${user.username}:`, error.message);
            throw error;
        }
    }

    async migrateWorkloads(sqliteDb, mysqlConnection) {
        console.log('📋 Migrating workloads...');
        
        const workloads = await this.getAllWorkloads(sqliteDb);
        console.log(`Found ${workloads.length} workloads to migrate`);
        
        if (workloads.length === 0) {
            console.log('⚠️ No workloads found in SQLite database');
            return;
        }
        
        for (const workload of workloads) {
            await this.insertWorkload(mysqlConnection, workload);
        }
        
        console.log('✅ Workloads migration completed');
    }

    async getAllWorkloads(sqliteDb) {
        return new Promise((resolve, reject) => {
            sqliteDb.all('SELECT * FROM workloads', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async insertWorkload(mysqlConnection, workload) {
        const sql = `
            INSERT INTO workloads (id, user_id, nama, type, deskripsi, status, tgl_diterima, fungsi, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            user_id = VALUES(user_id),
            nama = VALUES(nama),
            type = VALUES(type),
            deskripsi = VALUES(deskripsi),
            status = VALUES(status),
            tgl_diterima = VALUES(tgl_diterima),
            fungsi = VALUES(fungsi),
            updated_at = VALUES(updated_at)
        `;
        
        const params = [
            workload.id,
            workload.user_id,
            workload.nama,
            workload.type,
            workload.deskripsi,
            workload.status,
            workload.tgl_diterima,
            workload.fungsi,
            workload.created_at,
            workload.updated_at
        ];
        
        try {
            await mysqlConnection.execute(sql, params);
        } catch (error) {
            console.error(`❌ Failed to migrate workload ${workload.id}:`, error.message);
            throw error;
        }
    }

    async verifyMigration(sqliteDb, mysqlConnection) {
        console.log('🔍 Verifying migration integrity...');
        
        // Verify user count
        const sqliteUserCount = await this.getUserCount(sqliteDb);
        const mysqlUserCount = await this.getMySQLUserCount(mysqlConnection);
        
        if (sqliteUserCount !== mysqlUserCount) {
            throw new Error(`User count mismatch: SQLite=${sqliteUserCount}, MySQL=${mysqlUserCount}`);
        }
        
        // Verify workload count
        const sqliteWorkloadCount = await this.getWorkloadCount(sqliteDb);
        const mysqlWorkloadCount = await this.getMySQLWorkloadCount(mysqlConnection);
        
        if (sqliteWorkloadCount !== mysqlWorkloadCount) {
            throw new Error(`Workload count mismatch: SQLite=${sqliteWorkloadCount}, MySQL=${mysqlWorkloadCount}`);
        }
        
        console.log('✅ Migration verification passed');
        console.log(`📊 Migration summary:`);
        console.log(`  - Users migrated: ${sqliteUserCount}`);
        console.log(`  - Workloads migrated: ${sqliteWorkloadCount}`);
    }

    async getUserCount(sqliteDb) {
        return new Promise((resolve, reject) => {
            sqliteDb.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }

    async getMySQLUserCount(mysqlConnection) {
        const [rows] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM users');
        return rows[0].count;
    }

    async getWorkloadCount(sqliteDb) {
        return new Promise((resolve, reject) => {
            sqliteDb.get('SELECT COUNT(*) as count FROM workloads', (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }

    async getMySQLWorkloadCount(mysqlConnection) {
        const [rows] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM workloads');
        return rows[0].count;
    }
}

// Run migration if called directly
if (require.main === module) {
    const migrator = new SQLiteToMySQLMigrator();
    migrator.migrate()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = SQLiteToMySQLMigrator;