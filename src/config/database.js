const fs = require('fs');

// Determine which database to use based on environment
const dbType = process.env.DB_TYPE || 'sqlite';

let database;

console.log(`🔧 Database configuration: DB_TYPE=${dbType}`);

// Validate required environment variables for MySQL
if (dbType === 'mysql') {
    const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing required MySQL environment variables:', missingVars.join(', '));
        console.error('Please set the following environment variables for MySQL:');
        missingVars.forEach(varName => {
            console.error(`  - ${varName}`);
        });
        console.error('Falling back to SQLite...');
        
        // Fallback to SQLite if MySQL config is incomplete
        process.env.DB_TYPE = 'sqlite';
        database = require('./database-sqlite');
    } else {
        console.log('🐬 Using MySQL database');
        console.log(`📍 Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
        console.log(`🗄️  Database: ${process.env.DB_NAME}`);
        console.log(`👤 User: ${process.env.DB_USER}`);
        
        try {
            database = require('./database-mysql');
        } catch (error) {
            console.error('❌ Failed to load MySQL database module:', error.message);
            console.error('Falling back to SQLite...');
            process.env.DB_TYPE = 'sqlite';
            database = require('./database-sqlite');
        }
    }
} else {
    console.log('🗄️  Using SQLite database');
    try {
        database = require('./database-sqlite');
    } catch (error) {
        console.error('❌ Failed to load SQLite database module:', error.message);
        throw new Error('Failed to initialize any database module');
    }
}

// Add database type information to the exported object
database.getType = () => dbType;
database.isMySQL = () => dbType === 'mysql';
database.isSQLite = () => dbType === 'sqlite';

// Enhanced initialization with fallback support
const originalInitialize = database.initialize;
database.initialize = async function() {
    try {
        console.log(`🚀 Initializing ${dbType.toUpperCase()} database...`);
        await originalInitialize.call(this);
        console.log(`✅ ${dbType.toUpperCase()} database initialized successfully`);
    } catch (error) {
        console.error(`❌ Failed to initialize ${dbType.toUpperCase()} database:`, error.message);
        
        // If MySQL fails and we haven't already tried SQLite, attempt fallback
        if (dbType === 'mysql' && process.env.DB_FALLBACK_TO_SQLITE !== 'false') {
            console.log('🔄 Attempting fallback to SQLite...');
            try {
                const sqliteDB = require('./database-sqlite');
                await sqliteDB.initialize();
                console.log('✅ Fallback to SQLite successful');
                
                // Replace current database instance with SQLite
                Object.assign(this, sqliteDB);
                this.getType = () => 'sqlite';
                this.isMySQL = () => false;
                this.isSQLite = () => true;
                
                return;
            } catch (fallbackError) {
                console.error('❌ SQLite fallback also failed:', fallbackError.message);
            }
        }
        
        // If we get here, both primary and fallback failed
        throw new Error(`Database initialization failed: ${error.message}`);
    }
};

// Enhanced connection verification with retry logic
const originalVerifyConnection = database.verifyConnection;
database.verifyConnection = async function(maxRetries = 3) {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        try {
            await originalVerifyConnection.call(this);
            console.log(`✅ Database connection verified (${dbType})`);
            return true;
        } catch (error) {
            retryCount++;
            console.error(`❌ Connection verification attempt ${retryCount} failed:`, error.message);
            
            if (retryCount >= maxRetries) {
                // If MySQL fails and fallback is enabled, try SQLite
                if (dbType === 'mysql' && process.env.DB_FALLBACK_TO_SQLITE !== 'false') {
                    console.log('🔄 Attempting SQLite fallback for connection verification...');
                    try {
                        const sqliteDB = require('./database-sqlite');
                        await sqliteDB.verifyConnection();
                        console.log('✅ SQLite fallback connection successful');
                        return true;
                    } catch (fallbackError) {
                        console.error('❌ SQLite fallback connection also failed:', fallbackError.message);
                    }
                }
                
                throw new Error(`Database connection verification failed after ${maxRetries} attempts: ${error.message}`);
            }
            
            // Wait before retrying
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5 seconds
            console.log(`⏳ Retrying connection verification in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// Add health check method
database.healthCheck = async function() {
    try {
        const isConnected = await this.verifyConnection();
        const type = this.getType();
        
        return {
            status: 'healthy',
            database: type,
            connected: isConnected,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            database: this.getType(),
            connected: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

// Add graceful shutdown method
const originalClose = database.close;
database.close = async function() {
    try {
        console.log(`🔄 Closing ${this.getType()} database connection...`);
        await originalClose.call(this);
        console.log(`✅ ${this.getType()} database connection closed successfully`);
    } catch (error) {
        console.error(`❌ Error closing ${this.getType()} database connection:`, error.message);
        throw error;
    }
};

module.exports = database;