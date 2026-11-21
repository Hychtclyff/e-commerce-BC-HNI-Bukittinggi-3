import apiClient from "@/lib/axios/client";
import {
  ShopProduct,
  CheckoutPayload,
  OrderReceiptResponse,
  VoucherItem,
} from "../types/shop.types";

export const initialShopProducts: ShopProduct[] = [
  {
    id: "p_01",
    name: "Minyak Herba Sinergi (MHS 100ml)",
    category: "Perawatan & Herba",
    categoryKey: "filterCare",
    agentPrice: 30000,
    normalPrice: 45000,
    tpPoints: 10,
    stock: 45,
    rating: "4.9",
    sold: "2.4k+",
    description: "Minyak serbaguna alami dari aneka herba pilihan untuk pijat, urut, luka, dan kesehatan keluarga.",
  },
  {
    id: "p_02",
    name: "Madu Multiflora HNI 250g",
    category: "Nutrisi & Madu",
    categoryKey: "filterNutrition",
    agentPrice: 80000,
    normalPrice: 100000,
    tpPoints: 25,
    stock: 28,
    rating: "4.9",
    sold: "1.1k+",
    description: "Madu murni dari lebah Apis Mellifera yang mengumpulkan nektar dari aneka ragam bunga di alam bebas.",
  },
  {
    id: "p_03",
    name: "Kopi 7 Elemen (Sevel Coffee)",
    category: "Minuman Sehat",
    categoryKey: "filterBeverage",
    agentPrice: 90000,
    normalPrice: 110000,
    tpPoints: 25,
    stock: 60,
    rating: "5.0",
    sold: "3.8k+",
    description: "Kopi herba sinergi 7 elemen tanaman: biji, daun, kulit batang, akar, buah, bunga, dan gula aren.",
  },
  {
    id: "p_04",
    name: "Extra Food Hania (Fruit & Veg)",
    category: "Nutrisi & Suplemen",
    categoryKey: "filterNutrition",
    agentPrice: 60000,
    normalPrice: 80000,
    tpPoints: 20,
    stock: 35,
    rating: "4.8",
    sold: "950+",
    description: "Konsentrat makanan herbal alami kaya antioksidan dari sari 23 buah & sayuran pilihan.",
  },
  {
    id: "p_05",
    name: "Spirulina Kapsul Alami 60 Kapsul",
    category: "Kesehatan Tubuh",
    categoryKey: "filterHealth",
    agentPrice: 70000,
    normalPrice: 90000,
    tpPoints: 20,
    stock: 22,
    rating: "4.9",
    sold: "1.5k+",
    description: "Superfood ganggang hijau-biru bernutrisi lengkap untuk imunitas, vitalitas, dan regenerasi sel.",
  },
  {
    id: "p_06",
    name: "Pasta Gigi Herbal (PGH) Siwak & Sirih",
    category: "Perawatan & Kebersihan",
    categoryKey: "filterCare",
    agentPrice: 16000,
    normalPrice: 20000,
    tpPoints: 5,
    stock: 80,
    rating: "4.8",
    sold: "4.2k+",
    description: "Pasta gigi bebas detergen (SLS free) dengan ekstrak kayu siwak, daun sirih, dan mint segar.",
  },
];

let cachedDbVouchers: VoucherItem[] = [];

export const availableVouchers: VoucherItem[] = cachedDbVouchers;

