const database = require('./src/config/database');
const User = require('./src/models/User');

async function resetDatabase() {
    try {
        console.log('Connecting to database...');
        await database.initialize();
        
        console.log('Deleting all workloads from database...');
        // Hapus semua data dari tabel workloads terlebih dahulu
        await database.run('DELETE FROM workloads');
        console.log('All workloads deleted successfully.');
        
        console.log('Deleting all users from database...');
        // Hapus semua data dari tabel users
        await database.run('DELETE FROM users');
        console.log('All users deleted successfully.');
        
        console.log('Creating admin user...');
        // Buat user admin baru
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
        console.log('Admin user created successfully:', adminUser);
        
        console.log('Verifying admin user...');
        // Verifikasi bahwa hanya ada 1 user admin
        const allUsers = await User.findAll();
        console.log(`Total users in database: ${allUsers.length}`);
        
        if (allUsers.length === 1 && allUsers[0].username === 'admin' && allUsers[0].role === 'Admin') {
            console.log('✅ Verification successful: Only 1 admin user exists in database');
        } else {
            console.log('❌ Verification failed: Unexpected user count or data');
        }
        
        // Test authentication
        console.log('Testing admin authentication...');
        const authResult = await User.authenticate('admin', 'admin123');
        
        if (authResult) {
            console.log('✅ Authentication successful: Admin user can login');
            console.log('Authenticated user:', authResult);
        } else {
            console.log('❌ Authentication failed: Admin user cannot login');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await database.close();
        console.log('Database connection closed.');
    }
}

resetDatabase();