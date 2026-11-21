# 📋 Spesifikasi Backend: Fitur Voucher, Potongan Diskon & System Notifications

> Dokumen spesifikasi teknis RESTful API, skema basis data Prisma 8, aturan bisnis kalkulasi potongan voucher, serta sistem notifikasi otomatis pada platform B2B **TIJARAH (BC HNI 3 Bukittinggi)**.

---

## 📑 1. Ringkasan Fitur & Business Rules

### 1.1. Fitur Voucher & Potongan Diskon (Voucher & Discount Engine)
1. **Jenis Diskon (`discountType`)**:
   - `FIXED`: Potongan harga tetap (contoh: Diskon Rp 10.000).
   - `PERCENTAGE`: Potongan harga persentase (contoh: Diskon 15% dengan batas maksimum `maxDiscount` Rp 30.000).
   - `SHIPPING_SUBSIDY`: Potongan subsidi ongkos kirim (contoh: Gratis Ongkir hingga Rp 15.000).
2. **Aturan Kelayakan Voucher**:
   - Wajib memenuhi **Minimal Pembelian (`minPurchase`)**.
   - Untuk voucher khusus agen (`AGENHNI15`), pengguna wajib memiliki `hniProfile` terverifikasi.
   - Wajib berlaku sebelum batas waktu **`validUntil`**.
3. **Kalkulasi Potongan Diskon pada Checkout**:
   - `discountAmount` dihitung secara real-time pada `POST /api/v1/checkout/calculate`.
   - `grandTotal = Math.max(0, subtotal + shippingCost - discountAmount)`.
   - Saat transaksi checkout berhasil dibuat (`POST /api/v1/checkout/process`), status pemakaian voucher dicatat di `user_vouchers` (`isUsed = true`, `usedAt = now()`).

### 1.2. Fitur System Notifications (In-App Push & Status Trigger)
1. **Trigger Otomatis Event Notifikasi**:
   - **Pesanan Baru**: Dibuat via QRIS/Transfer (`PENDING_PAYMENT`) atau Kasbon B2B (`WAITING_APPROVAL`).
   - **Order Approved (Dikemas)**: Disetujui Owner (`PROCESSING`).
   - **Order Shipped (Pengiriman/Pickup)**: Dikirim via ekspedisi/kurir lokal atau siap diambil (`SHIPPED`).
   - **Order Completed**: Dikonfirmasi selesai oleh pembeli (`COMPLETED`).
   - **Order Rejected**: Ditolak Owner (`REJECTED`) + Pengembalian Otomatis Saldo Kasbon B2B.
   - **Kasbon B2B Status**: Pengajuan plafon disetujui / ditolak admin.
   - **Promo / Voucher Baru**: Alert promo khusus pengguna.
2. **Multi-Language (ID & EN)**:
   - Judul dan isi pesan notifikasi disimpan sesuai preferensi bahasa pengguna atau dihasilkan dinamis sesuai header `Accept-Language`.

---

## 🗄️ 2. Skema Database Prisma 8 (`contract.prisma`)

```prisma
namespace promotions {
  model Voucher {
    id            String   @id @default(uuid())
    code          String   @unique
    title         String
    discountType  String   // FIXED | PERCENTAGE | SHIPPING_SUBSIDY
    discountValue Float
    minPurchase   Float    @default(0)
    maxDiscount   Float?
    validUntil    TimestamptzString
    isActive      Boolean  @default(true)
    description   String
    createdAt     TimestamptzString @default(now())

    userVouchers  UserVoucher[]

    @@map("vouchers")
    @@index([code])
  }

  model UserVoucher {
    id          String   @id @default(uuid())
    userId      String
    voucherId   String
    isUsed      Boolean  @default(false)
    usedAt      TimestamptzString?
    assignedAt  TimestamptzString @default(now())

    voucher     Voucher  @relation(fields: [voucherId], references: [id], onDelete: Cascade)

    @@map("user_vouchers")
    @@index([userId])
    @@index([voucherId])
  }
}

namespace notifications {
  model Notification {
    id          String   @id @default(uuid())
    userId      String
    title       String
    message     String   @db.Text
    category    String   // ORDER_STATUS | B2B_KASBON | PROMO_VOUCHER | SYSTEM
    referenceId String?  // ID Order / ID Application
    isRead      Boolean  @default(false)
    readAt      TimestamptzString?
    createdAt   TimestamptzString @default(now())

    @@map("notifications")
    @@index([userId, isRead])
    @@index([category])
    @@index([createdAt])
  }
}
```

---

## 🔗 3. Daftar Endpoint API Backend

### 3.1. Modul Voucher (`/api/v1/vouchers`)

