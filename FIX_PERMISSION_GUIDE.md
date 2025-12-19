# Panduan Lengkap Mengatasi Error "Operation not permitted" pada Volume Mounting di Dokploy

## Daftar Isi
1. [Penjelasan Error "Operation not permitted"](#penjelasan-error)
2. [Langkah-langkah Memperbaiki Permission di Server Host](#memperbaiki-permission-host)
3. [Modifikasi Skrip docker-entrypoint.sh](#modifikasi-entrypoint)
4. [Konfigurasi Dockerfile yang Lebih Baik](#konfigurasi-dockerfile)
5. [Verifikasi Permission](#verifikasi-permission)
6. [Troubleshooting Tambahan](#troubleshooting)

---

<a name="penjelasan-error"></a>
## 1. Penjelasan Mengapa Error "Operation not permitted" Terjadi

Error "Operation not permitted" saat setup volume mounting di Dokploy biasanya terjadi karena:

### 1.1 Mismatch User ID antara Container dan Host
- Docker container berjalan dengan user ID yang berbeda dengan user di host
- Volume mounting mempertahankan permission dari host, bukan container
- Jika user di container tidak memiliki akses ke direktori di host, error akan terjadi

### 1.2 Permission File/Folder di Host
- Direktori yang di-mount mungkin memiliki permission yang terlalu ketat
- Owner direktori di host mungkin bukan user yang menjalankan container
- SELinux atau AppArmor mungkin memblokir akses

### 1.3 Context Docker Volume
- Docker volume yang dibuat dengan user tertentu tidak dapat diakses oleh user lain
- Volume yang dibuat sebelumnya mungkin memiliki permission yang tidak sesuai

### 1.4 Docker Security Constraints
- Docker daemon memiliki security constraints yang mencegah akses ke direktori tertentu
- Namespace isolation mungkin menyebabkan masalah permission

---

<a name="memperbaiki-permission-host"></a>
## 2. Langkah-langkah Memperbaiki Permission di Server Host

### 2.1 Identifikasi User ID di Container
Pertama, kita perlu tahu user ID yang digunakan di container:

```bash
# Jalankan container sementara untuk cek user ID
docker run --rm your-image-name id

# Atau cek di dalam container yang berjalan
docker exec -it your-container-name id
```

### 2.2 Set Permission Direktori Volume di Host

#### Opsi A: Menggunakan User ID yang Sama
```bash
# Misalkan user ID di container adalah 1000
sudo chown -R 1000:1000 /path/to/volume/directory
sudo chmod -R 755 /path/to/volume/directory
```

#### Opsi B: Menggunakan Group yang Sesuai
```bash
# Buat group dengan ID yang sama dengan container
sudo groupadd -g 1000 appgroup
sudo usermod -aG appgroup $USER
sudo chown -R :1000 /path/to/volume/directory
sudo chmod -R 775 /path/to/volume/directory
```

#### Opsi C: Menggunakan Sticky Bit untuk Shared Access
```bash
# Set permission untuk shared access
sudo chmod -R 2775 /path/to/volume/directory
sudo chown -R $USER:docker /path/to/volume/directory
```

### 2.3 Handle SELinux (Jika Aktif)
```bash
# Set SELinux context untuk volume
sudo semanage fcontext -a -t svirt_sandbox_file_t "/path/to/volume/directory(/.*)?"
sudo restorecon -R /path/to/volume/directory

# Atau disable SELinux sementara untuk testing
sudo setenforce 0
```

### 2.4 Verifikasi Permission
```bash
# Cek ownership dan permission
ls -la /path/to/volume/directory

# Test write access
sudo -u #1000 touch /path/to/volume/directory/testfile
```

---

<a name="modifikasi-entrypoint"></a>
## 3. Modifikasi Skrip docker-entrypoint.sh untuk Menangani Permission Issues

Berikut adalah modifikasi untuk `docker-entrypoint.sh` yang menangani permission issues:

```bash
#!/bin/bash

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
                groupadd -g "$PGID" appuser
                useradd -u "$PUID" -g "$PGID" -d /app -s /bin/bash appuser
            fi
            
            # Set ownership aplikasi directory
            chown -R "$PUID:$PGID" /app
            
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
log "Starting Docker Entrypoint with Permission Handling..."

# Cek user dan setup permission
check_user

# Jalankan setup aplikasi jika ada
if [ -f "/app/setup.sh" ]; then
    log "Running application setup script..."
    /bin/bash /app/setup.sh
fi

# Jalankan migrasi database jika diperlukan
if [ -n "$RUN_MIGRATIONS" ] && [ "$RUN_MIGRATIONS" = "true" ]; then
    log "Running database migrations..."
    npm run migrate 2>/dev/null || log "Migration failed or not available"
fi

# Jalankan seed data jika diperlukan
if [ -n "$RUN_SEED" ] && [ "$RUN_SEED" = "true" ]; then
    log "Running database seeding..."
    npm run seed 2>/dev/null || log "Seeding failed or not available"
fi

# Jalankan aplikasi
log "Starting application..."
exec "$@"
```

---

<a name="konfigurasi-dockerfile"></a>
## 4. Konfigurasi Dockerfile yang Lebih Baik untuk Menangani Permission

Berikut adalah contoh Dockerfile yang lebih robust untuk menangani permission issues:

```dockerfile
# Multi-stage build untuk optimasi size
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application jika diperlukan
# RUN npm run build

# Production stage
FROM node:18-alpine

# Install additional tools yang dibutuhkan
RUN apk add --no-cache \
    shadow \
    su-exec \
    curl \
    && rm -rf /var/cache/apk/*

# Create app user dengan UID/GID yang bisa dioverride
ARG PUID=1000
ARG PGID=1000

# Create group dan user
RUN addgroup -g ${PGID} -S appgroup && \
    adduser -S -u ${PUID} -G appgroup appuser

# Set working directory
WORKDIR /app

# Copy dependencies dari builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy application code
COPY --chown=appuser:appgroup . .

# Create directories yang dibutuhkan dengan proper ownership
RUN mkdir -p /app/uploads /app/logs /app/data /app/temp /app/public/uploads && \
    chown -R appuser:appgroup /app/uploads /app/logs /app/data /app/temp /app/public/uploads

# Set permission yang sesuai
RUN chmod -R 755 /app/uploads /app/logs /app/data /app/temp /app/public/uploads

# Copy entrypoint script
COPY --chown=appuser:appgroup docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch ke appuser
USER appuser

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PUID=${PUID}
ENV PGID=${PGID}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Default command
CMD ["node", "server.js"]
```

### 4.1 Docker Compose Configuration

Jika menggunakan Docker Compose, tambahkan konfigurasi berikut:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      args:
        PUID: ${PUID:-1000}
        PGID: ${PGID:-1000}
    environment:
      - PUID=${PUID:-1000}
      - PGID=${PGID:-1000}
      - NODE_ENV=production
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
      - ./data:/app/data
    user: "${PUID:-1000}:${PGID:-1000}"
```

---

<a name="verifikasi-permission"></a>
## 5. Verifikasi Steps untuk Memastikan Permission Sudah Benar

### 5.1 Verifikasi di Host
```bash
# Cek ownership dan permission
ls -la /path/to/volume/directory

# Cek apakah user ID sesuai
stat -c "%u %g" /path/to/volume/directory

# Test write access dari user container
sudo -u #1000 touch /path/to/volume/directory/test_write && rm /path/to/volume/directory/test_write
```

### 5.2 Verifikasi di Container
```bash
# Masuk ke container yang berjalan
docker exec -it your-container-name /bin/bash

# Cek user ID
id

# Cek permission direktori
ls -la /app/uploads /app/logs /app/data

# Test write access
touch /app/uploads/test_file && echo "Write test successful" && rm /app/uploads/test_file

# Cek log permission
echo "Test log entry" >> /app/logs/app.log

# Cek database access
ls -la /app/data
```

### 5.3 Verifikasi Aplikasi
```bash
# Test upload functionality melalui API
curl -X POST -F "file=@test.txt" http://localhost:3000/api/upload

# Cek log aplikasi
docker logs your-container-name

# Test database operations
curl http://localhost:3000/api/health
```

### 5.4 Automated Verification Script
```bash
#!/bin/bash
# verify_permissions.sh

CONTAINER_NAME=$1
VOLUME_PATH=$2

if [ -z "$CONTAINER_NAME" ] || [ -z "$VOLUME_PATH" ]; then
    echo "Usage: $0 <container_name> <volume_path>"
    exit 1
fi

echo "Verifying permissions for container: $CONTAINER_NAME"
echo "Volume path: $VOLUME_PATH"

# Get container user ID
CONTAINER_UID=$(docker exec $CONTAINER_NAME id -u)
CONTAINER_GID=$(docker exec $CONTAINER_NAME id -g)
echo "Container user: $CONTAINER_UID:$CONTAINER_GID"

# Check volume ownership
VOLUME_UID=$(stat -c "%u" "$VOLUME_PATH")
VOLUME_GID=$(stat -c "%g" "$VOLUME_PATH")
echo "Volume owner: $VOLUME_UID:$VOLUME_GID"

# Check if they match
if [ "$CONTAINER_UID" = "$VOLUME_UID" ] && [ "$CONTAINER_GID" = "$VOLUME_GID" ]; then
    echo "✓ Ownership matches"
else
    echo "✗ Ownership mismatch"
fi

# Test write access
echo "Testing write access..."
if docker exec $CONTAINER_NAME touch /app/uploads/permission_test 2>/dev/null; then
    echo "✓ Write access successful"
    docker exec $CONTAINER_NAME rm /app/uploads/permission_test
else
    echo "✗ Write access failed"
fi

# Test application functionality
echo "Testing application functionality..."
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo "✓ Application responding"
else
    echo "✗ Application not responding"
fi
```

---

<a name="troubleshooting"></a>
## 6. Troubleshooting Tambahan jika Masalah Masih Berlanjut

### 6.1 Common Issues dan Solutions

#### Issue 1: Permission Denied Meskipun Sudah Di-fix
**Symptoms:** Masih mendapatkan error permission meskipun sudah fix ownership
**Solutions:**
```bash
# Cek apakah ada process yang lock file
lsof +D /path/to/volume/directory

# Restart Docker daemon
sudo systemctl restart docker

# Coba dengan volume baru
docker volume create myapp_data
docker run -v myapp_data:/app/data your-image
```

#### Issue 2: SELinux Memblock Akses
**Symptoms:** Error terjadi hanya di sistem dengan SELinux aktif
**Solutions:**
```bash
# Cek SELinux status
sestatus

# Set SELinux context
sudo setsebool -P virt_use_fusefs on
sudo chcon -Rt svirt_sandbox_file_t /path/to/volume/directory

# Atau disable SELinux sementara
sudo setenforce 0
```

#### Issue 3: User ID Conflict
**Symptoms:** User ID di container conflict dengan user ID di host
**Solutions:**
```bash
# Gunakan user ID yang unik
docker run -e PUID=2000 -e PGID=2000 your-image

# Atau gunakan user ID yang sama dengan host
HOST_UID=$(id -u)
HOST_GID=$(id -g)
docker run -e PUID=$HOST_UID -e PGID=$HOST_GID your-image
```

#### Issue 4: Volume Mount Point Permission
**Symptoms:** Error saat mount volume ke direktori sistem
**Solutions:**
```bash
# Gunakan direktori yang aman
mkdir -p /home/user/app_data
sudo chown $USER:$USER /home/user/app_data

# Atau gunakan Docker volume
docker volume create app_data
docker run -v app_data:/app/data your-image
```

### 6.2 Debug Tools

#### Docker Inspect
```bash
# Inspect container details
docker inspect your-container-name

# Cek volume mounts
docker inspect --format='{{json .Mounts}}' your-container-name | jq '.'
```

#### Container Debug
```bash
# Run container dengan debugging
docker run --rm -it --entrypoint /bin/bash your-image

# Install debugging tools
apk add --no-cache strace lsof

# Trace system calls
strace -e trace=open,write,chmod,chown node server.js
```

### 6.3 Alternative Solutions

#### Solution A: Use Docker Volume Instead of Bind Mount
```bash
# Create Docker volume
docker volume create app_data

# Use volume in container
docker run -v app_data:/app/data your-image
```

#### Solution B: Use Init Container
```yaml
# Kubernetes style init container
apiVersion: v1
kind: Pod
spec:
  initContainers:
  - name: volume-permission-fix
    image: busybox
    command: ['sh', '-c', 'chown -R 1000:1000 /data']
    volumeMounts:
    - name: data-volume
      mountPath: /data
  containers:
  - name: app
    image: your-image
    volumeMounts:
    - name: data-volume
      mountPath: /app/data
  volumes:
  - name: data-volume
    hostPath:
      path: /path/to/host/data
```

#### Solution C: Use Entrypoint Wrapper
```bash
# wrapper.sh
#!/bin/bash

# Fix permissions before starting app
if [ -d "/app/data" ]; then
    find /app/data -type d -exec chmod 755 {} \;
    find /app/data -type f -exec chmod 644 {} \;
fi

# Start application
exec "$@"
```

### 6.4 Monitoring Permission Issues
```bash
# Monitor permission denied errors
docker logs your-container-name 2>&1 | grep -i "permission\|denied\|eacces"

# Monitor file access
auditctl -w /path/to/volume/directory -p rwx -k app_volume

# Check system logs
journalctl -u docker.service | tail -50
```

---

## Kesimpulan

Error "Operation not permitted" pada volume mounting di Dokploy biasanya disebabkan oleh mismatch permission antara container dan host. Solusi komprehensif meliputi:

1. **Identifikasi user ID** yang digunakan di container
2. **Set ownership yang sesuai** di direktori volume host
3. **Modifikasi entrypoint script** untuk menangani permission secara otomatis
4. **Konfigurasi Dockerfile** yang lebih robust dengan user management
5. **Verifikasi permission** secara menyeluruh
6. **Troubleshooting** untuk edge cases yang mungkin terjadi

Dengan mengikuti panduan ini, seharusnya dapat mengatasi sebagian besar masalah permission pada volume mounting di Dokploy.