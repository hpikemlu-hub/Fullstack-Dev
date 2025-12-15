const database = require('./src/config/database');
const User = require('./src/models/User');

async function displayAllUsers() {
    try {
        console.log('='.repeat(80));
        console.log('DATA PEGAWAI (USERS) - DATABASE WORKLOAD APP');
        console.log('='.repeat(80));
        
        // Initialize database connection
        await database.initialize();
        
        // Get all users
        const users = await User.findAll(1000, 0); // Get up to 1000 users
        
        if (users.length === 0) {
            console.log('Tidak ada data pegawai yang ditemukan dalam database.');
            return;
        }
        
        console.log(`Jumlah total pegawai: ${users.length}`);
        console.log('-'.repeat(80));
        
        // Display table header
        console.log('ID    | Username       | Nama                    | NIP            | Golongan | Jabatan             | Role      | Created At');
        console.log('-'.repeat(120));
        
        // Display each user
        users.forEach(user => {
            const id = String(user.id || '-').padEnd(5);
            const username = String(user.username || '-').padEnd(14);
            const nama = String(user.nama || '-').padEnd(23);
            const nip = String(user.nip || '-').padEnd(14);
            const golongan = String(user.golongan || '-').padEnd(8);
            const jabatan = String(user.jabatan || '-').padEnd(19);
            const role = String(user.role || '-').padEnd(9);
            const createdAt = user.created_at ? new Date(user.created_at).toLocaleString('id-ID') : '-';
            
            console.log(`${id} | ${username} | ${nama} | ${nip} | ${golongan} | ${jabatan} | ${role} | ${createdAt}`);
        });
        
        console.log('-'.repeat(80));
        
        // Display summary by role
        const roleSummary = {};
        users.forEach(user => {
            const role = user.role || 'Unknown';
            roleSummary[role] = (roleSummary[role] || 0) + 1;
        });
        
        console.log('\nRINGKASAN BERDASARKAN ROLE:');
        Object.entries(roleSummary).forEach(([role, count]) => {
            console.log(`- ${role}: ${count} pegawai`);
        });
        
        // Close database connection
        await database.close();
        
    } catch (error) {
        console.error('Error mengambil data pegawai:', error.message);
        process.exit(1);
    }
}


// Run the function
displayAllUsers();