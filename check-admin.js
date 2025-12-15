require('dotenv').config();
const database = require('./src/config/database');
const User = require('./src/models/User');

async function checkAdminUser() {
  try {
    // Initialize database first
    await database.initialize();
    console.log('Database initialized successfully');
    
    // Check if admin user exists
    const user = await User.findByUsername('admin');
    console.log('Admin user found:', user);
    
    // Check all users
    const allUsers = await database.all('SELECT id, username, role FROM users');
    console.log('All users:', allUsers);
    
    // If no admin user, create one
    if (!user) {
      console.log('Creating admin user...');
      const adminData = {
        username: 'admin',
        password: 'admin123',
        nama: 'Administrator',
        nip: '123456',
        golongan: 'IV/a',
        jabatan: 'Administrator',
        role: 'Admin'
      };
      
      const newAdmin = await User.create(adminData);
      console.log('Admin user created:', newAdmin);
    }
    
  } catch (error) {
    console.error('Error checking admin user:', error);
  } finally {
    await database.close();
    process.exit(0);
  }
}

checkAdminUser();