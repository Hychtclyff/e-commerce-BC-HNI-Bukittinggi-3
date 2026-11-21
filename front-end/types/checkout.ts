import React from 'react';

// Types for checkout flow
export interface CreateOrderBody {
  items: Array<{
    productId: string;
    qty: number;
  }>;
  shippingType?: 'DELIVERY' | 'PICKUP';
  addressId?: string;
  shippingCourier?: string;
  shippingCost?: number;
  voucherCode?: string;
  notes?: string;
  idempotencyKey?: string;
}

export type PaymentMethodType = 
  | 'QRIS' 
  | 'VA_BCA' 
  | 'VA_BNI' 
  | 'VA_BRI' 
  | 'VA_MANDIRI' 
  | 'VA_PERMATA' 
  | 'TF_MANUAL' 
  | 'COD' 
  | 'B2B_CREDIT';

export interface InitiatePaymentBody {
  orderId: string;
  paymentMethod: PaymentMethodType;
}

export interface OrderDetailsResponse {
  id: string;
  orderNumber: string;
  userName: string;
  userEmail?: string;
  isAgentPriceApplied: boolean;
  shippingType: string;
  shippingAddressText?: string;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  totalTpPoints: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  paymentUrl?: string;
  qrString?: string;
  vaNumber?: string;
  bankCode?: string;
  paymentExpiredAt?: string;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
    tpPoints: number;
  }>;
}
