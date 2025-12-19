const database = require('./src/config/database');
const User = require('./src/models/User');
const fs = require('fs');
const path = require('path');

async function diagnoseAuthIssue() {
    try {
        console.log('='.repeat(80));
        console.log('AUTHENTICATION DIAGNOSTIC TOOL');
        console.log('='.repeat(80));
        
        // Check database path
        const defaultPath = process.env.NODE_ENV === 'production' ? '/app/data/database.sqlite' : './database.sqlite';
        const dbPath = process.env.DB_PATH || defaultPath;
        console.log(`Database path: ${dbPath}`);
        console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
        console.log(`DB_PATH: ${process.env.DB_PATH || 'Not set'}`);
        
        // Check if database directory exists
        const dbDir = path.dirname(dbPath);
        console.log(`Database directory: ${dbDir}`);
        console.log(`Directory exists: ${fs.existsSync(dbDir) ? 'Yes' : 'No'}`);
        
        if (fs.existsSync(dbDir)) {
            try {
                const stats = fs.statSync(dbDir);
                console.log(`Directory permissions: ${stats.mode.toString(8)}`);
                console.log(`Directory owner: ${stats.uid}`);
            } catch (error) {
                console.log(`Cannot check directory permissions: ${error.message}`);
            }
        }
        
        // Check if database file exists
        console.log(`Database file exists: ${fs.existsSync(dbPath) ? 'Yes' : 'No'}`);
        
        if (fs.existsSync(dbPath)) {
            try {
                const stats = fs.statSync(dbPath);
                console.log(`Database file size: ${stats.size} bytes`);
                console.log(`Database file permissions: ${stats.mode.toString(8)}`);
                console.log(`Database file owner: ${stats.uid}`);
                console.log(`Database file modified: ${stats.mtime}`);
            } catch (error) {
                console.log(`Cannot check database file: ${error.message}`);
            }
        }
        
        // Initialize database connection
        console.log('\nInitializing database connection...');
        await database.initialize();
        console.log(`Database connected at: ${database.dbPath}`);
        
        // Verify database connection
        console.log('Verifying database connection...');
        await database.verifyConnection();
        console.log('Database connection verified successfully');
        
        // Check if tables exist
        console.log('\nChecking database tables...');
        try {
            const tables = await database.all("SELECT name FROM sqlite_master WHERE type='table'");
            console.log(`Tables found: ${tables.length}`);
            tables.forEach(table => {
                console.log(`- ${table.name}`);
            });
        } catch (error) {
            console.log(`Error checking tables: ${error.message}`);
        }
        
        // Check users table
        console.log('\nChecking users table...');
        try {
            const userCount = await database.get('SELECT COUNT(*) as count FROM users');
            console.log(`Total users in database: ${userCount.count}`);
            
            if (userCount.count > 0) {
                const users = await database.all('SELECT id, username, role, created_at FROM users');
                console.log('Users found:');
                users.forEach(user => {
                    console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Created: ${user.created_at}`);
                });
            } else {
                console.log('No users found in database');
            }
        } catch (error) {
            console.log(`Error checking users table: ${error.message}`);
        }
        
        // Check if admin user exists
        console.log('\nChecking for admin user...');
        try {
            const adminUser = await User.findByUsername('admin');
            if (adminUser) {
                console.log('✅ Admin user found:');
                console.log(`  ID: ${adminUser.id}`);
                console.log(`  Username: ${adminUser.username}`);
                console.log(`  Role: ${adminUser.role}`);
                console.log(`  Created: ${adminUser.created_at}`);
                console.log(`  Password hash exists: ${adminUser.password ? 'Yes' : 'No'}`);
                
                // Test authentication
                console.log('\nTesting admin authentication...');
                const authResult = await User.authenticate('admin', 'admin123');
                if (authResult) {
                    console.log('✅ Authentication successful');
                } else {
                    console.log('❌ Authentication failed');
                }
            } else {
                console.log('❌ Admin user not found');
                
                // Try to create admin user
                console.log('\nAttempting to create admin user...');
                try {
                    const adminData = {
                        username: 'admin',
                        password: 'admin123',
                        nama: 'Administrator',
                        role: 'Admin',
                        nip: null,
                        golongan: null,
                        jabatan: null
                    };
                    
                    const newAdmin = await User.create(adminData);
                    console.log('✅ Admin user created successfully');
                    console.log(`  ID: ${newAdmin.id}`);
                    console.log(`  Username: ${newAdmin.username}`);
                    
                    // Test authentication after creation
                    const authResult = await User.authenticate('admin', 'admin123');
                    if (authResult) {
                        console.log('✅ Authentication successful after creation');
                    } else {
                        console.log('❌ Authentication still fails after creation');
                    }
                } catch (createError) {
                    console.log(`❌ Failed to create admin user: ${createError.message}`);
                }
            }
        } catch (error) {
            console.log(`Error checking admin user: ${error.message}`);
        }
        
        // Close database connection
        await database.close();
        console.log('\nDatabase connection closed');
        
    } catch (error) {
        console.error('Diagnostic error:', error.message);
        console.error('Error stack:', error.stack);
    }
}

// Run the diagnostic
diagnoseAuth();