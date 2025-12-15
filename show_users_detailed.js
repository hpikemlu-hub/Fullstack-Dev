const database = require('./src/config/database');
const sqlite3 = require('sqlite3').verbose();

async function displayDetailedUsers() {
    try {
        console.log('='.repeat(100));
        console.log('DATA LENGKAP PEGAWAI (USERS) - DATABASE WORKLOAD APP');
        console.log('='.repeat(100));
        
        // Connect to database directly
        const db = new sqlite3.Database('./database.sqlite');
        
        // First, show table structure
        console.log('\nSTRUKTUR TABEL USERS:');
        console.log('-'.repeat(50));
        
        await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(users)", (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    rows.forEach(row => {
                        console.log(`${row.name.padEnd(15)} | ${row.type.padEnd(20)} | ${row.notnull ? 'NOT NULL' : 'NULL'.padEnd(8)} | ${row.pk ? 'PRIMARY KEY' : ''}`);
                    });
                    resolve();
                }
            });
        });
        
        // Get all users with all fields
        console.log('\nDATA PEGAWAI LENGKAP:');
        console.log('-'.repeat(150));
        
        await new Promise((resolve, reject) => {
            db.all("SELECT * FROM users ORDER BY id", (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    if (rows.length === 0) {
                        console.log('Tidak ada data pegawai yang ditemukan dalam database.');
                        resolve();
                        return;
                    }
                    
                    console.log(`Jumlah total pegawai: ${rows.length}`);
                    console.log('-'.repeat(150));
                    
                    // Display table header
                    console.log('ID  | Username       | Password (Hash)                     | Nama                    | NIP            | Golongan | Jabatan             | Role      | Created At');
                    console.log('-'.repeat(150));
                    
                    // Display each user
                    rows.forEach(user => {
                        const id = String(user.id || '-').padEnd(3);
                        const username = String(user.username || '-').padEnd(14);
                        const password = String(user.password ? user.password.substring(0, 30) + '...' : '-').padEnd(35);
                        const nama = String(user.nama || '-').padEnd(23);
                        const nip = String(user.nip || '-').padEnd(14);
                        const golongan = String(user.golongan || '-').padEnd(8);
                        const jabatan = String(user.jabatan || '-').padEnd(19);
                        const role = String(user.role || '-').padEnd(9);
                        const createdAt = user.created_at ? new Date(user.created_at).toLocaleString('id-ID') : '-';
                        
                        console.log(`${id} | ${username} | ${password} | ${nama} | ${nip} | ${golongan} | ${jabatan} | ${role} | ${createdAt}`);
                    });
                    
                    console.log('-'.repeat(150));
                    
                    // Display summary by role
                    const roleSummary = {};
                    rows.forEach(user => {
                        const role = user.role || 'Unknown';
                        roleSummary[role] = (roleSummary[role] || 0) + 1;
                    });
                    
                    console.log('\nRINGKASAN BERDASARKAN ROLE:');
                    Object.entries(roleSummary).forEach(([role, count]) => {
                        console.log(`- ${role}: ${count} pegawai`);
                    });
                    
                    // Display summary by golongan
                    const golonganSummary = {};
                    rows.forEach(user => {
                        const golongan = user.golongan || 'Tidak ada';
                        golonganSummary[golongan] = (golonganSummary[golongan] || 0) + 1;
                    });
                    
                    console.log('\nRINGKASAN BERDASARKAN GOLONGAN:');
                    Object.entries(golonganSummary).forEach(([golongan, count]) => {
                        console.log(`- ${golongan}: ${count} pegawai`);
                    });
                    
                    // Display summary by jabatan
                    const jabatanSummary = {};
                    rows.forEach(user => {
                        const jabatan = user.jabatan || 'Tidak ada';
                        jabatanSummary[jabatan] = (jabatanSummary[jabatan] || 0) + 1;
                    });
                    
                    console.log('\nRINGKASAN BERDASARKAN JABATAN:');
                    Object.entries(jabatanSummary).forEach(([jabatan, count]) => {
                        console.log(`- ${jabatan}: ${count} pegawai`);
                    });
                    
                    resolve();
                }
            });
        });
        
        // Close database connection
        await new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('\nDatabase connection closed.');
                    resolve();
                }
            });
        });
        
    } catch (error) {
        console.error('Error mengambil data pegawai:', error.message);
        process.exit(1);
    }
}

// Run the function
displayDetailedUsers();