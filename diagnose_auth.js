#!/usr/bin/env node

/**
 * Authentication Diagnosis Script
 * This script helps diagnose authentication issues in the workload app
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workload-app';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function diagnoseAuth() {
  console.log('🔍 Starting Authentication Diagnosis...\n');
  
  try {
    // 1. Check MongoDB Connection
    console.log('1. Checking MongoDB Connection...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connection successful');
    
    // 2. Check if users exist
    console.log('\n2. Checking for existing users...');
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users in database`);
    
    if (users.length === 0) {
      console.log('⚠️ No users found. You may need to create an admin user.');
    } else {
      users.forEach((user, index) => {
        console.log(`   User ${index + 1}: ${user.username} (${user.role})`);
      });
    }
    
    // 3. Check admin user specifically
    console.log('\n3. Checking for admin user...');
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser.username);
      
      // Test password verification
      const testPassword = 'admin123'; // Default admin password
      const isValidPassword = await bcrypt.compare(testPassword, adminUser.password);
      console.log(`🔐 Password verification for 'admin123': ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`);
      
      // Test JWT token generation
      const token = jwt.sign(
        { id: adminUser._id, username: adminUser.username, role: adminUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      console.log('🔑 JWT Token generation: ✅ Successful');
      console.log(`   Token (first 50 chars): ${token.substring(0, 50)}...`);
    } else {
      console.log('❌ No admin user found');
    }
    
    // 4. Check environment variables
    console.log('\n4. Checking environment variables...');
    console.log(`   MONGODB_URI: ${MONGODB_URI ? '✅ Set' : '❌ Not set'}`);
    console.log(`   JWT_SECRET: ${JWT_SECRET && JWT_SECRET !== 'your-secret-key' ? '✅ Set' : '⚠️ Using default'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    
    console.log('\n🎉 Authentication diagnosis completed!');
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the diagnosis
if (require.main === module) {
  diagnoseAuth();
}

module.exports = { diagnoseAuth };