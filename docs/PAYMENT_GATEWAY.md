# Payment Gateway Integration - Tijarah

## Overview

Sistem pembayaran Tijarah mendukung 5 metode pembayaran:
1. **QRIS Dinamis** (Xendit)
2. **Virtual Account (VA)** - BCA, BNI, BRI, Mandiri, Permata (Xendit)
3. **Bank Transfer Manual** - Admin confirms
4. **COD (Cash On Delivery)** - Kurir confirms
5. **B2B Credit (Kasbon)** - Internal system

---

## Payment Flow Architecture

```
User Checkout → Select Payment Method → Backend Creates Order
                                             ↓
                    ┌─────────────────────────┼─────────────────────────┐
                    ↓                         ↓                         ↓
              QRIS/VA (Xendit)        Bank Transfer Manual           COD
                    ↓                         ↓                         ↓
          Create Invoice                Create Order            Create Order
          Return QR/VA                  Display Rekening        Display Instructions
                    ↓                         ↓                         ↓
          Frontend Display              Admin Confirm            Kurir Confirm
          Socket Real-time              Webhook/API             Webhook/API
                    ↓                         ↓                         ↓
          Webhook: Payment Paid      Update Order PAID         Update Order PAID
                    ↓                         ↓                         ↓
          ┌─────────────────────────────────┼─────────────────────────┐
          └─────────────────────────────────┼─────────────────────────┘
                                            ↓
                        Generate Auto Receipt (HTML/PDF)
                                            ↓
                        Send Email + SMS + Socket Notification
                                            ↓
                        Update Order Status: WAITING_APPROVAL
```

---

## Database Schema Extensions

### Order Table - Payment Fields

```sql
-- Add columns untuk payment details
ALTER TABLE orders ADD COLUMN (
  payment_method VARCHAR(50) NOT NULL,
  
  -- Xendit fields
  xendit_invoice_id VARCHAR(255) UNIQUE,
  xendit_payment_id VARCHAR(255),
  payment_url TEXT,
  qr_string TEXT,
  va_number VARCHAR(20),
  bank_code VARCHAR(10),
  payment_expired_at TIMESTAMP,
  
  -- Manual TF fields
  transfer_bank_name VARCHAR(50),
  transfer_account_name VARCHAR(100),
  transfer_confirmed_at TIMESTAMP,
  transfer_confirmed_by UUID REFERENCES users(id),
  
  -- COD fields
  cod_confirmed_at TIMESTAMP,
  cod_confirmed_by UUID,
  cod_received_signature TEXT,
  
  -- Receipt fields
  receipt_url VARCHAR(500) UNIQUE,
  receipt_generated_at TIMESTAMP,
  receipt_sent_at TIMESTAMP
);

-- Payment logs table
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSON,
  is_processed BOOLEAN DEFAULT true,
  processed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_order_id (order_id),
  UNIQUE KEY uq_order_event (order_id, event_type, created_at)
);

-- Payment receipts table
CREATE TABLE payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  receipt_html LONGTEXT,
  receipt_pdf_url VARCHAR(500),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Payment Methods Detail

### 1. QRIS & Virtual Account (Xendit)

**Status**: Real-time via Webhook  
**Fee**: 2.9% + Rp 1,000 per transaksi  
**Settlement**: T+1

**Xendit Invoice Payload**:
```json
{
  "external_id": "order-123",
  "amount": 550000,
  "description": "Pesanan ORD/20261015/BC3-1234",
  "invoice_duration": 3600,
  "customer": {
    "given_names": "John Doe",
    "email": "john@example.com",
    "mobile_number": "+6281234567890"
  },
  "items": [
    {
      "name": "Product A",
      "quantity": 2,
      "price": 200000
    }
  ]
}
```

### 2. Bank Transfer Manual

**Status**: Manual confirmation by admin  
**Fee**: None  
**Settlement**: Immediate after admin confirms

**Flow**:
1. User see instruksi TF ke rekening toko
2. User transfer ke BCA/BNI/Mandiri
3. Admin cek bank, confirm via dashboard
4. System auto-update order status

### 3. COD (Cash On Delivery)

**Status**: Confirmation saat pengiriman  
**Fee**: None  
**Settlement**: Saat barang diterima

**Flow**:
1. Order created dengan status COD_PENDING
2. Kurir ambil paket
3. Kurir confirm pembayaran (signature/foto)
4. Order status update PAID

### 4. B2B Credit (Kasbon)

**Status**: Internal system (automatic)  
**Fee**: None  
**Settlement**: H+14 atau sesuai agreement

---

## API Endpoints

### Create Checkout with Payment Method

```
POST /api/v1/checkout/process

{
  "items": [
    { "productId": "prod-1", "qty": 2 }
  ],
  "shippingType": "DELIVERY",
  "shippingCost": 50000,
  "paymentMethod": "QRIS" | "VA_BCA" | "VA_BNI" | "TF_MANUAL" | "COD" | "B2B_CREDIT",
  "idempotencyKey": "uuid"
}

