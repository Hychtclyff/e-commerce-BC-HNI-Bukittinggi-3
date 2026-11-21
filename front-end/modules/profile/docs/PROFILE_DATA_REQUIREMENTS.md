# Spesifikasi Kebutuhan Data Modul Profile TIJARAH-3
**Dokumen Kebutuhan Data & Kontrak API Antara Front-End & Back-End**  
*Versi:* 1.0.0  
*Ekosistem:* TIJARAH-3 (BC HNI 3 Bukittinggi)  
*Stack:* Next.js 16 (Front-End) | Fastify + Prisma 8 + PostgreSQL (Back-End)

---

## 1. Ringkasan Eksekutif

Modul **Profile** pada aplikasi **TIJARAH-3** menggabungkan dua domain utama:
1. **B2C (Retail & Konsumen Umum):** Identitas pengguna, alamat pengiriman ekspedisi, riwayat belanja, dan kupon voucher.
2. **B2B (Mitra & Agen HNI):** Sinkronisasi keanggotaan HSIS HNI (Pangkat/Tier, Total Poin TP, Agency BC 3 Bukittinggi), serta **Akun Plafon Kasbon Kredit B2B** (Plafon Rp 2.000.000, Jatuh Tempo H+14, Auto-Lock, dan Ledger Mutasi).

Dokumen ini mendefinisikan seluruh struktur field, tipe data, validasi, relasi basis data, serta kontrak payload JSON API yang dibutuhkan oleh front-end `modules/profile`.

---

## 2. Pemetaan Kebutuhan Data per Sub-Panel UI

Modul profil memiliki 8 sub-panel aktif pada antarmuka pengguna:

| No | Sub-Panel | Kebutuhan Data Utama | Keterangan / Fitur |
|:---|:---|:---|:---|
| 1 | **Overview** | Ringkasan akun, sisa saldo kasbon, total poin TP HNI, total pesanan, voucher aktif, alamat utama. | Dashboard kilat status mitra. |
| 2 | **Personal** | Nama lengkap, email, nomor HP, jenis akun (`umum` / `agen`), avatar URL, tanggal bergabung. | Form update data personal. |
| 3 | **HNI Mitra** | ID Agen HNI, Nama terdaftar HSIS, Upline ID & Nama, Pangkat (AB, Manager, ED, dsb.), BC HNI 3 Bukittinggi, Status Verifikasi, Total TP. | Verifikasi keabsahan agen & info split points. |
| 4 | **Kasbon B2B** | Plafon limit (Rp 2jt), Saldo terpakai, Sisa plafon, Tanggal jatuh tempo (H+14), Status terkunci (`isLocked`), Metode posting poin (`STRICT_HOLD` / `TRUSTED_VIP`), Riwayat mutasi debit/kredit + rincian item. | Simulasi pelunasan via QRIS / VA / Transfer Bank. |
| 5 | **Alamat** | Nama penerima, no. HP penerima, alamat jalan, kecamatan, kota/kab, provinsi, kode pos, status alamat utama (`isPrimary`), catatan kurir (Travel L300 / Kargo Berat). | CRUD Alamat Pengiriman. |
| 6 | **Pesanan** | No. Invoice, tanggal, total bayar, total poin (TP), status order, metode pembayaran, status posting bot HSIS (`PENDING`, `POSTED`, `HOLD`), no. struk HSIS, no. resi kurir. | Pelacakan pesanan & poin. |
| 7 | **Vouchers** | Kode kupon, judul promo, tipe diskon (Nominal / Persen / Ongkir), nilai diskon, syarat belanja minimum, masa berlaku, status terpakai. | Klaim kupon diskon. |
| 8 | **Settings** | Ubah kata sandi (sandi lama, sandi baru), preferensi notifikasi (WhatsApp, Email, Alert HSIS), pilihan bahasa (`id`/`en`), tema (Light/Dark). | Pengaturan keamanan & akun. |

---

## 3. Spesifikasi Detail Entitas & Skema Data

### 3.1. User Core & Persona (`users` & `roles`)

Entitas identitas inti dari pengguna yang sedang login.

