# Panduan Setup Manual Volume Mounting untuk Dokploy

Panduan ini akan memandu Anda langkah demi langkah untuk membuat dan menjalankan skrip setup volume mounting langsung di server Anda tanpa perlu mengunduh dari GitHub.

## Persyaratan

- Akses SSH ke server dengan hak akses sudo
- Docker dan Docker Compose sudah terinstall
- Akses ke panel Dokploy

## Metode 1: Menggunakan Editor Nano (Disarankan untuk Pemula)

### Langkah 1: Buat File Skrip

Login ke server Anda melalui SSH dan jalankan perintah berikut untuk membuat file skrip:

```bash
nano setup-volume.sh
```

### Langkah 2: Salin dan Tempel Skrip Berikut

Salin seluruh konten skrip di bawah ini dan tempel ke dalam editor nano:

```bash
#!/bin/bash

# Skrip Setup Volume Mounting untuk Dokploy
# Dibuat untuk mempermudah konfigurasi volume pada aplikasi Dokploy

set -e

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fungsi untuk menampilkan pesan dengan warna
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fungsi untuk memeriksa apakah Docker berjalan
check_docker() {
    print_info "Memeriksa status Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker tidak berjalan. Silakan jalankan Docker terlebih dahulu."
        exit 1
    fi
    print_success "Docker berjalan dengan baik."
}

# Fungsi untuk membuat direktori yang diperlukan
create_directories() {
    print_info "Membuat direktori yang diperlukan..."
    
    # Direktori utama untuk aplikasi
    mkdir -p /opt/workload-app/data
    mkdir -p /opt/workload-app/uploads
    mkdir -p /opt/workload-app/logs
    mkdir -p /opt/workload-app/backups
    mkdir -p /opt/workload-app/config
    
    # Set permission
    chmod -R 755 /opt/workload-app
    
    print_success "Direktori berhasil dibuat di /opt/workload-app/"
}

# Fungsi untuk membuat file docker-compose dengan volume mounting
create_docker_compose() {
    print_info "Membuat file docker-compose.yml dengan konfigurasi volume..."
    
    cat > /opt/workload-app/docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    image: your-registry/workload-app:latest
    container_name: workload-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=database
      - DB_PORT=5432
      - DB_NAME=workload_db
      - DB_USER=workload_user
      - DB_PASSWORD=your_secure_password
      - JWT_SECRET=your_jwt_secret_key_here
      - JWT_EXPIRE=7d
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
      - ./logs:/app/logs
      - ./config:/app/config
    depends_on:
      - database
    networks:
      - workload-network

  database:
    image: postgres:15-alpine
    container_name: workload-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=workload_db
      - POSTGRES_USER=workload_user
      - POSTGRES_PASSWORD=your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - workload-network

volumes:
  postgres_data:

networks:
  workload-network:
    driver: bridge
EOF

    print_success "File docker-compose.yml berhasil dibuat."
}

# Fungsi untuk membuat file environment
create_env_file() {
    print_info "Membuat file .env untuk konfigurasi environment..."
    
    cat > /opt/workload-app/.env << 'EOF'
# Environment Variables for Workload App
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=workload_db
DB_USER=workload_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRE=7d

# File Upload Configuration
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760

# Logging Configuration
LOG_LEVEL=info
LOG_PATH=/app/logs
EOF

    print_success "File .env berhasil dibuat."
}

# Fungsi untuk membuat skrip backup otomatis
create_backup_script() {
    print_info "Membuat skrip backup otomatis..."
    
    cat > /opt/workload-app/backup.sh << 'EOF'
#!/bin/bash

# Skrip Backup Otomatis untuk Workload App
# Jalankan setiap hari menggunakan cron

BACKUP_DIR="/opt/workload-app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="workload-db"
DB_NAME="workload_db"
DB_USER="workload_user"

# Membuat direktori backup jika belum ada
mkdir -p $BACKUP_DIR

# Backup database
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup file uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C /opt/workload-app uploads

# Hapus backup yang lebih tua dari 7 hari
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup selesai: $DATE"
EOF

    chmod +x /opt/workload-app/backup.sh
    
    print_success "Skrip backup berhasil dibuat."
}

# Fungsi untuk menambahkan cron job untuk backup otomatis
setup_cron_job() {
    print_info "Mengatur cron job untuk backup otomatis..."
    
    # Cek apakah cron job sudah ada
    if ! crontab -l 2>/dev/null | grep -q "/opt/workload-app/backup.sh"; then
        # Tambahkan cron job untuk backup setiap hari jam 2 pagi
        (crontab -l 2>/dev/null; echo "0 2 * * * /opt/workload-app/backup.sh >> /opt/workload-app/logs/backup.log 2>&1") | crontab -
        print_success "Cron job untuk backup otomatis berhasil ditambahkan."
    else
        print_warning "Cron job untuk backup sudah ada."
    fi
}

# Fungsi untuk membuat file README
create_readme() {
    print_info "Membuat file README untuk dokumentasi..."
    
    cat > /opt/workload-app/README.md << 'EOF'
# Workload App dengan Volume Mounting

Direktori ini berisi konfigurasi untuk aplikasi Workload dengan volume mounting yang sudah diatur.

## Struktur Direktori

```
/opt/workload-app/
├── data/          # Data aplikasi
├── uploads/       # File yang diunggah pengguna
├── logs/          # Log aplikasi
├── backups/       # Backup database dan file
├── config/        # File konfigurasi
├── docker-compose.yml
├── .env
└── backup.sh
```

## Menjalankan Aplikasi

```bash
cd /opt/workload-app
docker-compose up -d
```

## Melakukan Backup Manual

```bash
cd /opt/workload-app
./backup.sh
```

## Melihat Log

```bash
# Log aplikasi
docker logs workload-app

