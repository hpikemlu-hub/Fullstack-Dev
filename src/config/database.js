const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        // Use /app/data directory in Docker, fallback to local directory for development
        const defaultPath = process.env.NODE_ENV === 'production' ? '/app/data/database.sqlite' : './database.sqlite';
        this.dbPath = process.env.DB_PATH || defaultPath;
        
        // Ensure database directory exists
        this.ensureDatabaseDirectory();
    }

    ensureDatabaseDirectory() {
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            try {
                fs.mkdirSync(dbDir, { recursive: true });
                console.log(`Created database directory: ${dbDir}`);
            } catch (error) {
                console.error(`Failed to create database directory ${dbDir}:`, error.message);
            }
        }
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database.');
                    // Enable foreign keys
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve(this.db);
                }
            });
        });
    }

    async initialize() {
        try {
            await this.connect();
            console.log(`Database connected at: ${this.dbPath}`);
            await this.createTables();
            console.log('Database initialization completed successfully');
        } catch (error) {
            console.error('Database initialization failed:', error.message);
            throw error;
        }
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
                        console.error('Error creating users table:', err.message);
                        reject(err);
                    }
                });

                this.db.run(createWorkloadsTable, (err) => {
                    if (err) {
                        console.error('Error creating workloads table:', err.message);
                        reject(err);
                    } else {
                        console.log('Database tables created successfully.');
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