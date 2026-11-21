# 📦 Panduan Integrasi Frontend: API Pesanan Pengguna (Profile Orders)

> **Versi**: 1.0.0  
> **Base URL API**: `/api/v1/user/orders` & `/api/v1/orders`  
> **Target Pengguna**: Tim Frontend (React / Next.js / TanStack Query)  
> **Bahasa**: Multilingual (ID & EN via `Accept-Language: id` atau `Accept-Language: en`)

---

## 📌 1. Ringkasan Endpoint API

| Method | Endpoint Path | Query / Params | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/user/orders` | `page`, `limit`, `status`, `paymentMethod`, `search`, `startDate`, `endDate`, `userId` | Mengambil daftar riwayat pesanan pelanggan (dengan pagination, filter status tab, & pencarian). |
| `GET` | `/api/v1/user/orders/status-counts` | `userId` | Ringkasan jumlah pesanan per status untuk badge counter pada tab UI. |
| `GET` | `/api/v1/user/orders/:id` | `id` (Order UUID), `userId` | Detail lengkap satu pesanan untuk modal Struk, Faktur, atau Detail Pesanan. |
| `POST` | `/api/v1/user/orders/:id/cancel` | `id` (Order UUID), `body: { reason }` | Membatalkan pesanan yang masih dalam status `PENDING_PAYMENT` atau `WAITING_APPROVAL`. Restorasi otomatis saldo Kasbon B2B (jika tempo). |
| `POST` | `/api/v1/user/orders/:id/confirm-delivered` | `id` (Order UUID) | Konfirmasi oleh pembeli bahwa barang telah diterima (mengubah status ke `COMPLETED`). |

---

## 🛠️ 2. Spesifikasi Detail Endpoint & Response JSON

### 2.1. Daftar Riwayat Pesanan (`GET /api/v1/user/orders`)

#### Query Parameters:
```typescript
interface GetOrdersQueryParams {
  userId?: string;          // Default fallback ke ID user aktif jika unauthenticated
  page?: number;            // Halaman aktif (Default: 1)
  limit?: number;           // Jumlah item per halaman (Default: 10)
  status?: 'ALL' | 'PENDING_PAYMENT' | 'WAITING_APPROVAL' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  paymentMethod?: 'B2B_CREDIT' | 'QRIS_MOCKUP' | 'BANK_TRANSFER_MOCKUP' | 'CASH_STORE';
  search?: string;          // Pencarian nomor invoice (orderNumber) atau nama produk
  startDate?: string;       // Format YYYY-MM-DD
  endDate?: string;         // Format YYYY-MM-DD
}
```

#### Contoh Request Fetch (Native / Axios / TanStack Query):
```typescript
const response = await fetch('/api/v1/user/orders?page=1&limit=5&status=ALL', {
  headers: {
    'Accept-Language': 'id', // 'id' atau 'en'
    'Authorization': `Bearer ${accessToken}`,
  },
});
const result = await response.json();
```

#### Response Sukses (`200 OK`):
```json
{
  "success": true,
  "message": "Daftar pesanan berhasil diambil.",
  "data": [
    {
      "id": "ord_88294711",
      "orderNumber": "ORD/20260930/BC3-4821",
      "createdAt": "2026-09-30T09:15:00.000Z",
      "status": "PROCESSING",
      "paymentMethod": "B2B_CREDIT",
      "paymentStatus": "TEMPO_ACTIVE",
      "dueDate": "2026-10-14T09:15:00.000Z",
      "hsisPostingStatus": "PROCESSING",
      "hsisReceiptNo": null,
      "shippingType": "DELIVERY",
      "shippingCourier": "LOCAL_BC3_DELIVERY",
      "trackingNumber": null,
      "totalAmount": 750000,
      "totalPoints": 180,
      "itemsCount": 2,
      "previewItems": [
        {
          "id": "item_1",
          "productId": "prod_01",
          "productName": "Minyak Herba Sinergi (MHS 100ml)",
          "productImageUrl": "https://cdn.tijarah.id/products/mhs-100ml.png",
          "qty": 5,
          "unitPrice": 45000,
          "tpPoints": 10,
          "totalPrice": 225000
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 5,
    "totalItems": 18,
    "totalPages": 4,
    "countsPerStatus": {
      "ALL": 18,
      "PENDING_PAYMENT": 2,
      "WAITING_APPROVAL": 1,
      "PROCESSING": 3,
      "SHIPPED": 2,
      "COMPLETED": 9,
      "REJECTED": 1,
      "CANCELLED": 0
    }
  }
}
```

---

### 2.2. Counter Status Tab (`GET /api/v1/user/orders/status-counts`)

Dipakai untuk merender badge angka secara instan di setiap tab status UI.

#### Response Sukses (`200 OK`):
```json
{
  "success": true,
  "message": "Ringkasan jumlah pesanan per status berhasil diambil.",
  "data": {
    "ALL": 18,
    "PENDING_PAYMENT": 2,
    "WAITING_APPROVAL": 1,
    "PROCESSING": 3,
    "SHIPPED": 2,
    "COMPLETED": 9,
    "REJECTED": 1,
    "CANCELLED": 0
  }
}
```

---

### 2.3. Detail Pesanan / Struk / Faktur (`GET /api/v1/user/orders/:id`)

#### Response Sukses (`200 OK`):
```json
{
  "success": true,
  "message": "Detail pesanan berhasil diambil.",
  "data": {
    "id": "ord_88294711",
    "orderNumber": "ORD/20260930/BC3-4821",
    "createdAt": "2026-09-30T09:15:00.000Z",
    "updatedAt": "2026-09-30T09:20:00.000Z",
    "status": "PROCESSING",
    "rejectionReason": null,
    "cancellationReason": null,

    "customer": {
      "userId": "f99872b7-a186-46af-b1a4-3545eda359a9",
      "fullName": "Ahmad Fauzi",
      "email": "ahmad@example.com",
      "phoneNumber": "081234567890",
      "hniMemberId": "03819284",
      "hniMemberName": "AHMAD FAUZI",
      "isAgentPriceApplied": true
    },

    "shipping": {
      "type": "DELIVERY",
      "recipientName": "Ahmad Fauzi",
      "recipientPhone": "081234567890",
      "destinationAddress": "Jl. Sudirman No. 45, Bukittinggi",
      "courierName": "LOCAL_BC3_DELIVERY",
      "trackingNumber": null,
      "shippingCost": 15000,
      "notes": "Titip di pos security"
    },

    "payment": {
      "method": "B2B_CREDIT",
      "status": "TEMPO_ACTIVE",
      "paidAt": null,
      "dueDate": "2026-10-14T09:15:00.000Z",
      "vaNumber": null,
      "qrisPayload": null,
      "creditProfileId": "cred_00192"
    },

    "hsisIntegration": {
      "status": "PROCESSING",
      "receiptNo": null,
      "postedAt": null,
      "totalTpPoints": 180
    },

    "items": [
      {
        "id": "item_1",
        "productId": "prod_01",
        "sku": "HNI-MHS-100",
        "productName": "Minyak Herba Sinergi (MHS 100ml)",
        "productImageUrl": null,
        "qty": 5,
        "normalPrice": 50000,
        "unitPrice": 45000,
        "tpPoints": 10,
        "totalPrice": 225000,
        "totalPoints": 50
      }
    ],

    "summary": {
      "subtotal": 750000,
      "shippingCost": 15000,
      "voucherCode": "FREEONGKIRBC3",
      "voucherDiscount": 15000,
      "totalAmount": 750000,
      "totalTpPoints": 180
    },

    "timeline": [
      {
        "status": "WAITING_APPROVAL",
        "title": "Pesanan Dibuat",
        "description": "Pesanan ORD/20260930/BC3-4821 berhasil dibuat dengan metode B2B_CREDIT.",
        "timestamp": "2026-09-30T09:15:00.000Z"
      },
      {
        "status": "PROCESSING",
        "title": "Disetujui Toko & Sedang Dikemas",
        "description": "Owner menyetujui pesanan. Stok fisik tersedia dan paket sedang dikemas.",
        "timestamp": "2026-09-30T09:20:00.000Z"
      }
    ]
  }
}
```

---

### 2.4. Batalkan Pesanan (`POST /api/v1/user/orders/:id/cancel`)

#### Request Body (Optional):
```json
{
  "reason": "Salah memilih metode pengiriman"
}
```

#### Response Sukses (`200 OK`):
```json
{
  "success": true,
  "message": "Pesanan berhasil dibatalkan.",
  "data": {
    "id": "ord_88294711",
    "orderNumber": "ORD/20260930/BC3-4821",
    "status": "CANCELLED",
    "cancelledAt": "2026-09-30T09:25:00.000Z",
    "cancellationReason": "Salah memilih metode pengiriman",
    "creditRestored": true,
    "restoredAmount": 750000
  }
}
```

#### Response Error (`400 Bad Request`):
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Pesanan tidak dapat dibatalkan karena sudah dalam pengemasan atau pengiriman."
}
```

---

### 2.5. Konfirmasi Diterima (`POST /api/v1/user/orders/:id/confirm-delivered`)

Dapat dipanggil ketika barang yang berstatus `SHIPPED` sudah sampai di tangan pembeli.

#### Response Sukses (`200 OK`):
```json
{
  "success": true,
  "message": "Pesanan telah dikonfirmasi selesai.",
  "data": {
    "id": "ord_88294711",
    "orderNumber": "ORD/20260930/BC3-4821",
    "status": "COMPLETED",
    "completedAt": "2026-09-30T09:30:00.000Z"
  }
}
```

---

## 💻 3. Contoh Hook React Query (`useOrders.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUserOrders(params: {
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const queryClient = useQueryClient();

  // 1. Fetch Orders List
  const ordersQuery = useQuery({
    queryKey: ['user-orders', params],
    queryFn: async () => {
      const queryStr = new URLSearchParams({
        ...(params.userId && { userId: params.userId }),
        status: params.status || 'ALL',
        page: String(params.page || 1),
        limit: String(params.limit || 10),
        ...(params.search && { search: params.search }),
      }).toString();

      const res = await fetch(`/api/v1/user/orders?${queryStr}`);
      if (!res.ok) throw new Error('Gagal memuat pesanan');
      return res.json();
    },
  });

  // 2. Fetch Status Counts
  const countsQuery = useQuery({
    queryKey: ['user-orders-status-counts', params.userId],
    queryFn: async () => {
      const url = params.userId
        ? `/api/v1/user/orders/status-counts?userId=${params.userId}`
        : '/api/v1/user/orders/status-counts';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal memuat status counter');
      return res.json();
    },
  });

  // 3. Mutation: Cancel Order
  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const res = await fetch(`/api/v1/user/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membatalkan pesanan');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders-status-counts'] });
      queryClient.invalidateQueries({ queryKey: ['b2b-credit'] });
    },
  });

  // 4. Mutation: Confirm Delivered
  const confirmDeliveredMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/v1/user/orders/${orderId}/confirm-delivered`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengonfirmasi pesanan');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders-status-counts'] });
    },
  });

  return {
    orders: ordersQuery.data?.data || [],
    meta: ordersQuery.data?.meta,
    counts: countsQuery.data?.data,
    isLoading: ordersQuery.isLoading || countsQuery.isLoading,
    cancelOrder: cancelOrderMutation.mutateAsync,
    confirmDelivered: confirmDeliveredMutation.mutateAsync,
  };
}
```
