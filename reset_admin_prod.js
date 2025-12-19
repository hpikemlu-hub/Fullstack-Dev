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

async function resetAdminUser() {
    try {
        console.log('=== Production Admin User Reset Script ===');
        console.log('Connecting to production database...');
        
        // Force production environment
        process.env.NODE_ENV = 'production';
        process.env.DB_PATH = '/app/data/database.sqlite';
        
        await database.initialize();
        console.log('✅ Connected to production database');
        
        // Check if admin user already exists
        console.log('Checking for existing admin user...');
        const existingAdmin = await User.findByUsername('admin');
        
        if (existingAdmin) {
            console.log('⚠️ Admin user already exists. Deleting...');
            await database.run('DELETE FROM users WHERE username = ?', ['admin']);
            console.log('✅ Existing admin user deleted');
        } else {
            console.log('ℹ️ No existing admin user found');
        }
        
        // Create new admin user
        console.log('Creating new admin user...');
        const adminData = {
            username: 'admin',
            password: 'admin123',
            nama: 'Administrator',
            role: 'Admin',
            nip: null,
            golongan: null,
            jabatan: null
        };
        
        const adminUser = await User.create(adminData);
        console.log('✅ Admin user created successfully:', {
            id: adminUser.id,
            username: adminUser.username,
            nama: adminUser.nama,
            role: adminUser.role
        });
        
        // Verify admin user
        console.log('Verifying admin user...');
        const verifyUser = await User.findByUsername('admin');
        
        if (verifyUser && verifyUser.username === 'admin' && verifyUser.role === 'Admin') {
            console.log('✅ Verification successful: Admin user exists in database');
        } else {
            console.log('❌ Verification failed: Admin user not found or incorrect data');
            process.exit(1);
        }
        
        // Test authentication
        console.log('Testing admin authentication...');
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
            process.exit(1);
        }
        
        console.log('\n=== Admin User Setup Complete ===');
        console.log('You can now login with:');
        console.log('  Username: admin');
        console.log('  Password: admin123');
        console.log('  URL: https://your-domain.com/login');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await database.close();
        console.log('Database connection closed.');
    }
}

// Run the script
resetAdminUser();