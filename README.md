# RSBY LinkHub

Halaman tautan (link-in-bio) untuk **RSU Bhakti Yudha** dengan panel admin.
**Next.js 14 (App Router) + TypeScript + Tailwind + MongoDB Atlas + Cloudinary**, untuk di-deploy ke **Vercel**.

- Halaman publik: `/rsubhaktiyudha` (tanpa login)
- Panel admin: `/admin` (wajib login lewat `/login`)

## Urutan pengerjaan

1. [MongoDB Atlas](#1-membuat-mongodb-atlas)
2. [Cloudinary](#2-konfigurasi-cloudinary)
3. [File `.env.local`](#3-environment-variables)
4. [Install & cek build](#4-install-dan-cek-build)
5. [Membuat database](#5-membuat-database)
6. [Admin pertama](#6-membuat-admin-pertama)
7. [Pindah data lama (opsional)](#7-memindahkan-data-lama-opsional)
8. [GitHub](#8-upload-ke-github)
9. [Vercel](#9-deploy-ke-vercel)

Langkah 4-7 butuh terminal dengan **Node.js 20 atau lebih baru**. Tanpa memasang apa pun di komputer,
Anda bisa memakai **GitHub Codespaces**: upload dulu ke GitHub (langkah 8), lalu di halaman repository
pilih **Code > Codespaces > Create codespace**.

---

## 1. Membuat MongoDB Atlas

1. Daftar di https://www.mongodb.com/cloud/atlas lalu buat **Project** baru, mis. `RSBY`.
2. **Create cluster** > pilih tier gratis (M0) > provider AWS, region **Singapore** > beri nama > Create.
3. **Database Access > Add New Database User**: autentikasi *Password*, mis. user `rsby_app`,
   gunakan *Autogenerate Secure Password* dan simpan. Beri peran **Read and write to any database**,
   atau lebih ketat: *Specific privileges* `readWrite` pada database `rsby_linkhub`.
4. **Network Access > Add IP Address**:
   - Tambahkan IP komputer Anda untuk menjalankan script.
   - Vercel memakai IP yang berubah-ubah, sehingga perlu `0.0.0.0/0` (*Allow access from anywhere*).
     Karena akses jaringan jadi terbuka, **password database wajib panjang dan acak**.
5. **Connect > Drivers > Node.js**, salin connection string. Ganti `<password>` dengan password tadi.
   Jika password berisi karakter khusus, encode dulu (`@` menjadi `%40`, `#` menjadi `%23`).

Catatan: tier gratis berkapasitas kecil dan tidak menyediakan backup otomatis seperti tier berbayar.
Pantau pemakaian dan ekspor data secara berkala.

## 2. Konfigurasi Cloudinary

1. Daftar di https://cloudinary.com.
2. Buka **Dashboard** atau **Settings > API Keys**, salin **Cloud name**, **API Key**, dan **API Secret**.
3. Tidak perlu membuat *upload preset*. Unggahan ditandatangani di server.
4. Gambar masuk ke folder `rsby-linkhub/cover`, `rsby-linkhub/logo`, `rsby-linkhub/banner`.

Mengganti atau menghapus gambar di menu Desain tidak menghapus file lama di Cloudinary.

## 3. Environment variables

```bash
cp .env.example .env.local
```

| Nama | Isi | Rahasia |
|---|---|---|
| `MONGODB_URI` | connection string Atlas | Ya |
| `MONGODB_DB` | `rsby_linkhub` | Tidak |
| `AUTH_SECRET` | teks acak minimal 32 karakter | Ya |
| `NEXT_PUBLIC_SITE_URL` | URL situs tanpa `/` di akhir | Tidak |
| `CLOUDINARY_CLOUD_NAME` | cloud name | Tidak |
| `CLOUDINARY_API_KEY` | API key | Ya |
| `CLOUDINARY_API_SECRET` | API secret | Ya |

Membuat `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Jangan memberi awalan `NEXT_PUBLIC_` pada variabel rahasia.

## 4. Install dan cek build

```bash
npm install
npx tsc --noEmit
npm run build
npm run dev          # http://localhost:3000
```

`npm install` membuat `package-lock.json`. **Commit file itu** agar versi di Vercel sama dengan di komputer Anda.

## 5. Membuat database

```bash
npm run db:setup
```

Perintah ini membuat collection berikut, index-nya, dan pengaturan awal halaman. Aman dijalankan ulang.

| Collection | Isi |
|---|---|
| `users` | akun login (email, hash bcrypt, status, versi sesi) |
| `admins` | hak akses dan peran |
| `site_settings` | judul, deskripsi, gambar, warna, tampilan |
| `links` | tautan dan urutannya |
| `page_views` | kunjungan dan share |
| `link_clicks` | klik tautan |
| `audit_logs` | riwayat perubahan |
| `rate_limits` | rate limit dan dedupe (terhapus otomatis) |

## 6. Membuat admin pertama

```bash
npm run admin:create
```

Isi email, nama, peran, dan kata sandi (minimal 12 karakter, tidak tampil saat diketik).

| Peran | Akses |
|---|---|
| `admin` | semua fitur |
| `editor` | dashboard, tautan, analitik, bagikan (tanpa Desain dan Riwayat) |

- **Ganti kata sandi / peran:** jalankan lagi dengan email yang sama.
- **Menonaktifkan akun:** di Atlas > Browse Collections > `users`, ubah `is_active` menjadi `false`.
- Tidak ada halaman registrasi.

## 7. Memindahkan data lama (opsional)

Jalankan setelah `db:setup`, sebelum admin mulai mengubah data di aplikasi baru.

1. Jalankan `docs/export-data-lama.sql` di SQL Editor database lama.
2. Simpan hasil JSON sebagai `legacy-export.json` di folder project (sudah masuk `.gitignore`).
3. Jalankan:

```bash
npm run db:import -- legacy-export.json
```

4. Cocokkan jumlah yang ditampilkan dengan data lama. Jika SQL Editor memotong hasil yang sangat besar,
   file JSON akan gagal dibaca atau jumlahnya kurang.

Yang dipindahkan: pengaturan, tautan (ID sama), statistik, riwayat, serta cover dan logo (disalin ke
Cloudinary, jadi proyek lama harus masih aktif). **Akun login tidak dipindahkan**; buat ulang dengan langkah 6.
Hapus proyek lama hanya setelah aplikasi baru sudah diperiksa.

## 8. Upload ke GitHub

Buat repository kosong (disarankan **Private**) di https://github.com/new, lalu:

```bash
git init
git add .
git commit -m "RSBY LinkHub - MongoDB Atlas"
git branch -M main
git remote add origin https://github.com/USERNAME/rsby-linkhub.git
git push -u origin main
```

Tanpa terminal: klik **uploading an existing file** di halaman repository dan seret seluruh isi folder.

Jika memakai **repository lama**, hapus dulu semua file lama (kecuali folder `.git`) sebelum menyalin
project baru. Menimpa saja akan menyisakan file lama (misalnya `middleware.ts` di root dan library lama) dan
membuat build gagal.

## 9. Deploy ke Vercel

1. https://vercel.com > **Add New > Project** > pilih repository > **Import**. Framework: Next.js.
2. Di **Environment Variables**, isi ketujuh variabel pada langkah 3 untuk *Production*.
   Untuk *Preview*, pakai `MONGODB_DB` yang berbeda agar uji coba tidak mengubah data asli.
3. Klik **Deploy**.
4. Isi `NEXT_PUBLIC_SITE_URL` dengan URL hasil deploy (atau domain Anda), lalu **Redeploy**.
5. Buka `/rsubhaktiyudha` dan `/login`.

Setiap mengubah environment variable, lakukan **Redeploy**. `vercel.json` menaruh fungsi di Singapura (`sin1`).

**Domain sendiri:** Vercel > Settings > Domains > Add, ikuti record DNS yang ditampilkan, ubah
`NEXT_PUBLIC_SITE_URL`, Redeploy, lalu cetak ulang QR Code.

---

## Daftar uji setelah deploy

- [ ] `/rsubhaktiyudha` tampil tanpa login
- [ ] `/admin` di jendela penyamaran diarahkan ke `/login`
- [ ] Login benar berhasil; password salah ditolak
- [ ] Ubah judul, deskripsi, warna, lalu Simpan
- [ ] Unggah cover, logo, banner
- [ ] Tambah, edit, nonaktifkan, urutkan, dan hapus tautan
- [ ] Klik tautan di halaman publik, angka Analitik bertambah
- [ ] Menu Riwayat mencatat perubahan
- [ ] QR Code mengarah ke domain yang benar
- [ ] Logout, lalu `/admin` kembali meminta login

## Keamanan

- Semua akses database lewat server; `MONGODB_URI` dan API secret tidak dikirim ke browser.
- Password di-hash dengan bcrypt (cost 12).
- Sesi: cookie `HttpOnly`, `SameSite=Lax`, `Secure` di produksi, bertanda tangan, berlaku 8 jam.
  Logout mencabut **semua** sesi akun tersebut (di semua perangkat).
- Setiap API admin memeriksa sesi, peran, asal permintaan (CSRF), dan rate limit.
- Login dibatasi per 15 menit: 5 per IP+email, 20 per IP, 30 per email.
- Input divalidasi dengan Zod; unggahan gambar diperiksa isinya (maks. 4 MB).
- Perubahan data dan audit log disimpan dalam satu transaksi.

## Aturan statistik

| Statistik | Aturan |
|---|---|
| Kunjungan | 1x per 30 menit per pengunjung (cookie `rsby_vid`) |
| Pengunjung unik | jumlah pengunjung berbeda dalam periode |
| Klik | klik ganda di bawah 5 detik diabaikan |
| Dibagikan | maks. 1x per menit per pengunjung |
| Rate limit | 60 kejadian/menit per IP, 1200/menit global |
| Bot | crawler dan preview tautan tidak dihitung |
| Zona waktu | WIB; minggu mulai Senin |

## Pemecahan masalah

| Masalah | Solusi |
|---|---|
| "RSBY LinkHub belum siap" | Jalankan `npm run db:setup`; cek `MONGODB_URI` dan `MONGODB_DB`. |
| "Terjadi gangguan" / error 500 | Lihat Vercel > Logs. Biasanya Network Access Atlas, password di URI, atau `AUTH_SECRET` kurang dari 32 karakter. |
| Login selalu ditolak | Buat admin dengan `npm run admin:create` memakai `MONGODB_DB` yang sama dengan Vercel. |
| "Asal permintaan tidak diizinkan" | Buka situs lewat domain yang sama dengan yang melayani API (hindari proxy yang mengubah host). |
| Gagal unggah gambar | Cek tiga variabel Cloudinary, lalu Redeploy. |
