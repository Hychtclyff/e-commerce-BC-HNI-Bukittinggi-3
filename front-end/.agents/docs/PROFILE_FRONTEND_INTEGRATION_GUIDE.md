# Panduan Integrasi API Modul Profile (Front-End Integration Guide)
**Ekosistem:** TIJARAH-3 (BC HNI 3 Bukittinggi)  
**Base URL:** `/api/v1`  
**Standar Respon:** JSON Response Envelope dengan Dukungan i18n (`id` / `en`)

---

## 1. Standar Format Respon & Header

Semua request mendukung header lokalisasi atau query parameter `lang`:
- Header: `Accept-Language: id` atau `Accept-Language: en`
- Query param: `?lang=id` atau `?lang=en`

### Format Sukses (HTTP 200 / 201):
```json
{
  "status": "success",
  "message": "Pesan berhasil dalam bahasa terjemahan",
  "data": { ... }
}
```

### Format Error (HTTP 400 / 404 / 429 / 500):
```json
{
  "status": "error",
  "message": "Pesan error dalam bahasa terjemahan",
  "details": { ... }
}
```

---

## 2. Ringkasan Endpoint API per Sub-Panel

| Sub-Panel | Method | Endpoint | Deskripsi |
|:---|:---|:---|:---|
| **Overview / Personal** | `GET` | `/api/v1/profile/:id` | Ambil profil lengkap (User, HNI, Alamat, Kasbon) |
| **Personal** | `PUT` | `/api/v1/profile/:id` | Update data personal (Nama, HP, Email) |
| **Kasbon B2B** | `GET` | `/api/v1/credit/account/:userId` | Ambil status plafon kasbon & batas tempo |
| **Kasbon B2B** | `GET` | `/api/v1/credit/ledger/:userId` | Ambil riwayat mutasi piutang & rincian faktur |
| **Alamat** | `GET` | `/api/v1/user/addresses/:userId` | Ambil daftar alamat pengiriman |
| **Alamat** | `POST` | `/api/v1/user/addresses` | Tambah alamat pengiriman baru |
| **Alamat** | `PUT` | `/api/v1/user/addresses/:id` | Update data alamat |
| **Alamat** | `DELETE` | `/api/v1/user/addresses/:id` | Hapus alamat |
| **Alamat** | `PATCH` | `/api/v1/user/addresses/:id/primary` | Jadikan alamat utama (Primary Address) |
| **Vouchers** | `GET` | `/api/v1/vouchers/:userId` | Ambil daftar voucher & promo aktif |

---

## 3. Detail Kontrak Endpoint API

### 3.1. Overview & Data Personal (`/api/v1/profile`)

#### A. `GET /api/v1/profile/:id`
Mengambil profil lengkap pengguna beserta status HNI, daftar alamat, dan status kasbon B2B.

**Response Example (200 OK):**
```json
{
  "status": "success",
  "message": "Profil pengguna berhasil diambil.",
  "data": {
    "user": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "fullName": "Ahmad Fauzi, S.T.",
      "phoneNumber": "+6281267890123",
      "email": "mitra.hni@tijarah.id",
      "userType": "agen",
      "isActive": true,
      "createdAt": "2026-01-15T08:30:00.000Z",
      "updatedAt": "2026-09-26T16:00:00.000Z"
    },
    "hniProfile": {
      "id": "hni_prof_01",
      "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "hniMemberId": "01234567",
      "hniMemberName": "AHMAD FAUZI",
      "uplineId": "01002931",
      "uplineName": "H. AHMAD DAHLAN (ED)",
      "titleStatus": "Executive Director (ED)",
      "combinedStatus": "ED - Qualified 200 TP",
      "agencyId": "BC-SUMBAR-03",
      "agencyName": "BC HNI 3 Bukittinggi",
      "agencyType": "BC",
      "totalPointsTP": 350,
      "isVerified": true
    },
    "addresses": [
      {
        "id": "addr_01",
        "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "recipientName": "Ahmad Fauzi (Stokis BC 3)",
        "phoneNumber": "+6281267890123",
        "fullAddress": "Jl. Panorama No. 18, Depan RSUD Bukittinggi",
        "district": "Guguk Panjang",
        "city": "Kota Bukittinggi",
        "province": "Sumatera Barat",
        "postalCode": "26115",
        "isPrimary": true
      }
    ],
    "creditProfile": {
      "id": "cred_01",
      "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "creditLimit": 2000000,
      "currentBalance": 1250000,
      "usedBalance": 750000,
      "dueDate": "2026-10-10T23:59:59.000Z",
      "isLocked": false,
      "postingMode": "STRICT_HOLD"
    }
  }
}
```

