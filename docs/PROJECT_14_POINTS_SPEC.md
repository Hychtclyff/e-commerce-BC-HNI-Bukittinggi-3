# 📋 Spesifikasi 14 Poin Proyek Tijarah
*Versi: 1.0 – 30 Oktober 2026*
*Mengikuti aturan arsitektur CODING_CONVENTION.md: modular, atom-molecule-organism, multi-bahasa (id/en), response envelope standar, dan keamanan kredensial [REDACTED].*

---

## 1. Integrasi Agent Network (Self-Inclusion & Data Integration)
- **Problem**: Menu Agent Network datanya belum terintegrasi ke backend dan akun user/toko yang sedang login belum otomatis terdaftar/masuk ke dalam daftar jaringannya sendiri.
- **Backend**:
  - Endpoint `GET /store/agents` dan `POST /store/agents/sync-self`.
  - Logic otomatis memasukkan identitas user pemilik toko yang sedang aktif ke dalam relasi hierarki agen teratas (self-node).
- **Frontend**:
  - Komponen `AgentNetworkPanel.tsx` di `front-end/modules/store/components/organism/panels/`.
  - Menggunakan komponen Tijarah atom (`TijarahCard`, `TijarahBadge`, `TijarahButton`).
  - Menampilkan kartu profil diri sendiri sebagai root agent beserta visualisasi direct downline/jaringan.

## 2. Manajemen Alur Verifikasi Dinamis (Dynamic Verification Flow)
- **Problem**: Alur verifikasi pengiriman/pickup masih hardcoded, perlu dinamis dapat diatur oleh owner/admin.
- **Backend**:
  - Skema data `verification_flow` pada tabel `store.delivery_methods` (enum / array langkah: `QR_SCAN_DOUBLE`, `USER_VERIFY_DIRECT`, `COUNTER_HANDOVER`, `PIN_CONFIRMATION`).
  - CRUD alur verifikasi melalui `store.service.ts` (`updateDeliveryMethod`).
- **Frontend**:
  - `DeliveryMethodPanel.tsx` menyediakan selector alur verifikasi dinamis per metode pengiriman.
  - Alur checkout dan serah terima pesanan menyesuaikan instruksi verifikasi sesuai konfigurasi metode yang dipilih.

## 3. Perbaikan Not-Null Constraint E-signature
- **Problem**: Terjadi error `null value in column "signer_name" of relation "esignatures" violates not-null constraint`.
- **Backend**:
  - Fallback otomatis di `store.service.ts`: jika `signer_name` kosong/null, otomatis terisi nama user yang sedang login, peran kasir (`Kasir Toko`), atau nama penandatangan default sistem.
  - Sanitasi payload sebelum eksekusi query SQL insert.
- **Frontend**:
  - Form e-signature mewajibkan atau secara otomatis menginjeksi nama staf/kasir yang sedang bertugas dari session toko.

## 4. Table Editor Katalog Khasiat (In-Place Table Editor)
- **Problem**: Pengeditan khasiat produk menggunakan modal terasa lambat dan tidak efisien; perlu editor tabel seperti Microsoft Word / spreadsheet.
- **Frontend**:
  - Komponen `KhasitTableEditor.tsx` di `front-end/modules/khasit/components/`.
  - Baris tabel langsung bisa diedit (editable cells: nama tanaman/herba, khasiat, kategori, dosis).
  - Shortcut keyboard (Tab, Enter) untuk navigasi antar sel dan tambah baris baru secara instan.
- **Backend**:
  - Batch update endpoint `PUT /khasit/batch` untuk menyimpan seluruh perubahan tabel sekaligus.

## 5. Master News / Blog / Berita
- **Problem**: Belum ada modul pengelolaan berita, edukasi herbal, atau artikel blog promo di sistem.
- **Backend**:
  - CRUD API di `/news` (`news.routes.ts`, `news.controller.ts`, `news.service.ts`).
  - Mendukung field: judul, slug, konten markdown/rich text, tags, thumbnail URL, status publish, tanggal rilis.
- **Frontend**:
  - `NewsPanel.tsx` di `front-end/modules/news/components/`.
  - Daftar artikel berita, filter kategori/tag, pencarian, dan form pembuatan berita artikel.

## 6. Redefinisi Menu Velocity → Manajemen Pemesanan Produk (HSIS Sync)
- **Problem**: Menu Velocity saat ini hanya menampilkan insight; tombol "PO Restock" perlu diubah menjadi sistem pemesanan produk terintegrasi dengan endpoint HSIS.
- **Proses Bisnis**:
  1. **Sync dengan HSIS**: Request daftar produk dan submit Purchase Order (PO) langsung ke API HSIS.
  2. **Proses Cek Barang Datang**:
     - *Bulk Check*: Verifikasi massal dengan komponen checklist bahwa semua item telah tiba sesuai pesanan.
     - *Scan Barcode*: Scan barcode produk satu per satu, muncul inputan qty riil yang diterima.
     - *Rekonsiliasi Sistem*: Sistem otomatis membandingkan PO awal vs barang fisik yang datang (selisih, rusak, kurang).
  3. **Tabs Insight**:
     - Tab **Penyakit Tren Saat Ini**: Analisis tren keluhan/penyakit pembeli dari data order lokal.
     - Tab **Pertumbuhan per Produk**: Grouping produk terlaris bulan ini, pergerakan lambat (slow-moving), dsb.
