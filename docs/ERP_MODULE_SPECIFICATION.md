# Spesifikasi & Blueprint Modul ERP Tijarah

Dokumen ini merangkum arsitektur, kebutuhan bisnis, dan detail spesifikasi fungsional untuk seluruh modul ERP Tijarah (termasuk modul HNI, merchant pelengkap, dan integrasi operasional).

---

## 1. Ringkasan & Metrik (Executive Dashboard)
- **Task Management**: Daftar tugas harian kasir/gudang/admin (pending, in-progress, done) dengan prioritas dan assignee.
- **Product Stock Warning**: Peringatan otomatis stok di bawah batas aman (threshold/safety stock) dilengkapi visual badge dan filter cepat.
- **Produk Butuh Promosi**:
  - Rekomendasi produk slow-moving yang butuh dorongan penjualan.
  - Integrasi mendatang: scraping/analisis browser & pipeline model tren kesehatan/musiman (misal: tren flu/musim hujan memicu rekomendasi promosi produk herbal terkait).

---

## 2. Manajemen Barang & Stok
- **Atribut Stok Lengkap**:
  - Kolom `stock_quantity`, `allocated_stock`, `safety_stock`, dan riwayat mutasi stok (`stock_movement_logs`).
  - Pencatatan stok multi-satuan dan tanggal expired batch.
- **Grouping Category**:
  - Pengelompokan berjenjang (Parent -> Sub-kategori).
  - Tampilan filter category tree & chip selectors pada tabel inventaris.
- **Stock In / Out Tracking**:
  - Integrasi nomor Purchase Order (PO), Surat Jalan (Delivery Order), dan retur barang.

---

## 3. Manajemen Voucher & Promo (CRUD & Analitik)
- **Operasional CRUD Voucher**:
  - Setup kode unik, jenis kupon (persentase / nominal rupiah tetap / gratis ongkir).
  - Batas pemakaian (kuota total, kuota per user/agent, min. belanja, periode aktif).
- **Syarat & Segmentasi**:
  - Berlaku untuk tier member tertentu (Konsumen, Agen, Distributor/DC/BC).
  - Pembatasan SKU atau kategori produk tertentu.
- **Kartu Analitik Voucher**:
  - **Total Alokasi Budget Voucher**: Nilai total rupiah yang dialokasikan.
  - **Realisasi/Terklaim**: Berapa rupiah voucher yang telah terpakai oleh user di transaksi nyata.
  - **Efektivitas / ROI**: Rasio perbandingan nilai voucher terpakai terhadap GMV yang dihasilkan.

---

## 4. Ekosistem B2B (Business-to-Business)
- **Manajemen Mitra & Level Store**:
  - Pengaturan jaringan mitra agen HNI, Stockies, DC (Distribution Center), dan BC (Business Center).
  - Plafon kredit/limit kasbon tempo (misal: TOP H+7, H+14, H+30).
- **Price List Khusus B2B**:
  - Harga Grosir/Level Khusus per tier kemitraan dan auto-apply saat pesanan dibuat.
- **PO & Approval Workflow**:
  - Pengajuan PO pesanan partai besar dengan validasi persetujuan owner/admin.

---

## 5. Manajemen Perangkat Cetak (Connected Print List)
- **Device Management**:
  - Daftar printer yang terhubung (Thermal POS 58mm/80mm, Printer Inkjet/Laser faktur A4/A5).
  - Status koneksi: Web Bluetooth, Web Serial/USB, atau Network IP ESC/POS.
- **Print Queue & Riwayat**:
  - Antrean cetak resi dan invoice otomatis begitu pesanan selesai atau pick-up.
  - Template default per printer (misal: Printer 1 resi kurir, Printer 2 struk kasir).

---

## 6. Manajemen User / Agent Jaringan
- **Data Identitas Agen**:
  - ID Mitra / Nomor ID HNI, status keaktifan, nomor WhatsApp verifikasi.
- **Pangkat & Kualifikasi**:
  - Klasifikasi pangkat: AB, Manager, SM, EM, LED, dll.
  - Tipe entitas toko/stok: Agen Biasa, Stockies, Distribution Center (DC), Business Center (BC).
- **Peran & Hak Akses ERP (RBAC)**:
  - Role sistem: Kasir, Pengelola Gudang, Keuangan, Admin Toko, dan Super Owner.

---

## 7. Laporan Keuangan & Insight Visual
- **Financial Metric Cards**:
  - Total Omset (GMV), Laba Kotor (Gross Margin), Biaya Operasional, dan Laba Bersih.
  - Nilai Piutang Kasbon & Hutang Supplier.
- **Grafik Interaktif**:
  - Tren pendapatan bulanan/harian vs periode sebelumnya.
  - Breakdown pendapatan per kategori produk (Herbal, F&B, Kosmetik, Merchant).
  - Komposisi metode pembayaran (Tunai, QRIS, Kasbon B2B, Transfer).

---

## 8. Integrasi & Sinkronisasi HSIS HNI
- **Arsitektur Token Bridge (9Router Pattern)**:
  - ERP Tijarah menyimpan session/token HSIS yang sudah aktif tanpa menyimpan credential login rahasia secara berisiko.
