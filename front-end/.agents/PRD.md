Berikut adalah dokumen **Product Requirement Document (PRD)** lengkap dalam format Markdown (`.md`) yang telah disempurnakan dan disinkronkan dengan seluruh spesifikasi enterprise pada dokumen acuan PRD v2.0 BC HNI 3 Bukittinggi:

```markdown
# Product Requirement Document (PRD)
# TIJARAH-3: Sistem E-Commerce, Offline POS, & Back-Office ERP BC HNI 3 Bukittinggi

| Atribut Dokumen | Rincian Spesifikasi |
| :--- | :--- |
| **Nama Produk** | TIJARAH-3 (*Tata Kelola Inventaris, Jual-Beli, & Arus Ritel Agen Herba BC 3*) |
| **Platform** | Progressive Web App (PWA) + Kasir POS Desktop/Tablet + Back-Office ERP[cite: 1] |
| **Target Operasional** | Business Center (BC) HNI 3 Bukittinggi, Sumatera Barat[cite: 1] |
| **Versi Dokumen** | 2.0 (Comprehensive Enterprise Edition)[cite: 1] |
| **Jadwal Rilis** | Fase 1 (MVP): Q3 2026 \| Fase 2 (Full Automation RPA): Q4 2026 \| Fase 3 (Smart Ops): Q1 2027[cite: 1] |
| **Status** | Approved & Ready for Development[cite: 1] |

---

## 1. Ringkasan Eksekutif & Latar Belakang

Business Center (BC) HNI 3 Bukittinggi adalah pusat distribusi produk herbal dan kebutuhan harian HNI di area Bukittinggi dan sekitarnya (Sumatera Barat)[cite: 1]. Operasional menghadapi tantangan skalabilitas signifikan akibat ketiadaan REST API publik dari sistem sentral HNI (HSIS), kerumitan pemecahan alokasi poin (*split point*), serta kebiasaan mitra loyal yang memanfaatkan sistem ambil barang bayar tempo (*kasbon/piutang*)[cite: 1].

TIJARAH-3 dibangun sebagai ekosistem digital terpadu yang memadukan[cite: 1]:
1. **Frontend PWA E-Commerce:** Layanan mandiri belanja retail (B2C) maupun grosir/stokis (B2B) 24/7[cite: 1].
2. **Back-Office ERP & POS Offline-Ready:** Sentralisasi stok fisik vs cloud, pencatatan restock HPP (*Moving Average Cost*), beban operasional toko, dan kontrol ketat plafon piutang[cite: 1].
3. **Queue & RPA Automation:** Worker Playwright headless untuk mencatatkan poin penjualan ke portal HSIS secara otomatis tanpa membebani kasir saat *closing* akhir bulan[cite: 1].
4. **Modul Rekonsiliasi Silang:** Fitur audit otomatis antara basis data lokal BC dengan file mutasi resmi portal HSIS[cite: 1].

---

## 2. Masalah Utama & Matriks Solusi

| Masalah Operasional Lapangan | Solusi Sistem TIJARAH-3 |
| :--- | :--- |
| Ketiadaan REST API publik dari portal sentral HSIS HNI[cite: 1] | Antrean tugas latar belakang (BullMQ) + Bot RPA Playwright[cite: 1] |
| Antrean transaksi menumpuk saat periode *closing* akhir bulan[cite: 1] | Worker *auto-posting* 24 jam non-stop dengan mekanisme *retry backoff*[cite: 1] |
| Piutang macet / kasbon tanpa batasan plafon dan tanggal pasti[cite: 1] | Batasan Plafon Kredit Dinamis (default Rp 2 Jt) & *Auto-Lock* $H+14$[cite: 1] |
| Perhitungan manual ongkir armada kargo dan Travel L300 antarkota[cite: 1] | Kalkulator berat/koli otomatis & tarif flat-rate travel regional[cite: 1] |
| Selisih data stok fisik toko vs saldo poin di portal sentral HSIS[cite: 1] | Modul rekonsiliasi silang berbasis unggah file `SaldoStok.xlsx` / CSV[cite: 1] |

---

## 3. Tahapan Rilis (Release Roadmap)

### Fase 1: MVP - Core Commerce, Offline POS, Promo Engine & Financial Control (Target: Q3 2026)[cite: 1]
* **PWA Multi-Tier Pricing:** Penyesuaian harga instan antara Konsumen Non-Mitra (Harga Retail/HK) dan Mitra Resmi (Harga Agen/HA + Total Poin/TP)[cite: 1].
* **Kasir Offline POS (Dexie.js / IndexedDB):** Pemindaian barcode cepat, transaksi tunai/QRIS/Kasbon, dan *auto-sync* saat internet toko pulih[cite: 1].
* **Voucher & Promo Rule Engine (`BO-PROMO`):** Potongan nominal, persentase (dengan batas cap), subsidi ongkir Travel L300/kargo, dan segmentasi role/whitelist[cite: 1].
* **Manajemen Kasbon Mitra (`BO-CREDIT`):** Plafon kredit default Rp 2.000.000, *Auto-Lock* $H+14$ jika menunggak, dan *immutable credit ledger*[cite: 1].
* **Restock HPP & Beban Operasional:** Faktur masuk kulakan HNI Pusat (*Moving Average*) dan pembukuan biaya rutin (sewa, listrik, gaji)[cite: 1].
* **Antrean HSIS Semi-Otomatis & Audit Excel:** Export batch antrean transaksi dan fitur audit silang file `SaldoStok.xlsx` / CSV[cite: 1].

### Fase 2: Full Automation - RPA Auto-Posting & Notification Engine (Target: Q4 2026)[cite: 1]
* **HSIS Playwright Auto-Posting:** Bot background worker yang mengeksekusi form kasir web HSIS secara sekuensial (termasuk *split point*)[cite: 1].
* **Audit Struk & Screenshot Bukti:** *Scraping* nomor struk resmi HSIS dan capture tangkapan layar bukti submit ke penyimpanan sistem[cite: 1].
* **WhatsApp CRM Gateway:** Auto-blast notifikasi invoice belanja, nomor resi travel/kargo, dan nomor struk resmi HSIS[cite: 1].
* **Chrome Extension Fallback Helper:** Ekstensi internal kasir untuk injeksi form 1-klik sebagai jalur darurat saat portal HSIS mengalami perombakan UI[cite: 1].

### Fase 3: Advanced Analytics & Smart Operations (Target: Q1 2027)[cite: 1]
* **Smart Inventory Forecasting:** Analisis prediktif kebutuhan restock berbasis histori perputaran barang menjelang *closing* akhir bulan[cite: 1].
* **Program Loyalitas Internal BC:** Sistem tiering belanja toko, kupon hari ulang tahun, dan reward pencapaian omzet tahunan mitra[cite: 1].
* **Direct Logistics API Tracking:** Integrasi live tracking ekspedisi kargo berat dan penjemputan armada travel L300[cite: 1].

---

## 4. Matriks User Persona & Hak Akses (RBAC)

| Peran (Role) | Ruang Lingkup & Wewenang Sistem |
| :--- | :--- |
| **CUSTOMER** (Retail Umum) | Pengguna umum tanpa ID Agen HNI; berbelanja produk eceran dengan skema Harga Konsumen (HK)[cite: 1]. |
| **AGENT** (Mitra Reguler) | Anggota resmi HNI terverifikasi; mengakses Harga Agen (HA) serta mengumpulkan Nilai Poin (TP) belanja mandiri[cite: 1]. |
| **STOCKIST** (Mitra Grosir / VIP) | Mitra belanja skala besar ($\ge \text{Rp } 2\text{ Jt}$); memiliki fasilitas limit tempo kasbon, voucher eksklusif B2B, dan fitur *split point*[cite: 1]. |
| **CASHIER** (Kasir Toko Fisik) | Mengoperasikan antarmuka POS offline-ready, pemindaian barcode SKU, transaksi tunai/non-tunai, dan pencatatan pelunasan kasbon[cite: 1]. |
| **WAREHOUSE** (Staf Gudang) | Mengelola antrean *packing* pesanan, pencetakan otomatis stiker label dus koli ($100\times150\text{ mm}$), dan koordinasi supir travel/kargo[cite: 1]. |
| **ADMIN** (Admin Operasional) | Mengelola master SKU katalog, verifikasi pendaftaran ID agen baru, input faktur restock kulakan (HPP), dan monitoring bot HSIS[cite: 1]. |
| **OWNER** (Superadmin / Pemilik) | Akses mutlak laporan laba rugi, persetujuan kenaikan plafon kasbon, penentuan mode posting kasbon, dan brankas kredensial HSIS[cite: 1]. |

---

## 5. Spesifikasi Kebutuhan Fungsional (Functional Requirements)

### 5.1 Kanal Pelanggan (Customer Frontend & PWA)
* **`FE-01` Katalog Produk & Multi-Tier Pricing:** Menampilkan spesifikasi herba, bobot gram, indikator stok riil, serta adaptasi tampilan harga (HK untuk tamu vs HA + TP untuk mitra resmi)[cite: 1].
* **`FE-02` Checkout Mandiri & Opsi Logistik Khusus:** Pilihan armada mencakup Kurir Instan Lokal, Armada Travel L300 Antarkota (flat-rate per koli), Kargo Truk Berat (J&T Cargo/Indah Logistik $>10\text{ kg}$), dan Ambil di Toko (*Self Pick-Up*)[cite: 1].
* **`FE-03` Payment Gateway & Kasbon B2B:** Integrasi QRIS, Virtual Account bank, E-Wallet, serta opsi tempo kasbon khusus Stockist jika sisa plafon mencukupi dan tidak terkena *auto-lock*[cite: 1].
* **`FE-04` Order Tracking & WhatsApp Receipt:** Pelacakan status progres pesanan live dan penerimaan pesan rincian nota serta nomor struk resmi posting HSIS melalui WhatsApp[cite: 1].
* **`FE-05` Alokasi Split Poin Grosir:** Antarmuka pemecahan akumulasi TP belanja ke beberapa ID Agen downline untuk pesanan grosir $\ge \text{Rp } 2.000.000$[cite: 1].

### 5.2 Kanal Back-Office ERP, Kasir POS, & Otomasi
* **`BO-01` Master Katalog & Dual-Pricing:** Pengelolaan SKU, kategori, bobot pengiriman, penetapan harga (HK, HA, TP, Nilai Manfaat/NM), dan kalkulasi HPP[cite: 1].
* **`BO-02` Kasir Cepat Offline POS (Dexie.js):** Antarmuka transaksi kasir meja toko berbasis pemindaian barcode dengan mekanisme buffer antrean lokal saat internet terputus[cite: 1].
* **`BO-03` Restock Masuk & Moving Average Cost:** Pencatatan faktur kulakan stok masuk dari HNI Pusat guna membentuk dasar perhitungan HPP/COGS secara akurat[cite: 1].
* **`BO-04` Promotion & Voucher Rule Engine:** Mesin validasi voucher berdasarkan segmentasi role, batas belanja minimum, kuota pemakaian, dan status tunggakan piutang[cite: 1].
* **`BO-05` Manajemen Plafon Kasbon & Ledger:** Pembukuan mutasi piutang (*immutable ledger*), penegakan jatuh tempo 14 hari (*Auto-Lock*), serta pengaturan kebijakan posting poin kasbon[cite: 1]:
  * *Strict Mode (Default):* Poin di portal HSIS di-HOLD hingga tagihan kasbon lunas 100%[cite: 1].
  * *Trusted VIP Mode:* Poin langsung diposting saat barang diserahkan atas otorisasi langsung Owner BC[cite: 1].
* **`BO-06` Beban Pengeluaran Operasional (Expenses):** Pencatatan biaya operasional rutin gerai (sewa, listrik, gaji karyawan, perlengkapan packing) disertai unggah bukti fisik[cite: 1].
* **`BO-07` Monitoring Worker HSIS & Chrome Extension:** Panel kontrol antrean transaksi auto-posting Playwright dan ekstensi darurat injeksi form 1-klik[cite: 1].
* **`BO-08` Rekonsiliasi Data Silang Saldo Stok:** Modul audit silang dengan membandingkan file `SaldoStok.xlsx` / CSV HSIS terhadap penjualan lokal untuk mendeteksi status *Match*, *Mismatch*, atau *Missing*[cite: 1].
* **`BO-09` Executive Financial Dashboard:** Laporan visual laba rugi komprehensif, arus kas riil, margin perolehan Nilai Manfaat (NM), dan umur piutang (*aging schedule*)[cite: 1].
* **`BO-10` Silent Background Print Daemon:** Agen pencetak lokal di PC kasir untuk memproses antrean `orders.print_jobs` dan mengeluarkan stiker label koli thermal ($100\times150\text{ mm}$ / format TSPL) serta struk packing slip (80 mm) secara otomatis[cite: 1].

---

## 6. Alur Bisnis Sistem (Business Flow Diagrams)

### 6.1 Alur Transaksi Kasbon & Kontrol Limit Kredit
```mermaid
flowchart TD
    Start([Mitra Memilih Metode Kasbon / Tempo]) --> CheckLock{Status Akun is_locked = True?}[cite: 1]
    CheckLock -- Ya: Menunggak Jatuh Tempo > 14 Hari --> RejectDebt[Tolak Kasbon: Mitra Wajib Melunasi Tagihan Lama][cite: 1]
    CheckLock -- Tidak Terkunci --> GetLimit[Ambil Sisa Limit dari orders_credit_accounts][cite: 1]
    
    GetLimit --> CheckLimit{Grand Total <= Sisa Limit Kredit?}[cite: 1]
    CheckLimit -- Tidak Cukup --> RejectLimit[Tolak Kasbon: Melebihi Plafon atau Minta Approval Owner][cite: 1]
    CheckLimit -- Cukup --> ApproveOrder[Status Pesanan: UNPAID / KASBON ACTIVE][cite: 1]
    
    ApproveOrder --> DeductLimit[Kurangi Sisa Limit: available_credit -= Grand Total][cite: 1]
    DeductLimit --> RecordLedger[Catat Mutasi DISBURSEMENT di orders_credit_ledgers][cite: 1]
    RecordLedger --> SetDueDate[Set Tanggal Jatuh Tempo: now + 14 Hari][cite: 1]
    SetDueDate --> ForwardGudang[Pesanan Diteruskan ke Bagian Packing & Gudang][cite: 1]

