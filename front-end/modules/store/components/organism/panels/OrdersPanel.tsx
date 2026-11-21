"use client";

import React, { useState, useMemo } from "react";
import type {
  StoreEsignature,
  StoreOrder,
  StorePaymentCategory,
} from "../../../types/store.types";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import { useLocale, useTranslations } from "next-intl";
import { OrderStatusBadge } from "../../molecules/OrderStatusBadge";
import { OrderActionButtons } from "../../molecules/OrderActionButtons";
import { OrderDetailModal } from "../modals/OrderDetailModal";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { TijarahDateRangePicker } from "@/components/atom/tijarahDateRangePicker";
import { TijarahTabs } from "@/components/atom/tijarahTabs";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { showToast } from "@/utils/toast";
import { storeApi } from "@/modules/store/api/store.api";
import {
  Search,
  ShoppingBag,
  RefreshCw,
  Eye,
  CheckCircle2,
  PackageCheck,
  Truck,
  Clock,
  Layers,
  ShieldAlert,
} from "lucide-react";

export interface IOrdersPanelProps {
  orders: StoreOrder[];
  isLoading: boolean;
  onOpenShipModal: (order: StoreOrder) => void;
  onOpenRejectModal: (order: StoreOrder) => void;
  onOpenReceiptModal: (order: StoreOrder) => void;
  onConfirmReceived?: (orderId: string) => void;
  onCompleteOrder?: (orderId: string) => void;
  onReadyForPickup?: (orderId: string) => void;
  onNavigateToCashier?: () => void;
  onNavigateToEsignature?: () => void;
  esignatures?: StoreEsignature[];
  onRefresh?: () => void;
  isAdvancing?: boolean;
  isReadyingForPickup?: boolean;
}

