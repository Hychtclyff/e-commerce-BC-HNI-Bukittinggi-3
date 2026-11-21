# 🛒 Panduan Integrasi Frontend: API Checkout & Pembayaran (B2B Tijarah)

> **Versi**: 1.0.0  
> **Base URL API**: `/api/v1/checkout`  
> **Target Pengguna**: Tim Frontend (React / Next.js / TanStack Query)  
> **Bahasa**: Multilingual (ID & EN via `Accept-Language: id` atau `Accept-Language: en`)

---

## 📌 1. Aturan Bisnis & Logika Utama (Business Logic)

1. **Dual-Pricing Berdasarkan Status HNI Profile**:
   - Jika pengguna memiliki `hniProfile !== null` (Agen HNI Terverifikasi), sistem secara otomatis menerapkan **Harga Agen (`agentPrice`)** dan perolehan **Poin TP (Target Point)**.
   - Jika `hniProfile === null` (Non-Agen / Retail), sistem menerapkan **Harga Normal (HET)** dan perolehan TP bernilai `0`.
2. **Opsi Pengiriman (`shippingType`)**:
   - **`DELIVERY`**: Menggunakan alamat pengiriman (`addressId`), pilihan kurir ekspedisi/lokal, dan ongkos kirim (`shippingCost`).
   - **`PICKUP`**: Ambil mandiri di outlet **BC HNI 3 Bukittinggi (Jl. Sudirman No. 45)**. Biaya ongkir otomatis **Rp 0**.
3. **Fasilitas Pembayaran Kasbon B2B (Tempo H+14)**:
   - Pengguna dengan status Kasbon `ACTIVE` dan saldo plafon mencukupi dapat memilih `paymentMethod: "B2B_CREDIT"`.
   - Saldo plafon kasbon dipotong otomatis saat checkout, dan tanggal jatuh tempo diset ke `H+14`.
   - Jika pesanan ditolak Owner (`REJECTED`) atau dibatalkan, saldo kasbon dipulihkan secara otomatis.
4. **Potongan Diskon Voucher**:
   - Mengurangi *grand total* secara real-time via `POST /api/v1/checkout/calculate`.

---

## 📑 2. Ringkasan Endpoint API Checkout