| Method | Endpoint Path | Headers / Query / Body | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/vouchers` | Query: `search` | Mengambil daftar seluruh voucher aktif yang tersedia di platform. |
| `GET` | `/api/v1/vouchers/my-vouchers` | Header: `Authorization` | Mengambil daftar voucher yang dimiliki / klaim oleh pengguna aktif. |
| `POST` | `/api/v1/vouchers/validate` | Body: `{ code, subtotal, shippingCost }` | Validasi & kalkulasi besaran potongan diskon untuk tampilan checkout. |
| `POST` | `/api/v1/vouchers/claim` | Body: `{ voucherId }` | Klaim voucher promo ke akun pengguna. |

#### Contoh Request Validasi Voucher (`POST /api/v1/vouchers/validate`):
```json
{
  "code": "DISKONHNI10K",
  "subtotal": 150000,
  "shippingCost": 15000
}
```

#### Contoh Response Sukses (`200 OK`):
```json
{
  "success": true,
  "message": "Voucher berhasil diterapkan.",
  "data": {
    "code": "DISKONHNI10K",
    "title": "Diskon Belanja Rp 10.000",
    "discountType": "FIXED",
    "discountAmount": 10000,
    "finalSubtotal": 140000,
    "minPurchase": 50000
  }
}
```

---

### 3.2. Modul Notifikasi (`/api/v1/notifications`)

| Method | Endpoint Path | Headers / Query / Body | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Query: `page`, `limit`, `category`, `unreadOnly` | Mengambil daftar notifikasi pengguna (dengan pagination & filter). |
| `GET` | `/api/v1/notifications/unread-count` | Header: `Authorization` | Endpoint ringan untuk mengambil jumlah notifikasi belum dibaca (badge counter). |
| `PATCH` | `/api/v1/notifications/:id/read` | Params: `id` | Menandai 1 notifikasi spesifik sebagai telah dibaca. |
| `PATCH` | `/api/v1/notifications/read-all` | Header: `Authorization` | Menandai seluruh notifikasi pengguna sebagai telah dibaca. |
| `DELETE` | `/api/v1/notifications/:id` | Params: `id` | Menghapus 1 notifikasi dari daftar. |

#### Contoh Response Unread Count (`GET /api/v1/notifications/unread-count`):
```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

#### Contoh Response List Notifikasi (`GET /api/v1/notifications`):
```json
{
  "success": true,
  "message": "Daftar notifikasi berhasil diambil.",
  "data": [
    {
      "id": "notif_001",
      "userId": "f99872b7-a186-46af-b1a4-3545eda359a9",
      "title": "Pesanan Sedang Dikemas",
      "message": "Pesanan ORD/20260930/BC3-4821 telah disetujui toko dan sedang dikemas di gudang BC 3 Bukittinggi.",
      "category": "ORDER_STATUS",
      "referenceId": "ord_88294711",
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-09-30T09:20:00.000Z"
    },
    {
      "id": "notif_002",
      "userId": "f99872b7-a186-46af-b1a4-3545eda359a9",
      "title": "Pengajuan Kasbon B2B Disetujui",
      "message": "Selamat! Pengajuan plafon Kasbon B2B Rp 2.000.000 Anda telah disetujui oleh Admin.",
      "category": "B2B_KASBON",
      "referenceId": "app_00912",
      "isRead": true,
      "readAt": "2026-09-29T14:30:00.000Z",
      "createdAt": "2026-09-29T14:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 12,
    "totalPages": 2,
    "unreadTotal": 3
  }
}
```

---

## 🌐 4. Struktur Terjemahan Dwibahasa (i18n)

### `src/i18n/locales/id.ts`
```typescript
export const id = {
  vouchers: {
    get_vouchers_success: "Daftar voucher berhasil dimuat.",
    voucher_invalid: "Kode voucher tidak valid atau telah kedaluwarsa.",
    min_purchase_not_met: "Minimal belanja untuk menggunakan voucher ini adalah {minPurchase}.",
    apply_success: "Voucher {code} berhasil diterapkan!",
  },
  notifications: {
    get_notifications_success: "Daftar notifikasi berhasil diambil.",
    mark_read_success: "Notifikasi telah ditandai dibaca.",
    mark_all_read_success: "Semua notifikasi telah ditandai dibaca.",
    delete_success: "Notifikasi berhasil dihapus.",
  }
};
```

### `src/i18n/locales/en.ts`
```typescript
export const en = {
  vouchers: {
    get_vouchers_success: "Vouchers loaded successfully.",
    voucher_invalid: "Voucher code is invalid or expired.",
    min_purchase_not_met: "Minimum purchase to use this voucher is {minPurchase}.",
    apply_success: "Voucher {code} applied successfully!",
  },
  notifications: {
    get_notifications_success: "Notifications fetched successfully.",
    mark_read_success: "Notification marked as read.",
    mark_all_read_success: "All notifications marked as read.",
    delete_success: "Notification deleted successfully.",
  }
};
```
