# Rencana Implementasi Modul Profil Pengguna TIJARAH-3

Rencana ini menyusun arsitektur dan rancangan komponen untuk **Modul Profil Pengguna** (`modules/profile`) pada aplikasi **TIJARAH-3** sesuai dengan spesifikasi pada **PRD v2.0 BC HNI 3 Bukittinggi**, standar **Tijarah UI Component**, dan arsitektur Next.js 16 (App Router + i18n).

---

## User Review Required

> [!IMPORTANT]
> **Struktur Data & Fitur Utama Modul Profil TIJARAH-3:**
> 1. **Header & Persona Badging (RBAC)**: Tampilan visual kartu identitas anggota sesuai role (`CUSTOMER`, `AGENT`, `STOCKIST`, `CASHIER`, `ADMIN`, `OWNER`) dengan aksen warna HSL Sage Green & Gold Accent.
> 2. **Integrasi Data Keanggotaan HNI**: Menampilkan ID Agen HNI, Pangkat/Tier Mitra, serta akumulasi Total Poin (TP).
> 3. **Panel Kontrol Kasbon / Plafon Kredit B2B (`BO-CREDIT` / PRD Sec. 5.2 & 6.1)**:
>    - Dashboard Plafon Kredit (Default Rp 2.000.000).
>    - Indikator Sisa Limit, Tanggal Jatuh Tempo ($H+14$), dan Status *Auto-Lock* (`is_locked`).
>    - Tabel riwayat mutasi piutang (*immutable credit ledger*).
> 4. **Manajemen Alamat Pengiriman**: Pengelolaan alamat utama, catatan kurir travel & kargo berat.
> 5. **Lacak Pesanan & Otomasi HSIS**: Riwayat transaksi, status posting bot HSIS, resi travel/kargo, serta nota WhatsApp.
> 6. **Voucher & Promo Engine**: Daftar voucher diskon aktif dan subsidi ongkir.
> 7. **Setelan Akun & Preferensi**: Switching bahasa (ID/EN) terintegrasi `next-intl`, mode gelap/terang, dan preferensi notifikasi.

---

## Proposed Changes

### 1. Tipe Data & Kamus Bahasa (`types` & `dictionaries`)

#### [NEW] [`modules/profile/types/profile.types.ts`](file:///d:/Developer/Tijarah/front-end/modules/profile/types/profile.types.ts)
- Mengutip interface untuk `UserProfile`, `HniMembershipData`, `CreditAccountData`, `CreditLedgerItem`, `UserAddress`, `UserVoucher`, `ProfileTabType`.

#### [NEW] [`modules/profile/dictionaries/id.json`](file:///d:/Developer/Tijarah/front-end/modules/profile/dictionaries/id.json)
#### [NEW] [`modules/profile/dictionaries/en.json`](file:///d:/Developer/Tijarah/front-end/modules/profile/dictionaries/en.json)
- Kamus lokalisasi teks untuk seluruh label panel, form profil, status kredit kasbon, HNI ID, pesanan, dan setelan.

---

### 2. Komponen Atom & Organisme Profil (`modules/profile/components`)

#### [NEW] [`modules/profile/components/organism/ProfileHeader.tsx`](file:///d:/Developer/Tijarah/front-end/modules/profile/components/organism/ProfileHeader.tsx)
- Banner profil interaktif dengan foto avatar, nama lengkap, email, nomor HP, badge role RBAC, ID Agen HNI, dan total akumulasi Poin TP dengan efek *glow accent*.

#### [NEW] [`modules/profile/components/organism/ProfileStatsCards.tsx`](file:///d:/Developer/Tijarah/front-end/modules/profile/components/organism/ProfileStatsCards.tsx)
- Grid kartu statistik cepat:
  - **Kartu Pesanan Aktif**: Jumlah transaksi berlangsung.
  - **Kartu Poin HNI (TP)**: Akumulasi poin belanja mandiri & grosir.
  - **Kartu Plafon Kasbon Kredit**: Sisa limit & indikator status $H+14$.
  - **Kartu Voucher Aktif**: Jumlah voucher diskon & subsidi ongkir.

#### [NEW] [`modules/profile/components/organism/ProfileTabsNav.tsx`](file:///d:/Developer/Tijarah/front-end/modules/profile/components/organism/ProfileTabsNav.tsx)
- Navigasi tab responsif (ScrollShadow / Segmented Tabs) untuk berpindah antarpanel:
  1. `overview` (Ringkasan Stat & Aktivitas)
  2. `personal` (Data Diri & Keamanan)
  3. `hni` (Data Keanggotaan HNI & Poin)
  4. `kasbon` (Panel Plafon Kredit B2B / Tempo)
  5. `addresses` (Daftar Alamat Pengiriman)
  6. `orders` (Riwayat & Status Pesanan)
  7. `vouchers` (Voucher & Kupon Saya)
  8. `settings` (Pengaturan Akun & Preferensi)

---

### 3. Panel Detail Sub-Modul (`modules/profile/components/organism/panels`)

#### [NEW] [`modules/profile/components/organism/panels/ProfileDataPanel.tsx`](file:///d:/Developer/Tijarah/front-end/modules/profile/components/organism/panels/ProfileDataPanel.tsx)
- Formulir ubah data diri (Nama Lengkap, Email, No. Telepon/WA) dan form ubah kata sandi menggunakan `TijarahInput` & React Hook Form + Zod.