export const shopApi = {
  getProducts: async (): Promise<ShopProduct[]> => {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/products");
      const list = res.data?.data ?? res.data;
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any) => ({
          id: String(item.id),
          name: String(item.name),
          sku: item.sku ? String(item.sku) : undefined,
          category: String(item.category || "Herbal"),
          categoryKey: "filterHealth",
          agentPrice: Number(item.allowAgentPrice === false ? item.normalPrice : (item.agentPrice || item.normalPrice)),
          normalPrice: Number(item.normalPrice),
          tpPoints: Number(item.tpPoints || 0),
          stock: Number(item.stock || 0),
          imageUrl: item.imageUrl || undefined,
          rating: item.rating ? String(item.rating) : "5.0",
          sold: item.sold ? String(item.sold) : "0",
          description: String(item.description || ""),
          isSeparable: Boolean(item.isSeparable),
          defaultBreakdownQty: item.defaultBreakdownQty ? Number(item.defaultBreakdownQty) : null,
          isFraction: Boolean(item.isFraction),
          parentProductId: item.parentProductId ? String(item.parentProductId) : null,
          allowAgentPrice: item.allowAgentPrice !== false,
        }));
      }
    } catch (err: any) {
      console.warn("[shopApi] Gagal memuat daftar produk dari API, menggunakan fallback:", err?.message);
    }
    return initialShopProducts;
  },

  getVouchers: async (): Promise<VoucherItem[]> => {
    try {
      const res = await apiClient.get<{ status: string; data: any[] }>("/vouchers");
      const list = res.data?.data ?? res.data;
      if (Array.isArray(list)) {
        cachedDbVouchers = list.map((item: any) => ({
          id: String(item.id || item.code),
          code: String(item.code || "").toUpperCase(),
          title: String(item.title || "Voucher Diskon"),
          description: String(item.description || ""),
          discountType: item.discountType as any,
          discountValue: Number(item.discountValue) || 0,
          minPurchase: Number(item.minPurchase) || 0,
          maxDiscount: item.maxDiscount ? Number(item.maxDiscount) : undefined,
          validUntil: String(item.validUntil || ""),
          isUsed: Boolean(item.isUsed),
        }));
        return cachedDbVouchers;
      }
    } catch (err: any) {
      console.warn("[shopApi] Gagal memuat vouchers dari backend:", err?.message);
    }
    return cachedDbVouchers;
  },

  executeCheckout: async (
    payload: CheckoutPayload,
    userContext?: {
      userName?: string;
      hniMemberId?: string;
      isAgent?: boolean;
    }
  ): Promise<OrderReceiptResponse> => {
    // Simulasi delay checkout request
    await new Promise((resolve) => setTimeout(resolve, 600));

    const isAgent = userContext?.isAgent ?? false;
    let subtotal = 0;
    let totalTpPoints = 0;

    const receiptItems = payload.items.map((item) => {
      const prod = initialShopProducts.find((p) => p.id === item.productId);
      const unitPrice = prod
        ? isAgent
          ? prod.agentPrice
          : prod.normalPrice
        : 50000;
      const tpPoints = prod && isAgent ? prod.tpPoints : 0;
      const totalPrice = unitPrice * item.qty;

      subtotal += totalPrice;
      totalTpPoints += tpPoints * item.qty;

      return {
        productId: item.productId,
        productName: prod?.name || "Produk Herbal HNI",
        qty: item.qty,
        unitPrice,
        tpPoints,
        totalPrice,
      };
    });

    // Kalkulasi voucher jika ada
    let discountAmount = 0;
    if (payload.voucherCode) {
      const v = cachedDbVouchers.find((voc) => voc.code === payload.voucherCode);
      if (v) {
        if (v.discountType === "FIXED") {
          discountAmount = Math.min(v.discountValue, subtotal);
        } else if (v.discountType === "PERCENTAGE") {
          const calc = (subtotal * v.discountValue) / 100;
          discountAmount = v.maxDiscount ? Math.min(calc, v.maxDiscount) : calc;
        } else if (v.discountType === "SHIPPING_SUBSIDY") {
          discountAmount = Math.min(v.discountValue, payload.shippingCost);
        }
      }
    }

    const totalAmount = Math.max(0, subtotal + payload.shippingCost - discountAmount);

    // Menentukan orderStatus sesuai alur spesifikasi
    // Semua metode pembayaran langsung PROCESSING (barang ready stok)
    // B2B_CREDIT: proses verifikasi plafon sudah dilakukan sebelumnya
    // CASH_STORE / QRIS / TRANSFER: barang langsung dipersiapkan
    const orderStatus = "PROCESSING";

    const paymentStatus =
      payload.paymentMethod === "B2B_CREDIT"
        ? "TEMPO_ACTIVE"
        : "UNPAID";

    const randomOrderNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BC3-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${randomOrderNum}`;

    const receipt: OrderReceiptResponse = {
      id: `ord_${Date.now()}`,
      orderNumber,
      userName: userContext?.userName || "Mitra HNI Bukittinggi",
      hniMemberId: userContext?.hniMemberId,
      isAgentPriceApplied: isAgent,
      shippingType: payload.shippingType,
      shippingAddressText:
        payload.shippingType === "DELIVERY"
          ? payload.notes || "Alamat Pengiriman Utama Terdaftar"
          : "Outlet Resmi BC HNI 3 Bukittinggi (Jl. Raya Bukittinggi - Payakumbuh)",
      subtotal,
      shippingCost: payload.shippingCost,
      discountAmount,
      totalAmount,
      totalTpPoints,
      paymentMethod: payload.paymentMethod,
      paymentStatus,
      orderStatus,
      createdAt: new Date().toISOString(),
      items: receiptItems,
    };

    return receipt;
  },
};
