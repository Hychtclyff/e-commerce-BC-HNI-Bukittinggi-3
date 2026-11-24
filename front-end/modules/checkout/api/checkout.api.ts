import apiClient from "@/lib/axios/client";
import {
  CalculateCheckoutPayload,
  CalculateCheckoutResult,
  ProcessCheckoutPayload,
  CheckoutProcessResponse,
  MockPaymentResponse,
} from "../types/checkout.api.types";

export const checkoutApi = {
  /**
   * POST /api/v1/checkout/calculate
   * Kalkulasi real-time subtotal, ongkir, diskon voucher, poin TP, & kelayakan Kasbon.
   */
  async calculateCheckout(
    payload: CalculateCheckoutPayload
  ): Promise<CalculateCheckoutResult> {
    const res = await apiClient.post("/checkout/calculate", payload, {
      skipAuthRedirect: true,
      skipGlobalToast: true,
    } as any);
    return res.data?.data ?? res.data;
  },

  /**
   * POST /api/v1/checkout/process
   * Membuat pesanan baru, memotong stok, & memotong saldo plafon Kasbon B2B jika dipilih.
   */
  async processCheckout(
    payload: ProcessCheckoutPayload
  ): Promise<CheckoutProcessResponse> {
    const res = await apiClient.post("/checkout/process", payload, {
      skipGlobalToast: true,
    } as any);
    return res.data?.data ?? res.data;
  },

  /**
   * POST /api/v1/checkout/payments/mock-pay/:orderId
   * Simulasi pembayaran mockup (QRIS / Transfer Bank) untuk memperbarui status pesanan.
   */
  async mockPay(orderId: string): Promise<MockPaymentResponse> {
    const res = await apiClient.post(`/checkout/payments/mock-pay/${orderId}`);
    return res.data?.data ?? res.data;
  },

  /**
   * POST /api/v1/checkout/orders/:id/regenerate-payment
   * Membuat ulang kode pembayaran / QRIS jika kadaluarsa atau ingin diperpanjang.
   */
  async regeneratePaymentCode(orderId: string): Promise<CheckoutProcessResponse> {
    const res = await apiClient.post(`/checkout/orders/${orderId}/regenerate-payment`);
    return res.data?.data ?? res.data;
  },

  /**
   * GET /api/v1/checkout/orders/:id/receipt
   * Mengambil faktur struk pembelian resmi.
   */
  async getOrderReceipt(orderId: string): Promise<CheckoutProcessResponse> {
    const res = await apiClient.get(`/checkout/orders/${orderId}/receipt`);
    return res.data?.data ?? res.data;
  },

  /**
   * POST /api/v1/checkout/admin/orders/:id/approve
   * (Owner Admin) Menyetujui pesanan & mengubah status menjadi PROCESSING.
   */
  async approveOrder(orderId: string, notes?: string): Promise<CheckoutProcessResponse> {
    const res = await apiClient.post(`/checkout/admin/orders/${orderId}/approve`, { notes });
    return res.data?.data ?? res.data;
  },

  /**
   * POST /api/v1/checkout/admin/orders/:id/ship
   * (Owner Admin) Mengubah status pesanan menjadi SHIPPED / Siap Diambil.
   */
  async shipOrder(
    orderId: string,
    data?: { trackingNumber?: string; courierName?: string }
  ): Promise<CheckoutProcessResponse> {
    const res = await apiClient.post(`/checkout/admin/orders/${orderId}/ship`, data);
    return res.data?.data ?? res.data;
  },

  /**
   * POST /api/v1/checkout/admin/orders/:id/reject
   * (Owner Admin) Menolak pesanan, mengembalikan stok, & auto refund Kasbon B2B.
   */
  async rejectOrder(
    orderId: string,
    rejectionReason: string
  ): Promise<CheckoutProcessResponse> {
    const res = await apiClient.post(`/checkout/admin/orders/${orderId}/reject`, {
      rejectionReason,
    });
    return res.data?.data ?? res.data;
  },

  /**
   * GET /api/v1/payments/sync-status/:orderId
   * Sinkronisasi status pembayaran langsung ke gateway Xendit.
   */
  async syncXenditPayment(orderId: string): Promise<any> {
    const res = await apiClient.get(`/payments/sync-status/${orderId}`);
    return res.data?.data ?? res.data;
  },
};

export default checkoutApi;
