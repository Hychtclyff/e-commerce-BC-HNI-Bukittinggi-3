import { db, pool } from "@/prisma/db";
import { axiosClient } from "@/config/axios";
import { AppError } from "@/utils/AppError";
import { productsService } from "../products/products.service";
import { generateOrderSlug } from "../checkout/checkout.service";

const ACTIVE_PENDING_STATUSES = new Set([
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "READY_FOR_PICKUP",
  "COMPLETED",
]);

export function parseHsisDate(sd?: string): string {
  if (!sd) return new Date().toISOString();
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(sd.trim());
  if (match) {
    const [, dd, mm, yyyy] = match;
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`).toISOString();
  }
  const parsed = new Date(sd);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export interface HsisJualanRow {
  nd: string;
  sc: string;
  sd: string;
  tvp: string | number;
  tvs: string | number;
  qty: string | number | null;
  is_leaf: string | boolean;
  cn: string;
  jb?: string;
  potongan?: string | number;
  sebelum_potongan?: string | number;
}

export interface HsisJualanLine {
  id: number | string;
  pc: string;
  pn: string;
  tt: string | number;
  vp: string | number;
  qty: number;
  up: string | number;
}

export interface SuggestedMatch {
  hsisInvoiceId: string;
  hsisMemberId: string;
  hsisCustomerName: string;
  hsisDate: string;
  hsisAmount: number;
  orderId: string;
  orderNumber: string;
  orderAmount: number;
}

export const hsisSyncService = {
  async getPendingHsisOrders() {
    const allOrders = await db.orm.orders.Order.all();
    const pending = allOrders.filter(
      (o) =>
        !o.invoiceId &&
        o.sourceChannel !== "OFFLINE_HSIS" &&
        ACTIVE_PENDING_STATUSES.has(o.orderStatus)
    );

    const results = [];
    for (const order of pending) {
      const items = await db.orm.orders.OrderItem.where({ orderId: order.id }).all();
      const user = await db.orm.core_auth.User.where({ id: order.userId })
        .include("hniProfile")
        .first();
      results.push({
        id: order.id,
        orderNumber: order.orderNumber,
        slug: order.slug || generateOrderSlug(order.orderNumber),
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount) || 0,
        totalTpPoints: Number(order.totalTpPoints) || 0,
        customerName: order.recipientName || user?.fullName || "Pelanggan",
        hniMemberId: user?.hniProfile?.hniMemberId || order.hsisMemberId || null,
        integrationStatus: "BELUM_INTEGRASI_HSIS",
        items: items.map((it) => ({
          productId: it.productId,
          sku: it.sku || null,
          productName: it.productName,
          qty: Number(it.qty) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          totalPrice: Number(it.totalPrice) || 0,
        })),
      });
    }

    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return results;
  },

  async getOfflineHsisOrders() {
    const allOrders = await db.orm.orders.Order.all();
    const synced = allOrders.filter(
      (o) => Boolean(o.invoiceId) || o.sourceChannel === "OFFLINE_HSIS"
    );

    const results = [];
    for (const order of synced) {
      const items = await db.orm.orders.OrderItem.where({ orderId: order.id }).all();
      results.push({
        id: order.id,
        orderNumber: order.orderNumber,
        invoiceId: order.invoiceId || null,
        sourceChannel: order.sourceChannel || "ONLINE",
        hsisMemberId: order.hsisMemberId || null,
        hsisCustomerName: order.hsisCustomerName || order.recipientName || "-",
        hsisSaleType: order.hsisSaleType || "MLM",
        totalAmount: Number(order.totalAmount) || 0,
        totalTpPoints: Number(order.totalTpPoints) || 0,
        createdAt: order.createdAt,
        itemsCount: items.length,
        items: items.map((it) => ({
          sku: it.sku || null,
          productName: it.productName,
          qty: Number(it.qty) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          totalPrice: Number(it.totalPrice) || 0,
        })),
      });
    }

    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return results;
  },

  async syncHsisSales() {
    let saldoSynced = false;
    let saldoError: string | null = null;
    try {
      await productsService.syncHsisProduct();
      saldoSynced = true;
    } catch (err: any) {
      saldoError = err?.message || "Failed to sync HSIS saldo";
    }

    let rawRows: HsisJualanRow[] = [];
    try {
      const res = await axiosClient.get("/jualan", { params: { _dc: Date.now() } });
      rawRows = res.data?.data?.rows ?? res.data?.rows ?? (Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err: any) {
      throw new AppError(
        `Gagal mengambil data penjualan HSIS (/jualan): ${err?.message || "Connection error"}`,
        502
      );
    }

    // Filter baris valid: abaikan summary ("Total", is_leaf: false) dan non-produk ("TESTIMONY")
    const validRows = rawRows.filter((r) => {
      const isLeaf = r.is_leaf === true || r.is_leaf === "true";
      const isSummary = !r.nd || r.nd.trim().toLowerCase() === "total";
      const saleType = String(r.jb || "").trim().toUpperCase();
      return isLeaf && !isSummary && saleType === "MLM";
    });

    const pendingOrders = await this.getPendingHsisOrders();
    const imported: string[] = [];
    const skippedExisting: string[] = [];
    const suggestedMatches: SuggestedMatch[] = [];
    const lineErrors: Array<{ invoiceId: string; error: string }> = [];

    for (const row of validRows) {
      const invoiceId = String(row.nd).trim();
      const existing = await db.orm.orders.Order.where({ invoiceId }).first();
      if (existing) {
        skippedExisting.push(invoiceId);
        continue;
      }

      const hsisAmount = Number(row.tvs ?? 0);
      const hsisMemberId = String(row.sc || "").trim();

      // Smart Match terhadap order online Tijarah yang belum memiliki invoice_id
      const candidate = pendingOrders.find(
        (po) =>
          po.hniMemberId &&
          po.hniMemberId === hsisMemberId &&
          Math.abs(po.totalAmount - hsisAmount) < 1
      );
      if (candidate) {
        suggestedMatches.push({
          hsisInvoiceId: invoiceId,
          hsisMemberId,
          hsisCustomerName: row.cn || "",
          hsisDate: row.sd || "",
          hsisAmount,
          orderId: candidate.id,
          orderNumber: candidate.orderNumber,
          orderAmount: candidate.totalAmount,
        });
        continue;
      }

      // Tarik detail item dari /jualan/:nd/lines
      let lines: HsisJualanLine[] = [];
      try {
        const lineRes = await axiosClient.get(`/jualan/${encodeURIComponent(invoiceId)}/lines`, {
          params: { _dc: Date.now() },
        });
        lines = Array.isArray(lineRes.data?.data)
          ? lineRes.data.data
          : Array.isArray(lineRes.data)
            ? lineRes.data
            : [];
      } catch (err: any) {
        lineErrors.push({
          invoiceId,
          error: err?.message || "Failed to fetch /lines",
        });
        continue;
      }

      // Resolusi userId dari hni_profiles berdasarkan sc, fallback ke WALKIN_HSIS
      const hniProfile = hsisMemberId
        ? await db.orm.core_auth.HNIProfile.where({ hniMemberId: hsisMemberId }).first()
        : null;
      const resolvedUserId = hniProfile?.userId || "WALKIN_HSIS";

      const subtotal = Number(row.sebelum_potongan ?? hsisAmount);
      const discountAmount = Math.max(0, subtotal - hsisAmount);
      const totalTpPoints = Math.round(Number(row.tvp ?? 0));
      const orderNumber = `HSIS-${invoiceId}`;
      const slug = generateOrderSlug(orderNumber);

      const createdOrder = await db.orm.orders.Order.create({
        orderNumber,
        slug,
        userId: resolvedUserId,
        isAgentPriceApplied: true,
        shippingType: "PICKUP",
        recipientName: row.cn || hniProfile?.hniMemberName || "Pelanggan Walk-In HSIS",
        shippingAddressText: "Transaksi Offline Gerai (Sinkronisasi HSIS)",
        shippingCourier: "OFFLINE_STORE",
        subtotal,
        shippingCost: 0,
        discountAmount,
        totalAmount: hsisAmount,
        totalTpPoints,
        paymentMethod: "CASH_STORE",
        paymentStatus: "PAID",
        orderStatus: "COMPLETED",
        hsisPostingStatus: "POSTED",
        hsisReceiptNo: invoiceId,
        hsisPostedAt: parseHsisDate(row.sd),
        invoiceId,
        sourceChannel: "OFFLINE_HSIS",
        hsisMemberId: hsisMemberId || undefined,
        hsisCustomerName: row.cn || undefined,
        hsisSaleType: "MLM",
      });

      for (const line of lines) {
        const sku = String(line.pc || "").trim();
        const product = sku
          ? await db.orm.products.Product.where({ sku }).first()
          : null;
        await db.orm.orders.OrderItem.create({
          orderId: createdOrder.id,
          productId: product?.id || sku || "HSIS_ITEM",
          sku: sku || undefined,
          productName: String(line.pn || sku || "Produk HSIS"),
          qty: Number(line.qty) || 1,
          unitPrice: Number(line.up) || 0,
          tpPoints: Math.round(Number(line.vp) || 0),
          totalPrice: Number(line.tt) || 0,
        });
      }

      // Auto-upsert pembeli HSIS ke Agent Network (termasuk yang belum registrasi akun Tijarah)
      if (hsisMemberId) {
        await this.upsertAgentNetworkFromHsis({
          hniId: hsisMemberId,
          name: String(row.cn || hniProfile?.hniMemberName || `Mitra ${hsisMemberId}`).trim(),
          amount: hsisAmount,
          tpPoints: totalTpPoints,
          transactionDate: parseHsisDate(row.sd),
          linkedUserId: hniProfile?.userId || null,
        });
      }

      imported.push(invoiceId);
    }

    console.log(
      `[hsisSyncSales] fetched=${rawRows.length}, valid=${validRows.length}, imported=${imported.length}, skipped=${skippedExisting.length}, suggested=${suggestedMatches.length}, lineErrors=${lineErrors.length}`
    );

    const report = await this.runStockSaldoReconciliation(suggestedMatches);

    return {
      saldoSynced,
      saldoError,
      totalRowsFetched: rawRows.length,
      validMlmRows: validRows.length,
      importedCount: imported.length,
      importedInvoices: imported,
      skippedExistingCount: skippedExisting.length,
      suggestedMatches,
      lineErrors,
      report,
    };
  },

  async upsertAgentNetworkFromHsis(input: {
    hniId: string;
    name: string;
    amount: number;
    tpPoints: number;
    transactionDate: string;
    linkedUserId: string | null;
  }) {
    const hniId = String(input.hniId || "").trim();
    if (!hniId) return;
    try {
      const existing = await pool.query(
        `SELECT id, total_orders, total_spent, total_tp_points FROM store.agents WHERE hni_id = $1 LIMIT 1`,
        [hniId]
      );
      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        await pool.query(
          `UPDATE store.agents
           SET name = COALESCE(NULLIF($1, ''), name),
               is_registered_user = ($2 OR is_registered_user),
               linked_user_id = COALESCE($3, linked_user_id),
               total_orders = COALESCE(total_orders, 0) + 1,
               total_spent = COALESCE(total_spent, 0) + $4,
               total_tp_points = COALESCE(total_tp_points, 0) + $5,
               last_transaction_at = GREATEST(COALESCE(last_transaction_at, $6::timestamptz), $6::timestamptz),
               updated_at = NOW()
           WHERE id = $7`,
          [
            input.name,
            Boolean(input.linkedUserId),
            input.linkedUserId,
            Number(input.amount) || 0,
            Number(input.tpPoints) || 0,
            input.transactionDate,
            row.id,
          ]
        );
      } else {
        const agtId = `HSIS-AGT-${hniId.replace(/[^a-zA-Z0-9]/g, "")}`;
        await pool.query(
          `INSERT INTO store.agents
             (id, name, hni_id, phone, rank, tier, status, role, source_channel, is_registered_user, linked_user_id, total_orders, total_spent, total_tp_points, last_transaction_at)
           VALUES
             ($1, $2, $3, '-', 'AB', 'AGEN_BIAYA', 'ACTIVE', 'AGEN_HNI', 'HSIS_SYNC', $4, $5, 1, $6, $7, $8::timestamptz)
           ON CONFLICT (id) DO UPDATE SET
             total_orders = store.agents.total_orders + 1,
             total_spent = store.agents.total_spent + EXCLUDED.total_spent,
             total_tp_points = store.agents.total_tp_points + EXCLUDED.total_tp_points,
             last_transaction_at = GREATEST(store.agents.last_transaction_at, EXCLUDED.last_transaction_at),
             updated_at = NOW()`,
          [
            agtId,
            input.name,
            hniId,
            Boolean(input.linkedUserId),
            input.linkedUserId,
            Number(input.amount) || 0,
            Number(input.tpPoints) || 0,
            input.transactionDate,
          ]
        );
      }
    } catch (err: any) {
      // Jangan gagalkan sync penjualan jika DB pool tidak aktif (misal saat unit test mock)
      console.warn("[hsisSync] Skipped agent network upsert:", err?.message);
    }
  },

  async syncHsisSaldoOnly() {
    const saldoResult = await productsService.syncHsisProduct();
    const report = await this.runStockSaldoReconciliation();
    return {
      ...saldoResult,
      report,
    };
  },

  async linkOrderToHsisInvoice(orderId: string, invoiceId: string) {
    const cleanInvoiceId = String(invoiceId || "").trim();
    if (!cleanInvoiceId) {
      throw new AppError("Invoice ID HSIS wajib diisi", 400);
    }

    const order = await db.orm.orders.Order.where({ id: orderId }).first();
    if (!order) {
      throw new AppError("Order Tijarah tidak ditemukan", 404);
    }

    const duplicate = await db.orm.orders.Order.where({
      invoiceId: cleanInvoiceId,
    }).first();
    if (duplicate && duplicate.id !== order.id) {
      throw new AppError(
        `Invoice ID ${cleanInvoiceId} sudah tertaut dengan order ${duplicate.orderNumber}`,
        409
      );
    }

    const now = new Date().toISOString();
    await db.orm.orders.Order.where({ id: order.id }).update({
      invoiceId: cleanInvoiceId,
      hsisPostingStatus: "POSTED",
      hsisReceiptNo: cleanInvoiceId,
      hsisPostedAt: now,
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      invoiceId: cleanInvoiceId,
      hsisPostingStatus: "POSTED",
      linkedAt: now,
    };
  },

  async runStockSaldoReconciliation(suggestedMatches: SuggestedMatch[] = []) {
    const allProducts = await db.orm.products.Product.all();
    const activeProducts = allProducts.filter((p) => p.isActive !== false);
    const pendingOrders = await this.getPendingHsisOrders();
    const offlineOrders = await this.getOfflineHsisOrders();

    // Hitung kuantitas per SKU/ProductId pada order yang belum terintegrasi HSIS
    const pendingQtyByProductId = new Map<string, number>();
    const pendingQtyBySku = new Map<string, number>();
    for (const po of pendingOrders) {
      for (const item of po.items) {
        if (item.productId) {
          pendingQtyByProductId.set(
            item.productId,
            (pendingQtyByProductId.get(item.productId) || 0) + item.qty
          );
        }
        if (item.sku) {
          pendingQtyBySku.set(
            item.sku,
            (pendingQtyBySku.get(item.sku) || 0) + item.qty
          );
        }
      }
    }

    const items = activeProducts.map((p) => {
      const tijarahStock = Number(p.stock ?? 0);
      const hsisSaldo = Number(p.pointStock ?? p.stock ?? 0);
      // Selisih mentah positif = HSIS saldo masih lebih banyak daripada stok fisik Tijarah
      const rawDiff = hsisSaldo - tijarahStock;
      const pendingQty =
        (p.sku ? pendingQtyBySku.get(p.sku) : undefined) ??
        pendingQtyByProductId.get(p.id) ??
        0;
      const unexplainedDiff = rawDiff - pendingQty;
      const unitAgentPrice = Number(p.agentPrice ?? 0);

      let status: "SYNCED" | "EXPLAINED_BY_PENDING" | "ANOMALY" = "SYNCED";
      if (unexplainedDiff !== 0) {
        status = "ANOMALY";
      } else if (rawDiff !== 0 || pendingQty !== 0) {
        status = "EXPLAINED_BY_PENDING";
      }

      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        tijarahStock,
        hsisSaldo,
        rawDiff,
        pendingIntegrationQty: pendingQty,
        unexplainedDiff,
        unitAgentPrice,
        tijarahStockValue: tijarahStock * unitAgentPrice,
        hsisSaldoValue: hsisSaldo * unitAgentPrice,
        unexplainedValue: unexplainedDiff * unitAgentPrice,
        status,
      };
    });

    const anomalies = items.filter((i) => i.status === "ANOMALY");
    const explainedByPending = items.filter(
      (i) => i.status === "EXPLAINED_BY_PENDING"
    );

    const totalTijarahStock = items.reduce((s, i) => s + i.tijarahStock, 0);
    const totalHsisSaldo = items.reduce((s, i) => s + i.hsisSaldo, 0);
    const totalPendingAmount = pendingOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalUnexplainedValue = anomalies.reduce(
      (s, i) => s + i.unexplainedValue,
      0
    );

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalProducts: items.length,
        totalTijarahStock,
        totalHsisSaldo,
        rawStockDiff: totalHsisSaldo - totalTijarahStock,
        pendingHsisOrdersCount: pendingOrders.length,
        pendingHsisOrdersAmount: totalPendingAmount,
        explainedItemsCount: explainedByPending.length,
        anomalyItemsCount: anomalies.length,
        totalUnexplainedValue,
        offlineHsisOrdersCount: offlineOrders.length,
      },
      items,
      anomalies,
      pendingOrders,
      offlineOrders,
      suggestedMatches,
    };
  },
};
