"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  storeApi,
  type IStoreMutationResult,
  type InventoryPayload,
  type VoucherPayload,
  type DevicePayload,
  type AgentPayload,
  type MerchantPayload,
  type NonHniProductPayload,
  type EsignaturePayload,
  type ProductKnowledgePayload,
  type TestimonialPayload,
} from "../api/store.api";
import type {
  StoreInventoryItem,
  StoreOrder,
  StoreCreditApplication,
  StoreVoucher,
  StoreDevice,
  StoreAgent,
  StoreHsisSession,
  StoreReconciliationEntry,
  StoreStockVelocity,
  StoreRestockRecommendation,
  StoreDiseaseTrend,
  StoreShipment,
  StoreCustomer,
  StoreMerchant,
  StoreNonHniProduct,
  StoreEsignature,
  StoreProductKnowledge,
  ShipOrderPayload,
  RejectOrderPayload,
  PosOrderPayload,
} from "../types/store.types";
import { showToast } from "@/utils/toast";
import { getBackendApiBaseUrl } from "@/lib/api/baseUrl";

const KEYS = {
  inventory: ["store-inventory"],
  orders: ["store-orders"],
  credit: ["store-credit-apps"],
  vouchers: ["store-vouchers"],
  devices: ["store-devices"],
  agents: ["store-agents"],
  hsis: ["store-hsis-session"],
  velocity: ["store-velocity"],
  restock: ["store-restock"],
  trends: ["store-disease-trends"],
  reconciliation: ["store-reconciliation"],
  shipments: ["store-shipments"],
  customers: ["store-customers"],
  merchants: ["store-merchants"],
  nonHni: ["store-non-hni"],
  esignatures: ["store-esignatures"],
  productKnowledge: ["store-product-knowledge"],
  hsisEndpoints: ["store-hsis-endpoints"],
  hsisControllers: ["store-hsis-controllers"],
  userNotifications: ["user-notifications"],
  userNotificationsUnread: ["user-notifications-unread"],
  userOrders: ["user-orders"],
} as const;

type QueryKey = (typeof KEYS)[keyof typeof KEYS];

interface IMutationConfig {
  successTitle: string;
  errorTitle: string;
  invalidate: readonly QueryKey[];
  tone?: "success" | "warning";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kendala, silakan coba lagi.";
}

