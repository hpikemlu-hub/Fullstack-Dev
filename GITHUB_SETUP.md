# GitHub Setup Instructions

## Langkah 1: Buat Repository di GitHub

1. Login ke akun GitHub Anda
2. Klik tombol "+" di kanan atas dan pilih "New repository"
3. Beri nama repository: `workload-management-app`
4. Pilih "Public" atau "Private" sesuai kebutuhan
5. Jangan centang "Add a README file" (karena sudah ada)
6. Klik "Create repository"

## Langkah 2: Tambahkan Remote Repository

Setelah repository dibuat, GitHub akan menampilkan beberapa perintah. Gunakan perintah berikut:

```bash
cd workload-app
git remote add origin https://github.com/USERNAME/workload-management-app.git
```

Ganti `USERNAME` dengan username GitHub Anda.

## Langkah 3: Push ke GitHub

```bash
git push -u origin master
```

## Langkah 4: Verifikasi

Buka repository GitHub Anda di browser, Anda seharusnya melihat semua file dari aplikasi workload management.

## Catatan Tambahan

- Jika Anda menggunakan branch `main` bukan `master`, gunakan:
  ```bash
  git branch -M main
  git push -u origin main
  ```

- Jika diminta username dan password, gunakan Personal Access Token (PAT) bukan password GitHub Anda.

## Langkah 5: Siap untuk Deployment

Setelah kode ada di GitHub, Anda siap untuk melakukan deployment ke Dokploy dengan menghubungkan repository GitHub ke Dokploy.