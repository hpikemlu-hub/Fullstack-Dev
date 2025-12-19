#!/bin/bash

# Enhanced Docker entrypoint script for Workload Management App
# Handles permission issues for volume mounting in Dokploy

set -e

# Fungsi untuk log dengan timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Fungsi untuk cek dan fix permission
fix_permissions() {
    local dir=$1
    local user_id=${2:-1000}
    local group_id=${3:-1000}
    
    log "Checking directory: $dir"
    
    # Cek apakah direktori ada
    if [ ! -d "$dir" ]; then
        log "Directory $dir does not exist. Creating..."
        mkdir -p "$dir"
    fi
    
    # Cek ownership
    local current_uid=$(stat -c "%u" "$dir")
    local current_gid=$(stat -c "%g" "$dir")
    
    if [ "$current_uid" != "$user_id" ] || [ "$current_gid" != "$group_id" ]; then
        log "Fixing ownership for $dir (current: $current_uid:$current_gid, target: $user_id:$group_id)"
        
        # Coba fix ownership
        if chown "$user_id:$group_id" "$dir" 2>/dev/null; then
            log "Successfully changed ownership of $dir"
        else
            log "Warning: Could not change ownership of $dir. This might be expected in some environments."
            
            # Jika tidak bisa change ownership, coba set permission yang memungkinkan akses
            log "Setting permissive permissions instead..."
            chmod 777 "$dir" 2>/dev/null || log "Could not set permissions on $dir"
        fi
    fi
    
    # Set permission
    chmod 755 "$dir" 2>/dev/null || log "Could not set permissions on $dir"
    
    # Rekursif untuk subdirektori (dengan batasan depth untuk menghindari performance issues)
    find "$dir" -type d -maxdepth 2 -exec chmod 755 {} \; 2>/dev/null
    find "$dir" -type f -maxdepth 2 -exec chmod 644 {} \; 2>/dev/null
}

# Fungsi untuk cek dan fix permission untuk semua volume yang dibutuhkan
setup_volume_permissions() {
    log "Setting up volume permissions..."
    
    # Daftar direktori yang perlu diperiksa
    local directories=(
        "/app/uploads"
        "/app/logs"
        "/app/data"
        "/app/temp"
        "/app/public/uploads"
    )
    
    # User dan group ID (bisa dioverride dengan environment variables)
    local user_id=${PUID:-1000}
    local group_id=${PGID:-1000}
    
    log "Using UID: $user_id, GID: $group_id"
    
    # Cek dan fix permission untuk setiap direktori
    for dir in "${directories[@]}"; do
        fix_permissions "$dir" "$user_id" "$group_id"
    done
    
    # Special handling untuk database directory
    if [ -d "/app/data" ]; then
        log "Setting up database directory permissions..."
        find /app/data -type f -name "*.db" -exec chmod 664 {} \; 2>/dev/null
        find /app/data -type f -name "*.sqlite*" -exec chmod 664 {} \; 2>/dev/null
    fi
}

# Fungsi untuk cek apakah kita berjalan sebagai root
check_user() {
    local current_uid=$(id -u)
    log "Current user ID: $current_uid"
    
    if [ "$current_uid" = "0" ]; then
        log "Running as root. This might cause permission issues with mounted volumes."
        
        # Jika running sebagai root, kita bisa fix permission
        setup_volume_permissions
        
        # Jika PUID dan PGID diset, switch ke user tersebut
        if [ -n "$PUID" ] && [ -n "$PGID" ]; then
            log "Switching to user $PUID:$PGID"
            
            # Buat user jika belum ada
            if ! id "$PUID" &>/dev/null; then
                groupadd -g "$PGID" appuser 2>/dev/null || log "Could not create group"
                useradd -u "$PUID" -g "$PGID" -d /app -s /bin/bash appuser 2>/dev/null || log "Could not create user"
            fi
            
            # Set ownership aplikasi directory
            chown -R "$PUID:$PGID" /app 2>/dev/null || log "Could not change ownership of /app"
            
            # Switch ke user tersebut untuk menjalankan aplikasi
            exec gosu "$PUID:$PGID" "$@"
        fi
    else
        log "Running as non-root user. Checking if we have necessary permissions..."
        
        # Cek apakah kita bisa menulis ke direktori yang dibutuhkan
        local writable_dirs=0
        local total_dirs=0
        
        for dir in "/app/uploads" "/app/logs" "/app/data"; do
            if [ -d "$dir" ]; then
                total_dirs=$((total_dirs + 1))
                if [ -w "$dir" ]; then
                    writable_dirs=$((writable_dirs + 1))
                else
                    log "Warning: Cannot write to $dir"
                fi
            fi
        done
        
        if [ "$writable_dirs" -lt "$total_dirs" ]; then
            log "Warning: Some directories are not writable. This might cause issues."
            log "Consider running the container with proper volume permissions or as root with PUID/PGID set."
        fi
    fi
}

