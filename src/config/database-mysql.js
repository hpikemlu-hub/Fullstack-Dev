const mysql = require('mysql2/promise');

class MySQLDatabase {
    constructor() {
        this.pool = null;
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 20,
            acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
            timeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000,
            charset: 'utf8mb4',
            timezone: '+00:00',
            multipleStatements: true,
            reconnect: true,
            // Retry configuration
            retryDelay: parseInt(process.env.DB_RETRY_DELAY) || 2000,
            maxRetries: parseInt(process.env.DB_MAX_RETRIES) || 5
        };
    }

    async connect() {
        let retryCount = 0;
        const maxRetries = this.config.maxRetries;
        const retryDelay = this.config.retryDelay;

        while (retryCount < maxRetries) {
            try {
                console.log('🔌 Connecting to MySQL database...');
                console.log(`📍 Host: ${this.config.host}:${this.config.port}`);
                console.log(`🗄️  Database: ${this.config.database}`);
                console.log(`👤 User: ${this.config.user}`);
                
                this.pool = mysql.createPool(this.config);
                
                // Test connection
                const connection = await this.pool.getConnection();
                await connection.ping();
                connection.release();
                
                console.log('✅ Connected to MySQL database successfully');
                return this.pool;
            } catch (error) {
                retryCount++;
                console.error(`❌ MySQL connection attempt ${retryCount} failed:`, error.message);
                
                if (retryCount >= maxRetries) {
                    console.error(`❌ Maximum retry attempts (${maxRetries}) reached`);
                    throw new Error(`Failed to connect to MySQL after ${maxRetries} attempts: ${error.message}`);
                }
                
                console.log(`⏳ Retrying in ${retryDelay}ms...`);
                await this.sleep(retryDelay);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async initialize() {
        try {
            await this.connect();
            console.log('✅ MySQL connection established');
            
            // Create tables if they don't exist
            await this.createTables();
            console.log('✅ Database tables created/verified successfully');
            
            // Run database integrity check
            await this.runIntegrityCheck();
            console.log('✅ Database integrity check passed');
            
            console.log('✅ MySQL database initialization completed successfully');
        } catch (error) {
            console.error('❌ MySQL database initialization failed:', error.message);
            throw error;
        }
    }

    async runIntegrityCheck() {
        try {
            const [rows] = await this.pool.execute('SELECT 1 as test');
            return rows[0].test === 1;
        } catch (error) {
            console.error('Database integrity check failed:', error.message);
            throw error;
        }
    }

    async verifyConnection() {
        if (!this.pool) {
            throw new Error('Database not initialized');
        }
        
        try {
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();
            return true;
        } catch (error) {
            console.error('Connection verification failed:', error.message);
            throw error;
        }
    }

    async createTables() {
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
            await this.pool.execute(createUsersTable);
            console.log('✅ Users table created/verified successfully');
            
            await this.pool.execute(createWorkloadsTable);
            console.log('✅ Workloads table created/verified successfully');
        } catch (error) {
            console.error('❌ Error creating tables:', error.message);
            throw error;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('MySQL connection pool closed.');
        }
    }

    // Helper methods for database operations with error handling
    async execute(sql, params = []) {
        try {
            const [results] = await this.pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Error executing query:', error.message);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        }
    }

    async query(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Error executing query:', error.message);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        }
    }

    async getOne(sql, params = []) {
        try {
            const rows = await this.query(sql, params);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error getting single record:', error.message);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        }
    }

    // Method to handle transaction
    async transaction(callback) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new MySQLDatabase();