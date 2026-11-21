"use client";

import React from "react";
import {
  Clock,
  ShieldAlert,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Sparkles,
} from "lucide-react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge, TijarahBadgeVariant } from "@/components/atom/tijarahBadge";
import { TijarahAlert } from "@/components/atom/tijarahAlert";
import { OrderStatusType, PaymentStatusType } from "@/types/checkout.types";

export interface OrderStatusLifecycleCardProps {
  orderStatus: OrderStatusType;
  paymentMethod: string;
  paymentStatus: PaymentStatusType;
  rejectionReason?: string;
}

export const OrderStatusLifecycleCard: React.FC<OrderStatusLifecycleCardProps> = ({
  orderStatus,
  paymentMethod,
  paymentStatus,
  rejectionReason,
}) => {
  const steps: {
    status: OrderStatusType;
    label: string;
    icon: React.ElementType;
    desc: string;
  }[] = [
    {
      status: "PENDING_PAYMENT",
      label: "Menunggu Pembayaran",
      icon: Clock,
      desc: "Selesaikan pembayaran sesuai metode yang dipilih.",
    },
    {
      status: "PROCESSING",
      label: "Pesanan Dikemas",
      icon: Package,
      desc: "Pesanan sedang disiapkan dan dipacking rapi untuk pengiriman.",
    },
    {
      status: "SHIPPED",
      label: "Pengiriman / Siap Ambil",
      icon: Truck,
      desc: "Paket diantar kurir Travel L300 atau siap di outlet.",
    },
    {
      status: "COMPLETED",
      label: "Pesanan Selesai",
      icon: CheckCircle2,
      desc: "Pesanan telah diterima dan poin HSIS diposting.",
    },
  ];

  const getStatusAlert = () => {
    switch (orderStatus) {
      case "PENDING_PAYMENT":
        return (
          <TijarahAlert
            tijarahVariant="warning"
            title="Menunggu Pembayaran Instan / Transfer"
            description="Silakan lakukan pembayaran sesuai instruksi invoice untuk melanjutkan proses verifikasi toko."
          />
        );
      case "PROCESSING":
        return (
          <TijarahAlert
            tijarahVariant="success"
            title="Pesanan Sedang Dipersiapkan"
            description="Barang ready stok dan sedang disiapkan untuk pengiriman atau pengambilan."
          />
        );
      case "SHIPPED":
        return (
          <TijarahAlert
            tijarahVariant="success"
            title="Dalam Pengiriman / Siap Diambil"
            description="Paket telah diserahkan ke armada Travel L300 Regional atau siap diambil langsung di outlet BC 3 Bukittinggi."
          />
        );
      case "COMPLETED":
        return (
          <TijarahAlert
            tijarahVariant="success"
            title="Transaksi Belanja Selesai"
            description="Terima kasih telah berbelanja di Pusat Distribusi BC HNI 3 Bukittinggi. Poin TP transaksi telah dialokasikan ke sistem HSIS."
          />
        );
      case "REJECTED":
        return (
          <TijarahAlert
            tijarahVariant="danger"
            title="Pesanan Ditolak oleh Owner Toko"
            description={
              rejectionReason ||
              "Stok fisik produk di gudang toko habis. Plafon Kasbon B2B Anda telah dipulihkan secara otomatis."
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-5 p-6 rounded-3xl border border-border-subtle bg-surface shadow-md">
      <div>
        <span className="text-xs uppercase font-extrabold tracking-wider text-primary-sage block">
          Lifecycle Status Pesanan Pelanggan
        </span>
        <h3 className="text-lg font-black text-text-primary mt-0.5">
          Progres & Tahapan Verifikasi Toko
        </h3>
      </div>

      {/* Dynamic Status Alert Banner */}
      {getStatusAlert()}

      {/* Horizontal Steps Timeline */}
      {orderStatus !== "REJECTED" ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
          {steps.map((st, idx) => {
            const stepIndexOrder = ["PENDING_PAYMENT", "PROCESSING", "SHIPPED", "COMPLETED"];
            const currentIdx = stepIndexOrder.indexOf(orderStatus);
            const thisIdx = stepIndexOrder.indexOf(st.status);
            const isPassed = currentIdx >= thisIdx;
            const isCurrent = currentIdx === thisIdx;

            return (
              <div
                key={st.status}
                className={`p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                  isCurrent
                    ? "border-primary-sage bg-primary-sage/10 shadow-xs"
                    : isPassed
                    ? "border-border-subtle bg-canvas opacity-80"
                    : "border-border-subtle bg-canvas/40 opacity-40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                      isCurrent
                        ? "bg-primary-sage text-surface"
                        : isPassed
                        ? "bg-primary-sage/20 text-primary-sage"
                        : "bg-canvas text-text-muted"
                    }`}
                  >
                    <st.icon className="w-3.5 h-3.5" />
                  </div>
                  {isPassed && <CheckCircle2 className="w-3 h-3 text-primary-sage stroke-[2.5]" />}
                </div>

                <div>
                  <h5 className="text-xs font-bold text-text-primary leading-tight">
                    {st.label}
                  </h5>
                  <p className="text-[10px] text-text-muted mt-0.5 leading-snug line-clamp-2">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-status-danger/10 border border-status-danger/30 flex items-center gap-3 text-status-danger">
          <XCircle className="w-6 h-6 shrink-0" />
          <div className="text-xs">
            <span className="font-extrabold block">STATUS: DITOLAK (REJECTED)</span>
            <span>
              Plafon Kasbon B2B dipulihkan. Silakan lakukan pemesanan ulang atau hubungi admin BC 3 Bukittinggi.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
export default OrderStatusLifecycleCard;
