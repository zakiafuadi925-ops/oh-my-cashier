# ⚡ Oh My Cashier! (OMC)

> **Modern F&B Point of Sale (POS) & Kitchen System** dengan estetika antarmuka *Terminal Shell / Oh My Zsh* (Catppuccin Dark Palette, Prompt Badges, Monospace Precision).  
> Built for Web (PWA) & Android Mobile/Tablet Native.

[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite 6](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Capacitor v6](https://img.shields.io/badge/Capacitor-Android_Native-1192E8?style=for-the-badge&logo=capacitor)](https://capacitorjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 💻 Visual & Konsep

**Oh My Cashier!** meredefinisi pengalaman kasir F&B dengan menyatukan kejelasan operasional POS modern dan kecepatan akses bernuansa terminal *developer-centric*. 

```text
➜ ~ oh-my-cashier  [CASHIER@STORE-01]  [22:00:00 WIB]  [STATUS: SHIFT OPEN ⚡]
$ search --category=all --query=""                     $ cat ./cart.log
+----------------------------------------------------+ +-----------------+
| [Grid Menu & Minuman]                              | | Type: [DINE-IN] |
|                                                    | | Table: #04      |
| [Kopi Tubruk]     [Es Teh Jumbo]    [Nasi Goreng]  | | Cust: @walk-in  |
| Rp 10.000         Rp 5.000          Rp 18.000      | | ----------------|
|                                                    | | 1x Kopi Tubruk  |
| [Ayam Geprek]     [Mendoan Pcs]     [Es Jeruk]     | | 2x Es Teh Jumbo |
+----------------------------------------------------+ +-----------------+
$ system_status: OK | Storage: Local (Offline-Ready)   | [EXECUTE / BAYAR]
```

---

## ✨ Fitur Utama

### 🛒 1. Point of Sale (POS) & Checkout
* **Prompt Search & Filter**: Pencarian cepat item menu, kode barcode, dan kustomisasi varian (ukuran, suhu es/panas, level pedas, catatan khusus).
* **Multi-Payment Options**: Tunai (pecahan uang pas & kembalian otomatis), QRIS dinamis, Kartu Debit/EDC, dan Transfer Bank.
* **Nota & Struk ASCII**: Format struk thermal 58mm/80mm, cetak via Web Print / Bluetooth Thermal Printer, serta opsi bagikan nota via WhatsApp (`wa.me`).

### 🍽️ 2. Manajemen Meja & Split Bill
* **Denah Meja Real-time**: Indikator status meja kosong (🟢) vs meja terisi (🔴 Open Bill aktif + timer).
* **Split Bill Dynamic**:
  * **Split by Items**: Pemisahan item pesanan ke Sub-Bill A, B, C dengan struk bertingkat (`#0004-A`, `#0004-B`).
  * **Equal Split**: Pembagian total tagihan rata ke 2–6 tamu secara proporsional.
* **Hold, Move & Merge Table**: Simpan tagihan gantung (Hold Order), pindah meja, dan penggabungan meja.

### 👨‍🍳 3. Kitchen Display System (KDS) & Barista Station
* Layar antrean dapur terpisah untuk **Dapur (Makanan)** dan **Barista (Minuman)**.
* Timer urgensi tunggu (Hijau `<10m`, Kuning `10-20m`, Merah Urgen `>20m`).
* Cetak **Kitchen Order Ticket (KOT)** dan **Label Stiker Cup Thermal (TSPL)** 40x30mm.

### 📦 4. Inventaris, Resep (BOM) & Shift Kasir
* **Pemotongan Stok Bahan Otomatis**: Pengikatan resep pada tiap menu (*Bill of Materials*) yang langsung memotong stok bahan mentah/olahan saat transaksi.
* **Laporan Batch Expiry**: Input lot number, tanggal kedaluwarsa, serta indikator visual bahan mendakasi/sudah expired.
* **Shift Kasir & Rekonsiliasi**: Pencatatan modal awal, kas masuk/keluar operasional, dan kalkulasi selisih kas laci (*expected vs actual cash*).

---

## 🛠️ Tech Stack

| Layer | Teknologi / Tool |
| :--- | :--- |
| **Frontend Framework** | React 19 (TypeScript) / Svelte 5 |
| **Build System** | Vite 6 |
| **Styling** | Tailwind CSS v4 + Monospace Typography |
| **Mobile Engine** | Capacitor v6 (`@capacitor/core`, `@capacitor/android`) |
| **Icons** | Lucide React |
| **State & Persistence** | Offline-First Browser LocalStorage / IndexedDB |

---

## 📁 Struktur Repositori

```text
oh-my-cashier/
├── android/              # Proyek Native Android (Capacitor generated)
├── public/               # Aset statis & favicon terminal
├── src/
│   ├── assets/           # Style global, font Monospace, & theme colors
│   ├── components/       # UI Components (PromptHeader, CartDrawer, Modals, Receipt)
│   ├── modules/          # Modul utama (/pos, /history, /products, /shift, /kds)
│   ├── types/            # TypeScript interfaces (Order, Product, Shift, Ingredient)
│   ├── utils/            # Helper format IDR, LocalStorage, TSPL printer encoder
│   ├── App.tsx           # Router & Main Dashboard Shell
│   └── main.tsx          # Entry point
├── capacitor.config.ts   # Konfigurasi Capacitor Android
├── DESIGN.md             # Dokumen Arsitektur & System Design
├── ROADMAP.md            # Rencana Kerja & Development Milestones
├── package.json          # Dependensi Node.js
└── vite.config.ts        # Konfigurasi Vite
```

---

## 🚀 Cara Menjalankan Proyek

### Prasyarat
* **Node.js** v18.x atau lebih baru
* **npm** / **yarn** / **pnpm**
* **Android Studio** *(Opsional, hanya jika ingin melakukan build berkas `.apk` / `.aab`)*

### 1. Menjalankan di Mode Web / Development
```bash
# 1. Clone repositori
git clone https://github.com/zakiafuadi925-ops/oh-my-cashier.git
cd oh-my-cashier

# 2. Install dependensi
npm install

# 3. Jalankan development server
npm run dev
```
Buka browser dan akses `http://localhost:5173`.

---

### 2. Build Aplikasi Android (.APK) via Capacitor

```bash
# 1. Build file web terdistribusi
npm run build

# 2. Tambahkan platform Android (jika pertama kali)
npx cap add android

# 3. Synchronize file build web ke proyek Android native
npx cap sync android

# 4. Buka proyek Android di Android Studio untuk Build APK/Bundle
npx cap open android
```
*(Atau lakukan build debug APK langsung via terminal: `cd android && ./gradlew assembleDebug`)*

---

## 📜 Lisensi & Atribusi

Diprakarsai dan dikembangkan oleh [**@zakiafuadi925-ops**](https://github.com/zakiafuadi925-ops).  
Proyek ini dirilis di bawah lisensi **MIT**. Bebas digunakan, dipelajari, dan dikembangkan kembali.
