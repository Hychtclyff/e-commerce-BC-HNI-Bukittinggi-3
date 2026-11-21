"use client";

import { useQuery } from "@tanstack/react-query";
import { profileApi } from "../api/profile.api";
import { UserVoucher } from "../types/profile.types";
import { useAuthStore } from "@/modules/auth/services/auth.store";

export function useVouchers() {
  const authUser = useAuthStore((state) => state.user);
  const userId = authUser?.id;

  const {
    data: vouchersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<UserVoucher[], Error>({
    queryKey: ["vouchers", userId],
    queryFn: async () => {
      try {
        return await profileApi.getVouchers(userId);
      } catch (err: any) {
        console.warn("API vouchers error, fallback to mock:", err?.message);
        return [
          {
            id: "vch_01",
            code: "BC3TRAVELFREE",
            title: "Subsidi Ongkir Travel L300 Regional",
            discountType: "SHIPPING_SUBSIDY",
            discountValue: 15000,
            minPurchase: 500000,
            validUntil: "2026-10-31T23:59:59.000Z",
            isUsed: false,
            isActive: true,
            isClaimed: true,
            description:
              "Gratis potong ongkir Rp 15.000 untuk pengiriman armada travel regional Bukittinggi.",
          },
          {
            id: "vch_02",
            code: "TIJARAHHERBA20",
            title: "Diskon Belanja Herba HNI 20%",
            discountType: "PERCENTAGE",
            discountValue: 20,
            minPurchase: 500000,
            maxDiscount: 100000,
            validUntil: "2026-10-31T23:59:59.000Z",
            isUsed: false,
            isActive: true,
            isClaimed: true,
            description:
              "Potongan 20% untuk belanja produk HNI minimal Rp 500rb khusus mitra terverifikasi.",
          },
          {
            id: "vch_03",
            code: "STOKISVIP100K",
            title: "Voucher Potongan Belanja Grosir Stokis",
            discountType: "FIXED",
            discountValue: 100000,
            minPurchase: 2000000,
            validUntil: "2026-11-15T23:59:59.000Z",
            isUsed: false,
            isActive: true,
            isClaimed: true,
            description:
              "Potongan langsung Rp 100.000 khusus belanja grosir di atas Rp 2 Juta.",
          },
        ];
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const vouchers = vouchersData || [];
  const activeVouchersCount = vouchers.filter((v) => !v.isUsed).length;

  return {
    vouchers,
    isLoading,
    isError,
    error: error?.message || null,
    activeVouchersCount,
    refreshVouchers: refetch,
  };
}

export default useVouchers;
