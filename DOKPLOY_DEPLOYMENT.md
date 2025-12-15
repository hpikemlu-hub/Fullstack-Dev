# Deployment ke Dokploy

## Prasyarat

1. **Repository GitHub sudah ada**: Pastikan kode sudah di-push ke repository GitHub
2. **Akun Dokploy**: Anda memerlukan akun Dokploy (https://dokploy.com)

## Langkah 1: Push ke GitHub

Jika belum melakukannya, jalankan perintah berikut:

```bash
cd workload-app
git remote add origin https://github.com/hpikemlu-hub/Fullstack-Dev.git
git branch -M main
git push -u origin main
```

## Langkah 2: Setup di Dokploy

1. Login ke dashboard Dokploy
2. Klik tombol "New Application"
3. Pilih "GitHub" sebagai source
4. Authorize Dokploy untuk mengakses repository GitHub Anda
5. Pilih repository `Fullstack-Dev` dari daftar
6. Konfigurasi aplikasi:

### Konfigurasi Build

- **Build Context**: Root directory
- **Dockerfile Path**: `./Dockerfile`
- **Build Command**: `npm run build` (untuk frontend)
- **Start Command**: `npm start`

### Konfigurasi Environment

Tambahkan environment variables berikut:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=https://your-app-domain.dokploy.app
```

### Konfigurasi Database

Dokploy menyediakan beberapa opsi database:

1. **SQLite (Recommended untuk development)**:
   - Tidak perlu konfigurasi tambahan
   - Data akan tersimpan di container (akan hilang saat redeploy)

2. **PostgreSQL (Recommended untuk production)**:
   - Pilih "Add Database" > "PostgreSQL"
   - Catat connection string yang diberikan
   - Tambahkan environment variable:
     ```
     DATABASE_URL=postgresql://username:password@host:port/database
     ```

## Langkah 3: Deployment

1. Klik "Deploy" untuk memulai proses deployment
2. Dokploy akan:
   - Clone repository GitHub
   - Build Docker image
   - Deploy aplikasi

3. Tunggu proses deployment selesai (biasanya 2-5 menit)

## Langkah 4: Verifikasi

1. Buka URL aplikasi yang diberikan oleh Dokploy
2. Test fitur-fitur berikut:
   - Halaman login (http://your-app-url.dokploy.app)
   - API health check (http://your-app-url.dokploy.app/health)
   - Dashboard setelah login
   - CRUD operations untuk users dan workload

## Troubleshooting

### Jika deployment gagal:

1. **Check Logs**: Lihat build logs di dashboard Dokploy
2. **Common Issues**:
   - Port conflict: Pastikan menggunakan port 3000
   - Database connection: Periksa connection string
   - Environment variables: Pastikan semua variable didefinisikan

### Jika aplikasi tidak berjalan:

1. **Check Health Endpoint**: 
   ```bash
   curl https://your-app-url.dokploy.app/health
   ```
   
2. **Check Application Logs**: Lihat logs di dashboard Dokploy

## Post-Deployment

1. **Update Admin Password**:
   - Login dengan admin/admin123
   - Segera ganti password untuk keamanan

2. **Backup Database**:
   - Jika menggunakan PostgreSQL, setup regular backup
   - Jika menggunakan SQLite, export data secara berkala

3. **Monitor Performance**:
   - Monitor response time
   - Setup alerts jika diperlukan

## Custom Domain (Opsional)

Jika ingin menggunakan custom domain:

1. Pilih "Domains" di dashboard Dokploy
2. Tambahkan custom domain
3. Update DNS records sesuai instruksi Dokploy
4. Update CORS_ORIGIN environment variable

## Continuous Deployment

Dokploy otomatis akan redeploy saat:
- Push ke branch main
- Update environment variables
- Manual trigger dari dashboard

## Support

- Dokploy Documentation: https://docs.dokploy.com
- GitHub Issues: https://github.com/dokploy/dokploy/issues
- Community: https://discord.gg/dokploy