# Main execution
log "🐳 Starting Docker container setup with Enhanced Permission Handling..."

# Cek user dan setup permission
check_user

# Ensure database directory exists and has proper permissions
if [ ! -d "/app/data" ]; then
    log "📁 Creating database directory: /app/data"
    mkdir -p /app/data
fi

# Ensure logs directory exists
if [ ! -d "/app/logs" ]; then
    log "📁 Creating logs directory: /app/logs"
    mkdir -p /app/logs
fi

# Ensure uploads directory exists
if [ ! -d "/app/uploads" ]; then
    log "📁 Creating uploads directory: /app/uploads"
    mkdir -p /app/uploads
fi

# Set proper permissions
log "🔧 Setting directory permissions..."
chmod 755 /app/data 2>/dev/null || log "Could not set permissions on /app/data"
chmod 755 /app/logs 2>/dev/null || log "Could not set permissions on /app/logs"
chmod 755 /app/uploads 2>/dev/null || log "Could not set permissions on /app/uploads"

# Check if we can write to the data directory
if [ ! -w "/app/data" ]; then
    log "❌ Error: /app/data directory is not writable"
    log "Attempting to fix permissions..."
    chmod 777 /app/data 2>/dev/null || log "Could not fix permissions on /app/data"
    
    if [ ! -w "/app/data" ]; then
        log "❌ Error: Still cannot write to /app/data directory after attempting to fix permissions"
        exit 1
    fi
fi

# Check if database file exists
if [ -f "/app/data/database.sqlite" ]; then
    log "📝 Database file exists: /app/data/database.sqlite"
    
    # Check if database file is writable
    if [ ! -w "/app/data/database.sqlite" ]; then
        log "🔧 Fixing database file permissions..."
        chmod 664 /app/data/database.sqlite 2>/dev/null || log "Could not fix database file permissions"
    fi
else
    log "📝 Database file does not exist, will be created on startup"
fi

# Create a test file to verify write permissions
TEST_FILE="/app/data/.write_test_$$"
echo "test" > "$TEST_FILE" 2>/dev/null
if [ $? -eq 0 ]; then
    log "✅ Database directory is writable"
    rm -f "$TEST_FILE"
else
    log "❌ Error: Cannot write to database directory"
    log "Attempting to fix permissions..."
    chmod 777 /app/data 2>/dev/null || log "Could not fix permissions on /app/data"
    
    # Try again
    echo "test" > "$TEST_FILE" 2>/dev/null
    if [ $? -eq 0 ]; then
        log "✅ Database directory is now writable after fixing permissions"
        rm -f "$TEST_FILE"
    else
        log "❌ Error: Still cannot write to database directory after attempting to fix permissions"
        exit 1
    fi
fi

# Wait for MySQL service if using MySQL
wait_for_mysql() {
    if [ "${DB_TYPE}" = "mysql" ]; then
        log "🐬 Waiting for MySQL service to be ready..."
        
        local mysql_host=${DB_HOST:-localhost}
        local mysql_port=${DB_PORT:-3306}
        local max_attempts=30
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            log "🔍 Attempting to connect to MySQL at ${mysql_host}:${mysql_port} (attempt ${attempt}/${max_attempts})"
            
            # Try to connect to MySQL
            if command -v mysql >/dev/null 2>&1; then
                if mysql -h"${mysql_host}" -P"${mysql_port}" -u"${DB_USER}" -p"${DB_PASSWORD}" -e "SELECT 1" >/dev/null 2>&1; then
                    log "✅ MySQL service is ready!"
                    return 0
                fi
            else
                # Fallback to nc (netcat) if mysql client is not available
                if nc -z "${mysql_host}" "${mysql_port}" 2>/dev/null; then
                    log "✅ MySQL port is accessible!"
                    return 0
                fi
            fi
            
            log "⏳ MySQL not ready, waiting 5 seconds..."
            sleep 5
            attempt=$((attempt + 1))
        done
        
        log "❌ Error: MySQL service did not become ready after ${max_attempts} attempts"
        
        # Fallback to SQLite if MySQL is not available and fallback is enabled
        if [ "${MYSQL_FALLBACK_TO_SQLITE}" = "true" ]; then
            log "🔄 Falling back to SQLite database..."
            export DB_TYPE="sqlite"
            log "📊 Database type changed to: ${DB_TYPE}"
        else
            log "❌ Error: MySQL service is not available and fallback is disabled"
            exit 1
        fi
    else
        log "🗄️ Using SQLite database, no need to wait for MySQL"
    fi
}

