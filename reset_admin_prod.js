#!/usr/bin/env node

/**
 * Production Admin User Reset Script for Dokploy
 *
 * This script creates or resets the admin user in the production database.
 * It's designed to work in the Dokploy environment where the database is
 * stored at /app/data/database.sqlite
 *
 * Usage: node reset_admin_prod.js
 */

const database = require('./src/config/database');
const User = require('./src/models/User');
const fs = require('fs');
const path = require('path');

async function resetAdminUser() {
    let retryCount = 0;
    const maxRetries = 3;
    
    const resetWithRetry = async () => {
        try {
            console.log('=== Production Admin User Reset Script ===');
            console.log('🔧 Attempting to connect to production database...');
            
            // Force production environment
            process.env.NODE_ENV = 'production';
            process.env.DB_PATH = '/app/data/database.sqlite';
            
            // Check database directory and file permissions
            const dbPath = process.env.DB_PATH;
            const dbDir = path.dirname(dbPath);
            
            console.log(`📁 Database path: ${dbPath}`);
            console.log(`📁 Database directory: ${dbDir}`);
            
            // Ensure database directory exists
            if (!fs.existsSync(dbDir)) {
                console.log(`📁 Creating database directory: ${dbDir}`);
                fs.mkdirSync(dbDir, { recursive: true, mode: 0o755 });
            }
            
            // Check directory permissions
            try {
                const testFile = path.join(dbDir, '.write_test');
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                console.log('✅ Database directory is writable');
            } catch (writeError) {
                console.error('❌ Database directory is not writable:', writeError.message);
                throw new Error(`Database directory is not writable: ${dbDir}`);
            }
            
            // Initialize database
            await database.initialize();
            console.log('✅ Connected to production database');
            
            // Check if admin user already exists
            console.log('🔍 Checking for existing admin user...');
            const existingAdmin = await User.findByUsername('admin');
            
            if (existingAdmin) {
                console.log('⚠️ Admin user already exists. Deleting...');
                await database.run('DELETE FROM users WHERE username = ?', ['admin']);
                console.log('✅ Existing admin user deleted');
            } else {
                console.log('ℹ️ No existing admin user found');
            }
            
            // Create new admin user using enhanced method
            console.log('🔐 Creating new admin user...');
            const adminUser = await User.createAdminUser();
            console.log('✅ Admin user created successfully:', {
                id: adminUser.id,
                username: adminUser.username,
                nama: adminUser.nama,
                role: adminUser.role
            });
            
            // Verify admin user
            console.log('🔍 Verifying admin user...');
            const verifyUser = await User.findByUsername('admin');
            
            if (verifyUser && verifyUser.username === 'admin' && verifyUser.role === 'Admin') {
                console.log('✅ Verification successful: Admin user exists in database');
            } else {
                console.log('❌ Verification failed: Admin user not found or incorrect data');
                throw new Error('Admin user verification failed');
            }
            
            // Test authentication
            console.log('🔐 Testing admin authentication...');
            const authResult = await User.authenticate('admin', 'admin123');
            
            if (authResult) {
                console.log('✅ Authentication successful: Admin user can login');
                console.log('Authenticated user:', {
                    id: authResult.id,
                    username: authResult.username,
                    nama: authResult.nama,
                    role: authResult.role
                });
            } else {
                console.log('❌ Authentication failed: Admin user cannot login');
                throw new Error('Admin user authentication failed');
            }
            
            // Check database file size and permissions
            const stats = fs.statSync(dbPath);
            console.log(`📊 Database file size: ${stats.size} bytes`);
            console.log(`📊 Database file permissions: ${stats.mode.toString(8)}`);
            
            console.log('\n=== Admin User Setup Complete ===');
            console.log('You can now login with:');
            console.log('  Username: admin');
            console.log('  Password: admin123');
            console.log('  URL: https://your-domain.com/login');
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error (attempt ${retryCount + 1}/${maxRetries}):`, error.message);
            retryCount++;
            
            if (retryCount < maxRetries) {
                console.log(`Retrying in 3 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                return resetWithRetry();
            } else {
                console.error('Max retries reached. Admin user reset failed.');
                throw error;
            }
        }
    };
    
    try {
        await resetWithRetry();
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        try {
            await database.close();
            console.log('✅ Database connection closed.');
        } catch (closeError) {
            console.error('⚠️ Error closing database connection:', closeError.message);
        }
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the script
resetAdminUser();