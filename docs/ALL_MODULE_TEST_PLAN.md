# Skema Pengujian Detail All Module & Per Panel — Tijarah BC HNI 3

Dokumen ini dirancang khusus untuk **bug hunting** secara sistematis dari halaman depan hingga seluruh 22 panel di ERP Toko (`/id/store`), lengkap dengan skenario positif, skenario negatif (*edge cases*), endpoint yang di-hit, dan titik rawan bug (*Bug Watch*).

---

## 0. Persiapan Database Bersih & Pengujian Otomatis

```bash
# 1. Reset total & isi ulang data awal konstan + Super Admin
bun --env-file=back-end/.env run back-end/src/prisma/seed.ts --reset

# 2. Jalankan suite uji API otomatis lintas modul
bun --env-file=back-end/.env run back-end/src/scripts/test-all-modules.ts
```

* **Akun Super Admin / Owner:** `owner@tijarah.co` / `OwnerTijarah123!` (Role: `owner`, seluruh 18 permission aktif).

---

## 1. Pengujian Storefront & Customer Journey (Per Halaman)

### 1.1 Landing, About, Contact, Legal & News
| Kode | Halaman / Fitur | Skenario Uji (Positif & Negatif) | Endpoint & Tabel DB | Titik Rawan Bug (*Bug Watch*) |
| :--- | :--- | :--- | :--- | :--- |
| **PUB-01** | `/id`, `/id/about`, `/id/contact` | Buka dalam mode Incognito (tanpa login) -> cek Console/Network | `GET /store/contact-info`, `GET /products/highlights` | Pastikan tidak ada `401` yang memicu redirect ke `/401` atau `/login` |
| **PUB-02** | Form Hubungi Kami (`/id/contact`) | Submit pesan valid vs submit field kosong | `POST /store/contact-messages` (`store.contact_messages`) | Pesan baru harus muncul di ERP panel **Manajemen Kontak** |
| **PUB-03** | Footer Legal & Bantuan | Klik `/id/faq`, `/id/terms`, `/id/privacy`, `/id/shipping`, `/id/returns` | Route Next.js statis/SSR | Tidak boleh `404`; teks sesuai bahasa `id`/`en` |
| **PUB-04** | Daftar & Detail Berita (`/id/news`, `/id/news/[id]`) | Klik artikel dari Beranda & dari `/id/news` -> cek URL & reload halaman | `GET /news`, `GET /news/:id` (`store.news`) | URL harus memakai **UUID** (`/id/news/<uuid>`), bukan slug panjang; refresh tidak boleh 404 |

### 1.2 Autentikasi, Refresh Token & Keamanan Sesi
| Kode | Halaman / Fitur | Skenario Uji | Endpoint & Tabel DB | Titik Rawan Bug (*Bug Watch*) |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Login Owner (`/id/login`) | Login dengan `owner@tijarah.co` / `OwnerTijarah123!` | `POST /auth/login` | Respons harus mengembalikan `appToken`, `refreshToken`, `user` |
| **AUTH-02** | Login Salah Password | Login dengan password salah 3x | `POST /auth/login` | Harus `401`/`400` dengan pesan jelas, bukan `500` |
| **AUTH-03** | Register & RBAC Default | Daftar akun baru -> verifikasi OTP -> coba buka `/id/store` | `POST /auth/register`, `core_auth.user_roles` | Akun baru harus otomatis ber-role `customer` dan ditolak (`403`) saat akses `/id/store` |
| **AUTH-04** | Lupa & Reset Password | `/id/forgot-password` -> submit email -> `/id/reset-password?token=...` | `POST /auth/forgot-password`, `POST /auth/reset-password` | Token kedaluwarsa/salah harus ditolak (`400`), tidak boleh bocor info email terdaftar |
| **AUTH-05** | Silent Refresh Token | Ubah `accessToken` di localStorage menjadi token expired -> klik Wishlist/Checkout | `POST /auth/refresh` / `supabase.auth.refreshSession` | Interceptor harus refresh 1x (single-flight) dan mengulang request tanpa error toast |
| **AUTH-06** | Sesi Benar-Benar Kedaluwarsa | Hapus/rusak `refreshToken` + `accessToken` -> buka `/id/profile` | Axios response interceptor | Harus clear storage/cookie & redirect ke `/id/login?expired=1&next=...` |