# Log database
docker logs workload-db

# Log backup
tail -f /opt/workload-app/logs/backup.log
```

## Menghentikan Aplikasi

```bash
cd /opt/workload-app
docker-compose down
```
EOF

    print_success "File README.md berhasil dibuat."
}

# Fungsi utama
main() {
    echo "=========================================="
    echo "  Setup Volume Mounting untuk Dokploy"
    echo "=========================================="
    echo
    
    check_docker
    create_directories
    create_docker_compose
    create_env_file
    create_backup_script
    setup_cron_job
    create_readme
    
    echo
    print_success "Setup volume mounting selesai!"
    echo
    print_info "Langkah selanjutnya:"
    echo "1. Sesuaikan konfigurasi di /opt/workload-app/.env"
    echo "2. Perbarui image Docker di docker-compose.yml"
    echo "3. Jalankan aplikasi dengan: cd /opt/workload-app && docker-compose up -d"
    echo "4. Konfigurasi aplikasi di panel Dokploy"
    echo
    print_info "Dokumentasi lengkap tersedia di /opt/workload-app/README.md"
}

# Jalankan fungsi utama
main
```

### Langkah 3: Simpan File

Setelah menempel skrip di atas:
1. Tekan `Ctrl + X` untuk keluar dari nano
2. Tekan `Y` untuk menyimpan perubahan
3. Tekan `Enter` untuk konfirmasi nama file

### Langkah 4: Buat File Executable

Jalankan perintah berikut untuk membuat file skrip dapat dieksekusi:

```bash
chmod +x setup-volume.sh
```

### Langkah 5: Jalankan Skrip

Jalankan skrip dengan perintah:

```bash
sudo ./setup-volume.sh
```

## Metode 2: Menggunakan Cat (Alternatif)

Jika Anda tidak dapat menggunakan nano, Anda bisa menggunakan metode berikut:

### Langkah 1: Buat File dengan Cat

