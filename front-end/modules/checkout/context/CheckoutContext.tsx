"use client";

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import {
  ShippingType,
  PaymentMethodType,
  VoucherItem,
  OrderReceiptResponse,
  OrderStatusType,
} from "@/types/checkout.types";
import { useCart } from "@/modules/shop/hooks/useCart";
import { useProfile } from "@/modules/profile/hooks/useProfile";
import { useUserAddresses } from "@/modules/profile/hooks/useUserAddresses";
import { calculateVoucherDiscount } from "@/utils/voucher";
import { useCheckoutApi } from "../hooks/useCheckoutApi";
import { checkoutApi } from "../api/checkout.api";
import { shopApi } from "@/modules/shop/api/shop.api";
import { toast } from "@/utils/toast";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import { storeApi } from "@/modules/store/api/store.api";

export type CheckoutStep = 1 | 2 | 3;

interface CheckoutContextValue {
  // Step state
  step: CheckoutStep;
  setStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Cart & items preview
  cartItems: ReturnType<typeof useCart>["cartItems"];
  updateQty: ReturnType<typeof useCart>["updateQty"];
  removeFromCart: ReturnType<typeof useCart>["removeFromCart"];
  clearCart: ReturnType<typeof useCart>["clearCart"];
  totalCount: number;
  subtotal: number;
  totalPoints: number;
  isItemsSheetOpen: boolean;
  setIsItemsSheetOpen: (open: boolean) => void;

  // Shipping state
  shippingType: ShippingType;
  setShippingType: (type: ShippingType) => void;
  addresses: ReturnType<typeof useUserAddresses>["addresses"];
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  customAddressText: string;
  setCustomAddressText: (text: string) => void;
  courier: string;
  setCourier: (c: string) => void;
  shippingCost: number;
  deliveryMethods: any[];
  notes: string;
  setNotes: (n: string) => void;
  isShippingValid: boolean;
  isCustomAddressRequired: boolean;
  shippingValidationError: string | null;

  // Voucher state
  selectedVoucher: VoucherItem | null;
  setSelectedVoucher: (v: VoucherItem | null) => void;
  discountAmount: number;

  // Payment state
  paymentMethod: PaymentMethodType;
  setPaymentMethod: (m: PaymentMethodType) => void;

  // Kasbon B2B Status
  kasbonEligible: boolean;
  kasbonAvailableBalance: number;
  isCalculating: boolean;

  // Totals
  grandTotal: number;

  // Processing & Receipt state
  isSubmitting: boolean;
  error: string | null;
  orderReceipt: OrderReceiptResponse | null;
  processCheckout: () => Promise<void>;
  syncPaymentStatus: (isSilent?: boolean) => Promise<void>;
  isSyncingPayment: boolean;
  isAutoChecking: boolean;

  // Lifecycle Simulation for status testing
  simulatePaymentSuccess: () => Promise<void>;
  simulateStoreApproval: () => Promise<void>;
  simulateShipOrder: () => Promise<void>;
  simulateRejectOrder: (reason?: string) => Promise<void>;
  resetCheckout: () => void;

  // Profile data
  isAgent: boolean;
  user: ReturnType<typeof useProfile>["user"];
  hniProfile: ReturnType<typeof useProfile>["hniProfile"];
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

export const CheckoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const t = useTranslations("Checkout");
  const router = useRouter();
  const { user, hniProfile } = useProfile();
  const { addresses } = useUserAddresses();
  const isAgent = Boolean(hniProfile && hniProfile.isVerified);

  const {
    cartItems,
    updateQty,
    removeFromCart,
    clearCart,
    totalCount,
    getSubtotal,
    getTotalPoints,
  } = useCart();

  const localSubtotal = getSubtotal(isAgent);
  const localTotalPoints = getTotalPoints(isAgent);

  // Stepper state (1: Pengiriman -> 2: Pembayaran -> 3: Status & Resi)
  const [step, setStep] = useState<CheckoutStep>(1);
  const [isItemsSheetOpen, setIsItemsSheetOpen] = useState(false);

