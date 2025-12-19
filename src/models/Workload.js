const database = require('../config/database');

class Workload {
    static async create(workloadData) {
        const { user_id, nama, type, deskripsi, status = 'New', tgl_diterima, fungsi } = workloadData;
        
        const sql = `
            INSERT INTO workloads (user_id, nama, type, deskripsi, status, tgl_diterima, fungsi)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        try {
            const result = await database.execute(sql, [user_id, nama, type, deskripsi, status, tgl_diterima, fungsi]);
            
            // Handle different database response formats
            const workloadId = result.insertId || result.id;
            return await this.findById(workloadId);
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        const sql = `
            SELECT w.*, u.nama as user_nama, u.username as user_username
            FROM workloads w
            LEFT JOIN users u ON w.user_id = u.id
            WHERE w.id = ?
        `;
        return await database.getOne(sql, [id]);
    }

    static async findAll(limit = 50, offset = 0, filters = {}) {
        let sql = `
            SELECT w.*, u.nama as user_nama, u.username as user_username
            FROM workloads w
            LEFT JOIN users u ON w.user_id = u.id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Add filters
        if (filters.user_id) {
            sql += ' AND w.user_id = ?';
            params.push(filters.user_id);
        }
        
        if (filters.status) {
            sql += ' AND w.status = ?';
            params.push(filters.status);
        }
        
        if (filters.type) {
            sql += ' AND w.type = ?';
            params.push(filters.type);
        }
        
        if (filters.search) {
            sql += ' AND (w.nama LIKE ? OR w.deskripsi LIKE ? OR w.fungsi LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        // Add ordering and pagination
        sql += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        return await database.query(sql, params);
    }

    static async findByUserId(userId, limit = 50, offset = 0) {
        const sql = `
            SELECT w.*, u.nama as user_nama, u.username as user_username
            FROM workloads w
            LEFT JOIN users u ON w.user_id = u.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
            LIMIT ? OFFSET ?
        `;
        return await database.query(sql, [userId, limit, offset]);
    }

    static async update(id, workloadData) {
        const { user_id, nama, type, deskripsi, status, tgl_diterima, fungsi } = workloadData;
        
        // Build dynamic update query
        let updateFields = [];
        let updateValues = [];
        
        if (user_id !== undefined) {
            updateFields.push('user_id = ?');
            updateValues.push(user_id);
        }
        
        if (nama !== undefined) {
            updateFields.push('nama = ?');
            updateValues.push(nama);
        }
        
        if (type !== undefined) {
            updateFields.push('type = ?');
            updateValues.push(type);
        }
        
        if (deskripsi !== undefined) {
            updateFields.push('deskripsi = ?');
            updateValues.push(deskripsi);
        }
        
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        
        if (tgl_diterima !== undefined) {
            updateFields.push('tgl_diterima = ?');
            updateValues.push(tgl_diterima);
        }
        
        if (fungsi !== undefined) {
            updateFields.push('fungsi = ?');
            updateValues.push(fungsi);
        }
        
        if (updateFields.length === 0) {
            return await this.findById(id);
        }
        
        // Only add updated_at for MySQL (SQLite has this as a column)
        if (database.isMySQL()) {
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
        }
        
        updateValues.push(id);
        
        const sql = `UPDATE workloads SET ${updateFields.join(', ')} WHERE id = ?`;
        
        try {
            await database.execute(sql, updateValues);
            return await this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        const sql = 'DELETE FROM workloads WHERE id = ?';
        const result = await database.execute(sql, [id]);
        
        // Handle different database response formats
        return (result.affectedRows || result.changes) > 0;
    }

    static async getWorkloadOptions() {
        const sql = `
            SELECT DISTINCT type, status, fungsi
            FROM workloads
            WHERE type IS NOT NULL OR status IS NOT NULL OR fungsi IS NOT NULL
        `;
        
        const results = await database.query(sql);
        
        // Group and extract unique values
        const options = {
            types: [...new Set(results.map(r => r.type).filter(Boolean))],
            statuses: [...new Set(results.map(r => r.status).filter(Boolean))],
            fungsi: [...new Set(results.map(r => r.fungsi).filter(Boolean))]
        };
        
        return options;
    }

    static async getStatistics(userId = null) {
        let sql = `
            SELECT
                status,
                COUNT(*) as count,
                COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'In Progress' THEN 1 END) in_progress,
                COUNT(CASE WHEN status = 'New' THEN 1 END) new_tasks
            FROM workloads
        `;
        
        const params = [];
        
        if (userId) {
            sql += ' WHERE user_id = ?';
            params.push(userId);
        }
        
        const results = await database.query(sql, params);
        
        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM workloads';
        let countParams = [];
        
        if (userId) {
            countSql += ' WHERE user_id = ?';
            countParams.push(userId);
        }
        
        const totalResult = await database.getOne(countSql, countParams);
        
        return {
            total: totalResult.total,
            by_status: results
        };
    }

    static async count(filters = {}) {
        let sql = 'SELECT COUNT(*) as total FROM workloads WHERE 1=1';
        const params = [];
        
        if (filters.user_id) {
            sql += ' AND user_id = ?';
            params.push(filters.user_id);
        }
        
        if (filters.status) {
            sql += ' AND status = ?';
            params.push(filters.status);
        }
        
        if (filters.type) {
            sql += ' AND type = ?';
            params.push(filters.type);
        }
        
        const result = await database.getOne(sql, params);
        return result.total;
    }
}

module.exports = Workload;