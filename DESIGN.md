# Oh My Cashier! (OMC) — System Design & Architecture Document

Dokumen ini mendokumentasikan filosofi desain, arsitektur visual, sistem antarmuka (UI/UX), arsitektur data, dan spesifikasi fungsional untuk **Oh My Cashier! (OMC)** — aplikasi Point of Sale (POS) F&B cross-platform (Web & Android Mobile/Tablet) bertema estetika *Terminal Shell / Oh My Zsh*.

---

## 1. Filosofi & Visi Desain

### 1.1 Tujuan Produk
**Oh My Cashier! (OMC)** meredefinisi sistem kasir F&B dengan menggabungkan kecepatan operasional POS modern dengan visual yang terinspirasi dari *Oh My Zsh / Terminal Theme* (Catppuccin/Dracula dark palette, prompt status badges, dan font monospace). 

Aplikasi ini dibangun menggunakan arsitektur **Web-First (React + Vite + Tailwind CSS)** yang dioptimalkan agar dapat berjalan mulus di browser desktop/tablet kasir, sekaligus siap di-package menjadi aplikasi native **Android (.apk / .aab)** menggunakan **Capacitor**.

### 1.2 Prinsip Desain Utama

* **Cross-Platform Efficiency (Web & Android Native):**
  * Responsif untuk layar Android Tablet (10"), HP Kasir Android (Portrait/Landscape), maupun Web Browser Desktop.
  * Mendukung interaksi *Touchscreen* (tombol berukuran $\ge 48\times48\text{ px}$) serta *Physical Keyboard Shortcuts* untuk operasional berkecepatan tinggi.
* **Estetika Terminal & Prompt Visuals:**
  * Penggunaan font Monospace presisi tinggi untuk seluruh nominal, item menu, dan status log transaksi.
  * *Prompt-style status segments* ala Oh My Zsh (`➜ ~ [DINE-IN] [MEJA-04] [ONLINE ⚡]`).
  * Tampilan kontras tinggi berlatar gelap (*Dark Mode Terminal*) yang nyaman di mata untuk shift kasir durasi panjang.
* **Offline-First & Hardware Ready (Android & Web):**
  * Operasional offline penuh berbasis `localStorage` / `IndexedDB`.
  * Integrasi cetak struk via Web Bluetooth API / Native Android Bluetooth Thermal Printer.

---

## 2. Sistem Desain Visual & Identitas Brand

### 2.1 Palet Warna (Terminal / Shell Theme)

| Token Warna | Nilai Hex | Penggunaan Utama |
| :--- | :--- | :--- |
| **Terminal Background** | `#1E1E2E` / `#181825` | Latar belakang kanvas utama (Base Theme) |
| **Terminal Surface** | `#313244` / `#45475A` | Latar belakang kartu menu, modal, dan drawer keranjang |
| **Prompt Green (Success)** | `#A6E3A1` / `#50FA7B` | Tanda pangkas `➜`, transaksi sukses, status shift Buka, badge tunai |
| **Prompt Blue (Primary CTA)** | `#89B4FA` / `#8BE9FD` | Header navigasi, tombol bayar utama, info meja/pelanggan |
| **Prompt Cyan (Accent)** | `#74C7EC` / `#00FFFF` | Kode transaksi, filter kategori aktif, aksen border |
| **Prompt Yellow (Warning)** | `#F9E2AF` / `#F1FA8C` | Peringatan stok menipis, diskon, status pending |
| **Prompt Red (Danger)** | `#F38BA8` / `#FF5555` | Void, stok habis, tombol hapus item, kas keluar |
| **Prompt Purple (Non-Cash)** | `#CBA6F7` / `#BD93F9` | Metode QRIS, Transfer Bank, status member VIP |
| **Text Primary (Foreground)**| `#CDD6F4` / `#F8F8F2` | Teks utama, deskripsi menu, nominal Rupiah |
| **Text Muted (Comment)** | `#6C7086` / `#6272A4` | Subteks, timestamp, catatan kustom, garis pembatas |

### 2.2 Tipografi & Format (Typography System)

* **Font Utama UI & Nominal:** `JetBrains Mono`, `Fira Code`, `Cascadia Code`, `ui-monospace`, `SFMono-Regular`, `Consolas`, `monospace`.
* **Karakter Khas Prompt:** `➜`, `❯`, `⚡`, `⚙`, `✔`, `✖`, ``, ``.
* **Format Mata Uang:** Standard Indonesia `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })` (contoh: `Rp 25.000`).

---

## 3. Arsitektur Antarmuka & Layout Mobile/Web

Aplikasi menyesuaikan tata letak secara dinamis sesuai ukuran layar:

```text
+-----------------------------------------------------------------------------------+
| ➜ ~ oh-my-cashier  [CASHIER@STORE-01]  [21:59:00 WIB]  [STATUS: SHIFT OPEN ⚡]     | (Prompt Header)
+----------+------------------------------------------------------+-----------------+
|          | $ search --category=all --query=""                   | $ cat ./cart.log|
| SIDEBAR  +------------------------------------------------------+-----------------+
| $ cd /   | [Grid Menu Produk & Minuman]                         | Tipe: [DINE-IN] |
|          |                                                      | Meja: #04       |
| - /pos   |  +------------+  +------------+  +------------+       | Cust: @walk-in  |
| - /log   |  | kopi_tubruk|  | es_teh_jumbo| | nasi_goreng|       | ----------------|
| - /menu  |  | Rp 10.000  |  | Rp 5.000   | | Rp 18.000  |       | 1x Kopi Tubruk  |
| - /stock |  +------------+  +------------+  +------------+       | 2x Es Teh Jumbo |
| - /shift |                                                      | ----------------|
| - /report|  +------------+  +------------+  +------------+       | Subtotal: 20k   |
| - /config|  | ayam_geprek|  | mendoan_pcs| | es_jeruk   |       | PPN (11%): 2.2k |
+----------+------------------------------------------------------+-----------------+
| $ system_status: OK | Storage: Local (Offline-Ready) | [EXECUTE / BAYAR (ENTER)]|
+-----------------------------------------------------------------------------------+
```

### 3.1 Prompt Header (Header Global)
* Brand **Oh My Cashier!** (`➜ ~ oh-my-cashier git:(main)`).
* User & Nama Gerai Kasir bertugas.
* Jam digital real-time dengan format ISO/Terminal Timestamp.
* Status shift kasir aktif dengan indikator koneksi `[ONLINE ⚡]`.

### 3.2 Navigation Sidebar / Bottom Bar
* **Desktop / Android Tablet:** Vertical Sidebar ala Terminal Navigasi.
* **Android Smartphone:** Bottom Navigation Bar khas mobile dengan akses cepat ke `/pos`, `/cart`, `/history`, dan `/menu`.

Navigasi mencakup 7 modul utama:
1. **`/pos` (ShoppingCart):** Konsol transaksi kasir dan keranjang belanja.
2. **`/history` (Receipt Log):** Arsip pesanan, cetak ulang nota, dan *void transaction*.
3. **`/products` (Package Catalog):** Katalog produk, HPP, stok, dan skanner barcode.
4. **`/ingredients` (Boxes Inventory):** Stok bahan baku mentah dan bahan olahan dapur.
5. **`/shift` (Clock Workstation):** Rekapitulasi kas masuk/keluar, modal laci, dan tutup shift.
6. **`/analytics` (BarChart3 Reports):** Laporan omset, laba kotor, item terlaris, dan poin pelanggan.
7. **`/config` (Settings System):** Profil toko, konfigurasi printer thermal, dan PPN.

---

## 4. Spesifikasi Modul Utama

### 4.1 Modul `/pos` (Kasir & Keranjang)
* **Search & Kategori:** Input prompt (`$ find --item <keyword>`) + Filter pills (`--all`, `--coffee`, `--food`, `--snack`).
* **Modal Varian:** Size (`--size`), Temperature (`--temp`), Spice Level (`--spice`), Custom Note (`--note`).
* **Cart Drawer (`./cart.log`):** Tipe Layanan (`Dine In`, `Take Away`, `Delivery`), Nomor Meja, Diskon, dan PPN 11%.

### 4.2 Checkout Modal (`$ sudo pay --method=<type>`)
* **Cash:** Tombol pecahan uang pas & kembalian instan.
* **QRIS:** QR Code dinamis dengan bingkai khas terminal + verifikasi transaksi.
* **EDC / Bank Transfer:** Pencatatan nomor referensi transaksi.

### 4.3 Struk Thermal ASCII (`./receipt.txt`)
* Format nota 58mm / 80mm dengan border ASCII ala terminal.
* Opsi Cetak: Web Print, Bluetooth Thermal Printer (Native Android Plugin / Web Bluetooth), dan Kirim WhatsApp.

---

## 5. Arsitektur Build & Target Deployment (Web + Android)

### 5.1 Tech Stack
* **Frontend Core:** React 19 / Svelte 5, TypeScript, Tailwind CSS v4.
* **Build Tool:** Vite 6.x.
* **Mobile Engine (Android):** Capacitor v6 (`@capacitor/core`, `@capacitor/android`).
* **Storage:** LocalStorage / IndexedDB (Persistensi Lintas Session).

### 5.2 Alur Build Android (Capacitor Integration)
1. **Build Web Assets:** `npm run build` (Menghasilkan folder `dist/`).
2. **Sync to Capacitor Android Project:** `npx cap sync android`.
3. **Build APK / Bundle:** `npx cap open android` (Melalui Android Studio) atau via CLI `cd android && ./gradlew assembleDebug` untuk menghasilkan berkas `.apk`.

### 5.3 Local Storage Keys (Prefix `omc_`)

| Kunci LocalStorage | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `omc_orders` | `Order[]` | Data pesanan dan riwayat transaksi |
| `omc_products` | `Product[]` | Katalog menu, harga, HPP, stok, dan barcode |
| `omc_categories` | `string[]` | Daftar kategori menu aktif |
| `omc_customers` | `Customer[]` | Data pelanggan & poin |
| `omc_ingredients` | `Ingredient[]` | Data bahan baku & batas minimum stok |
| `omc_shift` | `Shift` | Status shift aktif, log mutasi kas, & rekapitulasi |
| `omc_settings` | `StoreSettings` | Profil outlet, printer thermal, & PPN |
| `omc_active_cart` | `CartItem[]` | Draf keranjang aktif (persisten dari refresh) |