```bash
cat > setup-volume.sh << 'EOF'
#!/bin/bash

# Skrip Setup Volume Mounting untuk Dokploy
# Dibuat untuk mempermudah konfigurasi volume pada aplikasi Dokploy

set -e

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fungsi untuk menampilkan pesan dengan warna
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fungsi untuk memeriksa apakah Docker berjalan
check_docker() {
    print_info "Memeriksa status Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker tidak berjalan. Silakan jalankan Docker terlebih dahulu."
        exit 1
    fi
    print_success "Docker berjalan dengan baik."
}

# Fungsi untuk membuat direktori yang diperlukan
create_directories() {
    print_info "Membuat direktori yang diperlukan..."
    
    # Direktori utama untuk aplikasi
    mkdir -p /opt/workload-app/data
    mkdir -p /opt/workload-app/uploads
    mkdir -p /opt/workload-app/logs
    mkdir -p /opt/workload-app/backups
    mkdir -p /opt/workload-app/config
    
    # Set permission
    chmod -R 755 /opt/workload-app
    
    print_success "Direktori berhasil dibuat di /opt/workload-app/"
}

# Fungsi untuk membuat file docker-compose dengan volume mounting
create_docker_compose() {
    print_info "Membuat file docker-compose.yml dengan konfigurasi volume..."
    
    cat > /opt/workload-app/docker-compose.yml << 'EOD'
version: '3.8'

services:
  app:
    image: your-registry/workload-app:latest
    container_name: workload-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=database
      - DB_PORT=5432
      - DB_NAME=workload_db
      - DB_USER=workload_user
      - DB_PASSWORD=your_secure_password
      - JWT_SECRET=your_jwt_secret_key_here
      - JWT_EXPIRE=7d
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
      - ./logs:/app/logs
      - ./config:/app/config
    depends_on:
      - database
    networks:
      - workload-network

  database:
    image: postgres:15-alpine
    container_name: workload-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=workload_db
      - POSTGRES_USER=workload_user
      - POSTGRES_PASSWORD=your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - workload-network

volumes:
  postgres_data:

networks:
  workload-network:
    driver: bridge
EOD

    print_success "File docker-compose.yml berhasil dibuat."
}

# Fungsi untuk membuat file environment
create_env_file() {
    print_info "Membuat file .env untuk konfigurasi environment..."
    
    cat > /opt/workload-app/.env << 'EOD'
# Environment Variables for Workload App
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=workload_db
DB_USER=workload_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRE=7d

# File Upload Configuration
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760

# Logging Configuration
LOG_LEVEL=info
LOG_PATH=/app/logs
EOD

    print_success "File .env berhasil dibuat."
}

# Fungsi untuk membuat skrip backup otomatis
create_backup_script() {
    print_info "Membuat skrip backup otomatis..."
    
    cat > /opt/workload-app/backup.sh << 'EOD'
#!/bin/bash

# Skrip Backup Otomatis untuk Workload App
# Jalankan setiap hari menggunakan cron

BACKUP_DIR="/opt/workload-app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="workload-db"
DB_NAME="workload_db"
DB_USER="workload_user"

# Membuat direktori backup jika belum ada
mkdir -p $BACKUP_DIR

# Backup database
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup file uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C /opt/workload-app uploads

# Hapus backup yang lebih tua dari 7 hari
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup selesai: $DATE"
EOD

    chmod +x /opt/workload-app/backup.sh
    
    print_success "Skrip backup berhasil dibuat."
}

# Fungsi untuk menambahkan cron job untuk backup otomatis
setup_cron_job() {
    print_info "Mengatur cron job untuk backup otomatis..."
    
    # Cek apakah cron job sudah ada
    if ! crontab -l 2>/dev/null | grep -q "/opt/workload-app/backup.sh"; then
        # Tambahkan cron job untuk backup setiap hari jam 2 pagi
        (crontab -l 2>/dev/null; echo "0 2 * * * /opt/workload-app/backup.sh >> /opt/workload-app/logs/backup.log 2>&1") | crontab -
        print_success "Cron job untuk backup otomatis berhasil ditambahkan."
    else
        print_warning "Cron job untuk backup sudah ada."
    fi
}

# Fungsi untuk membuat file README
create_readme() {
    print_info "Membuat file README untuk dokumentasi..."
    
    cat > /opt/workload-app/README.md << 'EOD'
# Workload App dengan Volume Mounting

Direktori ini berisi konfigurasi untuk aplikasi Workload dengan volume mounting yang sudah diatur.

## Struktur Direktori

```
/opt/workload-app/
├── data/          # Data aplikasi
├── uploads/       # File yang diunggah pengguna
├── logs/          # Log aplikasi
├── backups/       # Backup database dan file
├── config/        # File konfigurasi
├── docker-compose.yml
├── .env
└── backup.sh
```

## Menjalankan Aplikasi

```bash
cd /opt/workload-app
docker-compose up -d
```

## Melakukan Backup Manual

```bash
cd /opt/workload-app
./backup.sh
```

## Melihat Log

```bash
# Log aplikasi
docker logs workload-app

