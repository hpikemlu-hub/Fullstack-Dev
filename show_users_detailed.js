#!/usr/bin/env node

/**
 * Show Users Detailed Script
 * This script displays detailed information about all users in the database
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workload-app';

async function showUsersDetailed() {
  console.log('👥 Detailed User Information\n');
  
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get all users
    const users = await User.find({}).sort({ createdAt: -1 });
    
    if (users.length === 0) {
      console.log('📭 No users found in database');
      return;
    }
    
    console.log(`📊 Found ${users.length} user(s):\n`);
    
    // Display detailed information for each user
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email || 'Not set'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Updated: ${user.updatedAt}`);
      console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
      console.log('');
    });
    
    // Summary statistics
    const adminCount = users.filter(user => user.role === 'admin').length;
    const userCount = users.filter(user => user.role === 'user').length;
    
    console.log('📈 Summary Statistics:');
    console.log(`   Total Users: ${users.length}`);
    console.log(`   Admin Users: ${adminCount}`);
    console.log(`   Regular Users: ${userCount}`);
    
    // Check for any issues
    console.log('\n🔍 Health Check:');
    
    // Check for users without email
    const usersWithoutEmail = users.filter(user => !user.email);
    if (usersWithoutEmail.length > 0) {
      console.log(`   ⚠️ ${usersWithoutEmail.length} user(s) without email`);
    }
    
    // Check for duplicate usernames
    const usernames = users.map(user => user.username);
    const duplicateUsernames = usernames.filter((username, index) => usernames.indexOf(username) !== index);
    if (duplicateUsernames.length > 0) {
      console.log(`   ⚠️ Duplicate usernames found: ${[...new Set(duplicateUsernames)].join(', ')}`);
    }
    
    if (usersWithoutEmail.length === 0 && duplicateUsernames.length === 0) {
      console.log('   ✅ No issues detected');
    }
    
  } catch (error) {
    console.error('❌ Error fetching user details:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
if (require.main === module) {
  showUsersDetailed();
}

module.exports = { showUsersDetailed };