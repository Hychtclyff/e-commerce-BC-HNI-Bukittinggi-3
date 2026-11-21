"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RefreshCw, XCircle, CreditCard, CheckCircle2 } from "lucide-react";
import { useRouter } from "@/lib/i18n/navigation";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { CheckoutReceiptCard } from "@/components/molecules/CheckoutReceiptCard";
import { PaymentDetailCard } from "@/modules/checkout/components/molecules/PaymentDetailCard";
import { OrderReceiptResponse } from "@/types/checkout.types";
import { checkoutApi } from "@/modules/checkout/api/checkout.api";
import { useOrders } from "@/modules/profile/hooks/useOrders";
import { showToast } from "@/utils/toast";
import { createClient } from "@/utils/supabase/client";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1"
).replace(/\/$/, "");

export function OrderDetailView({ slug, lang }: { slug: string; lang: string }) {
  const router = useRouter();
  const isEn = lang === "en";
  const [receipt, setReceipt] = useState<OrderReceiptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

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
            loadReceipt();
          }
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

  const handleCancelSubmit = async () => {
    try {
      await cancelOrder({
        orderId: resolvedOrderId,
        reason: cancelReason || (isEn ? "Cancelled by buyer" : "Dibatalkan oleh pembeli"),
      });
      showToast.success(
        isEn ? "Order Cancelled" : "Pesanan Dibatalkan",
        isEn ? "Order cancelled. Stock & credit restored." : "Pesanan berhasil dibatalkan. Stok & limit telah dipulihkan."
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

  const isPendingPayment = receipt.orderStatus === "PENDING_PAYMENT";
  const isPaid = receipt.paymentStatus === "PAID";
  const isExpired = receipt.paymentStatus === "EXPIRED";
  const isShipped = receipt.orderStatus === "SHIPPED";
  const canCancel = isPendingPayment;
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
        </div>
      </div>

      {(isPendingPayment || isExpired) && !isPaid && (
        <div className="print:hidden">
          <PaymentDetailCard
            receipt={receipt}
            onSyncStatus={handleSyncStatus}
            isSyncing={isProcessing === "sync"}
            isAutoChecking={isRealtimeConnected}
          />
        </div>
      )}

      <div className="w-full">
        <CheckoutReceiptCard receipt={receipt} onPrint={handlePrint} />
      </div>

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-6 shadow-lg">
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
              {isEn
                ? "Unpaid orders will be cancelled and reserved product stock will be restored automatically."
                : "Pesanan yang belum dibayar akan dibatalkan dan stok produk yang dipesan akan dipulihkan secara otomatis."}
            </p>

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