export function useStoreErp() {
  const queryClient = useQueryClient();
  const tToasts = useTranslations("storeErp.toasts");

  // Real-time ERP order & payment status subscription (Fastify SSE)
  useEffect(() => {
    const apiBase = getBackendApiBaseUrl();

    let sse: EventSource | null = null;
    try {
      sse = new EventSource(`${apiBase}/payments/stream`);
      sse.addEventListener("order-updated", () => {
        queryClient.invalidateQueries({ queryKey: [...KEYS.orders] });
        queryClient.invalidateQueries({ queryKey: [...KEYS.credit] });
      });
    } catch {
      // Ignore if EventSource unavailable
    }

    return () => {
      if (sse) sse.close();
    };
  }, [queryClient]);

  /** Mutation generik: toast sukses/gagal + invalidasi query terkait. */
  const useStoreMutation = <TVars, TRes extends IStoreMutationResult = IStoreMutationResult>(
    mutationFn: (vars: TVars) => Promise<TRes>,
    config: IMutationConfig
  ) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMutation<TRes, Error, TVars>({
      mutationFn,
      onSuccess: (res) => {
        const notify = config.tone === "warning" ? showToast.warning : showToast.success;
        notify(config.successTitle, res.message);
        config.invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: [...key] }));
      },
      onError: (error) => {
        if (!(error as any)?._toastShown) {
          showToast.error(config.errorTitle, getErrorMessage(error));
        }
      },
    });

  // ─── Queries ─────────────────────────────────────────────────
  const inventoryQuery = useQuery<StoreInventoryItem[], Error>({
    queryKey: KEYS.inventory,
    queryFn: () => storeApi.getInventory(),
    staleTime: 1000 * 30,
  });
  const ordersQuery = useQuery<StoreOrder[], Error>({
    queryKey: KEYS.orders,
    queryFn: () => storeApi.getOrders(),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 60,
  });
  const creditQuery = useQuery<StoreCreditApplication[], Error>({
    queryKey: KEYS.credit,
    queryFn: () => storeApi.getCreditApplications(),
    staleTime: 1000 * 60,
  });
  const vouchersQuery = useQuery<StoreVoucher[], Error>({
    queryKey: KEYS.vouchers,
    queryFn: () => storeApi.getVouchers(),
    staleTime: 1000 * 60,
  });
  const devicesQuery = useQuery<StoreDevice[], Error>({
    queryKey: KEYS.devices,
    queryFn: () => storeApi.getDevices(),
    staleTime: 1000 * 60,
  });
  const agentsQuery = useQuery<StoreAgent[], Error>({
    queryKey: KEYS.agents,
    queryFn: () => storeApi.getAgents(),
    staleTime: 1000 * 60,
  });
  const hsisSessionQuery = useQuery<StoreHsisSession, Error>({
    queryKey: KEYS.hsis,
    queryFn: () => storeApi.getHsisSession(),
    staleTime: 1000 * 60 * 2,
  });
  const velocityQuery = useQuery<StoreStockVelocity[], Error>({
    queryKey: KEYS.velocity,
    queryFn: () => storeApi.getStockVelocity(),
    staleTime: 1000 * 60 * 5,
  });
  const restockQuery = useQuery<StoreRestockRecommendation[], Error>({
    queryKey: KEYS.restock,
    queryFn: () => storeApi.getRestockRecommendations(),
    staleTime: 1000 * 60 * 5,
  });
  const trendsQuery = useQuery<StoreDiseaseTrend[], Error>({
    queryKey: KEYS.trends,
    queryFn: () => storeApi.getDiseaseTrends(),
    staleTime: 1000 * 60 * 10,
  });
  const reconciliationQuery = useQuery<StoreReconciliationEntry[], Error>({
    queryKey: KEYS.reconciliation,
    queryFn: () => storeApi.getReconciliationEntries(),
    staleTime: 1000 * 60 * 2,
  });
  const shipmentsQuery = useQuery<StoreShipment[], Error>({
    queryKey: KEYS.shipments,
    queryFn: () => storeApi.getShipments(),
    staleTime: 1000 * 30,
  });
  const customersQuery = useQuery<StoreCustomer[], Error>({
    queryKey: KEYS.customers,
    queryFn: () => storeApi.getCustomers(),
    staleTime: 1000 * 60,
  });
  const merchantsQuery = useQuery<StoreMerchant[], Error>({
    queryKey: KEYS.merchants,
    queryFn: () => storeApi.getMerchants(),
    staleTime: 1000 * 60,
  });
  const nonHniQuery = useQuery<StoreNonHniProduct[], Error>({
    queryKey: KEYS.nonHni,
    queryFn: () => storeApi.getNonHniProducts(),
    staleTime: 1000 * 60,
  });
  const esignaturesQuery = useQuery<StoreEsignature[], Error>({
    queryKey: KEYS.esignatures,
    queryFn: () => storeApi.getEsignatures(),
    staleTime: 1000 * 60,
  });
  const productKnowledgeQuery = useQuery<StoreProductKnowledge[], Error>({
    queryKey: KEYS.productKnowledge,
    queryFn: () => storeApi.getProductKnowledge(),
    staleTime: 1000 * 60,
  });
  const hsisEndpointsQuery = useQuery<any[], Error>({
    queryKey: KEYS.hsisEndpoints,
    queryFn: () => storeApi.getHsisEndpoints(),
    staleTime: 1000 * 30,
  });
  const hsisControllersQuery = useQuery<any[], Error>({
    queryKey: KEYS.hsisControllers,
    queryFn: () => storeApi.getHsisControllers(),
    staleTime: 1000 * 60 * 5,
  });

  // ─── Mutations: Inventori ────────────────────────────────────
  const createInventory = useStoreMutation(
    (payload: InventoryPayload) => storeApi.createInventoryItem(payload),
    { successTitle: "Produk Ditambahkan", errorTitle: "Gagal Menambah Produk", invalidate: [KEYS.inventory] }
  );
  const updateInventory = useStoreMutation(
    ({ id, payload }: { id: string; payload: InventoryPayload }) =>
      storeApi.updateInventoryItem(id, payload),
    { successTitle: "Produk Diperbarui", errorTitle: "Gagal Memperbarui Produk", invalidate: [KEYS.inventory] }
  );
  const deleteInventory = useStoreMutation((id: string) => storeApi.deleteInventoryItem(id), {
    successTitle: "Produk Dihapus",
    errorTitle: "Gagal Menghapus Produk",
    invalidate: [KEYS.inventory],
    tone: "warning",
  });

  // ─── Mutations: Alur Pesanan ─────────────────────────────────
  const ORDER_KEYS = [
    KEYS.orders,
    KEYS.inventory,
    KEYS.shipments,
    KEYS.userOrders,
    KEYS.userNotifications,
    KEYS.userNotificationsUnread,
  ] as const;

  const approveOrder = useStoreMutation(
    ({ orderId, notes }: { orderId: string; notes?: string }) => storeApi.approveOrder(orderId, notes),
    { successTitle: "Pesanan Lunas & Dikemas", errorTitle: "Gagal Menyetujui", invalidate: ORDER_KEYS }
  );
  const shipOrder = useStoreMutation(
    ({ orderId, payload }: { orderId: string; payload: ShipOrderPayload }) =>
      storeApi.shipOrder(orderId, payload),
    { successTitle: "Pesanan Dikirim", errorTitle: "Gagal Mengirim", invalidate: ORDER_KEYS }
  );
  const confirmReceived = useStoreMutation((orderId: string) => storeApi.confirmOrderReceived(orderId), {
    successTitle: "Pesanan Diterima Pembeli",
    errorTitle: "Gagal Konfirmasi",
    invalidate: ORDER_KEYS,
  });
  const completeOrder = useStoreMutation(
    (arg: string | { orderId: string; cashReceived?: number }) =>
      typeof arg === "string"
        ? storeApi.completeOrder(arg)
        : storeApi.completeOrder(arg.orderId, arg.cashReceived),
    {
      successTitle: "Pesanan Selesai",
      errorTitle: "Gagal Menyelesaikan",
      invalidate: [KEYS.orders, KEYS.customers, KEYS.userOrders, KEYS.userNotifications, KEYS.userNotificationsUnread],
    }
  );
  const syncOrderToHsis = useStoreMutation(
    ({ orderId, payload }: { orderId: string; payload: { hsisTrxNumber: string; notes?: string } }) =>
      storeApi.syncOrderToHsis(orderId, payload),
    {
      successTitle: "Integrasi HSIS Berhasil",
      errorTitle: "Gagal Integrasi HSIS",
      invalidate: ORDER_KEYS,
    }
  );
  const bulkSyncOrdersToHsis = useStoreMutation(
    (orderIds: string[]) => storeApi.bulkSyncOrdersToHsis(orderIds),
    {
      successTitle: "Integrasi HSIS Massal Berhasil",
      errorTitle: "Gagal Integrasi HSIS Massal",
      invalidate: ORDER_KEYS,
    }
  );
  const readyForPickup = useStoreMutation((orderId: string) => storeApi.setReadyForPickup(orderId), {
    successTitle: "Pesanan Siap Diambil",
    errorTitle: "Gagal Set Siap Diambil",
    invalidate: ORDER_KEYS,
  });
  const rejectOrder = useStoreMutation(
    ({ orderId, payload }: { orderId: string; payload: RejectOrderPayload }) =>
      storeApi.rejectOrder(orderId, payload),
    { successTitle: "Pesanan Ditolak", errorTitle: "Gagal Menolak", invalidate: ORDER_KEYS, tone: "warning" }
  );
  const confirmOrderRefund = useStoreMutation(
    ({ orderId, refundProofUrl, adminNotes }: { orderId: string; refundProofUrl?: string; adminNotes?: string }) =>
      storeApi.confirmOrderRefund(orderId, { refundProofUrl, adminNotes }),
    { successTitle: "Refund Dikonfirmasi", errorTitle: "Gagal Konfirmasi Refund", invalidate: ORDER_KEYS }
  );
  const triggerPrintOrder = useStoreMutation(
    (orderId: string) => storeApi.triggerPrintOrder(orderId),
    { successTitle: "Status Print Diperbarui", errorTitle: "Gagal Update Status Print", invalidate: ORDER_KEYS }
  );
  const verifyPickupOrder = useStoreMutation(
    ({ orderId, notes }: { orderId: string; notes?: string }) =>
      storeApi.verifyPickupOrder(orderId, notes),
    {
      successTitle: "Pickup Diserahkan di Kasir",
      errorTitle: "Gagal Verifikasi Pickup",
      invalidate: ORDER_KEYS,
    }
  );
  const createPosOrder = useStoreMutation(
    (payload: PosOrderPayload) => storeApi.createPosOrder(payload),
    {
      successTitle: "Transaksi Kasir Selesai",
      errorTitle: "Gagal Memproses Transaksi Kasir",
      invalidate: ORDER_KEYS,
    }
  );

  // ─── Mutations: Kasbon ───────────────────────────────────────
  const approveCredit = useStoreMutation((id: string) => storeApi.approveCredit(id), {
    successTitle: "Kasbon Disetujui",
    errorTitle: "Gagal Menyetujui",
    invalidate: [KEYS.credit],
  });
  const rejectCredit = useStoreMutation(
    ({ id, reason }: { id: string; reason?: string }) => storeApi.rejectCredit(id, reason),
    { successTitle: "Kasbon Ditolak", errorTitle: "Gagal Menolak", invalidate: [KEYS.credit], tone: "warning" }
  );

  // ─── Mutations: Voucher ──────────────────────────────────────
  const createVoucher = useStoreMutation((payload: VoucherPayload) => storeApi.createVoucher(payload), {
    successTitle: "Kupon Dibuat",
    errorTitle: "Gagal Membuat Kupon",
    invalidate: [KEYS.vouchers],
  });
  const updateVoucher = useStoreMutation(
    ({ id, payload }: { id: string; payload: VoucherPayload }) => storeApi.updateVoucher(id, payload),
    { successTitle: "Kupon Diperbarui", errorTitle: "Gagal Memperbarui Kupon", invalidate: [KEYS.vouchers] }
  );
  const deleteVoucher = useStoreMutation((id: string) => storeApi.deleteVoucher(id), {
    successTitle: "Kupon Dihapus",
    errorTitle: "Gagal Menghapus Kupon",
    invalidate: [KEYS.vouchers],
    tone: "warning",
  });

  // ─── Mutations: Perangkat ────────────────────────────────────
  const createDevice = useStoreMutation((payload: DevicePayload) => storeApi.createDevice(payload), {
    successTitle: "Perangkat Ditambahkan",
    errorTitle: "Gagal Menambah Perangkat",
    invalidate: [KEYS.devices],
  });
  const updateDevice = useStoreMutation(
    ({ id, payload }: { id: string; payload: DevicePayload }) => storeApi.updateDevice(id, payload),
    { successTitle: "Perangkat Diperbarui", errorTitle: "Gagal Memperbarui Perangkat", invalidate: [KEYS.devices] }
  );
  const deleteDevice = useStoreMutation((id: string) => storeApi.deleteDevice(id), {
    successTitle: "Perangkat Dihapus",
    errorTitle: "Gagal Menghapus Perangkat",
    invalidate: [KEYS.devices],
    tone: "warning",
  });

  // ─── Mutations: Agen & Password ──────────────────────────────
  const createAgent = useStoreMutation((payload: AgentPayload) => storeApi.createAgent(payload), {
    successTitle: "Akun Dibuat",
    errorTitle: "Gagal Membuat Akun",
    invalidate: [KEYS.agents],
  });
  const updateAgent = useStoreMutation(
    ({ id, payload }: { id: string; payload: AgentPayload }) => storeApi.updateAgent(id, payload),
    { successTitle: "Data Agen Diperbarui", errorTitle: "Gagal Memperbarui Agen", invalidate: [KEYS.agents] }
  );
  const deleteAgent = useStoreMutation((id: string) => storeApi.deleteAgent(id), {
    successTitle: "Akun Dihapus",
    errorTitle: "Gagal Menghapus Akun",
    invalidate: [KEYS.agents],
    tone: "warning",
  });
  const setAgentPassword = useStoreMutation(
    ({ id, newPassword }: { id: string; newPassword: string }) =>
      storeApi.setAgentPassword(id, newPassword),
    { successTitle: "Password Diganti", errorTitle: "Gagal Mengganti Password", invalidate: [KEYS.agents] }
  );
  const resetAgentPassword = useStoreMutation((id: string) => storeApi.resetAgentPassword(id), {
    successTitle: "Password Direset",
    errorTitle: "Gagal Mereset Password",
    invalidate: [KEYS.agents],
  });

  // ─── Mutations: HSIS & Rekonsiliasi ──────────────────────────
  const adjustReconciliation = useStoreMutation(
    ({ id, note }: { id: string; note: string }) => storeApi.adjustReconciliation(id, note),
    { successTitle: "Penyesuaian Disimpan", errorTitle: "Gagal Menyesuaikan", invalidate: [KEYS.reconciliation] }
  );
  const resyncHsisPoints = useStoreMutation((orderId: string) => storeApi.resyncHsisPoints(orderId), {
    successTitle: "Poin Diresync",
    errorTitle: "Gagal Resync",
    invalidate: [KEYS.reconciliation],
  });
  const triggerHsisSync = useStoreMutation(() => storeApi.triggerHsisSync(), {
    successTitle: "Sinkronisasi HSIS",
    errorTitle: "Gagal Sync",
    invalidate: [KEYS.hsis],
  });

  // ─── Mutations: Merchant & Produk Non-HNI ────────────────────
  const createMerchant = useStoreMutation((payload: MerchantPayload) => storeApi.createMerchant(payload), {
    successTitle: "Merchant Ditambahkan",
    errorTitle: "Gagal Menambah Merchant",
    invalidate: [KEYS.merchants],
  });
  const updateMerchant = useStoreMutation(
    ({ id, payload }: { id: string; payload: MerchantPayload }) => storeApi.updateMerchant(id, payload),
    { successTitle: "Merchant Diperbarui", errorTitle: "Gagal Memperbarui Merchant", invalidate: [KEYS.merchants] }
  );
  const deleteMerchant = useStoreMutation((id: string) => storeApi.deleteMerchant(id), {
    successTitle: "Merchant Dihapus",
    errorTitle: "Gagal Menghapus Merchant",
    invalidate: [KEYS.merchants],
    tone: "warning",
  });
  const createNonHniProduct = useStoreMutation(
    (payload: NonHniProductPayload) => storeApi.createNonHniProduct(payload),
    { successTitle: "Produk Ditambahkan", errorTitle: "Gagal Menambah Produk", invalidate: [KEYS.nonHni] }
  );
  const updateNonHniProduct = useStoreMutation(
    ({ id, payload }: { id: string; payload: NonHniProductPayload }) =>
      storeApi.updateNonHniProduct(id, payload),
    { successTitle: "Produk Diperbarui", errorTitle: "Gagal Memperbarui Produk", invalidate: [KEYS.nonHni] }
  );
  const deleteNonHniProduct = useStoreMutation((id: string) => storeApi.deleteNonHniProduct(id), {
    successTitle: "Produk Dihapus",
    errorTitle: "Gagal Menghapus Produk",
    invalidate: [KEYS.nonHni],
    tone: "warning",
  });

  // ─── Mutations: Tanda Tangan Digital ─────────────────────────
  const createEsignature = useStoreMutation(
    (payload: EsignaturePayload) => storeApi.createEsignature(payload),
    { successTitle: "Tanda Tangan Dibuat", errorTitle: "Gagal Membuat Tanda Tangan", invalidate: [KEYS.esignatures] }
  );
  const deleteEsignature = useStoreMutation((id: string) => storeApi.deleteEsignature(id), {
    successTitle: "Tanda Tangan Dicabut",
    errorTitle: "Gagal Mencabut",
    invalidate: [KEYS.esignatures],
    tone: "warning",
  });

  // ─── Mutations: Khasiat, Komposisi & Testimoni ───────────────
  const createProductKnowledge = useStoreMutation(
    (payload: ProductKnowledgePayload) => storeApi.createProductKnowledge(payload),
    { successTitle: "Informasi Ditambahkan", errorTitle: "Gagal Menambah Informasi", invalidate: [KEYS.productKnowledge] }
  );
  const updateProductKnowledge = useStoreMutation(
    ({ id, payload }: { id: string; payload: ProductKnowledgePayload }) =>
      storeApi.updateProductKnowledge(id, payload),
    { successTitle: "Informasi Diperbarui", errorTitle: "Gagal Memperbarui Informasi", invalidate: [KEYS.productKnowledge] }
  );
  const deleteProductKnowledge = useStoreMutation((id: string) => storeApi.deleteProductKnowledge(id), {
    successTitle: "Informasi Dihapus",
    errorTitle: "Gagal Menghapus Informasi",
    invalidate: [KEYS.productKnowledge],
    tone: "warning",
  });
  const saveTestimonial = useStoreMutation(
    ({
      productId,
      payload,
      testimonialId,
    }: {
      productId: string;
      payload: TestimonialPayload;
      testimonialId?: string;
    }) => storeApi.saveTestimonial(productId, payload, testimonialId),
    { successTitle: "Testimoni Tersimpan", errorTitle: "Gagal Menyimpan Testimoni", invalidate: [KEYS.productKnowledge] }
  );
  const deleteTestimonial = useStoreMutation(
    ({ productId, testimonialId }: { productId: string; testimonialId: string }) =>
      storeApi.deleteTestimonial(productId, testimonialId),
    {
      successTitle: "Testimoni Dihapus",
      errorTitle: "Gagal Menghapus Testimoni",
      invalidate: [KEYS.productKnowledge],
      tone: "warning",
    }
  );

  // ─── Refetch semua ───────────────────────────────────────────
  const refetchAll = async () => {
    await queryClient.invalidateQueries();
    showToast.success(tToasts("syncSuccess"), tToasts("syncDesc"));
  };

  // ─── Metrik live ─────────────────────────────────────────────
  const orders = ordersQuery.data || [];
  const inventory = inventoryQuery.data || [];
  const creditApps = creditQuery.data || [];
  const vouchers = vouchersQuery.data || [];

  const isPickupOrder = (o: StoreOrder) =>
    o.fulfillmentType === "PICKUP" ||
    Boolean(o.shippingMethod && /pickup|ambil/i.test(o.shippingMethod));

  const isPosWalkInOrder = (o: StoreOrder) =>
    o.orderNumber.startsWith("POS-") ||
    Boolean(o.shippingMethod && /walk-in|pos/i.test(o.shippingMethod));

  const totalRevenue = orders
    .filter((o) => o.status !== "CANCELLED" && o.status !== "REJECTED")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingApprovalCount = orders.filter(
    (o) => !isPickupOrder(o) && !isPosWalkInOrder(o) && o.status === "PENDING"
  ).length;
  const pendingShipmentCount = orders.filter(
    (o) => !isPickupOrder(o) && !isPosWalkInOrder(o) && (o.status === "PAID" || o.status === "PROCESSING")
  ).length;
  const pendingPickupCount = orders.filter(
    (o) =>
      isPickupOrder(o) &&
      !isPosWalkInOrder(o) &&
      (o.status === "PENDING" ||
        o.status === "PAID" ||
        o.status === "PROCESSING" ||
        o.status === "READY_FOR_PICKUP")
  ).length;
  const pendingHsisCount = orders.filter(
    (o) => o.status === "COMPLETED" && o.hsisStatus !== "SYNCED"
  ).length;
  const lowStockCount = inventory.filter(
    (i) => i.status === "LOW_STOCK" || i.status === "OUT_OF_STOCK"
  ).length;
  const pendingCreditCount = creditApps.filter((c) => c.status === "PENDING").length;

  const voucherAllocatedBudget = vouchers.reduce((sum, v) => sum + v.quota * v.discountValue, 0);
  const voucherRealizedBudget = vouchers.reduce((sum, v) => sum + v.usedCount * v.discountValue, 0);
  const voucherRoi =
    totalRevenue > 0 && voucherRealizedBudget > 0
      ? Number((totalRevenue / voucherRealizedBudget).toFixed(1))
      : 0;

  return {
    // Data & loading
    inventory,
    isInventoryLoading: inventoryQuery.isLoading,
    orders,
    isOrdersLoading: ordersQuery.isLoading,
    creditApps,
    isCreditLoading: creditQuery.isLoading,
    vouchers,
    isVouchersLoading: vouchersQuery.isLoading,
    devices: devicesQuery.data || [],
    isDevicesLoading: devicesQuery.isLoading,
    agents: agentsQuery.data || [],
    isAgentsLoading: agentsQuery.isLoading,
    hsisSession: hsisSessionQuery.data,
    isHsisLoading: hsisSessionQuery.isLoading,
    stockVelocity: velocityQuery.data || [],
    isVelocityLoading: velocityQuery.isLoading,
    restockRecommendations: restockQuery.data || [],
    isRestockLoading: restockQuery.isLoading,
    diseaseTrends: trendsQuery.data || [],
    isTrendsLoading: trendsQuery.isLoading,
    reconciliationEntries: reconciliationQuery.data || [],
    isReconciliationLoading: reconciliationQuery.isLoading,
    shipments: shipmentsQuery.data || [],
    isShipmentsLoading: shipmentsQuery.isLoading,
    customers: customersQuery.data || [],
    isCustomersLoading: customersQuery.isLoading,
    merchants: merchantsQuery.data || [],
    isMerchantsLoading: merchantsQuery.isLoading,
    nonHniProducts: nonHniQuery.data || [],
    isNonHniLoading: nonHniQuery.isLoading,
    esignatures: esignaturesQuery.data || [],
    isEsignaturesLoading: esignaturesQuery.isLoading,
    productKnowledge: productKnowledgeQuery.data || [],
    isProductKnowledgeLoading: productKnowledgeQuery.isLoading,
    isRefreshing: inventoryQuery.isFetching || ordersQuery.isFetching,

    metrics: {
      totalRevenue,
      totalOrders: orders.length,
      pendingApprovalCount,
      pendingShipmentCount,
      pendingPickupCount,
      pendingHsisCount,
      lowStockCount,
      totalSku: inventory.length,
      pendingCreditCount,
    },
    voucherStats: {
      allocatedBudget: voucherAllocatedBudget,
      realizedBudget: voucherRealizedBudget,
      roi: voucherRoi,
    },

    // Actions
    refetchAll,

    createInventory: createInventory.mutateAsync,
    updateInventory: updateInventory.mutateAsync,
    deleteInventory: deleteInventory.mutateAsync,
    isSavingInventory: createInventory.isPending || updateInventory.isPending,
    isDeletingInventory: deleteInventory.isPending,

    approveOrder: approveOrder.mutateAsync,
    isApprovingOrder: approveOrder.isPending,
    shipOrder: shipOrder.mutateAsync,
    isShippingOrder: shipOrder.isPending,
    confirmReceived: confirmReceived.mutateAsync,
    readyForPickup: readyForPickup.mutateAsync,
    isReadyingForPickup: readyForPickup.isPending,
    completeOrder: completeOrder.mutateAsync,
    isAdvancingOrder: confirmReceived.isPending || completeOrder.isPending || readyForPickup.isPending,
    syncOrderToHsis: syncOrderToHsis.mutateAsync,
    isSyncingOrderToHsis: syncOrderToHsis.isPending,
    bulkSyncOrdersToHsis: bulkSyncOrdersToHsis.mutateAsync,
    isBulkSyncingOrdersToHsis: bulkSyncOrdersToHsis.isPending,
    rejectOrder: rejectOrder.mutateAsync,
    isRejectingOrder: rejectOrder.isPending,
    confirmOrderRefund: confirmOrderRefund.mutateAsync,
    isConfirmingRefund: confirmOrderRefund.isPending,
    triggerPrintOrder: triggerPrintOrder.mutateAsync,
    verifyPickupOrder: verifyPickupOrder.mutateAsync,
    isVerifyingPickup: verifyPickupOrder.isPending,
    createPosOrder: createPosOrder.mutateAsync,
    isCreatingPosOrder: createPosOrder.isPending,

    approveCredit: approveCredit.mutateAsync,
    isApprovingCredit: approveCredit.isPending,
    rejectCredit: rejectCredit.mutateAsync,
    isRejectingCredit: rejectCredit.isPending,

    createVoucher: createVoucher.mutateAsync,
    updateVoucher: updateVoucher.mutateAsync,
    deleteVoucher: deleteVoucher.mutateAsync,
    isSavingVoucher: createVoucher.isPending || updateVoucher.isPending,
    isDeletingVoucher: deleteVoucher.isPending,

    createDevice: createDevice.mutateAsync,
    updateDevice: updateDevice.mutateAsync,
    deleteDevice: deleteDevice.mutateAsync,
    isSavingDevice: createDevice.isPending || updateDevice.isPending,
    isDeletingDevice: deleteDevice.isPending,

    createAgent: createAgent.mutateAsync,
    updateAgent: updateAgent.mutateAsync,
    deleteAgent: deleteAgent.mutateAsync,
    setAgentPassword: setAgentPassword.mutateAsync,
    resetAgentPassword: resetAgentPassword.mutateAsync,
    isSavingAgent:
      createAgent.isPending ||
      updateAgent.isPending ||
      setAgentPassword.isPending ||
      resetAgentPassword.isPending,
    isDeletingAgent: deleteAgent.isPending,

    adjustReconciliation: adjustReconciliation.mutateAsync,
    isAdjustingReconciliation: adjustReconciliation.isPending,
    resyncHsisPoints: resyncHsisPoints.mutateAsync,
    isResyncingPoints: resyncHsisPoints.isPending,
    triggerHsisSync: triggerHsisSync.mutateAsync,
    isTriggeringSync: triggerHsisSync.isPending,

    createMerchant: createMerchant.mutateAsync,
    updateMerchant: updateMerchant.mutateAsync,
    deleteMerchant: deleteMerchant.mutateAsync,
    createNonHniProduct: createNonHniProduct.mutateAsync,
    updateNonHniProduct: updateNonHniProduct.mutateAsync,
    deleteNonHniProduct: deleteNonHniProduct.mutateAsync,
    isSavingMerchant:
      createMerchant.isPending ||
      updateMerchant.isPending ||
      createNonHniProduct.isPending ||
      updateNonHniProduct.isPending,
    isDeletingMerchant: deleteMerchant.isPending || deleteNonHniProduct.isPending,

    createEsignature: createEsignature.mutateAsync,
    deleteEsignature: deleteEsignature.mutateAsync,
    downloadEsignature: async (_sig: any) => ({ success: true }),
    isSavingEsignature: createEsignature.isPending,
    isDeletingEsignature: deleteEsignature.isPending,

    createProductKnowledge: createProductKnowledge.mutateAsync,
    updateProductKnowledge: updateProductKnowledge.mutateAsync,
    deleteProductKnowledge: deleteProductKnowledge.mutateAsync,
    saveTestimonial: saveTestimonial.mutateAsync,
    deleteTestimonial: deleteTestimonial.mutateAsync,
    isSavingProductKnowledge:
      createProductKnowledge.isPending ||
      updateProductKnowledge.isPending ||
      saveTestimonial.isPending,
    isDeletingProductKnowledge: deleteProductKnowledge.isPending || deleteTestimonial.isPending,

    hsisEndpoints: hsisEndpointsQuery.data ?? [],
    hsisControllers: hsisControllersQuery.data ?? [],
    createHsisEndpoint: async (payload: any) => {
      const res = await storeApi.createHsisEndpoint(payload);
      queryClient.invalidateQueries({ queryKey: KEYS.hsisEndpoints });
      return res;
    },
    updateHsisEndpoint: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await storeApi.updateHsisEndpoint(id, payload);
      queryClient.invalidateQueries({ queryKey: KEYS.hsisEndpoints });
      return res;
    },
    deleteHsisEndpoint: async (id: string) => {
      const res = await storeApi.deleteHsisEndpoint(id);
      queryClient.invalidateQueries({ queryKey: KEYS.hsisEndpoints });
      return res;
    },
    dispatchHsisEndpoint: async (id: string, payload?: any) => {
      return await storeApi.dispatchHsisEndpoint(id, payload);
    },
    runHsisAutoLogin: async (username?: string, password?: string) => {
      const res = await storeApi.runHsisAutoLogin(username, password);
      queryClient.invalidateQueries({ queryKey: KEYS.hsis });
      return res;
    },
  };
}

export default useStoreErp;
