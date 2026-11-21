/**
 * Voucher discount calculation helper conforming to FEATURE_SHOPPING_CHECKOUT_FE.md
 */

export interface VoucherDiscountCalculationInput {
  discountType: "FIXED" | "PERCENTAGE" | "SHIPPING_SUBSIDY" | string;
  discountValue: number;
  maxDiscount?: number;
  minPurchase: number;
}

/**
 * Calculates voucher discount based on subtotal, shipping cost, and voucher rules
 */
export const calculateVoucherDiscount = (
  voucher: VoucherDiscountCalculationInput,
  subtotal: number,
  shippingCost: number
): number => {
  if (!voucher || subtotal < voucher.minPurchase) return 0;

  if (voucher.discountType === "FIXED") {
    return Math.min(voucher.discountValue, subtotal);
  }

  if (voucher.discountType === "PERCENTAGE") {
    const calculated = (subtotal * voucher.discountValue) / 100;
    return voucher.maxDiscount ? Math.min(calculated, voucher.maxDiscount) : calculated;
  }

  if (voucher.discountType === "SHIPPING_SUBSIDY") {
    return Math.min(voucher.discountValue, shippingCost);
  }

  return 0;
};