### 1.3 Katalog, Produk Detail, Wishlist & Ulasan
| Kode | Halaman / Fitur | Skenario Uji | Endpoint & Tabel DB | Titik Rawan Bug (*Bug Watch*) |
| :--- | :--- | :--- | :--- | :--- |
| **CAT-01** | Katalog (`/id/products`, `/id/shop`) | Filter kategori, cari SKU/nama, cek harga agen vs reguler | `GET /products` (`products.products`) | Customer umum melihat `normalPrice`; Agen terverifikasi melihat `agentPrice` & TP |
| **CAT-02** | Detail Produk (`/id/products/[id]`) | Cek gambar, stok, tombol `+`/`-` qty, produk terkait | `GET /products/:id`, `GET /products/:id/related` | Qty tidak boleh melebihi `product.stock`; jika stok 0 tombol beli nonaktif |
| **CAT-03** | Wishlist Toggle | Klik ikon hati (saat login vs belum login) -> cek Profil Overview | `POST /profile/wishlist/toggle`, `GET /profile/wishlist` (`store.wishlists`) | Belum login diarahkan ke login; sudah login ikon langsung terisi & sinkron di Profil |
| **CAT-04** | Ulasan & Rating | Submit rating 1–5 & komentar -> reload halaman | `GET/POST /products/:id/reviews` (`products.reviews`) | Rata-rata rating terhitung ulang; badge *Pembeli Terverifikasi* muncul jika pernah beli |

### 1.4 Keranjang, Checkout, Pembayaran Real-Time & Retur
| Kode | Halaman / Fitur | Skenario Uji | Endpoint & Tabel DB | Titik Rawan Bug (*Bug Watch*) |
| :--- | :--- | :--- | :--- | :--- |
| **CHK-01** | Kalkulasi & Voucher | Tambah barang -> buka `/id/checkout` -> masukkan kode `WELCOME10` | `POST /checkout/calculate` | Diskon 10% (maks Rp 25.000) hanya aktif jika subtotal >= Rp 50.000 |
| **CHK-02** | Ongkir & Alamat | Ganti `PICKUP` vs `DELIVERY`, pilih metode kurir | `GET /store/delivery-methods`, `POST /store/shipping-rates` | Tidak boleh `401` untuk customer biasa; ongkir `PICKUP` harus Rp 0 |
| **CHK-03** | Pembayaran & Real-Time Status | Checkout Xendit (QRIS/VA) -> buka `/id/orders/[slug]` | `GET /payments/stream/:key`, `GET /payments/sync-status/:id` | Badge *Pengecekan Real-time Aktif* menyala; saat lunas di Xendit/mock (dev), status langsung jadi `PAID` |
| **CHK-04** | Timeline & Ajukan Retur | Order status `SHIPPED`/`COMPLETED` -> klik **Ajukan Retur / Komplain** | `POST /orders/:id/return` (`orders.order_returns`) | Tidak bisa ajukan retur untuk order `PENDING_PAYMENT`; duplikat pengajuan `PENDING` ditolak |

