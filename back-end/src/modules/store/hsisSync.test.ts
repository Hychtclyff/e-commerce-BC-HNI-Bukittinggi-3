// @ts-ignore - bun:test types provided by bun runtime
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { hsisSyncService, parseHsisDate } from "./hsisSync.service";
import { productsService } from "../products/products.service";
import { db } from "@/prisma/db";
import { axiosClient } from "@/config/axios";

let state: {
  products: any[];
  orders: any[];
  orderItems: any[];
  hniProfiles: any[];
  users: any[];
};

function makeQuery(collectionGetter: () => any[], filter: Record<string, any> = {}) {
  const match = (row: any) =>
    Object.entries(filter).every(([k, v]) => row[k] === v);
  return {
    include() {
      return this;
    },
    async first() {
      const found = collectionGetter().find(match) || null;
      return found ? { ...found } : null;
    },
    async all() {
      return collectionGetter().filter(match).map((r) => ({ ...r }));
    },
    async update(data: Record<string, any>) {
      const list = collectionGetter();
      for (let i = 0; i < list.length; i++) {
        if (match(list[i])) {
          list[i] = { ...list[i], ...data };
        }
      }
      return list.filter(match);
    },
  };
}

function makeModel(collectionGetter: () => any[]) {
  return {
    where: (filter: Record<string, any>) => makeQuery(collectionGetter, filter),
    async all() {
      return collectionGetter().map((r) => ({ ...r }));
    },
    async create(data: Record<string, any>) {
      const list = collectionGetter();
      const created = {
        id: data.id || `id-${list.length + 1}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...data,
      };
      list.push(created);
      return { ...created };
    },
    async upsert(args: { conflictOn: Record<string, any>; update: any; create: any }) {
      const list = collectionGetter();
      const idx = list.findIndex((r) =>
        Object.entries(args.conflictOn).every(([k, v]) => r[k] === v)
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...args.update };
        return { ...list[idx] };
      }
      const created = { id: `prod-${list.length + 1}`, ...args.create };
      list.push(created);
      return { ...created };
    },
  };
}

describe("HSIS Integration Sync & Reconciliation", () => {
  beforeEach(() => {
    state = {
      products: [
        {
          id: "p-ogk1",
          sku: "OGK1",
          name: "GAMAT KAPSUL",
          stock: 10,
          pointStock: 10,
          agentPrice: 100000,
          normalPrice: 130000,
          tpPoints: 40000,
          isActive: true,
        },
        {
          id: "p-osp1",
          sku: "OSP1",
          name: "SPIRULINA",
          stock: 5,
          pointStock: 7, // +2 diff: 1 explained by pending order, +1 anomaly
          agentPrice: 70000,
          normalPrice: 90000,
          tpPoints: 25000,
          isActive: true,
        },
      ],
      orders: [
        {
          id: "ord-online-1",
          orderNumber: "ORD/20261120/BC3-1001",
          userId: "user-1",
          recipientName: "SUSILAWATI",
          orderStatus: "PROCESSING",
          paymentStatus: "PAID",
          totalAmount: 280000,
          totalTpPoints: 95000,
          invoiceId: null,
          sourceChannel: "ONLINE",
          createdAt: "2026-11-20T01:00:00.000Z",
        },
        {
          id: "ord-online-2",
          orderNumber: "ORD/20261120/BC3-1002",
          userId: "user-2",
          recipientName: "BUDI",
          orderStatus: "PROCESSING",
          paymentStatus: "PAID",
          totalAmount: 70000,
          totalTpPoints: 25000,
          invoiceId: null,
          sourceChannel: "ONLINE",
          createdAt: "2026-11-20T02:00:00.000Z",
        },
      ],
      orderItems: [
        {
          id: "oi-1",
          orderId: "ord-online-1",
          productId: "p-ogk1",
          sku: "OGK1",
          productName: "GAMAT KAPSUL",
          qty: 1,
          unitPrice: 100000,
          totalPrice: 100000,
        },
        {
          id: "oi-2",
          orderId: "ord-online-2",
          productId: "p-osp1",
          sku: "OSP1",
          productName: "SPIRULINA",
          qty: 1,
          unitPrice: 70000,
          totalPrice: 70000,
        },
      ],
      hniProfiles: [
        {
          id: "hni-1",
          userId: "user-1",
          hniMemberId: "01916118",
          hniMemberName: "SUSILAWATI ZAIMARNI, S.AG",
        },
      ],
      users: [
        {
          id: "user-1",
          fullName: "SUSILAWATI",
          hniProfile: { hniMemberId: "01916118" },
        },
        {
          id: "user-2",
          fullName: "BUDI",
          hniProfile: { hniMemberId: "09999999" },
        },
      ],
    };

    (db as any).orm = {
      products: { Product: makeModel(() => state.products) },
      orders: {
        Order: makeModel(() => state.orders),
        OrderItem: makeModel(() => state.orderItems),
      },
      core_auth: {
        HNIProfile: makeModel(() => state.hniProfiles),
        User: makeModel(() => state.users),
      },
    };
  });

  it("parses DD-MM-YYYY HSIS date format correctly", () => {
    expect(parseHsisDate("20-11-2026")).toBe("2026-11-20T00:00:00.000Z");
  });

  it("syncs HSIS saldo deriving unit agentPrice (tv/so) and tpPoints (tvp/so) without overwriting stock or normalPrice", async () => {
    axiosClient.post = mock(async () => ({
      data: {
        saldo: [
          { pc: "OGK1", pn: "GAMAT KAPSUL", so: 5, tv: 500000, tvp: 150 },
        ],
      },
    })) as any;

    await productsService.syncHsisProduct();
    const ogk = state.products.find((p) => p.sku === "OGK1");
    expect(ogk.pointStock).toBe(5);
    expect(ogk.stock).toBe(10); // physical stock untouched!
    expect(ogk.normalPrice).toBe(130000); // normalPrice untouched!
    expect(ogk.agentPrice).toBe(100000); // 500000 / 5
    expect(ogk.tpPoints).toBe(30); // 150 / 5
  });

  it("syncs /jualan skipping Total & TESTIMONY, detects suggestedMatches, and imports new OFFLINE_HSIS orders", async () => {
    productsService.syncHsisProduct = mock(async () => {}) as any;

    axiosClient.get = mock(async (url: string) => {
      if (url === "jualan") {
        return {
          data: {
            data: {
              rows: [
                // Matches ord-online-1 (sc=01916118, tvs=280000) -> suggestedMatch
                {
                  nd: "B003972611201",
                  sc: "01916118",
                  sd: "20-11-2026",
                  tvp: "95000.00",
                  tvs: "280000.00",
                  qty: "4",
                  is_leaf: "true",
                  cn: "SUSILAWATI ZAIMARNI, S.AG",
                  jb: "MLM",
                  sebelum_potongan: 280000,
                },
                // TESTIMONY -> must be ignored
                {
                  nd: "R028620372611201",
                  sc: "05837525",
                  sd: "20-11-2026",
                  tvp: "0.00",
                  tvs: "10000.00",
                  qty: null,
                  is_leaf: "true",
                  cn: "RATNA WATI",
                  jb: "TESTIMONY",
                },
                // New offline transaction (unregistered sc) -> must be imported
                {
                  nd: "B003972611206",
                  sc: "04637658",
                  sd: "20-11-2026",
                  tvp: "20000.00",
                  tvs: "70000.00",
                  qty: "1",
                  is_leaf: "true",
                  cn: "DEWI SUSANTI",
                  jb: "MLM",
                  sebelum_potongan: 70000,
                },
                // Summary row -> must be ignored
                {
                  nd: "Total",
                  sc: "",
                  sd: "",
                  tvp: 115000,
                  tvs: 360000,
                  qty: 5,
                  is_leaf: false,
                  cn: "",
                },
              ],
            },
          },
        };
      }
      if (url.includes("B003972611206/lines")) {
        return {
          data: {
            data: [
              { id: 1, pc: "OSP1", pn: "SPIRULINA", tt: "70000.00", vp: "20000.00", qty: 1, up: "70000.00" },
            ],
          },
        };
      }
      return { data: { data: [] } };
    }) as any;

    const result = await hsisSyncService.syncHsisSales();
    expect(result.validMlmRows).toBe(2); // TESTIMONY & Total excluded
    expect(result.suggestedMatches.length).toBe(1);
    expect(result.suggestedMatches[0].hsisInvoiceId).toBe("B003972611201");
    expect(result.importedCount).toBe(1);
    expect(result.importedInvoices).toEqual(["B003972611206"]);

    const offlineOrder = state.orders.find((o) => o.invoiceId === "B003972611206");
    expect(offlineOrder).toBeTruthy();
    expect(offlineOrder.sourceChannel).toBe("OFFLINE_HSIS");
    expect(offlineOrder.userId).toBe("WALKIN_HSIS");
  });

  it("reconciles stock vs HSIS saldo and flags unexplained anomalies", async () => {
    const report = await hsisSyncService.runStockSaldoReconciliation();
    expect(report.summary.pendingHsisOrdersCount).toBe(2);

    const osp1 = report.items.find((i) => i.sku === "OSP1")!;
    // hsisSaldo=7, tijarahStock=5 => rawDiff=+2; pendingQty=1 => unexplainedDiff=+1 (ANOMALY)
    expect(osp1.rawDiff).toBe(2);
    expect(osp1.pendingIntegrationQty).toBe(1);
    expect(osp1.unexplainedDiff).toBe(1);
    expect(osp1.status).toBe("ANOMALY");

    // Link ord-online-1 to B003972611201
    await hsisSyncService.linkOrderToHsisInvoice("ord-online-1", "B003972611201");
    const afterLink = await hsisSyncService.getPendingHsisOrders();
    expect(afterLink.length).toBe(1);
    expect(afterLink[0].id).toBe("ord-online-2");
  });

  it("syncHsisSaldoOnly triggers saldo sync and returns updated reconciliation report", async () => {
    productsService.syncHsisProduct = mock(async () => ({
      totalFetched: 2,
      syncedCount: 2,
      skippedCount: 0,
    })) as any;

    const res = await hsisSyncService.syncHsisSaldoOnly();
    expect(res.syncedCount).toBe(2);
    expect(res.totalFetched).toBe(2);
    expect(res.report).toBeTruthy();
    expect(Array.isArray(res.report.items)).toBe(true);
  });
});