#### B. `PUT /api/v1/profile/:id`
Update data personal pengguna.

**Request Body:**
```json
{
  "fullName": "Ahmad Fauzi, S.T., M.Kom.",
  "phoneNumber": "+6281267890123",
  "email": "ahmad.fauzi@tijarah.id"
}
```

**Response Example (200 OK):**
```json
{
  "status": "success",
  "message": "Profil berhasil diperbarui.",
  "data": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "fullName": "Ahmad Fauzi, S.T., M.Kom.",
    "phoneNumber": "+6281267890123",
    "email": "ahmad.fauzi@tijarah.id",
    "updatedAt": "2026-09-26T17:15:00.000Z"
  }
}
```

---

### 3.2. Kasbon B2B (`/api/v1/credit`)

#### A. `GET /api/v1/credit/account/:userId`
Ambil status plafon kredit kasbon belanja tempo mitra.

**Response Example (200 OK):**
```json
{
  "status": "success",
  "message": "Akun kasbon B2B berhasil dimuat.",
  "data": {
    "id": "cred_01",
    "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "creditLimit": 2000000,
    "currentBalance": 1250000,
    "usedBalance": 750000,
    "dueDate": "2026-10-10T23:59:59.000Z",
    "isLocked": false,
    "postingMode": "STRICT_HOLD"
  }
}
```

#### B. `GET /api/v1/credit/ledger/:userId`
Ambil riwayat mutasi kasbon piutang & rincian faktur belanja.

**Response Example (200 OK):**
```json
{
  "status": "success",
  "message": "Riwayat mutasi kasbon berhasil dimuat.",
  "data": [
    {
      "id": "led_01",
      "creditProfileId": "cred_01",
      "type": "DISBURSEMENT",
      "amount": 750000,
      "runningBalance": 750000,
      "referenceNo": "INV/2026/09/BC3-0042",
      "description": "Pengambilan Tempo 1 Koli Herba HNI",
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
      "creditProfileId": "cred_01",
      "type": "REPAYMENT",
      "amount": 500000,
      "runningBalance": 250000,
      "referenceNo": "PAY/2026/09/BC3-0012",
      "description": "Pembayaran Kasbon via QRIS Statis BC3",
      "createdAt": "2026-09-25T09:15:00.000Z",
      "items": []
    }
  ]
}
```

---

### 3.3. Alamat Pengiriman Mitra (`/api/v1/user/addresses`)

#### A. `GET /api/v1/user/addresses/:userId`
**Response Example (200 OK):**
```json
{
  "status": "success",
  "message": "Daftar alamat berhasil dimuat.",
  "data": [
    {
      "id": "addr_01",
      "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "recipientName": "Ahmad Fauzi (Stokis BC 3)",
      "phoneNumber": "+6281267890123",
      "fullAddress": "Jl. Panorama No. 18, Depan RSUD Bukittinggi",
      "district": "Guguk Panjang",
      "city": "Kota Bukittinggi",
      "province": "Sumatera Barat",
      "postalCode": "26115",
      "isPrimary": true
    }
  ]
}
```

#### B. `POST /api/v1/user/addresses`
**Request Body:**
```json
{
  "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "recipientName": "Loket Travel L300 Aur Kuning",
  "phoneNumber": "+6281365432109",
  "fullAddress": "Terminal Aur Kuning Blok A No. 5",
  "district": "Aur Birugo Tigo Baleh",
  "city": "Kota Bukittinggi",
  "province": "Sumatera Barat",
  "postalCode": "26131",
  "isPrimary": false
}
```

#### C. `PATCH /api/v1/user/addresses/:id/primary`
Mengubah alamat tertentu menjadi alamat utama (`isPrimary: true`), dan otomatis mengosongkan status primary pada alamat lain.

