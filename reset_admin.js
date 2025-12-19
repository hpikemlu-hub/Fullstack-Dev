#!/usr/bin/env node

/**
 * Reset Admin User Script
 * This script creates or resets the admin user with default credentials
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workload-app';
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  email: 'admin@workload-app.com',
  role: 'admin'
};

async function resetAdmin() {
  console.log('🔧 Reset Admin User\n');
  
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: DEFAULT_ADMIN.username });
    
    if (existingAdmin) {
      console.log(`📝 Admin user '${DEFAULT_ADMIN.username}' already exists`);
      console.log('Updating password and email...');
      
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);
      
      // Update existing admin
      existingAdmin.password = hashedPassword;
      existingAdmin.email = DEFAULT_ADMIN.email;
      existingAdmin.role = DEFAULT_ADMIN.role;
      await existingAdmin.save();
      
      console.log('✅ Admin user updated successfully');
    } else {
      console.log(`➕ Creating new admin user '${DEFAULT_ADMIN.username}'...`);
      
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);
      
      // Create new admin user
      const newAdmin = new User({
        username: DEFAULT_ADMIN.username,
        password: hashedPassword,
        email: DEFAULT_ADMIN.email,
        role: DEFAULT_ADMIN.role
      });
      
      await newAdmin.save();
      console.log('✅ Admin user created successfully');
    }
    
    // Display admin credentials
    console.log('\n📋 Admin Credentials:');
    console.log(`   Username: ${DEFAULT_ADMIN.username}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log(`   Email: ${DEFAULT_ADMIN.email}`);
    console.log(`   Role: ${DEFAULT_ADMIN.role}`);
    
    console.log('\n🌐 You can now login to the application with these credentials');
    
  } catch (error) {
    console.error('❌ Error resetting admin user:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the reset
if (require.main === module) {
  resetAdmin();
}

module.exports = { resetAdmin };