- **Frontend & Backend**:
  - `ProductOrderManagementPanel.tsx` dan integrasi rute `hsis.routes.ts` / `hsis.dispatcher.ts`.

## 7. Konektivitas & Status POS Devices (Real Connection Ping)
- **Problem**: Status perangkat POS (printer termal, barcode scanner, EDC) masih mock/dummy, belum ada status riil.
- **Backend**:
  - Endpoint `GET /store/devices/:id/ping` dan `GET /store/devices/status`.
  - Health check socket/HTTP/port ke IP lokal printer atau service driver POS.
- **Frontend**:
  - Komponen `DeviceStatusBadge.tsx`.
  - Menampilkan status riil: `Terhubung` (hijau), `Terputus / Tidak Ada Koneksi` (merah), `Timeout` (kuning).

## 8. E-Signature pada Template Receipt
- **Problem**: Template struk/receipt belum terhubung dengan tanda tangan elektronik kasir yang melayani transaksi dan belum memakai komponen atom Tijarah.
- **Frontend**:
  - Komponen `ReceiptTemplate.tsx` dibangun ulang menggunakan atom Tijarah (`TijarahCard`, `TijarahBadge`).
  - Menampilkan watermark/barcode/tanda tangan elektronik e-signature serta label "Dilayani oleh: [Nama Kasir / ID Kasir]".

## 9. Peningkatan Fitur Kupon Dinamis & Multi-Select User
- **Problem**: Syarat kupon masih hardcoded; diskon belum bisa diberikan spesifik ke daftar pengguna tertentu.
- **Fitur Baru**:
  - Syarat dinamis: `is_agent = true`, `min_purchase_count`, `min_transaction_amount`, `first_time_buyer`.
  - Target khusus: Kolom/relasi multi-select user target (hanya user terdaftar tertentu yang bisa klaim).
- **Checkout Integration**:
  - Modul checkout memvalidasi rule kupon secara realtime di backend (`checkout.service.ts`).
- **Frontend**:
  - `VoucherConditionEditor.tsx` di panel admin voucher untuk meracik rules dinamis dan memilih target user.

## 10. Rules UX: Penggantian Modal dengan Large Form Page
- **Aturan Baru**: Jika suatu form entitas memiliki field yang banyak (> 5–6 field kompleks), dilarang menggunakan popup modal demi kenyamanan UX pengguna.
- **Solusi**:
  - Komponen `LargeFormPage.tsx` di `front-end/components/large-form/`.
  - Halaman formulir mandiri dengan sticky action header (Batal, Simpan Draf, Simpan), breadcrumb navigasi, dan grouping kartu input yang rapi.

## 11. Auto-Cancel Order Kedaluwarsa & Pengembalian Stok
- **Problem**: Pesanan yang tidak dibayar dalam batas waktu yang ditentukan belum otomatis batal, menyebabkan stok produk tergantung (terkunci).
- **Backend**:
  - Worker/Cron job `expireOrders.ts` yang berjalan berkala.
  - Membatalkan pesanan yang melewati `paymentExpiry` / `expiresAt` (`status = CANCELLED`, `paymentStatus = EXPIRED`).
  - Mengembalikan kuantitas stok produk (`product.stock += item.quantity`) dan mencatat mutasi stok di audit log.

## 12. Filter Tanggal & Komponen Tijarah pada Menu Orders
- **Fitur**:
  - Filter rentang tanggal (`dateFrom` s/d `dateTo`) dan filter tipe fulfillment (`DELIVERY` vs `PICKUP`).
  - Seluruh elemen kontrol tabel pesanan menggunakan styling konsisten komponen Tijarah (input tanggal, button reset, badge status).
- **Penerapan**: Telah dipasang di `OrdersPanel.tsx`.

## 13. Financial Report (Chart, Filter, & Export)
- **Backend**:
  - Endpoint agregasi laporan `/reports/financial` (omset, HPP, laba kotor, biaya operasional).
  - Generator ekspor format CSV / Excel.
- **Frontend**:
  - `FinancialReportPanel.tsx` di `front-end/modules/report/components/`.
  - Visualisasi grafik pendapatan vs pengeluaran, filter periode dinamis (harian, mingguan, bulanan), dan tombol aksi ekspor file.

## 14. Export & Import Stok Inventory
- **Backend**:
  - Endpoint `POST /store/inventory/import` (upload CSV/XLSX untuk update atau penambahan stok massal).
  - Endpoint `GET /store/inventory/export` (download data stok terkini).
- **Frontend**:
  - Di `InventoryPanel.tsx`, tombol "Import Stok" (dengan drag & drop template validasi) dan tombol "Export Stok".

---

## Standar Kode & Konvensi
1. **Frontend**: Next.js App Router, HeroUI v3, Atomic Design (`components/atom/`, `molecules/`, `organism/`), TypeScript interface berawalan `I` (contoh: `IOrderReceiptProps`).
2. **Backend**: Fastify v5, Prisma ORM / PostgreSQL pg.Pool, response envelope standar `{ status, message, data, errors }`.
3. **Multi-Bahasa**: Label teks mendukung kamus bahasa (`id` dan `en`).
4. **Keamanan**: Kredensial sensitif, token HSIS, dan kata sandi selalu disamarkan dengan `[REDACTED]`.