| Method | Endpoint Path | Payload / Body | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/checkout/calculate` | `CalculateCheckoutBody` | Kalkulasi real-time subtotal, ongkir, diskon voucher, poin TP, & kelayakan Kasbon. |
| `POST` | `/api/v1/checkout/process` | `ProcessCheckoutBody` | Membuat pesanan baru, memotong stok, & mengurangi saldo plafon Kasbon B2B. |
| `POST` | `/api/v1/checkout/payments/mock-pay/:orderId` | - | Simulasi pembayaran mockup (QRIS / Transfer) untuk memperbarui status pesanan. |
| `GET` | `/api/v1/checkout/orders/:id/receipt` | - | Mengambil faktur struk pembelian resmi. |
| `POST` | `/api/v1/checkout/admin/orders/:id/approve` | `{ notes? }` | *(Owner Admin)* Menyetujui pesanan & mengubah status menjadi `PROCESSING` (Dikemas). |
| `POST` | `/api/v1/checkout/admin/orders/:id/ship` | `{ trackingNumber?, courierName? }` | *(Owner Admin)* Mengubah status pesanan menjadi `SHIPPED` / Siap Diambil. |
| `POST` | `/api/v1/checkout/admin/orders/:id/reject` | `{ rejectionReason }` | *(Owner Admin)* Menolak pesanan, mengembalikan stok, & auto refund Kasbon B2B. |

---

## 🛠️ 3. Kontrak API Request & Response JSON

### 3.1. Kalkulasi Simulasi Checkout (`POST /api/v1/checkout/calculate`)

Dipanggil setiap kali pengguna mengubah kuantitas barang, tipe pengiriman, atau memasukkan kode voucher.

#### Request Body (`CalculateCheckoutBody`):
```json
{
  "userId": "f99872b7-a186-46af-b1a4-3545eda359a9",
  "shippingType": "DELIVERY",
  "addressId": "addr_00192",
  "shippingCourier": "LOCAL_BC3_DELIVERY",
  "shippingCost": 15000,
  "voucherCode": "DISKONHNI10K",
  "items": [
    {
      "productId": "prod_01",
      "qty": 5
    },
    {
      "productId": "prod_02",
      "qty": 2
    }
  ]
}
```

#### Response Sukses (`200 OK`):
```json
{
  "success": true,
  "message": "Kalkulasi simulasi checkout berhasil.",
  "data": {
    "subtotal": 365000,
    "shippingCost": 15000,
    "discountAmount": 10000,
    "totalTpPoints": 90,
    "grandTotal": 370000,
    "isAgentPriceApplied": true,
    "kasbonEligible": true,
    "kasbonAvailableBalance": 2000000
  }
}
```

---

### 3.2. Proses Eksekusi Checkout (`POST /api/v1/checkout/process`)

Dipanggil saat pengguna menekan tombol **"Bayar Sekarang"** / **"Buat Pesanan Tempo"**.

#### Request Body (`ProcessCheckoutBody`):
```json
{
  "userId": "f99872b7-a186-46af-b1a4-3545eda359a9",
  "shippingType": "PICKUP",
  "addressId": null,
  "shippingCourier": "PICKUP_STORE",
  "shippingCost": 0,
  "voucherCode": "FREEONGKIRBC3",
  "paymentMethod": "B2B_CREDIT",
  "notes": "Tolong siapkan paket sebelum jam 14:00 WIB",
  "items": [
    {
      "productId": "prod_01",
      "qty": 5
    }
  ]
}
```

#### Response Sukses (`201 Created`):
```json
{
  "success": true,
  "message": "Pesanan berhasil dibuat menggunakan fasilitas Kasbon B2B Tempo H+14.",
  "data": {
    "id": "ord_88294711",
    "orderNumber": "ORD/20260930/BC3-4821",
    "userName": "Ahmad Fauzi",
    "hniMemberId": "03819284",
    "isAgentPriceApplied": true,
    "shippingType": "PICKUP",
    "shippingAddressText": "Pickup di Outlet BC HNI 3 Bukittinggi (Jl. Sudirman No. 45)",
    "subtotal": 225000,
    "shippingCost": 0,
    "discountAmount": 0,
    "totalAmount": 225000,
    "totalTpPoints": 50,
    "paymentMethod": "B2B_CREDIT",
    "paymentStatus": "TEMPO_ACTIVE",
    "orderStatus": "WAITING_APPROVAL",
    "dueDate": "2026-10-14T09:15:00.000Z",
    "createdAt": "2026-09-30T09:15:00.000Z",
    "items": [
      {
        "id": "item_1",
        "orderId": "ord_88294711",
        "productId": "prod_01",
        "productName": "Minyak Herba Sinergi (MHS 100ml)",
        "qty": 5,
        "unitPrice": 45000,
        "tpPoints": 10,
        "totalPrice": 225000
      }
    ]
  }
}
```

---

### 3.3. Simulasi Pembayaran Mockup (`POST /api/v1/checkout/payments/mock-pay/:orderId`)

Dipakai untuk mengubah status pesanan QRIS / Transfer Bank setelah pembayarannya disimulasikan.

#### Response Sukses (`200 OK`):
```json
{
  "success": true,
  "message": "Pembayaran mockup berhasil dikonfirmasi. Status pesanan diperbarui menjadi WAITING_APPROVAL.",
  "data": {
    "id": "ord_88294711",
    "orderNumber": "ORD/20260930/BC3-4821",
    "paymentStatus": "PAID",
    "orderStatus": "WAITING_APPROVAL"
  }
}
```

---

### 3.4. Cetak / Lihat Struk Pembelian (`GET /api/v1/checkout/orders/:id/receipt`)

#### Response Sukses (`200 OK`):
```json
{
  "success": true,
  "message": "Faktur resi pembelian berhasil diambil.",
  "data": {
    "id": "ord_88294711",
    "orderNumber": "ORD/20260930/BC3-4821",
    "userName": "Ahmad Fauzi",
    "hniMemberId": "03819284",
    "isAgentPriceApplied": true,
    "shippingType": "DELIVERY",
    "subtotal": 225000,
    "shippingCost": 15000,
    "discountAmount": 10000,
    "totalAmount": 230000,
    "totalTpPoints": 50,
    "paymentMethod": "B2B_CREDIT",
    "paymentStatus": "TEMPO_ACTIVE",
    "orderStatus": "PROCESSING",
    "dueDate": "2026-10-14T09:15:00.000Z",
    "createdAt": "2026-09-30T09:15:00.000Z",
    "items": [
      {
        "id": "item_1",
        "productName": "Minyak Herba Sinergi (MHS 100ml)",
        "qty": 5,
        "unitPrice": 45000,
        "tpPoints": 10,
        "totalPrice": 225000
      }
    ]
  }
}
```

---

## 💻 4. Contoh Hook Integrasi Next.js / React Query (`useCheckout.ts`)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface CheckoutItemPayload {
  productId: string;
  qty: number;
}

export interface CalculateCheckoutPayload {
  userId?: string;
  shippingType: 'DELIVERY' | 'PICKUP';
  addressId?: string;
  shippingCourier?: string;
  shippingCost?: number;
  voucherCode?: string;
  items: CheckoutItemPayload[];
}

export interface ProcessCheckoutPayload extends CalculateCheckoutPayload {
  paymentMethod: 'B2B_CREDIT' | 'QRIS_MOCKUP' | 'BANK_TRANSFER_MOCKUP' | 'CASH_STORE';
  notes?: string;
}

export function useCheckout() {
  const queryClient = useQueryClient();

  // 1. Mutation untuk Kalkulasi Real-time
  const calculateMutation = useMutation({
    mutationFn: async (payload: CalculateCheckoutPayload) => {
      const res = await fetch('/api/v1/checkout/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kalkulasi checkout gagal');
      return data.data;
    },
  });

  // 2. Mutation untuk Eksekusi Order
  const processCheckoutMutation = useMutation({
    mutationFn: async (payload: ProcessCheckoutPayload) => {
      const res = await fetch('/api/v1/checkout/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Proses checkout gagal');
      return data.data;
    },
    onSuccess: () => {
      // Invalidate cache pesanan, kasbon, & notifikasi
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders-status-counts'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['b2b-credit'] });
    },
  });

  // 3. Mutation untuk Simulasi Pembayaran QRIS/Transfer
  const mockPayMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/v1/checkout/payments/mock-pay/${orderId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Pembayaran mockup gagal');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
    },
  });

  return {
    calculateCheckout: calculateMutation.mutateAsync,
    isCalculating: calculateMutation.isPending,
    calculationResult: calculateMutation.data,

    processCheckout: processCheckoutMutation.mutateAsync,
    isProcessing: processCheckoutMutation.isPending,

    simulateMockPay: mockPayMutation.mutateAsync,
  };
}
```
