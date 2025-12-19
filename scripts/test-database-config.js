const database = require('../src/config/database');

class DatabaseConfigTester {
    async runTests() {
        console.log('🧪 Running database configuration tests...\n');
        
        try {
            // Test 1: Database type detection
            await this.testDatabaseType();
            
            // Initialize database first
            console.log('🚀 Initializing database...');
            await database.initialize();
            
            // Test 2: Database connection
            await this.testDatabaseConnection();
            
            // Test 3: Database health check
            await this.testHealthCheck();
            
            // Test 4: Database operations
            await this.testDatabaseOperations();
            
            console.log('\n✅ All database configuration tests passed!');
            return true;
        } catch (error) {
            console.error('\n❌ Database configuration tests failed:', error.message);
            return false;
        }
    }

    async testDatabaseType() {
        console.log('📋 Testing database type detection...');
        
        const dbType = database.getType();
        const isMySQL = database.isMySQL();
        const isSQLite = database.isSQLite();
        
        console.log(`  Database type: ${dbType}`);
        console.log(`  Is MySQL: ${isMySQL}`);
        console.log(`  Is SQLite: ${isSQLite}`);
        
        if (!dbType || (dbType !== 'mysql' && dbType !== 'sqlite')) {
            throw new Error('Invalid database type detected');
        }
        
        if (dbType === 'mysql' && !isMySQL) {
            throw new Error('MySQL type mismatch');
        }
        
        if (dbType === 'sqlite' && !isSQLite) {
            throw new Error('SQLite type mismatch');
        }
        
        console.log('  ✅ Database type detection passed\n');
    }

    async testDatabaseConnection() {
        console.log('🔌 Testing database connection...');
        
        try {
            await database.verifyConnection();
            console.log('  ✅ Database connection verified\n');
        } catch (error) {
            console.log('  ❌ Database connection failed:', error.message);
            throw error;
        }
    }

    async testHealthCheck() {
        console.log('🏥 Testing database health check...');
        
        try {
            const health = await database.healthCheck();
            console.log('  Health status:', health.status);
            console.log('  Database type:', health.database);
            console.log('  Connected:', health.connected);
            console.log('  Timestamp:', health.timestamp);
            
            if (health.status !== 'healthy') {
                throw new Error(`Database health check failed: ${health.error || 'Unknown error'}`);
            }
            
            console.log('  ✅ Database health check passed\n');
        } catch (error) {
            console.log('  ❌ Database health check failed:', error.message);
            throw error;
        }
    }

    async testDatabaseOperations() {
        console.log('🔧 Testing database operations...');
        
        try {
            // Test table creation/verification
            console.log('  Testing table operations...');
            await this.testTableOperations();
            
            // Test basic CRUD operations
            console.log('  Testing CRUD operations...');
            await this.testCRUDOperations();
            
            console.log('  ✅ Database operations test passed\n');
        } catch (error) {
            console.log('  ❌ Database operations test failed:', error.message);
            throw error;
        }
    }

    async testTableOperations() {
        // Test if tables exist and are accessible
        const userCount = await database.getOne('SELECT COUNT(*) as count FROM users');
        const workloadCount = await database.getOne('SELECT COUNT(*) as count FROM workloads');
        
        console.log(`    Users table: ${userCount.count} records`);
        console.log(`    Workloads table: ${workloadCount.count} records`);
    }

    async testCRUDOperations() {
        // Test query operations
        const users = await database.query('SELECT * FROM users LIMIT 1');
        const workloads = await database.query('SELECT * FROM workloads LIMIT 1');
        
        console.log(`    Query test: Found ${users.length} users, ${workloads.length} workloads`);
        
        // Test execute operations (SELECT COUNT)
        const userCountResult = await database.execute('SELECT COUNT(*) as total FROM users');
        console.log(`    Execute test: Total users = ${userCountResult[0]?.total || userCountResult.total}`);
    }

    async testMigrationReadiness() {
        console.log('🚀 Testing migration readiness...');
        
        // Check if MySQL environment variables are set when DB_TYPE=mysql
        if (database.isMySQL()) {
            const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
            const missingVars = requiredVars.filter(varName => !process.env[varName]);
            
            if (missingVars.length > 0) {
                console.log(`  ⚠️ Missing MySQL environment variables: ${missingVars.join(', ')}`);
                return false;
            }
            
            console.log('  ✅ MySQL environment variables configured');
        }
        
        // Check SQLite database file accessibility
        if (database.isSQLite()) {
            const sqlitePath = process.env.SQLITE_DB_PATH || './database.sqlite';
            const fs = require('fs');
            
            if (!fs.existsSync(sqlitePath)) {
                console.log(`  ⚠️ SQLite database not found at: ${sqlitePath}`);
                console.log('  ✅ SQLite database will be created on first run');
            } else {
                console.log(`  ✅ SQLite database found at: ${sqlitePath}`);
            }
        }
        
        console.log('  ✅ Migration readiness check passed\n');
        return true;
    }
}

// Additional test for migration script availability
async function testMigrationScripts() {
    console.log('📜 Testing migration script availability...');
    
    const fs = require('fs');
    const path = require('path');
    
    const migrationScript = path.join(__dirname, 'migrate-to-mysql.js');
    const rollbackScript = path.join(__dirname, 'rollback-to-sqlite.js');
    
    if (!fs.existsSync(migrationScript)) {
        throw new Error('Migration script not found');
    }
    
    if (!fs.existsSync(rollbackScript)) {
        throw new Error('Rollback script not found');
    }
    
    console.log('  ✅ Migration scripts available\n');
}

// Run tests if called directly
if (require.main === module) {
    const tester = new DatabaseConfigTester();
    
    tester.runTests()
        .then(async (success) => {
            if (success) {
                await tester.testMigrationReadiness();
                await testMigrationScripts();
                console.log('🎉 All tests completed successfully!');
                process.exit(0);
            } else {
                console.log('💥 Tests failed!');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('💥 Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = DatabaseConfigTester;