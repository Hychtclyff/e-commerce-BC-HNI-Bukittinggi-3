"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ShippingType,
  PaymentMethodType,
  VoucherItem,
  OrderReceiptResponse,
  CartItem,
} from "../types/shop.types";
import { shopApi } from "../api/shop.api";
import { calculateVoucherDiscount } from "@/utils/voucher";

export interface UseCheckoutProps {
  cartItems: CartItem[];
  subtotal: number;
  isAgent: boolean;
  user?: {
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  hniMemberId?: string;
  onSuccess?: (receipt: OrderReceiptResponse) => void;
}

export function useCheckout({
  cartItems,
  subtotal,
  isAgent,
  user,
  hniMemberId,
  onSuccess,
}: UseCheckoutProps) {
  // Shipping State
  const [shippingType, setShippingType] = useState<ShippingType>("DELIVERY");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [customAddressText, setCustomAddressText] = useState<string>("");
  const [courier, setCourier] = useState<string>("L300-REGIONAL");
  const [notes, setNotes] = useState<string>("");

  // Voucher State
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
    isAgent ? "B2B_CREDIT" : "QRIS_MOCKUP"
  );

  // Status State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<OrderReceiptResponse | null>(null);

  // Calculate Shipping Cost
  const shippingCost = useMemo(() => {
    if (shippingType === "PICKUP") return 0;
    if (courier === "L300-REGIONAL") return 20000;
    if (courier === "JNT-EXPRESS") return 25000;
    if (courier === "KARGO-TRUK") return 35000;
    return 20000;
  }, [shippingType, courier]);

  // Calculate Voucher Discount
  const discountAmount = useMemo(() => {
    if (!selectedVoucher) return 0;
    return calculateVoucherDiscount(selectedVoucher, subtotal, shippingCost);
  }, [selectedVoucher, subtotal, shippingCost]);

  // Grand Total Calculation
  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + shippingCost - discountAmount);
  }, [subtotal, shippingCost, discountAmount]);

  // Execute Checkout
  const handleExecuteCheckout = useCallback(async () => {
    if (cartItems.length === 0) {
      setError("Keranjang belanja masih kosong.");
      return;
    }

    if (shippingType === "DELIVERY" && !selectedAddressId && !customAddressText.trim()) {
      setError("Silakan pilih atau masukkan alamat pengiriman.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        shippingType,
        addressId: selectedAddressId || undefined,
        shippingCourier: shippingType === "DELIVERY" ? courier : undefined,
        shippingCost,
        voucherCode: selectedVoucher?.code,
        paymentMethod,
        notes: customAddressText ? `${customAddressText} - Catatan: ${notes}` : notes,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          qty: item.qty,
        })),
      };

      const receipt = await shopApi.executeCheckout(payload, {
        userName: user?.fullName || "Mitra Pelanggan HNI",
        hniMemberId: hniMemberId || undefined,
        isAgent,
      });

      setCompletedReceipt(receipt);
      if (onSuccess) {
        onSuccess(receipt);
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat memproses checkout.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    cartItems,
    shippingType,
    selectedAddressId,
    customAddressText,
    courier,
    shippingCost,
    selectedVoucher,
    paymentMethod,
    notes,
    user,
    hniMemberId,
    isAgent,
    onSuccess,
  ]);

  const resetCheckout = useCallback(() => {
    setCompletedReceipt(null);
    setError(null);
    setSelectedVoucher(null);
  }, []);

  return {
    shippingType,
    setShippingType,
    selectedAddressId,
    setSelectedAddressId,
    customAddressText,
    setCustomAddressText,
    courier,
    setCourier,
    shippingCost,
    notes,
    setNotes,
    selectedVoucher,
    setSelectedVoucher,
    discountAmount,
    paymentMethod,
    setPaymentMethod,
    grandTotal,
    isSubmitting,
    error,
    completedReceipt,
    handleExecuteCheckout,
    resetCheckout,
  };
}
export default useCheckout;