  // Shipping
  const [shippingType, setShippingType] = useState<ShippingType>("DELIVERY");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [customAddressText, setCustomAddressText] = useState<string>("");
  const [courier, setCourier] = useState<string>("L300-REGIONAL");
  const [notes, setNotes] = useState<string>("");

  // Delivery methods (loaded from backend)
  const [deliveryMethods, setDeliveryMethods] = useState<any[]>([]);
  useEffect(() => {
    storeApi.getDeliveryMethods().then((methods) => {
      const activeMethods = methods.filter((m) => m.isActive);
      setDeliveryMethods(activeMethods);
      if (activeMethods.length > 0 && !courier) {
        setCourier(activeMethods[0].code);
      }
    });
  }, []);

  // Sync primary address default
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const primary = addresses.find((a) => a.isPrimary) || addresses[0];
      setSelectedAddressId(primary.id);
    }
  }, [addresses, selectedAddressId]);

  // Otomatis tentukan travel / ekspedisi berdasarkan alamat user (Pasaman -> Bintang Terang, Lubuk Basung -> BSW, default General)
  useEffect(() => {
    if (shippingType !== "DELIVERY" || deliveryMethods.length === 0) return;

    const currentAddr = addresses.find((a) => a.id === selectedAddressId);
    const fullText = (
      (currentAddr?.city || "") + " " +
      (currentAddr?.district || "") + " " +
      (currentAddr?.fullAddress || "") + " " +
      customAddressText
    ).toLowerCase();

    // Cari method yang cocok dengan nama area
    const matched = deliveryMethods.find((m) => {
      if (!m.destinationArea) return false;
      const area = m.destinationArea.toLowerCase().trim();
      return area !== "general" && area.length > 2 && fullText.includes(area);
    });

    if (matched) {
      setCourier(matched.code);
    } else {
      // Cari fallback General jika tidak ada rute spesifik
      const general = deliveryMethods.find((m) => {
        const area = (m.destinationArea || "").toLowerCase();
        const code = (m.code || "").toLowerCase();
        return area.includes("general") || code.includes("general") || code.includes("exp_general");
      });
      if (general) {
        setCourier(general.code);
      } else if (deliveryMethods.length > 0) {
        // Fallback ke method delivery aktif pertama yang bukan pickup
        const deliveryOnly = deliveryMethods.find((m) => m.type !== "STORE_PICKUP") || deliveryMethods[0];
        setCourier(deliveryOnly.code);
      }
    }
  }, [shippingType, selectedAddressId, customAddressText, addresses, deliveryMethods]);

  // Vouchers
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(null);

  // Payment method
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethodType>(
    isAgent ? "B2B_CREDIT" : "QRIS"
  );
  const hasUserSelectedPayment = useRef(false);
  const setPaymentMethod = useCallback((m: PaymentMethodType) => {
    hasUserSelectedPayment.current = true;
    setPaymentMethodState(m);
  }, []);

  useEffect(() => {
    if (isAgent && !hasUserSelectedPayment.current) {
      setPaymentMethodState("B2B_CREDIT");
    }
  }, [isAgent]);

  // Submission & Receipt
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderReceipt, setOrderReceipt] = useState<OrderReceiptResponse | null>(null);

  // API Integration hooks
  const {
    calculateCheckout,
    isCalculating,
    processCheckout: executeApiCheckout,
    simulateMockPay,
    simulateApprove,
    simulateShip,
    simulateReject,
  } = useCheckoutApi();

  // Server calculation state
  const [serverCalculation, setServerCalculation] = useState<{
    subtotal?: number;
    shippingCost?: number;
    discountAmount?: number;
    totalTpPoints?: number;
    grandTotal?: number;
    kasbonEligible?: boolean;
    kasbonAvailableBalance?: number;
  }>({});

  // Local fallback shipping cost calculation
  const fallbackShippingCost = useMemo(() => {
    if (shippingType === "PICKUP") return 0;
    const found = deliveryMethods.find((m) => m.code === courier || m.id === courier);
    if (found) return Number(found.baseCost) || 0;
    return 20000;
  }, [shippingType, courier, deliveryMethods]);

  const shippingCost = serverCalculation.shippingCost ?? fallbackShippingCost;

  // Local fallback voucher discount
  const fallbackDiscountAmount = useMemo(() => {
    if (!selectedVoucher) return 0;
    return calculateVoucherDiscount(selectedVoucher, localSubtotal, shippingCost);
  }, [selectedVoucher, localSubtotal, shippingCost]);

  const discountAmount = serverCalculation.discountAmount ?? fallbackDiscountAmount;
  const subtotal = serverCalculation.subtotal ?? localSubtotal;
  const totalPoints = serverCalculation.totalTpPoints ?? localTotalPoints;

  // Grand total
  const grandTotal = useMemo(() => {
    if (typeof serverCalculation.grandTotal === "number") {
      return serverCalculation.grandTotal;
    }
    return Math.max(0, subtotal + shippingCost - discountAmount);
  }, [serverCalculation.grandTotal, subtotal, shippingCost, discountAmount]);

  const kasbonEligible = serverCalculation.kasbonEligible ?? isAgent;
  const kasbonAvailableBalance = serverCalculation.kasbonAvailableBalance ?? 0;

  // Real-time server calculation trigger
  useEffect(() => {
    if (cartItems.length === 0) {
      setServerCalculation({});
      return;
    }

    let isMounted = true;
    const triggerCalculation = async () => {
      try {
        const payload = {
          userId: user?.id,
          shippingType,
          addressId: shippingType === "DELIVERY" ? (selectedAddressId || undefined) : undefined,
          shippingCourier: shippingType === "DELIVERY" ? courier : "PICKUP_STORE",
          shippingCost: fallbackShippingCost,
          voucherCode: selectedVoucher?.code,
          items: cartItems.map((item) => ({
            productId: item.product.id,
            qty: item.qty,
          })),
        };

        const res = await calculateCheckout(payload);
        if (isMounted && res) {
          setServerCalculation({
            subtotal: res.subtotal,
            shippingCost: res.shippingCost,
            discountAmount: res.discountAmount,
            totalTpPoints: res.totalTpPoints,
            grandTotal: res.grandTotal,
            kasbonEligible: res.kasbonEligible,
            kasbonAvailableBalance: res.kasbonAvailableBalance,
          });
        }
      } catch (err: any) {
        const status = err?.response?.status ?? err?.statusCode;
        // Jika kalkulasi server gagal akibat produk di localStorage sudah tidak ada / ID berubah pasca reset DB
        if (status === 404 && /product|produk/i.test(err?.message || "")) {
          try {
            const liveProducts = await shopApi.getProducts();
            if (Array.isArray(liveProducts) && liveProducts.length > 0 && isMounted) {
              const byId = new Map(liveProducts.map((p) => [p.id, p]));
              const bySku = new Map(liveProducts.map((p) => [String(p.sku || "").toLowerCase(), p]));
              const byName = new Map(liveProducts.map((p) => [String(p.name || "").toLowerCase(), p]));

              let changed = false;
              const reconciled = cartItems
                .map((ci) => {
                  if (byId.has(ci.product.id)) return ci;
                  const matched =
                    (ci.product.sku && bySku.get(String(ci.product.sku).toLowerCase())) ||
                    (ci.product.name && byName.get(String(ci.product.name).toLowerCase()));
                  if (matched) {
                    changed = true;
                    return { ...ci, product: matched };
                  }
                  changed = true;
                  return null;
                })
                .filter(Boolean) as typeof cartItems;

              if (changed) {
                localStorage.setItem("hni_tijarah_cart", JSON.stringify(reconciled));
                window.location.reload();
                return;
              }
            }
          } catch {
            // ignore sync failure
          }
        }

        // Jika kalkulasi server gagal akibat voucher invalid/expired, reset voucher & beri peringatan
        if (selectedVoucher && /voucher/i.test(err?.message || "")) {
          setSelectedVoucher(null);
          toast.warning(
            t("toastVoucherInvalidTitle"),
            err?.message || t("toastVoucherInvalidDesc")
          );
        }
        // Fallback local calculations remain active seamlessly
      }
    };

    const timer = setTimeout(triggerCalculation, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    cartItems,
    shippingType,
    selectedAddressId,
    courier,
    fallbackShippingCost,
    selectedVoucher,
    user?.id,
    calculateCheckout,
  ]);

  // Shipping validation:
  // - Courier/method is required for DELIVERY.
  // - Address field is ONLY required if user has no saved address AND the chosen delivery method
  //   does not already target a specific destinationArea (e.g. "General").
  const isCustomAddressRequired = useMemo(() => {
    if (shippingType === "PICKUP") return false;
    const hasSavedAddress = Boolean(
      addresses && addresses.length > 0 && addresses.some((a) => a.id === selectedAddressId)
    );
    if (hasSavedAddress) return false;

    const selectedMethod = deliveryMethods.find((m) => m.code === courier || m.id === courier);
    const destArea = (selectedMethod?.destinationArea || "").trim().toLowerCase();
    const hasSpecificAreaRoute = Boolean(destArea && destArea !== "general" && destArea !== "umum");
    return !hasSpecificAreaRoute;
  }, [shippingType, addresses, selectedAddressId, deliveryMethods, courier]);

  const shippingValidationError = useMemo(() => {
    if (shippingType === "PICKUP") return null;
    if (!courier || !courier.trim()) {
      return t("shippingValidationCourierRequired");
    }
    if (isCustomAddressRequired && customAddressText.trim().length < 3) {
      return t("shippingValidationAddressRequired");
    }
    return null;
  }, [shippingType, courier, isCustomAddressRequired, customAddressText, t]);

  const isShippingValid = shippingValidationError === null;

  // Step transitions
  const nextStep = useCallback(() => {
    if (step === 1 && !isShippingValid) {
      return;
    }
    setStep((prev) => (prev < 3 ? ((prev + 1) as CheckoutStep) : prev));
  }, [step, isShippingValid]);

  const prevStep = useCallback(() => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as CheckoutStep) : prev));
  }, []);

  // Process Checkout
  const processCheckout = useCallback(async () => {
    if (cartItems.length === 0) {
      const msg = t("toastEmptyCartDesc");
      setError(msg);
      toast.danger(t("toastEmptyCartTitle"), msg);
      return;
    }

    if (shippingType === "DELIVERY" && !isShippingValid) {
      const msg = shippingValidationError || t("toastNoAddressDesc");
      setError(msg);
      toast.danger(t("toastNoAddressTitle"), msg);
      return;
    }

    if (paymentMethod === "B2B_CREDIT" && !kasbonEligible) {
      const msg = t("toastKasbonUnavailableDesc");
      setError(msg);
      toast.danger(t("toastKasbonUnavailableTitle"), msg);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const resolvedUserId = user?.id || useAuthStore.getState().user?.id;
    if (!resolvedUserId) {
      const msg = t("toastLoginRequiredDesc");
      setError(msg);
      toast.danger(t("toastLoginRequiredTitle"), msg);
      setIsSubmitting(false);
      return;
    }

    const effectiveNotes =
      shippingType === "DELIVERY" && customAddressText.trim()
        ? notes
          ? `${customAddressText.trim()} - ${notes}`
          : customAddressText.trim()
        : notes;

    const payload = {
      userId: resolvedUserId,
      shippingType,
      addressId: shippingType === "DELIVERY" ? (selectedAddressId || undefined) : undefined,
      shippingCourier: shippingType === "DELIVERY" ? courier : "PICKUP_STORE",
      shippingCost: shippingType === "DELIVERY" ? shippingCost : 0,
      voucherCode: selectedVoucher?.code,
      paymentMethod,
      notes: effectiveNotes,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        qty: item.qty,
      })),
    };

    try {
      // 1. Coba eksekusi melalui API backend
      const receipt = await executeApiCheckout(payload);
      setOrderReceipt(receipt as any);
      clearCart();
      const targetSlug = (receipt as any).slug || receipt.id;
      router.push(`/orders/${targetSlug}`);

      // Tampilkan notifikasi toast tunggal informatif sesuai metode pembayaran (mencegah toast ganda)
      if (receipt.paymentStatus === "UNPAID") {
        if (receipt.vaNumber) {
          toast.success(
            t("toastOrderCreatedTitle"),
            `No. VA (${receipt.bankCode || "VA"}): ${receipt.vaNumber} - Total: Rp ${receipt.totalAmount.toLocaleString("id-ID")}.`
          );
        } else if (receipt.paymentMethod === "QRIS" || receipt.paymentMethod === "QRIS_MOCKUP") {
          toast.success(
            t("toastOrderCreatedTitle"),
            `QRIS #${receipt.orderNumber} - Total: Rp ${receipt.totalAmount.toLocaleString("id-ID")}.`
          );
        } else if (receipt.paymentMethod === "B2B_CREDIT") {
          toast.success(
            t("toastKasbonCreatedTitle"),
            `#${receipt.orderNumber} (H+14) - Total: Rp ${receipt.totalAmount.toLocaleString("id-ID")}.`
          );
        } else if (receipt.paymentMethod === "COD") {
          toast.success(
            t("toastCodCreatedTitle"),
            `#${receipt.orderNumber} (COD) - Total: Rp ${receipt.totalAmount.toLocaleString("id-ID")}.`
          );
        } else {
          toast.success(
            t("toastOrderCreatedTitle"),
            `#${receipt.orderNumber} - Total: Rp ${receipt.totalAmount.toLocaleString("id-ID")}.`
          );
        }
      } else {
        toast.success(
          t("toastOrderPaidTitle"),
          `#${receipt.orderNumber}`
        );
      }
    } catch (err: any) {
      const status = err?.status;
      const isBusinessError = status !== undefined && status > 0;

      if (isBusinessError) {
        // Server mereturn error HTTP (contoh: 400 Voucher invalid) - jangan fallback ke mock store
        const errorMsg = err?.message || t("toastProcessError");

        // Jika error terkait voucher, hapus voucher agar UI konsisten
        if (status === 400 && selectedVoucher && /voucher/i.test(errorMsg)) {
          setSelectedVoucher(null);
        }

        setError(errorMsg);
        toast.danger(t("toastCheckoutFailedTitle"), errorMsg);
        return;
      }

      // Fallback hanya untuk error jaringan (server offline / tidak dapat terhubung)
      console.warn("API processCheckout fallback to local mock store:", err?.message);
      try {
        // Fallback local execution jika backend server offline/mock
        const fallbackReceipt = await shopApi.executeCheckout(payload, {
          userName: user?.fullName || "Mitra Pelanggan HNI",
          hniMemberId: hniProfile?.hniMemberId,
          isAgent,
        });
        setOrderReceipt(fallbackReceipt);
        clearCart();
        const fallbackSlug = (fallbackReceipt as any).slug || fallbackReceipt.id;
        router.push(`/orders/${fallbackSlug}`);
        if (fallbackReceipt.paymentStatus === "UNPAID") {
          toast.warning(
            t("toastPendingPaymentTitle"),
            `#${fallbackReceipt.orderNumber}`
          );
        } else {
          toast.success(
            t("toastOrderPaidTitle"),
            `#${fallbackReceipt.orderNumber}`
          );
        }
      } catch (fallbackErr: any) {
        const msg = fallbackErr?.message || t("toastProcessError");
        setError(msg);
        toast.danger(t("toastCheckoutFailedTitle"), msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    cartItems,
    shippingType,
    selectedAddressId,
    customAddressText,
    paymentMethod,
    kasbonEligible,
    user,
    courier,
    shippingCost,
    selectedVoucher,
    notes,
    executeApiCheckout,
    hniProfile,
    isAgent,
    clearCart,
    t,
  ]);

  // Sinkronisasi status riil dengan gateway Xendit
  const syncPaymentStatus = useCallback(async (isSilent = false) => {
    if (!orderReceipt) return;
    if (!isSilent) setIsSyncingPayment(true);
    try {
      const res = await checkoutApi.syncXenditPayment(orderReceipt.id);
      if (res?.paymentStatus === "PAID") {
        setOrderReceipt((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: "PAID",
                orderStatus: res.orderStatus || "PROCESSING",
              }
            : null
        );
        toast.success(t("toastPaymentConfirmedTitle"), `#${orderReceipt.orderNumber}`);
      } else if (res?.paymentStatus === "EXPIRED") {
        setOrderReceipt((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: "EXPIRED",
                orderStatus: "CANCELLED",
              }
            : null
        );
        toast.danger(t("toastPaymentExpiredTitle"), t("toastPaymentExpiredDesc"));
      } else if (!isSilent) {
        toast.info(t("toastPaymentStatusTitle"), `${res?.paymentStatus || orderReceipt.paymentStatus}`);
      }
    } catch (e: any) {
      if (!isSilent) {
        toast.danger(t("toastSyncFailedTitle"), e?.message || t("toastSyncFailedTitle"));
      }
    } finally {
      if (!isSilent) setIsSyncingPayment(false);
    }
  }, [orderReceipt, t]);

  // Cek otomatis (Auto-polling) status pembayaran Xendit di background setiap 5 detik saat UNPAID (khusus metode online Xendit)
  useEffect(() => {
    const isXenditMethod =
      orderReceipt &&
      (orderReceipt.paymentMethod === "QRIS" ||
        orderReceipt.paymentMethod === "ONLINE_XENDIT" ||
        orderReceipt.paymentMethod.startsWith("VA_") ||
        orderReceipt.paymentMethod.startsWith("EWALLET_"));

    if (step !== 3 || !orderReceipt || orderReceipt.paymentStatus !== "UNPAID" || !isXenditMethod) {
      setIsAutoChecking(false);
      return;
    }

    setIsAutoChecking(true);
    const timer = setInterval(() => {
      syncPaymentStatus(true);
    }, 5000);

    return () => {
      clearInterval(timer);
      setIsAutoChecking(false);
    };
  }, [step, orderReceipt?.id, orderReceipt?.paymentStatus, orderReceipt?.paymentMethod, syncPaymentStatus]);

  // Deteksi redirect kembali dari portal Xendit
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const externalId = params.get("externalId");
    const orderId = params.get("orderId");

    const targetId = externalId || orderId;
    if (targetId && (status === "paid" || status === "success")) {
      checkoutApi.syncXenditPayment(targetId).then((res) => {
        if (res) {
          checkoutApi.getOrderReceipt(targetId).then((receipt) => {
            setOrderReceipt(receipt as any);
            setStep(3);
            toast.success("Pembayaran Berhasil!", `Pesanan ${receipt.orderNumber} telah diterima.`);
          }).catch(console.error);
        }
      }).catch(console.error);
    }
  }, []);

  // Lifecycle simulation helpers
  const simulatePaymentSuccess = useCallback(async () => {
    if (!orderReceipt) return;
    try {
      await simulateMockPay(orderReceipt.id);
    } catch {
      // fallback local update
    }
    setOrderReceipt((prev) =>
      prev
        ? {
            ...prev,
            paymentStatus: "PAID",
            orderStatus: "PROCESSING",
          }
        : null
    );
  }, [orderReceipt, simulateMockPay]);

  const simulateStoreApproval = useCallback(async () => {
    if (!orderReceipt) return;
    try {
      await simulateApprove({ orderId: orderReceipt.id });
    } catch {
      // fallback local update
    }
    setOrderReceipt((prev) =>
      prev
        ? {
            ...prev,
            orderStatus: "PROCESSING",
          }
        : null
    );
  }, [orderReceipt, simulateApprove]);

  const simulateShipOrder = useCallback(async () => {
    if (!orderReceipt) return;
    try {
      await simulateShip({
        orderId: orderReceipt.id,
        trackingNumber: "TRX-L300-88192",
        courierName: "Armada Travel L300 Bukittinggi",
      });
    } catch {
      // fallback local update
    }
    setOrderReceipt((prev) =>
      prev
        ? {
            ...prev,
            orderStatus: "SHIPPED",
          }
        : null
    );
  }, [orderReceipt, simulateShip]);

  const simulateRejectOrder = useCallback(
    async (reason = "Stok fisik produk di gudang habis.") => {
      if (!orderReceipt) return;
      try {
        await simulateReject({ orderId: orderReceipt.id, rejectionReason: reason });
      } catch {
        // fallback local update
      }
      setOrderReceipt((prev) =>
        prev
          ? {
              ...prev,
              orderStatus: "REJECTED",
              rejectionReason: reason,
            }
          : null
      );
    },
    [orderReceipt, simulateReject]
  );

  const resetCheckout = useCallback(() => {
    setOrderReceipt(null);
    setStep(1);
    setSelectedVoucher(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      step,
      setStep,
      nextStep,
      prevStep,
      cartItems,
      updateQty,
      removeFromCart,
      clearCart,
      totalCount,
      subtotal,
      totalPoints,
      isItemsSheetOpen,
      setIsItemsSheetOpen,
      shippingType,
      setShippingType,
      addresses,
      selectedAddressId,
      setSelectedAddressId,
      customAddressText,
      setCustomAddressText,
      courier,
      setCourier,
      shippingCost,
      deliveryMethods,
      notes,
      setNotes,
      isShippingValid,
      isCustomAddressRequired,
      shippingValidationError,
      selectedVoucher,
      setSelectedVoucher,
      discountAmount,
      paymentMethod,
      setPaymentMethod,
      kasbonEligible,
      kasbonAvailableBalance,
      isCalculating,
      grandTotal,
      isSubmitting,
      error,
      orderReceipt,
      processCheckout,
      syncPaymentStatus,
      isSyncingPayment,
      isAutoChecking,
      simulatePaymentSuccess,
      simulateStoreApproval,
      simulateShipOrder,
      simulateRejectOrder,
      resetCheckout,
      isAgent,
      user,
      hniProfile,
    }),
    [
      step,
      nextStep,
      prevStep,
      cartItems,
      updateQty,
      removeFromCart,
      clearCart,
      totalCount,
      subtotal,
      totalPoints,
      isItemsSheetOpen,
      shippingType,
      addresses,
      selectedAddressId,
      customAddressText,
      courier,
      shippingCost,
      deliveryMethods,
      notes,
      isShippingValid,
      isCustomAddressRequired,
      shippingValidationError,
      selectedVoucher,
      discountAmount,
      paymentMethod,
      kasbonEligible,
      kasbonAvailableBalance,
      isCalculating,
      grandTotal,
      isSubmitting,
      error,
      orderReceipt,
      processCheckout,
      syncPaymentStatus,
      isSyncingPayment,
      isAutoChecking,
      simulatePaymentSuccess,
      simulateStoreApproval,
      simulateShipOrder,
      simulateRejectOrder,
      resetCheckout,
      isAgent,
      user,
      hniProfile,
    ]
  );

  return (
    <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
  );
};

export function useCheckoutContext() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckoutContext must be used within a CheckoutProvider");
  }
  return context;
}
export default CheckoutContext;
