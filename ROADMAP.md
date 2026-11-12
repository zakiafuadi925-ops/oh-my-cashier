# Oh My Cashier! — Product Development Roadmap

Dokumen ini memetakan rencana kerja, tonggak pencapaian (*milestones*), dan daftar fitur yang akan dikembangkan secara bertahap pada aplikasi **Oh My Cashier!**, disesuaikan untuk operasional industri F&B modern dengan estetika terminal-web (*Oh My Zsh theme*), berbasis web, dan siap di-*build* ke Android.

---

## 📌 Status Pengembangan Saat Ini (v1.26.6 — Stabil)

- [x] **Katalog Produk & Varian**: Pilihan menu, varian (ukuran, suhu es/panas, level pedas), harga jual, modal HPP, dan manajemen stok.
- [x] **Kasir & Point of Sale (POS)**: Pencarian cepat berbasis perintah terminal/prompt, filter kategori, pemindai barcode simulasi, keranjang belanja, nomor meja (Dine In), Take Away, dan Delivery.
- [x] **Sistem Pembayaran Kasir**: Pembayaran Tunai (dengan pecahan cepat & kalkulasi kembalian otomatis), QRIS dinamis, Kartu Debit/EDC, dan Transfer Bank.
- [x] **Struk & Nota Termal**: Format struk 58mm & 80mm bertema terminal, cetak printer thermal (`window.print`), dan kirim nota via WhatsApp.
- [x] **Riwayat Transaksi**: Arsip order, cetak ulang struk, dan pembatalan pesanan (*void*) dengan pengembalian stok otomatis.
- [x] **Manajemen Shift Kasir**: Modal awal laci kas, pelacakan penjualan tunai vs non-tunai, mutasi kas masuk/keluar, dan rekonsiliasi kas laci.
- [x] **Bahan Baku & Resep Dasar**: Daftar bahan mentah & olahan dengan ambang batas minimum stok kritis.
- [x] **Laporan & Analisis**: Ringkasan omset harian, laba kotor HPP, laporan produk terlaris, laporan margin, customer loyalty, dan ekspor Excel/CSV.
- [x] **Ketahanan Data (Offline-First)**: Penyimpanan permanen di `localStorage` browser dan proteksi anti-refresh tak sengaja.

---

## 🚀 Fase 2: Fitur Operasional Kasir & Meja Lanjutan (Selesai Dieksekusi)

Fase ini telah diimplementasikan dan aktif di aplikasi:

### 2.1 Cetak Tagihan Sementara (*Pre-Bill / Print Bill*)
- [x] Tombol **"Cetak Tagihan / Bill Meja"** di keranjang kasir sebelum transaksi diselesaikan.
- [x] Lembar tagihan berformat nota termal khusus meja tamu (*Guest Bill*) tanpa informasi nominal pembayaran/kembalian.
- [x] Cetak langsung printer thermal dan opsi bagikan tagihan sementara ke WhatsApp pelanggan.

### 2.2 Penjadwalan Pesanan & Tanggal Ambil (*Pre-Order / Pick-up Scheduling*)
- [x] Opsi **"Tanggal & Jam Pengambilan"** pada pesanan tipe *Take Away* dan *Pre-Order*.
- [x] Kalender pemilih tanggal ambil untuk pesanan katering atau pre-order terjadwal.
- [x] Filter tab pesanan di Riwayat: *Semua*, *Selesai*, *Pre-Order / Ambil Nanti*, dan *Dibatalkan*.
- [x] Progresi siklus pesanan: *Diproses* ➔ *Siap Diambil* ➔ *Selesai*.

### 2.3 Biaya Pengiriman (Ongkir) & Pembagian Pesanan Kurir
- [x] Kolom input **"Biaya Ongkos Kirim (Ongkir)"** otomatis dengan preset kilat (Gratis, 10rb, 15rb) saat memilih tipe *Delivery*.
- [x] Tombol pintas **"Bagikan ke Kurir/Ojol"** via WhatsApp berformat lengkap: nama penerima, alamat pengiriman, rincian pesanan, ongkir, dan total tagihan.

### 2.4 Keamanan Kasir: Kunci PIN & Otorisasi Supervisor
- [x] Layar modal PIN Keamanan (4–6 digit angka) untuk supervisor/manajer.
- [x] Otorisasi wajib manajer saat:
  - Membatalkan transaksi (*void order*).
  - Memberikan diskon khusus di atas 20% (Diskon 30% berlabel kunci 🔒).
  - Menghapus item produk pada menu manajemen.

