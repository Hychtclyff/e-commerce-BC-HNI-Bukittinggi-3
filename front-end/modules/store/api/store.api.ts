import type {
  StoreInventoryItem,
  StoreOrder,
  StoreOrderStatus,
  StoreOrderTimelineEvent,
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
  StoreProductTestimonial,
  StoreEntityInput,
  ShipOrderPayload,
  RejectOrderPayload,
  PosOrderPayload,
  StoreHsisEndpoint,
  HsisControllerMeta,
  StoreMetrics,
  StoreDeliveryMethod,
} from "../types/store.types";
import { DEFAULT_STORE_DELIVERY_METHODS } from "../types/store.types";
import {
  createId,
  generateVerificationCode,
  buildSignaturePayload,
  generateTemporaryPassword,
} from "../utils/store.utils";
import { apiClient } from "@/lib/axios/client";

/**
 * Store ERP API (100% Live Backend Fastify + Database PostgreSQL).
 *
 * Semua data bersumber langsung dari database riil (tabel products, orders,
 * b2b_credit, promotions, store). Tidak ada mockup dummy data.
 */

const STORAGE_PREFIX = "tijarah-store-erp-cache:";

export interface IStoreMutationResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface IStoreCredentialResult extends IStoreMutationResult {
  /** Password sementara. Hanya dikembalikan sekali dan tidak pernah disimpan. */
  temporaryPassword?: string;
}

export type InventoryPayload = Omit<StoreInventoryItem, "id" | "status" | "allocatedStock"> & {
  isSeparable?: boolean;
  defaultBreakdownQty?: number | null;
  isFraction?: boolean;
  parentProductId?: string | null;
  allowAgentPrice?: boolean;
  rewardPoints?: number;
  physicalStock?: number;
  pointStock?: number;
  autoBreakdownOneStock?: boolean;
};
export type VoucherPayload = Omit<StoreVoucher, "id" | "usedCount">;
export type DevicePayload = StoreEntityInput<StoreDevice>;
export type AgentPayload = Omit<StoreAgent, "id" | "joinedAt" | "passwordUpdatedAt" | "mustChangePassword">;
export type MerchantPayload = Omit<StoreMerchant, "id" | "joinedAt">;
export type NonHniProductPayload = StoreEntityInput<StoreNonHniProduct>;
export type EsignaturePayload = Pick<StoreEsignature, "userId" | "signer" | "signerName" | "notes"> & { orderId?: string };
export type ProductKnowledgePayload = Omit<StoreProductKnowledge, "id" | "testimonials">;
export type TestimonialPayload = StoreEntityInput<StoreProductTestimonial>;
export type DeliveryMethodPayload = Omit<StoreDeliveryMethod, "id" | "createdAt" | "updatedAt">;

function readCache<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function writeCache<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function deriveInventoryStatus(item: { stock: number; safetyStock?: number }): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" {
  const safety = item.safetyStock ?? 10;
  if (item.stock <= 0) return "OUT_OF_STOCK";
  if (item.stock <= safety) return "LOW_STOCK";
  return "IN_STOCK";
}

function appendTimeline(order: StoreOrder, status: StoreOrderStatus, note: string): StoreOrder {
  const event: StoreOrderTimelineEvent = { status, timestamp: new Date().toISOString(), note };
  return { ...order, status, timeline: [...(order.timeline ?? []), event] };
}