```

### 6.2 Alur Antrean Cetak Otomatis (Local Background Print Daemon)

```mermaid
flowchart TD
    OrderDone([Pesanan Terkonfirmasi: LUNAS / KASBON DISETUJUI]) --> CalcKoli[Hitung Total Koli Berdasarkan Berat / Volume][cite: 1]
    CalcKoli --> InsertJob[Insert Job ke orders.print_jobs: status = PENDING][cite: 1]
    InsertJob --> PollingAgent[Background Print Agent di PC Kasir Melakukan Polling / WebSocket][cite: 1]
    PollingAgent --> CheckPort{Deteksi Status Port USB / LAN Printer Thermal}[cite: 1]
    
    CheckPort -- Printer Offline / Mati Semalaman --> WaitMorning[Keesokan Pagi: Staf Menyalakan Sakelar Printer][cite: 1]
    WaitMorning --> KeepPending[Antrean Tetap PENDING di Database][cite: 1]
    
    CheckPort -- Printer Ready / Online --> FetchPending[Print Agent Mengambil Seluruh Antrean PENDING][cite: 1]
    KeepPending --> FetchPending
    
    FetchPending --> GenTSPL[Generate Raw TSPL Code: Label Koli 100x150mm & ESC/POS Struk][cite: 1]
    GenTSPL --> SendSpooler[Kirim Langsung ke Spooler Printer Thermal][cite: 1]
    SendSpooler --> PrintOut[Kertas Stiker & Struk Keluar Berurutan per Koli][cite: 1]
    PrintOut --> UpdateDB[Update Status di Database: status = PRINTED, printed_at = now][cite: 1]
    UpdateDB --> AttachLabel[Staf Gudang Menempelkan Label di Dus & Scan Barcode untuk Kirim][cite: 1]