Response:
{
  "status": "success",
  "data": {
    "id": "order-123",
    "orderNumber": "ORD/20261015/BC3-1234",
    "paymentMethod": "QRIS",
    "paymentUrl": "https://xendit.co/invoice/...",
    "qrString": "00020126...",
    "expiryTime": "2026-10-15T07:04:34Z",
    "totalAmount": 550000
  }
}
```

### Confirm Manual Transfer (Admin)

```
POST /api/v1/admin/payments/confirm-transfer

{
  "orderId": "order-123",
  "bankName": "BCA",
  "transferProof": "base64-image-or-url"
}
```

### Confirm COD Payment (Kurir)

```
POST /api/v1/orders/:orderId/cod-confirm

{
  "courierUserId": "kurir-123",
  "receivedSignature": "base64-signature",
  "photoUrl": "https://..."
}
```

### Get Order Receipt

```
GET /api/v1/checkout/receipt/:orderId

Response:
{
  "status": "success",
  "data": {
    "id": "order-123",
    "orderNumber": "ORD/20261015/BC3-1234",
    "receiptNumber": "RCP/20261015/BC3-1234",
    "receiptUrl": "https://tijarah.co/receipts/RCP-1234.pdf",
    "receiptHtml": "<html>...</html>",
    "paymentStatus": "PAID",
    "orderStatus": "WAITING_APPROVAL",
    "items": [...],
    "totalAmount": 550000
  }
}
```

### Webhook - Payment Status Update

```
POST /api/v1/payments/webhook

Headers:
  x-callback-token: <xendit-webhook-verification-token>

{
  "id": "xendit-payment-id",
  "external_id": "order-123",
  "status": "PAID" | "EXPIRED" | "PENDING",
  "amount": 550000,
  "payment_method": "QRIS",
  "paid_at": "2026-10-15T06:04:34Z"
}
```

---

## Socket.io Real-time Events

### Connect & Subscribe

```javascript
// Client
const socket = io('https://api.tijarah.co', {
  auth: { 
    token: 'jwt-token',
    userId: 'user-id'
  }
});

// Subscribe to order updates
socket.emit('subscribe_order', 'order-123');
```

### Events from Server

```javascript
// Payment status updated
socket.on('payment:status_updated', {
  orderId: 'order-123',
  paymentStatus: 'PAID',
  orderStatus: 'WAITING_APPROVAL',
  timestamp: '2026-10-15T06:04:34Z'
});

// Receipt generated
socket.on('receipt:generated', {
  orderId: 'order-123',
  receiptNumber: 'RCP/20261015/BC3-1234',
  receiptUrl: 'https://...',
  downloadUrl: 'https://...'
});

// Notification
socket.on('notification:new', {
  title: 'Pembayaran Diterima',
  message: 'Pesanan Anda sedang dikemas',
  type: 'payment_received'
});
```

---

## Environment Variables Required

```env
# Xendit Configuration
XENDIT_SECRET_KEY=xnd_development_xxxxx
XENDIT_WEBHOOK_TOKEN=webhook_token_xxxxx
XENDIT_ENVIRONMENT=development|production

# Email Service (SendGrid)
SENDGRID_API_KEY=xxxxx
SENDGRID_FROM_EMAIL=noreply@tijarah.co
SENDGRID_TEMPLATE_ID_PAYMENT=xxxxx

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=xxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+1234567890

# Socket.io
SOCKET_IO_CORS_ORIGIN=https://tijarah.co

# Cloud Storage (S3 / Supabase)
AWS_S3_BUCKET=tijarah-receipts
AWS_S3_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx

# Frontend URLs
FRONTEND_URL=https://tijarah.co
PAYMENT_SUCCESS_URL=/checkout/success
PAYMENT_FAILED_URL=/checkout/failed
```

---

## Security Considerations

1. **Idempotency**: Setiap checkout request harus punya `idempotencyKey` unik untuk prevent double-charge
2. **Webhook Verification**: Validate signature header dari Xendit sebelum proses
3. **Rate Limiting**: Limit payment creation requests per user (5/min)
4. **PCI Compliance**: Never store full card numbers (Xendit handle)
5. **At-Least-Once Delivery**: Handle webhook duplikasi dengan check `payment_logs` table
6. **State Validation**: Prevent payment re-processing jika order status sudah PAID

---

## Testing Checklist

- [ ] QRIS payment flow (test card: Xendit test mode)
- [ ] VA creation & payment confirmation
- [ ] Manual transfer confirmation by admin
- [ ] COD confirmation by kurir
- [ ] Webhook idempotency (send same webhook twice)
- [ ] Receipt generation & email sending
- [ ] Socket.io real-time updates
- [ ] Payment expiry handling
- [ ] Error handling (network timeout, invalid amount)
- [ ] Concurrent payment requests (idempotency key)

---

**Last Updated**: 2026-10-15  
**Version**: 1.0.0