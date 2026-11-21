/**
 * Types & Interfaces for Shopping, Cart, Voucher, and Checkout
 * Conforms to FEATURE_SHOPPING_CHECKOUT_FE.md
 */

export type OrderStatusType =
  | "PENDING_PAYMENT"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type ShippingType = "DELIVERY" | "PICKUP";

export type PaymentMethodType =
  | "ONLINE_XENDIT"
  | "QRIS"
  | "VA_BCA"
  | "VA_MANDIRI"
  | "VA_BNI"
  | "VA_BRI"
  | "VA_BSI"
  | "VA_PERMATA"
  | "VA_CIMB"
  | "VA_MUAMALAT"
  | "EWALLET_SHOPEEPAY"
  | "EWALLET_OVO"
  | "EWALLET_DANA"
  | "EWALLET_GOPAY"
  | "B2B_CREDIT"
  | "BANK_TRANSFER_MOCKUP"
  | "CASH_STORE"
  | "COD"
  | "QRIS_MOCKUP";

export type PaymentStatusType = "UNPAID" | "PAID" | "TEMPO_ACTIVE" | "EXPIRED";

export interface CheckoutItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  tpPoints: number;
  totalPrice: number;
}

export interface CheckoutPayload {
  shippingType: ShippingType;
  addressId?: string;
  shippingCourier?: string;
  shippingCost: number;
  voucherCode?: string;
  paymentMethod: PaymentMethodType;
  notes?: string;
  items: {
    productId: string;
    qty: number;
  }[];
}

export interface OrderReceiptResponse {
  id: string;
  slug?: string;
  orderNumber: string;
  userName: string;
  hniMemberId?: string;
  isAgentPriceApplied: boolean;
  shippingType: ShippingType;
  shippingAddressText?: string;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  totalTpPoints: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  orderStatus: OrderStatusType;
  rejectionReason?: string;
  dueDate?: string;
  notes?: string;
  paymentUrl?: string;
  xenditInvoiceId?: string;
  paymentExpiredAt?: string;
  vaNumber?: string;
  bankCode?: string;
  qrString?: string;
  createdAt: string;
  items: CheckoutItem[];
}

export interface VoucherItem {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: "FIXED" | "PERCENTAGE" | "SHIPPING_SUBSIDY";
  discountValue: number;
  maxDiscount?: number;
  minPurchase: number;
  validUntil: string;
  isUsed?: boolean;
}
