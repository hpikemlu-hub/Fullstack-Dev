const database = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');

class User {
    static async create(userData) {
        const { username, password, nama, nip, golongan, jabatan, role = 'User' } = userData;
        
        console.log(`🔐 Creating user: ${username} with role: ${role}`);
        
        // Convert empty strings to null for optional fields
        const processedData = {
            username,
            password,
            nama,
            nip: nip && nip.trim() !== '' ? nip.trim() : null,
            golongan: golongan && golongan.trim() !== '' ? golongan.trim() : null,
            jabatan: jabatan && jabatan.trim() !== '' ? jabatan.trim() : null,
            role
        };
        
        // Check if password is provided
        if (!processedData.password) {
            throw new Error('Password is required');
        }
        
        // Check if user already exists
        try {
            const existingUser = await this.findByUsername(processedData.username);
            if (existingUser) {
                console.log(`⚠️ User ${processedData.username} already exists with ID: ${existingUser.id}`);
                throw new Error(`User ${processedData.username} already exists`);
            }
        } catch (error) {
            // If error is not about existing user, continue
            if (!error.message.includes('already exists')) {
                console.log(`ℹ️ Error checking for existing user: ${error.message}`);
            } else {
                throw error;
            }
        }
        
        // Hash password
        console.log(`🔐 Hashing password for user: ${processedData.username}`);
        const hashedPassword = await hashPassword(processedData.password);
        
        const sql = `
            INSERT INTO users (username, password, nama, nip, golongan, jabatan, role)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            processedData.username,
            hashedPassword,
            processedData.nama,
            processedData.nip,
            processedData.golongan,
            processedData.jabatan,
            processedData.role
        ];
        
        try {
            console.log(`💾 Inserting user ${processedData.username} into database`);
            const result = await database.run(sql, params);
            console.log(`✅ User ${processedData.username} created with ID: ${result.id}`);
            
            // Return the created user without password
            const createdUser = await this.findById(result.id);
            if (createdUser) {
                console.log(`✅ User ${processedData.username} retrieved from database`);
                return createdUser;
            } else {
                console.error(`❌ Failed to retrieve created user ${processedData.username} from database`);
                throw new Error(`Failed to retrieve created user ${processedData.username}`);
            }
        } catch (error) {
            console.error(`❌ Error creating user ${processedData.username}:`, error.message);
            throw error;
        }
    }
    
    // Special method to create admin user with enhanced error handling
    static async createAdminUser(adminData = null) {
        const defaultAdminData = {
            username: 'admin',
            password: 'admin123',
            nama: 'Administrator',
            role: 'Admin',
            nip: null,
            golongan: null,
            jabatan: null
        };
        
        const dataToUse = adminData || defaultAdminData;
        
        console.log('🔐 Creating admin user with enhanced error handling...');
        
        try {
            // Check if admin already exists
            const existingAdmin = await this.findByUsername('admin');
            if (existingAdmin) {
                console.log(`⚠️ Admin user already exists with ID: ${existingAdmin.id}`);
                return existingAdmin;
            }
            
            // Create admin user
            const adminUser = await this.create(dataToUse);
            
            // Verify admin user was created with correct role
            if (adminUser && adminUser.role === 'Admin') {
                console.log('✅ Admin user created and verified successfully');
                return adminUser;
            } else {
                throw new Error('Admin user was created but role verification failed');
            }
        } catch (error) {
            console.error('❌ Error creating admin user:', error.message);
            throw error;
        }
    }

    static async findById(id) {
        const sql = 'SELECT id, username, nama, nip, golongan, jabatan, role, created_at FROM users WHERE id = ?';
        return await database.get(sql, [id]);
    }

    static async findByUsername(username) {
        const sql = 'SELECT * FROM users WHERE username = ?';
        return await database.get(sql, [username]);
    }

    static async findAll(limit = 50, offset = 0) {
        const sql = `
            SELECT id, username, nama, nip, golongan, jabatan, role, created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        return await database.all(sql, [limit, offset]);
    }

    static async update(id, userData) {
        const { username, password, nama, nip, golongan, jabatan, role } = userData;
        
        // Build dynamic update query
        let updateFields = [];
        let updateValues = [];
        
        if (username !== undefined) {
            updateFields.push('username = ?');
            updateValues.push(username);
        }
        
        if (password !== undefined) {
            const hashedPassword = await hashPassword(password);
            updateFields.push('password = ?');
            updateValues.push(hashedPassword);
        }
        
        if (nama !== undefined) {
            updateFields.push('nama = ?');
            updateValues.push(nama);
        }
        
        if (nip !== undefined) {
            updateFields.push('nip = ?');
            updateValues.push(nip);
        }
        
        if (golongan !== undefined) {
            updateFields.push('golongan = ?');
            updateValues.push(golongan);
        }
        
        if (jabatan !== undefined) {
            updateFields.push('jabatan = ?');
            updateValues.push(jabatan);
        }
        
        if (role !== undefined) {
            updateFields.push('role = ?');
            updateValues.push(role);
        }
        
        if (updateFields.length === 0) {
            return await this.findById(id);
        }
        
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);
        
        const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        
        try {
            await database.run(sql, updateValues);
            return await this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    static async delete(id, force = false) {
        // Check if user has workloads (unless force delete)
        if (!force) {
            const workloadCount = await database.get('SELECT COUNT(*) as count FROM workloads WHERE user_id = ?', [id]);
            
            if (workloadCount.count > 0) {
                throw new Error('Cannot delete user with existing workloads');
            }
        }
        
        const sql = 'DELETE FROM users WHERE id = ?';
        const result = await database.run(sql, [id]);
        return result.changes > 0;
    }

    static async authenticate(username, password) {
        try {
            if (!username || !password) {
                console.error('Authentication error: Username and password are required');
                return null;
            }

            console.log(`Attempting to find user with username: ${username}`);
            const user = await this.findByUsername(username);
            
            if (!user) {
                console.error(`Authentication error: User with username '${username}' not found`);
                return null;
            }
            
            console.log(`User found, comparing passwords...`);
            console.log(`Input password length: ${password.length}`);
            console.log(`Stored password hash: ${user.password.substring(0, 20)}...`);
            
            const isMatch = await comparePassword(password, user.password);
            console.log(`Password comparison result: ${isMatch ? 'Match' : 'No match'}`);
            
            if (!isMatch) {
                console.error(`Authentication error: Invalid password for user '${username}'`);
                return null;
            }
            
            // Return user without password
            const { password: _, ...userWithoutPassword } = user;
            console.log(`User '${username}' authenticated successfully`);
            return userWithoutPassword;
        } catch (error) {
            console.error('Authentication error:', error);
            console.error('Error stack:', error.stack);
            return null;
        }
    }

    static async count() {
        const sql = 'SELECT COUNT(*) as total FROM users';
        const result = await database.get(sql);
        return result.total;
    }
}

module.exports = User;