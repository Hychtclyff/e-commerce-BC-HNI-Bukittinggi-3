"use client";

import React, { useState } from "react";
import type {
  StoreMetrics,
  StoreOrder,
  StoreInventoryItem,
  StoreTabType,
} from "../../../types/store.types";
import { StoreMetricCard } from "../../molecules/StoreMetricCard";
import { FinancialChart } from "../../molecules/FinancialChart";
import { OrderStatusBadge } from "../../molecules/OrderStatusBadge";
import { OrderActionButtons } from "../../molecules/OrderActionButtons";
import { OrderDetailModal } from "../modals/OrderDetailModal";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { formatCurrency, formatDate } from "@/utils/formatters";
import {
  DollarSign,
  AlertCircle,
  Truck,
  Boxes,
  ArrowRight,
  PackageCheck,
  CheckCircle2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { CurrentTrendsWidget } from "../../molecules/CurrentTrendsWidget";

export interface IOverviewPanelProps {
  metrics: StoreMetrics;
  orders: StoreOrder[];
  inventory: StoreInventoryItem[];
  onNavigateTab: (tab: StoreTabType) => void;
  onOpenShipModal: (order: StoreOrder) => void;
  onOpenRejectModal: (order: StoreOrder) => void;
  onOpenReceiptModal: (order: StoreOrder) => void;
  onConfirmReceived?: (orderId: string) => void;
  onCompleteOrder?: (orderId: string, cashReceived?: number) => void;
  isAdvancing?: boolean;
}

export const OverviewPanel: React.FC<IOverviewPanelProps> = ({
  metrics,
  orders,
  inventory,
  onNavigateTab,
  onOpenShipModal,
  onOpenRejectModal,
  onOpenReceiptModal,
  onConfirmReceived,
  onCompleteOrder,
  isAdvancing = false,
}) => {
  const t = useTranslations("storeErp");

  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<StoreOrder | null>(null);

  // Filter 5 pesanan pengiriman ERP yang butuh tindakan segera (Pickup & POS masuk ke Modul Kasir)
  const urgentOrders = orders
    .filter(
      (o) =>
        !o.orderNumber.startsWith("POS-") &&
        o.fulfillmentType !== "PICKUP" &&
        !Boolean(o.shippingMethod && /pickup|ambil/i.test(o.shippingMethod)) &&
        (o.status === "PENDING" ||
          o.status === "PAID" ||
          o.status === "PROCESSING" ||
          o.status === "SHIPPED")
    )
    .slice(0, 5);

  const lowStockItems = inventory.filter(
    (i) => i.status === "LOW_STOCK" || i.status === "OUT_OF_STOCK"
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Barisan Kartu Metrik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StoreMetricCard
          title={t("metrics.storeRevenue")}
          value={formatCurrency(metrics.totalRevenue)}
          subtitle={t("metrics.positiveGrowth")}
          icon={<DollarSign className="w-5 h-5" />}
          badgeText="+12% bulan ini"
          badgeVariant="success"
        />

        <StoreMetricCard
          title={t("metrics.pendingOrders")}
          value={`${metrics.pendingApprovalCount} Pesanan`}
          subtitle={t("metrics.needsVerification")}
          icon={<AlertCircle className="w-5 h-5 text-status-warning" />}
          badgeText={metrics.pendingApprovalCount > 0 ? "Perlu Tindakan" : "Semua Beres"}
          badgeVariant={metrics.pendingApprovalCount > 0 ? "warning" : "success"}
          isUrgent={metrics.pendingApprovalCount > 0}
        />

        <StoreMetricCard
          title="Siap Kirim (Packaging)"
          value={`${metrics.pendingShipmentCount} Paket`}
          subtitle="Sudah lunas, sedang dikemas"
          icon={<Truck className="w-5 h-5 text-primary-sage" />}
          badgeText="Gudang BC 3"
          badgeVariant="primary"
        />

        <StoreMetricCard
          title="Peringatan Stok SKU"
          value={`${metrics.lowStockCount} Item`}
          subtitle={
            metrics.lowStockCount > 0
              ? "Segera lakukan restock ke pusat"
              : "Semua persediaan aman"
          }
          icon={<Boxes className="w-5 h-5 text-status-danger" />}
          badgeText={metrics.lowStockCount > 0 ? "Restock Diperlukan" : "Stok Aman"}
          badgeVariant={metrics.lowStockCount > 0 ? "danger" : "success"}
          isUrgent={metrics.lowStockCount > 0}
        />
      </div>

      {/* 1b. Shortcut Modul Kasir POS & Task Pickup */}
      <div className="bg-surface border border-border-subtle rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--badge-primary-bg)] border border-[var(--badge-primary-border)] text-[var(--badge-primary-text)] flex items-center justify-center shrink-0">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Terminal Kasir Walk-In (POS) &amp; Antrean Task Pickup Toko
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Terdapat{" "}
              <strong className="text-primary-sage">
                {metrics.pendingPickupCount ?? 0} pesanan Ambil di Toko (Pickup)
              </strong>{" "}
              yang dialihkan ke meja kasir untuk disiapkan dan diserahkan langsung ke pelanggan.
            </p>
          </div>
        </div>
        <TijarahButton
          type="button"
          tijarahVariant="primary"
          size="sm"
          onClick={() => onNavigateTab("cashier")}
          className="text-xs font-semibold h-8 px-3.5 rounded-md shrink-0 flex items-center gap-1.5"
        >
          <span>Buka Modul Kasir &amp; Pickup</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </TijarahButton>
      </div>

      {/* 2. Ringkasan Tren Permintaan & Pasar Saat Ini (Point 5) */}
      <CurrentTrendsWidget onNavigateTab={onNavigateTab} />

      {/* 3. Visualisasi Tren Finansial Cerdas dengan Tooltip & Insight (Poin 15) */}
      <TijarahCard
        tijarahVariant="default"
        className="p-5 sm:p-6 border border-border-subtle mac-glass mac-shadow rounded-2xl"
      >
        <FinancialChart />
      </TijarahCard>

      {/* 3. Pesanan Masuk yang Membutuhkan Tindakan Cepat (Tabel Best-Practice) */}
      <TijarahCard
        tijarahVariant="default"
        className="border border-border-subtle p-5 sm:p-6 mac-glass mac-shadow rounded-2xl"
      >
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-primary-sage" />
              <span>{t("orders.recentTitle")}</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">{t("orders.recentSubtitle")}</p>
          </div>

          <TijarahButton
            type="button"
            heroVariant="ghost"
            size="sm"
            onClick={() => onNavigateTab("orders")}
            className="text-xs font-bold text-primary-sage hover:underline flex items-center gap-1"
          >
            <span>{t("orders.seeAll")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </TijarahButton>
        </div>

        {urgentOrders.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-status-success/10 text-status-success flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-text-primary">Semua Pesanan Selesai Diproses!</p>
              <p className="text-xs text-text-muted mt-0.5">
                Tidak ada antrean pesanan baru yang menunggu persetujuan Anda saat ini.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-canvas/60 text-text-muted uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-2.5 px-4">{t("orders.orderNo")}</th>
                  <th className="py-2.5 px-4">{t("orders.customer")}</th>
                  <th className="py-2.5 px-4">{t("orders.total")}</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">{t("orders.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {urgentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-text-primary">
                      {ord.orderNumber}
                      <span className="block font-sans text-[10px] text-text-muted font-normal mt-0.5">
                        {formatDate(ord.createdAt)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-text-primary block">{ord.customerName}</span>
                      <span className="text-[11px] text-text-muted">{ord.customerPhone || "Tanpa No. HP"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-text-primary block">
                        {formatCurrency(ord.totalAmount)}
                      </span>
                      <span className="text-[10px] text-status-success font-medium">
                        +{ord.totalPoints || 0} Poin TP
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <OrderStatusBadge status={ord.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <OrderActionButtons
                        order={ord}
                        onShip={onOpenShipModal}
                        onConfirmReceived={onConfirmReceived}
                        onComplete={onCompleteOrder}
                        onReject={onOpenRejectModal}
                        onPrint={onOpenReceiptModal}
                        onViewDetail={(order) => setSelectedOrderForDetail(order)}
                        isAdvancing={isAdvancing}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TijarahCard>

      {/* 4. Panel Ringkasan Restock Inventori */}
      {lowStockItems.length > 0 && (
        <TijarahCard
          tijarahVariant="default"
          className="border border-status-warning/40 bg-status-warning/5 p-5 mac-glass rounded-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-text-primary">
                  Perhatian: {lowStockItems.length} Produk Mencapai Batas Minimum Stok
                </h4>
                <p className="text-xs text-text-muted mt-0.5">
                  Produk seperti {lowStockItems.map((i) => i.name).slice(0, 2).join(", ")} mendekati habis.
                  Buka menu restock untuk melihat analisis rekomendasi AI.
                </p>
              </div>
            </div>
            <TijarahButton
              type="button"
              heroVariant="outline"
              size="sm"
              onClick={() => onNavigateTab("restock")}
              className="text-xs font-bold shrink-0"
            >
              Cek Restock AI
            </TijarahButton>
          </div>
        </TijarahCard>
      )}

      {/* Modal Detail Pesanan */}
      <OrderDetailModal
        isOpen={!!selectedOrderForDetail}
        onClose={() => setSelectedOrderForDetail(null)}
        order={selectedOrderForDetail}
        onPrintReceipt={(ord) => onOpenReceiptModal(ord)}
        onShip={(ord) => onOpenShipModal(ord)}
        onConfirmReceived={onConfirmReceived}
        onComplete={onCompleteOrder}
        isActionLoading={isAdvancing}
      />
    </div>
  );
};

export default OverviewPanel;