### 2.5 Manajemen Meja & Pisah Tagihan (*Table Management & Split Bill*)
- [x] **Denah & Peta Meja Visual**: Pemetaan 20 meja (Meja 01–20) dengan indikator real-time: Meja Kosong (🟢 Tersedia) vs Meja Terisi (🔴 Open Bill aktif dengan timer tunggu, daftar menu, dan nominal tagihan).
- [x] **Simpan ke Meja (Open Bill / Hold Order)**: Kasir dapat mencatat pesanan Dine In, mengirim tiket ke Layar Dapur (KDS), dan menyimpan tagihan menggantung di meja tanpa harus langsung bayar.
- [x] **Pindah Meja (Transfer Table)**: Memindahkan pesanan dan status dapur dari Meja Asal ke Meja Tujuan dengan validasi meja kosong.
- [x] **Gabung Meja (Merge Tables)**: Menggabungkan tagihan dan menu dari dua meja terisi menjadi satu tagihan konsolidasi.
- [x] **Pisah Tagihan per Menu (Split by Items)**: Pembagian item makanan/minuman ke Sub-Bill A, Sub-Bill B, Sub-Bill C dengan cetak struk bertingkat (#0004-A, #0004-B) dan pembayaran mandiri per sub-bill.
- [x] **Pisah Tagihan Sama Rata (Equal Split by Persons)**: Membagi total tagihan meja ke sejumlah tamu (2–6 orang) secara proporsional dengan pembayaran multi-metode (Tunai, QRIS, Debit) per individu dan cetak slip per tamu.

---

## 📦 Fase 3: Inventaris & Manajemen Dapur Lanjutan (Selesai Dieksekusi)

Fase rantai pasok dan operasional dapur telah aktif:

### 3.1 Pemotongan Stok Bahan Baku Otomatis (*Recipe / Bill of Materials Deduction*)
- [x] Pengikatan komposisi resep pada tiap produk menu (BOM).
- [x] Pemotongan otomatis stok bahan mentah di dapur setiap kali menu tersebut terjual di kasir POS.
- [x] Pengembalian otomatis stok bahan baku jika pesanan dibatalkan (*void*).

### 3.2 Laporan Batch Expiry (Kedaluwarsa Bahan & Makanan)
- [x] Input nomor Batch/Lot, Tanggal Kedaluwarsa (*Expiry Date*), dan Nama Pemasok saat restok bahan baku.
- [x] Indikator visual bahan kedaluwarsa (Aman, Mendekati Expired, Kedaluwarsa).

---

## 🌐 Fase 4: Integrasi Perangkat Keras & Build Android (Capacitor)

### 4.1 Pemindaian Barcode Kamera Langsung (WebCam / Audio Laser Scanner)
- [x] Modal pemindai kamera barcode langsung dengan viewfinder laser target frame dan feedback audio bip kasir.

### 4.2 Layar Antrean Dapur & Barista (Kitchen Display System - KDS)
- [x] **Layar KDS Real-Time**: Antarmuka visual antrean dapur dengan pemisahan stasiun *Dapur (Makanan)* vs *Barista (Minuman)*.
- [x] **Timer & Urgensi Tunggu**: Penghitung durasi tunggu pesanan live.
- [x] **Cetak Tiket Dapur (KOT) & Label Stiker Cup Minuman (TSPL)**.

### 4.3 Integrasi Build Android (Capacitor Integration)
- [x] Inisialisasi konfigurasi Capacitor (`capacitor.config.ts`) dengan package ID `com.ohmycashier.pos`.
- [x] Validasi skema penyimpanan data lokal dengan Zod (`src/lib/storage.ts`) berprefix `omc_`.
- [ ] Penambahan platform Android (`npx cap add android`).
- [ ] Pengujian aplikasi web Oh My Cashier sebagai aplikasi native Android di perangkat fisik / emulator.
- [ ] Konfigurasi ikon aplikasi (*App Icon*) dan *Splash Screen* bertema terminal Oh My Zsh.

### 4.4 Cadangan & Pemulihan Basis Data Lengkap (*Complete JSON Backup & Restore*)
- [x] **Ekspor/Impor Cadangan Lengkap (.json)**: Menghasilkan berkas cadangan terstruktur berisi seluruh koleksi data kasir dan memulihkannya secara instan.

---

## 📊 Matriks Prioritas Pengerjaan

| Fitur | Dampak Operasional | Tingkat Kesulitan | Prioritas |
|---|---|---|---|
| **Cetak Tagihan Sementara (Pre-Bill)** | Tinggi | Rendah | ⭐⭐⭐⭐⭐ (Selesai) |
| **Manajemen Meja & Split Bill** | Sangat Tinggi | Tinggi | ⭐⭐⭐⭐⭐ (Selesai) |
| **Resep Pemotongan Bahan Otomatis** | Sangat Tinggi | Sedang | ⭐⭐⭐⭐ (Selesai) |
| **Setup Build Android (Capacitor)** | Tinggi | Sedang | ⭐⭐⭐⭐ (Prioritas Utama) |
| **Cloud Sync Multi-Device** | Sangat Tinggi | Tinggi | ⭐⭐ (Lanjutan) |