- **Trigger Refresh Token**:
  - Ketika token expired, trigger popup/web dialog langsung mengarah ke halaman login HSIS resmi.
  - Hook penangkap header/token session otomatis mengambil auth header dan mengupdate state token di ERP.
- **Automated Sync**:
  - Sinkronisasi order, invoice HNI, dan omset poin secara berkala ke database lokal Tijarah.

---

## 9. Rekonsiliasi Probis (Issue Ketidaksesuaian Poin & Stok)
- **Audit Trail & Selisih (Discrepancy Checker)**:
  - Laporan deteksi perbedaan antara stok tercatat di ERP dengan hasil Stock Opname fisik.
  - Rekonsiliasi poin: validasi nilai Poin Pribadi / Titik Poin (TP) antara invoice ERP vs server HSIS.
- **Fitur Penyesuaian (Adjustment Entry)**:
  - Formulir penyesuaian stok dengan catatan wajib (barang rusak/expired/bonus/selisih opname).
  - Tombol 1-klik "Re-sync Poin ke HSIS" untuk invoice yang berstatus pending/mismatch.

---

## 10. Rekapitulasi Penjualan & Rekomendasi Restock
- **Analisis Perputaran Barang (Stock Velocity)**:
  - Klasifikasi Fast Moving, Slow Moving, dan Dead Stock.
- **Kalkulator Saran Restock**:
  - Rumus: `Kebutuhan Restock = (Rata-rata Penjualan Harian x Lead Time Supplier) + Safety Stock - Stok Tersedia`.
  - Tombol instan "Buat Draf Pesanan Restock" yang langsung dikirimkan ke DC/Pusat.

---

## 11. Dashboard Terpadu (Full Overview Dashboard)
- **Tampilan Command Center**:
  - Header cepat: Ringkasan kas harian, status sinkronisasi HSIS, alert stok kritis.
  - Widget modular: Tugas kasir, grafik tren minggu ini, antrean packing & kirim.
  - Desain responsif bertema Apple macOS Native (`.mac-glass`, `.mac-shadow`, dark mode support).

---

## 12. Modul Tambahan Operasional
- **Manajemen Ekspedisi & Pick-up**: Cetak manifest kurir, no resi, dan live tracking paket.
- **Customer CRM**: Riwayat loyalitas belanja dan preferensi repeat-order pelanggan.
- **Multi-Lokasi / Multi-Gudang**: Pemisahan gudang utama toko dan display rak kasir.

---

## 13. Katalog Multi-Merchant & Non-HNI
- **Produk Pendukung & Perlengkapan**:
  - Perlengkapan kasir: Kertas thermal, printer resi, barcode scanner.
  - Merchandise & Atribut: Tas belanja HNI, pouch herbal, kalender resmi, tumbler, seragam.
- **Fleksibilitas Atribut Produk**:
  - Produk HNI: Memiliki atribut Nomor BPOM, Label Halal MUI, dan Nilai TP (Titik Poin).
  - Produk Non-HNI / Merchant: Tanpa nilai TP, memiliki dimensi fisik, garansi alat, dan berat spesifik.

---

## 14. E-Signature & Persetujuan Berjenjang (Approval Workflow)
- **Tanda Tangan Digital Touch / Stylus**:
  - Kanvas tanda tangan digital pada tablet/layar kasir (`react-signature-canvas`).
- **Verifikasi 3 Tingkat**:
  1. **Kasir / Pembuat Nota**: Mengesahkan transaksi keluar.
  2. **Pengelola Gudang**: Mengesahkan fisik barang telah dikeluarkan/diserahkan.
  3. **Owner / Manager Toko**: Mengesahkan persetujuan diskon besar atau pengajuan tempo piutang.
- **Keamanan Audit**:
  - Penyimpanan berkas tanda tangan dengan metadata tamper-proof: hash timestamp, IP pembuat, dan ID user.

---

## 15. Panel Transaksi & Pengelompokan Kategori Pembayaran (Kasir / Order Panel)
Panel kontrol transaksi lengkap untuk memantau siklus hidup pembayaran dan status order:
- **Pengelompokan Tab Kategori Transaksi**:
  - **Semua Transaksi**: Monitoring total seluruh riwayat transaksi masuk.
  - **Selesai & Lunas**: Transaksi cash, QRIS, atau transfer yang dananya sudah tuntas diverifikasi.
  - **Utang / Kasbon B2B (Tempo)**:
    - Transaksi agen yang belum lunas beserta tanggal jatuh tempo (due date).
    - Status aging piutang: Kurang dari 7 hari, 14 hari, dan peringatan Jatuh Tempo / Melewati Batas.
    - Riwayat cicilan pembayaran utang parsial.
  - **Menunggu Pembayaran (Pending)**: Transaksi checkout online atau reservasi barang yang belum ditransfer.
  - **Batal / Retur (Refund)**: Catatan pembatalan pesanan dan pengembalian dana/barang.
- **Aksi Cepat Transaksi**:
  - Tombol cetak ulang struk kasir / nota faktur tempo.
  - Tombol verifikasi pembayaran & pelunasan kasbon satu klik.
  - Download laporan transaksi per kategori (XLSX / PDF).
