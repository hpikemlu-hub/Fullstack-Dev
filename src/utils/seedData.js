const User = require('../models/User');
const Workload = require('../models/Workload');
const { hashPassword } = require('./passwordUtils');

class SeedData {
    static async seedUsers() {
        console.log('Seeding users...');
        
        const users = [
            {
                username: 'admin',
                password: 'admin123',
                nama: 'Administrator',
                nip: '198001012020011001',
                golongan: 'IV/a',
                jabatan: 'Kepala Seksi',
                role: 'Admin'
            },
            {
                username: 'john_doe',
                password: 'password123',
                nama: 'John Doe',
                nip: '199001012015011001',
                golongan: 'III/c',
                jabatan: 'Analis',
                role: 'User'
            },
            {
                username: 'jane_smith',
                password: 'password123',
                nama: 'Jane Smith',
                nip: '199501012018011001',
                golongan: 'III/b',
                jabatan: 'Staf',
                role: 'User'
            },
            {
                username: 'bob_wilson',
                password: 'password123',
                nama: 'Bob Wilson',
                nip: '199201012017011001',
                golongan: 'III/a',
                jabatan: 'Junior Analis',
                role: 'User'
            },
            {
                username: 'alice_brown',
                password: 'password123',
                nama: 'Alice Brown',
                nip: '199301012019011001',
                golongan: 'II/c',
                jabatan: 'Staf Administrasi',
                role: 'User'
            }
        ];

        const createdUsers = [];
        
        for (const userData of users) {
            try {
                // Check if user already exists
                const existingUser = await User.findByUsername(userData.username);
                if (!existingUser) {
                    const user = await User.create(userData);
                    createdUsers.push(user);
                    console.log(`Created user: ${user.username}`);
                } else {
                    createdUsers.push(existingUser);
                    console.log(`User already exists: ${existingUser.username}`);
                }
            } catch (error) {
                console.error(`Error creating user ${userData.username}:`, error.message);
            }
        }

        return createdUsers;
    }

    static async seedWorkloads() {
        console.log('Seeding workloads...');
        
        // Get users to assign workloads
        const users = await User.findAll(100, 0);
        
        if (users.length === 0) {
            console.log('No users found. Please seed users first.');
            return [];
        }

        const workloadTemplates = [
            {
                nama: 'Penyusunan Laporan Bulanan',
                type: 'Rutin',
                deskripsi: 'Menyusun laporan kegiatan bulanan untuk divisi',
                status: 'In Progress',
                fungsi: 'Pelaporan'
            },
            {
                nama: 'Evaluasi Program Kerja',
                type: 'Proyek',
                deskripsi: 'Melakukan evaluasi terhadap program kerja yang telah dilaksanakan',
                status: 'New',
                fungsi: 'Evaluasi'
            },
            {
                nama: 'Koordinasi dengan Instansi Lain',
                type: 'Rutin',
                deskripsi: 'Melakukan koordinasi dengan instansi terkait untuk sinergi program',
                status: 'Completed',
                fungsi: 'Koordinasi'
            },
            {
                nama: 'Pengembangan Sistem Informasi',
                type: 'Proyek',
                deskripsi: 'Mengembangkan sistem informasi untuk monitoring kegiatan',
                status: 'In Progress',
                fungsi: 'Pengembangan'
            },
            {
                nama: 'Penyusunan Rencana Strategis',
                type: 'Proyek',
                deskripsi: 'Menyusun rencana strategis untuk 5 tahun ke depan',
                status: 'New',
                fungsi: 'Perencanaan'
            },
            {
                nama: 'Monitoring dan Evaluasi',
                type: 'Rutin',
                deskripsi: 'Melakukan monitoring dan evaluasi terhadap kegiatan yang sedang berjalan',
                status: 'In Progress',
                fungsi: 'Monitoring'
            },
            {
                nama: 'Pelatihan SDM',
                type: 'Tambahan',
                deskripsi: 'Melakukan pelatihan untuk peningkatan kapasitas SDM',
                status: 'Completed',
                fungsi: 'Pelatihan'
            },
            {
                nama: 'Penyusunan Budget',
                type: 'Rutin',
                deskripsi: 'Menyusun anggaran tahunan untuk divisi',
                status: 'New',
                fungsi: 'Budgeting'
            },
            {
                nama: 'Audit Internal',
                type: 'Proyek',
                deskripsi: 'Melakukan audit internal untuk memastikan compliance',
                status: 'In Progress',
                fungsi: 'Audit'
            },
            {
                nama: 'Pengolahan Data Statistik',
                type: 'Rutin',
                deskripsi: 'Mengolah dan menganalisis data statistik kegiatan',
                status: 'Completed',
                fungsi: 'Analisis'
            }
        ];

        const createdWorkloads = [];
        
        for (const template of workloadTemplates) {
            try {
                // Assign random user to workload
                const randomUser = users[Math.floor(Math.random() * users.length)];
                
                // Generate random date within last 30 days
                const daysAgo = Math.floor(Math.random() * 30);
                const tgl_diterima = new Date();
                tgl_diterima.setDate(tgl_diterima.getDate() - daysAgo);
                
                const workloadData = {
                    ...template,
                    user_id: randomUser.id,
                    tgl_diterima: tgl_diterima.toISOString().split('T')[0]
                };

                const workload = await Workload.create(workloadData);
                createdWorkloads.push(workload);
                console.log(`Created workload: ${workload.nama} for ${randomUser.nama}`);
            } catch (error) {
                console.error(`Error creating workload ${template.nama}:`, error.message);
            }
        }

        return createdWorkloads;
    }

    static async seedAll() {
        console.log('Starting database seeding...');
        
        try {
            // Seed users first
            const users = await this.seedUsers();
            
            // Then seed workloads
            const workloads = await this.seedWorkloads();
            
            console.log('Database seeding completed!');
            console.log(`Created ${users.length} users`);
            console.log(`Created ${workloads.length} workloads`);
            
            return {
                users,
                workloads
            };
        } catch (error) {
            console.error('Error during seeding:', error);
            throw error;
        }
    }

    static async clearAll() {
        console.log('Clearing all data...');
        
        try {
            // Clear workloads first (due to foreign key constraint)
            await new Promise((resolve, reject) => {
                require('../config/database').run('DELETE FROM workloads', [], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            // Clear users
            await new Promise((resolve, reject) => {
                require('../config/database').run('DELETE FROM users', [], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            console.log('All data cleared successfully!');
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }
}

module.exports = SeedData;