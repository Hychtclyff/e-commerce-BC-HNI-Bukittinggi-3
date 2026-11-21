"use client";

import React, { useState, useMemo, useRef } from "react";
import type {
  StoreInventoryItem,
  StoreOrder,
  StoreCustomer,
  StoreAgent,
  StoreVoucher,
  PosOrderPayload,
  PosOrderItemPayload,
} from "../../../types/store.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { TijarahTabs } from "@/components/atom/tijarahTabs";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { OrderStatusBadge } from "../../molecules/OrderStatusBadge";
import { OrderDetailModal } from "../modals/OrderDetailModal";
import { checkoutApi } from "@/modules/checkout/api/checkout.api";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { showToast } from "@/utils/toast";
import { QRCodeSVG } from "qrcode.react";
import clsx from "clsx";
import {
  Search,
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  UserCheck,
  Printer,
  PackageCheck,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  RefreshCw,
  Ticket,
  Store,
  ArrowRight,
  History,
  Save,
  RotateCcw,
  Calculator,
  QrCode,
  Building2,
  Smartphone,
  Banknote,
  Wallet,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

export interface ICashierPanelProps {
  inventory: StoreInventoryItem[];
  orders: StoreOrder[];
  customers: StoreCustomer[];
  agents: StoreAgent[];
  vouchers: StoreVoucher[];
  isLoading?: boolean;
  onCreatePosOrder: (
    payload: PosOrderPayload,
  ) => Promise<{ order?: StoreOrder } | any>;
  onReadyForPickup: (orderId: string) => Promise<any>;
  onVerifyPickupOrder: (payload: {
    orderId: string;
    notes?: string;
  }) => Promise<any>;
  onOpenReceiptModal: (order: StoreOrder) => void;
  onOpenRejectModal: (order: StoreOrder) => void;
  onRefresh: () => void;
  isCreatingPosOrder?: boolean;
  isReadyingForPickup?: boolean;
  isVerifyingPickup?: boolean;
  initialSubTab?: "pos" | "pickup" | "history";
}

interface CartItem {
  product: StoreInventoryItem;
  quantity: number;
}

type PaymentGroupType = "CASH" | "QRIS" | "VA" | "EWALLET" | "B2B_CREDIT";

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const XENDIT_VA_BANKS = [
  { id: "VA_BSI", code: "BSI", label: "BSI Syariah Virtual Account" },
  { id: "VA_BCA", code: "BCA", label: "BCA Virtual Account" },
  { id: "VA_MANDIRI", code: "MANDIRI", label: "Mandiri Virtual Account" },
  { id: "VA_BRI", code: "BRI", label: "BRI Virtual Account (BRIVA)" },
  { id: "VA_BNI", code: "BNI", label: "BNI Virtual Account" },
  {
    id: "VA_MUAMALAT",
    code: "MUAMALAT",
    label: "Bank Muamalat Virtual Account",
  },
  { id: "VA_PERMATA", code: "PERMATA", label: "Permata Virtual Account" },
  { id: "VA_CIMB", code: "CIMB", label: "CIMB Niaga Virtual Account" },
] as const;

const XENDIT_EWALLETS = [
  { id: "EWALLET_GOPAY", code: "GOPAY", label: "GoPay" },
  { id: "EWALLET_SHOPEEPAY", code: "SHOPEEPAY", label: "ShopeePay" },
  { id: "EWALLET_DANA", code: "DANA", label: "DANA" },
  { id: "EWALLET_OVO", code: "OVO", label: "OVO" },
] as const;

export const CashierPanel: React.FC<ICashierPanelProps> = ({
  inventory,
  orders,
  customers,
  agents,
  vouchers,
  isLoading = false,
  onCreatePosOrder,
  onReadyForPickup,
  onVerifyPickupOrder,
  onOpenReceiptModal,
  onOpenRejectModal,
  onRefresh,
  isCreatingPosOrder = false,
  isReadyingForPickup = false,
  isVerifyingPickup = false,
  initialSubTab = "pos",
}) => {
  // ─── Mode Navigasi Kasir ───────────────────────────────────────────
  const [activeMode, setActiveMode] = useState<"pos" | "pickup" | "history">(
    initialSubTab,
  );

  // ─── State Header Operasional Stokis ───────────────────────────────
  const currentMonthName = useMemo(
    () => INDONESIAN_MONTHS[new Date().getMonth()] || "November",
    [],
  );
  const [agenStokId] = useState<string>("02862037");
  const [agenStokName] = useState<string>("BC HNI BUKITTINGGI 3");
  const [bulanCalon, setBulanCalon] = useState<string>(currentMonthName);

  // ─── State Pelanggan & Kategori Harga HNI ──────────────────────────
  const [customerType, setCustomerType] = useState<"AGEN" | "KONSUMEN">("AGEN");
  const [customerIdInput, setCustomerIdInput] = useState<string>("01093705");
  const [customerName, setCustomerName] = useState<string>(
    "NOVI ERNI LINDA NOFITA",
  );
  const [customerPhone, setCustomerPhone] = useState<string>("081267890123");
  const [customerAddress, setCustomerAddress] = useState<string>(
    "BUKITTINGGI SUMATERA BARAT",
  );
  const [isCustomerLookupOpen, setIsCustomerLookupOpen] =
    useState<boolean>(false);
  const [customerLookupQuery, setCustomerLookupQuery] = useState<string>("");

  // ─── State Input Cepat Daftar Belanja & Katalog ────────────────────
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [entryQty, setEntryQty] = useState<string>("1");
  const [barcodeScanInput, setBarcodeScanInput] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [cart, setCart] = useState<CartItem[]>([]);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // ─── State Pembayaran (Tunai Kasir + Xendit Gateway + Kasbon B2B) ──
  const [paymentGroup, setPaymentGroup] = useState<PaymentGroupType>("CASH");
  const [selectedVaMethod, setSelectedVaMethod] = useState<string>("VA_BSI");
  const [selectedEwalletMethod, setSelectedEwalletMethod] =
    useState<string>("EWALLET_GOPAY");
  const [cashReceivedInput, setCashReceivedInput] = useState<string>("");
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  // Modal Tagihan Xendit Aktif di Meja Kasir
  const [activeXenditOrder, setActiveXenditOrder] = useState<StoreOrder | null>(
    null,
  );
  const [isCheckingXendit, setIsCheckingXendit] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Pencarian Nota Cepat (Re-Print)
  const [invoiceSearchNo, setInvoiceSearchNo] = useState<string>("");
  const [lastSavedOrder, setLastSavedOrder] = useState<StoreOrder | null>(null);

  // ─── State Task Pickup (Ambil di Toko) ─────────────────────────────
  const [pickupSearch, setPickupSearch] = useState("");
  const [pickupStatusFilter, setPickupStatusFilter] = useState<
    "ACTIVE" | "NEEDS_PREP" | "READY" | "COMPLETED" | "ALL"
  >("ACTIVE");
  const [selectedOrderForDetail, setSelectedOrderForDetail] =
    useState<StoreOrder | null>(null);
  const [handoverTargetOrder, setHandoverTargetOrder] =
    useState<StoreOrder | null>(null);
  const [handoverVerifyCode, setHandoverVerifyCode] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");

  // ─── Metode Pembayaran Final yang Dikirim ke Backend/Xendit ────────
  const effectivePaymentMethod = useMemo(() => {
    if (paymentGroup === "CASH") return "CASH";
    if (paymentGroup === "QRIS") return "QRIS";
    if (paymentGroup === "VA") return selectedVaMethod;
    if (paymentGroup === "EWALLET") return selectedEwalletMethod;
    return "B2B_CREDIT";
  }, [paymentGroup, selectedVaMethod, selectedEwalletMethod]);

  const isXenditSelected =
    paymentGroup === "QRIS" ||
    paymentGroup === "VA" ||
    paymentGroup === "EWALLET";

  // ─── Helper Identifikasi Order Pickup vs Walk-In POS ───────────────
  const isPosWalkInOrder = (o: StoreOrder) =>
    o.orderNumber.startsWith("POS-") ||
    Boolean(o.shippingMethod && /walk-in|pos/i.test(o.shippingMethod));

  const isOnlinePickupOrder = (o: StoreOrder) =>
    !isPosWalkInOrder(o) &&
    (o.fulfillmentType === "PICKUP" ||
      Boolean(o.shippingMethod && /pickup|ambil/i.test(o.shippingMethod)));

  const pickupOrders = useMemo(
    () => orders.filter(isOnlinePickupOrder),
    [orders],
  );

  const pickupStats = useMemo(() => {
    const needsPrep = pickupOrders.filter(
      (o) =>
        o.status === "PENDING" ||
        o.status === "PAID" ||
        o.status === "PROCESSING",
    ).length;
    const readyAtCounter = pickupOrders.filter(
      (o) => o.status === "READY_FOR_PICKUP",
    ).length;
    const completed = pickupOrders.filter(
      (o) => o.status === "COMPLETED",
    ).length;
    return {
      activeTotal: needsPrep + readyAtCounter,
      needsPrep,
      readyAtCounter,
      completed,
      allTotal: pickupOrders.length,
    };
  }, [pickupOrders]);

  const filteredPickupOrders = useMemo(() => {
    return pickupOrders.filter((ord) => {
      if (pickupStatusFilter === "ACTIVE") {
        if (
          ord.status !== "PENDING" &&
          ord.status !== "PAID" &&
          ord.status !== "PROCESSING" &&
          ord.status !== "READY_FOR_PICKUP"
        ) {
          return false;
        }
      } else if (pickupStatusFilter === "NEEDS_PREP") {
        if (
          ord.status !== "PENDING" &&
          ord.status !== "PAID" &&
          ord.status !== "PROCESSING"
        ) {
          return false;
        }
      } else if (pickupStatusFilter === "READY") {
        if (ord.status !== "READY_FOR_PICKUP") return false;
      } else if (pickupStatusFilter === "COMPLETED") {
        if (ord.status !== "COMPLETED") return false;
      }

      if (!pickupSearch.trim()) return true;
      const q = pickupSearch.toLowerCase();
      return (
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        (ord.customerPhone && ord.customerPhone.toLowerCase().includes(q))
      );
    });
  }, [pickupOrders, pickupStatusFilter, pickupSearch]);

  const cashierHistoryOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        isPosWalkInOrder(o) ||
        (isOnlinePickupOrder(o) && o.status === "COMPLETED"),
    );
  }, [orders]);

  // ─── Direktori Member / Pelanggan HNI ──────────────────────────────
  const memberDirectory = useMemo(() => {
    const list: Array<{
      key: string;
      hniId: string;
      name: string;
      phone: string;
      address: string;
      type: "AGEN" | "KONSUMEN";
    }> = [
      {
        key: "DEFAULT-NOVI",
        hniId: "01093705",
        name: "NOVI ERNI LINDA NOFITA",
        phone: "081267890123",
        address: "BUKITTINGGI SUMATERA BARAT",
        type: "AGEN",
      },
    ];

    agents.forEach((ag) => {
      const idCode = ag.hniMemberId || ag.id;
      if (!list.some((m) => m.hniId === idCode)) {
        list.push({
          key: `AG-${ag.id}`,
          hniId: idCode,
          name: ag.name.toUpperCase(),
          phone: ag.phoneNumber || "",
          address: "BUKITTINGGI SUMATERA BARAT",
          type: ag.tier === "DC" || ag.tier === "BC" ? "AGEN" : "KONSUMEN",
        });
      }
    });

    customers.forEach((c) => {
      const idCode = c.hniMemberId || c.id;
      if (!list.some((m) => m.name.toLowerCase() === c.name.toLowerCase())) {
        list.push({
          key: `CUST-${c.id}`,
          hniId: idCode,
          name: c.name.toUpperCase(),
          phone: c.phone || "",
          address: "BUKITTINGGI SUMATERA BARAT",
          type: c.hniMemberId ? "AGEN" : "KONSUMEN",
        });
      }
    });

    return list;
  }, [agents, customers]);

  const filteredMembers = useMemo(() => {
    const q = customerLookupQuery.trim().toLowerCase();
    if (!q) return memberDirectory;
    return memberDirectory.filter(
      (m) =>
        m.hniId.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q),
    );
  }, [memberDirectory, customerLookupQuery]);

  const handleCustomerIdLookup = (rawId: string) => {
    setCustomerIdInput(rawId);
    const q = rawId.trim().toLowerCase();
    if (!q) return;
    const match = memberDirectory.find(
      (m) => m.hniId.toLowerCase() === q || m.name.toLowerCase() === q,
    );
    if (match) {
      setCustomerName(match.name);
      setCustomerPhone(match.phone);
      setCustomerAddress(match.address);
      setCustomerType(match.type);
    }
  };

  // ─── Harga & Value Point Aktif Berdasarkan Kategori ────────────────
  const getActiveUnitPrice = (product: StoreInventoryItem) => {
    if (customerType === "KONSUMEN") {
      return product.regularPrice;
    }
    if (product.isFraction && product.allowAgentPrice === false) {
      return product.regularPrice;
    }
    return product.agentPrice || product.regularPrice;
  };

  const getActiveUnitPoints = (product: StoreInventoryItem) => {
    if (product.isFraction) return 0;
    return product.points || 0;
  };

  const selectedEntryProduct = useMemo(
    () => inventory.find((it) => it.id === selectedProductId) || null,
    [inventory, selectedProductId],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [inventory]);

  const filteredQuickCatalog = useMemo(() => {
    return inventory.filter((it) => {
      if (selectedCategory !== "ALL" && it.category !== selectedCategory)
        return false;
      if (!barcodeScanInput.trim()) return true;
      const q = barcodeScanInput.trim().toLowerCase();
      return (
        it.sku.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        (it.barcode && it.barcode.toLowerCase().includes(q))
      );
    });
  }, [inventory, selectedCategory, barcodeScanInput]);

  // ─── Operasi Daftar Belanja (Tambah, Hapus, Update Qty) ────────────
  const addProductWithQty = (product: StoreInventoryItem, qtyToAdd: number) => {
    const availableStock = product.physicalStock ?? product.stock;
    if (availableStock <= 0) {
      showToast.warning(
        "Stok Habis",
        `Stok fisik ${product.name} sedang kosong di gudang.`,
      );
      return;
    }
    const cleanQty = Math.max(1, qtyToAdd);

    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + cleanQty;
        if (nextQty > availableStock) {
          showToast.warning(
            "Batas Stok Gudang",
            `Sisa stok ${product.name} hanya ${availableStock} ${product.unit || "pcs"}.`,
          );
          return prev;
        }
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: nextQty } : it,
        );
      }
      if (cleanQty > availableStock) {
        showToast.warning(
          "Batas Stok Gudang",
          `Sisa stok ${product.name} hanya ${availableStock} ${product.unit || "pcs"}.`,
        );
        return prev;
      }
      return [...prev, { product, quantity: cleanQty }];
    });
  };

  const handleAddEntryToCart = () => {
    if (!selectedEntryProduct) {
      showToast.warning(
        "Pilih Produk",
        "Pilih produk pada kolom Kode / Nama Produk terlebih dahulu.",
      );
      return;
    }
    const qty = Math.max(1, parseInt(entryQty, 10) || 1);
    addProductWithQty(selectedEntryProduct, qty);
    setEntryQty("1");
  };

  const updateCartQuantity = (productId: string, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((it) => it.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((it) => {
        if (it.product.id !== productId) return it;
        const maxStock = it.product.physicalStock ?? it.product.stock;
        return { ...it, quantity: Math.min(nextQty, Math.max(1, maxStock)) };
      }),
    );
  };

  const handleBarcodeScanSubmit = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key !== "Enter" || !barcodeScanInput.trim()) return;
    e.preventDefault();
    const q = barcodeScanInput.trim().toLowerCase();
    const exactMatch = inventory.find(
      (it) =>
        it.sku.toLowerCase() === q ||
        (it.barcode && it.barcode.toLowerCase() === q),
    );
    if (exactMatch) {
      addProductWithQty(exactMatch, 1);
      setBarcodeScanInput("");
      return;
    }
    if (filteredQuickCatalog.length === 1) {
      addProductWithQty(filteredQuickCatalog[0], 1);
      setBarcodeScanInput("");
    }
  };

  // ─── Perhitungan Subtotal, Value Point, Voucher & Uang Cash ────────
  const activeVouchers = useMemo(
    () => vouchers.filter((v) => v.isActive && v.usedCount < v.quota),
    [vouchers],
  );

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, it) => sum + getActiveUnitPrice(it.product) * it.quantity,
      0,
    );
    const totalPoints = cart.reduce(
      (sum, it) => sum + getActiveUnitPoints(it.product) * it.quantity,
      0,
    );
    const totalItems = cart.reduce((sum, it) => sum + it.quantity, 0);
    const discountAmount = Math.min(subtotal, Math.max(0, appliedDiscount));
    const grandTotal = Math.max(0, subtotal - discountAmount);

    const effectiveCash =
      cashReceivedInput.trim() !== ""
        ? Number(cashReceivedInput.replace(/\D/g, "")) || 0
        : grandTotal;
    const changeAmount =
      paymentGroup === "CASH" ? Math.max(0, effectiveCash - grandTotal) : 0;
    const isCashSufficient =
      paymentGroup !== "CASH" || effectiveCash >= grandTotal;

    return {
      subtotal,
      totalPoints,
      totalItems,
      discountAmount,
      grandTotal,
      effectiveCash,
      changeAmount,
      isCashSufficient,
    };
  }, [cart, customerType, appliedDiscount, cashReceivedInput, paymentGroup]);

  const handleApplyVoucher = () => {
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) {
      showToast.warning(
        "Kode Voucher Kosong",
        "Masukkan kode voucher terlebih dahulu.",
      );
      return;
    }
    const found = activeVouchers.find((v) => v.code.toUpperCase() === code);
    if (!found) {
      showToast.error(
        "Voucher Tidak Valid",
        `Kode voucher "${code}" tidak ditemukan atau kuota habis.`,
      );
      return;
    }
    if (cartSummary.subtotal < found.minPurchase) {
      showToast.warning(
        "Belum Mencapai Minimum Belanja",
        `Minimal belanja untuk voucher ${found.code} adalah ${formatCurrency(found.minPurchase)}.`,
      );
      return;
    }
    const disc =
      found.discountType === "PERCENT"
        ? Math.round((cartSummary.subtotal * found.discountValue) / 100)
        : found.discountValue;
    setAppliedDiscount(disc);
    showToast.success(
      "Voucher Diterapkan",
      `Potongan diskon ${formatCurrency(disc)} diterapkan.`,
    );
  };

  const handleResetForm = () => {
    setCart([]);
    setSelectedProductId("");
    setEntryQty("1");
    setVoucherCodeInput("");
    setAppliedDiscount(0);
    setCashReceivedInput("");
  };

  // ─── Proses Simpan Transaksi Kasir (Tunai / Xendit / Kasbon) ───────
  const handleSaveTransaction = async () => {
    if (cart.length === 0) {
      showToast.warning(
        "Daftar Belanja Kosong",
        "Tambahkan minimal 1 produk ke Daftar Belanja.",
      );
      return;
    }
    if (!cartSummary.isCashSufficient) {
      showToast.warning(
        "Nominal Tunai Kurang",
        "Uang tunai yang diterima lebih kecil dari total tagihan.",
      );
      return;
    }
    if (paymentGroup === "B2B_CREDIT" && customerType === "KONSUMEN") {
      showToast.warning(
        "Kasbon Khusus Agen/Stokis",
        "Pilih kategori Agen atau Stokis untuk menggunakan pembayaran Kasbon B2B.",
      );
      return;
    }

    const itemsPayload: PosOrderItemPayload[] = cart.map((it) => ({
      productId: it.product.id,
      sku: it.product.sku,
      productName: it.product.name,
      quantity: it.quantity,
      price: getActiveUnitPrice(it.product),
      points: getActiveUnitPoints(it.product),
    }));

    const notesSummary = [
      `Transaksi Kasir (${agenStokId} - ${agenStokName})`,
      `ID HNI: ${customerIdInput || "-"}`,
      `Domisili: ${customerAddress || "-"}`,
      `Bulan Poin: ${bulanCalon}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const payload: PosOrderPayload = {
      customerName: customerName.trim() || "PELANGGAN HNI",
      customerPhone: customerPhone.trim() || "-",
      customerType,
      hniMemberId: customerIdInput.trim() || undefined,
      paymentMethod: effectivePaymentMethod,
      cashReceived:
        paymentGroup === "CASH"
          ? cartSummary.effectiveCash
          : cartSummary.grandTotal,
      changeAmount: paymentGroup === "CASH" ? cartSummary.changeAmount : 0,
      discountAmount: cartSummary.discountAmount,
      voucherCode: voucherCodeInput.trim() || undefined,
      notes: notesSummary,
      items: itemsPayload,
    };

    const result = await onCreatePosOrder(payload);
    if (result?.order) {
      setLastSavedOrder(result.order);
      setInvoiceSearchNo(result.order.orderNumber);

      if (isXenditSelected) {
        // Buka modal instruksi QRIS / VA / E-Wallet Xendit di layar kasir
        setActiveXenditOrder(result.order);
      } else {
        // Tunai / Kasbon langsung buka modal cetak struk thermal
        onOpenReceiptModal(result.order);
      }
    }
    handleResetForm();
  };

  // ─── Sinkronisasi & Konfirmasi Pelunasan Xendit di Kasir ───────────
  const handleSyncXenditStatus = async () => {
    if (!activeXenditOrder) return;
    try {
      setIsCheckingXendit(true);
      const res = await checkoutApi.syncXenditPayment(activeXenditOrder.id);
      if (
        res?.paymentStatus === "PAID" ||
        res?.status === "PAID" ||
        res?.status === "SETTLED"
      ) {
        showToast.success(
          "Pembayaran Xendit Lunas",
          "Dana telah diterima melalui gateway Xendit.",
        );
        const paidOrder: StoreOrder = {
          ...activeXenditOrder,
          status: "COMPLETED",
          paymentStatus: "PAID",
        };
        setActiveXenditOrder(null);
        onRefresh();
        onOpenReceiptModal(paidOrder);
      } else {
        showToast.info(
          "Menunggu Pelunasan Pelanggan",
          "Tagihan Xendit masih berstatus menunggu pembayaran.",
        );
      }
    } catch {
      showToast.info(
        "Cek Gateway Xendit",
        "Jika pelanggan sudah menyelesaikan pembayaran di aplikasi, klik Konfirmasi Lunas & Cetak Struk.",
      );
    } finally {
      setIsCheckingXendit(false);
    }
  };

  const handleConfirmXenditPaidAtCounter = async () => {
    if (!activeXenditOrder) return;
    await onVerifyPickupOrder({
      orderId: activeXenditOrder.id,
      notes: `Pembayaran Xendit (${activeXenditOrder.paymentMethod}) dikonfirmasi lunas di meja kasir`,
    });
    const completedSnapshot: StoreOrder = {
      ...activeXenditOrder,
      status: "COMPLETED",
      paymentStatus: "PAID",
    };
    setActiveXenditOrder(null);
    onOpenReceiptModal(completedSnapshot);
  };

  const handleReprintInvoice = () => {
    const q = invoiceSearchNo.trim().toLowerCase();
    if (!q) {
      if (lastSavedOrder) {
        onOpenReceiptModal(lastSavedOrder);
        return;
      }
      showToast.warning(
        "Masukkan No. Nota",
        "Ketik nomor nota pada kolom pencarian struk.",
      );
      return;
    }
    const found = orders.find((o) => o.orderNumber.toLowerCase().includes(q));
    if (!found) {
      showToast.error(
        "Nota Tidak Ditemukan",
        `Nomor nota "${invoiceSearchNo}" tidak ditemukan.`,
      );
      return;
    }
    onOpenReceiptModal(found);
  };

  // ─── Konfirmasi Serah Terima Pickup di Kasir ───────────────────────
  const handleConfirmPickupHandover = async () => {
    if (!handoverTargetOrder) return;
    const notesParts = [
      "Diserahkan langsung di meja kasir BC 3",
      handoverVerifyCode.trim()
        ? `Kode Verifikasi: ${handoverVerifyCode.trim()}`
        : null,
      handoverNotes.trim() || null,
    ].filter(Boolean);

    await onVerifyPickupOrder({
      orderId: handoverTargetOrder.id,
      notes: notesParts.join(" | "),
    });

    const completedOrderSnapshot: StoreOrder = {
      ...handoverTargetOrder,
      status: "COMPLETED",
      paymentStatus:
        handoverTargetOrder.paymentStatus === "UNPAID"
          ? "PAID"
          : handoverTargetOrder.paymentStatus,
    };

    setHandoverTargetOrder(null);
    setHandoverVerifyCode("");
    setHandoverNotes("");
    onOpenReceiptModal(completedOrderSnapshot);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Top Workspace Bar */}
      <div className="bg-surface border border-border-subtle rounded-lg px-4 py-3 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-sage text-white flex items-center justify-center shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                Kasir Agen Stok &amp; Serah Terima Pickup
              </h2>
              <TijarahBadge tijarahVariant="primary" size="sm">
                {agenStokName} ({agenStokId})
              </TijarahBadge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Input transaksi belanja langsung di gerai (harga Agen HA /
              Konsumen HK + Poin TP) dengan pembayaran Tunai atau Xendit.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TijarahTabs
            selectedKey={activeMode}
            onSelectionChange={(key) =>
              setActiveMode(String(key) as "pos" | "pickup" | "history")
            }
            items={[
              {
                id: "pos",
                label: (
                  <span className="flex items-center gap-1.5">
                    <ScanBarcode className="w-3.5 h-3.5" />
                    <span>Kasir Toko (POS)</span>
                    {cartSummary.totalItems > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-primary-sage text-white text-[10px] font-bold tabular-nums">
                        {cartSummary.totalItems}
                      </span>
                    )}
                  </span>
                ),
              },
              {
                id: "pickup",
                label: (
                  <span className="flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Task Pickup Online</span>
                    {pickupStats.activeTotal > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-status-warning text-white text-[10px] font-bold tabular-nums">
                        {pickupStats.activeTotal}
                      </span>
                    )}
                  </span>
                ),
              },
              {
                id: "history",
                label: (
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Riwayat Nota ({cashierHistoryOrders.length})</span>
                  </span>
                ),
              },
            ]}
          />

          <TijarahButton
            type="button"
            tijarahVariant="outline"
            size="sm"
            onClick={onRefresh}
            isDisabled={isLoading}
            className="text-xs font-medium h-8 px-2.5 rounded-md flex items-center gap-1.5"
          >
            <RefreshCw
              className={clsx("w-3.5 h-3.5", isLoading && "animate-spin")}
            />
            <span>Segarkan</span>
          </TijarahButton>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODE 1: TERMINAL KASIR MODERN (ADAPTASI EFISIEN ALUR HSIS + XENDIT)   */}
      {/* ===================================================================== */}
      {activeMode === "pos" && (
        <div className="flex flex-col gap-3.5">
          {/* Notifikasi ringkas bila ada pesanan Pickup online yang menunggu di kasir */}
          {pickupStats.activeTotal > 0 && (
            <div className="bg-[var(--badge-warning-bg)] border border-[var(--badge-warning-border)] rounded-lg px-3.5 py-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <PackageCheck className="w-4 h-4 text-[var(--badge-warning-text)] shrink-0" />
                <span className="text-xs text-[var(--badge-warning-text)] font-medium truncate">
                  Terdapat{" "}
                  <strong>
                    {pickupStats.activeTotal} pesanan online metode Pickup
                  </strong>{" "}
                  yang menunggu disiapkan atau diserahkan di kasir.
                </span>
              </div>
              <TijarahButton
                type="button"
                tijarahVariant="outline"
                size="sm"
                onClick={() => setActiveMode("pickup")}
                className="text-[11px] font-semibold h-7 px-2.5 rounded shrink-0 bg-surface"
              >
                <span>Buka Task Pickup ({pickupStats.activeTotal})</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </TijarahButton>
            </div>
          )}

          {/* Layout 2 Kolom Modern & Efisien: Kiri (7/12 Input & Daftar Belanja) | Kanan (5/12 Customer HNI & Pembayaran Xendit) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* ─────────────────────────────────────────────────────────────── */}
            {/* KOLOM KIRI (7/12): Input Cepat Produk, Katalog & Daftar Belanja */}
            {/* ─────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-7 flex flex-col gap-3.5">
              {/* 1. Card Input Cepat SKU / Barcode & Pilih Produk */}

              <TijarahCard
                tijarahVariant="default"
                className="p-3.5 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-primary-sage" />
                    <span>Kategori &amp; Identitas Pelanggan HNI</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-text-muted font-medium">
                      Bulan Poin:
                    </span>
                    <select
                      value={bulanCalon}
                      onChange={(e) => setBulanCalon(e.target.value)}
                      className="h-6 px-1.5 rounded border border-border-subtle bg-canvas text-[11px] font-semibold text-text-primary focus:outline-none"
                    >
                      {INDONESIAN_MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Segmented Selector Kategori: AGEN vs STOCKIST vs KONSUMEN */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-canvas rounded-lg border border-border-subtle">
                  {(
                    [
                      { id: "AGEN", label: "Agen (Harga HA)" },
                      { id: "KONSUMEN", label: "Konsumen (HK)" },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCustomerType(cat.id);
                        if (
                          cat.id === "KONSUMEN" &&
                          paymentGroup === "B2B_CREDIT"
                        ) {
                          setPaymentGroup("CASH");
                        }
                      }}
                      className={clsx(
                        "py-1.5 px-2 rounded-md text-[11px] font-semibold transition-colors cursor-pointer text-center",
                        customerType === cat.id
                          ? "bg-primary-sage text-white shadow-2xs"
                          : "text-text-muted hover:text-text-primary",
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Input ID Member HNI + Tombol Lookup + Nama + Alamat */}
                <div className="space-y-2">
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5">
                    <div className="w-full sm:w-36 shrink-0">
                      <input
                        type="text"
                        value={customerIdInput}
                        onChange={(e) => handleCustomerIdLookup(e.target.value)}
                        placeholder="ID Member HNI"
                        className="w-full h-8 px-2.5 rounded-lg border border-border-subtle bg-surface font-mono text-xs font-bold text-text-primary focus:outline-none focus:border-primary-sage"
                      />
                    </div>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) =>
                        setCustomerName(e.target.value.toUpperCase())
                      }
                      placeholder="Nama Pelanggan / Agen"
                      className="flex-1 min-w-0 h-8 px-2.5 rounded-lg border border-border-subtle bg-surface text-xs font-semibold text-text-primary uppercase focus:outline-none focus:border-primary-sage"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomerLookupOpen(true)}
                      title="Cari dari Direktori Agen / Pelanggan"
                      className="h-8 px-2.5 rounded-lg border border-border-subtle bg-canvas hover:bg-surface text-primary-sage text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Cari</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="No. HP / WhatsApp"
                      className="h-7.5 px-2.5 rounded-lg border border-border-subtle bg-canvas text-xs text-text-primary focus:outline-none focus:border-primary-sage focus:bg-surface"
                    />
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) =>
                        setCustomerAddress(e.target.value.toUpperCase())
                      }
                      placeholder="Domisili / Kota"
                      className="h-7.5 px-2.5 rounded-lg border border-border-subtle bg-canvas text-xs text-text-primary uppercase focus:outline-none focus:border-primary-sage focus:bg-surface"
                    />
                  </div>
                </div>
              </TijarahCard>

              <TijarahCard
                tijarahVariant="default"
                className="p-3.5 rounded-lg space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
                  <div className="flex items-center gap-2">
                    <ScanBarcode className="w-4 h-4 text-primary-sage" />
                    <span className="text-xs font-bold text-text-primary">
                      Input Produk ke Daftar Belanja
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted">
                    Mode Harga Aktif:{" "}
                    <strong className="text-primary-sage">
                      {customerType === "KONSUMEN"
                        ? "Harga Konsumen (HK)"
                        : "Harga Mitra Agen / Stokis (HA + Poin TP)"}
                    </strong>
                  </span>
                </div>

                {/* Baris Input Cepat: Pilih Produk Dropdown + Qty + Tombol Tambah + Scan Barcode */}
                {/* <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-5">
                    <TijarahSelect
                      aria-label="Pilih Kode atau Nama Produk"
                      placeholder="Pilih Kode / Nama Produk..."
                      selectedKey={selectedProductId}
                      onSelectionChange={(k) => setSelectedProductId(String(k))}
                      className="w-full"
                    >
                      {inventory.map((it) => {
                        const unitPrice = getActiveUnitPrice(it);
                        return (
                          <TijarahSelect.Item
                            key={it.id}
                            id={it.id}
                            textValue={`${it.sku} - ${it.name}`}
                          >
                            {`${it.sku} - ${it.name} (${formatCurrency(unitPrice)})`}
                          </TijarahSelect.Item>
                        );
                      })}
                    </TijarahSelect>
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      readOnly
                      value={
                        selectedEntryProduct
                          ? `${formatCurrency(getActiveUnitPrice(selectedEntryProduct))} / ${getActiveUnitPoints(selectedEntryProduct)} TP`
                          : "Harga / TP"
                      }
                      className="w-full h-8.5 px-2.5 rounded-lg border border-border-subtle bg-canvas text-right font-mono text-[11px] font-semibold text-text-muted"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min={1}
                      value={entryQty}
                      onChange={(e) => setEntryQty(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddEntryToCart();
                        }
                      }}
                      placeholder="Qty"
                      className="w-full h-8.5 px-2.5 rounded-lg border border-border-subtle bg-surface text-center font-mono text-xs font-bold text-text-primary focus:outline-none focus:border-primary-sage"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <TijarahButton
                      type="button"
                      tijarahVariant="primary"
                      size="sm"
                      onClick={handleAddEntryToCart}
                      className="w-full h-8.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Item</span>
                    </TijarahButton>
                  </div>
                </div> */}

                {/* Baris Pencarian & Filter Katalog Cepat */}
                <div className="pt-1 space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        value={barcodeScanInput}
                        onChange={(e) => setBarcodeScanInput(e.target.value)}
                        onKeyDown={handleBarcodeScanSubmit}
                        placeholder="Scan barcode atau ketik kode SKU / nama produk (Enter untuk tambah otomatis)..."
                        className="w-full h-8 pl-8 pr-3 rounded-lg border border-border-subtle bg-canvas text-xs text-text-primary focus:outline-none focus:border-primary-sage focus:bg-surface"
                      />
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={clsx(
                            "px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer border",
                            selectedCategory === cat
                              ? "bg-primary-sage text-white border-primary-sage font-semibold"
                              : "bg-canvas text-text-muted border-border-subtle hover:text-text-primary",
                          )}
                        >
                          {cat === "ALL" ? "Semua" : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid Katalog Klik Cepat (Compact Pills) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                    {filteredQuickCatalog.map((item) => {
                      const stock = item.physicalStock ?? item.stock;
                      const isOut = stock <= 0;
                      const activePrice = getActiveUnitPrice(item);
                      const inCartQty =
                        cart.find((c) => c.product.id === item.id)?.quantity ||
                        0;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={isOut}
                          onClick={() => addProductWithQty(item, 1)}
                          className={clsx(
                            "p-2 rounded-lg border text-left transition-colors flex flex-col justify-between gap-1 cursor-pointer",
                            isOut
                              ? "opacity-45 bg-canvas border-border-subtle cursor-not-allowed"
                              : inCartQty > 0
                                ? "bg-[var(--badge-primary-bg)]/60 border-[var(--badge-primary-border)]"
                                : "bg-surface hover:bg-canvas border-border-subtle hover:border-primary-sage/50",
                          )}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className="font-mono text-[10px] font-bold text-primary-sage">
                              {item.sku}
                            </span>
                            <span className="text-[10px] text-text-muted tabular-nums">
                              Stok: {stock}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-text-primary truncate w-full">
                            {item.name}
                          </div>
                          <div className="flex items-center justify-between gap-1 w-full pt-0.5">
                            <span className="text-[11px] font-bold text-text-primary tabular-nums">
                              {formatCurrency(activePrice)}
                            </span>
                            <span className="text-[10px] font-semibold text-primary-sage tabular-nums">
                              {item.isFraction ? "0 TP" : `${item.points} TP`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </TijarahCard>

              {/* 2. Tabel Daftar Belanja (Data-Dense Modern Table) */}
              <TijarahCard
                tijarahVariant="default"
                className="rounded-lg overflow-hidden"
              >
                <div className="px-4 py-2.5 border-b border-border-subtle bg-canvas flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">
                      Daftar Belanja ({cartSummary.totalItems} Item)
                    </span>
                    {cartSummary.totalPoints > 0 && (
                      <TijarahBadge tijarahVariant="primary" size="sm">
                        Point Value:{" "}
                        {cartSummary.totalPoints.toLocaleString("id-ID")} TP
                      </TijarahBadge>
                    )}
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="text-[11px] font-semibold text-status-danger hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Kosongkan</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto min-h-[240px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle bg-canvas/60 text-text-muted uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3">Kode</th>
                        <th className="py-2.5 px-3">Nama Produk</th>
                        <th className="py-2.5 px-3 text-right">Value Point</th>
                        <th className="py-2.5 px-3 text-right">Harga</th>
                        <th className="py-2.5 px-3 text-center w-28">Jml</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {cart.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-16 text-center text-xs text-text-muted"
                          >
                            Belum ada item di Daftar Belanja. Pilih produk di
                            atas atau klik kartu produk untuk mulai transaksi.
                          </td>
                        </tr>
                      ) : (
                        cart.map(({ product, quantity }, idx) => {
                          const unitPrice = getActiveUnitPrice(product);
                          const unitPoints = getActiveUnitPoints(product);

                          return (
                            <tr
                              key={product.id}
                              className="hover:bg-canvas/50 transition-colors"
                            >
                              <td className="py-2.5 px-3 text-center font-mono text-text-muted">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-text-primary whitespace-nowrap">
                                {product.sku}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-text-primary">
                                {product.name}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-primary-sage font-semibold whitespace-nowrap">
                                {(unitPoints * quantity).toLocaleString(
                                  "id-ID",
                                )}{" "}
                                TP
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-text-primary whitespace-nowrap">
                                {formatCurrency(unitPrice)}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCartQuantity(
                                        product.id,
                                        quantity - 1,
                                      )
                                    }
                                    className="w-6 h-6 rounded border border-border-subtle bg-canvas hover:bg-surface flex items-center justify-center text-text-primary cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-7 text-center font-mono text-xs font-bold tabular-nums">
                                    {quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCartQuantity(
                                        product.id,
                                        quantity + 1,
                                      )
                                    }
                                    className="w-6 h-6 rounded border border-border-subtle bg-canvas hover:bg-surface flex items-center justify-center text-text-primary cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-text-primary whitespace-nowrap">
                                {formatCurrency(unitPrice * quantity)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateCartQuantity(product.id, 0)
                                  }
                                  className="text-text-muted hover:text-status-danger cursor-pointer p-1"
                                  title="Hapus baris"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Bar Cetak Ulang Nota Cepat */}
                <div className="px-4 py-2.5 bg-canvas border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-text-muted">
                      Cetak Ulang Nota (Invoice No):
                    </span>
                    <input
                      type="text"
                      value={invoiceSearchNo}
                      onChange={(e) => setInvoiceSearchNo(e.target.value)}
                      placeholder="POS-... / ORD-..."
                      className="h-7 w-40 px-2 rounded border border-border-subtle bg-surface font-mono text-xs text-text-primary focus:outline-none focus:border-primary-sage"
                    />
                    <TijarahButton
                      type="button"
                      tijarahVariant="outline"
                      size="sm"
                      onClick={handleReprintInvoice}
                      className="h-7 px-2.5 text-[11px] font-semibold rounded inline-flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Re-Print</span>
                    </TijarahButton>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="text-text-muted">
                      Item:{" "}
                      <strong className="text-text-primary">
                        {cartSummary.totalItems}
                      </strong>
                    </span>
                    <span className="text-text-muted">
                      Point Value:{" "}
                      <strong className="text-primary-sage">
                        {cartSummary.totalPoints.toLocaleString("id-ID")} TP
                      </strong>
                    </span>
                  </div>
                </div>
              </TijarahCard>
            </div>

            {/* ─────────────────────────────────────────────────────────────── */}
            {/* KOLOM KANAN (5/12): Pelanggan HNI & Pembayaran Terintegrasi Xendit */}
            {/* ─────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-5 flex flex-col gap-3.5">
              {/* 1. Card Data Pelanggan / Mitra Agen HNI */}

              {/* 2. Card Ringkasan Nominal & Metode Pembayaran (Tunai + Xendit Gateway + Kasbon) */}
              <TijarahCard
                tijarahVariant="default"
                className="p-4 rounded-lg space-y-3.5"
              >
                {/* Display Total Tagihan Besar & Jelas */}
                <div className="p-3.5 rounded-lg bg-canvas border border-border-subtle flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                      Total Tagihan Kasir
                    </span>
                    <span className="text-[11px] text-primary-sage font-semibold mt-0.5 block">
                      +{cartSummary.totalPoints.toLocaleString("id-ID")} Poin TP
                      HNI
                    </span>
                  </div>
                  <div className="text-right font-mono text-2xl sm:text-3xl font-black text-text-primary tabular-nums">
                    {formatCurrency(cartSummary.grandTotal)}
                  </div>
                </div>

                {/* Baris Voucher & Potongan Diskon */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center">
                  <div className="sm:col-span-5 flex items-center gap-1">
                    <input
                      type="text"
                      value={voucherCodeInput}
                      onChange={(e) =>
                        setVoucherCodeInput(e.target.value.toUpperCase())
                      }
                      placeholder="Kode Voucher..."
                      className="w-full h-8 px-2.5 rounded-lg border border-border-subtle bg-surface font-mono text-xs text-text-primary focus:outline-none focus:border-primary-sage"
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="h-8 px-2.5 rounded-lg border border-border-subtle bg-canvas hover:bg-surface text-[11px] font-semibold text-primary-sage shrink-0 cursor-pointer"
                    >
                      Pakai
                    </button>
                  </div>
                  <div className="sm:col-span-7 flex items-center gap-1.5">
                    <span className="text-[11px] text-text-muted shrink-0">
                      Diskon (Rp):
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={appliedDiscount}
                      onChange={(e) =>
                        setAppliedDiscount(Number(e.target.value) || 0)
                      }
                      className="w-full h-8 px-2.5 rounded-lg border border-border-subtle bg-surface text-right font-mono text-xs font-bold text-text-primary focus:outline-none focus:border-primary-sage"
                    />
                    {appliedDiscount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedDiscount(0);
                          setVoucherCodeInput("");
                        }}
                        className="text-[11px] text-status-danger hover:underline shrink-0 cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Pilihan Metode Pembayaran Terintegrasi (Tunai Kasir + Xendit Gateway + Kasbon B2B) */}
                <div className="space-y-2 pt-1 border-t border-border-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">
                      Metode Pembayaran
                    </span>
                    <span className="text-[10px] font-semibold text-text-muted">
                      Tunai &amp; Xendit Payment Gateway
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {(
                      [
                        {
                          id: "CASH",
                          label: "Tunai (Cash)",
                          sub: "Laci Kasir",
                          icon: <Banknote className="w-3.5 h-3.5" />,
                        },
                        {
                          id: "QRIS",
                          label: "QRIS Xendit",
                          sub: "Scan Instan",
                          icon: <QrCode className="w-3.5 h-3.5" />,
                        },
                        {
                          id: "VA",
                          label: "Virtual Account",
                          sub: "BSI / BCA / BRI",
                          icon: <Building2 className="w-3.5 h-3.5" />,
                        },
                        {
                          id: "EWALLET",
                          label: "E-Wallet",
                          sub: "GoPay / Shopee / DANA",
                          icon: <Smartphone className="w-3.5 h-3.5" />,
                        },
                        {
                          id: "B2B_CREDIT",
                          label: "Kasbon B2B",
                          sub: "Tempo H+14",
                          icon: <Wallet className="w-3.5 h-3.5" />,
                          disabled: customerType === "KONSUMEN",
                        },
                      ] as const
                    ).map((pm) => {
                      const active = paymentGroup === pm.id;
                      const isDisabled = "disabled" in pm && pm.disabled;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setPaymentGroup(pm.id)}
                          className={clsx(
                            "p-2 rounded-lg border text-left transition-colors cursor-pointer flex items-start gap-2",
                            active
                              ? "bg-[var(--badge-primary-bg)] border-[var(--badge-primary-border)] text-[var(--badge-primary-text)]"
                              : "bg-surface border-border-subtle text-text-primary hover:bg-canvas",
                            isDisabled && "opacity-40 cursor-not-allowed",
                          )}
                        >
                          <div className="mt-0.5 shrink-0 text-primary-sage">
                            {pm.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold leading-tight truncate">
                              {pm.label}
                            </div>
                            <div className="text-[10px] text-text-muted truncate">
                              {pm.sub}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Sub-Opsi 1: Kalkulator Uang Tunai (Saat CASH dipilih) */}
                  {paymentGroup === "CASH" && (
                    <div className="p-3 rounded-lg bg-canvas border border-border-subtle space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-text-muted">
                          Uang Cash Diterima:
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={
                              cashReceivedInput !== ""
                                ? cashReceivedInput
                                : cartSummary.grandTotal > 0
                                  ? String(cartSummary.grandTotal)
                                  : "0"
                            }
                            onChange={(e) =>
                              setCashReceivedInput(
                                e.target.value.replace(/[^\d]/g, ""),
                              )
                            }
                            className="w-36 h-8 px-2.5 rounded-lg border border-border-subtle bg-surface text-right font-mono text-xs font-bold text-text-primary focus:outline-none focus:border-primary-sage"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setCashReceivedInput(
                                String(cartSummary.grandTotal),
                              )
                            }
                            title="Set Uang Pas"
                            className="h-8 w-8 rounded-lg border border-border-subtle bg-surface hover:bg-canvas text-primary-sage flex items-center justify-center cursor-pointer"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setCashReceivedInput(String(cartSummary.grandTotal))
                          }
                          className="px-2 py-1 rounded bg-surface border border-border-subtle text-[10px] font-semibold text-text-primary hover:border-primary-sage cursor-pointer"
                        >
                          Uang Pas
                        </button>
                        {[50000, 100000, 150000, 200000].map((nom) => (
                          <button
                            key={nom}
                            type="button"
                            onClick={() => setCashReceivedInput(String(nom))}
                            className="px-2 py-1 rounded bg-surface border border-border-subtle text-[10px] font-semibold text-text-muted hover:text-text-primary cursor-pointer tabular-nums"
                          >
                            {formatCurrency(nom)}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-border-subtle text-xs">
                        <span className="font-semibold text-text-muted">
                          Uang Kembalian:
                        </span>
                        <span
                          className={clsx(
                            "font-mono text-sm font-bold tabular-nums",
                            cartSummary.isCashSufficient
                              ? "text-primary-sage"
                              : "text-status-danger",
                          )}
                        >
                          {cartSummary.isCashSufficient
                            ? formatCurrency(cartSummary.changeAmount)
                            : "Nominal Tunai Kurang"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Sub-Opsi 2: Pilihan Bank Virtual Account Xendit */}
                  {paymentGroup === "VA" && (
                    <div className="p-3 rounded-lg bg-canvas border border-border-subtle space-y-2">
                      <span className="text-[11px] font-semibold text-text-muted block">
                        Pilih Bank Virtual Account (Xendit):
                      </span>
                      <TijarahSelect
                        aria-label="Pilih Bank Virtual Account Xendit"
                        selectedKey={selectedVaMethod}
                        onSelectionChange={(k) =>
                          setSelectedVaMethod(String(k))
                        }
                        className="w-full"
                      >
                        {XENDIT_VA_BANKS.map((b) => (
                          <TijarahSelect.Item key={b.id} id={b.id}>
                            {b.label}
                          </TijarahSelect.Item>
                        ))}
                      </TijarahSelect>
                    </div>
                  )}

                  {/* Sub-Opsi 3: Pilihan E-Wallet Xendit */}
                  {paymentGroup === "EWALLET" && (
                    <div className="p-3 rounded-lg bg-canvas border border-border-subtle space-y-2">
                      <span className="text-[11px] font-semibold text-text-muted block">
                        Pilih Dompet Digital E-Wallet (Xendit):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {XENDIT_EWALLETS.map((ew) => (
                          <button
                            key={ew.id}
                            type="button"
                            onClick={() => setSelectedEwalletMethod(ew.id)}
                            className={clsx(
                              "py-1.5 px-2 rounded-md border text-xs font-semibold cursor-pointer transition-colors",
                              selectedEwalletMethod === ew.id
                                ? "bg-primary-sage text-white border-primary-sage"
                                : "bg-surface text-text-primary border-border-subtle",
                            )}
                          >
                            {ew.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub-Opsi 4: Info QRIS Dinamis Xendit */}
                  {paymentGroup === "QRIS" && (
                    <div className="p-2.5 rounded-lg bg-canvas border border-border-subtle text-[11px] text-text-muted flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-primary-sage shrink-0" />
                      <span>
                        Kode QRIS Xendit akan langsung ditampilkan di layar
                        kasir setelah menekan tombol proses di bawah.
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Bar: Simpan / Proses Pembayaran & Cetak Struk */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                  <div className="sm:col-span-8">
                    <TijarahButton
                      type="button"
                      tijarahVariant="primary"
                      isDisabled={cart.length === 0 || isCreatingPosOrder}
                      onClick={handleSaveTransaction}
                      className="w-full h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-2xs"
                    >
                      {isXenditSelected ? (
                        <>
                          <QrCode className="w-4 h-4" />
                          <span>
                            {isCreatingPosOrder
                              ? "Membuat Tagihan Xendit..."
                              : `Proses ${effectivePaymentMethod.replace("_", " ")} (Xendit)`}
                          </span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>
                            {isCreatingPosOrder
                              ? "Menyimpan Transaksi..."
                              : "Simpan & Cetak Struk Kasir"}
                          </span>
                        </>
                      )}
                    </TijarahButton>
                  </div>

                  <div className="sm:col-span-4">
                    <TijarahButton
                      type="button"
                      tijarahVariant="outline"
                      onClick={handleResetForm}
                      className="w-full h-10 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 text-text-muted hover:text-status-danger"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Batal</span>
                    </TijarahButton>
                  </div>
                </div>
              </TijarahCard>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE 2: TASK PICKUP PESANAN ONLINE (AMBIL DI TOKO)                    */}
      {/* ===================================================================== */}
      {activeMode === "pickup" && (
        <div className="flex flex-col gap-4">
          {/* 1. KPI Strip Task Pickup Kasir */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-surface border border-border-subtle rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-text-muted block">
                  Perlu Disiapkan Kasir
                </span>
                <span className="text-xl font-bold text-status-warning tabular-nums mt-0.5 block">
                  {pickupStats.needsPrep} Pesanan
                </span>
                <span className="text-[10px] text-text-muted">
                  Siapkan barang di meja kasir
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-surface border border-border-subtle rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-text-muted block">
                  Siap Diambil Pelanggan
                </span>
                <span className="text-xl font-bold text-primary-sage tabular-nums mt-0.5 block">
                  {pickupStats.readyAtCounter} Pesanan
                </span>
                <span className="text-[10px] text-text-muted">
                  Menunggu kedatangan pembeli di toko
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[var(--badge-primary-bg)] text-[var(--badge-primary-text)] flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-surface border border-border-subtle rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-text-muted block">
                  Telah Diserahkan (Selesai)
                </span>
                <span className="text-xl font-bold text-text-primary tabular-nums mt-0.5 block">
                  {pickupStats.completed} Pesanan
                </span>
                <span className="text-[10px] text-text-muted">
                  Terverifikasi oleh kasir toko
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-canvas text-status-success border border-border-subtle flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 2. Toolbar Filter & Scan Kode Pickup */}
          <TijarahCard
            tijarahVariant="default"
            className="p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {(
                [
                  {
                    id: "ACTIVE",
                    label: `Antrean Aktif (${pickupStats.activeTotal})`,
                  },
                  {
                    id: "NEEDS_PREP",
                    label: `Perlu Disiapkan (${pickupStats.needsPrep})`,
                  },
                  {
                    id: "READY",
                    label: `Siap Diambil (${pickupStats.readyAtCounter})`,
                  },
                  {
                    id: "COMPLETED",
                    label: `Selesai (${pickupStats.completed})`,
                  },
                  { id: "ALL", label: `Semua (${pickupStats.allTotal})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPickupStatusFilter(tab.id)}
                  className={clsx(
                    "px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border",
                    pickupStatusFilter === tab.id
                      ? "bg-primary-sage text-white border-primary-sage font-semibold"
                      : "bg-canvas text-text-muted border-border-subtle hover:text-text-primary",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <TijarahInput
                type="text"
                value={pickupSearch}
                onChange={(e) => setPickupSearch(e.target.value)}
                placeholder="Scan QR / Cari No. Pesanan, Nama, No. HP..."
                className="pl-9 pr-3 h-8 text-xs w-full"
              />
            </div>
          </TijarahCard>

          {/* 3. Tabel Antrean Task Pickup Kasir */}
          <TijarahCard
            tijarahVariant="default"
            className="rounded-lg overflow-hidden"
          >
            {filteredPickupOrders.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <PackageCheck className="w-8 h-8 text-primary-sage/60 mx-auto" />
                <p className="text-sm font-bold text-text-primary">
                  Tidak Ada Antrean Pickup pada Filter Ini
                </p>
                <p className="text-xs text-text-muted max-w-md mx-auto">
                  Semua pesanan online dengan metode Ambil di Toko (Pickup)
                  otomatis masuk ke daftar tugas kasir ini, terpisah dari
                  pengiriman ekspedisi ERP.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle bg-canvas text-text-muted uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-2.5 px-4">No. Pesanan &amp; Waktu</th>
                      <th className="py-2.5 px-4">Pelanggan / Mitra</th>
                      <th className="py-2.5 px-4">Daftar Barang Pickup</th>
                      <th className="py-2.5 px-4">Pembayaran &amp; Total</th>
                      <th className="py-2.5 px-4">Status Pickup</th>
                      <th className="py-2.5 px-4 text-right">Tindakan Kasir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredPickupOrders.map((ord) => {
                      const canMarkReady =
                        ord.status === "PENDING" ||
                        ord.status === "PAID" ||
                        ord.status === "PROCESSING";
                      const canHandover =
                        ord.status === "READY_FOR_PICKUP" ||
                        ord.status === "PAID" ||
                        ord.status === "PROCESSING";

                      return (
                        <tr
                          key={ord.id}
                          className="hover:bg-canvas/50 transition-colors"
                        >
                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            <span className="font-mono font-bold text-text-primary block">
                              {ord.orderNumber}
                            </span>
                            <span className="text-[11px] text-text-muted block mt-0.5">
                              {formatDate(ord.createdAt)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-sage mt-1">
                              <Store className="w-3 h-3" />
                              <span>Task Pickup Kasir</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 align-top">
                            <span className="font-semibold text-text-primary block">
                              {ord.customerName}
                            </span>
                            <span className="text-[11px] text-text-muted block">
                              {ord.customerPhone || "-"}
                            </span>
                            {ord.customerType && (
                              <TijarahBadge
                                tijarahVariant="secondary"
                                size="sm"
                                className="mt-1"
                              >
                                {ord.customerType}
                              </TijarahBadge>
                            )}
                          </td>

                          <td className="py-3 px-4 align-top max-w-xs">
                            <div className="space-y-0.5">
                              {ord.items.slice(0, 3).map((it, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] text-text-primary truncate"
                                >
                                  <span className="font-bold">
                                    {it.quantity}x
                                  </span>{" "}
                                  {it.productName}
                                </div>
                              ))}
                              {ord.items.length > 3 && (
                                <span className="text-[10px] text-text-muted italic">
                                  +{ord.items.length - 3} produk lainnya
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            <span className="font-bold text-text-primary tabular-nums block">
                              {formatCurrency(ord.totalAmount)}
                            </span>
                            <span className="text-[10px] text-primary-sage font-semibold block">
                              +{ord.totalPoints || 0} Poin TP
                            </span>
                            <div className="mt-1 flex items-center gap-1">
                              <TijarahBadge
                                tijarahVariant={
                                  ord.paymentStatus === "PAID"
                                    ? "success"
                                    : ord.paymentStatus === "ON_CREDIT"
                                      ? "warning"
                                      : "danger"
                                }
                                size="sm"
                              >
                                {ord.paymentStatus === "PAID"
                                  ? "LUNAS"
                                  : ord.paymentStatus === "ON_CREDIT"
                                    ? "KASBON"
                                    : "BAYAR DI KASIR"}
                              </TijarahBadge>
                              <span className="text-[10px] text-text-muted uppercase font-mono">
                                {ord.paymentMethod}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            <OrderStatusBadge status={ord.status} />
                          </td>

                          <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {canMarkReady && (
                                <TijarahButton
                                  type="button"
                                  tijarahVariant="outline"
                                  size="sm"
                                  isDisabled={isReadyingForPickup}
                                  onClick={() => onReadyForPickup(ord.id)}
                                  className="h-7 px-2.5 text-[11px] font-semibold rounded-md inline-flex items-center gap-1"
                                >
                                  <PackageCheck className="w-3.5 h-3.5 text-primary-sage" />
                                  <span>Siap Diambil</span>
                                </TijarahButton>
                              )}

                              {canHandover && (
                                <TijarahButton
                                  type="button"
                                  tijarahVariant="primary"
                                  size="sm"
                                  isDisabled={isVerifyingPickup}
                                  onClick={() => {
                                    setHandoverTargetOrder(ord);
                                    setHandoverVerifyCode(ord.orderNumber);
                                    setHandoverNotes("");
                                  }}
                                  className="h-7 px-2.5 text-[11px] font-semibold rounded-md inline-flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Serahkan Barang</span>
                                </TijarahButton>
                              )}

                              <TijarahButton
                                type="button"
                                tijarahVariant="ghost"
                                size="sm"
                                onClick={() => onOpenReceiptModal(ord)}
                                className="h-7 px-2 text-[11px] rounded-md"
                                title="Cetak Struk"
                              >
                                <Printer className="w-3.5 h-3.5 text-text-muted" />
                              </TijarahButton>

                              <TijarahButton
                                type="button"
                                tijarahVariant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrderForDetail(ord)}
                                className="h-7 px-2 text-[11px] rounded-md"
                                title="Detail Pesanan"
                              >
                                <Eye className="w-3.5 h-3.5 text-primary-sage" />
                              </TijarahButton>

                              {canMarkReady && (
                                <TijarahButton
                                  type="button"
                                  tijarahVariant="ghost"
                                  size="sm"
                                  onClick={() => onOpenRejectModal(ord)}
                                  className="h-7 px-2 text-[11px] rounded-md text-status-danger"
                                  title="Tolak Pesanan"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </TijarahButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TijarahCard>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE 3: RIWAYAT TRANSAKSI KASIR (WALK-IN POS & PICKUP SELESAI)        */}
      {/* ===================================================================== */}
      {activeMode === "history" && (
        <TijarahCard
          tijarahVariant="default"
          className="rounded-lg overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border-subtle bg-canvas flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-text-primary">
                Riwayat Nota Kasir &amp; Pickup Selesai
              </h3>
              <p className="text-[11px] text-text-muted">
                Daftar nota yang telah diproses di kasir beserta tombol Re-Print
                struk thermal.
              </p>
            </div>
          </div>

          {cashierHistoryOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              Belum ada riwayat transaksi kasir yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-canvas text-text-muted uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-4">Invoice No</th>
                    <th className="py-2.5 px-4">Jenis Transaksi</th>
                    <th className="py-2.5 px-4">Customer / Agen</th>
                    <th className="py-2.5 px-4">Pembayaran</th>
                    <th className="py-2.5 px-4 text-right">
                      Total &amp; Point Value
                    </th>
                    <th className="py-2.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {cashierHistoryOrders.map((ord) => {
                    const isWalkIn = isPosWalkInOrder(ord);
                    return (
                      <tr
                        key={ord.id}
                        className="hover:bg-canvas/50 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-text-primary">
                          {ord.orderNumber}
                          <span className="block font-sans text-[10px] font-normal text-text-muted">
                            {formatDate(ord.createdAt)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <TijarahBadge
                            tijarahVariant={isWalkIn ? "primary" : "success"}
                            size="sm"
                          >
                            {isWalkIn ? "Kasir POS Toko" : "Pickup Online"}
                          </TijarahBadge>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-text-primary block">
                            {ord.customerName}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {ord.customerType || "AGEN"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] font-semibold">
                          {ord.paymentMethod}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          <span className="font-bold text-text-primary block">
                            {formatCurrency(ord.totalAmount)}
                          </span>
                          <span className="text-[10px] text-primary-sage font-semibold">
                            +{ord.totalPoints || 0} TP
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {ord.paymentStatus === "UNPAID" && (
                              <TijarahButton
                                type="button"
                                tijarahVariant="primary"
                                size="sm"
                                onClick={() => setActiveXenditOrder(ord)}
                                className="h-7 px-2.5 text-[11px] font-semibold rounded-md inline-flex items-center gap-1"
                              >
                                <QrCode className="w-3 h-3" />
                                <span>QR / VA Xendit</span>
                              </TijarahButton>
                            )}
                            <TijarahButton
                              type="button"
                              tijarahVariant="outline"
                              size="sm"
                              onClick={() => onOpenReceiptModal(ord)}
                              className="h-7 px-2.5 text-[11px] font-semibold rounded-md inline-flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Re-Print</span>
                            </TijarahButton>
                            <TijarahButton
                              type="button"
                              tijarahVariant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrderForDetail(ord)}
                              className="h-7 px-2 text-[11px] rounded-md"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary-sage" />
                            </TijarahButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TijarahCard>
      )}

      {/* ===================================================================== */}
      {/* MODAL PEMBAYARAN XENDIT DI MEJA KASIR (QRIS / VIRTUAL ACCOUNT / EWALLET) */}
      {/* ===================================================================== */}
      <TijarahModal
        isOpen={!!activeXenditOrder}
        onClose={() => setActiveXenditOrder(null)}
        title="Instruksi Pembayaran Xendit di Meja Kasir"
        description={
          activeXenditOrder
            ? `Tagihan Xendit untuk nota ${activeXenditOrder.orderNumber} (${activeXenditOrder.customerName})`
            : ""
        }
        confirmText="Konfirmasi Lunas & Cetak Struk"
        confirmVariant="primary"
        onConfirm={handleConfirmXenditPaidAtCounter}
        isConfirmLoading={isVerifyingPickup}
        showCancelButton
        cancelText="Tutup"
        maxWidth="md"
      >
        {activeXenditOrder && (
          <div className="space-y-4 py-1 text-xs">
            {/* Ringkasan Tagihan */}
            <div className="p-3.5 rounded-lg bg-canvas border border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-text-muted block">
                  Metode Xendit
                </span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">
                  {activeXenditOrder.paymentMethod.replace("_", " ")}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-text-muted block">
                  Total Bayar
                </span>
                <span className="text-lg font-mono font-black text-primary-sage tabular-nums">
                  {formatCurrency(activeXenditOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Tampilan QRIS / E-Wallet QR Code */}
            {(activeXenditOrder.paymentMethod === "QRIS" ||
              activeXenditOrder.paymentMethod.startsWith("EWALLET_")) && (
              <div className="p-4 rounded-lg bg-surface border border-border-subtle flex flex-col items-center text-center space-y-2.5">
                <span className="text-xs font-bold text-text-primary">
                  Scan QRIS / E-Wallet Xendit
                </span>
                <div className="p-3 bg-white rounded-xl border border-border-subtle">
                  <QRCodeSVG
                    value={
                      activeXenditOrder.qrString ||
                      activeXenditOrder.invoiceUrl ||
                      `TIJARAH-XENDIT:${activeXenditOrder.orderNumber}|${activeXenditOrder.totalAmount}`
                    }
                    size={180}
                    level="M"
                  />
                </div>
                <p className="text-[11px] text-text-muted max-w-xs">
                  Arahkan kamera M-Banking atau aplikasi E-Wallet pelanggan ke
                  kode QR di atas untuk menyelesaikan pembayaran.
                </p>
              </div>
            )}

            {/* Tampilan Nomor Virtual Account Xendit */}
            {activeXenditOrder.paymentMethod.startsWith("VA_") && (
              <div className="p-4 rounded-lg bg-surface border border-border-subtle space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-text-muted">
                    Nomor Virtual Account (
                    {activeXenditOrder.bankCode ||
                      activeXenditOrder.paymentMethod.replace("VA_", "")}
                    )
                  </span>
                  <TijarahBadge tijarahVariant="primary" size="sm">
                    Xendit Fixed VA
                  </TijarahBadge>
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-canvas border border-border-subtle">
                  <span className="font-mono text-base font-black text-text-primary tracking-wider">
                    {activeXenditOrder.vaNumber || "70014892019283"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const code =
                        activeXenditOrder.vaNumber || "70014892019283";
                      if (
                        typeof navigator !== "undefined" &&
                        navigator.clipboard
                      ) {
                        navigator.clipboard.writeText(code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }
                    }}
                    className="h-7 px-2.5 rounded border border-border-subtle bg-surface text-[11px] font-semibold text-primary-sage inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode ? "Tersalin" : "Salin VA"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tombol Cek Status Gateway Xendit & Buka Link Invoice */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <TijarahButton
                type="button"
                tijarahVariant="outline"
                size="sm"
                isDisabled={isCheckingXendit}
                onClick={handleSyncXenditStatus}
                className="h-8 px-3 text-xs font-semibold rounded-md inline-flex items-center gap-1.5"
              >
                <RefreshCw
                  className={clsx(
                    "w-3.5 h-3.5",
                    isCheckingXendit && "animate-spin",
                  )}
                />
                <span>
                  {isCheckingXendit
                    ? "Mengecek Xendit..."
                    : "Cek Status Xendit"}
                </span>
              </TijarahButton>

              {activeXenditOrder.invoiceUrl && (
                <a
                  href={activeXenditOrder.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary-sage hover:underline inline-flex items-center gap-1"
                >
                  <span>Buka Halaman Xendit</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </TijarahModal>

      {/* Modal Lookup Direktori Customer / Agen HNI */}
      <TijarahModal
        isOpen={isCustomerLookupOpen}
        onClose={() => setIsCustomerLookupOpen(false)}
        title="Pilih Customer / Agen HNI Terdaftar"
        description="Pilih data mitra agen atau pelanggan untuk mengisi otomatis ID Member HNI, Nama, dan Domisili."
        showCancelButton
        cancelText="Tutup"
        maxWidth="md"
      >
        <div className="space-y-3 py-1 text-xs">
          <TijarahInput
            type="text"
            value={customerLookupQuery}
            onChange={(e) => setCustomerLookupQuery(e.target.value)}
            placeholder="Cari ID HNI, Nama Agen, atau No. HP..."
            className="h-8 text-xs"
          />
          <div className="max-h-64 overflow-y-auto divide-y divide-border-subtle border border-border-subtle rounded-lg">
            {filteredMembers.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setCustomerIdInput(m.hniId);
                  setCustomerName(m.name);
                  setCustomerPhone(m.phone);
                  setCustomerAddress(m.address);
                  setCustomerType(m.type);
                  setIsCustomerLookupOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-canvas flex items-center justify-between gap-2 cursor-pointer"
              >
                <div>
                  <span className="font-bold text-text-primary block">
                    {m.name}
                  </span>
                  <span className="text-[11px] text-text-muted font-mono">
                    ID: {m.hniId} | {m.address}
                  </span>
                </div>
                <TijarahBadge tijarahVariant="primary" size="sm">
                  {m.type}
                </TijarahBadge>
              </button>
            ))}
          </div>
        </div>
      </TijarahModal>

      {/* Modal Verifikasi Serah Terima Pickup di Kasir */}
      <TijarahModal
        isOpen={!!handoverTargetOrder}
        onClose={() => setHandoverTargetOrder(null)}
        title="Verifikasi Serah Terima Pickup di Kasir"
        description={
          handoverTargetOrder
            ? `Konfirmasi penyerahan barang untuk pesanan ${handoverTargetOrder.orderNumber} atas nama ${handoverTargetOrder.customerName}.`
            : ""
        }
        confirmText={
          isVerifyingPickup
            ? "Memverifikasi..."
            : "Konfirmasi Serahkan & Cetak Struk"
        }
        confirmVariant="primary"
        onConfirm={handleConfirmPickupHandover}
        isConfirmLoading={isVerifyingPickup}
        showCancelButton
        cancelText="Batal"
        maxWidth="md"
      >
        {handoverTargetOrder && (
          <div className="space-y-3 py-1 text-xs">
            <div className="p-3 rounded-lg bg-canvas border border-border-subtle space-y-1.5">
              <div className="flex justify-between">
                <span className="text-text-muted">Nomor Pesanan:</span>
                <span className="font-mono font-bold text-text-primary">
                  {handoverTargetOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Nama Pengambil:</span>
                <span className="font-semibold text-text-primary">
                  {handoverTargetOrder.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Total Tagihan:</span>
                <span className="font-bold text-primary-sage tabular-nums">
                  {formatCurrency(handoverTargetOrder.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Status Pembayaran:</span>
                <TijarahBadge
                  tijarahVariant={
                    handoverTargetOrder.paymentStatus === "PAID"
                      ? "success"
                      : "warning"
                  }
                  size="sm"
                >
                  {handoverTargetOrder.paymentStatus === "PAID"
                    ? "SUDAH LUNAS"
                    : "BAYAR SAAT AMBIL DI KASIR"}
                </TijarahBadge>
              </div>
            </div>

            {handoverTargetOrder.paymentStatus === "UNPAID" && (
              <div className="p-2.5 rounded-lg bg-[var(--badge-warning-bg)] border border-[var(--badge-warning-border)] text-[11px] text-[var(--badge-warning-text)] font-medium">
                Perhatian: Pesanan ini belum dibayar online. Pastikan kasir
                telah menerima pembayaran sebesar{" "}
                <strong>
                  {formatCurrency(handoverTargetOrder.totalAmount)}
                </strong>{" "}
                sebelum menyerahkan barang.
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-primary block">
                Kode Nota / QR Verifikasi Pengambil
              </label>
              <TijarahInput
                type="text"
                value={handoverVerifyCode}
                onChange={(e) => setHandoverVerifyCode(e.target.value)}
                placeholder="Masukkan atau scan nomor pesanan..."
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-primary block">
                Catatan Serah Terima Kasir (Opsional)
              </label>
              <TijarahInput
                type="text"
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Contoh: Diambil langsung oleh pembeli, barang lengkap..."
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}
      </TijarahModal>

      {/* Modal Detail Pesanan */}
      <OrderDetailModal
        isOpen={!!selectedOrderForDetail}
        onClose={() => setSelectedOrderForDetail(null)}
        order={selectedOrderForDetail}
        onPrintReceipt={(ord) => onOpenReceiptModal(ord)}
        onComplete={(orderId) => onVerifyPickupOrder({ orderId })}
      />
    </div>
  );
};

export default CashierPanel;
