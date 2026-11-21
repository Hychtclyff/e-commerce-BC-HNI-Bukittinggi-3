import apiClient from "@/lib/axios/client";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import {
  VoucherItem,
  ValidateVoucherRequest,
  VoucherValidationResponse,
} from "../types/vouchers.types";

const resolveUserId = (userId?: string): string => {
  return userId || useAuthStore.getState().user?.id || "";
};

export const vouchersApi = {
  /**
   * GET /api/v1/vouchers
   * Mengambil daftar voucher promosi yang aktif
   */
  async getAvailableVouchers(): Promise<VoucherItem[]> {
    const res = await apiClient.get("/vouchers");
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/v1/user/vouchers
   * Mengambil daftar voucher yang dimiliki pengguna
   */
  async getUserVouchers(userId?: string): Promise<VoucherItem[]> {
    const id = resolveUserId(userId);
    const endpoint = id ? `/user/vouchers/${id}` : "/user/vouchers";
    const res = await apiClient.get(endpoint, { skipGlobalToast: true } as any);
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * POST /api/v1/vouchers/validate
   * Memvalidasi kode voucher apakah layak digunakan berdasarkan subtotal
   */
  async validateVoucher(
    payload: ValidateVoucherRequest
  ): Promise<VoucherValidationResponse> {
    const userId = resolveUserId(payload.userId);
    const res = await apiClient.post("/vouchers/validate", {
      ...payload,
      userId,
    });
    return res.data?.data ?? res.data;
  },

  /**
   * POST /api/v1/vouchers/claim
   * Mengklaim voucher menggunakan kode promo
   */
  async claimVoucher(code: string, userId?: string): Promise<VoucherItem> {
    const id = resolveUserId(userId);
    const res = await apiClient.post("/vouchers/claim", {
      code,
      userId: id,
    });
    return res.data?.data ?? res.data;
  },
};

export default vouchersApi;