# Run database migration if requested
run_database_migration() {
    if [ "${MIGRATE_TO_MYSQL}" = "true" ] && [ "${DB_TYPE}" = "mysql" ]; then
        log "🔄 Running SQLite to MySQL migration..."
        
        # Check if migration script exists
        if [ -f "/app/scripts/migrate-to-mysql.js" ]; then
            node /app/scripts/migrate-to-mysql.js
            if [ $? -eq 0 ]; then
                log "✅ Database migration completed successfully"
            else
                log "❌ Error: Database migration failed"
                exit 1
            fi
        else
            log "⚠️ Warning: Migration script not found at /app/scripts/migrate-to-mysql.js"
        fi
    fi
}

# Verify database connection
verify_database_connection() {
    log "🔍 Verifying database connection..."
    
    if [ "${DB_TYPE}" = "mysql" ]; then
        # Test MySQL connection
        if command -v mysql >/dev/null 2>&1; then
            if mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" -e "SELECT 1" "${DB_NAME}" >/dev/null 2>&1; then
                log "✅ MySQL connection verified successfully"
            else
                log "❌ Error: MySQL connection verification failed"
                exit 1
            fi
        else
            log "⚠️ Warning: MySQL client not available, skipping connection verification"
        fi
    else
        # Test SQLite connection
        if [ -f "${DB_PATH}" ] || [ -d "$(dirname "${DB_PATH}")" ]; then
            log "✅ SQLite database path accessible: ${DB_PATH}"
        else
            log "❌ Error: SQLite database path not accessible: ${DB_PATH}"
            exit 1
        fi
    fi
}

# Display environment information
log "🔧 Environment Information:"
log "   NODE_ENV: ${NODE_ENV:-development}"
log "   DB_TYPE: ${DB_TYPE:-sqlite}"
log "   DB_PATH: ${DB_PATH:-/app/data/database.sqlite}"
log "   DB_HOST: ${DB_HOST:-not set}"
log "   DB_PORT: ${DB_PORT:-not set}"
log "   DB_NAME: ${DB_NAME:-not set}"
log "   User ID: $(id -u)"
log "   Group ID: $(id -g)"
log "   PUID: ${PUID:-not set}"
log "   PGID: ${PGID:-not set}"

# Check if admin reset is requested
if [ "$RESET_ADMIN" = "true" ]; then
    log "🔐 Admin reset requested, running reset script..."
    node reset_admin_prod.js
fi

# Run migrations if requested
if [ "$RUN_MIGRATIONS" = "true" ]; then
    log "🔄 Running database migrations..."
    npm run migrate 2>/dev/null || log "Migration failed or not available"
fi

# Run seed data if requested
if [ "$RUN_SEED" = "true" ]; then
    log "🌱 Running database seeding..."
    npm run seed 2>/dev/null || log "Seeding failed or not available"
fi

# Wait for MySQL service if needed
wait_for_mysql

# Verify database connection
verify_database_connection

# Run database migration if requested
run_database_migration

# Check if admin reset is requested
if [ "$RESET_ADMIN" = "true" ]; then
    log "🔐 Admin reset requested, running reset script..."
    node reset_admin_prod.js
fi

# Run migrations if requested
if [ "$RUN_MIGRATIONS" = "true" ]; then
    log "🔄 Running database migrations..."
    npm run migrate 2>/dev/null || log "Migration failed or not available"
fi

# Run seed data if requested
if [ "$RUN_SEED" = "true" ]; then
    log "🌱 Running database seeding..."
    npm run seed 2>/dev/null || log "Seeding failed or not available"
fi

log "✅ Docker container setup complete"
log "🚀 Starting application..."

# Execute the command passed to this script
exec "$@"