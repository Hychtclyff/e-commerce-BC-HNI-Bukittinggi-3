"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vouchersApi } from "../api/vouchers.api";
import { VoucherItem } from "../types/vouchers.types";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import { showToast, handleApiError } from "@/utils/toast";

export function useVouchers() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const userId = authUser?.id;

  const [appliedVoucher, setAppliedVoucher] = useState<VoucherItem | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // 1. Fetch User / Available Vouchers
  const {
    data: vouchers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["vouchers-list", userId],
    queryFn: async () => {
      // Prioritaskan user vouchers jika login, atau fallback ke available promo vouchers
      if (userId) {
        try {
          const userList = await vouchersApi.getUserVouchers(userId);
          if (userList && userList.length > 0) return userList;
        } catch {
          // ignore to fallback to available
        }
      }
      return await vouchersApi.getAvailableVouchers();
    },
    staleTime: 1000 * 60 * 3, // 3 menit
  });

  // Calculate discount helper
  const calculateDiscount = useCallback((voucher: VoucherItem, subtotal: number): number => {
    let discount = 0;
    if (voucher.discountType === "FIXED") {
      discount = voucher.discountValue;
    } else if (voucher.discountType === "PERCENTAGE") {
      discount = Math.round((subtotal * voucher.discountValue) / 100);
      if (voucher.maxDiscount && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount;
      }
    } else if (voucher.discountType === "SHIPPING_SUBSIDY") {
      discount = voucher.discountValue;
    }
    return Math.min(discount, subtotal);
  }, []);

  // 2. Apply Voucher with Validation
  const applyVoucher = useCallback(
    async (voucherOrCode: VoucherItem | string, subtotal: number) => {
      let targetVoucher: VoucherItem | undefined;

      if (typeof voucherOrCode === "string") {
        targetVoucher = vouchers.find(
          (v) => v.code.toUpperCase() === voucherOrCode.toUpperCase()
        );
      } else {
        targetVoucher = voucherOrCode;
      }

      // Validasi lokal jika voucher ada di list
      if (targetVoucher) {
        if (subtotal < targetVoucher.minPurchase) {
          const minFormatted = targetVoucher.minPurchase.toLocaleString("id-ID");
          showToast.error(
            "Voucher Belum Memenuhi Syarat",
            `Minimal belanja Rp ${minFormatted} untuk menggunakan voucher ini.`
          );
          return false;
        }

        const calculated = calculateDiscount(targetVoucher, subtotal);
        setAppliedVoucher(targetVoucher);
        setDiscountAmount(calculated);
        showToast.success(
          "Voucher Berhasil Dipasang",
          `Hemat Rp ${calculated.toLocaleString("id-ID")} dengan kode ${targetVoucher.code}`
        );
        return true;
      }

      // Jika kode manual tidak ditemukan di cache list, validasikan ke API
      try {
        const code = typeof voucherOrCode === "string" ? voucherOrCode : voucherOrCode.code;
        const res = await vouchersApi.validateVoucher({
          code,
          subtotal,
          userId,
        });

        if (res.valid && res.voucher) {
          setAppliedVoucher(res.voucher);
          setDiscountAmount(res.discountAmount);
          showToast.success(
            "Voucher Berhasil Dipasang",
            res.message || `Kode ${code} berhasil digunakan.`
          );
          return true;
        } else {
          showToast.error("Voucher Tidak Valid", res.message || "Kode promo tidak dapat digunakan.");
          return false;
        }
      } catch (err: any) {
        handleApiError(err, "Gagal memvalidasi kode voucher");
        return false;
      }
    },
    [vouchers, userId, calculateDiscount]
  );

  // 3. Remove Applied Voucher
  const removeVoucher = useCallback(() => {
    setAppliedVoucher(null);
    setDiscountAmount(0);
    showToast.info("Voucher Dilepas", "Potongan diskon voucher telah dihapus dari rincian.");
  }, []);

  // 4. Claim Promo Code Mutation
  const claimMutation = useMutation({
    mutationFn: async (code: string) => {
      return await vouchersApi.claimVoucher(code, userId);
    },
    onSuccess: (newVoucher) => {
      queryClient.invalidateQueries({ queryKey: ["vouchers-list", userId] });
      showToast.success(
        "Klaim Voucher Berhasil",
        `Voucher ${newVoucher?.title || newVoucher?.code || ""} berhasil ditambahkan ke akun Anda.`
      );
    },
    onError: (err: any) => {
      handleApiError(err, "Gagal mengklaim voucher");
    },
  });

  return {
    vouchers,
    isLoading,
    isError,
    error: error?.message || null,
    appliedVoucher,
    discountAmount,
    applyVoucher,
    removeVoucher,
    claimVoucher: (code: string) => claimMutation.mutate(code),
    isClaiming: claimMutation.isPending,
    refreshVouchers: refetch,
  };
}

export default useVouchers;