### 1.5 Profil Pelanggan (`/id/profile`)
| Kode | Tab Profil | Skenario Uji | Endpoint | Titik Rawan Bug |
| :--- | :--- | :--- | :--- | :--- |
| **PRF-01** | Overview & Wishlist | Cek saldo kasbon, alamat utama, daftar **Wishlist Saya** | `GET /profile/:id`, `GET /profile/wishlist` | Produk wishlist mengarah ke `/products/[id]` dengan harga benar |
| **PRF-02** | Alamat | Tambah, edit, set utama, hapus alamat | `/user/addresses` | Alamat utama harus otomatis terpilih di halaman Checkout |
| **PRF-03** | Verifikasi Agen HNI | Cari ID HNI & simpan profil HNI | `POST /profile/search-hni-by-id`, `PUT /profile/:id/hni` | Setelah terverifikasi, `isAgent` aktif dan harga agen berlaku |
| **PRF-04** | Pengaturan & Ganti Password | Ubah bahasa `id`/`en`, tema Light/Dark, & submit form ganti password | `POST /auth/change-password` | Password lama salah harus ditolak `400`; password baru bisa dipakai login ulang |

---

## 2. Pengujian ERP Toko (`/id/store`) — Detail Per Panel (22 Panel)

> **Catatan Keamanan Umum:** Coba buka setiap endpoint `/api/v1/store/*` menggunakan token role `customer` -> seluruhnya wajib mengembalikan `403 Forbidden`.

