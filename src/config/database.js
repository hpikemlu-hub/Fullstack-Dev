const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        // dbPath will be determined dynamically in connect() method
    }

    ensureDatabaseDirectory() {
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            try {
                fs.mkdirSync(dbDir, { recursive: true, mode: 0o755 });
                console.log(`✅ Created database directory: ${dbDir}`);
                
                // Verify directory is writable
                try {
                    const testFile = path.join(dbDir, '.write_test');
                    fs.writeFileSync(testFile, 'test');
                    fs.unlinkSync(testFile);
                    console.log(`✅ Database directory is writable: ${dbDir}`);
                } catch (writeError) {
                    console.error(`❌ Database directory is not writable: ${dbDir}`, writeError.message);
                    throw new Error(`Database directory is not writable: ${dbDir}`);
                }
            } catch (error) {
                console.error(`❌ Failed to create database directory ${dbDir}:`, error.message);
                throw new Error(`Failed to create database directory: ${dbDir}`);
            }
        } else {
            // Verify existing directory is writable
            try {
                const testFile = path.join(dbDir, '.write_test');
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                console.log(`✅ Database directory exists and is writable: ${dbDir}`);
            } catch (writeError) {
                console.error(`❌ Database directory exists but is not writable: ${dbDir}`, writeError.message);
                throw new Error(`Database directory exists but is not writable: ${dbDir}`);
            }
        }
    }

    connect() {
        return new Promise((resolve, reject) => {
            // Dynamically determine database path on each connection
            const defaultPath = process.env.NODE_ENV === 'production' ? '/app/data/database.sqlite' : './database.sqlite';
            this.dbPath = process.env.DB_PATH || defaultPath;
            
            console.log(`📁 Database path: ${this.dbPath}`);
            
            // Ensure database directory exists
            this.ensureDatabaseDirectory();
            
            // Check if database file exists
            const dbExists = fs.existsSync(this.dbPath);
            if (!dbExists) {
                console.log(`📝 Database file does not exist, will be created: ${this.dbPath}`);
            } else {
                console.log(`📝 Database file exists: ${this.dbPath}`);
                
                // Check if database file is writable
                try {
                    fs.accessSync(this.dbPath, fs.constants.W_OK);
                    console.log(`✅ Database file is writable: ${this.dbPath}`);
                } catch (accessError) {
                    console.error(`❌ Database file is not writable: ${this.dbPath}`, accessError.message);
                    throw new Error(`Database file is not writable: ${this.dbPath}`);
                }
            }
            
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Error opening database:', err.message);
                    console.error('Database path:', this.dbPath);
                    reject(err);
                } else {
                    console.log('✅ Connected to SQLite database.');
                    // Enable foreign keys
                    this.db.run('PRAGMA foreign_keys = ON');
                    
                    // Set busy timeout for better concurrency handling
                    this.db.run('PRAGMA busy_timeout = 30000');
                    
                    resolve(this.db);
                }
            });
        });
    }

    async initialize() {
        try {
            await this.connect();
            console.log(`✅ Database connected at: ${this.dbPath}`);
            
            // Create tables
            await this.createTables();
            console.log('✅ Database tables created/verified successfully');
            
            // Run database integrity check
            await this.runIntegrityCheck();
            console.log('✅ Database integrity check passed');
            
            console.log('✅ Database initialization completed successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            console.error('Database path:', this.dbPath);
            throw error;
        }
    }
    
    async runIntegrityCheck() {
        return new Promise((resolve, reject) => {
            this.db.get('PRAGMA integrity_check', (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    const result = row.integrity_check;
                    if (result === 'ok') {
                        resolve(true);
                    } else {
                        console.warn('Database integrity check result:', result);
                        resolve(false);
                    }
                }
            });
        });
    }

    async verifyConnection() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        
        return new Promise((resolve, reject) => {
            this.db.get('SELECT 1', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            // Create users table
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    nama VARCHAR(100) NOT NULL,
                    nip VARCHAR(20),
                    golongan VARCHAR(20),
                    jabatan VARCHAR(100),
                    role VARCHAR(20) DEFAULT 'User',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Create workloads table
            const createWorkloadsTable = `
                CREATE TABLE IF NOT EXISTS workloads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    nama VARCHAR(100) NOT NULL,
                    type VARCHAR(50),
                    deskripsi TEXT,
                    status VARCHAR(50) DEFAULT 'New',
                    tgl_diterima DATE,
                    fungsi VARCHAR(100),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `;

            this.db.serialize(() => {
                this.db.run(createUsersTable, (err) => {
                    if (err) {
                        console.error('❌ Error creating users table:', err.message);
                        reject(err);
                    } else {
                        console.log('✅ Users table created/verified successfully');
                    }
                });

                this.db.run(createWorkloadsTable, (err) => {
                    if (err) {
                        console.error('❌ Error creating workloads table:', err.message);
                        reject(err);
                    } else {
                        console.log('✅ Workloads table created/verified successfully');
                        console.log('✅ All database tables created/verified successfully');
                        resolve();
                    }
                });
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed.');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Helper method to run queries with promises
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Helper method to get single row
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Helper method to get multiple rows
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = new Database();