export const OrdersPanel: React.FC<IOrdersPanelProps> = ({
  orders,
  isLoading,
  onOpenShipModal,
  onOpenRejectModal,
  onOpenReceiptModal,
  onConfirmReceived,
  onCompleteOrder,
  onReadyForPickup,
  onNavigateToCashier,
  onNavigateToEsignature,
  esignatures,
  onRefresh,
  isAdvancing = false,
  isReadyingForPickup = false,
}) => {
  const t = useTranslations("storeErp.orders");
  const locale = useLocale();
  const isEn = locale === "en";
  const authUser = useAuthStore((state) => state.user);

  const hasActiveSignature = useMemo(() => {
    if (!esignatures) return true;
    const uid = authUser?.id ? String(authUser.id).trim() : "";
    const uname = (authUser?.fullName || authUser?.name || "").trim().toLowerCase();
    return esignatures.some((s) => {
      if (s.status && s.status !== "ACTIVE") return false;
      if (uid && (s.userId === uid || s.staffId === uid)) return true;
      if (uname && s.signerName.trim().toLowerCase() === uname) return true;
      return false;
    });
  }, [esignatures, authUser]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] =
    useState<StorePaymentCategory>("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrderForDetail, setSelectedOrderForDetail] =
    useState<StoreOrder | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const erpDeliveryOrders = useMemo(() => orders, [orders]);

  const filterTabs = [
    {
      id: "ALL",
      label: t("tabAll"),
      count: erpDeliveryOrders.length,
    },
    {
      id: "PENDING_PAYMENT",
      label: t("tabPendingPayment"),
      count: erpDeliveryOrders.filter(
        (o) => o.status === "PENDING_PAYMENT" || o.status === "PENDING",
      ).length,
    },
    {
      id: "WAITING_APPROVAL",
      label: t("tabWaitingApproval"),
      count: erpDeliveryOrders.filter((o) => o.status === "WAITING_APPROVAL")
        .length,
    },
    {
      id: "PROCESSING",
      label: t("tabProcessing"),
      count: erpDeliveryOrders.filter(
        (o) =>
          o.status === "PAID" ||
          o.status === "PROCESSING" ||
          o.status === "READY_FOR_PICKUP",
      ).length,
    },
    {
      id: "SHIPPED",
      label: t("tabShipped"),
      count: erpDeliveryOrders.filter((o) => o.status === "SHIPPED").length,
    },
    {
      id: "DELIVERED",
      label: t("tabDelivered"),
      count: erpDeliveryOrders.filter((o) => o.status === "DELIVERED").length,
    },
    {
      id: "COMPLETED",
      label: t("tabCompleted"),
      count: erpDeliveryOrders.filter((o) => o.status === "COMPLETED").length,
    },
    {
      id: "REJECTED",
      label: t("tabCancelledOrRejected"),
      count: erpDeliveryOrders.filter(
        (o) => o.status === "REJECTED" || o.status === "CANCELLED",
      ).length,
    },
  ];

  const filteredOrders = useMemo(() => {
    return erpDeliveryOrders.filter((order) => {
      // 0. Filter Tanggal (filter lokal; backend support via query params jika diperlukan)
      if (dateFrom) {
        const d = new Date(order.createdAt);
        if (d < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const d = new Date(order.createdAt);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }

      // 1. Filter Status
      if (statusFilter !== "ALL") {
        if (statusFilter === "PENDING_PAYMENT") {
          if (order.status !== "PENDING_PAYMENT" && order.status !== "PENDING")
            return false;
        } else if (statusFilter === "PROCESSING") {
          if (
            order.status !== "PAID" &&
            order.status !== "PROCESSING" &&
            order.status !== "READY_FOR_PICKUP"
          )
            return false;
        } else if (statusFilter === "REJECTED") {
          if (order.status !== "REJECTED" && order.status !== "CANCELLED")
            return false;
        } else if (order.status !== statusFilter) {
          return false;
        }
      }

      // 2. Filter Status Pembayaran (tanpa Kasbon karena dipisah di panel Kasbon)
      if (paymentFilter !== "ALL") {
        if (paymentFilter === "PAID") {
          if (order.paymentStatus !== "PAID") return false;
        } else if (paymentFilter === "UNPAID" || paymentFilter === "PENDING") {
          if (
            order.paymentStatus !== "UNPAID" &&
            order.status !== "PENDING_PAYMENT" &&
            order.status !== "WAITING_APPROVAL"
          )
            return false;
        } else if (paymentFilter === "REFUNDED") {
          if (order.paymentStatus !== "REFUNDED") return false;
        }
      }

      // 2b. Filter Metode Pembayaran Checkout (Xendit & Tunai)
      if (methodFilter !== "ALL") {
        const pm = String(order.paymentMethod || "").toUpperCase();
        if (methodFilter === "XENDIT_QRIS") {
          if (!pm.includes("QRIS")) return false;
        } else if (methodFilter === "XENDIT_VA") {
          if (!pm.includes("VA") && !pm.includes("VIRTUAL")) return false;
        } else if (methodFilter === "XENDIT_EWALLET") {
          if (!pm.includes("EWALLET") && !pm.includes("E-WALLET") && !pm.includes("INVOICE") && !pm.includes("XENDIT"))
            return false;
        } else if (methodFilter === "CASH") {
          if (!pm.includes("CASH") && !pm.includes("TUNAI")) return false;
        }
      }

      // 3. Pencarian Kata Kunci
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchNumber = order.orderNumber.toLowerCase().includes(term);
        const matchCustomer = order.customerName.toLowerCase().includes(term);
        const matchPhone = (order.customerPhone || "").includes(term);
        const matchTracking = (order.trackingNumber || "")
          .toLowerCase()
          .includes(term);
        return matchNumber || matchCustomer || matchPhone || matchTracking;
      }

      return true;
    });
  }, [
    erpDeliveryOrders,
    statusFilter,
    paymentFilter,
    methodFilter,
    searchTerm,
    dateFrom,
    dateTo,
  ]);

  const [isCancellingExpired, setIsCancellingExpired] = useState(false);

  const handleCancelExpired = async () => {
    try {
      setIsCancellingExpired(true);
      const res = await storeApi.cancelExpiredOrders();
      if (res.success) {
        showToast.success("Pembersihan Selesai", res.message);
        if (onRefresh) onRefresh();
      } else {
        showToast.error("Gagal Membatalkan", res.message);
      }
    } catch (err: any) {
      showToast.error(
        "Terjadi Kesalahan",
        err?.message || "Gagal membatalkan order kedaluwarsa.",
      );
    } finally {
      setIsCancellingExpired(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-text-primary tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xs text-text-muted mt-0.5">{t("subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Pemicu Auto-Cancel Order Kedaluwarsa (Poin 11) */}
          <TijarahButton
            type="button"
            heroVariant="outline"
            size="sm"
            onClick={handleCancelExpired}
            isLoading={isCancellingExpired}
            className="text-xs font-semibold flex items-center gap-1.5 border-status-warning/40 text-status-warning hover:bg-status-warning/10"
            title="Scan dan batalkan otomatis pesanan belum bayar yang melewati batas waktu serta pulihkan stok fisik"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Auto-Cancel Expired</span>
          </TijarahButton>

          {onRefresh && (
            <TijarahButton
              type="button"
              heroVariant="outline"
              size="sm"
              onClick={onRefresh}
              isLoading={isLoading}
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </TijarahButton>
          )}

          {/* Search Input */}
          <div className="w-full sm:w-64">
            <TijarahInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="No Order / Resi / Pelanggan..."
              startContent={<Search className="w-4 h-4 text-text-muted" />}
              className="w-full text-xs"
            />
          </div>
        </div>
      </div>

      {!hasActiveSignature && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
              {isEn
                ? "Your account does not have an active digital signature yet. Order actions (approve, ship, ready for pickup, complete, reject) are disabled until you register one."
                : "Akun Anda belum memiliki tanda tangan digital aktif. Aksi pesanan (setujui, kirim, siap ambil, selesaikan, tolak) tidak dapat dilakukan sebelum tanda tangan didaftarkan."}
            </p>
          </div>
          {onNavigateToEsignature && (
            <TijarahButton
              type="button"
              tijarahVariant="primary"
              size="sm"
              onClick={onNavigateToEsignature}
              className="text-xs font-semibold h-8 px-3 rounded-md shrink-0"
            >
              {isEn ? "Register Signature" : "Daftarkan Tanda Tangan"}
            </TijarahButton>
          )}
        </div>
      )}

      {/* Callout Pemisahan Alur: Pesanan Pickup Ditangani oleh Modul Kasir */}
      {/* <div className="bg-[var(--badge-primary-bg)] border border-[var(--badge-primary-border)] rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <PackageCheck className="w-4 h-4 text-[var(--badge-primary-text)] shrink-0" />
          <p className="text-xs text-[var(--badge-primary-text)] font-medium">
            Modul ini khusus untuk pesanan pengiriman ekspedisi/kurir ERP. Pesanan dengan metode{" "}
            <strong className="font-bold">Ambil di Toko (Pickup)</strong> masuk ke antrean{" "}
            <strong className="font-bold">Task Kasir</strong> ({activePickupTaskCount} antrean aktif).
          </p>
        </div>
        {onNavigateToCashier && (
          <TijarahButton
            type="button"
            tijarahVariant="primary"
            size="sm"
            onClick={onNavigateToCashier}
            className="text-xs font-semibold h-8 px-3 rounded-md shrink-0"
          >
            Buka Task Pickup di Kasir
          </TijarahButton>
        )}
      </div> */}

      {/* Ringkasan Alur Status Pesanan Pengiriman ERP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle mac-glass mac-shadow flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-status-warning/15 text-status-warning flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">
              {t("cardStep1")}
            </span>
            <span className="text-base font-black text-text-primary">
              {
                erpDeliveryOrders.filter((o) => o.status === "WAITING_APPROVAL")
                  .length
              }{" "}
              {t("unitOrders")}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle mac-glass mac-shadow flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-sage/15 text-primary-sage flex items-center justify-center shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">
              {t("cardStep2")}
            </span>
            <span className="text-base font-black text-primary-sage">
              {
                erpDeliveryOrders.filter(
                  (o) => o.status === "PAID" || o.status === "PROCESSING",
                ).length
              }{" "}
              {t("unitPackages")}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle mac-glass mac-shadow flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-gold/15 text-accent-gold flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">
              {t("cardStep3")}
            </span>
            <span className="text-base font-black text-text-primary">
              {erpDeliveryOrders.filter((o) => o.status === "SHIPPED").length}{" "}
              {t("unitReceipts")}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle mac-glass mac-shadow flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-status-success/15 text-status-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">
              {t("cardStep4")}
            </span>
            <span className="text-base font-black text-status-success">
              {
                erpDeliveryOrders.filter(
                  (o) => o.status === "DELIVERED" || o.status === "COMPLETED",
                ).length
              }{" "}
              {t("unitDone")}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Filter Status */}
      <TijarahTabs
        variant="segmented"
        selectedKey={statusFilter}
        onSelectionChange={(key) => setStatusFilter(key)}
        items={filterTabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          badge: (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
                statusFilter === tab.id
                  ? "bg-white/25 text-white"
                  : "bg-canvas text-text-muted"
              }`}
            >
              {tab.count}
            </span>
          ),
        }))}
        className="w-full"
        listClassName="flex-nowrap overflow-x-auto pb-1 scrollbar-hide max-w-full"
      />

      {/* Filter Kategori Pembayaran & Filter Tanggal */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-surface p-3.5 rounded-2xl border border-border-subtle shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Status Pembayaran */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-text-muted flex items-center gap-1 shrink-0">
              <Layers className="w-3.5 h-3.5 text-primary-sage" />
              {isEn ? "Payment:" : "Status Bayar:"}
            </label>
            <div className="w-44">
              <TijarahSelect
                selectedKey={paymentFilter}
                onSelectionChange={(key) => {
                  if (key)
                    setPaymentFilter(String(key) as StorePaymentCategory);
                }}
                className="text-xs"
              >
                <TijarahSelect.Item id="ALL">
                  {isEn ? "All Status" : "Semua Status"}
                </TijarahSelect.Item>
                <TijarahSelect.Item id="PAID">
                  {isEn ? "Paid" : "Lunas"}
                </TijarahSelect.Item>
                <TijarahSelect.Item id="UNPAID">
                  {isEn ? "Unpaid / Pending" : "Belum Lunas / Menunggu"}
                </TijarahSelect.Item>
                <TijarahSelect.Item id="REFUNDED">
                  {isEn ? "Refunded" : "Refund"}
                </TijarahSelect.Item>
              </TijarahSelect>
            </div>
          </div>

          {/* Filter Metode Pembayaran Checkout (Xendit & Tunai) */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-text-muted shrink-0">
              {isEn ? "Method:" : "Metode:"}
            </label>
            <div className="w-48">
              <TijarahSelect
                selectedKey={methodFilter}
                onSelectionChange={(key) => {
                  if (key) setMethodFilter(String(key));
                }}
                className="text-xs"
              >
                <TijarahSelect.Item id="ALL">
                  {isEn ? "All Methods" : "Semua Metode"}
                </TijarahSelect.Item>
                <TijarahSelect.Item id="XENDIT_QRIS">
                  Xendit QRIS
                </TijarahSelect.Item>
                <TijarahSelect.Item id="XENDIT_VA">
                  Xendit Virtual Account
                </TijarahSelect.Item>
                <TijarahSelect.Item id="XENDIT_EWALLET">
                  Xendit E-Wallet / Invoice
                </TijarahSelect.Item>
                <TijarahSelect.Item id="CASH">
                  {isEn ? "Cash" : "Tunai (Kasir)"}
                </TijarahSelect.Item>
              </TijarahSelect>
            </div>
          </div>
        </div>

        {/* Date Range Picker dengan Komponen Tijarah & HeroUI */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-text-muted text-[11px] shrink-0">
            Periode:
          </span>
          <TijarahDateRangePicker
            value={{ startDate: dateFrom, endDate: dateTo }}
            onChange={({ startDate, endDate }) => {
              setDateFrom(startDate);
              setDateTo(endDate);
            }}
            onClear={() => {
              setDateFrom("");
              setDateTo("");
            }}
            placeholder="Rentang Tanggal..."
          />

          {(dateFrom || dateTo || paymentFilter !== "ALL" || methodFilter !== "ALL") && (
            <TijarahButton
              type="button"
              heroVariant="secondary"
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setPaymentFilter("ALL");
                setMethodFilter("ALL");
              }}
              className="text-[11px] h-8 px-2.5 font-bold text-status-danger"
            >
              Reset
            </TijarahButton>
          )}
        </div>
      </div>

      {/* Best-Practice Data Table (Bukan Card) */}
      <TijarahCard
        tijarahVariant="default"
        className="border border-border-subtle overflow-hidden mac-glass mac-shadow rounded-2xl"
      >
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-canvas border border-border-subtle flex items-center justify-center text-text-muted">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-sm text-text-primary">
                {t("empty")}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {searchTerm
                  ? `Tidak ada pesanan yang sesuai dengan kata kunci "${searchTerm}".`
                  : "Belum ada riwayat pesanan pada filter ini."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-canvas/60 text-text-muted uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">{t("orderNo")}</th>
                  <th className="py-3 px-4">{t("customer")}</th>
                  <th className="py-3 px-4">Rincian Barang</th>
                  <th className="py-3 px-4">{t("total")}</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi & Alur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-canvas/40 transition-colors"
                  >
                    {/* No. Order & Tanggal */}
                    <td className="py-3.5 px-4 font-mono font-bold text-text-primary">
                      <div className="flex items-center gap-1.5">
                        <span>{order.orderNumber}</span>
                      </div>
                      <span className="block font-sans text-[10px] text-text-muted font-normal mt-0.5">
                        {formatDate(order.createdAt)}
                      </span>
                      {order.trackingNumber && (
                        <span className="inline-block mt-1 font-mono text-[10px] text-primary-sage font-bold bg-primary-sage/10 px-1.5 py-0.5 rounded border border-primary-sage/20">
                          {order.courierName || "Kurir"}: {order.trackingNumber}
                        </span>
                      )}
                    </td>

                    {/* Pelanggan */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-text-primary block">
                        {order.customerName}
                      </span>
                      <span className="text-[11px] text-text-muted block">
                        {order.customerPhone || "Tanpa No. HP"}
                      </span>
                      <span className="text-[10px] text-text-muted italic block truncate max-w-[200px] mt-0.5">
                        {order.shippingAddress || "Alamat Toko"}
                      </span>
                    </td>

                    {/* Rincian Item Singkat */}
                    <td className="py-3.5 px-4">
                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-0.5">
                          {order.items.slice(0, 2).map((line, idx) => (
                            <span
                              key={idx}
                              className="block text-[11px] text-text-primary font-medium"
                            >
                              {line.quantity}x {line.productName}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span className="text-[10px] text-primary-sage font-semibold">
                              +{order.items.length - 2} produk lainnya
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-muted italic">
                          Paket Herba HNI
                        </span>
                      )}
                    </td>

                    {/* Total Tagihan & Poin */}
                    <td className="py-3.5 px-4">
                      <span className="font-black text-text-primary block text-sm">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <span className="text-[10px] text-text-muted block">
                        Metode:{" "}
                        <strong className="text-text-primary">
                          {order.paymentMethod}
                        </strong>
                      </span>
                      {order.totalPoints ? (
                        <span className="text-[10px] text-status-success font-bold block mt-0.5">
                          +{order.totalPoints} TP HNI
                        </span>
                      ) : null}
                    </td>

                    {/* Badge Status */}
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    {/* Tombol Aksi & Alur */}
                    <td className="py-3.5 px-4 text-right">
                      <OrderActionButtons
                        order={order}
                        onShip={onOpenShipModal}
                        onConfirmReceived={onConfirmReceived}
                        onComplete={onCompleteOrder}
                        onReadyForPickup={onReadyForPickup}
                        onReject={onOpenRejectModal}
                        onPrint={onOpenReceiptModal}
                        onViewDetail={(ord) => setSelectedOrderForDetail(ord)}
                        isAdvancing={isAdvancing}
                        isReadyingForPickup={isReadyingForPickup}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TijarahCard>

      {/* Modal Detail Pesanan Komprehensif */}
      <OrderDetailModal
        isOpen={!!selectedOrderForDetail}
        onClose={() => setSelectedOrderForDetail(null)}
        order={selectedOrderForDetail}
        onPrintReceipt={(ord) => onOpenReceiptModal(ord)}
        onShip={(ord) => onOpenShipModal(ord)}
        onConfirmReceived={onConfirmReceived}
        onComplete={onCompleteOrder}
        onReadyForPickup={onReadyForPickup}
        isActionLoading={isAdvancing || isReadyingForPickup}
      />
    </div>
  );
};

export default OrdersPanel;