```typescript
export type UserTypeEnum = "umum" | "agen";

export type RoleNameEnum = 
  | "ADMIN" 
  | "CASHIER" 
  | "STOCKIST" 
  | "AGENT" 
  | "CUSTOMER" 
  | "OWNER";

export interface UserRole {
  id: string;          // UUID
  roleId: string;      // UUID
  roleName: RoleNameEnum;
  assignedAt: string;  // ISO 8601 Timestamp
}

export interface UserProfileData {
  id: string;              // UUID Primary Key
  email: string;           // Alamat email unik
  emailVerified: boolean;  // Status konfirmasi email
  fullName: string;        // Nama lengkap pengguna
  phoneNumber: string;     // Nomor WhatsApp/HP utama (format +62...)
  userType: UserTypeEnum;  // 'umum' (retail) | 'agen' (mitra HNI)
  isActive: boolean;       // Status akun aktif/suspend
  avatarUrl?: string | null; // URL foto profil
  createdAt: string;       // ISO 8601 Timestamp
  updatedAt: string;       // ISO 8601 Timestamp
  roles?: UserRole[];      // Daftar peran RBAC pengguna
}
```

---

### 3.2. HNI Profile (`hni_profiles`)

Data keanggotaan jaringan Halal Network International (HNI) yang terhubung 1-to-1 dengan user berjenis `agen`.

```typescript
export interface HniProfileData {
  id: string;              // UUID Primary Key
  userId: string;          // Relasi ke users.id
  hniMemberId: string;     // Nomor ID Agen HNI (contoh: "03148921")
  hniMemberName: string;   // Nama resmi agen di database HSIS HNI
  uplineId?: string;       // ID Upline/Mentor
  uplineName?: string;     // Nama Upline/Mentor
  titleStatus?: string;    // Pangkat tier: "AB", "MANAGER", "SM", "ED", "LED"
  combinedStatus?: string; // Kombinasi pangkat & kualifikasi
  agencyId?: string;       // ID Kantor Cabang (BC)
  agencyName?: string;     // Nama Kantor Cabang (default: "BC HNI 3 Bukittinggi")
  agencyType?: string;     // Tipe agency: "BC", "SC", "DC"
  totalPointsTP?: number;  // Akumulasi Poin Pribadi (TP) bulan berjalan
  isVerified: boolean;     // Apakah ID Agen telah diverifikasi oleh admin/bot HSIS
}
```

---

### 3.3. Alamat Pengiriman Mitra (`addresses`)

Daftar alamat pengiriman untuk pesanan belanja herba atau barang koli.

```typescript
export interface AddressData {
  id: string;              // UUID Primary Key
  userId: string;          // Relasi ke users.id
  recipientName: string;   // Nama penerima barang
  phoneNumber: string;     // Nomor kontak penerima paket
  fullAddress: string;     // Alamat lengkap (jalan, nomor rumah, RT/RW, patokan)
  district: string;        // Kecamatan
  city: string;            // Kota / Kabupaten (contoh: "Bukittinggi", "Agam")
  province: string;        // Provinsi (default: "Sumatera Barat")
  postalCode: string;      // Kode Pos 5 digit
  isPrimary: boolean;      // Penanda alamat default/utama
  notes?: string | null;   // Catatan khusus kurir (misal: "Titip di Loket Travel L300")
  createdAt?: string;      // ISO 8601 Timestamp
  updatedAt?: string;      // ISO 8601 Timestamp
}
```

---

### 3.4. Akun Kasbon B2B (`b2b_credit_profiles`)

Profil pinjaman belanja tempo mitra stokis/agen resmi TIJARAH-3.

```typescript
export interface B2BCreditProfileData {
  id: string;              // UUID Primary Key
  userId: string;          // Relasi ke users.id
  creditLimit: number;     // Plafon pinjaman (Default: 2000000)
  currentBalance: number;  // Sisa limit yang masih dapat digunakan
  usedBalance: number;     // Total tagihan/utang kasbon aktif
  dueDate?: string | null; // Tanggal jatuh tempo pelunasan (H+14 dari transaksi kasbon)
  isLocked: boolean;       // Status auto-lock belanja tempo jika menunggak melewati H+14
  postingMode: "STRICT_HOLD" | "TRUSTED_VIP";
  // STRICT_HOLD = Poin HSIS baru di-post setelah kasbon lunas
  // TRUSTED_VIP = Poin HSIS langsung di-post saat pesanan dikirim
  createdAt?: string;
  updatedAt?: string;
}
```

---

### 3.5. Riwayat Mutasi Piutang Kasbon (`credit_ledger_entries`)

Pencatatan mutasi transaksi piutang belanja tempo (disbursement, repayment, adjustment).

