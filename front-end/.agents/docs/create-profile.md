Product Requirement Document (PRD) Lengkap & Spesifikasi Implementasi FE: Modul Profil Pengguna TIJARAH-3
Dokumen ini merupakan Spesifikasi Kebutuhan Produk (PRD) dan Panduan Arsitektur Implementasi Front-End (FE) yang komprehensif serta utuh untuk Modul Profil Pengguna TIJARAH-3 (modules/profile). Modul ini mengintegrasikan layanan e-commerce Business-to-Consumer (B2C) dan Business-to-Business (B2B) untuk Halal Network International (HNI) Business Center (BC) 3 Bukittinggi, diselaraskan penuh dengan arsitektur Next.js 16 (App Router + next-intl i18n), sistem desain Atomic Design, serta skema basis data Prisma 8 (core_auth).

1. Arsitektur & Lingkup Khusus Front-End (FE Scope)
Framework & Core Engine: Next.js 16 memanfaatkan App Router, React Server Components (RSC), dan Client Components untuk performa optimal.
Internasionalisasi & Lokalisasi (i18n): Integrasi next-intl dengan dukungan Bahasa Indonesia (id) dan Bahasa Inggris (en) di seluruh modul.
Routing & Orchestration: Main route page berada pada app/[lang]/(main)/profile/page.tsx yang mengeksekusi master orchestrator component modules/profile/components/profile.tsx.
Kesesuaian Database Prisma 8: Integrasi 100% dengan namespace core_auth (Model: User, HNIProfile, Address, Role, Permission, UserRole, RolePermission).
Sistem Desain & Palet Warna (Rule 60-30-10): Penerapan Tailwind CSS dengan variabel token HSL: Base Canvas 60% (#F8FAF8), Structure/Text 30% (#1F2823 / #DDE5DF), Accent/Action 10% Sage Green (#5E7A68) & Gold (#C59B27).

2. Pemetaan Struktur Direktori Repositori FE
Implementasi modul profil harus mengikuti struktur folder repositori front-end berikut:


3. Spesifikasi Tipe Data TypeScript (modules/profile/types/profile.types.ts)
Disesuaikan 100% dengan skema Prisma 8 (core_auth):


4. Arsitektur Komponen & Atomic Design FE (modules/profile/components/)
4.1 Atoms (Memanfaatkan components/atom/)
tijarahBadge: Indikator status verifikasi HNI (isVerified), status kasbon (active/locked_due), dan badge Alamat Utama (isPrimary).
tijarahButton: Tombol aksi (Edit Profil, Tambah Alamat, Bayar Kasbon).
tijarahCard: Container untuk section profil, kartu plafon kasbon, dan item alamat.
tijarahInput & tijarahTextArea: Form input data personal (fullName, phoneNumber, email) dan alamat pengiriman (fullAddress, district, city, province).
4.2 Molecules
AddressCard: Menampilkan data alamat lengkap (recipientName, phoneNumber, fullAddress, district, city, province), badge isPrimary, dan opsi set/edit/delete.
CreditLedgerRow: Baris riwayat mutasi debit/kredit piutang kasbon B2B.
HniAgentCard: Kartu detail keanggotaan HNI (hniMemberId, hniMemberName, uplineName, titleStatus, combinedStatus, status isVerified).
4.3 Organisms & Sub-Panels
ProfileHeader: Avatar pengguna, fullName, phoneNumber, hniMemberId, dan badge status.
ProfileStatsCards: Widget ringkasan cepat (Sisa Limit Kasbon, Status Verifikasi HNI, Jumlah Pesanan Aktif).
ProfileTabsNav: Navigasi tab responsif (8 sub-panel tab).
Sub-Panel Panels (modules/profile/components/organism/panels/):
OverviewPanel: Dashboard ringkasan profil.
PersonalPanel: Form edit fullName, email, dan phoneNumber.
HniPanel: Informasi keanggotaan HNI lengkap (hniMemberId, hniMemberName, uplineId/uplineName, agencyName, isVerified).
KasbonPanel: Ringkasan plafon Rp 2.000.000, indikator jatuh tempo H+14, warning lock, dan tabel ledger.
AddressesPanel: Manajemen CRUD alamat pengiriman (Address model Prisma).
OrdersPanel: Riwayat pesanan E-Commerce.
VouchersPanel: Daftar voucher diskon pengguna.
SettingsPanel: Pengaturan akun, ganti kata sandi, dan opsi preferensi.

5. Custom Hooks & State Management FE (modules/profile/hooks/)
useProfile(): Fetching & pembaruan data profil pengguna (User & HNIProfile), menangani loading state dan mutasi via axiosInstance.
useKasbonCredit(): Menghitung sisa limit kasbon B2B (creditLimit - currentBalance), memeriksa status warning jika mendekati/melewati jatuh tempo H+14, serta memuat riwayat mutasi ledger.
useUserAddresses(): Pengelolaan CRUD alamat pengiriman (Address Prisma Model), opsi set alamat utama (isPrimary), dan sinkronisasi data wilayah (province, city, district).

6. Layanan API Client FE (modules/profile/api/profile.api.ts)
Menggunakan lib/axios/client.ts untuk komunikasi dengan backend API:
GET /api/v1/auth/profile - Mengambil profil User & HNIProfile.
PUT /api/v1/auth/profile - Memperbarui data personal (fullName, email, phoneNumber).
GET /api/v1/credit/account - Mengambil plafon kasbon B2B & status lock H+14.
GET /api/v1/credit/ledger - Mengambil riwayat mutasi piutang.
GET /api/v1/user/addresses - Mengambil daftar alamat (Address[]).
POST /api/v1/user/addresses - Menambah alamat baru.
PUT /api/v1/user/addresses/:id - Memperbarui alamat.
DELETE /api/v1/user/addresses/:id - Menghapus alamat.

7. Skema Basis Data PostgreSQL Prisma 8 (core_auth)
Rujukan spesifikasi konseptual lengkap model Prisma 8 (namespace core_auth) backend yang diintegrasikan untuk pemetaan data dan DTO Front-End:
1. Entitas users (Core Auth & Identity):
id: UUID (Primary Key, Identitas unik pengguna)
email: String / Varchar (Unik, opsional/wajib untuk autentikasi)
fullName: String / Varchar (Nama lengkap pengguna)
phoneNumber: String / Varchar (Unik, nomor HP utama)
userType: Enum ('umum', 'agen')
isActive: Boolean (Status aktif akun)
createdAt & updatedAt: Timestamp dengan Zona Waktu
2. Entitas hni_profiles (Keanggotaan & Mitra HNI):
id: UUID (Primary Key)
userId: UUID (Foreign Key ke users.id, Relasi 1-to-1)
hniMemberId: String / Varchar (Unik, ID Agen HNI terdaftar)
hniMemberName: String / Varchar (Nama terdaftar di portal HSIS)
uplineId & uplineName: String / Varchar (ID & Nama Upline pembina)
titleStatus: String / Varchar (Pangkat/Tier mitra, contoh: AB, Manager, ED)
combinedStatus: String / Varchar (Kombinasi status agen & kualifikasi)
agencyId, agencyName, agencyType: Detail BC / Sub-BC pendukung
isVerified: Boolean (Status verifikasi keabsahan ID HNI)
3. Entitas addresses (Alamat Pengiriman & Ekspedisi):
id: UUID (Primary Key)
userId: UUID (Foreign Key ke users.id, Relasi 1-to-Many)
recipientName: String / Varchar (Nama penerima paket)
phoneNumber: String / Varchar (Nomor telepon penerima)
fullAddress: Text (Alamat lengkap jalan/patokan)
district: String / Varchar (Kecamatan)
city: String / Varchar (Kota / Kabupaten)
province: String / Varchar (Provinsi, default: Sumatera Barat)
postalCode: String / Varchar (Kode pos 5 digit)
isPrimary: Boolean (Penanda alamat utama)
notes: Text (Catatan khusus instruksi kurir Travel L300 / Kargo Berat)
4. Entitas Dynamic RBAC (roles, permissions, user_roles, role_permissions):
roles: Definisi peran pengguna (admin, kasir, stokis, member, umum)
permissions: Akses atomik berbasis format resource:action (profile:read, credit:manage, dll)
user_roles & role_permissions: Tabel persimpangan (Junction Tables) untuk pemetaan peran dan izin pengguna
5. Entitas Plafon Kredit & Mutasi B2B (b2b_credit_profiles & credit_ledger_entries):
b2b_credit_profiles: Mengelola creditLimit (default Rp 2.000.000), currentBalance (sisa batas penggunaan), dueDate (jatuh tempo H+14), dan status isLocked.
credit_ledger_entries: Catatan riwayat mutasi piutang (immutable credit ledger) yang mencatat transaksi debit, kredit, referensi pesanan, dan saldo berjalan.

8. Design System, Styling & Rule 60-30-10
Base/Canvas (60%): --bg-canvas (#F8FAF8), Surface White (#FFFFFF).
Structure/Text (30%): --border-subtle (#DDE5DF), --text-primary (#1F2823), --text-muted (#66786C).
Accent/Action (10%): --primary-sage (#5E7A68), --accent-gold (#C59B27).
Semantic Status: Success (#1C8D3E), Warning (#F29D0C), Danger (#E81C1C).

9. Rencana Verifikasi & QA Front-End
Automated Verification:
Eksekusi perintah npx tsc --noEmit untuk memastikan Type Safety seluruh komponen, props, serta DTO profil sesuai dengan skema Prisma 8.
Eksekusi perintah npm run lint untuk mengaudit sintaksis Next.js 16, aturan React Hooks, dan kepatuhan ESLint.
Manual Testing:
Pengujian switching 8 tab sub-panel secara responsif pada ukuran Mobile & Desktop.
Pengujian alur CRUD alamat berdasarkan model Prisma Address (recipientName, phoneNumber, fullAddress, district, city, province).
Simulasi indikator plafon kasbon B2B Rp 2.000.000 dan peringatan jatuh tempo H+14.
Switching bahasa (id/en) dan toggle Dark/Light Mode.

Rencana Implementasi Modul Profil Pengguna TIJARAH-3
Rencana ini menyusun arsitektur dan rancangan komponen untuk Modul Profil Pengguna (modules/profile) pada aplikasi TIJARAH-3 sesuai dengan spesifikasi pada PRD v2.0 BC HNI 3 Bukittinggi, standar Tijarah UI Component, dan arsitektur Next.js 16 (App Router + i18n).
10. Ringkasan Fitur Utama Modul Profil TIJARAH-3
Header & Persona Badging (RBAC): Tampilan visual kartu identitas anggota sesuai role (CUSTOMER, AGENT, STOCKIST, CASHIER, ADMIN, OWNER) dengan aksen warna HSL Sage Green & Gold Accent.
Integrasi Data Keanggotaan HNI: Menampilkan ID Agen HNI, Pangkat/Tier Mitra, serta akumulasi Total Poin (TP).
Panel Kontrol Kasbon / Plafon Kredit B2B (BO-CREDIT / PRD Sec. 5.2 & 6.1): Dashboard Plafon Kredit (Default Rp 2.000.000), Indikator Sisa Limit, Tanggal Jatuh Tempo (H+14), dan Status Auto-Lock (is_locked), serta Tabel riwayat mutasi piutang (immutable credit ledger).
Manajemen Alamat Pengiriman: Pengelolaan alamat utama, catatan kurir travel & kargo berat.
Lacak Pesanan & Otomasi HSIS: Riwayat transaksi, status posting bot HSIS, resi travel/kargo, serta nota WhatsApp.
Voucher & Promo Engine: Daftar voucher diskon aktif dan subsidi ongkir.
Setelan Akun & Preferensi: Switching bahasa (ID/EN) terintegrasi next-intl, mode gelap/terang, dan preferensi notifikasi.
11. Panduan Standar Kode & Arsitektur Komponen
UI Components Guide: Menggunakan pendefinisian komponen atomik reusable secara konsisten sesuai panduan desain Tijarah UI.
Styling & Animation: Menggunakan styling Tailwind CSS penuh yang rapi, helper clsx / tailwind-merge, serta animasi transisi yang ringan menggunakan Framer Motion.
Icons: Menggunakan icon dari @/shared/components/ui/icons atau Heroicons.
Accessibility & Responsiveness: Memastikan dukungan penuh untuk Dark Mode, Bahasa Inggris/Indonesia (i18n), dan tampilan responsif di seluruh ukuran layar.
Type Safety: Memanfaatkan tipe data terdefinisi dari @/lib/types atau modules/profile/types/profile.types.ts.
Clean Code & Modularization: Menerapkan prinsip Clean Code dengan hirarki Atomic Design (Atoms, Molecules, Organisms, Panels, Page/Template).
API & State Management: Mendefinisikan seluruh fungsi fetcher API di folder api/ modul serta memisahkan logika ke dalam custom hooks yang reusable.
Type Safe CSS: Mengikuti token CSS global dari @/shared/assets/css/globals.css.


