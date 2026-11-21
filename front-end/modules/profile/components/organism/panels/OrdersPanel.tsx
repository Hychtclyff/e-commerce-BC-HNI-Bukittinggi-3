"use client";

import React, { useState, useMemo } from "react";
import {
  UserOrderSummary,
  OrderStatusType,
} from "../../../types/profile.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { OrderReceiptModal } from "../../molecules/OrderReceiptModal";
import { useProfileTranslation } from "../../../hooks/useProfileTranslation";
import { useOrders } from "../../../hooks/useOrders";
import { formatCurrency } from "@/utils/formatters";
import { showToast } from "@/utils/toast";
import { useRouter } from "@/lib/i18n/navigation";
import {
  GlobalEmptyState,
  GlobalError500State,
  GlobalError401State,
} from "@/components/molecules/states";
import {
  MessageSquare,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  PackageCheck,
  XCircle,
  ChevronRight,
  RefreshCw,
  Search,
  AlertTriangle,
  Package,
  Calendar,
  Sparkles,
} from "lucide-react";

interface OrdersPanelProps {
  orders?: UserOrderSummary[];
  initialTab?: OrderStatusType;
  isSingleView?: boolean;
}

export function OrdersPanel({
  orders: propOrders,
  initialTab,
  isSingleView = false,
}: OrdersPanelProps) {
  const { t } = useProfileTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatusType>(
    initialTab || "ALL",
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrderForModal, setSelectedOrderForModal] =
    useState<UserOrderSummary | null>(null);

  // Modal Cancel State
  const [orderToCancel, setOrderToCancel] = useState<UserOrderSummary | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState<string>("");

  // Hook Order Management
  const {
    orders: hookOrders,
    counts,
    meta,
    isLoading,
    isError,
    error,
    refreshOrders,
    cancelOrder,
    isCancelling,
    confirmDelivered,
    isConfirming,
  } = useOrders({
    status: activeTab === "ALL" ? undefined : activeTab,
    search: searchQuery || undefined,
  });

  // Gunakan data dari props jika diberikan (misal server component), jika tidak gunakan hook
  const rawOrders =
    propOrders && propOrders.length > 0 ? propOrders : hookOrders;

  // Filter client-side jika menggunakan propOrders
  const displayedOrders = useMemo(() => {
    let result = rawOrders;
    if (activeTab !== "ALL") {
      result = result.filter((o) => o.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.invoiceNo.toLowerCase().includes(q) ||
          o.items?.some((i) => i.productName.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [rawOrders, activeTab, searchQuery]);

  // Tab definitions dengan badge counters dari API
  const tabs: { id: OrderStatusType; label: string; count: number }[] = [
    { id: "ALL", label: t("all", "Semua"), count: counts.ALL || rawOrders.length },
    {
      id: "PENDING_PAYMENT",
      label: t("pendingPayment", "Belum Bayar"),
      count: counts.PENDING_PAYMENT || 0,
    },
    { id: "PROCESSING", label: t("processing", "Diproses"), count: counts.PROCESSING || 0 },
    { id: "SHIPPED", label: t("shipped", "Dikirim"), count: counts.SHIPPED || 0 },
    { id: "COMPLETED", label: t("completed", "Selesai"), count: counts.COMPLETED || 0 },
    { id: "REJECTED", label: t("rejectedTab", "Ditolak"), count: counts.REJECTED || 0 },
    { id: "CANCELLED", label: t("cancelled", "Dibatalkan"), count: counts.CANCELLED || 0 },
  ];

  // Aksi Pembatalan Pesanan
  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      await cancelOrder({
        orderId: orderToCancel.id,
        reason: cancelReason || "Dibatalkan oleh pembeli",
      });
      showToast.success(
        t("orderCancelledToast", "Pesanan Berhasil Dibatalkan"),
      );
      setOrderToCancel(null);
      setCancelReason("");
    } catch (err: any) {
      showToast.error(
        t("cancelOrderBtn", "Gagal Membatalkan Pesanan"),
        err?.message,
      );
    }
  };

  // Aksi Konfirmasi Pesanan Diterima
  const handleConfirmDelivered = async (order: UserOrderSummary) => {
    const isOk = window.confirm(t("confirmCompleteOrder", "Apakah Anda yakin pesanan ini sudah diterima dengan lengkap?"));
    if (!isOk) return;
    try {
      await confirmDelivered(order.id);
      showToast.success(
        t("orderCompletedToast", "Pesanan Selesai"),
      );
    } catch (err: any) {
      showToast.error(
        t("confirmReceivedBtn", "Gagal Mengonfirmasi Pesanan"),
        err?.message,
      );
    }
  };

  // Helper WhatsApp Link
  const getWhatsAppLink = (order: UserOrderSummary) => {
    const inv = order.orderNumber || order.invoiceNo;
    const msg = encodeURIComponent(
      `Halo CS BC HNI 3 Bukittinggi, saya ingin menanyakan status pesanan saya dengan nomor faktur: ${inv}`,
    );
    return `https://wa.me/6281234567890?text=${msg}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-text-primary tracking-tight">
            {t("orderHistoryTitle", "Riwayat & Status Pesanan")}
          </h3>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            {t("orderHistorySubtitle", "Pantau status transaksi e-commerce, bukti posting poin HSIS, dan nomor resi pengiriman.")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refreshOrders()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-sage hover:underline cursor-pointer bg-primary-sage/10 hover:bg-primary-sage/15 px-3 py-1.5 rounded-xl transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>{t("reloadBtn", "Segarkan")}</span>
          </button>
        </div>
      </div>

      {/* Jika Error 401 Unauthorized */}
      {isError &&
        (error?.includes("401") ||
          error?.toLowerCase().includes("unauthorized")) && (
          <GlobalError401State nextUrl="/profile" />
        )}

      {/* Jika Error 500 / Network Error */}
      {isError &&
        !error?.includes("401") &&
        !error?.toLowerCase().includes("unauthorized") && (
          <GlobalError500State
            onRetry={() => refreshOrders()}
            errorMessage={error || undefined}
          />
        )}

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. faktur pesanan atau nama produk..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-canvas border border-border-subtle focus:outline-none focus:border-primary-sage text-text-primary placeholder:text-text-muted transition-colors"
          />
        </div>
      </div>

      {/* 3. Filter Status Tabs with Live Counters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide border-b border-border-subtle">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TijarahButton
              key={tab.id}
              type="button"
              size="sm"
              tijarahVariant={isActive ? "primary" : "secondary"}
              heroVariant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className="text-xs px-3.5 py-1.5 rounded-xl font-semibold shrink-0 flex items-center gap-2"
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-border-subtle/80 text-text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </TijarahButton>
          );
        })}
      </div>

      {/* 4. Orders List */}
      {displayedOrders.length > 0 ? (
        <div className="flex flex-col gap-4">
          {displayedOrders.map((ord) => {
            const invoiceNo = ord.orderNumber || ord.invoiceNo;
            const items =
              ord.items && ord.items.length > 0
                ? ord.items
                : ord.previewItems || [];
            const canCancel = ord.status === "PENDING_PAYMENT";
            const canConfirmDelivered = ord.status === "SHIPPED";

            return (
              <TijarahCard
                key={ord.id}
                tijarahVariant="default"
                className="p-5 sm:p-6 border border-border-subtle hover:border-primary-sage/40 transition-all rounded-3xl bg-surface"
              >
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle/70">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-canvas border border-border-subtle flex items-center justify-center text-primary-sage shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted font-medium">
                          {ord.date ||
                            new Date(ord.createdAt).toLocaleDateString("id-ID")}
                        </span>
                        {ord.shippingType && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-canvas text-text-muted border border-border-subtle/80">
                            {ord.shippingType === "PICKUP"
                              ? t("shippingTypePickup", "Ambil di Toko")
                              : t("shippingTypeDelivery", "Diantar")}
                          </span>
                        )}
                      </div>
                      <h4 className="font-mono font-bold text-sm sm:text-base text-text-primary mt-0.5">
                        {invoiceNo}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Badge */}
                    <TijarahBadge
                      tijarahVariant={
                        ord.status === "COMPLETED"
                          ? "success"
                          : ord.status === "SHIPPED"
                            ? "primary"
                            : ord.status === "PROCESSING"
                              ? "warning"
                              : ord.status === "REJECTED" ||
                                  ord.status === "CANCELLED"
                                ? "danger"
                                : "warning"
                      }
                      className="text-xs px-2.5 py-1 font-bold"
                    >
                      {ord.status === "COMPLETED" && (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      )}
                      {ord.status === "PROCESSING" && (
                        <Clock className="w-3.5 h-3.5 mr-1" />
                      )}
                      {ord.status === "SHIPPED" && (
                        <Truck className="w-3.5 h-3.5 mr-1" />
                      )}
                      {ord.status === "REJECTED" && (
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                      )}
                      <span>
                        {ord.status === "COMPLETED"
                          ? t("completed", "Selesai")
                          : ord.status === "DELIVERED"
                            ? t("deliveredStatus", "Sampai Tujuan")
                            : ord.status === "SHIPPED"
                              ? t("shipped", "Dikirim")
                              : ord.status === "PROCESSING"
                                ? t("processing", "Diproses")
                                : ord.status === "PENDING_PAYMENT"
                                  ? t("pendingPayment", "Belum Bayar")
                                  : ord.status === "WAITING_APPROVAL"
                                    ? t("waitingApproval", "Menunggu Konfirmasi")
                                    : ord.status === "READY_FOR_PICKUP"
                                      ? t("readyForPickup", "Siap Diambil")
                                      : ord.status === "REJECTED"
                                        ? t("rejectedTab", "Ditolak")
                                        : t("cancelled", "Dibatalkan")}
                      </span>
                    </TijarahBadge>

                    <TijarahBadge
                      tijarahVariant="secondary"
                      className="text-xs px-2 py-0.5 font-bold"
                    >
                      {ord.paymentMethod}
                    </TijarahBadge>
                  </div>
                </div>

                {/* Items Preview List */}
                {items.length > 0 && (
                  <div className="py-3 border-b border-border-subtle/50 space-y-2">
                    {items.slice(0, 3).map((item: any, idx: number) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between text-xs gap-3"
                      >
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-sage shrink-0" />
                          <span className="font-semibold text-text-primary truncate">
                            {item.productName}
                          </span>
                          <span className="text-text-muted shrink-0">
                            x{item.qty}
                          </span>
                        </div>
                        <span className="font-bold text-text-primary shrink-0">
                          {formatCurrency(
                            item.totalPrice || item.unitPrice * item.qty,
                          )}
                        </span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-[11px] text-text-muted italic">
                        + {items.length - 3} produk lainnya...
                      </p>
                    )}
                  </div>
                )}

                {/* Rejection Alert if rejected */}
                {ord.rejectionReason && (
                  <div className="my-3 p-3 rounded-2xl bg-status-danger/10 border border-status-danger/30 text-xs text-status-danger">
                    <strong>Alasan Toko:</strong> {ord.rejectionReason}
                  </div>
                )}

                {/* Metrics Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                  <div>
                    <span className="text-text-muted block font-medium">
                      Total Pembayaran
                    </span>
                    <span className="font-extrabold text-text-primary text-sm">
                      {formatCurrency(ord.totalAmount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-text-muted block font-medium">
                      Poin TP HSIS
                    </span>
                    <span className="font-bold text-accent-gold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {ord.totalPoints} TP
                    </span>
                  </div>

                  <div>
                    <span className="text-text-muted block font-medium flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-primary-sage" />{" "}
                      Status HSIS
                    </span>
                    <span className="font-semibold text-text-primary mt-0.5 block truncate">
                      {ord.hsisReceiptNo ? (
                        <span className="text-status-success font-mono font-bold">
                          {ord.hsisReceiptNo}
                        </span>
                      ) : ord.hsisPostingStatus === "POSTED" ? (
                        <span className="text-status-success font-bold">
                          Terposting
                        </span>
                      ) : (
                        <span className="text-status-warning font-medium">
                          Antrean Posting
                        </span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-text-muted block font-medium flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-accent-gold" /> Kurir /
                      Resi
                    </span>
                    <span className="font-semibold text-text-primary font-mono mt-0.5 block truncate">
                      {ord.trackingNumber ||
                        ord.shippingCourier ||
                        "Armada BC3"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="mt-5 pt-4 border-t border-border-subtle/60 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={getWhatsAppLink(ord)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-status-success hover:underline px-3 py-1.5 rounded-xl border border-status-success/30 hover:bg-status-success/10 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat CS BC3</span>
                    </a>

                    {canCancel && (
                      <TijarahButton
                        type="button"
                        size="sm"
                        tijarahVariant="danger"
                        heroVariant="outline"
                        onClick={() => {
                          setOrderToCancel(ord);
                          setCancelReason("");
                        }}
                        className="text-xs font-bold py-1.5 px-3"
                      >
                        {t("cancelOrderBtn", "Batalkan Pesanan")}
                      </TijarahButton>
                    )}

                    {canConfirmDelivered && (
                      <TijarahButton
                        type="button"
                        size="sm"
                        tijarahVariant="primary"
                        onClick={() => handleConfirmDelivered(ord)}
                        isDisabled={isConfirming}
                        className="text-xs font-bold py-1.5 px-3 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t("confirmReceivedBtn", "Konfirmasi Diterima")}</span>
                      </TijarahButton>
                    )}
                  </div>

                  <TijarahButton
                    tijarahVariant="outline"
                    size="sm"
                    onClick={() => router.push(`/orders/${(ord as any).slug || ord.id}`)}
                    className="text-xs py-1.5 font-bold flex items-center gap-1"
                  >
                    <span>{t("viewReceiptBtn", "Lihat Faktur / Struk")}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </TijarahButton>
                </div>
              </TijarahCard>
            );
          })}
        </div>
      ) : (
        <GlobalEmptyState
          title={
            searchQuery
              ? `Tidak ditemukan pesanan "${searchQuery}"`
              : activeTab !== "ALL"
                ? "Tidak Ada Pesanan pada Kategori Ini"
                : "Belum Ada Riwayat Pesanan"
          }
          description={
            searchQuery || activeTab !== "ALL"
              ? "Coba atur ulang filter pencarian atau pilih tab status pesanan lainnya."
              : "Anda belum pernah melakukan transaksi belanja herba. Jelajahi katalog dan nikmati harga agen resmi HNI."
          }
          actionText={
            searchQuery || activeTab !== "ALL"
              ? "Reset Filter & Pencarian"
              : "Mulai Belanja di Katalog"
          }
          onAction={() => {
            if (searchQuery || activeTab !== "ALL") {
              setActiveTab("ALL");
              setSearchQuery("");
            } else {
              router.push("/shop");
            }
          }}
        />
      )}

      {/* Modal Detail Nota */}
      {selectedOrderForModal && (
        <OrderReceiptModal
          order={selectedOrderForModal}
          onClose={() => setSelectedOrderForModal(null)}
        />
      )}

      {/* Modal Dialog Pembatalan Pesanan */}
      <TijarahModal
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        title={{
          id: `Batalkan Pesanan? (${orderToCancel?.orderNumber || orderToCancel?.invoiceNo || ""})`,
          en: `Cancel Order? (${orderToCancel?.orderNumber || orderToCancel?.invoiceNo || ""})`,
        }}
        description={{
          id: "Pesanan ini masih dalam antrean verifikasi toko. Jika dibatalkan, plafon belanja Kasbon B2B (jika tempo) akan otomatis dipulihkan ke akun Anda.",
          en: "This order is still awaiting store verification. If cancelled, your B2B Kasbon limit (if tempo) will be automatically restored.",
        }}
        variant="danger"
        icon={<AlertTriangle className="w-5 h-5 text-status-danger" />}
        maxWidth="md"
        showCloseIcon
        onConfirm={handleConfirmCancel}
        confirmText={{
          id: isCancelling ? "Membatalkan..." : "Ya, Batalkan Pesanan",
          en: isCancelling ? "Cancelling..." : "Yes, Cancel Order",
        }}
        confirmVariant="danger"
        isConfirmLoading={isCancelling}
        showCancelButton
        cancelText={{ id: "Batal", en: "Cancel" }}
      >
        <div className="pt-2">
          <label className="text-xs font-bold text-text-primary block mb-1.5">
            Alasan Pembatalan:
          </label>
          <TijarahTextArea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Contoh: Ingin mengubah alamat atau mengganti produk..."
            rows={3}
          />
        </div>
      </TijarahModal>
    </div>
  );
}

export default OrdersPanel;
