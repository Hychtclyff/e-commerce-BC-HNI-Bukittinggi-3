// @ts-ignore - bun:test types provided by bun runtime
import { describe, it, expect, beforeEach } from "bun:test";
import { db } from "@/prisma/db";
import { voucherService } from "./voucher.service";

describe("Dynamic Multi-Condition Voucher Engine", () => {
  const state: {
    vouchers: any[];
    userVouchers: any[];
    hniProfiles: any[];
    orders: any[];
  } = {
    vouchers: [],
    userVouchers: [],
    hniProfiles: [],
    orders: [],
  };

  beforeEach(() => {
    state.vouchers = [
      {
        id: "v-multi-1",
        code: "AGENMULTI20",
        title: "Promo Multi Syarat Agen",
        discountType: "PERCENTAGE",
        discountValue: 20,
        minPurchase: 100000,
        maxDiscount: 50000,
        quota: 10,
        usedCount: 0,
        validUntil: "2027-12-31T23:59:59.000Z",
        isActive: true,
        description: "Multi condition promo",
        conditions: {
          audienceTypes: ["AGENTS_ONLY", "FIRST_TIME_BUYER"],
          minItemsCount: 2,
          allowedPaymentMethods: ["QRIS_MOCKUP", "BANK_TRANSFER_MOCKUP"],
          allowedProductSkus: ["OSP1"],
          maxUsagePerUser: 1,
          customRules: [{ field: "TOTAL_TP_POINTS", operator: ">=", value: 20 }],
        },
      },
    ];
    state.userVouchers = [];
    state.hniProfiles = [{ userId: "u-agent-1", hniMemberId: "00192831" }];
    state.orders = [];

    (db as any).orm = {
      promotions: {
        Voucher: {
          where: (filter: any) => ({
            first: async () =>
              state.vouchers.find((v) =>
                Object.entries(filter).every(([k, val]) => v[k] === val)
              ) || null,
            update: async (patch: any) => {
              state.vouchers = state.vouchers.map((v) =>
                Object.entries(filter).every(([k, val]) => v[k] === val)
                  ? { ...v, ...patch }
                  : v
              );
            },
          }),
        },
        UserVoucher: {
          where: (filter: any) => ({
            first: async () =>
              state.userVouchers.find((uv) =>
                Object.entries(filter).every(([k, val]) => uv[k] === val)
              ) || null,
            update: async (patch: any) => {
              state.userVouchers = state.userVouchers.map((uv) =>
                Object.entries(filter).every(([k, val]) => uv[k] === val)
                  ? { ...uv, ...patch }
                  : uv
              );
            },
          }),
          create: async (data: any) => {
            const row = { id: `uv-${state.userVouchers.length + 1}`, ...data };
            state.userVouchers.push(row);
            return row;
          },
        },
      },
      core_auth: {
        HNIProfile: {
          where: (filter: any) => ({
            first: async () =>
              state.hniProfiles.find((h) => h.userId === filter.userId) || null,
          }),
        },
      },
      orders: {
        Order: {
          where: (filter: any) => ({
            all: async () => state.orders.filter((o) => o.userId === filter.userId),
          }),
        },
      },
    };
  });

  it("passes when all multi-conditions are satisfied and caps discount at maxDiscount", async () => {
    const res = await voucherService.validateVoucher(
      "AGENMULTI20",
      400000,
      0,
      "id",
      "u-agent-1",
      {
        paymentMethod: "QRIS_MOCKUP",
        items: [{ productId: "p-1", sku: "OSP1", category: "HERBAL", qty: 2, tpPoints: 15 }],
      }
    );

    // 20% of 400,000 = 80,000, capped at maxDiscount 50,000
    expect(res.discountAmount).toBe(50000);
  });

  it("rejects non-agent with localized EN error message", async () => {
    await expect(
      voucherService.validateVoucher("AGENMULTI20", 200000, 0, "en", "u-retail-1", {
        paymentMethod: "QRIS_MOCKUP",
        items: [{ sku: "OSP1", qty: 2, tpPoints: 20 }],
      })
    ).rejects.toThrow("exclusively for registered HNI Agents");
  });

  it("rejects disallowed payment method and SKU with localized ID error", async () => {
    await expect(
      voucherService.validateVoucher("AGENMULTI20", 200000, 0, "id", "u-agent-1", {
        paymentMethod: "CASH_STORE",
        items: [{ sku: "OSP1", qty: 2, tpPoints: 20 }],
      })
    ).rejects.toThrow("Metode pembayaran");

    await expect(
      voucherService.validateVoucher("AGENMULTI20", 200000, 0, "en", "u-agent-1", {
        paymentMethod: "QRIS_MOCKUP",
        items: [{ sku: "OTHER_SKU", qty: 2, tpPoints: 20 }],
      })
    ).rejects.toThrow("eligible product SKUs");
  });

  it("increments Voucher.usedCount and blocks reuse after markVoucherUsed", async () => {
    await voucherService.markVoucherUsed("u-agent-1", "v-multi-1");
    expect(state.vouchers[0].usedCount).toBe(1);

    await expect(
      voucherService.validateVoucher("AGENMULTI20", 200000, 0, "en", "u-agent-1", {
        paymentMethod: "QRIS_MOCKUP",
        items: [{ sku: "OSP1", qty: 2, tpPoints: 20 }],
      })
    ).rejects.toThrow("usage limit");
  });
});
