# Simple Volume Setup for Dokploy

## Overview

`simple-volume-setup.sh` adalah skrip bash yang sangat sederhana untuk membuat direktori yang diperlukan untuk volume mounting di Dokploy. Skrip ini dirancang untuk:

1. Sangat sederhana tanpa fungsi-fungsi kompleks
2. Fokus hanya pada pembuatan direktori dan pengaturan permission
3. Memberikan output yang jelas tentang apa yang sedang dilakukan
4. Memberikan instruksi untuk langkah selanjutnya di dashboard Dokploy

## Cara Menggunakan

1. Jalankan skrip dengan privileges root:
   ```bash
   sudo ./simple-volume-setup.sh
   ```

2. Skrip akan membuat direktori berikut:
   - `/opt/dokploy/volumes/workload-app/database`
   - `/opt/dokploy/volumes/workload-app/uploads`
   - `/opt/dokploy/volumes/workload-app/logs`
   - `/opt/dokploy/volumes/workload-app/backups`

3. Ikuti instruksi yang ditampilkan di akhir skrip untuk mengkonfigurasi volume mounting di dashboard Dokploy

## Fitur

- ✅ Tidak menggunakan fungsi-fungsi kompleks yang mungkin menyebabkan syntax error
- ✅ Langsung dapat dieksekusi tanpa error
- ✅ Memberikan output yang informatif
- ✅ Verifikasi direktori setelah pembuatan
- ✅ Instruksi lengkap untuk konfigurasi dashboard Dokploy

## Direktori yang Dibuat

| Volume | Host Path | Container Path |
|--------|-----------|----------------|
| Database | `/opt/dokploy/volumes/workload-app/database` | `/app/data` |
| Uploads | `/opt/dokploy/volumes/workload-app/uploads` | `/app/uploads` |
| Logs | `/opt/dokploy/volumes/workload-app/logs` | `/app/logs` |
| Backups | `/opt/dokploy/volumes/workload-app/backups` | `/app/backups` |

## Troubleshooting

Jika Anda mengalami masalah:
1. Pastikan Anda menjalankan skrip dengan `sudo`
2. Pastikan Anda memiliki akses tulis ke `/opt/dokploy/volumes`
3. Periksa output skrip untuk pesan error

## Catatan

- Skrip ini menggunakan permission 755 untuk semua direktori
- Semua direktori dimiliki oleh root:root
- Skrip akan menampilkan peringatan jika direktori sudah ada