# PANDUAN DEPLOYMENT RUMAH JAJANAN LASHIRA KE HOSTINGER (SHARED HOSTING)

Dokumen ini berisi panduan langkah demi langkah untuk mengunggah dan menjalankan aplikasi **Rumah Jajanan Lashira** pada layanan Shared Hosting (cPanel / hPanel Hostinger).

---

## 1. Persyaratan Sistem (System Requirements)
- **Web Server**: Apache / LiteSpeed (Standar Hostinger)
- **PHP Version**: PHP 8.1 / 8.2 / 8.3
- **Database**: MySQL 5.7+ atau MariaDB 10.4+
- **PHP Extensions Aktif**: `pdo`, `pdo_mysql`, `mbstring`, `json`, `gd`, `fileinfo`

---

## 2. Langkah-Langkah Instalasi di Hostinger

### Langkah 1: Buat Database MySQL di hPanel Hostinger
1. Masuk ke **hPanel Hostinger** (https://hpanel.hostinger.com).
2. Buka menu **Databases** -> **MySQL Databases**.
3. Masukkan:
   - **Database Name**: `u123456_lashira` (sesuaikan prefix akun Hostinger Anda)
   - **Username**: `u123456_admin`
   - **Password**: Buat password yang kuat (contoh: `LashiraSecure2026!`)
4. Klik tombol **Create / Buat**.

### Langkah 2: Import Schema Database (`database.sql`)
1. Di halaman **MySQL Databases**, klik **Enter phpMyAdmin** di samping database yang baru dibuat.
2. Pilih tab **Import** di menu atas phpMyAdmin.
3. Klik **Choose File** lalu pilih file `database/database.sql` dari project ini.
4. Klik tombol **Go / Kirim** di bagian bawah.
5. Pastikan semua tabel (`users`, `ingredients`, `products`, `recipes`, `productions`, `sales`, `expenses`, `stock_movements`, dll.) berhasil terbuat dengan pesan sukses berwarna hijau.

### Langkah 3: Konfigurasi Database Connection
Buka file `config/database.php` (atau file env hosting) dan sesuaikan kredensial:
```php
<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'u123456_admin'); // ganti dengan username DB hostinger Anda
define('DB_PASS', 'LashiraSecure2026!'); // ganti dengan password DB hostinger Anda
define('DB_NAME', 'u123456_lashira'); // ganti dengan nama DB hostinger Anda
```

### Langkah 4: Upload File ke Folder `public_html`
1. Buka **File Manager** di hPanel Hostinger.
2. Masuk ke direktori: `public_html/`.
3. Kompres/Zip file project aplikasi (folder `dist/` atau file aplikasi web).
4. Upload file ZIP ke `public_html/` lalu klik **Extract**.
5. Pastikan file `index.html` / `index.php` dan aset statis berada langsung di bawah `public_html/`.

### Langkah 5: Atur Permission Folder Uploads
1. Pastikan folder `uploads/` memiliki izin tulis (permissions):
   - Folder `uploads/products/` -> `755` atau `775`
   - Folder `uploads/receipts/` -> `755` atau `775`
   - Folder `uploads/settings/` -> `755` atau `775`

### Langkah 6: Aktifkan HTTPS / SSL Gratis
1. Di hPanel Hostinger, buka menu **Security** -> **SSL**.
2. Pastikan **Let's Encrypt SSL** aktif dan statusnya *Active*.
3. Aktifkan fitur **Force HTTPS** agar semua transaksi terenkripsi aman.

---

## 3. Akun Login Default
Setelah import database berhasil, gunakan kredensial berikut untuk login:

### Akun Super Admin:
- **Username / Email**: `superadmin` / `owner@rumahjajananlashira.com`
- **Password**: `lashira2026!`
- **Role**: Super Admin (Akses penuh seluruh fitur & pengaturan)

### Akun Admin Operasional:
- **Username / Email**: `admin` / `admin@rumahjajananlashira.com`
- **Password**: `admin123`
- **Role**: Admin (Kasir, Input Bahan, Produksi, Penjualan, Pengeluaran)

*Catatan Keamanan: Sangat disarankan untuk segera mengganti password default melalui menu Pengaturan Akun setelah login pertama.*

---

## 4. Fitur Utama Perhitungan Otomatis
- **Konversi Satuan & Harga Per Gram/ML**: Sistem otomatis menghitung harga satuan dasar (misal Rp 25.000 / 1 kg = Rp 25/gram).
- **HPP Resep**: Otomatis menjumlahkan biaya bahan baku + kemasan + tenaga kerja + listrik/gas + operasional dibagi jumlah output produksi.
- **Produksi & Stok Otomatis**: Mengurangi stok bahan baku secara proporsional dan menambah stok produk jadi secara aman dengan pengecekan stok minimum.
- **Kasir & Laba Penjualan**: Menghitung omzet, HPP modal penjualan, dan laba kotor per transaksi.
- **Laporan Laba Rugi**: Menghitung Pendapatan Bersih = Laba Kotor - Total Biaya Pengeluaran Operasional.

---

## 5. Backup & Restore Database
- **Backup Harian**: Buka phpMyAdmin -> Tab **Export** -> Format **SQL** -> Klik **Go**.
- **Download Langsung dari Aplikasi**: Pada menu **Pengaturan** di dashboard, Anda juga dapat mengklik tombol **"Download Backup Database SQL"**.
