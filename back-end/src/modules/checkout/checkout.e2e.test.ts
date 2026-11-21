// @ts-ignore - bun:test types provided by bun runtime
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { checkoutService } from "./checkout.service";
import { db } from "@/prisma/db";
import { storeService } from "../store/store.service";
import { notificationsService } from "../notifications/notifications.service";
import { xenditService } from "@/config/xendit";
import { paymentService } from "../payments/payment.service";

// In-memory state for E2E simulation
let state: {
  users: any[];
  products: any[];
  addresses: any[];
  vouchers: any[];
  userVouchers: any[];
  creditProfiles: any[];
  creditLedger: any[];
  orders: any[];
  orderItems: any[];
  notifications: any[];
  deliveryMethods: any[];
};

function resetState() {
  state = {
    users: [
      {
        id: "user-agent-1",
        fullName: "Agen HNI Terverifikasi",
        email: "agent@tijarah.test",
        phoneNumber: "081234567890",
        hniProfile: { id: "hni-1", userId: "user-agent-1", hniMemberId: "00123456", isVerified: true },
      },
      {
        id: "user-unverified-1",
        fullName: "User Belum Verifikasi",
        email: "unverified@tijarah.test",
        phoneNumber: "081234567891",
        hniProfile: { id: "hni-2", userId: "user-unverified-1", hniMemberId: "00999999", isVerified: false },
      },
      {
        id: "user-customer-1",
        fullName: "Pelanggan Reguler",
        email: "customer@tijarah.test",
        phoneNumber: "081234567892",
        hniProfile: null,
      },
    ],
    products: [
      {
        id: "prod-hni-1",
        sku: "MHS-100",
        name: "Minyak Herba Sinergi",
        agentPrice: 30000,
        normalPrice: 45000,
        tpPoints: 10,
        stock: 20,
        isActive: true,
        allowAgentPrice: true,
      },
      {
        id: "prod-nonhni-1",
        sku: "NON-001",
        name: "Produk Non-HNI",
        agentPrice: 50000,
        normalPrice: 80000,
        tpPoints: 0,
        stock: 10,
        isActive: true,
        allowAgentPrice: false,
      },
      {
        id: "prod-inactive-1",
        sku: "INACT-001",
        name: "Produk Nonaktif",
        agentPrice: 10000,
        normalPrice: 15000,
        tpPoints: 0,
        stock: 10,
        isActive: false,
        allowAgentPrice: true,
      },
    ],
    addresses: [
      {
        id: "addr-1",
        userId: "user-agent-1",
        recipientName: "Ahmad Bukittinggi",
        phoneNumber: "081234567890",
        fullAddress: "Jl. Sudirman No. 10",
        district: "Aur Birugo Tigo Baleh",
        city: "Bukittinggi",
        province: "Sumatera Barat",
        postalCode: "26181",
      },
    ],
    vouchers: [
      {
        id: "v-1",
        code: "DISKON10K",
        title: "Diskon 10rb",
        discountType: "FIXED",
        discountValue: 10000,
        minPurchase: 50000,
        maxDiscount: null,
        validUntil: "2099-12-31T23:59:59.000Z",
        isActive: true,
      },
      {
        id: "v-exp",
        code: "EXPIRED2020",
        title: "Expired",
        discountType: "FIXED",
        discountValue: 10000,
        minPurchase: 10000,
        validUntil: "2020-01-01T00:00:00.000Z",
        isActive: true,
      },
    ],
    userVouchers: [],
    creditProfiles: [
      {
        id: "cp-1",
        userId: "user-agent-1",
        status: "ACTIVE",
        isLocked: false,
        currentBalance: 500000,
        usedBalance: 0,
        dueDate: null,
      },
    ],
    creditLedger: [],
    orders: [],
    orderItems: [],
    notifications: [],
    deliveryMethods: [
      { id: "DM-L300", code: "L300-REGIONAL", name: "Travel L300", baseCost: 20000, isActive: true },
      { id: "DM-PICKUP", code: "STORE_PICKUP", name: "Pickup", baseCost: 0, isActive: true },
    ],
  };
}

