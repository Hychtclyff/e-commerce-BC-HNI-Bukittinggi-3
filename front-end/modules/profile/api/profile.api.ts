import apiClient from "@/lib/axios/client";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import {
  UserProfileData,
  HniProfileData,
  AddressData,
  B2BCreditProfileData,
  CreditLedgerEntry,
  UserVoucher,
  UserOrderSummary,
  FullProfileResponse,
  UserHniData,
  SearchHniParams,
  SaveHniProfilePayload,
  CreditApplicationPayload,
  GetOrdersQueryParams,
  OrderStatusCounts,
} from "../types/profile.types";

export interface UpdateProfilePayload {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
}

export interface AddressPayload {
  userId?: string;
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  district: string;
  city: string;
  province?: string;
  postalCode?: string;
  isPrimary?: boolean;
  notes?: string;
}

/**
 * Helper untuk mendapatkan ID user aktif dari parameter atau Zustand AuthStore
 */
const resolveUserId = (userId?: string): string => {
  return userId || useAuthStore.getState().user?.id || "";
};

export const profileApi = {
  /**
   * GET /api/v1/profile/:id
   * Mengambil profil lengkap (User, HNI, Alamat, Kasbon B2B)
   */
  async getProfile(userId?: string, lang?: string): Promise<FullProfileResponse> {
    const id = resolveUserId(userId);
    const endpoint = id ? `/profile/${id}` : "/auth/profile";
    const res = await apiClient.get(endpoint, {
      params: lang ? { lang } : undefined,
    });
    const data = res.data?.data ?? res.data;

    // Normalisasi struktur jika backend mengembalikan data user langsung
    if (data && data.user) {
      return data;
    }

    return {
      user: data,
      hniProfile: data?.hniProfile ?? null,
      addresses: data?.addresses ?? [],
      creditProfile: data?.creditProfile ?? null,
    };
  },

  /**
   * PUT /api/v1/profile/:id
   * Memperbarui data personal pengguna (fullName, email, phoneNumber)
   */
  async updateProfile(
    userId: string,
    payload: UpdateProfilePayload,
    lang?: string
  ): Promise<UserProfileData> {
    const id = resolveUserId(userId);
    const endpoint = id ? `/profile/${id}` : "/auth/profile";
    const res = await apiClient.put(endpoint, payload, {
      params: lang ? { lang } : undefined,
    });
    return res.data?.data ?? res.data;
  },

  /**
   * GET /api/v1/credit/account/:userId
   * Mengambil status plafon kasbon B2B & batas tempo
   */
  async getCreditAccount(userId?: string): Promise<B2BCreditProfileData> {
    const id = resolveUserId(userId);
    const endpoint = id ? `/credit/account/${id}` : "/credit/account";
    const res = await apiClient.get(endpoint);
    return res.data?.data ?? res.data;
  },

  /**
   * POST /api/v1/credit/apply
   * Mengajukan pendaftaran limit kasbon B2B Toko (default Rp 2.000.000)
   */
  async applyCreditAccount(payload: CreditApplicationPayload): Promise<B2BCreditProfileData> {
    const res = await apiClient.post("/credit/apply", payload);
    return res.data?.data ?? res.data;
  },

  /**
   * GET /api/v1/credit/ledger/:userId
   * Mengambil riwayat mutasi piutang/kasbon & rincian faktur
   */
  async getCreditLedger(userId?: string): Promise<CreditLedgerEntry[]> {
    const id = resolveUserId(userId);
    const endpoint = id ? `/credit/ledger/${id}` : "/credit/ledger";
    const res = await apiClient.get(endpoint);
    return res.data?.data ?? res.data ?? [];
  },

  /**
   * GET /api/v1/user/addresses/:userId
   * Mengambil daftar alamat pengiriman pengguna
   */
  async getAddresses(userId?: string): Promise<AddressData[]> {
    const id = resolveUserId(userId);
    const endpoint = id ? `/user/addresses/${id}` : "/user/addresses";
    const res = await apiClient.get(endpoint);
    return res.data?.data ?? res.data ?? [];
  },

  /**
   * POST /api/v1/user/addresses
   * Menambahkan alamat pengiriman baru
   */
  async createAddress(payload: AddressPayload): Promise<AddressData> {
    const userId = payload.userId || resolveUserId();
    const res = await apiClient.post("/user/addresses", {
      ...payload,
      userId,
    });
    return res.data?.data ?? res.data;
  },

  /**
   * PUT /api/v1/user/addresses/:id
   * Memperbarui data alamat pengiriman
   */
  async updateAddress(id: string, payload: Partial<AddressPayload>): Promise<AddressData> {
    const res = await apiClient.put(`/user/addresses/${id}`, payload);
    return res.data?.data ?? res.data;
  },

  /**
   * DELETE /api/v1/user/addresses/:id
   * Menghapus alamat pengiriman
   */
  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/user/addresses/${id}`);
  },

  /**
   * PATCH /api/v1/user/addresses/:id/primary
   * Menjadikan alamat sebagai alamat utama (Primary Address)
   */
  async setPrimaryAddress(id: string): Promise<AddressData> {
    const res = await apiClient.patch(`/user/addresses/${id}/primary`);
    return res.data?.data ?? res.data;
  },

  /**
   * GET /api/v1/vouchers/:userId
   * Mengambil daftar voucher & promo aktif pengguna
   */
  async getVouchers(userId?: string): Promise<UserVoucher[]> {
    const id = resolveUserId(userId);
    const endpoint = id ? `/vouchers/${id}` : "/user/vouchers";
    const res = await apiClient.get(endpoint, { skipGlobalToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  /**
   * GET /api/v1/user/orders
   * Mengambil riwayat pesanan dengan pagination, filter status tab, dan pencarian
   */
  async getOrders(
    params?: GetOrdersQueryParams | string
  ): Promise<{ data: UserOrderSummary[]; meta?: any }> {
    let queryObj: Record<string, any> = {};

    if (typeof params === "string") {
      queryObj.userId = params;
    } else if (params) {
      queryObj = { ...params };
      if (!queryObj.userId) {
        queryObj.userId = resolveUserId();
      }
    } else {
      queryObj.userId = resolveUserId();
    }

    const res = await apiClient.get("/user/orders", {
      params: queryObj,
    });

    const resBody = res.data;
    const rawList = Array.isArray(resBody?.data)
      ? resBody.data
      : Array.isArray(resBody)
      ? resBody
      : [];

    // Map/normalize attributes
    const normalized: UserOrderSummary[] = rawList.map((item: any) => ({
      ...item,
      orderNumber: item.orderNumber || item.invoiceNo || `ORD-${item.id}`,
      invoiceNo: item.invoiceNo || item.orderNumber || `ORD-${item.id}`,
      createdAt: item.createdAt || item.date || new Date().toISOString(),
      date: item.date || item.createdAt || new Date().toLocaleDateString("id-ID"),
      items: item.items || item.previewItems || [],
      previewItems: item.previewItems || item.items || [],
      itemsCount: item.itemsCount ?? (item.items?.length || item.previewItems?.length || 0),
    }));

    return {
      data: normalized,
      meta: resBody?.meta,
    };
  },

  /**
   * GET /api/v1/user/orders/status-counts
   * Mengambil badge counter per status pesanan
   */
  async getOrderStatusCounts(userId?: string): Promise<OrderStatusCounts> {
    const id = resolveUserId(userId);
    const res = await apiClient.get("/user/orders/status-counts", {
      params: id ? { userId: id } : undefined,
    });
    return res.data?.data ?? res.data ?? {};
  },

  /**
   * GET /api/v1/user/orders/:id
   * Mengambil detail lengkap 1 pesanan untuk Faktur / Struk
   */
  async getOrderById(orderId: string, userId?: string): Promise<UserOrderSummary> {
    const id = resolveUserId(userId);
    const res = await apiClient.get(`/user/orders/${orderId}`, {
      params: id ? { userId: id } : undefined,
    });
    const item = res.data?.data ?? res.data;
    return {
      ...item,
      orderNumber: item?.orderNumber || item?.invoiceNo || `ORD-${item?.id}`,
      invoiceNo: item?.invoiceNo || item?.orderNumber || `ORD-${item?.id}`,
      createdAt: item?.createdAt || item?.date || new Date().toISOString(),
      date: item?.date || item?.createdAt || new Date().toLocaleDateString("id-ID"),
      items: item?.items || item?.previewItems || [],
    };
  },

  /**
   * POST /api/v1/user/orders/:id/cancel
   * Membatalkan pesanan (jika PENDING_PAYMENT)
   */
  async cancelOrder(
    orderId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await apiClient.post(`/user/orders/${orderId}/cancel`, {
      reason,
    });
    return res.data;
  },

  /**
   * POST /api/v1/user/orders/:id/confirm-delivered
   * Mengonfirmasi barang pesanan telah diterima (SHIPPED -> COMPLETED)
   */
  async confirmOrderDelivered(
    orderId: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await apiClient.post(`/user/orders/${orderId}/confirm-delivered`);
    return res.data;
  },

  async findMember(noHandphone: string): Promise<UserHniData> {
    try {
      const res = await apiClient.get("/profile/search-hni", { params: { noHandphone } });
      return res.data?.data ?? res.data;
    } catch {
      const fallback = await apiClient.get("/profile/searchHniProfile", { params: { noHandphone } });
      return fallback.data?.data ?? fallback.data;
    }
  },

  /**
   * POST /api/v1/profile/search-hni-by-id
   * Mencari agen/member HNI langsung berdasarkan ID Agen ke endpoint live HSIS
   * Payload: { code: string, jual?: "MLM" }
   */
  async searchHniMemberById(payload: { code: string; jual?: string }): Promise<any> {
    const res = await apiClient.post("/profile/search-hni-by-id", {
      code: payload.code.trim(),
      jual: payload.jual || "MLM",
    });
    return res.data?.data ?? res.data;
  },

  /**
   * GET /api/v1/profile/searchHniProfile
   * Mencari agen/member HNI (via HSIS) dengan debounce
   */
  async searchHniProfile(params: SearchHniParams): Promise<any> {
    try {
      const res = await apiClient.get("/profile/searchHniProfile", { params });
      return res.data?.data ?? res.data;
    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        const fallback = await apiClient.get("/searchHniProfile", { params });
        return fallback.data?.data ?? fallback.data;
      }
      throw err;
    }
  },

  /**
   * POST /api/v1/profile/:id/hni
   * Menyimpan atau memperbarui data profil HNI pengguna
   */
  async saveHniProfile(userId: string, payload: SaveHniProfilePayload): Promise<any> {
    const id = resolveUserId(userId);
    const endpoint = id ? `/profile/${id}/hni` : "/profile/hni";
    const res = await apiClient.post(endpoint, payload);
    return res.data?.data ?? res.data;
  },
};


export default profileApi;