```

### 6.3 Alur Bot Otomasi HSIS & Notifikasi WhatsApp (RPA Playwright)

```mermaid
flowchart TD
    OrderPaid([Pesanan Masuk]) --> CheckPolicy{Status Pembayaran & Kebijakan Kasbon}[cite: 1]
    CheckPolicy -- Kasbon Strict Mode --> HoldPost[Hold Posting: Menunggu Kasbon Dilunasi 100%][cite: 1]
    CheckPolicy -- Lunas atau Kasbon VIP Approved --> QueueTask[Insert Task ke Antrean BullMQ: hsis_rpa_tasks][cite: 1]
    
    QueueTask --> WorkerFetch[Worker Container Playwright Mengambil Antrean: status PROCESSING][cite: 1]
    WorkerFetch --> DecryptVault[Dekripsi Kredensial Kasir BC via AES-256 Vault][cite: 1]
    DecryptVault --> LaunchBrowser[Buka Headless Browser & Login ke Portal HSIS][cite: 1]
    LaunchBrowser --> ExecuteForm[Eksekusi Form Entri Penjualan Kasir HSIS Sesuai ID Pemesan][cite: 1]
    
    ExecuteForm --> SubmitCheck{Submit Form Berhasil?}[cite: 1]
    SubmitCheck -- Berhasil Disimpan --> ScrapeReceipt[Scraping Nomor Struk Resmi HSIS & Ambil Screenshot Bukti][cite: 1]
    ScrapeReceipt --> DBSuccess[Update DB: status SUCCESS, hsis_receipt_no, screenshot_url][cite: 1]
    DBSuccess --> TriggerWA[Trigger Webhook WhatsApp Gateway Fonnte / Wablas][cite: 1]
    TriggerWA --> SendWA[WA Otomatis Terkirim ke Mitra: Rincian Nota, Resi, & No Struk Resmi HSIS][cite: 1]
    
    SubmitCheck -- Gagal / Timeout Server Pusat --> CheckRetry{Retry Count < 3x?}[cite: 1]
    CheckRetry -- Ya --> Backoff[Exponential Backoff Delay 5-10 Detik][cite: 1]
    Backoff --> ExecuteForm
    CheckRetry -- Gagal 3x Berturut-turut --> DBFailed[Status FAILED: Kirim Notifikasi Darurat ke Dashboard Owner][cite: 1]
    DBFailed --> ExtensionFallback[Kasir Menggunakan Fallback: Injeksi 1-Klik via Chrome Extension][cite: 1]