function makeQuery(collectionGetter: () => any[], filter: Record<string, any> = {}) {
  const match = (row: any) =>
    Object.entries(filter).every(([k, v]) => row[k] === v);

  return {
    _include: [] as string[],
    include(rel: string) {
      this._include.push(rel);
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
  };
}

describe("Checkout E2E Flow", () => {
  beforeEach(() => {
    resetState();

    (db as any).orm = {
      core_auth: {
        User: makeModel(() => state.users),
        Address: makeModel(() => state.addresses),
      },
      products: {
        Product: makeModel(() => state.products),
      },
      promotions: {
        Voucher: makeModel(() => state.vouchers),
        UserVoucher: makeModel(() => state.userVouchers),
      },
      b2b_credit: {
        CreditProfile: makeModel(() => state.creditProfiles),
        CreditLedgerEntry: makeModel(() => state.creditLedger),
      },
      orders: {
        Order: makeModel(() => state.orders),
        OrderItem: makeModel(() => state.orderItems),
      },
    };

    storeService.getDeliveryMethods = mock(async () => state.deliveryMethods as any);
    notificationsService.createNotification = mock(async (n: any) => {
      state.notifications.push(n);
      return n as any;
    });
    xenditService.createFixedVA = mock(async (args: any) => ({
      accountNumber: "38165000012345",
      bankCode: args.bankCode,
    })) as any;
    xenditService.createQRIS = mock(async () => ({
      qrString: "000201010212MOCKQRIS",
    })) as any;
    xenditService.createInvoice = mock(async () => ({
      invoiceId: "inv-mock-1",
      invoiceUrl: "https://checkout.xendit.co/mock",
      expiryDate: "2099-01-01T00:00:00.000Z",
    })) as any;
    paymentService.generateReceipt = mock(async () => ({ id: "rcp-1" })) as any;
  });

  it("calculates agent vs unverified vs non-HNI product prices and server shipping cost accurately", async () => {
    // 1. Verified agent buying 2x HNI product (30k) + 1x Non-HNI (allowAgentPrice=false -> 80k)
    // Even if client tampers shippingCost to 0, server resolves L300-REGIONAL = 20,000
    const agentCalc = await checkoutService.calculateCheckout("user-agent-1", {
      shippingType: "DELIVERY",
      shippingCourier: "L300-REGIONAL",
      shippingCost: 0, // tampered!
      voucherCode: "DISKON10K",
      items: [
        { productId: "prod-hni-1", qty: 2 },
        { productId: "prod-nonhni-1", qty: 1 },
      ],
    });

    expect(agentCalc.isAgentPriceApplied).toBe(true);
    expect(agentCalc.subtotal).toBe(2 * 30000 + 80000); // 140,000
    expect(agentCalc.shippingCost).toBe(20000); // server resolved!
    expect(agentCalc.discountAmount).toBe(10000);
    expect(agentCalc.totalTpPoints).toBe(20);
    expect(agentCalc.grandTotal).toBe(150000);
    expect(agentCalc.kasbonEligible).toBe(true);

    // 2. Unverified HNI profile must NOT get agent prices
    const unverifiedCalc = await checkoutService.calculateCheckout("user-unverified-1", {
      shippingType: "PICKUP",
      shippingCost: 20000, // should be 0 for PICKUP
      items: [{ productId: "prod-hni-1", qty: 2 }],
    });

    expect(unverifiedCalc.isAgentPriceApplied).toBe(false);
    expect(unverifiedCalc.subtotal).toBe(2 * 45000); // 90,000 normal price
    expect(unverifiedCalc.shippingCost).toBe(0);
    expect(unverifiedCalc.totalTpPoints).toBe(0);
    expect(unverifiedCalc.grandTotal).toBe(90000);
  });

  it("rejects expired vouchers and inactive products", async () => {
    await expect(
      checkoutService.calculateCheckout("user-agent-1", {
        shippingType: "PICKUP",
        shippingCost: 0,
        voucherCode: "EXPIRED2020",
        items: [{ productId: "prod-hni-1", qty: 2 }],
      }),
    ).rejects.toThrow();

    await expect(
      checkoutService.processCheckout("user-agent-1", {
        shippingType: "PICKUP",
        shippingCost: 0,
        paymentMethod: "COD",
        items: [{ productId: "prod-inactive-1", qty: 1 }],
      }),
    ).rejects.toThrow();
  });

  it("processes B2B_CREDIT checkout end-to-end: deducts stock & kasbon, marks voucher used, populates address, and refunds on reject", async () => {
    const receipt = await checkoutService.processCheckout("user-agent-1", {
      shippingType: "DELIVERY",
      addressId: "addr-1",
      shippingCourier: "L300-REGIONAL",
      shippingCost: 20000,
      voucherCode: "DISKON10K",
      paymentMethod: "B2B_CREDIT",
      notes: "Tolong packing kayu",
      items: [{ productId: "prod-hni-1", qty: 3 }],
    });

    // Receipt & Order verification
    expect(receipt.subtotal).toBe(90000);
    expect(receipt.shippingCost).toBe(20000);
    expect(receipt.discountAmount).toBe(10000);
    expect(receipt.totalAmount).toBe(100000);
    expect(receipt.totalTpPoints).toBe(30);
    expect(receipt.paymentStatus).toBe("TEMPO_ACTIVE");
    expect(receipt.orderStatus).toBe("PROCESSING");
    expect(receipt.shippingAddressText).toContain("Jl. Sudirman No. 10");
    expect(receipt.items.length).toBe(1);

    // Stock deducted: 20 - 3 = 17
    expect(state.products[0].stock).toBe(17);

    // Kasbon deducted: 500,000 - 100,000 = 400,000
    expect(state.creditProfiles[0].currentBalance).toBe(400000);
    expect(state.creditProfiles[0].usedBalance).toBe(100000);
    expect(state.creditLedger.length).toBe(1);

    // Voucher marked as used, cannot be reused
    expect(state.userVouchers[0].isUsed).toBe(true);
    await expect(
      checkoutService.calculateCheckout("user-agent-1", {
        shippingType: "PICKUP",
        shippingCost: 0,
        voucherCode: "DISKON10K",
        items: [{ productId: "prod-hni-1", qty: 2 }],
      }),
    ).rejects.toThrow();

    // Reject order -> restores stock & refunds kasbon
    const rejected = await checkoutService.rejectOrder(receipt.id, {
      rejectionReason: "Stok fisik rusak",
    });
    expect(rejected.orderStatus).toBe("REJECTED");
    expect(state.products[0].stock).toBe(20);
    expect(state.creditProfiles[0].currentBalance).toBe(500000);
    expect(state.creditProfiles[0].usedBalance).toBe(0);
  });

  it("processes VA_BCA online checkout and transitions through mock payment & ship lifecycle", async () => {
    const receipt = await checkoutService.processCheckout("user-customer-1", {
      shippingType: "PICKUP",
      shippingCost: 0,
      paymentMethod: "VA_BCA",
      items: [{ productId: "prod-hni-1", qty: 1 }],
    });

    expect(receipt.totalAmount).toBe(45000);
    expect(receipt.slug).toBeTruthy();
    expect(receipt.slug).not.toContain("/");
    expect(receipt.orderStatus).toBe("PENDING_PAYMENT");
    expect(receipt.paymentStatus).toBe("UNPAID");
    expect(receipt.vaNumber).toBe("38165000012345");
    expect(receipt.bankCode).toBe("BCA");
    expect(receipt.paymentUrl).toBe("https://checkout.xendit.co/mock");

    // Fetch receipt by slug (not UUID)
    const bySlug = await checkoutService.getOrderReceipt(receipt.slug!);
    expect(bySlug.id).toBe(receipt.id);
    expect(bySlug.orderNumber).toBe(receipt.orderNumber);

    // Simulate payment success via slug
    const paid = await checkoutService.simulateMockPayment(receipt.slug!);
    expect(paid.paymentStatus).toBe("PAID");
    expect(paid.orderStatus).toBe("PROCESSING");

    // Ship order
    const shipped = await checkoutService.shipOrder(receipt.id, {
      trackingNumber: "TRX-123",
      courierName: "Outlet BC3",
    });
    expect(shipped.orderStatus).toBe("SHIPPED");
  });
});
