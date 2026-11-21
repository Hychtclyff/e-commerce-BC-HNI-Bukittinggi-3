# DESIGN.md - Tijarah Visual & Experience Direction

> Identitas visual, tokens, dan pedoman desain antarmuka untuk ekosistem aplikasi Tijarah (Frontend Store, POS, & Admin ERP).
> Digunakan bersamaan dengan filter `.agents/antislop.md` untuk memastikan antarmuka terasa dirancang oleh desainer profesional, berbobot, konsisten, dan bebas dari AI slop.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 1

---

## 1. Brand Soul & Identity

- **Produk**: Tijarah (Platform POS, Store & Herbal Commerce Management).
- **Karakter**: Grounded, tenang, higienis, terorganisir, dan profesional khas ekosistem herbal modern dan retail operasional.
- **Audience**: Pemilik toko, kasir POS, agen herbal, staf logistik, dan pelanggan retail.
- **Prinsip Utama**:
  1. Konten dan fungsi nyata memimpin layout, bukan template generik AI.
  2. Palet herbal alami (Sage Green & Warm Gold) yang sejuk dan tidak melelahkan mata saat pemakaian kasir seharian.
  3. Sentuhan estetika macOS / MacBook: bayangan berlapis yang sangat halus (`.mac-shadow`), panel kaca frosted berbobot (`.mac-glass`), dan radius sudut proporsional.

---

## 2. Dials & Interaction Baseline

- **ENERGY (2 - Balanced)**: Tampilan tenang dan jelas khas aplikasi bisnis (B2B/retail POS), dengan kontras hierarki yang tegas pada tombol aksi utama dan status nominal.
- **RHYTHM (2 - Structured with Purposeful Breaks)**: Konsisten menggunakan grid modular dan panel atomik, diselingi detail ringkasan pesanan, tabel data, atau matrix operasional.
- **MOTION (1 - Subtle & Utilitarian)**: Hanya transisi hover, pembukaan modal, dan status loading yang bersih. Tanpa animasi melayang berlebihan (floating blobs) atau efek bouncing tanpa tujuan.

---

## 3. Design Tokens (Color Palette)

Semua komponen wajib memanfaatkan token CSS variable dari `styles/globals.css` agar mendukung Light Mode dan Dark Mode secara native.

### 3.1 Light Mode (Default)
```css
:root {
  /* Surface & Base */
  --canvas: hsl(140 14% 97%);           /* Background utama halaman */
  --surface: hsl(0 0% 100%);            /* Latar kartu, modal, popover */
  
  /* Borders & Text */
  --border-subtle: hsl(140 10% 88%);    /* Border halus 1px */
  --text-primary: hsl(146 14% 13%);     /* Teks utama (Deep Forest Slate) */
  --text-muted: hsl(142 8% 44%);        /* Teks sekunder / deskripsi */
  
  /* Brand Core */
  --primary-sage: hsl(142 13% 42%);     /* Brand sage green */
  --primary-dark: hsl(142 15% 34%);     /* Hover sage */
  --accent-gold: hsl(44 67% 46%);       /* Aksen emas hangat */
  
  /* Semantic Status */
  --status-success: hsl(142 70% 35%);   /* Sukses / Lunas / Aktif */
  --status-warning: hsl(38 92% 50%);    /* Pending / Perlu Verifikasi */
  --status-danger: hsl(0 72% 51%);      /* Batal / Ditolak / Kedaluwarsa */
}
```

### 3.2 Dark Mode
```css
.dark {
  --canvas: hsl(146 15% 8%);
  --surface: hsl(146 14% 12%);
  --border-subtle: hsl(146 10% 20%);
  --text-primary: hsl(140 14% 95%);
  --text-muted: hsl(142 8% 65%);
  --primary-sage: hsl(142 15% 48%);
  --primary-dark: hsl(142 15% 58%);
  --accent-gold: hsl(44 67% 55%);
  --status-success: hsl(142 70% 45%);
  --status-warning: hsl(38 92% 60%);
  --status-danger: hsl(0 72% 60%);
}
```

