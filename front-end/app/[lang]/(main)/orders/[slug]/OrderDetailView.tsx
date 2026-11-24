"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RefreshCw, XCircle, CreditCard, CheckCircle2, Truck, PackageCheck, RotateCcw, Clock } from "lucide-react";
import { useRouter } from "@/lib/i18n/navigation";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { MediaUploader } from "@/modules/media/components/MediaUploader";
import { CheckoutReceiptCard } from "@/components/molecules/CheckoutReceiptCard";
import { PaymentDetailCard } from "@/modules/checkout/components/molecules/PaymentDetailCard";
import { OrderReceiptResponse } from "@/types/checkout.types";
import { checkoutApi } from "@/modules/checkout/api/checkout.api";
import { shopApi } from "@/modules/shop/api/shop.api";
import { useOrders } from "@/modules/profile/hooks/useOrders";
import { showToast } from "@/utils/toast";
import { createClient } from "@/utils/supabase/client";
import { getBackendApiBaseUrl } from "@/lib/api/baseUrl";

const API_BASE_URL = getBackendApiBaseUrl();

export function OrderDetailView({ slug, lang }: { slug: string; lang: string }) {
  const router = useRouter();
  const isEn = lang === "en";
  const [receipt, setReceipt] = useState<OrderReceiptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [refundBankName, setRefundBankName] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [refundAccountName, setRefundAccountName] = useState("");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [orderReturn, setOrderReturn] = useState<any>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("Barang Rusak / Cacat");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnEvidenceUrl, setReturnEvidenceUrl] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const { cancelOrder, isCancelling, confirmDelivered, isConfirming } = useOrders({});

  const loadReceipt = useCallback(async () => {
    try {
      const res = await checkoutApi.getOrderReceipt(slug);
      setReceipt(res as OrderReceiptResponse);
    } catch (error: any) {
      showToast.error(
        isEn ? "Failed to Load Order" : "Gagal Memuat Pesanan",
        error?.message || (isEn ? "Order not found." : "Pesanan tidak ditemukan.")
      );
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  }, [slug, isEn, router]);

  useEffect(() => {
    if (slug) {
      loadReceipt();
    }
  }, [slug, loadReceipt]);

  // Real-time payment & order status sync via Fastify SSE + Supabase Realtime
  useEffect(() => {
    if (!slug) return;
    let sse: EventSource | null = null;

    try {
      sse = new EventSource(`${API_BASE_URL}/payments/stream/${encodeURIComponent(slug)}`);
      sse.addEventListener("connected", () => setIsRealtimeConnected(true));
      sse.addEventListener("order-updated", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data);
          setReceipt((prev) =>
            prev
              ? {
                  ...prev,
                  paymentStatus: payload.paymentStatus || prev.paymentStatus,
                  orderStatus: payload.orderStatus || prev.orderStatus,
                }
              : prev
          );
          if (payload.paymentStatus === "PAID") {
            showToast.success(
              isEn ? "Payment Confirmed!" : "Pembayaran Diterima!",
              isEn
                ? `Order #${payload.orderNumber} is now PAID.`
                : `Pesanan #${payload.orderNumber} telah terkonfirmasi LUNAS.`
            );
          }
          loadReceipt();
        } catch {
          loadReceipt();
        }
      });
      sse.onerror = () => setIsRealtimeConnected(false);
    } catch {
      setIsRealtimeConnected(false);
    }

    // Secondary listener via Supabase Realtime (if enabled on orders table)
    let supabaseChannel: any = null;
    let supabaseClient: ReturnType<typeof createClient> | null = null;
    try {
      supabaseClient = createClient();
      supabaseChannel = supabaseClient
        .channel(`order-status-${slug}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "orders",
            table: "orders",
          },
          (payload: any) => {
            const row = payload?.new;
            if (!row) return;
            if (row.id === slug || row.slug === slug || row.orderNumber === slug) {
              setReceipt((prev) =>
                prev
                  ? {
                      ...prev,
                      paymentStatus: row.paymentStatus || prev.paymentStatus,
                      orderStatus: row.orderStatus || prev.orderStatus,
                    }
                  : prev
              );
              if (row.paymentStatus === "PAID") {
                loadReceipt();
              }
            }
          }
        )
        .subscribe();
    } catch {
      // Ignore if Supabase env is not configured
    }

    return () => {
      if (sse) sse.close();
      if (supabaseClient && supabaseChannel) {
        supabaseClient.removeChannel(supabaseChannel);
      }
    };
  }, [slug, isEn, loadReceipt]);

  // Active background auto-polling for payment status when UNPAID
  useEffect(() => {
    if (!receipt || receipt.paymentStatus !== "UNPAID") return;

    const isOnlineMethod =
      receipt.paymentMethod === "QRIS" ||
      receipt.paymentMethod === "ONLINE_XENDIT" ||
      receipt.paymentMethod.startsWith("VA_") ||
      receipt.paymentMethod.startsWith("EWALLET_");

    if (!isOnlineMethod) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const targetId = receipt.id || slug;
        const res = await checkoutApi.syncXenditPayment(targetId);
        if (!isSubscribed) return;

        if (res?.paymentStatus === "PAID") {
          setReceipt((prev) =>
            prev
              ? {
                  ...prev,
                  paymentStatus: "PAID",
                  orderStatus: res.orderStatus || "PROCESSING",
                }
              : prev
          );
          showToast.success(
            isEn ? "Payment Confirmed!" : "Pembayaran Diterima!",
            isEn
              ? `Order #${receipt.orderNumber} is now PAID.`
              : `Pesanan #${receipt.orderNumber} telah terkonfirmasi LUNAS.`
          );
          loadReceipt();
        } else if (res?.paymentStatus === "EXPIRED") {
          setReceipt((prev) =>
            prev
              ? {
                  ...prev,
                  paymentStatus: "EXPIRED",
                  orderStatus: "CANCELLED",
                }
              : prev
          );
          loadReceipt();
        }
      } catch {
        // Silent catch during periodic background polling
      }
    }, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [receipt?.paymentStatus, receipt?.id, receipt?.orderNumber, receipt?.paymentMethod, slug, isEn, loadReceipt]);

  const resolvedOrderId = receipt?.id || slug;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleSyncStatus = async () => {
    setIsProcessing("sync");
    try {
      await checkoutApi.syncXenditPayment(resolvedOrderId);
      await loadReceipt();
    } catch (error: any) {
      showToast.error(
        isEn ? "Sync Failed" : "Gagal Sinkronisasi",
        error?.message || (isEn ? "Unable to verify payment status." : "Tidak dapat memverifikasi status pembayaran.")
      );
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePayNow = async () => {
    if (!receipt) return;
    if (receipt.paymentUrl) {
      window.open(receipt.paymentUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (process.env.NODE_ENV === "production") {
      showToast.info(
        isEn ? "Payment Instructions" : "Instruksi Pembayaran",
        isEn
          ? "Please complete payment using the VA / QRIS details shown below."
          : "Silakan selesaikan pembayaran menggunakan detail VA / QRIS di bawah ini."
      );
      return;
    }

    setIsProcessing("pay");
    try {
      await checkoutApi.mockPay(resolvedOrderId);
      showToast.success(
        isEn ? "Payment Successful" : "Pembayaran Berhasil",
        isEn ? `Order #${receipt.orderNumber} is paid.` : `Pesanan #${receipt.orderNumber} telah lunas.`
      );
      await loadReceipt();
    } catch (error: any) {
      showToast.error(
        isEn ? "Payment Failed" : "Pembayaran Gagal",
        error?.message || (isEn ? "Payment simulation error." : "Terjadi kendala dalam simulasi pembayaran.")
      );
    } finally {
      setIsProcessing(null);
    }
  };

  useEffect(() => {
    if (!receipt?.id) return;
    shopApi.getOrderReturn(receipt.id).then((ret) => setOrderReturn(ret)).catch(() => {});
  }, [receipt?.id]);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnDescription.trim()) {
      showToast.error(
        isEn ? "Description Required" : "Kronologi Wajib Diisi",
        isEn ? "Please describe the issue with your order." : "Mohon jelaskan kondisi barang atau detail keluhan."
      );
      return;
    }
    if (!returnEvidenceUrl.trim()) {
      showToast.error(
        isEn ? "Evidence Photo Required" : "Foto Bukti Wajib Diunggah",
        isEn
          ? "Please upload a photo of the damaged/mismatched product before submitting."
          : "Mohon unggah foto bukti kondisi barang terlebih dahulu sebelum mengirim pengajuan."
      );
      return;
    }
    setIsSubmittingReturn(true);
    try {
      const created = await shopApi.createOrderReturn(resolvedOrderId, {
        reason: returnReason,
        description: returnDescription.trim(),
        evidenceUrl: returnEvidenceUrl.trim(),
      });
      setOrderReturn(created);
      setReturnModalOpen(false);
      setReturnDescription("");
      setReturnEvidenceUrl("");
      showToast.success(
        isEn ? "Return Request Sent" : "Pengajuan Retur Terkirim",
        isEn ? "Our store team will review your request." : "Tim toko akan meninjau pengajuan Anda."
      );
    } catch (err: any) {
      showToast.error(
        isEn ? "Failed" : "Gagal Mengajukan Retur",
        err?.response?.data?.message || err?.message || "Terjadi kesalahan."
      );
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleCancelSubmit = async () => {
    const isPaidOrder = receipt?.paymentStatus === "PAID";
    if (isPaidOrder) {
      if (!refundBankName.trim() || !refundAccountNumber.trim() || !refundAccountName.trim()) {
        showToast.error(
          isEn ? "Refund Details Required" : "Data Rekening Pengembalian Wajib Diisi",
          isEn
            ? "Please fill in Bank/E-Wallet name, Account Number, and Account Holder Name."
            : "Mohon lengkapi Bank/E-Wallet, Nomor Rekening/HP, dan Atas Nama untuk proses refund."
        );
        return;
      }
    }
    try {
      await cancelOrder({
        orderId: resolvedOrderId,
        reason: cancelReason || (isEn ? "Cancelled by buyer" : "Dibatalkan oleh pembeli"),
        ...(isPaidOrder
          ? {
              refundBankName: refundBankName.trim(),
              refundAccountNumber: refundAccountNumber.trim(),
              refundAccountName: refundAccountName.trim(),
            }
          : {}),
      });
      showToast.success(
        isEn ? "Order Cancelled" : "Pesanan Dibatalkan",
        isPaidOrder
          ? (isEn
              ? "Order cancelled and refund request recorded. Admin will process your refund."
              : "Pesanan dibatalkan dan pengajuan pengembalian dana telah dicatat.")
          : (isEn
              ? "Order cancelled. Stock & credit restored."
              : "Pesanan berhasil dibatalkan. Stok & limit telah dipulihkan.")
      );
      setCancelModalOpen(false);
      router.push("/profile");
    } catch (error: any) {
      showToast.error(
        isEn ? "Cancel Failed" : "Gagal Membatalkan",
        error?.message || (isEn ? "Failed to cancel order." : "Terjadi kesalahan saat membatalkan pesanan.")
      );
    }
  };

  const handleRegeneratePayment = async () => {
    setIsProcessing("regenerate");
    try {
      const res = await checkoutApi.regeneratePaymentCode(resolvedOrderId);
      setReceipt(res as OrderReceiptResponse);
      showToast.success(
        isEn ? "Payment Code Updated" : "Kode Pembayaran Diperbarui",
        isEn
          ? "New payment code / QRIS generated for 24 hours."
          : "Kode pembayaran / QRIS baru telah berhasil dibuat dengan masa berlaku 24 jam."
      );
    } catch (error: any) {
      showToast.error(
        isEn ? "Regenerate Failed" : "Gagal Membuat Ulang",
        error?.message || (isEn ? "Failed to regenerate payment code." : "Terjadi kesalahan saat membuat ulang kode pembayaran.")
      );
    } finally {
      setIsProcessing(null);
    }
  };

  const handleConfirmReceived = async () => {
    setIsProcessing("confirm");
    try {
      await confirmDelivered(resolvedOrderId);
      showToast.success(
        isEn ? "Order Completed" : "Pesanan Diterima",
        isEn ? "Order confirmed as completed." : "Pesanan telah dikonfirmasi selesai."
      );
      await loadReceipt();
    } catch (error: any) {
      showToast.error(
        isEn ? "Confirmation Failed" : "Gagal Konfirmasi",
        error?.message || (isEn ? "Failed to confirm delivery." : "Terjadi kesalahan saat konfirmasi pesanan.")
      );
    } finally {
      setIsProcessing(null);
    }
  };

  const handleBack = () => {
    router.push("/profile");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-9 h-9 rounded-full border-4 border-primary-sage border-t-transparent animate-spin" />
        <p className="text-xs text-text-muted font-medium">
          {isEn ? "Loading order receipt & status..." : "Memuat detail struk & status pesanan..."}
        </p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted text-sm font-semibold">
          {isEn ? "Order not found." : "Pesanan tidak ditemukan."}
        </p>
        <button
          onClick={handleBack}
          className="mt-4 inline-flex items-center gap-1.5 text-primary-sage text-xs font-bold hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {isEn ? "Back to Order History" : "Kembali ke Riwayat Pesanan"}
        </button>
      </div>
    );
  }

  const orderStatusStr = String(receipt.orderStatus || "");
  const isPickupFulfillment = String((receipt as any).fulfillmentType || "").toUpperCase() === "PICKUP";
  const isPendingPayment = orderStatusStr === "PENDING_PAYMENT";
  const isPaid = receipt.paymentStatus === "PAID";
  const isExpired = receipt.paymentStatus === "EXPIRED";
  const isShipped = orderStatusStr === "SHIPPED";
  const HOLD_CANCEL_RETURN = true;
  const createdAtMs = receipt.createdAt ? new Date(receipt.createdAt).getTime() : 0;
  const withinOneHour = createdAtMs > 0 ? Date.now() - createdAtMs <= 60 * 60 * 1000 : false;
  const canCancel =
    !HOLD_CANCEL_RETURN &&
    (orderStatusStr === "PENDING_PAYMENT" ||
      orderStatusStr === "WAITING_APPROVAL" ||
      (orderStatusStr === "PROCESSING" && withinOneHour));
  const canRegenerate = isPendingPayment && receipt.paymentStatus === "EXPIRED";

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-subtle print:hidden">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-primary-sage transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEn ? "Back to Orders" : "Kembali ke Daftar Pesanan"}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {receipt.paymentStatus === "UNPAID" && (
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{isEn ? "Live Realtime Sync" : "Pengecekan Real-time Aktif"}</span>
            </div>
          )}

          {canRegenerate && (
            <TijarahButton
              type="button"
              size="sm"
              tijarahVariant="outline"
              onClick={handleRegeneratePayment}
              isDisabled={isProcessing === "regenerate"}
              className="font-bold text-xs flex items-center gap-1.5 rounded-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing === "regenerate" ? "animate-spin" : ""}`} />
              <span>
                {isProcessing === "regenerate"
                  ? (isEn ? "Updating..." : "Memperbarui...")
                  : (isEn ? "Regenerate Payment" : "Buat Ulang Kode Pembayaran")}
              </span>
            </TijarahButton>
          )}

          {canCancel && (
            <TijarahButton
              type="button"
              size="sm"
              tijarahVariant="danger"
              heroVariant="outline"
              onClick={() => setCancelModalOpen(true)}
              isDisabled={isCancelling}
              className="font-bold text-xs flex items-center gap-1.5 rounded-lg"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isEn ? "Cancel Order" : "Batalkan Pesanan"}</span>
            </TijarahButton>
          )}

          {isPendingPayment && (
            <TijarahButton
              type="button"
              size="sm"
              tijarahVariant="primary"
              onClick={handlePayNow}
              isDisabled={isProcessing === "pay"}
              className="font-bold text-xs flex items-center gap-1.5 rounded-lg"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>
                {isProcessing === "pay"
                  ? (isEn ? "Processing..." : "Memproses...")
                  : (isEn ? "Pay Now" : "Bayar Sekarang")}
              </span>
            </TijarahButton>
          )}

          {isShipped && (
            <TijarahButton
              type="button"
              size="sm"
              tijarahVariant="primary"
              onClick={handleConfirmReceived}
              isDisabled={isConfirming || isProcessing === "confirm"}
              className="font-bold text-xs flex items-center gap-1.5 rounded-lg"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isEn ? "Confirm Received" : "Konfirmasi Barang Diterima"}</span>
            </TijarahButton>
          )}

          {!HOLD_CANCEL_RETURN && receipt.orderStatus === "COMPLETED" && !orderReturn && (
            <TijarahButton
              type="button"
              size="sm"
              tijarahVariant="outline"
              onClick={() => setReturnModalOpen(true)}
              className="font-bold text-xs flex items-center gap-1.5 rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isEn ? "Request Return / Refund" : "Ajukan Retur / Komplain"}</span>
            </TijarahButton>
          )}

          {String(receipt.paymentStatus || "").toUpperCase() === "REFUNDED" && !(receipt as any).refundConfirmedByUser && (
            <TijarahButton
              type="button"
              size="sm"
              tijarahVariant="primary"
              onClick={async () => {
                setIsProcessing("confirm-refund");
                try {
                  const { apiClient } = await import("@/lib/axios/client");
                  await apiClient.post(`/user/orders/${resolvedOrderId}/confirm-refund-received`);
                  showToast.success(
                    isEn ? "Refund Confirmed" : "Dana Refund Dikonfirmasi",
                    isEn ? "Thank you for confirming receipt of your refund." : "Terima kasih, penerimaan dana refund Anda telah dicatat."
                  );
                  await loadReceipt();
                } catch (err: any) {
                  showToast.error(isEn ? "Failed" : "Gagal", err?.message || "Gagal konfirmasi refund.");
                } finally {
                  setIsProcessing(null);
                }
              }}
              isDisabled={isProcessing === "confirm-refund"}
              className="font-bold text-xs flex items-center gap-1.5 rounded-lg"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isEn ? "Confirm Refund Received" : "Konfirmasi Dana Refund Masuk"}</span>
            </TijarahButton>
          )}
        </div>
      </div>

      {orderReturn && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-text-primary">
              {isEn ? "Return Request Status:" : "Status Pengajuan Retur:"}{" "}
              <span className="uppercase text-primary-sage">{orderReturn.status}</span>
            </p>
            <p className="text-xs text-text-muted">
              {orderReturn.reason} — {orderReturn.description}
            </p>
            {orderReturn.adminNotes && (
              <p className="text-xs text-text-primary font-medium mt-1">
                Catatan Toko: {orderReturn.adminNotes}
              </p>
            )}
          </div>
        </div>
      )}

      {(isPendingPayment || isExpired) && !isPaid && (
        <div className="print:hidden">
          <PaymentDetailCard
            receipt={receipt}
            onSyncStatus={handleSyncStatus}
            isSyncing={isProcessing === "sync"}
            isAutoChecking={receipt.paymentStatus === "UNPAID" || isRealtimeConnected}
          />
        </div>
      )}

      <div className="w-full">
        <CheckoutReceiptCard receipt={receipt} onPrint={handlePrint} />
      </div>

      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleReturnSubmit}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-lg space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-sage/10 text-primary-sage flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  {isEn ? "Request Order Return / Refund" : "Ajukan Retur / Komplain Pesanan"}
                </h3>
                <p className="text-[11px] text-text-muted">#{receipt.orderNumber}</p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-text-primary">
              {isEn
                ? "Return eligibility window: within 3x24 hours after the order is completed. Clear photo evidence is required."
                : "Batas pengajuan retur: maksimal 3x24 jam setelah pesanan selesai. Foto bukti wajib dilampirkan."}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                {isEn ? "Reason" : "Alasan Retur"}
              </label>
              <TijarahSelect
                aria-label={isEn ? "Return Reason" : "Alasan Retur"}
                selectedKey={returnReason}
                onSelectionChange={(key) => setReturnReason(String(key))}
              >
                <TijarahSelect.Item id="Barang Rusak / Cacat">Barang Rusak / Cacat</TijarahSelect.Item>
                <TijarahSelect.Item id="Produk Tidak Sesuai Pesanan">Produk Tidak Sesuai Pesanan</TijarahSelect.Item>
                <TijarahSelect.Item id="Jumlah Barang Kurang">Jumlah Barang Kurang</TijarahSelect.Item>
                <TijarahSelect.Item id="Produk Kedaluwarsa">Produk Kedaluwarsa</TijarahSelect.Item>
              </TijarahSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                {isEn ? "Description" : "Kronologi / Detail Keluhan"}
              </label>
              <textarea
                required
                rows={3}
                value={returnDescription}
                onChange={(e) => setReturnDescription(e.target.value)}
                placeholder={isEn ? "Describe the issue..." : "Jelaskan kondisi barang yang diterima..."}
                className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary focus:border-primary-sage focus:outline-none"
              />
            </div>

            <MediaUploader
              category="RECEIPT"
              entityId={receipt.id}
              accept="image"
              value={returnEvidenceUrl}
              onChange={(url) => setReturnEvidenceUrl(url)}
              label={isEn ? "Evidence Photo (Required)*" : "Foto Bukti Kondisi Barang (Wajib)*"}
              helperText={isEn ? "Upload a clear photo (JPG/PNG/WEBP, max 5 MB)" : "Unggah foto bukti yang jelas (JPG/PNG/WEBP, maks 5 MB)"}
              compact
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <TijarahButton
                type="button"
                size="sm"
                tijarahVariant="outline"
                onClick={() => setReturnModalOpen(false)}
                className="font-bold text-xs rounded-lg"
              >
                {isEn ? "Cancel" : "Batal"}
              </TijarahButton>
              <TijarahButton
                type="submit"
                size="sm"
                tijarahVariant="primary"
                isLoading={isSubmittingReturn}
                className="font-bold text-xs rounded-lg"
              >
                {isEn ? "Submit Request" : "Kirim Pengajuan"}
              </TijarahButton>
            </div>
          </form>
        </div>
      )}

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-lg">
            <div className="flex items-center gap-3 text-status-danger mb-3">
              <div className="w-9 h-9 rounded-lg bg-status-danger/10 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  {isEn ? "Cancel This Order?" : "Batalkan Pesanan Ini?"}
                </h3>
                <p className="text-[11px] text-text-muted">#{receipt.orderNumber}</p>
              </div>
            </div>

            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              {isPaid
                ? (isEn
                    ? "This order has already been paid. Please provide your bank/e-wallet details so our store admin can process your refund."
                    : "Pesanan ini sudah lunas. Mohon isi data rekening/e-wallet Anda agar admin toko dapat memproses pengembalian dana (refund).")
                : (isEn
                    ? "Unpaid orders will be cancelled and reserved product stock will be restored automatically."
                    : "Pesanan yang belum dibayar akan dibatalkan dan stok produk yang dipesan akan dipulihkan secara otomatis.")}
            </p>

            {isPaid && (
              <div className="space-y-3 mb-4 p-3 rounded-xl bg-canvas border border-border-subtle">
                <TijarahInput
                  label={isEn ? "Bank / E-Wallet Name*" : "Nama Bank / E-Wallet*"}
                  placeholder={isEn ? "e.g. BCA / Mandiri / GoPay / DANA" : "Contoh: BCA / Mandiri / BSI / GoPay"}
                  value={refundBankName}
                  onChange={(e) => setRefundBankName(e.target.value)}
                  className="text-xs"
                />
                <TijarahInput
                  label={isEn ? "Account Number / Phone*" : "Nomor Rekening / No. E-Wallet*"}
                  placeholder="08xxxxxxxx / 1234567890"
                  value={refundAccountNumber}
                  onChange={(e) => setRefundAccountNumber(e.target.value)}
                  className="text-xs font-mono"
                />
                <TijarahInput
                  label={isEn ? "Account Holder Name*" : "Atas Nama Pemilik Rekening*"}
                  placeholder={isEn ? "Full name on account" : "Nama sesuai buku tabungan / e-wallet"}
                  value={refundAccountName}
                  onChange={(e) => setRefundAccountName(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}

            <div className="mb-5">
              <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
                {isEn ? "Cancellation Reason (Optional)" : "Alasan Pembatalan (Opsional)"}
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={isEn ? "e.g. Want to change payment method..." : "Contoh: Ingin mengubah metode pembayaran..."}
                rows={3}
                className="w-full rounded-lg border border-border-subtle bg-canvas px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:border-primary-sage focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <TijarahButton
                type="button"
                size="sm"
                tijarahVariant="outline"
                onClick={() => setCancelModalOpen(false)}
                isDisabled={isCancelling}
                className="font-bold text-xs rounded-lg"
              >
                {isEn ? "Back" : "Batal"}
              </TijarahButton>
              <TijarahButton
                type="button"
                size="sm"
                tijarahVariant="danger"
                onClick={handleCancelSubmit}
                isDisabled={isCancelling}
                className="font-bold text-xs rounded-lg"
              >
                {isCancelling
                  ? (isEn ? "Cancelling..." : "Membatalkan...")
                  : (isEn ? "Yes, Cancel Order" : "Ya, Batalkan Pesanan")}
              </TijarahButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetailView;
