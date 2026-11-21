export type VoucherDiscountType = "FIXED" | "PERCENTAGE" | "SHIPPING_SUBSIDY";

export interface VoucherItem {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  validUntil: string;
  isUsed?: boolean;
  isActive?: boolean;
  isClaimed?: boolean;
}

export interface ValidateVoucherRequest {
  code: string;
  subtotal: number;
  userId?: string;
}

export interface VoucherValidationResponse {
  valid: boolean;
  message?: string;
  voucher?: VoucherItem;
  discountAmount: number;
}