```

### 6.4 Alur Rekonsiliasi Silang Data Stok & Penjualan (Audit Akhir Bulan)

```mermaid
flowchart TD
    OpenMenu([Owner / Admin Membuka Menu Rekonsiliasi]) --> DownloadHSIS[Unduh File SaldoStok.xlsx / CSV Mutasi dari Portal HSIS Pusat][cite: 1]
    DownloadHSIS --> UploadFile[Upload File ke Modul Rekonsiliasi Back-Office BC 3][cite: 1]
    UploadFile --> ParseEngine[Parser Engine Membaca Kolom SO, Masuk, Keluar, Hold WP, Total Stok, Mutasi Poin][cite: 1]
    ParseEngine --> CrossCheck[Sistem Melakukan Audit Silang dengan Database Lokal: orders & inventory][cite: 1]
    
    CrossCheck --> CheckResult{Cek Hasil Pencocokan Data}[cite: 1]
    CheckResult -- Data Sinkron 100% --> MatchState[Indikator Hijau MATCH: Stok & Poin Valid][cite: 1]
    MatchState --> GenReport[Generate Laporan Laba Rugi Komprehensif & Margin Nilai Manfaat NM][cite: 1]
    
    CheckResult -- Ditemukan Anomali / Selisih Data --> AnomalyTable[Tampilkan Tabel Anomali dengan Indikator Khusus][cite: 1]
    AnomalyTable --> AnomalyType{Tipe Anomali}[cite: 1]
    
    AnomalyType -- Missing in HSIS (Merah) --> Reprocess[Pesanan Lunas Lokal Belum Terinput di HSIS: Klik Reproses ke Antrean Bot][cite: 1]
    Reprocess --> BotRerun[Antrean Bot Memproses Ulang Transaksi yang Tertinggal][cite: 1]
    
    AnomalyType -- Point / Qty Mismatch (Kuning) --> AuditLog[Terdapat Selisih Poin / Jumlah Barang: Buka Log Penyesuaian][cite: 1]
    AuditLog --> PhysicalCorrection[Owner Melakukan Koreksi Data atau Stock Opname Fisik Toko][cite: 1]