### 3.3 Aturan Palet (R-01 & R-29)
- Maksimal 2 sampai 3 warna utama (Sage Green, Forest Dark, dan Canvas netral) ditambah 1 aksen (Warm Gold).
- Dilarang menggunakan gradien ungu ke biru atau gradien neon (AI default gradient).
- Warna status hanya dipakai untuk makna fungsional (badge status transaksi, validasi formulir).

---

## 4. Typography & Spacing

- **Font Family**: San Francisco / Inter clean sans stack via `-webkit-font-smoothing: antialiased`.
- **Monospace**: Khusus untuk ID transaksi, barcode/SKU, dan nominal moneter detail. Dilarang memakai font monospace besar untuk judul utama.
- **Hierarki Font**:
  - H1: 24px - 32px (font-semibold / font-bold), teks padat dan komunikatif.
  - H2 / Section: 18px - 20px (font-semibold).
  - Body: 14px - 16px (font-normal).
  - Caption / Label Muted: 12px - 13px (font-medium text-[var(--text-muted)]).
- **Spacing**: Mengikuti kelipatan 4px/8px (Tailwind standard: p-2, p-4, p-6, gap-4).

---

## 5. macOS Aesthetics & Dose Caps

1. **Frosted Glass (`.mac-glass`)**:
   - Hanya boleh digunakan pada elemen elevated tertentu: Header/Navbar, Modal container, atau Summary floating dock.
   - Dose cap: Maksimal 1-2 elemen per viewport. Tidak boleh diaplikasikan ke semua kartu dan panel sekaligus.
2. **Soft Layered Shadows (`.mac-shadow`)**:
   - Dipakai bersama border tipis `border-[var(--border-subtle)]`.
   - Menghasilkan kedalaman tanpa membuat elemen tampak melayang berlebihan.
3. **Corner Radius (R-11)**:
   - Tombol dan Input: `rounded-lg` (8px).
   - Kartu dan Panel: `rounded-xl` (12px) atau `rounded-2xl` (16px).
   - Badge / Status: `rounded-full` (capsule hanya untuk badge status atau pill counter kecil). Dilarang membuat semua form input dan card berbentuk lonjong (pill-shaped).

---

## 6. Component Guidelines (Atomic Design)

- Komponen Reusable dibungkus dalam modul atom: `TijarahButton`, `TijarahCard`, `TijarahBadge`, `TijarahInput`, `TijarahModal`.
- Selalu gunakan varian resmi (`primary`, `secondary`, `success`, `warning`, `danger`).
- Interface prop komponen wajib diawali dengan huruf `I` (contoh: `ITijarahButtonProps`, `ITijarahCardProps`).
- Semua kontrol interaktif wajib memiliki:
  - `cursor: pointer` pada kondisi aktif, `cursor: not-allowed` pada kondisi nonaktif.
  - Indikator fokus yang jelas untuk aksesibilitas keyboard (R-32, R-39).

---

## 7. Anti-Slop Content & Copywriting Rules

- **Larangan Tanda Pisah Em Dash (R-02)**: Jangan gunakan karakter em dash (`—`) dalam teks UI atau pesan sistem. Gunakan tanda koma (`,`), titik (`.`), titik dua (`:`), atau kurung `()`.
- **Bebas AI Buzzwords (R-16)**: Hindari kata klise seperti "AI Powered", "Seamless", "Revolutionary", "Cutting-edge", "Intelligent". Gunakan kalimat lugas yang menerangkan alur kerja operasional nyata.
- **Data Nyata & Bukti (R-17, R-18, R-36)**: Dilarang menampilkan data statistik fiktif atau testimoni rekaan AI.
- **Kelengkapan State (R-27)**: Setiap panel data atau tabel wajib menangani 3 kondisi:
  1. *Loading state*: skeleton halus dengan tinggi proporsional.
  2. *Empty state*: ilustrasi atau ikon relevan dengan keterangan jelas serta aksi untuk menambah data.
  3. *Error state*: pesan kesalahan spesifik disertai tombol retry.
