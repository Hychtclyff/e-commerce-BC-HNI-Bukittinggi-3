import {
  ShippingType,
  PaymentMethodType,
  OrderStatusType,
  PaymentStatusType,
} from "@/types/checkout.types";

export interface CheckoutItemPayload {
  productId: string;
  qty: number;
}

export interface CalculateCheckoutPayload {
  userId?: string;
  shippingType: ShippingType;
  addressId?: string;
  shippingCourier?: string;
  shippingCost: number;
  voucherCode?: string;
  items: CheckoutItemPayload[];
}

export interface CalculateCheckoutResult {
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  totalTpPoints: number;
  grandTotal: number;
  isAgentPriceApplied: boolean;
  kasbonEligible: boolean;
  kasbonAvailableBalance: number;
}

export interface ProcessCheckoutPayload extends CalculateCheckoutPayload {
  paymentMethod: PaymentMethodType;
  notes?: string;
}

export interface CheckoutReceiptItem {
  id: string;
  orderId?: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  tpPoints: number;
  totalPrice: number;
}

export interface CheckoutProcessResponse {
  id: string;
  slug?: string;
  orderNumber: string;
  userName: string;
  hniMemberId?: string;
  isAgentPriceApplied: boolean;
  shippingType: ShippingType;
  shippingAddressText: string;
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
  items: CheckoutReceiptItem[];
}

export interface MockPaymentResponse {
  id: string;
  orderNumber: string;
  paymentStatus: PaymentStatusType;
  orderStatus: OrderStatusType;
}
