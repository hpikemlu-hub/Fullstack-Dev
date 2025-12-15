const database = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');

class User {
    static async create(userData) {
        const { username, password, nama, nip, golongan, jabatan, role = 'User' } = userData;
        
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
        
        // Hash password
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
            const result = await database.run(sql, params);
            return await this.findById(result.id);
        } catch (error) {
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
        const user = await this.findByUsername(username);
        
        if (!user) {
            return null;
        }
        
        const isMatch = await comparePassword(password, user.password);
        
        if (!isMatch) {
            return null;
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    static async count() {
        const sql = 'SELECT COUNT(*) as total FROM users';
        const result = await database.get(sql);
        return result.total;
    }
}

module.exports = User;