```typescript
export interface OrderItemDetail {
  id: string;              // ID Item
  productName: string;     // Nama produk herba (contoh: "Minyak Herba Sinergi")
  qty: number;             // Jumlah kuantitas barang
  unitPrice: number;       // Harga satuan mitra (Rp)
  tpPoints: number;        // Nilai Poin TP satuan
  totalPrice: number;      // Total harga item (qty * unitPrice)
}

export interface CreditLedgerEntry {
  id: string;              // UUID Primary Key
  creditProfileId: string; // Relasi ke b2b_credit_profiles.id
  type: "DISBURSEMENT" | "REPAYMENT" | "ADJUSTMENT";
  // DISBURSEMENT = Pengambilan belanja tempo (tagihan bertambah)
  // REPAYMENT    = Pembayaran kasbon (tagihan berkurang)
  // ADJUSTMENT   = Koreksi saldo kasbon oleh finance
  amount: number;          // Nominal mutasi (Rp)
  runningBalance: number;  // Sisa saldo utang setelah mutasi
  referenceNo?: string;    // No. Invoice (INV/...) atau Bukti Bayar (PAY/...)
  description: string;     // Keterangan transaksi
  items?: OrderItemDetail[]; // Rincian item barang pada faktur (opsional jika disbursement)
  createdAt: string;       // Waktu transaksi mutasi
}
```

---

### 3.6. Riwayat Pesanan & Status HSIS (`orders`)

Ringkasan transaksi pesanan produk.

```typescript
export interface UserOrderSummary {
  id: string;              // UUID Order
  invoiceNo: string;       // No. Faktur (contoh: "INV/2026/09/BC3-0042")
  date: string;            // Tanggal transaksi
  totalAmount: number;     // Total belanja (Rp)
  totalPoints: number;     // Total Poin TP yang didapat
  status: "PENDING_PAYMENT" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  paymentMethod: "CASH" | "QRIS" | "VA" | "KASBON";
  hsisPostingStatus: "PENDING" | "PROCESSING" | "POSTED" | "HOLD";
  // HOLD = Ditahan karena pembayaran tempo belum lunas (STRICT_HOLD)
  hsisReceiptNo?: string;  // No. Struk input HSIS resmi dari HNI
  trackingNumber?: string; // No. Resi Ekspedisi / Info Pengemudi Travel
  itemsCount: number;      // Total jumlah kuantitas barang
  items?: OrderItemDetail[];
}
```

---

### 3.7. Voucher & Promo Pengguna (`user_vouchers`)

```typescript
export interface UserVoucher {
  id: string;              // UUID Voucher
  code: string;            // Kode Voucher (contoh: "TIJARAHHERBA20")
  title: string;           // Judul Promo
  discountType: "FIXED" | "PERCENTAGE" | "SHIPPING_SUBSIDY";
  discountValue: number;   // Nilai potongan (Rp atau %)
  minPurchase: number;     // Syarat belanja minimum (Rp)
  maxDiscount?: number;    // Batas potongan maksimum (untuk %)
  validUntil: string;      // Masa berlaku ISO 8601
  isUsed: boolean;         // Apakah sudah pernah digunakan
  description: string;     // Keterangan & syarat ketentuan
}
```

---

## 4. Spesifikasi Kontrak API Back-End

Standar pembungkus respons JSON (Standard Response Utility):

```json
{
  "status": "success",
  "message": "Pesan sukses respons (terjemahan otomatis i18n)",
  "data": { ... }
}
```

### 4.1. `GET /api/v1/profile/:id` (atau `GET /api/v1/auth/profile`)

*Controller:* `profileController.getProfile`  
*Schema Validator:* `getProfileSchema`  
*Deskripsi:* Mengambil data profil lengkap milik pengguna terautentikasi atau berdasarkan ID.

**Query Parameters:**
- `lang` (opsional): `"id"` | `"en"` (default: `"id"`)

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Profil berhasil dimuat",
  "data": {
    "user": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "mitra.hni@tijarah3.com",
      "emailVerified": true,
      "fullName": "Umar Al-Faruq",
      "phoneNumber": "+6281234567890",
      "userType": "agen",
      "isActive": true,
      "avatarUrl": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
      "createdAt": "2026-01-15T08:30:00.000Z",
      "updatedAt": "2026-09-20T11:45:00.000Z",
      "roles": [
        {
          "id": "role_usr_1",
          "roleId": "role_stockist",
          "roleName": "STOCKIST",
          "assignedAt": "2026-01-15T08:30:00.000Z"
        }
      ]
    },
    "hniProfile": {
      "id": "hni_prof_01",
      "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "hniMemberId": "03148921",
      "hniMemberName": "UMAR AL-FARUQ",
      "uplineId": "01002931",
      "uplineName": "H. AHMAD DAHLAN (ED)",
      "titleStatus": "Senior Manager (SM)",
      "combinedStatus": "SM - Qualified 200 TP",
      "agencyId": "BC-SUMBAR-03",
      "agencyName": "BC HNI 3 Bukittinggi",
      "agencyType": "BC",
      "totalPointsTP": 350,
      "isVerified": true
    }
  }
}
```

---

### 4.2. `PUT /api/v1/auth/profile`

*Deskripsi:* Memperbarui data profil personal pengguna.

**Request Body:**
```json
{
  "fullName": "Umar Al-Faruq, S.E.",
  "phoneNumber": "+6281234567890",
  "email": "umar.alfaruq@gmail.com"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Profil berhasil diperbarui",
  "data": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "fullName": "Umar Al-Faruq, S.E.",
    "phoneNumber": "+6281234567890",
    "email": "umar.alfaruq@gmail.com",
    "updatedAt": "2026-09-26T09:40:00.000Z"
  }
}
```

---

### 4.3. `GET /api/v1/credit/account`

*Deskripsi:* Mengambil status akun pinjaman belanja kasbon B2B mitra.

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Akun kasbon berhasil dimuat",
  "data": {
    "id": "cred_acc_001",
    "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "creditLimit": 2000000,
    "currentBalance": 1250000,
    "usedBalance": 750000,
    "dueDate": "2026-10-10T23:59:59.000Z",
    "isLocked": false,
    "postingMode": "STRICT_HOLD",
    "createdAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-09-26T08:00:00.000Z"
  }
}
```