---

### 3.4. Vouchers & Promo Pengguna (`/api/v1/vouchers`)

#### `GET /api/v1/vouchers/:userId`
**Response Example (200 OK):**
```json
{
  "status": "success",
  "message": "Daftar voucher berhasil dimuat.",
  "data": [
    {
      "id": "vch_01",
      "code": "TIJARAHHERBA20",
      "title": "Diskon Belanja Herba HNI 20%",
      "discountType": "PERCENTAGE",
      "discountValue": 20,
      "minPurchase": 500000,
      "maxDiscount": 100000,
      "validUntil": "2026-10-31T23:59:59.000Z",
      "isActive": true,
      "description": "Potongan 20% untuk belanja produk HNI minimal Rp 500rb",
      "isClaimed": true,
      "isUsed": false
    }
  ]
}
```

---

## 4. Tipe Data TypeScript (Front-End Types)

Anda dapat menyalin antarmuka TypeScript berikut ke dalam berkas `types/profile.ts` atau `types/api.ts` di Front-End:

```typescript
export interface UserCore {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  userType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HniProfile {
  id: string;
  userId: string;
  hniMemberId: string;
  hniMemberName: string;
  uplineId?: string | null;
  uplineName?: string | null;
  titleStatus?: string | null;
  combinedStatus?: string | null;
  agencyId?: string | null;
  agencyName?: string | null;
  agencyType?: string | null;
  totalPointsTP?: number | null;
  isVerified: boolean;
}

export interface UserAddress {
  id: string;
  userId: string;
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  district: string;
  city: string;
  province?: string | null;
  postalCode?: string | null;
  isPrimary: boolean;
}

export interface B2BCreditProfile {
  id: string;
  userId: string;
  creditLimit: number;
  currentBalance: number;
  usedBalance: number;
  dueDate?: string | null;
  isLocked: boolean;
  postingMode: 'STRICT_HOLD' | 'TRUSTED_VIP';
}

export interface OrderItemDetail {
  id: string;
  productName: string;
  qty: number;
  unitPrice: number;
  tpPoints: number;
  totalPrice: number;
}

export interface CreditLedgerEntry {
  id: string;
  creditProfileId: string;
  type: 'DISBURSEMENT' | 'REPAYMENT' | 'ADJUSTMENT';
  amount: number;
  runningBalance: number;
  referenceNo?: string | null;
  description: string;
  createdAt: string;
  items: OrderItemDetail[];
}

export interface Voucher {
  id: string;
  code: string;
  title: string;
  discountType: 'FIXED' | 'PERCENTAGE' | 'SHIPPING_SUBSIDY';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number | null;
  validUntil: string;
  isActive: boolean;
  description: string;
  isClaimed?: boolean;
  isUsed?: boolean;
}
```

---

## 5. Contoh Contoh Custom Hook & Fetcher (Next.js / React)

```typescript
// lib/api/profile.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
});

export const profileApi = {
  // Ambil Profil Lengkap
  getProfile: async (userId: string, lang: string = 'id') => {
    const res = await api.get(`/profile/${userId}`, { headers: { 'Accept-Language': lang } });
    return res.data.data;
  },

  // Update Profile
  updateProfile: async (userId: string, payload: { fullName?: string; phoneNumber?: string; email?: string }, lang: string = 'id') => {
    const res = await api.put(`/profile/${userId}`, payload, { headers: { 'Accept-Language': lang } });
    return res.data.data;
  },

  // Ambil Akun Kasbon B2B
  getCreditAccount: async (userId: string) => {
    const res = await api.get(`/credit/account/${userId}`);
    return res.data.data;
  },

  // Ambil Mutasi Kasbon
  getCreditLedger: async (userId: string) => {
    const res = await api.get(`/credit/ledger/${userId}`);
    return res.data.data;
  },

  // Ambil Alamat
  getAddresses: async (userId: string) => {
    const res = await api.get(`/user/addresses/${userId}`);
    return res.data.data;
  },

  // Set Alamat Utama
  setPrimaryAddress: async (addressId: string) => {
    const res = await api.patch(`/user/addresses/${addressId}/primary`);
    return res.data.data;
  }
};
```