```

---

## 7. Sistem Desain & Topologi Token Warna (60-30-10 Rule)

Sistem antarmuka TIJARAH-3 menggunakan prinsip pembagian visual 60-30-10 Rule yang mengusung tema herbal modern (*Sage Green*) dipadukan dengan aksen emas premium (*Gold Accent*) untuk kenyamanan kasir dan keterbacaan data finansial:

```
+-------------------------------------------------------+
|  60% Base Canvas & Surface Tone                       |
|  [ --bg-canvas: #F8FAF8 | --bg-surface: #FFFFFF ]     |
|                                                       |
|  +-------------------------------------------------+  |
|  |  30% Structure, Borders & Typography            |  |
|  |  [ --border-subtle: #DDE5DF                     |  |
|  |    --text-primary: #1F2823 | --text-muted: #66786C ]  |
|  |                                                 |  |
|  |  +-------------------------------------------+  |  |
|  |  |  10% Action & Brand Accents               |  |  |
|  |  |  [ --primary-sage: #5E7A68                |  |  |
|  |  |    --primary-dark: #4A6353                |  |  |
|  |  |    --accent-gold:  #C59B27 ]              |  |  |
|  |  +-------------------------------------------+  |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+

```

### 7.1 Spesifikasi CSS Variables

```css
:root {
  /* 60% Base Canvas & Surface Tone */
  --bg-canvas: 140 14% 97%;       /* #F8FAF8: Latar belakang aplikasi / canvas */[cite: 1]
  --bg-surface: 0 0% 100%;        /* #FFFFFF: Latar kartu, tabel, dan formulir */[cite: 1]

  /* 30% Structure, Borders & Typography */
  --border-subtle: 140 10% 88%;   /* #DDE5DF: Garis tabel & border input halus */[cite: 1]
  --text-primary: 146 14% 13%;    /* #1F2823: Teks utama, judul, nominal harga */[cite: 1]
  --text-muted: 142 8% 44%;       /* #66786C: Teks sekunder, label SKU, metadata */[cite: 1]

  /* 10% Brand Action & Premium Accents */
  --primary-sage: 142 13% 42%;    /* #5E7A68: Tombol utama (CTA), navigasi aktif */[cite: 1]
  --primary-dark: 142 15% 34%;    /* #4A6353: Hover state tombol utama */[cite: 1]
  --accent-gold: 44 67% 46%;      /* #C59B27: Badge Stokis VIP, poin TP & reward */[cite: 1]

  /* Semantic Notification Feedback */
  --status-success: 142 70% 35%;  /* #1C8D3E: Lunas, Sukses HSIS, Limit Approved */[cite: 1]
  --status-warning: 38 92% 50%;   /* #F29D0C: Menunggu Bayar, Hold, Mendekati Limit */[cite: 1]
  --status-danger: 0 72% 51%;     /* #E81C1C: Jatuh Tempo H+14, Terkunci, Gagal RPA */[cite: 1]
}

```

---

## 8. Kebutuhan Non-Fungsional (Non-Functional Requirements)

* **NFR-01: Performa & Responsivitas:** Halaman katalog dan keranjang checkout merespons dalam $<1.5\text{ detik}$.


* **NFR-02: Konkurensi Lonjakan Closing:** Arsitektur antrean BullMQ/Redis dan PgBouncer mampu memproses beban lonjakan $\ge 2.000$ transaksi serentak pada periode closing akhir bulan (tanggal 28–31) tanpa *race condition*.


* **NFR-03: Keandalan Bot RPA:** Worker Playwright menerapkan *random human-like delay* (2–5 detik) dan *exponential retry* 3 kali agar terhindar dari pemblokiran server pusat.


* **NFR-04: Keamanan Kredensial:** Password akun kasir portal HSIS dienkripsi simetris menggunakan algoritma `AES-256-GCM` di dalam brankas kredensial server.


* **NFR-05: Integritas Finansial:** Pembayaran online diverifikasi via signature HMAC-SHA512 dan mutasi buku besar kasbon bersifat *immutable* (hanya append-only).


* **NFR-06: Disaster Recovery & Backup:** Pencadangan basis data PostgreSQL dan snapshot Redis otomatis harian dengan target *Recovery Time Objective (RTO)* $<4\text{ jam}$.



---

## 9. Rekomendasi Tech Stack

| Layer Arsitektur | Teknologi Terpilih | Justifikasi Teknis |
| --- | --- | --- |
| **Frontend Framework** | Next.js (App Router) + TypeScript

 | SEO-friendly, rendering instan katalog, dan mendukung PWA terinstal.

 |
| **State & Offline POS** | Zustand + Dexie.js (IndexedDB)

 | Buffer penyimpanan nota kasir offline saat internet toko terputus.

 |
| **UI Components** | HeroUI + DaisyUI + Tremor Raw

 | Visual elegan pada PWA, bobot ringan pada POS, dan visualisasi grafik audit.

 |
| **Backend Runtime** | Node.js + Fastify

 | Throughput tinggi dan efisiensi memori menghadapi transaksi akhir bulan.

 |
| **Schema Validation** | Zod

 | Validasi ketat runtime payload API contracts.

 |
| **ORM & Database** | Drizzle ORM + PostgreSQL 16+

 | Kecepatan kueri SQL murni dan keandalan integritas transaksi ACID.

 |
| **Connection Pooler** | PgBouncer

 | Mengelola lonjakan koneksi bersamaan kasir dan PWA.

 |
| **Cache & Queue** | Redis + BullMQ

 | Message broker antrean bot HSIS dan caching data produk aktif.

 |
| **RPA Automation** | Playwright (Headless Chromium)

 | Otomasi input form portal HSIS yang tangguh dan stabil.

 |
| **Print Agent** | Node.js / Go CLI Local Daemon

 | Background service pengirim raw TSPL label stiker dus ($100\times150\text{ mm}$).

 |

---

## 10. Indikator Keberhasilan Proyek (Key Performance Indicators)

* **Efisiensi Entri HSIS:** Menurunkan waktu input nota grosir/split point dari 15–30 menit menjadi **0 menit intervensi manual** pasca implementasi Bot Fase 2.


* **Zero Missing Points:** **100% poin pesanan berhasil terposting** ke portal HSIS sebelum batas cut-off penutupan server HNI Pusat di akhir bulan.


* **Akurasi Stok & Finansial:** **0% selisih** antara stok fisik gudang toko, saldo e-commerce, dan laporan rekonsiliasi CSV HSIS.


* **Kesehatan Arus Kas Piutang:** Menekan rasio tunggakan kasbon macet hingga **$\le 2\%$ dari total omzet bulanan** melalui penegakan limit kredit dan *Auto-Lock* $H+14$.



```

```