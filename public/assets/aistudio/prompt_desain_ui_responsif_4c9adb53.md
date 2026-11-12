# Template Prompt AI untuk Desain UI Responsif (Mobile & Tablet)

Dokumen ini berisi panduan dan *template prompt* terstruktur yang dirancang untuk menginstruksikan AI agar menghasilkan desain UI yang responsif, rapi, dan adaptif untuk layar smartphone maupun tablet.

---

## Template Prompt

> **Peran:** 
> Bertindaklah sebagai **Senior Frontend Engineer & UI/UX Designer** yang ahli dalam arsitektur komponen modern dan desain responsif multi-device.
> 
> **Tugas:** 
> Buatkan struktur kode dan layout UI untuk **[sebutkan komponen/halaman, contoh: Dashboard Analytics / Product Card / Sidebar Navigation]** dengan pendekatan **Mobile-First**.
> 
> **Spesifikasi Responsif & Viewport:**
> 1. **Mobile (< 640px):**
>    - Layout 1 kolom (*single column*).
>    - Ukuran elemen interaktif/tombol minimal 48px agar *thumb-friendly*.
>    - Sederhanakan navigasi (gunakan *bottom nav* atau *hamburger menu*).
> 2. **Tablet (768px - 1024px):**
>    - Transisi ke layout 2–3 kolom menggunakan CSS Grid / Flexbox.
>    - Optimasi *whitespace* agar tidak terlalu renggang.
>    - Sidebar/Menu yang dapat di-*collapse* jika relevan.
> 3. **Desktop (> 1024px):**
>    - Pemanfaatan ruang secara maksimal dengan layout multi-kolom yang kompleks.
> 
> **Teknologi & Aturan Kode:**
> - **Tech Stack:** [sebutkan, contoh: HTML + Tailwind CSS / React + Tailwind / Svelte / CSS Modules]
> - Gunakan unit relatif (`rem`, `%`, `vw`) atau *fluid utilities*. Hindari nilai piksel *hardcoded* untuk lebar kontainer.
> - Tipografi responsif (skala ukuran teks yang menyesuaikan *breakpoint*).
> 
> **Output:**
> Berikan kode bersih, terstruktur, lengkap dengan komentar penjelas pada *breakpoint* utama.

---

## Tips Penggunaan Prompt

1. **Ganti Teks Dalam Kurung Siku `[...]`:** Sesuaikan jenis komponen dan *tech stack* dengan projek yang sedang kamu kerjakan.
2. **Sebutkan Desain Sistem (Opsional):** Jika kamu memiliki skema warna atau *design token* tertentu, tambahkan pada bagian **Teknologi & Aturan Kode** (misal: *"Gunakan skema warna dark mode dengan aksen hijau neon `#00FF66`"*).
3. **Uji Langsung:** Jangan percaya 100% pada hasil akhir AI. Selalu tes kodenya menggunakan *Developer Tools* browser di mode simulasi perangkat HP/Tablet.