#### [NEW] [`modules/profile/components/organism/panels/HniMembershipPanel.tsx`](file:///d:/Developer/Tijarah/front-end/modules/profile/components/organism/panels/HniMembershipPanel.tsx)
- Kartu ID digital HNI resmi, peringkat mitra (Stokis/Agen/Mitra), total poin TP, serta info alokasi *split point*.

#### [NEW] [`modules/profile/components/organism/panels/KasbonCreditPanel.tsx`](file:///d:/Developer/Tijarah/front-end/modules/profile/components/organism/panels/KasbonCreditPanel.tsx)
- **Modul Kontrol Piutang/Kasbon B2B (`BO-CREDIT`)**:
  - Gauge/Progress bar penggunaan limit kredit (Plafon Rp 2.000.000).
  - Alert Peringatan Jatuh Tempo ($H+14$) & Status Kunci Akun (*Auto-Lock*).
  - Tabel Mutasi Buku Besar Kredit (*Immutable Ledger*): Tanggal, No. Invoice, Jenis (Pencairan / Pelunasan), Nominal, Sisa Saldo.
  - Informasi Kebijakan Posting Poin (*Strict Hold vs Trusted VIP Mode*).

#### [NEW] [`modules/profile/components/organism/panels/AddressesPanel.tsx`](file:///d:/Developer/Tijarah/front-end/modules/profile/components/organism/panels/AddressesPanel.tsx)
- Manajemen daftar alamat pengiriman (Tambah Alamat, Edit, Set Sebagai Utama, Catatan Khusus Travel L300 / Kargo Berat).

#### [NEW] [`modules/profile/components/organism/panels/MyOrdersPanel.tsx`](file:///d:/Developer/Tijarah/front-end/modules/profile/components/organism/panels/MyOrdersPanel.tsx)
- Filter status pesanan (Semua, Menunggu Pembayaran, Diproses, Dikirim, Selesai), indikator posting bot HSIS, serta link lacak WhatsApp.

#### [NEW] [`modules/profile/components/organism/panels/VouchersPanel.tsx`](file:///d:/Developer/Tijarah/front-end/modules/profile/components/organism/panels/VouchersPanel.tsx)
- Grid kartu voucher diskon, potong harga, dan subsidi ongkir travel regional dengan klaim kode promo.

#### [NEW] [`modules/profile/components/organism/panels/SettingsPanel.tsx`](file:///d:/Developer/Tijarah/front-end/modules/profile/components/organism/panels/SettingsPanel.tsx)
- Preferensi aplikasi: Switcher bahasa (`id` / `en`), switcher tema (`light` / `dark`), serta toggle notifikasi WhatsApp & Email.

---

### 4. Utama Orchestrator (`modules/profile/components/profile.tsx`)

#### [MODIFY] [`modules/profile/components/profile.tsx`](file:///d:/Developer/Tijarah/front-end/modules/profile/components/profile.tsx)
- Menggabungkan `ProfileHeader`, `ProfileStatsCards`, `ProfileTabsNav`, dan switch render panel sesuai tab aktif dengan animasi halus menggunakan `AuthCardWrapper` / Framer Motion (`motion.div` & `AnimatePresence`).

---

5. seandanya ada komponen heroUI di modif atau kemungkinan akan digaunakan dikomponen lain didfentisika nseprti agents\docs\tijarahAtomComponentsGuide.md
6. gunakan styling full tailwdinf yang rapi jika bisa gunakan clsx dan animasi simple yang tidak terlalu berat dari farmer
7. gunakan icon dari @/shared/components/ui/icons atau bisa import dari heroicons
8. darkmode dan fitur englisg serta responsife
9. gunakan tipe data yang sudah ada dari @/lib/types atau @/types.d.ts
10. clean code seperti telah di code sebelumnya menggunakan atometic design atom molecules orginsm template sertapage
11. kemudian list api yang dibutuhkan serta kebuuthan bentuk data dan kirimkan ke folder api di setiap folder module
12. terkait hooks jika ada hooks yang resuble maka deklarasikan secara clean code
13. styling mengikut css global dari folder @/shared/assets/css/globals.css dan gunakan type safe css

## Verification Plan

### Automated Verification
1. **TypeScript Verification**:
   - Jalankan `npx tsc --noEmit` atau build check pada modul `profile` untuk memastikan tidak ada error tipe props.
2. **ESLint Lint Check**:
   - Jalankan `npm run lint` untuk memastikan tidak ada peringatan syntax atau kode mati.

### Manual Verification
1. **Navigasi Tab Profile**:
   - Berpindah antar-tab (`Overview`, `Data Diri`, `Data HNI`, `Kasbon Kredit`, `Alamat`, `Pesanan`, `Voucher`, `Settings`) dan pastikan konten berganti secara responsif dengan animasi transisi yang mulus.
2. **Visual & Dark Mode**:
   - Beralih antara Dark Mode dan Light Mode pada `SettingsPanel` untuk memastikan token warna HSL (Sage Green, Gold Accent, Canvas, Surface) konsisten dengan aturan 60-30-10 PRD.
3. **Simulasi Plafon Kredit B2B**:
   - Memastikan info Plafon Kredit (Rp 2 Jt), Sisa Limit, Tanggal Jatuh Tempo $H+14$, dan indikator status *Auto-Lock* tampil sesuai rancangan bisnis PRD.