# Log database
docker logs workload-db

# Log backup
tail -f /opt/workload-app/logs/backup.log
```

## Menghentikan Aplikasi

```bash
cd /opt/workload-app
docker-compose down
```
EOD

    print_success "File README.md berhasil dibuat."
}

# Fungsi utama
main() {
    echo "=========================================="
    echo "  Setup Volume Mounting untuk Dokploy"
    echo "=========================================="
    echo
    
    check_docker
    create_directories
    create_docker_compose
    create_env_file
    create_backup_script
    setup_cron_job
    create_readme
    
    echo
    print_success "Setup volume mounting selesai!"
    echo
    print_info "Langkah selanjutnya:"
    echo "1. Sesuaikan konfigurasi di /opt/workload-app/.env"
    echo "2. Perbarui image Docker di docker-compose.yml"
    echo "3. Jalankan aplikasi dengan: cd /opt/workload-app && docker-compose up -d"
    echo "4. Konfigurasi aplikasi di panel Dokploy"
    echo
    print_info "Dokumentasi lengkap tersedia di /opt/workload-app/README.md"
}

# Jalankan fungsi utama
main
EOF
```

### Langkah 2: Buat File Executable

```bash
chmod +x setup-volume.sh
```

### Langkah 3: Jalankan Skrip

```bash
sudo ./setup-volume.sh
```

## Troubleshooting

### Error: Permission Denied

Jika Anda mengalami error "Permission denied", pastikan Anda menggunakan sudo:

```bash
sudo ./setup-volume.sh
```

Atau periksa permission file:

```bash
ls -la setup-volume.sh
```

File harus memiliki permission executable (x).

### Error: Docker Not Running

Jika Docker tidak berjalan, jalankan perintah berikut:

```bash
# Untuk sistem dengan systemd
sudo systemctl start docker
sudo systemctl enable docker

# Untuk memeriksa status
sudo systemctl status docker
```

### Error: Directory Already Exists

Jika direktori sudah ada, skrip akan tetap berjalan. Jika Anda ingin menghapus konfigurasi lama:

```bash
sudo rm -rf /opt/workload-app
```

Kemudian jalankan kembali skrip setup.

### Error: nano: Command Not Found

Jika nano tidak tersedia, gunakan alternatif:

```bash
# Gunakan vi
vi setup-volume.sh

# Atau gunakan vim
vim setup-volume.sh

# Atau gunakan metode cat yang dijelaskan di atas
```

### Error: Port Already in Use

Jika port 3000 sudah digunakan:

1. Cek proses yang menggunakan port 3000:
   ```bash
   sudo netstat -tulpn | grep :3000
   ```

2. Hentikan proses tersebut atau ubah port di docker-compose.yml

### Error: Database Connection Failed

Jika koneksi database gagal:

1. Periksa container database berjalan:
   ```bash
   docker ps | grep workload-db
   ```

2. Periksa log database:
   ```bash
   docker logs workload-db
   ```

3. Pastikan password di .env dan docker-compose.yml sama

## Verifikasi Setup

Setelah menjalankan skrip, verifikasi setup dengan perintah berikut:

```bash
# Periksa struktur direktori
ls -la /opt/workload-app/

# Periksa file konfigurasi
cat /opt/workload-app/docker-compose.yml

# Periksa cron job
crontab -l | grep backup

# Jalankan aplikasi
cd /opt/workload-app
docker-compose up -d

# Periksa container yang berjalan
docker ps
```

## Langkah Selanjutnya

Setelah setup selesai:

1. Sesuaikan konfigurasi di `/opt/workload-app/.env`
2. Perbarui image Docker di `docker-compose.yml` dengan image yang benar
3. Jalankan aplikasi: `cd /opt/workload-app && docker-compose up -d`
4. Konfigurasi aplikasi di panel Dokploy menggunakan direktori `/opt/workload-app`

## Bantuan Tambahan

Jika Anda mengalami masalah yang tidak tercantum di sini:

1. Periksa log sistem: `journalctl -xe`
2. Periksa log Docker: `sudo journalctl -u docker`
3. Periksa disk space: `df -h`
4. Periksa memory: `free -h`

Untuk bantuan lebih lanjut, hubungi tim support atau lihat dokumentasi lengkap di `/opt/workload-app/README.md`.