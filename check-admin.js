#!/usr/bin/env node

/**
 * Check Admin User Script
 * This script checks if admin user exists and provides options to create/reset
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workload-app';

async function checkAdmin() {
  console.log('👤 Admin User Check\n');
  
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Check for admin user
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Email: ${adminUser.email || 'Not set'}`);
      console.log(`   Created: ${adminUser.createdAt}`);
      console.log(`   Last updated: ${adminUser.updatedAt}`);
      
      // Test password
      const testPassword = 'admin123';
      const isValidPassword = await bcrypt.compare(testPassword, adminUser.password);
      console.log(`   Password 'admin123' is ${isValidPassword ? '✅ valid' : '❌ invalid'}`);
      
    } else {
      console.log('❌ No admin user found');
      console.log('\n💡 To create an admin user, run:');
      console.log('   node reset_admin_prod.js');
    }
    
    // List all users
    const allUsers = await User.find({});
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('\nAll users:');
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.role})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking admin user:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the check
if (require.main === module) {
  checkAdmin();
}

module.exports = { checkAdmin };