| # | Panel ERP (`activeTab`) | Skenario Uji Positif & Negatif | Endpoint / Tabel | Titik Rawan Bug (*Bug Watch*) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Overview** (`overview`) | Cek total omzet, order pending, stok menipis, shortcut navigasi tab | `GET /store/metrics` | Angka omzet hanya menghitung order `PAID`/`COMPLETED`, bukan `CANCELLED` |
| 2 | **Kasir POS & Shift** (`cashierModern` / `cashier`) | 1) Klik **Buka Shift Kasir** (modal Rp 100.000) -> 2) Buat transaksi POS tunai -> 3) Klik **Tutup Shift & Rekonsiliasi** | `POST /store/shifts/open`, `POST /store/orders/pos`, `POST /store/shifts/:id/close` | `expectedCash` harus sama dengan `openingCash + totalCashSales`; tidak bisa buka 2 shift sekaligus |
| 3 | **Inventory** (`inventory`) | Tambah produk baru, edit stok/harga, hapus produk, uji **Breakdown** produk pecahan, Export/Import CSV | `GET/POST/PUT/DELETE /store/inventory`, `POST /store/inventory/breakdown` | Stok tidak boleh negatif; produk pecahan (`is_fraction`) tidak memakai harga agen jika `allow_agent_price = false` |
| 4 | **Orders** (`orders`) | Filter status, klik **Approve**, **Ship** (isi nomor resi), **Ready for Pickup**, **Complete**, **Reject** | `GET /store/orders`, `POST /store/orders/:id/{approve,ship,complete,reject}` | Reject/Cancel harus mengembalikan stok yang terpakai; nomor resi muncul di tracking customer |
| 5 | **Kasbon B2B** (`credit`) | Tinjau pengajuan kasbon (Approve/Reject), catat pelunasan cicilan, kunci/buka limit | `GET/POST /store/credit/*` / `b2b_credit.*` | Pelunasan harus menambah `currentBalance` & mencatat entri di `credit_ledger_entries` |
| 6 | **Vouchers** (`vouchers`) | Buat kupon baru (FIXED/PERCENTAGE), atur kondisi user, nonaktifkan, hapus | `GET/POST/PUT/DELETE /store/vouchers` | Kupon yang `isActive = false` atau lewat `validUntil` tidak boleh bisa dipakai saat checkout |
| 7 | **Templates** (`templates`) | Pratinjau & uji template struk/label cetak | `TemplatesPanel` | Tata letak cetak tidak terpotong di ukuran kertas thermal |
| 8 | **Reports** (`reports`) | Filter rentang tanggal laporan keuangan & klik Export CSV | `GET /store/reports/financial`, `GET /store/reports/financial/export` | Total pendapatan di CSV cocok dengan ringkasan di layar |
| 9 | **Devices** (`devices`) | Tambah perangkat POS, klik **Ping**, edit lokasi, hapus | `GET/POST/PUT/DELETE /store/devices`, `GET /store/devices/:id/ping` | Status ONLINE/OFFLINE terupdate tanpa crash |
| 10 | **Agents & Staff** (`agents`) | Tambah staf/agen baru, ubah role, set password, filter sumber `TIJARAH` vs `HSIS_SYNC` | `GET/POST/PUT/DELETE /store/agents` | Agen hasil `HSIS_SYNC` tidak boleh otomatis mendapat akses login ERP |
| 11 | **HSIS Integration** (`hsis`) | Simpan token, test koneksi, sync saldo/PO/sales, lihat laporan rekonsiliasi | `/store/hsis/*` | Sync sales HSIS tidak boleh menciptakan akun staf ERP liar |
| 12 | **Restock & Disease Trends** (`restock`) | Cek rekomendasi restock & kecepatan perputaran stok | `GET /store/stock-velocity`, `GET /store/restock-recommendations` | Produk dengan stok <= safety stock muncul di prioritas restock |
| 13 | **Delivery Methods** (`deliveryMethod`) | Tambah kurir baru, ubah tarif zona/flat, nonaktifkan, reset default | `POST/PUT/DELETE /store/delivery-methods` | Perubahan ongkir langsung tercermin di halaman Checkout |
| 14 | **E-Signature** (`esignature`) | Buat tanda tangan digital staf, unduh, hapus | `GET/POST/DELETE /store/esignatures` | Tanda tangan muncul di dokumen/struk saat order diproses oleh staf terkait |
| 15 | **Product Knowledge** (`productKnowledge`) | Edit khasiat/komposisi produk, batch update, tambah/hapus testimoni | `/store/product-knowledge` | Perubahan langsung terlihat di halaman publik khasiat/produk |
| 16 | **News / Blog** (`news`) | Buat artikel baru, upload/pasang thumbnail, publish, klik tautan pratinjau publik | `/news` (`store.news`) | ID artikel menggunakan UUID; tombol pratinjau membuka `/id/news/<uuid>` tanpa 404 |
| 17 | **Contacts** (`contacts`) | Edit info kontak outlet (WA, alamat, jam buka), ubah status pesan masuk (`NEW` -> `REPLIED`), hapus | `PUT /store/contact-info`, `GET/PATCH/DELETE /store/contact-messages` | Perubahan info kontak langsung tampil di `/id/contact` & Footer |
| 18 | **Media Library** (`media`) | Upload gambar & PDF (uji ukuran > 10MB harus ditolak), copy URL, hapus aset | `/media` (`store.media_assets`) | File > 10MB ditolak rapi (413/400) |
| 19 | **Purchasing & Supplier** (`purchasing`) | 1) Tambah supplier -> 2) Buat PO -> 3) Klik **Terima** (cek stok produk di Inventory!) -> 4) Klik **Lunasi** | `/store/suppliers`, `/store/purchase-orders` | PO berstatus `RECEIVED` tidak boleh bisa diterima dua kali; pelunasan mengubah status ke `PAID` |
| 20 | **Retur & Komplain** (`returns`) | Buka pengajuan `PENDING` dari customer -> klik **Setujui** lalu **Tandai Sudah Refund** | `GET /store/returns`, `PUT /store/returns/:id` | Saat `REFUNDED`, `paymentStatus` order berubah ke `REFUNDED` |
| 21 | **Audit Aktivitas** (`auditLogs`) | Cek log setelah melakukan Open/Close Shift, Create PO, Process Return, Update Settings | `GET /store/audit-logs` (`store.audit_logs`) | Aktor (email + role), modul, aksi, dan waktu tercatat akurat |
| 22 | **Pengaturan Toko & RBAC** (`settings`) | 1) Ubah nama toko/pajak/auto-cancel -> Simpan -> 2) Pilih role `kasir` di Matriks RBAC -> toggle 1 permission | `GET/PUT /store/settings`, `GET /store/rbac/{roles,permissions}`, `PUT /store/rbac/roles/:id/permissions` | Perubahan permission role langsung tersimpan ke `core_auth.role_permissions` & tercatat di Audit Log |