---

### 4.4. `GET /api/v1/credit/ledger`

*Deskripsi:* Mengambil riwayat mutasi piutang/kasbon dan rincian belanja per faktur.

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Riwayat mutasi kasbon berhasil dimuat",
  "data": [
    {
      "id": "led_01",
      "creditProfileId": "cred_acc_001",
      "type": "DISBURSEMENT",
      "amount": 750000,
      "runningBalance": 750000,
      "referenceNo": "INV/2026/09/BC3-0042",
      "description": "Pengambilan Barang Tempo 1 Koli Herba HNI",
      "createdAt": "2026-09-22T14:30:00.000Z",
      "items": [
        {
          "id": "item_1",
          "productName": "Minyak Herba Sinergi (MHS 100ml)",
          "qty": 5,
          "unitPrice": 45000,
          "tpPoints": 10,
          "totalPrice": 225000
        },
        {
          "id": "item_2",
          "productName": "Susu Kambing Etta Goat Milk HNI",
          "qty": 7,
          "unitPrice": 75000,
          "tpPoints": 20,
          "totalPrice": 525000
        }
      ]
    },
    {
      "id": "led_02",
      "creditProfileId": "cred_acc_001",
      "type": "REPAYMENT",
      "amount": 500000,
      "runningBalance": 0,
      "referenceNo": "PAY/2026/09/BC3-0012",
      "description": "Pembayaran Kasbon via QRIS Statis BC3",
      "createdAt": "2026-09-15T09:15:00.000Z"
    }
  ]
}
```

---

### 4.5. `GET /api/v1/user/addresses`

*Deskripsi:* Mengambil daftar alamat pengiriman mitra.

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Daftar alamat berhasil dimuat",
  "data": [
    {
      "id": "addr_01",
      "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "recipientName": "Umar Al-Faruq (Stokis Bukittinggi)",
      "phoneNumber": "+6281234567890",
      "fullAddress": "Jl. Panorama No. 18, Depan RSUD Bukittinggi",
      "district": "Guguk Panjang",
      "city": "Kota Bukittinggi",
      "province": "Sumatera Barat",
      "postalCode": "26115",
      "isPrimary": true,
      "notes": "Titip di Loket Travel L300 Aur Kuning",
      "createdAt": "2026-02-01T04:00:00.000Z",
      "updatedAt": "2026-09-20T10:00:00.000Z"
    }
  ]
}
```

---

## 5. Ringkasan Aturan Bisnis Penting (Business Rules)

1. **Aturan Kasbon B2B (PRD Sec. 5.2):**
   - Plafon default adalah **Rp 2.000.000**.
   - Jatuh tempo dihitung **H+14** hari sejak transaksi belanja kasbon pertama dalam periode berjalan.
   - Jika menunggak melewati H+14, flag `isLocked` otomatis bernilai `true` (transaksi baru via kasbon diblokir).
   - Mode `STRICT_HOLD`: Poin HSIS tidak akan dikirim/di-post oleh bot Playwright hingga faktur kasbon lunas.

2. **Aturan Verifikasi HNI (`hni_profiles`):**
   - Agen HNI terverifikasi (`isVerified: true`) memiliki akses ke harga agen (harga modal distributor) dan berhak meminta alokasi **Split Point** ke downline.

3. **Format Nomor Telepon & Lokalisasi:**
   - Semua nomor telepon disimpan dalam format E.164 berawalan `+62` (atau kode negara terpilih).
   - Semua respons API mendukung header / query `lang=id` atau `lang=en`.