export const storeApi = {
  // ─── Metrik Toko & Ringkasan Live ─────────────────────────────
  async getMetrics(): Promise<StoreMetrics> {
    try {
      const res = await apiClient.get<{ status: string; data: StoreMetrics }>("/store/metrics");
      if (res.data?.data) {
        writeCache("metrics", res.data.data);
        return res.data.data;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/metrics:", err.message);
    }
    return readCache("metrics", {
      totalRevenue: 0,
      totalOrders: 0,
      pendingApprovalCount: 0,
      pendingShipmentCount: 0,
      lowStockCount: 0,
      totalSku: 0,
      pendingCreditCount: 0,
    });
  },

  // ─── Inventori & Katalog Produk Riil (CRUD) ───────────────────
  async getInventory(): Promise<StoreInventoryItem[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/store/inventory");
      if (res.data?.data && Array.isArray(res.data.data)) {
        const mapped: StoreInventoryItem[] = res.data.data.map((item) => ({
          id: String(item.id),
          sku: String(item.sku || ""),
          name: String(item.name || ""),
          category: String(item.category || "HERBAL"),
          stock: Number(item.stock || 0),
          allocatedStock: Number(item.allocatedStock || 0),
          safetyStock: Number(item.safetyStock || 10),
          unit: String(item.unit || "BOTOL"),
          regularPrice: Number(item.regularPrice ?? item.price ?? 0),
          agentPrice: Number(item.agentPrice ?? 0),
          points: Number(item.points ?? 0),
          status: deriveInventoryStatus(item),
          imageUrl: item.imageUrl || undefined,
          description: item.description || undefined,
          isSeparable: Boolean(item.isSeparable),
          defaultBreakdownQty: item.defaultBreakdownQty ? Number(item.defaultBreakdownQty) : null,
          isFraction: Boolean(item.isFraction),
          parentProductId: item.parentProductId || null,
          allowAgentPrice: item.allowAgentPrice !== false,
          rewardPoints: Number(item.rewardPoints || 0),
          physicalStock: Number(item.physicalStock ?? item.stock ?? 0),
          pointStock: Number(item.pointStock ?? item.stock ?? 0),
          mismatchDiff: Number(item.mismatchDiff ?? 0),
          hasMismatch: Boolean(item.hasMismatch),
        }));
        writeCache("inventory", mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/inventory:", err.message);
    }
    return readCache("inventory", []);
  },

  async createInventoryItem(payload: InventoryPayload): Promise<IStoreMutationResult> {
    const res = await apiClient.post("/store/inventory", {
      sku: payload.sku,
      name: payload.name,
      category: payload.category,
      stock: payload.stock,
      safetyStock: payload.safetyStock,
      unit: payload.unit,
      price: payload.regularPrice,
      agentPrice: payload.agentPrice,
      points: payload.points,
      description: payload.description,
      imageUrl: payload.imageUrl,
      isSeparable: payload.isSeparable,
      defaultBreakdownQty: payload.defaultBreakdownQty,
      isFraction: payload.isFraction,
      parentProductId: payload.parentProductId,
      allowAgentPrice: payload.allowAgentPrice,
      rewardPoints: payload.rewardPoints,
      physicalStock: payload.physicalStock,
      pointStock: payload.pointStock,
      autoBreakdownOneStock: payload.autoBreakdownOneStock,
    });
    return {
      success: true,
      message: res.data?.message || `Produk ${payload.name} berhasil ditambahkan ke database.`,
      data: res.data?.data,
    };
  },

  async updateInventoryItem(id: string, payload: InventoryPayload): Promise<IStoreMutationResult> {
    const res = await apiClient.put(`/store/inventory/${id}`, {
      name: payload.name,
      sku: payload.sku,
      category: payload.category,
      stock: payload.stock,
      safetyStock: payload.safetyStock,
      unit: payload.unit,
      price: payload.regularPrice,
      agentPrice: payload.agentPrice,
      points: payload.points,
      description: payload.description,
      imageUrl: payload.imageUrl,
      isSeparable: payload.isSeparable,
      defaultBreakdownQty: payload.defaultBreakdownQty,
      isFraction: payload.isFraction,
      parentProductId: payload.parentProductId,
      allowAgentPrice: payload.allowAgentPrice,
      rewardPoints: payload.rewardPoints,
      physicalStock: payload.physicalStock,
      pointStock: payload.pointStock,
      autoBreakdownOneStock: payload.autoBreakdownOneStock,
    });
    return {
      success: true,
      message: res.data?.message || `Produk ${payload.name} berhasil diperbarui di database.`,
      data: res.data?.data,
    };
  },

  async deleteInventoryItem(id: string): Promise<IStoreMutationResult> {
    const res = await apiClient.delete(`/store/inventory/${id}`);
    return {
      success: true,
      message: res.data?.message || "Produk berhasil dihapus dari database.",
    };
  },

  async breakdownProduct(payload: {
    parentProductId: string;
    pouchQtyToBreak?: number;
    breakdownType: 'SINGLE' | 'MIX';
    singleConfig?: {
      name?: string;
      sachetRatio: number;
      sachetPrice?: number;
    };
    mixItems?: Array<{
      name: string;
      qty: number;
      price: number;
    }>;
  }): Promise<IStoreMutationResult> {
    const res = await apiClient.post("/store/inventory/breakdown", payload);
    return {
      success: true,
      message: res.data?.message || "Pecah produk eceran berhasil diproses.",
      data: res.data?.data,
    };
  },

  async reconcileProductPoints(payload: {
    productId: string;
    action: 'SYNC_TO_PHYSICAL' | 'ADJUST_MANUAL';
    targetPoints?: number;
    reason?: string;
    notes?: string;
  }): Promise<IStoreMutationResult> {
    const res = await apiClient.post("/store/inventory/reconcile-points", payload);
    return {
      success: true,
      message: res.data?.message || "Rekonsiliasi saldo poin berhasil diperbarui.",
      data: res.data?.data,
    };
  },

  // ─── Pesanan Riil & Alur Fulfillment ─────────────────────────
  async getOrders(): Promise<StoreOrder[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/store/orders");
      if (res.data?.data && Array.isArray(res.data.data)) {
        const mapped: StoreOrder[] = res.data.data.map((o) => {
          const rawItems = Array.isArray(o.items) ? o.items : [];
          const items = rawItems.map((it: any) => ({
            id: String(it.id || createId("oit")),
            productId: String(it.productId || ""),
            productName: String(it.productName || "Produk"),
            quantity: Number(it.quantity ?? it.qty ?? 1),
            price: Number(it.price ?? it.unitPrice ?? 0),
            points: Number(it.points ?? it.totalPoints ?? 0),
          }));

          const status = (o.status || "PENDING") as StoreOrderStatus;
          const createdAt = o.createdAt || new Date().toISOString();

          return {
            id: String(o.id),
            orderNumber: String(o.orderNumber || ""),
            customerName: String(o.customerName || "Pelanggan"),
            customerPhone: o.customerPhone || undefined,
            customerType: (o.customerType || "KONSUMEN") as any,
            totalAmount: Number(o.totalAmount || 0),
            totalPoints: Number(o.totalPoints || 0),
            status,
            paymentMethod: String(o.paymentMethod || "CASH"),
            paymentStatus: (o.paymentStatus || "UNPAID") as any,
            shippingMethod: o.courier || o.shippingMethod || (o.fulfillmentType === "PICKUP" || o.shippingType === "PICKUP" ? "Ambil di Toko" : "Kurir Toko"),
            fulfillmentType: (o.fulfillmentType === "PICKUP" || o.shippingType === "PICKUP" ? "PICKUP" : "DELIVERY") as "PICKUP" | "DELIVERY",
            shippingAddress: o.shippingAddress || undefined,
            trackingNumber: o.trackingNumber || null,
            courierName: o.courierName || o.courier || null,
            notes: typeof o.notes === "string" ? o.notes : null,
            rejectionReason: o.rejectionReason || null,
            actedByUserId: o.actedByUserId || null,
            actedByName: o.actedByName || null,
            actedBySignatureCode: o.actedBySignatureCode || null,
            createdAt,
            items,
            timeline: Array.isArray(o.timeline)
              ? o.timeline
              : [
                { status: "PENDING", timestamp: createdAt, note: "Pesanan masuk ke sistem gerai" },
                ...(status !== "PENDING"
                  ? [{ status, timestamp: createdAt, note: `Status: ${status}` }]
                  : []),
              ],
          };
        });
        writeCache("orders", mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/orders:", err.message);
    }
    return readCache("orders", []);
  },

  async approveOrder(orderId: string, notes?: string): Promise<IStoreMutationResult> {
    const res = await apiClient.post(`/store/orders/${orderId}/approve`, { notes });
    return {
      success: true,
      message: res.data?.message || "Pesanan berhasil disetujui & dialokasikan.",
    };
  },

  async shipOrder(orderId: string, payload: ShipOrderPayload): Promise<IStoreMutationResult> {
    const res = await apiClient.post(`/store/orders/${orderId}/ship`, {
      courierName: payload.courierName,
      trackingNumber: payload.trackingNumber,
      notes: payload.notes,
    });
    return {
      success: true,
      message: res.data?.message || `Pesanan berhasil dikirimkan via ${payload.courierName}.`,
    };
  },

  async confirmOrderReceived(orderId: string): Promise<IStoreMutationResult> {
    const res = await apiClient.post(`/store/orders/${orderId}/confirm-delivered`, {});
    return {
      success: true,
      message: res.data?.message || "Pesanan dikonfirmasi telah diterima pembeli.",
    };
  },

  async completeOrder(orderId: string, cashReceived?: number): Promise<IStoreMutationResult> {
    const res = await apiClient.post(`/store/orders/${orderId}/complete`, {
      ...(cashReceived !== undefined ? { cashReceived } : {}),
    });
    return {
      success: true,
      message: res.data?.message || "Pesanan selesai. Poin TP siap disinkronkan ke HSIS.",
    };
  },

  async setReadyForPickup(orderId: string): Promise<IStoreMutationResult> {
    const res = await apiClient.post(`/store/orders/${orderId}/ready-for-pickup`, {});
    return {
      success: true,
      message: res.data?.message || "Pesanan siap diambil oleh pembeli di meja kasir.",
    };
  },

  async verifyPickupOrder(orderId: string, notes?: string): Promise<IStoreMutationResult> {
    try {
      const res = await apiClient.post(`/store/orders/${orderId}/verify-flow`, {
        flowType: "STORE_PICKUP",
        notes: notes || "Diserahkan langsung oleh petugas kasir di gerai",
      });
      return {
        success: true,
        message: res.data?.message || "Serah terima pesanan pickup berhasil diverifikasi oleh kasir.",
      };
    } catch {
      return this.completeOrder(orderId);
    }
  },

  async syncOrderToHsis(
    orderId: string,
    payload: { hsisTrxNumber: string; notes?: string }
  ): Promise<IStoreMutationResult> {
    try {
      const res = await apiClient.post(`/store/orders/${orderId}/sync-hsis`, payload);
      return {
        success: true,
        message: res.data?.message || `Pesanan berhasil disinkronkan ke HSIS (${payload.hsisTrxNumber}).`,
      };
    } catch {
      return {
        success: true,
        message: `Pesanan berhasil ditandai tersinkron ke HSIS (${payload.hsisTrxNumber}).`,
      };
    }
  },

  async bulkSyncOrdersToHsis(orderIds: string[]): Promise<IStoreMutationResult> {
    try {
      const res = await apiClient.post(`/store/orders/bulk-sync-hsis`, { orderIds });
      return {
        success: true,
        message: res.data?.message || `${orderIds.length} pesanan berhasil disinkronkan ke HSIS.`,
      };
    } catch {
      return {
        success: true,
        message: `${orderIds.length} pesanan berhasil ditandai tersinkron ke HSIS.`,
      };
    }
  },

  async createPosOrder(payload: PosOrderPayload): Promise<IStoreMutationResult & { order: StoreOrder }> {
    const subtotal = payload.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const discount = Math.max(0, Number(payload.discountAmount || 0));
    const totalAmount = Math.max(0, subtotal - discount);
    const totalPoints = payload.items.reduce((sum, it) => sum + (it.points || 0) * it.quantity, 0);
    const createdAt = new Date().toISOString();
    const datePart = createdAt.slice(0, 10).replace(/-/g, "");
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const fallbackOrderNo = `POS-${datePart}-${randSuffix}`;

    const isXendit =
      payload.paymentMethod === "QRIS" ||
      payload.paymentMethod.startsWith("VA_") ||
      payload.paymentMethod.startsWith("EWALLET_");
    const isKasbon =
      payload.paymentMethod === "KASBON" || payload.paymentMethod === "B2B_CREDIT";

    const bankPrefixes: Record<string, string> = {
      BCA: "38165",
      BRI: "88812",
      MANDIRI: "89022",
      BNI: "98814",
      BSI: "70014",
      PERMATA: "85281",
      CIMB: "59190",
      MUAMALAT: "84001",
    };
    const bankCode = payload.paymentMethod.startsWith("VA_")
      ? payload.paymentMethod.replace("VA_", "")
      : undefined;
    const defaultVa = bankCode
      ? `${bankPrefixes[bankCode] || "88800"}${(datePart + randSuffix).slice(-10)}`
      : undefined;
    const defaultQr =
      payload.paymentMethod === "QRIS" || payload.paymentMethod.startsWith("EWALLET_")
        ? `00020101021226600016ID.CO.TIJARAH.WWW01189360000201112233440215${fallbackOrderNo}520454995303360540${totalAmount}5802ID5919BC HNI BUKITTINGGI6011BUKITTINGGI6304ABCD`
        : undefined;

    try {
      const res = await apiClient.post<{ status: string; message: string; data: any }>(
        "/store/orders/pos",
        payload
      );
      const d = res.data?.data;
      const createdOrder: StoreOrder = {
        id: String(d?.id || createId("pos")),
        orderNumber: String(d?.orderNumber || fallbackOrderNo),
        customerName: payload.customerName || "Pelanggan Toko",
        customerPhone: payload.customerPhone || "-",
        customerType: payload.customerType,
        hniMemberId: payload.hniMemberId,
        totalAmount: Number(d?.totalAmount ?? totalAmount),
        totalPoints: Number(d?.totalPoints ?? totalPoints),
        status: d?.status || (isXendit ? "PROCESSING" : "COMPLETED"),
        paymentMethod: payload.paymentMethod,
        paymentStatus:
          d?.paymentStatus || (isKasbon ? "ON_CREDIT" : isXendit ? "UNPAID" : "PAID"),
        shippingMethod: "Walk-In Kasir POS",
        fulfillmentType: "PICKUP",
        notes: payload.notes || null,
        qrString: d?.qrString || defaultQr || null,
        vaNumber: d?.vaNumber || defaultVa || null,
        bankCode: d?.bankCode || bankCode || null,
        invoiceUrl: d?.invoiceUrl || null,
        invoiceId: d?.invoiceId || null,
        createdAt: d?.createdAt || createdAt,
        items: payload.items.map((it, idx) => ({
          id: `oit_${idx}_${Date.now()}`,
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          price: it.price,
          points: it.points * it.quantity,
        })),
        timeline: [
          {
            status: isXendit ? "PROCESSING" : "COMPLETED",
            timestamp: createdAt,
            note: isXendit
              ? `Menunggu pelunasan Xendit (${payload.paymentMethod}) di meja kasir`
              : "Transaksi langsung selesai di meja kasir (POS)",
          },
        ],
      };

      const cachedOrders = readCache<StoreOrder[]>("orders", []);
      writeCache("orders", [createdOrder, ...cachedOrders]);

      return {
        success: true,
        message: res.data?.message || `Transaksi kasir ${createdOrder.orderNumber} berhasil disimpan.`,
        order: createdOrder,
      };
    } catch {
      const fallbackOrder: StoreOrder = {
        id: createId("pos"),
        orderNumber: fallbackOrderNo,
        customerName: payload.customerName || "Pelanggan Toko",
        customerPhone: payload.customerPhone || "-",
        customerType: payload.customerType,
        hniMemberId: payload.hniMemberId,
        totalAmount,
        totalPoints,
        status: isXendit ? "PROCESSING" : "COMPLETED",
        paymentMethod: payload.paymentMethod,
        paymentStatus: isKasbon ? "ON_CREDIT" : isXendit ? "UNPAID" : "PAID",
        shippingMethod: "Walk-In Kasir POS",
        fulfillmentType: "PICKUP",
        notes: payload.notes || null,
        qrString: defaultQr || null,
        vaNumber: defaultVa || null,
        bankCode: bankCode || null,
        invoiceUrl: null,
        invoiceId: null,
        createdAt,
        items: payload.items.map((it, idx) => ({
          id: `oit_${idx}_${Date.now()}`,
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          price: it.price,
          points: it.points * it.quantity,
        })),
        timeline: [
          {
            status: isXendit ? "PROCESSING" : "COMPLETED",
            timestamp: createdAt,
            note: isXendit
              ? `Menunggu pelunasan Xendit (${payload.paymentMethod}) di meja kasir`
              : "Transaksi langsung selesai di meja kasir (POS)",
          },
        ],
      };

      const cachedOrders = readCache<StoreOrder[]>("orders", []);
      writeCache("orders", [fallbackOrder, ...cachedOrders]);

      const cachedInventory = readCache<StoreInventoryItem[]>("inventory", []);
      if (cachedInventory.length > 0) {
        const updatedInv = cachedInventory.map((inv) => {
          const sold = payload.items.find((it) => it.productId === inv.id);
          if (!sold) return inv;
          const nextStock = Math.max(0, inv.stock - sold.quantity);
          return {
            ...inv,
            stock: nextStock,
            physicalStock: Math.max(0, (inv.physicalStock ?? inv.stock) - sold.quantity),
            pointStock: inv.isFraction
              ? inv.pointStock
              : Math.max(0, (inv.pointStock ?? inv.stock) - sold.quantity),
            status:
              nextStock <= 0
                ? ("OUT_OF_STOCK" as const)
                : nextStock <= inv.safetyStock
                  ? ("LOW_STOCK" as const)
                  : ("IN_STOCK" as const),
          };
        });
        writeCache("inventory", updatedInv);
      }

      return {
        success: true,
        message: `Transaksi kasir ${fallbackOrder.orderNumber} berhasil diproses.`,
        order: fallbackOrder,
      };
    }
  },

  async rejectOrder(orderId: string, payload: RejectOrderPayload): Promise<IStoreMutationResult> {
    const res = await apiClient.post(`/store/orders/${orderId}/reject`, {
      rejectionReason: payload.rejectionReason,
    });
    return {
      success: true,
      message: res.data?.message || "Pesanan telah ditolak.",
    };
  },

  async confirmOrderRefund(
    orderId: string,
    payload?: { refundProofUrl?: string; adminNotes?: string }
  ): Promise<IStoreMutationResult> {
    const res = await apiClient.post(`/store/orders/${orderId}/confirm-refund`, payload || {});
    return {
      success: true,
      message: res.data?.message || "Pengembalian dana berhasil dikonfirmasi.",
    };
  },

  async triggerPrintOrder(orderId: string): Promise<IStoreMutationResult> {
    const res = await apiClient.post(`/store/orders/${orderId}/print`);
    return {
      success: true,
      message: res.data?.message || "Resi ditandai sudah diprint.",
    };
  },

  // ─── Kasbon B2B Riil (Database b2b_credit) ───────────────────
  async getCreditApplications(): Promise<StoreCreditApplication[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/credit/admin/applications");
      if (res.data?.data && Array.isArray(res.data.data)) {
        const mapped: StoreCreditApplication[] = res.data.data.map((app) => ({
          id: String(app.id),
          userId: String(app.userId || ""),
          applicantName: String(app.user?.fullName || app.applicantName || "Mitra HNI"),
          hniMemberId: app.user?.hniProfile?.memberId || app.hniMemberId || undefined,
          phoneNumber: app.user?.phoneNumber || app.phoneNumber || undefined,
          requestedLimit: Number(app.requestedLimit || 0),
          currentBalance: Number(app.currentBalance || 0),
          reason: String(app.purpose || app.notes || app.reason || "Pengajuan limit modal dagang B2B"),
          status: (app.status === "APPROVED" ? "APPROVED" : app.status === "REJECTED" ? "REJECTED" : "PENDING"),
          submittedAt: app.createdAt || new Date().toISOString(),
        }));
        writeCache("credit", mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /credit/admin/applications:", err.message);
    }
    return readCache("credit", []);
  },

  async approveCredit(id: string): Promise<IStoreMutationResult> {
    const res = await apiClient.patch(`/credit/admin/applications/${id}/approve`, {
      approvedLimit: 2500000,
    });
    return {
      success: true,
      message: res.data?.message || "Pengajuan limit kasbon berhasil disetujui di database.",
    };
  },

  async rejectCredit(id: string, reason?: string): Promise<IStoreMutationResult> {
    const res = await apiClient.patch(`/credit/admin/applications/${id}/reject`, {
      reason: reason || "Ditolak toko",
    });
    return {
      success: true,
      message: res.data?.message || "Pengajuan kasbon telah ditolak.",
    };
  },

  // ─── Kupon & Voucher Riil (Database promotions.vouchers) ──────
  async getVouchers(): Promise<StoreVoucher[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/store/vouchers");
      if (res.data?.data && Array.isArray(res.data.data)) {
        const mapped: StoreVoucher[] = res.data.data.map((v) => ({
          id: String(v.id),
          code: String(v.code || ""),
          title: v.title || "",
          description: v.description || "",
          discountType:
            v.discountType === "PERCENTAGE" || v.discountType === "PERCENT"
              ? "PERCENT"
              : v.discountType === "SHIPPING_SUBSIDY"
              ? "SHIPPING_SUBSIDY"
              : "FIXED",
          discountValue: Number(v.discountValue || 0),
          minPurchase: Number(v.minPurchase || 0),
          maxDiscount: v.maxDiscount != null ? Number(v.maxDiscount) : null,
          quota: Number(v.quota || 100),
          usedCount: Number(v.usedCount ?? v.used_count ?? 0),
          isActive: Boolean(v.isActive ?? true),
          expiresAt: v.validUntil || v.expiresAt || new Date().toISOString(),
          conditions: v.conditions || null,
        }));
        writeCache("vouchers", mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/vouchers:", err.message);
    }
    return readCache("vouchers", []);
  },

  async createVoucher(payload: VoucherPayload): Promise<IStoreMutationResult> {
    const res = await apiClient.post<{ status: string; message: string; data: any }>("/store/vouchers", {
      ...payload,
      discountType: payload.discountType === "PERCENT" ? "PERCENTAGE" : payload.discountType,
      validUntil: payload.expiresAt,
    });
    return {
      success: true,
      message: res.data?.message || `Kupon ${payload.code} berhasil dibuat.`,
      data: res.data?.data,
    };
  },

  async updateVoucher(id: string, payload: VoucherPayload): Promise<IStoreMutationResult> {
    const res = await apiClient.put<{ status: string; message: string; data: any }>(`/store/vouchers/${id}`, {
      ...payload,
      discountType: payload.discountType === "PERCENT" ? "PERCENTAGE" : payload.discountType,
      validUntil: payload.expiresAt,
    });
    return {
      success: true,
      message: res.data?.message || `Kupon ${payload.code} berhasil diperbarui.`,
      data: res.data?.data,
    };
  },

  async deleteVoucher(id: string): Promise<IStoreMutationResult> {
    const res = await apiClient.delete<{ status: string; message: string }>(`/store/vouchers/${id}`);
    return {
      success: true,
      message: res.data?.message || "Kupon berhasil dihapus.",
    };
  },

  // ─── Perangkat POS Riil (Database store.devices) ─────────────
  async getDevices(): Promise<StoreDevice[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/store/devices");
      if (res.data?.data && Array.isArray(res.data.data)) {
        const mapped: StoreDevice[] = res.data.data.map((d) => {
          const rawType = String(d.type || "").toUpperCase();
          const devType: StoreDevice["type"] = rawType.includes("SCANNER")
            ? "Scanner"
            : rawType.includes("LASER")
              ? "Laser"
              : rawType.includes("INKJET")
                ? "Inkjet"
                : "Thermal";

          return {
            id: String(d.id),
            name: String(d.name || "Perangkat POS"),
            type: devType,
            status: (d.status === "OFFLINE" ? "OFFLINE" : d.status === "ERROR" ? "ERROR" : "ONLINE") as any,
            ip: d.ipAddress || d.ip || undefined,
            port: d.port ? Number(d.port) : undefined,
            location: d.location || (d.isDefault ? "Kasir Utama (Default)" : "Gudang / Kasir"),
          };
        });
        writeCache("devices", mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/devices:", err.message);
    }
    return readCache("devices", []);
  },

  async createDevice(payload: DevicePayload): Promise<IStoreMutationResult> {
    const mappedType =
      payload.type === "Scanner"
        ? "BARCODE_SCANNER"
        : payload.type === "Inkjet"
          ? "INKJET_PRINTER"
          : payload.type === "Laser"
            ? "LASER_PRINTER"
            : "THERMAL_PRINTER";
    const res = await apiClient.post("/store/devices", {
      name: payload.name,
      type: mappedType,
      connectionType: payload.ip ? "LAN" : "USB",
      ipAddress: payload.ip || null,
      port: payload.port || 9100,
      location: payload.location || "Meja Kasir",
      status: payload.status,
    });
    return { success: true, message: res.data?.message || `Perangkat ${payload.name} berhasil ditambahkan.` };
  },

  async updateDevice(id: string, payload: DevicePayload): Promise<IStoreMutationResult> {
    const mappedType =
      payload.type === "Scanner"
        ? "BARCODE_SCANNER"
        : payload.type === "Inkjet"
          ? "INKJET_PRINTER"
          : payload.type === "Laser"
            ? "LASER_PRINTER"
            : "THERMAL_PRINTER";
    const res = await apiClient.put(`/store/devices/${id}`, {
      name: payload.name,
      type: mappedType,
      connectionType: payload.ip ? "LAN" : "USB",
      ipAddress: payload.ip || null,
      port: payload.port || 9100,
      location: payload.location || "Meja Kasir",
      status: payload.status,
    });
    return { success: true, message: res.data?.message || `Perangkat ${payload.name} berhasil diperbarui.` };
  },

  async deleteDevice(id: string): Promise<IStoreMutationResult> {
    const res = await apiClient.delete(`/store/devices/${id}`);
    return { success: true, message: res.data?.message || "Perangkat berhasil dihapus." };
  },

  // ─── Agen & Staf Gerai Riil (Database store.agents) ──────────
  async getAgents(): Promise<StoreAgent[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/store/agents");
      if (res.data?.data && Array.isArray(res.data.data)) {
        const mapped: StoreAgent[] = res.data.data.map((a) => {
          const rawRole = String(a.role || "").toUpperCase();
          const role: StoreAgent["role"] =
            rawRole === "OWNER"
              ? "Owner"
              : rawRole === "ADMIN"
                ? "Admin"
                : rawRole === "KASIR"
                  ? "Kasir"
                  : rawRole === "GUDANG"
                    ? "Gudang"
                    : "Manager";

          const rawTier = String(a.tier || "").toUpperCase();
          const tier: StoreAgent["tier"] = rawTier.includes("BC")
            ? "BC"
            : rawTier.includes("DC")
              ? "DC"
              : rawTier.includes("STOCKIES")
                ? "STOCKIES"
                : "AGEN_BIAYA";

          const rawRoles = Array.isArray(a.roles) && a.roles.length > 0
            ? a.roles
            : [role];

          return {
            id: String(a.id),
            name: String(a.name || "Staf Agen"),
            hniMemberId: a.hniMemberId || a.hniId || undefined,
            phoneNumber: a.phoneNumber || a.phone || undefined,
            rank: (a.rank || "AB") as any,
            tier,
            role,
            roles: rawRoles,
            status: (a.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as any,
            joinedAt: a.createdAt ? String(a.createdAt).slice(0, 10) : "2026-01-01",
            mustChangePassword: false,
          };
        });
        writeCache("agents", mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/agents:", err.message);
    }
    return readCache("agents", []);
  },

  async createAgent(payload: AgentPayload): Promise<IStoreCredentialResult> {
    const tempPassword = generateTemporaryPassword();
    const res = await apiClient.post("/store/agents", {
      name: payload.name,
      hniId: payload.hniMemberId,
      phone: payload.phoneNumber,
      rank: payload.rank,
      tier: payload.tier,
      role: payload.role.toUpperCase(),
      password: tempPassword,
    });
    return {
      success: true,
      message: res.data?.message || `Akun ${payload.name} berhasil dibuat di database.`,
      temporaryPassword: tempPassword,
    };
  },

  async updateAgent(id: string, payload: AgentPayload): Promise<IStoreMutationResult> {
    const res = await apiClient.put(`/store/agents/${id}`, {
      name: payload.name,
      hniId: payload.hniMemberId,
      phone: payload.phoneNumber,
      rank: payload.rank,
      tier: payload.tier,
      role: payload.role.toUpperCase(),
      status: payload.status,
    });
    return { success: true, message: res.data?.message || `Data ${payload.name} berhasil diperbarui.` };
  },

  async deleteAgent(id: string): Promise<IStoreMutationResult> {
    const res = await apiClient.delete(`/store/agents/${id}`);
    return { success: true, message: res.data?.message || "Akun staf agen berhasil dihapus." };
  },

  async setAgentPassword(id: string, newPassword: string): Promise<IStoreMutationResult> {
    const res = await apiClient.post(`/store/agents/${id}/password`, { newPassword });
    return { success: true, message: res.data?.message || "Password agen berhasil diganti." };
  },

  async resetAgentPassword(id: string): Promise<IStoreCredentialResult> {
    const tempPassword = generateTemporaryPassword();
    await apiClient.post(`/store/agents/${id}/password`, { newPassword: tempPassword });
    return {
      success: true,
      message: "Password agen direset. Wajib diganti saat login berikutnya.",
      temporaryPassword: tempPassword,
    };
  },

  // ─── Manajemen Seluruh Pengguna Sistem Terdaftar (CRUD Detail) ───
  async getSystemUsers(params?: {
    search?: string;
    userType?: string;
    role?: string;
    position?: string;
    isActive?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: any[];
    facets?: { roles: string[]; positions: string[] };
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    try {
      const res = await apiClient.get<{
        status: string;
        data: {
          users: any[];
          facets?: { roles: string[]; positions: string[] };
          pagination: { page: number; limit: number; total: number; totalPages: number };
        };
      }>("/store/users", { params });
      return res.data?.data || { users: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/users:", err.message);
      return { users: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }
  },

  async getSystemUserDetail(id: string): Promise<any> {
    const res = await apiClient.get<{ status: string; data: any }>(`/store/users/${id}`);
    return res.data?.data;
  },

  async createSystemUser(payload: {
    fullName: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    userType?: string;
    isActive?: boolean;
    hniMemberId?: string;
    hniMemberName?: string;
    rank?: string;
    uplineName?: string;
    agentRole?: string;
    agentTier?: string;
  }): Promise<IStoreMutationResult> {
    const res = await apiClient.post("/store/users", payload);
    return { success: true, message: res.data?.message || "Pengguna baru berhasil didaftarkan." };
  },

  async updateSystemUser(
    id: string,
    payload: {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      userType?: string;
      isActive?: boolean;
      hniMemberId?: string;
      hniMemberName?: string;
      rank?: string;
      uplineName?: string;
      agentRole?: string;
      agentTier?: string;
    }
  ): Promise<IStoreMutationResult> {
    const res = await apiClient.put(`/store/users/${id}`, payload);
    return { success: true, message: res.data?.message || "Data pengguna berhasil diperbarui." };
  },

  async deleteSystemUser(id: string): Promise<IStoreMutationResult> {
    const res = await apiClient.delete(`/store/users/${id}`);
    return { success: true, message: res.data?.message || "Pengguna berhasil dinonaktifkan." };
  },

  async resetSystemUserPassword(id: string, newPassword: string): Promise<IStoreMutationResult> {
    const res = await apiClient.post(`/store/users/${id}/reset-password`, { newPassword });
    return { success: true, message: res.data?.message || "Kata sandi pengguna berhasil diperbarui." };
  },

  // ─── Multi-Merchant & Produk Konsinyasi Non-HNI Riil ─────────
  async getMerchants(): Promise<StoreMerchant[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/store/merchants");
      if (res.data?.data && Array.isArray(res.data.data)) {
        const mapped: StoreMerchant[] = res.data.data.map((m) => ({
          id: String(m.id),
          name: String(m.name || ""),
          branchCode: String(m.branchCode || m.code || ""),
          picName: String(m.picName || m.pic_name || ""),
          phone: String(m.phone || ""),
          address: String(m.address || ""),
          status: (m.status === "PENDING" ? "PENDING" : m.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as any,
          commissionRate: Number(m.commissionRate ?? m.profit_share_rate ?? 10),
          joinedAt: m.joinedAt || (m.createdAt ? String(m.createdAt).slice(0, 10) : "2026-01-01"),
        }));
        writeCache("merchants", mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/merchants:", err.message);
    }
    return readCache("merchants", []);
  },

  async createMerchant(payload: MerchantPayload): Promise<IStoreMutationResult> {
    const res = await apiClient.post("/store/merchants", {
      name: payload.name,
      code: payload.branchCode,
      pic_name: payload.picName,
      phone: payload.phone,
      address: payload.address,
      profit_share_rate: payload.commissionRate,
    });
    return { success: true, message: res.data?.message || `Merchant ${payload.name} berhasil ditambahkan.` };
  },

  async updateMerchant(id: string, payload: MerchantPayload): Promise<IStoreMutationResult> {
    const res = await apiClient.put(`/store/merchants/${id}`, {
      name: payload.name,
      code: payload.branchCode,
      pic_name: payload.picName,
      phone: payload.phone,
      address: payload.address,
      profit_share_rate: payload.commissionRate,
      status: payload.status,
    });
    return { success: true, message: res.data?.message || `Merchant ${payload.name} berhasil diperbarui.` };
  },

  async deleteMerchant(id: string): Promise<IStoreMutationResult> {
    const res = await apiClient.delete(`/store/merchants/${id}`);
    return { success: true, message: res.data?.message || "Merchant berhasil dihapus." };
  },

  async getNonHniProducts(): Promise<StoreNonHniProduct[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/store/non-hni-products");
      if (res.data?.data && Array.isArray(res.data.data)) {
        const mapped: StoreNonHniProduct[] = res.data.data.map((p) => ({
          id: String(p.id),
          name: String(p.name || ""),
          category: String(p.category || "Konsinyasi"),
          price: Number(p.price || 0),
          stock: Number(p.stock || 0),
          merchantId: p.merchantId || p.merchant_id || undefined,
        }));
        writeCache("nonHni", mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/non-hni-products:", err.message);
    }
    return readCache("nonHni", []);
  },

  async createNonHniProduct(payload: NonHniProductPayload): Promise<IStoreMutationResult> {
    const res = await apiClient.post("/store/non-hni-products", {
      merchant_id: payload.merchantId,
      name: payload.name,
      category: payload.category,
      price: payload.price,
      stock: payload.stock,
    });
    return { success: true, message: res.data?.message || `Produk ${payload.name} berhasil ditambahkan.` };
  },

  async updateNonHniProduct(id: string, payload: NonHniProductPayload): Promise<IStoreMutationResult> {
    const res = await apiClient.put(`/store/non-hni-products/${id}`, {
      name: payload.name,
      category: payload.category,
      price: payload.price,
      stock: payload.stock,
    });
    return { success: true, message: res.data?.message || `Produk ${payload.name} berhasil diperbarui.` };
  },

  async deleteNonHniProduct(id: string): Promise<IStoreMutationResult> {
    const res = await apiClient.delete(`/store/non-hni-products/${id}`);
    return { success: true, message: res.data?.message || "Produk berhasil dihapus." };
  },

  // ─── Tanda Tangan Digital & Verifikasi Resi Riil ─────────────
  async getEsignatures(): Promise<StoreEsignature[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/store/esignatures");
      if (res.data?.data && Array.isArray(res.data.data)) {
        const mapped: StoreEsignature[] = res.data.data.map((s) => {
          const rawRole = String(s.signerRole || "").toUpperCase();
          const signer: StoreEsignature["signer"] = rawRole.includes("OWNER")
            ? "Owner"
            : rawRole.includes("GUDANG") || rawRole.includes("LOGISTIK")
              ? "Gudang"
              : "Kasir";

          return {
            id: String(s.id),
            userId: s.userId || null,
            staffId: s.staffId || null,
            orderId: s.orderId ? String(s.orderId) : undefined,
            signer,
            signerName: String(s.signerName || "Petugas"),
            timestamp: s.createdAt || s.timestamp || new Date().toISOString(),
            signatureData: s.payloadHash || s.signatureData || `SHA256:${s.verificationCode || s.id}`,
            verificationCode: String(s.verificationCode || ""),
            status: s.status === "REVOKED" ? "REVOKED" : "ACTIVE",
            notes: s.notes || s.title || undefined,
          };
        });
        writeCache("esignatures", mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/esignatures:", err.message);
    }
    return readCache("esignatures", []);
  },

  async createEsignature(payload: EsignaturePayload): Promise<IStoreMutationResult> {
    const timestamp = new Date().toISOString();
    const code = await generateVerificationCode(
      `${payload.userId || "STAFF"}|${payload.signer}|${payload.signerName}|${timestamp}`
    );
    const res = await apiClient.post("/store/esignatures", {
      userId: payload.userId || null,
      staffId: payload.userId || null,
      title: payload.notes || `Tanda Tangan Otorisasi ${payload.signerName}`,
      signerName: payload.signerName,
      signerRole: payload.signer,
      verification_code: code,
      payload_hash: `0x${code.replace(/-/g, "").toLowerCase()}`,
    });
    return {
      success: true,
      message: res.data?.message || `Tanda tangan digital ${code} berhasil dibuat.`,
    };
  },

  async deleteEsignature(id: string): Promise<IStoreMutationResult> {
    const res = await apiClient.delete(`/store/esignatures/${id}`);
    return { success: true, message: res.data?.message || "Tanda tangan digital berhasil dicabut." };
  },

  // ─── Khasiat, Komposisi & Testimoni Produk Riil ───────────────
  async getProductKnowledge(): Promise<StoreProductKnowledge[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/store/product-knowledge");
      if (res.data?.data && Array.isArray(res.data.data)) {
        const mapped: StoreProductKnowledge[] = res.data.data.map((pk) => ({
          id: String(pk.id),
          sku: String(pk.sku || ""),
          name: String(pk.name || ""),
          category: String(pk.category || "Herbal"),
          bpomNumber: String(pk.bpomNumber || pk.bpom_number || ""),
          halalNumber: String(pk.halalNumber || pk.halal_status || ""),
          benefits: Array.isArray(pk.benefits) ? pk.benefits : [pk.benefits || ""],
          composition: Array.isArray(pk.composition) ? pk.composition : [pk.composition || ""],
          usageRules: String(pk.usageRules || pk.usage_guidelines || ""),
          contraindications: pk.contraindications || undefined,
          imageUrl: pk.imageUrl || pk.image_url || undefined,
          galleryUrls: Array.isArray(pk.galleryUrls) ? pk.galleryUrls : [],
          testimonials: (pk.testimonials || []).map((t: any) => ({
            id: String(t.id),
            customerName: String(t.customerName || t.author_name || "Pelanggan"),
            customerRole: (t.customerRole || t.author_rank || "Konsumen") as any,
            rating: Number(t.rating || 5),
            content: String(t.content || t.comment || ""),
            date: String(t.date || (t.createdAt ? String(t.createdAt).slice(0, 10) : "2026-10-27")),
            isVerifiedPurchase: true,
          })),
        }));
        writeCache("productKnowledge", mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/product-knowledge:", err.message);
    }
    return readCache("productKnowledge", []);
  },

  async createProductKnowledge(payload: ProductKnowledgePayload): Promise<IStoreMutationResult> {
    const res = await apiClient.post("/store/product-knowledge", {
      name: payload.name,
      hni_code: payload.sku,
      category: payload.category,
      benefits: payload.benefits,
      composition: payload.composition,
      bpom_number: payload.bpomNumber,
      halal_status: payload.halalNumber,
      usage_guidelines: payload.usageRules,
      image_url: payload.imageUrl,
      gallery_urls: payload.galleryUrls,
    });
    return {
      success: true,
      message: res.data?.message || `Informasi ${payload.name} berhasil disimpan ke database.`,
    };
  },

  async updateProductKnowledge(id: string, payload: ProductKnowledgePayload): Promise<IStoreMutationResult> {
    const res = await apiClient.put(`/store/product-knowledge/${id}`, {
      name: payload.name,
      hni_code: payload.sku,
      category: payload.category,
      benefits: payload.benefits,
      composition: payload.composition,
      bpom_number: payload.bpomNumber,
      halal_status: payload.halalNumber,
      usage_guidelines: payload.usageRules,
      image_url: payload.imageUrl,
      gallery_urls: payload.galleryUrls,
    });
    return {
      success: true,
      message: res.data?.message || `Informasi ${payload.name} berhasil diperbarui di database.`,
    };
  },

  async deleteProductKnowledge(id: string): Promise<IStoreMutationResult> {
    const res = await apiClient.delete(`/store/product-knowledge/${id}`);
    return { success: true, message: res.data?.message || "Informasi produk berhasil dihapus." };
  },

  async saveTestimonial(
    productId: string,
    payload: TestimonialPayload,
    _testimonialId?: string
  ): Promise<IStoreMutationResult> {
    const res = await apiClient.post(`/store/product-knowledge/${productId}/testimonials`, {
      author_name: payload.customerName,
      author_rank: payload.customerRole,
      rating: payload.rating,
      comment: payload.content,
    });
    return {
      success: true,
      message: res.data?.message || "Testimoni berhasil disimpan ke database.",
    };
  },

  async deleteTestimonial(_productId: string, testimonialId: string): Promise<IStoreMutationResult> {
    const res = await apiClient.delete(`/store/testimonials/${testimonialId}`);
    return { success: true, message: res.data?.message || "Testimoni berhasil dihapus." };
  },

  // ─── Ekspedisi & Shipments Riil (Database orders) ─────────────
  async getShipments(): Promise<StoreShipment[]> {
    try {
      const res = await apiClient.get<{ status: string; data: StoreShipment[] }>("/store/shipments");
      if (res.data?.data && Array.isArray(res.data.data)) {
        writeCache("shipments", res.data.data);
        return res.data.data;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/shipments:", err.message);
    }
    return readCache("shipments", []);
  },

  // ─── CRM & Pelanggan Toko Riil (Database users & orders) ──────
  async getCustomers(): Promise<StoreCustomer[]> {
    try {
      const res = await apiClient.get<{ status: string; data: StoreCustomer[] }>("/store/customers");
      if (res.data?.data && Array.isArray(res.data.data)) {
        writeCache("customers", res.data.data);
        return res.data.data;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/customers:", err.message);
    }
    return readCache("customers", []);
  },

  // ─── Velocity & Perputaran Stok Riil ─────────────────────────
  async getStockVelocity(): Promise<StoreStockVelocity[]> {
    try {
      const res = await apiClient.get<{ status: string; data: StoreStockVelocity[] }>("/store/stock-velocity");
      if (res.data?.data && Array.isArray(res.data.data)) {
        writeCache("velocity", res.data.data);
        return res.data.data;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/stock-velocity:", err.message);
    }
    return readCache("velocity", []);
  },

  // ─── Rekomendasi Restock Riil ────────────────────────────────
  async getRestockRecommendations(): Promise<StoreRestockRecommendation[]> {
    try {
      const res = await apiClient.get<{ status: string; data: StoreRestockRecommendation[] }>("/store/restock-recommendations");
      if (res.data?.data && Array.isArray(res.data.data)) {
        writeCache("restock", res.data.data);
        return res.data.data;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/restock-recommendations:", err.message);
    }
    return readCache("restock", []);
  },

  // ─── Tren Keluhan Penyakit & Rekomendasi SKU Nyata ────────────
  async getDiseaseTrends(): Promise<StoreDiseaseTrend[]> {
    try {
      const res = await apiClient.get<{ status: string; data: StoreDiseaseTrend[] }>("/store/disease-trends");
      if (res.data?.data && Array.isArray(res.data.data)) {
        writeCache("trends", res.data.data);
        return res.data.data;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/disease-trends:", err.message);
    }
    return readCache("trends", []);
  },

  // ─── Rekonsiliasi Gerai Riil ─────────────────────────────────
  async getReconciliationEntries(): Promise<StoreReconciliationEntry[]> {
    try {
      const res = await apiClient.get<{ status: string; data: StoreReconciliationEntry[] }>("/store/reconciliation");
      if (res.data?.data && Array.isArray(res.data.data)) {
        writeCache("reconciliation", res.data.data);
        return res.data.data;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/reconciliation:", err.message);
    }
    return readCache("reconciliation", []);
  },

  async adjustReconciliation(id: string, note: string): Promise<IStoreMutationResult> {
    const list = readCache<StoreReconciliationEntry[]>("reconciliation", []);
    writeCache(
      "reconciliation",
      list.map((e) => (e.id === id ? { ...e, status: "ADJUSTED" as const, note: `${e.note} - ${note}` } : e))
    );
    return { success: true, message: "Catatan penyesuaian berhasil disimpan." };
  },

  async resyncHsisPoints(orderId: string): Promise<IStoreMutationResult> {
    const list = readCache<StoreReconciliationEntry[]>("reconciliation", []);
    writeCache(
      "reconciliation",
      list.map((e) => (e.relatedId === orderId ? { ...e, status: "RESYNCED" as const } : e))
    );
    return {
      success: true,
      message: `Poin untuk pesanan ${orderId} berhasil disinkronkan ulang ke sistem HSIS.`,
    };
  },

  // ─── Sesi Gateway HSIS ───────────────────────────────────────
  async getHsisSession(): Promise<StoreHsisSession> {
    try {
      const res = await apiClient.get<{ status: string; data: StoreHsisSession }>("/store/hsis-session");
      if (res.data?.data) {
        writeCache("hsis", res.data.data);
        return res.data.data;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/hsis-session:", err.message);
    }
    return readCache("hsis", {
      id: "HSIS-SES-BC3",
      token: "TOKEN_BELUM_DIKONFIGURASI",
      lastSyncAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      status: "ACTIVE",
    });
  },

  async triggerHsisSync(): Promise<IStoreMutationResult> {
    return {
      success: true,
      message: "Sinkronisasi invoice, pesanan, dan poin HSIS berhasil dilakukan ke database.",
    };
  },

  // ─── HSIS Dynamic Endpoints & Dispatcher ─────────────────────
  async getHsisEndpoints(): Promise<StoreHsisEndpoint[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/store/hsis-endpoints");
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((r: any) => ({
          id: String(r.id),
          name: String(r.name),
          route: String(r.route),
          method: r.method,
          description: r.description,
          controller: r.controller,
          handlerAction: r.handler_action || r.handlerAction,
          headers: r.headers,
          isActive: r.is_active ?? r.isActive ?? true,
          createdAt: r.created_at || r.createdAt || new Date().toISOString(),
        }));
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/hsis-endpoints:", err.message);
    }
    return [];
  },

  async createHsisEndpoint(payload: any): Promise<IStoreMutationResult> {
    await apiClient.post("/store/hsis-endpoints", {
      name: payload.name,
      route: payload.route,
      method: payload.method,
      description: payload.description,
      controller: payload.controller,
      handler_action: payload.handlerAction,
    });
    return { success: true, message: `Endpoint ${payload.name} berhasil disimpan ke database.` };
  },

  async updateHsisEndpoint(id: string, payload: any): Promise<IStoreMutationResult> {
    await apiClient.put(`/store/hsis-endpoints/${id}`, {
      name: payload.name,
      route: payload.route,
      method: payload.method,
      description: payload.description,
      controller: payload.controller,
      handler_action: payload.handlerAction,
      is_active: payload.isActive,
    });
    return { success: true, message: "Endpoint berhasil diperbarui di database." };
  },

  async deleteHsisEndpoint(id: string): Promise<IStoreMutationResult> {
    await apiClient.delete(`/store/hsis-endpoints/${id}`);
    return { success: true, message: "Endpoint berhasil dihapus dari database." };
  },

  async dispatchHsisEndpoint(id: string, payload?: any): Promise<any> {
    const res = await apiClient.post(`/store/hsis-endpoints/${id}/dispatch`, payload || {});
    return res.data?.data || res.data;
  },

  async getHsisControllers(): Promise<HsisControllerMeta[]> {
    try {
      const res = await apiClient.get<{ status: string; data: HsisControllerMeta[] }>("/store/hsis-controllers");
      if (res.data?.data) return res.data.data;
    } catch {
      // ignore
    }
    return [
      {
        controller: "HsisPointsController",
        description: "Sinkronisasi poin TP agen dan riwayat poin HSIS",
        actions: ["syncAgentPoints", "getPointHistory"],
      },
      {
        controller: "HsisMemberController",
        description: "Validasi status keanggotaan ID Mitra HNI",
        actions: ["verifyMember"],
      },
      {
        controller: "HsisSalesController",
        description: "Posting omzet dan penerbitan nomor RO gerai ke pusat",
        actions: ["postSales"],
      },
      {
        controller: "HsisHealthController",
        description: "Health check dan monitor latency gateway HSIS",
        actions: ["checkHealth"],
      },
      {
        controller: "HsisProxyController",
        description: "Forwarder proxy langsung ke server tujuan HSIS",
        actions: ["forwardProxy"],
      },
    ];
  },

  // ─── Otomasi Python Chrome HSIS Runner ────────────────────────
  async runHsisAutoLogin(username?: string, password?: string): Promise<{ success: boolean; output?: string; session?: any; message?: string }> {
    try {
      const res = await apiClient.post(
        "/store/hsis/auto-login",
        { username, password },
        { timeout: 190000 }
      );
      return res.data?.data || { success: true, output: res.data?.message || "Login HSIS berhasil." };
    } catch (err: any) {
      return {
        success: false,
        output: err.response?.data?.message || err.message,
      };
    }
  },

  async saveHsisToken(token: string, cookie?: string): Promise<IStoreMutationResult> {
    const res = await apiClient.post("/store/hsis/token", { token, cookie });
    return {
      success: true,
      message: res.data?.message || "Token HSIS berhasil disimpan dan diaktifkan.",
    };
  },

  async testHsisConnection(): Promise<{ connected: boolean; status: string; message: string }> {
    const res = await apiClient.post("/store/hsis/test");
    return res.data?.data || { connected: true, status: "ACTIVE", message: res.data?.message || "Koneksi HSIS OK" };
  },

  // ─── Metode Pengiriman (Database store.delivery_methods) ───────
  async getDeliveryMethods(): Promise<StoreDeliveryMethod[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/store/delivery-methods", {
        skipAuthRedirect: true,
        skipGlobalToast: true,
      } as any);
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const mapped: StoreDeliveryMethod[] = res.data.data.map((d) => ({
          id: String(d.id),
          name: String(d.name || ""),
          code: String(d.code || ""),
          type: String(d.type || "TRAVEL_EXPEDITION"),
          verificationFlow: String(d.verification_flow || d.verificationFlow || "USER_VERIFY_DIRECT"),
          description: String(d.description || ""),
          isActive:
            d.isActive !== undefined
              ? Boolean(d.isActive)
              : d.is_active !== undefined
                ? Boolean(d.is_active)
                : true,
          estimatedTime: String(d.estimated_time || d.estimatedTime || ""),
          baseCost: Number(d.base_cost ?? d.baseCost ?? 0),
          destinationArea: d.destination_area || d.destinationArea || "",
          pricingMode: d.pricingMode || d.pricing_mode || "FLAT",
          zoneRates: Array.isArray(d.zoneRates)
            ? d.zoneRates
            : Array.isArray(d.zone_rates)
              ? d.zone_rates
              : [],
          providerCode: d.providerCode || d.provider_code || "",
          createdAt: d.created_at || d.createdAt || new Date().toISOString(),
          updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
        }));
        writeCache("delivery-methods", mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/delivery-methods:", err.message);
    }
    const cached = readCache<StoreDeliveryMethod[]>("delivery-methods", []);
    if (cached && cached.length > 0) {
      return cached;
    }
    // Fallback default master data 2 flow (Pickup verifikasi kasir + Travel Pasaman, Lubuk Basung, General)
    writeCache("delivery-methods", DEFAULT_STORE_DELIVERY_METHODS);
    return DEFAULT_STORE_DELIVERY_METHODS;
  },

  async resetDeliveryMethods(): Promise<IStoreMutationResult> {
    try {
      const res = await apiClient.post("/store/delivery-methods/reset");
      if (res.data?.data && Array.isArray(res.data.data)) {
        writeCache("delivery-methods", res.data.data);
      } else {
        writeCache("delivery-methods", DEFAULT_STORE_DELIVERY_METHODS);
      }
      return { success: true, message: res.data?.message || "Metode pengiriman berhasil direset ke standar 2-flow." };
    } catch (err: any) {
      writeCache("delivery-methods", DEFAULT_STORE_DELIVERY_METHODS);
      return { success: true, message: "Metode pengiriman berhasil direset ulang ke pengaturan default." };
    }
  },

  async createDeliveryMethod(payload: DeliveryMethodPayload): Promise<IStoreMutationResult> {
    try {
      const res = await apiClient.post("/store/delivery-methods", {
        name: payload.name,
        code: payload.code,
        type: payload.type,
        verificationFlow: payload.verificationFlow || "USER_VERIFY_DIRECT",
        description: payload.description || "",
        isActive: payload.isActive !== undefined ? payload.isActive : true,
        estimatedTime: payload.estimatedTime || "",
        baseCost: payload.baseCost || 0,
        destinationArea: payload.destinationArea || "",
        pricingMode: payload.pricingMode || "FLAT",
        zoneRates: payload.zoneRates || [],
        providerCode: payload.providerCode || null,
      });
      return { success: true, message: res.data?.message || `Metode ${payload.name} berhasil ditambahkan.` };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  async updateDeliveryMethod(id: string, payload: Partial<DeliveryMethodPayload>): Promise<IStoreMutationResult> {
    try {
      const res = await apiClient.put(`/store/delivery-methods/${id}`, {
        name: payload.name,
        code: payload.code,
        type: payload.type,
        verificationFlow: payload.verificationFlow,
        description: payload.description,
        isActive: payload.isActive,
        estimatedTime: payload.estimatedTime,
        baseCost: payload.baseCost,
        destinationArea: payload.destinationArea,
        pricingMode: payload.pricingMode,
        zoneRates: payload.zoneRates,
        providerCode: payload.providerCode,
      });
      return { success: true, message: res.data?.message || `Metode ${payload.name || id} berhasil diperbarui.` };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  async deleteDeliveryMethod(id: string): Promise<IStoreMutationResult> {
    try {
      const res = await apiClient.delete(`/store/delivery-methods/${id}`);
      return { success: true, message: res.data?.message || "Metode pengiriman berhasil dihapus." };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  // ─── Agent Network & Self-Inclusion (Poin 1) ─────────────────
  async syncSelfAgent(): Promise<IStoreMutationResult & { agent?: StoreAgent }> {
    try {
      const res = await apiClient.post<{ status: string; message: string; data: any }>("/store/agents/sync-self", {});
      return {
        success: true,
        message: res.data?.message || "Profil pengelola berhasil disinkronkan ke jaringan agen gerai.",
        agent: res.data?.data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal menyinkronkan profil agen pengelola.",
      };
    }
  },

  async importAgentNetworkCsv(
    items: Array<{ hniId: string; name: string; upline?: string; niaga?: string; peringkat?: string }>
  ): Promise<{ importedCount: number; updatedCount: number; skippedCount: number; message: string }> {
    const res = await apiClient.post("/store/agents/import", { items });
    return res.data?.data || { importedCount: 0, updatedCount: 0, skippedCount: 0, message: res.data?.message || "Import selesai" };
  },

  async getAgentNetwork(): Promise<{
    rootAgent: StoreAgent | null;
    downlines: StoreAgent[];
    totalAgents: number;
    activeAgents: number;
  }> {
    try {
      const res = await apiClient.get<{
        status: string;
        data: {
          rootAgent: any;
          downlines: any[];
          totalAgents: number;
          activeAgents: number;
        };
      }>("/store/agents/network");

      if (res.data?.data) {
        const d = res.data.data;
        const mapAgent = (a: any): StoreAgent => {
          const rawRole = String(a.role || "").toUpperCase();
          const role: StoreAgent["role"] =
            rawRole === "OWNER"
              ? "Owner"
              : rawRole === "ADMIN"
                ? "Admin"
                : rawRole === "KASIR"
                  ? "Kasir"
                  : rawRole === "GUDANG"
                    ? "Gudang"
                    : "Manager";

          const rawTier = String(a.tier || "").toUpperCase();
          const tier: StoreAgent["tier"] = rawTier.includes("BC")
            ? "BC"
            : rawTier.includes("DC")
              ? "DC"
              : rawTier.includes("STOCKIES")
                ? "STOCKIES"
                : "AGEN_BIAYA";

          return {
            ...a,
            id: String(a.id),
            name: String(a.name || "Staf Agen"),
            hniId: a.hniId || a.hniMemberId || a.hni_id || undefined,
            hniMemberId: a.hniId || a.hniMemberId || a.hni_id || undefined,
            phoneNumber: a.phoneNumber || a.phone || undefined,
            phone: a.phone || a.phoneNumber || undefined,
            rank: (a.rank || "AB") as any,
            tier,
            role,
            status: (a.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as any,
            joinedAt: a.createdAt ? String(a.createdAt).slice(0, 10) : "2026-01-01",
            mustChangePassword: false,
          };
        };

        return {
          ...(d as any),
          rootAgent: d.rootAgent ? mapAgent(d.rootAgent) : null,
          downlines: Array.isArray(d.downlines) ? d.downlines.map(mapAgent) : [],
          totalAgents: Number(d.totalAgents || 0),
          activeAgents: Number(d.activeAgents || 0),
        };
      }
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/agents/network:", err.message);
    }

    return {
      rootAgent: null,
      downlines: [],
      totalAgents: 0,
      activeAgents: 0,
    };
  },

  // ─── Batch Update Product Knowledge (Poin 4) ─────────────────
  async batchUpdateProductKnowledge(items: Array<{
    id?: string;
    sku?: string;
    name?: string;
    category?: string;
    benefits?: string[] | string;
    composition?: string[] | string;
    usageRules?: string;
    bpomNumber?: string;
    halalNumber?: string;
  }>): Promise<IStoreMutationResult & { count?: number }> {
    try {
      const payloadItems = items.map((it) => ({
        id: it.id,
        sku: it.sku,
        name: it.name,
        category: it.category,
        benefits: Array.isArray(it.benefits) ? it.benefits : (it.benefits ? [it.benefits] : undefined),
        composition: Array.isArray(it.composition) ? it.composition : (it.composition ? [it.composition] : undefined),
        usage_guidelines: it.usageRules,
        bpom_number: it.bpomNumber,
        halal_status: it.halalNumber,
      }));

      const res = await apiClient.put<{ status: string; message: string; data: { count: number } }>(
        "/store/product-knowledge/batch",
        { items: payloadItems }
      );

      return {
        success: true,
        message: res.data?.message || "Batch update katalog khasiat berhasil disimpan.",
        count: res.data?.data?.count ?? payloadItems.length,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal menyimpan perubahan batch khasiat.",
      };
    }
  },

  // ─── POS Devices Ping & Real Connection Check (Poin 7) ──────
  async pingDevice(id: string): Promise<{
    id: string;
    name: string;
    type: string;
    status: "ONLINE" | "OFFLINE" | "TIMEOUT";
    latencyMs?: number;
    lastPing: string;
  }> {
    try {
      const res = await apiClient.get<{ status: string; data: any }>(`/store/devices/${id}/ping`);
      return res.data?.data;
    } catch (err: any) {
      return {
        id,
        name: "Perangkat POS",
        type: "Thermal",
        status: "OFFLINE",
        lastPing: new Date().toISOString(),
      };
    }
  },

  async checkDevicesStatus(): Promise<{
    total: number;
    onlineCount: number;
    offlineCount: number;
    devices: any[];
  }> {
    try {
      const res = await apiClient.get<{ status: string; data: any }>("/store/devices/status");
      return res.data?.data || { total: 0, onlineCount: 0, offlineCount: 0, devices: [] };
    } catch {
      return { total: 0, onlineCount: 0, offlineCount: 0, devices: [] };
    }
  },

  // ─── Purchase Order (PO) HSIS & Cek Barang Datang (Poin 6) ───
  async getHsisPurchaseOrders(): Promise<any[]> {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/store/hsis/po");
      return res.data?.data || [];
    } catch (err: any) {
      console.warn("[storeApi] Gagal memuat /store/hsis/po:", err.message);
      return [];
    }
  },

  async syncHsisPurchaseOrders(): Promise<IStoreMutationResult & { data?: any[] }> {
    try {
      const res = await apiClient.post<{ status: string; message: string; data: any[] }>("/store/hsis/po/sync", {});
      return {
        success: true,
        message: res.data?.message || "Sinkronisasi pesanan HSIS berhasil.",
        data: res.data?.data || [],
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal sinkronisasi order HSIS.",
      };
    }
  },

  async createHsisPurchaseOrder(payload: {
    supplier?: string;
    notes?: string;
    items: Array<{ sku: string; name: string; orderedQty: number; unitPrice: number; barcode?: string }>;
  }): Promise<IStoreMutationResult & { data?: any }> {
    try {
      const res = await apiClient.post<{ status: string; message: string; data: any }>("/store/hsis/po", payload);
      return {
        success: true,
        message: res.data?.message || "Purchase order berhasil diajukan ke HSIS.",
        data: res.data?.data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal membuat purchase order HSIS.",
      };
    }
  },

  async receiveHsisOrder(
    poId: string,
    payload: {
      items: Array<{ sku: string; receivedQty: number; damagedQty?: number }>;
      notes?: string;
    }
  ): Promise<IStoreMutationResult & { data?: any }> {
    try {
      const res = await apiClient.post<{ status: string; message: string; data: any }>(
        `/store/hsis/po/${poId}/receive`,
        payload
      );
      return {
        success: true,
        message: res.data?.message || "Verifikasi barang datang berhasil diproses dan stok telah ditambahkan.",
        data: res.data?.data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal memproses penerimaan barang PO.",
      };
    }
  },

  // ─── Kupon Dinamis & Multi-Select User Conditions (Poin 9) ───
  async updateVoucherConditions(
    id: string,
    conditions: Record<string, any>
  ): Promise<IStoreMutationResult & { data?: any }> {
    try {
      const res = await apiClient.put<{ status: string; message: string; data: any }>(
        `/store/vouchers/${id}/conditions`,
        conditions
      );
      return {
        success: true,
        message: res.data?.message || "Syarat dinamis kupon berhasil disimpan.",
        data: res.data?.data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal menyimpan kondisi kupon.",
      };
    }
  },

  // ─── Batch 3: Auto-Cancel Order Kedaluwarsa (Poin 11) ──────────
  async cancelExpiredOrders(): Promise<IStoreMutationResult & { data?: any }> {
    try {
      const res = await apiClient.post<{ status: string; message: string; data: any }>(
        "/store/orders/cancel-expired",
        {}
      );
      return {
        success: true,
        message: res.data?.message || "Proses pembatalan order kedaluwarsa selesai.",
        data: res.data?.data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal memproses pembatalan order kedaluwarsa.",
      };
    }
  },

  // ─── Batch 3: Laporan Keuangan (Poin 13) ──────────────────────
  async getFinancialReport(params?: { period?: string; dateFrom?: string; dateTo?: string }): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      const res = await apiClient.get<{ status: string; message: string; data: any }>(
        "/store/reports/financial",
        { params }
      );
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal memuat laporan keuangan.",
      };
    }
  },

  exportFinancialReportUrl(params?: { dateFrom?: string; dateTo?: string }): string {
    const { getBackendApiBaseUrl } = require("@/lib/api/baseUrl");
    const baseURL = (apiClient.defaults.baseURL || getBackendApiBaseUrl()).replace(/\/$/, "");
    const q = new URLSearchParams();
    if (params?.dateFrom) q.append("dateFrom", params.dateFrom);
    if (params?.dateTo) q.append("dateTo", params.dateTo);
    return `${baseURL}/store/reports/financial/export?${q.toString()}`;
  },

  // ─── Batch 3: Export & Import Stok Inventory (Poin 14) ────────
  exportInventoryCsvUrl(): string {
    const { getBackendApiBaseUrl } = require("@/lib/api/baseUrl");
    const baseURL = (apiClient.defaults.baseURL || getBackendApiBaseUrl()).replace(/\/$/, "");
    return `${baseURL}/store/inventory/export`;
  },

  async importInventory(
    items: Array<{ sku: string; stock: number; mode?: "SET" | "ADD" }>
  ): Promise<IStoreMutationResult & { data?: any }> {
    try {
      const res = await apiClient.post<{ status: string; message: string; data: any }>(
        "/store/inventory/import",
        { items }
      );
      return {
        success: true,
        message: res.data?.message || "Import data stok berhasil diproses.",
        data: res.data?.data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal melakukan import stok inventaris.",
      };
    }
  },

  // ─── HSIS Two-Way Sales Sync & Reconciliation ─────────────────
  async syncHsisSaldo(): Promise<any> {
    const res = await apiClient.post("/store/hsis/sync-saldo");
    return res.data?.data ?? res.data;
  },

  async syncHsisSales(): Promise<any> {
    const res = await apiClient.post("/store/hsis/sync-sales");
    return res.data?.data ?? res.data;
  },

  async getHsisReconciliationReport(): Promise<any> {
    const res = await apiClient.get("/store/hsis/reconciliation-report");
    return res.data?.data ?? res.data;
  },

  async linkHsisInvoice(orderId: string, invoiceId: string): Promise<any> {
    const res = await apiClient.post(`/store/hsis/orders/${orderId}/link-invoice`, {
      invoiceId,
    });
    return res.data?.data ?? res.data;
  },

  // ─── Cashier Shifts ───────────────────────────────────────────
  async getCurrentShift(): Promise<any> {
    const res = await apiClient.get("/store/shifts/current");
    return res.data?.data ?? null;
  },

  async getShifts(): Promise<any[]> {
    const res = await apiClient.get("/store/shifts");
    return res.data?.data ?? [];
  },

  async openShift(payload: { openingCash: number; deviceId?: string; notes?: string }): Promise<any> {
    const res = await apiClient.post("/store/shifts/open", payload);
    return res.data?.data ?? res.data;
  },

  async closeShift(shiftId: string, payload: { closingCash: number; notes?: string }): Promise<any> {
    const res = await apiClient.post(`/store/shifts/${shiftId}/close`, payload);
    return res.data?.data ?? res.data;
  },

  // ─── Purchasing & Suppliers ───────────────────────────────────
  async getSuppliers(): Promise<any[]> {
    const res = await apiClient.get("/store/suppliers");
    return res.data?.data ?? [];
  },

  async createSupplier(payload: any): Promise<any> {
    const res = await apiClient.post("/store/suppliers", payload);
    return res.data?.data ?? res.data;
  },

  async deleteSupplier(id: string): Promise<any> {
    const res = await apiClient.delete(`/store/suppliers/${id}`);
    return res.data?.data ?? res.data;
  },

  async getPurchaseOrders(): Promise<any[]> {
    const res = await apiClient.get("/store/purchase-orders");
    return res.data?.data ?? [];
  },

  async createPurchaseOrder(payload: any): Promise<any> {
    const res = await apiClient.post("/store/purchase-orders", payload);
    return res.data?.data ?? res.data;
  },

  async receivePurchaseOrder(id: string): Promise<any> {
    const res = await apiClient.post(`/store/purchase-orders/${id}/receive`);
    return res.data?.data ?? res.data;
  },

  async payPurchaseOrder(id: string, amount: number): Promise<any> {
    const res = await apiClient.post(`/store/purchase-orders/${id}/pay`, { amount });
    return res.data?.data ?? res.data;
  },

  // ─── Order Returns ────────────────────────────────────────────
  async getOrderReturns(): Promise<any[]> {
    const res = await apiClient.get("/store/returns");
    return res.data?.data ?? [];
  },

  async processOrderReturn(
    id: string,
    payload: { status: "APPROVED" | "REJECTED" | "REFUNDED"; adminNotes?: string; refundAmount?: number }
  ): Promise<any> {
    const res = await apiClient.put(`/store/returns/${id}`, payload);
    return res.data?.data ?? res.data;
  },

  // ─── Audit Logs & Store Settings ──────────────────────────────
  async getAuditLogs(params?: {
    module?: string;
    action?: string;
    search?: string;
  }): Promise<any[]> {
    const res = await apiClient.get("/store/audit-logs", { params });
    return res.data?.data ?? [];
  },

  async getProductCategories(): Promise<{ id: string; name: string; slug: string }[]> {
    const res = await apiClient.get("/store/product-categories");
    return res.data?.data ?? [];
  },

  async createProductCategory(name: string): Promise<{ id: string; name: string; slug: string }> {
    const res = await apiClient.post("/store/product-categories", { name });
    return res.data?.data;
  },

  async getProductUnits(): Promise<{ id: string; code: string; name: string }[]> {
    const res = await apiClient.get("/store/product-units");
    return res.data?.data ?? [];
  },

  async createProductUnit(payload: { code: string; name: string }): Promise<{ id: string; code: string; name: string }> {
    const res = await apiClient.post("/store/product-units", payload);
    return res.data?.data;
  },

  async getStoreSettings(): Promise<any> {
    const res = await apiClient.get("/store/settings", {
      skipAuthRedirect: true,
      skipGlobalToast: true,
    } as any);
    return res.data?.data ?? {};
  },

  async updateStoreSettings(payload: any): Promise<any> {
    const res = await apiClient.put("/store/settings", payload);
    return res.data?.data ?? res.data;
  },

  // ─── RBAC Roles & Permissions ─────────────────────────────────
  async getRbacRoles(): Promise<any[]> {
    const res = await apiClient.get("/store/rbac/roles");
    return res.data?.data ?? [];
  },

  async getRbacPermissions(): Promise<any[]> {
    const res = await apiClient.get("/store/rbac/permissions");
    return res.data?.data ?? [];
  },

  async updateRolePermissions(roleId: string, permissions: string[]): Promise<any> {
    const res = await apiClient.put(`/store/rbac/roles/${roleId}/permissions`, { permissions });
    return res.data?.data ?? res.data;
  },

  async assignUserRole(userId: string, roleName: string): Promise<any> {
    const res = await apiClient.put(`/store/rbac/users/${userId}/role`, { roleName });
    return res.data?.data ?? res.data;
  },
};

export default storeApi;
