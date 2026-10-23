# Spesifikasi UI Design & Layout - POS Retail Batik (`retail-flow`)

Dokumen ini memuat panduan perancangan antarmuka pengguna (UI/UX) dan pemetaan komponen terintegrasi dengan REST API backend `retail-flow`.

---

## 1. Modul Otentikasi (`/login`, `/register`)

### **A. Halaman Login (`/login`)**
* **Tujuan:** Memvalidasi akun kasir atau administrator sebelum masuk ke sistem POS.
* **Layout & Komponen:**
  * **Brand Header:** Logo toko batik, judul aplikasi, dan ilustrasi motif batik bernuansa modern/minimalis.
  * **Form Input:**
    * Input `username` / `email` (dengan placeholder dan validasi real-time).
    * Input `password` (dengan toggle show/hide password).
  * **Submit Button:** Tombol "Masuk ke Sistem POS" dengan indikator *loading spinner*.
* **Status & Error Handling:**
  * Peringatan kesalahan kredensial (`HTTP 401 Unauthorized`).
  * Pesan validasi form kosong (`HTTP 400 Bad Request`).
* **API Integration:** `POST /api/v1/auth/login`

### **B. Halaman Registrasi Pengguna (`/register`)**
* **Tujuan:** Penambahan akun kasir/admin baru (dapat diakses publik atau khusus role Admin).
* **Komponen:**
  * Form Field: Nama Lengkap, Email, Password, Konfirmasi Password, serta Dropdown Role (`ADMIN` / `CASHIER`).
* **API Integration:** `POST /api/v1/auth/register`

---

## 2. Terminals POS / Kasir Utama (`/pos`)

Halaman utama operasional transaksi kasir dengan antarmuka 2-kolom (*Split Screen Layout*).

```
+-----------------------------------------------------------------------+
|  TOP NAVBAR: Logo Toko | Search Bar (F2) | Role Badge | User Profile |
+------------------------------------+----------------------------------+
| KATALOG DIGITAL (60-70% Width)     | KERANJANG & CHECKOUT (30-40%)    |
|                                    |                                  |
| [ Filter Kategori / Size / Motif ] | [ Customer / Session Info ]      |
|                                    |                                  |
| +--------------------------------+ | +------------------------------+ |
| | Grid Card Produk               | | | List Item Terpilih           | |
| | - Thumbnail Batik              | | | - Nama Batik (Motif/Size)    | |
| | - SKU & Nama Produk            | | | - Qty (+ / - / input)       | |
| | - Harga (Rp)                   | | | - Subtotal Harga             | |
| | - Badge Stok (Merah/Kuning/Ijo)| | +------------------------------+ |
| +--------------------------------+ |                                  |
|                                    | Total & Tax Summary              |
|                                    | Selector: CASH|QRIS|DEBIT|TRANSFER|
|                                    | [ TOMBOL PROSES TRANSAKSI (F9) ] |
+------------------------------------+----------------------------------+
```

### **A. Top Navigation Bar**
* Status sesi pengguna (Nama Kasir, Badge Role: `CASHIER` / `ADMIN`).
* Indikator status jaringan/koneksi API.
* Shortcut Quick Help & Tombol Logout.

### **B. Area Katalog Digital (Sisi Kiri)**
* **Filter Bar:** Filter cepat berdasarkan kategori batik (Kemeja, Gaun, Kain), ukuran (S, M, L, XL, XXL), dan kotak pencarian nama/SKU.
* **Product Grid Card:**
  * Gambar/Thumbnail produk.
  * Tag SKU dan Nama Motif/Produk Batik.
  * Harga Produk terformat Rupiah (`Rp XX.XXX`).
  * **Stock Badge Dynamic:**
    * Hijau: Stok > 10
    * Kuning: Stok 1 - 10
    * Merah: Stok 0 (Card dalam kondisi *disabled*).
* **Interaksi:** Klik card menambah produk ke keranjang belanja (+1 quantity).
* **API Integration:** `GET /api/v1/products`

### **C. Area Keranjang & Ringkasan Checkout (Sisi Kanan)**
* **List Item:**
  * Nama produk & varian size.
  * Input kuantitas kuantitas cepat (`+`, `-`, atau edit angka secara langsung).
  * Tombol hapus item dari keranjang.
* **Ringkasan Pembayaran:**
  * Total Items & Total Kuantitas.
  * Subtotal & Nilai Pajak/Potongan.
  * **Grand Total (Font Besar & Kontras High)**.
* **Selection Metode Pembayaran:** Radio group/Tab pilihan `CASH`, `QRIS`, `TRANSFER`, `DEBIT`.
* **Action Button:** Tombol "Bayar / Selesaikan Transaksi" (Terhubung dengan shortcut `F9` / `Enter`).
* **API Integration:** `POST /api/v1/transactions`

### **D. Modal Struk Transaksi (Pasca Checkout)**
* Tampilan struk belanja digital.
* Detail No. Transaksi, Tanggal, Kasir, List Item, Total Bayar, Metode Pembayaran, dan Kembalian (jika tunai).
* Action Buttons: "Cetak Struk (PDF/Thermal Printer)" & "Transaksi Baru".

---

## 3. Modul Manajemen Produk & Stok (`/products`)

Khusus pengguna dengan Role `ADMIN`.

### **A. Tabel Data Produk**
* **Fitur:** Pagination, Sorting (Harga, Stok, Nama), dan Search.
* **Kolom Tabel:** SKU, Nama Produk, Kategori, Size, Harga Jual, Stok Saat Ini, Status, dan Aksi.
* **Action Header:** Tombol "Tambah Produk Baru".
* **Row Actions:** Tombol Edit (Buka Drawer/Modal) dan Tombol Hapus (dengan konfirmasi dialog modal).
* **API Integration:**
  * List: `GET /api/v1/products`
  * Hapus: `DELETE /api/v1/products/{id}`

### **B. Form Modal/Drawer Produk (Create & Edit)**
* **Field Input:**
  * SKU (Auto-generated atau Manual Input).
  * Nama Produk / Motif Batik.
  * Harga (Rp).
  * Jumlah Stok Awal.
* **API Integration:**
  * Tambah: `POST /api/v1/products`
  * Update: `PUT /api/v1/products/{id}`

---

## 4. Modul Riwayat Transaksi (`/transactions`)

### **A. Dashboard Riwayat & Filter**
* Filter Rentang Tanggal (Date Picker).
* Filter Status Transaksi (`COMPLETED`, `PENDING`, `CANCELLED`).
* Search berdasarkan ID Transaksi.

### **B. Tabel Riwayat**
* Kolom: ID Transaksi, Tanggal/Waktu, Kasir, Metode Pembayaran, Total Transaksi, Status Badge, dan Detail Action.
* **Drawer Detail Transaksi:** Mengklik baris transaksi membuka pane detail yang memanggil `GET /api/v1/transactions/{id}` untuk melihat rincian item (`TransactionDetail`).