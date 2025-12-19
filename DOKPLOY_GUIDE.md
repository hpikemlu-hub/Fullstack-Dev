# Panduan Lengkap Deployment Aplikasi Workload Management di Dokploy

Panduan ini akan membantu Anda melakukan deployment aplikasi Workload Management System di platform Dokploy dengan langkah-langkah detail.

## Daftar Isi
1. [Prasyarat](#prasyarat)
2. [Membuat Aplikasi Baru di Dokploy](#membuat-aplikasi-baru-di-dokploy)
3. [Konfigurasi Build Command](#konfigurasi-build-command)
4. [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
5. [Deployment Process](#deployment-process)
6. [Troubleshooting](#troubleshooting)

## Prasyarat

Sebelum memulai, pastikan Anda memiliki:
- Akun Dokploy yang aktif
- Repository GitHub yang berisi kode aplikasi Workload Management
- Akses ke repository GitHub (read access)

## Membuat Aplikasi Baru di Dokploy

### Langkah 1: Login ke Dashboard Dokploy

1. Buka browser dan navigasikan ke `https://dokploy.com`
2. Login menggunakan akun Anda
3. Anda akan melihat dashboard utama Dokploy

### Langkah 2: Buat Proyek Baru

1. Klik tombol **"New Project"** di dashboard
2. Beri nama proyek Anda (misal: "Workload Management System")
3. Pilih organisasi jika Anda memiliki beberapa organisasi
4. Klik **"Create Project"**

### Langkah 3: Tambahkan Aplikasi Baru

1. Di dalam proyek yang baru dibuat, klik tombol **"New Application"**
2. Pilih tipe aplikasi **"Docker"** (karena kita menggunakan Dockerfile)
3. Beri nama aplikasi (misal: "workload-app")
4. Klik **"Create Application"**

### Langkah 4: Konfigurasi Source Code

1. Di halaman konfigurasi aplikasi, navigasikan ke tab **"Source"**
2. Pilih **"Git Repository"** sebagai sumber kode
3. Masukkan URL repository GitHub Anda:
   ```
   https://github.com/username/workload-app.git
   ```
4. Pilih branch yang akan di-deploy (misal: `main` atau `master`)
5. Jika repository private, masukkan kredensial GitHub:
   - GitHub Username: `username-github-anda`
   - GitHub Token: `personal-access-token-anda`
6. Klik **"Save"**

## Konfigurasi Build Command

### Langkah 1: Navigasi ke Tab Build

1. Klik tab **"Build"** di menu aplikasi Anda
2. Anda akan melihat berbagai opsi konfigurasi build

### Langkah 2: Konfigurasi Docker Build

```
📸 Screenshot Placeholder: Menu Build Configuration

[+] Build Configuration
├── Docker Context: ./
├── Dockerfile Path: ./Dockerfile
├── Build Args: (kosongkan)
└── Build Options: --no-cache
```

### Langkah 3: Set Path Konfigurasi

1. **Docker Context**: isi dengan `./`
2. **Dockerfile Path**: isi dengan `./Dockerfile`
3. **Build Args**: biarkan kosong
4. **Build Options**: isi dengan `--no-cache` (untuk build pertama)

### Langkah 4: Konfigurasi Port

1. Scroll ke bawah ke bagian **"Port"**
2. Set **Internal Port** ke `3000` (sesuai dengan EXPOSE di Dockerfile)
3. Set **External Port** atau biarkan otomatis (Dokploy akan menentukan)

```
📸 Screenshot Placeholder: Port Configuration

[+] Port Configuration
├── Internal Port: 3000
├── External Port: [Auto-assign]
└── Protocol: HTTP
```

## Konfigurasi Environment Variables

### Langkah 1: Navigasi ke Tab Environment

1. Klik tab **"Environment"** di menu aplikasi
2. Klik tombol **"Add Variable"** untuk setiap variabel

### Langkah 2: Tambahkan Environment Variables

Berikut adalah daftar environment variables yang diperlukan:

```
📸 Screenshot Placeholder: Environment Variables Configuration

[+] Environment Variables
├── NODE_ENV=production
├── PORT=3000
├── JWT_SECRET=your-super-secret-jwt-key-min-32-chars
├── CORS_ORIGIN=https://your-domain.dokploy.app
├── DB_PATH=/app/data/workload.db
└── LOG_LEVEL=info
```

### Detail Environment Variables:

1. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`
   - Purpose: Menentukan mode aplikasi

2. **PORT**
   - Key: `PORT`
   - Value: `3000`
   - Purpose: Port yang digunakan aplikasi

3. **JWT_SECRET**
   - Key: `JWT_SECRET`
   - Value: `buat-secret-key-minimal-32-karakter`
   - Purpose: Secret key untuk JWT authentication
   - **PENTING**: Gunakan string acak yang kuat!

4. **CORS_ORIGIN**
   - Key: `CORS_ORIGIN`
   - Value: `https://your-app-name.dokploy.app`
   - Purpose: Domain yang diizinkan untuk CORS
   - **CATATAN**: Ganti dengan domain Dokploy Anda

5. **DB_PATH**
   - Key: `DB_PATH`
   - Value: `/app/data/workload.db`
   - Purpose: Path database SQLite

6. **LOG_LEVEL**
   - Key: `LOG_LEVEL`
   - Value: `info`
   - Purpose: Level logging aplikasi

### Langkah 3: Persistent Storage

1. Navigasikan ke tab **"Storage"**
2. Klik **"Add Volume"**
3. Konfigurasi volume untuk database:

```
📸 Screenshot Placeholder: Storage Configuration

[+] Volume Configuration
├── Source Path: /app/data
├── Destination Path: /app/data
├── Type: Persistent
└── Size: 1GB
```

## Deployment Process

### Langkah 1: Trigger Deployment

1. Klik tab **"Deployments"**
2. Klik tombol **"Deploy Now"**
3. Dokploy akan mulai proses deployment

### Langkah 2: Monitor Deployment Process

```
📸 Screenshot Placeholder: Deployment Logs

[+] Deployment Logs
├── Cloning repository...
├── Building Docker image...
├── Running build commands...
├── Starting container...
└── Health check passed!
```

### Langkah 3: Verifikasi Deployment

1. Tunggu hingga proses deployment selesai
2. Klik URL aplikasi yang diberikan Dokploy
3. Verifikasi aplikasi berjalan dengan benar:
   - Buka halaman login
   - Coba akses beberapa halaman
   - Periksa console browser untuk error

### Langkah 4: Setup Domain (Opsional)

1. Navigasikan ke tab **"Domains"**
2. Klik **"Add Domain"**
3. Masukkan domain kustom Anda
4. Ikuti instruksi DNS yang diberikan Dokploy

## Troubleshooting

### Masalah 1: Build Gagal

**Gejala:** Deployment gagal pada tahap build

**Solusi:**
1. Periksa build logs untuk error spesifik
2. Pastikan Dockerfile berada di root repository
3. Verifikasi struktur file di repository:
   ```
   workload-app/
   ├── Dockerfile
   ├── package.json
   ├── server.js
   └── frontend/
       ├── package.json
       └── vite.config.js
   ```

**Common Build Errors:**
```
📸 Screenshot Placeholder: Build Error Logs

ERROR: failed to solve: process "/bin/sh -c npm run build" 
did not complete successfully: exit code: 1
```

**Fix:**
- Pastikan semua package.json ada
- Cek versi Node.js yang kompatibel
- Verifikasi tidak ada missing dependencies

### Masalah 2: Aplikasi Tidak Berjalan Setelah Deployment

**Gejala:** Container berhasil dibuat tapi aplikasi tidak responsif

**Solusi:**
1. Periksa application logs:
   ```
   📸 Screenshot Placeholder: Application Logs
   
   [+] Application Logs
   ├── Server starting on port 3000...
   ├── Database initialized successfully
   └── ERROR: listen EADDRINUSE :::3000
   ```

2. Common fixes:
   - Pastikan PORT di environment variables = 3000
   - Verifikasi tidak ada port conflict
   - Cek health configuration di Dockerfile

### Masalah 3: Database Error

**Gejala:** Error terkait database saat aplikasi berjalan

**Solusi:**
1. Pastikan volume storage terkonfigurasi dengan benar
2. Verifikasi path database di environment variables
3. Check database permissions:
   ```
   📸 Screenshot Placeholder: Database Error Logs
   
   ERROR: SQLITE_CANTOPEN: unable to open database file
   ```

**Fix:**
- Pastikan volume `/app/data` ter-mount dengan benar
- Verifikasi permissions untuk directory database
- Restart container setelah konfigurasi volume

### Masalah 4: CORS Error

**Gejala:** Frontend tidak bisa berkomunikasi dengan backend

**Solusi:**
1. Periksa CORS_ORIGIN di environment variables
2. Pastikan domain sesuai dengan URL Dokploy:
   ```
   📸 Screenshot Placeholder: CORS Error
   
   Access to fetch at 'https://your-app.dokploy.app/api/auth/login' 
   from origin 'https://your-app.dokploy.app' has been blocked by CORS policy
   ```

**Fix:**
- Set CORS_ORIGIN ke domain Dokploy yang benar
- Restart aplikasi setelah mengubah environment variables

### Masalah 5: Login Gagal

**Gejala:** Tidak bisa login ke aplikasi

**Solusi:**
1. Pastikan JWT_SECRET sudah di-set dengan benar
2. Verifikasi admin user sudah ada:
   ```
   📸 Screenshot Placeholder: Login Error
   
   {"error": "Invalid credentials"}
   ```

**Fix:**
- Reset admin user menggunakan script:
  ```bash
  # Connect ke container
  docker exec -it <container-id> sh
  
  # Run reset script
  node reset_admin.js
  ```

### Quick Reference Commands

**Check Container Status:**
```bash
# Di Dokploy terminal
docker ps
docker logs <container-id>
```

**Restart Application:**
1. Di dashboard Dokploy, klik tab **"Deployments"**
2. Klik tombol **"Restart"**

**Rebuild Application:**
1. Klik tab **"Deployments"**
2. Klik **"Deploy Now"** untuk rebuild dari awal

**Access Container Shell:**
1. Di tab **"Console"**, klik **"Open Shell"**
2. Anda akan mendapatkan akses ke container shell

## Tips Tambahan

### 1. Monitoring

- Gunakan tab **"Monitoring"** di Dokploy untuk:
  - CPU usage
  - Memory usage
  - Network traffic
  - Response time

### 2. Backup

- Konfigurasi automated backup untuk database:
  ```
  📸 Screenshot Placeholder: Backup Configuration
  
  [+] Backup Settings
  ├── Schedule: Daily at 2 AM
  ├── Retention: 7 days
  └── Storage: Dokploy Storage
  ```

### 3. SSL Certificate

- Dokploy otomatis menyediakan SSL certificate
- Pastikan domain sudah dikonfigurasi dengan benar

### 4. Scaling

- Untuk traffic tinggi, pertimbangkan:
  - Increase container resources
  - Load balancing
  - Database optimization

## Kontak Support

Jika Anda mengalami masalah yang tidak tercantum di panduan ini:

1. Periksa [Dokploy Documentation](https://dokploy.com/docs)
2. Submit ticket di [Dokploy Support](https://dokploy.com/support)
3. Check GitHub Issues untuk project ini

---

**Catatan:** Panduan ini dibuat berdasarkan struktur aplikasi Workload Management System saat ini. Pastikan untuk update panduan jika ada perubahan signifikan dalam struktur aplikasi atau konfigurasi deployment.