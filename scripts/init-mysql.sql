-- MySQL initialization script for Workload Management App
-- This script creates the database schema and initial data

-- Set character set and collation
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    nip VARCHAR(20),
    golongan VARCHAR(20),
    jabatan VARCHAR(100),
    role ENUM('Admin', 'User') DEFAULT 'User',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create workloads table
CREATE TABLE IF NOT EXISTS workloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    nama VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    deskripsi TEXT,
    status ENUM('New', 'In Progress', 'Completed', 'On Hold', 'Cancelled') DEFAULT 'New',
    tgl_diterima DATE,
    fungsi VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create default admin user (password: admin123)
-- Note: In production, this should be changed immediately after first login
INSERT IGNORE INTO users (id, username, password, nama, role) 
VALUES (1, 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'Admin');

-- Set foreign key checks back on
SET FOREIGN_KEY_CHECKS = 1;

-- Show table creation status
SELECT 'Users table created' as status;
SELECT 'Workloads table created' as status;
SELECT 'Default admin user created' as status;