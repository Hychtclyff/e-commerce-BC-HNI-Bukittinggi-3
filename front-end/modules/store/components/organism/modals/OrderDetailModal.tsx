"use client";

import React from "react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { OrderStatusBadge } from "../../molecules/OrderStatusBadge";
import type { StoreOrder } from "../../../types/store.types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import {
  ShoppingBag,
  User,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  FileText,
  Clock,
  Printer,
  XCircle,
  PackageCheck,
  CheckCircle2,
} from "lucide-react";

export interface IOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: StoreOrder | null;
  onPrintReceipt?: (order: StoreOrder) => void;
  onShip?: (order: StoreOrder) => void;
  onConfirmReceived?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
  onReadyForPickup?: (orderId: string) => void;
  isActionLoading?: boolean;
}

export const OrderDetailModal: React.FC<IOrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  onPrintReceipt,
  onShip,
  onConfirmReceived,
  onComplete,
  onReadyForPickup,
  isActionLoading = false,
}) => {
  if (!order) return null;

  const isPickupOrder = order.fulfillmentType === "PICKUP";
  const isUnpaid = order.paymentStatus === "UNPAID";

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rincian Pesanan #${order.orderNumber}`}
      description={`Dibuat pada ${formatDate(order.createdAt)} • Pelanggan: ${order.customerName}`}
      showCancelButton={false}
      closeButtonText="Tutup"
      maxWidth="2xl"
    >
      <div className="space-y-4 pt-1 max-h-[70vh] overflow-y-auto pr-1">
        {/* Status & Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-canvas border border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-muted">Status Pesanan:</span>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(order.status === "PAID" || order.status === "PROCESSING") && !isPickupOrder && !isUnpaid && onShip && (
              <TijarahButton
                type="button"
                tijarahVariant="primary"
                size="sm"
                isLoading={isActionLoading}
                onClick={() => onShip(order)}
                className="text-xs px-3 h-8 font-bold flex items-center gap-1"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Kirim Barang</span>
              </TijarahButton>
            )}

            {(order.status === "PAID" || order.status === "PROCESSING") && isPickupOrder && !isUnpaid && onReadyForPickup && (
              <TijarahButton
                type="button"
                tijarahVariant="success"
                size="sm"
                isLoading={isActionLoading}
                onClick={() => onReadyForPickup(order.id)}
                className="text-xs px-3 h-8 font-bold flex items-center gap-1"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Siap Diambil</span>
              </TijarahButton>
            )}

            {order.status === "SHIPPED" && onConfirmReceived && !isPickupOrder && (
              <TijarahButton
                type="button"
                tijarahVariant="success"
                size="sm"
                isLoading={isActionLoading}
                onClick={() => onConfirmReceived(order.id)}
                className="text-xs px-3 h-8 font-bold flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Konfirmasi Diterima</span>
              </TijarahButton>
            )}

            {order.status === "READY_FOR_PICKUP" && isPickupOrder && onComplete && (
              <TijarahButton
                type="button"
                tijarahVariant="primary"
                size="sm"
                isLoading={isActionLoading}
                onClick={() => onComplete(order.id)}
                className="text-xs px-3 h-8 font-bold flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesaikan Pesanan</span>
              </TijarahButton>
            )}

            {order.status === "DELIVERED" && onComplete && (
              <TijarahButton
                type="button"
                tijarahVariant="primary"
                size="sm"
                isLoading={isActionLoading}
                onClick={() => onComplete(order.id)}
                className="text-xs px-3 h-8 font-bold flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesaikan Pesanan</span>
              </TijarahButton>
            )}

            {onPrintReceipt && (
              <TijarahButton
                type="button"
                tijarahVariant="secondary"
                size="sm"
                onClick={() => onPrintReceipt(order)}
                className="text-xs px-2.5 h-8 font-semibold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Resi</span>
              </TijarahButton>
            )}
          </div>
        </div>

        {/* Alasan Ditolak jika REJECTED */}
        {order.rejectionReason && (
          <div className="p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 text-xs flex items-start gap-2">
            <XCircle className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-status-danger block">Alasan Penolakan:</span>
              <p className="text-text-primary mt-0.5">{order.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Informasi Pelanggan & Pengiriman */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-canvas border border-border-subtle space-y-2">
            <span className="font-bold text-text-primary flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-text-muted">
              <User className="w-3.5 h-3.5 text-primary-sage" />
              Informasi Pelanggan
            </span>
            <div className="space-y-1">
              <p className="font-bold text-sm text-text-primary">{order.customerName}</p>
              <p className="text-text-muted flex items-center gap-1.5">
                <Phone className="w-3 h-3" />
                {order.customerPhone || "Tanpa Nomor Telepon"}
              </p>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-sage/15 text-primary-sage border border-primary-sage/20">
                Tipe: {order.customerType || "KONSUMEN"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-canvas border border-border-subtle space-y-2">
            <span className="font-bold text-text-primary flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-text-muted">
              <Truck className="w-3.5 h-3.5 text-primary-sage" />
              Metode & Alamat Kirim
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-text-primary">{order.shippingMethod || "Kurir Standar"}</p>
              <p className="text-text-muted flex items-start gap-1.5 leading-relaxed">
                <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{order.shippingAddress || "Alamat Toko BC 3"}</span>
              </p>
              {order.trackingNumber && (
                <div className="pt-1">
                  <span className="font-mono text-[11px] font-bold text-primary-sage bg-primary-sage/15 px-2 py-0.5 rounded-md border border-primary-sage/25">
                    Resi: {order.courierName ? `${order.courierName} - ` : ""}
                    {order.trackingNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rincian Produk Pesanan (Tabel) */}
        <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface">
          <div className="px-4 py-2.5 bg-canvas/80 border-b border-border-subtle flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-primary-sage" />
              Daftar Barang ({order.items.length} Produk)
            </span>
            <span className="text-[10px] text-text-muted">Semua barang telah diverifikasi ready</span>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-canvas/40 text-text-muted uppercase text-[10px] font-bold">
                <th className="py-2 px-3">Produk</th>
                <th className="py-2 px-3 text-center">Qty</th>
                <th className="py-2 px-3 text-right">Harga</th>
                <th className="py-2 px-3 text-right">Poin TP</th>
                <th className="py-2 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {order.items.map((line, idx) => (
                <tr key={idx} className="hover:bg-canvas/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-text-primary">{line.productName}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-text-primary">{line.quantity}</td>
                  <td className="py-2.5 px-3 text-right text-text-muted">{formatCurrency(line.price)}</td>
                  <td className="py-2.5 px-3 text-right text-status-success font-bold">
                    +{line.points ? line.points * line.quantity : 0} TP
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-text-primary">
                    {formatCurrency(line.quantity * line.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Rincian Pembayaran */}
          <div className="p-3.5 bg-canvas/60 border-t border-border-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="text-text-muted flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                Metode Pembayaran: <strong className="text-text-primary">{order.paymentMethod}</strong>
              </span>
              <span className="text-[10px] text-text-muted block">
                Status Bayar:{" "}
                <strong
                  className={order.paymentStatus === "PAID" ? "text-status-success" : "text-status-warning"}
                >
                  {order.paymentStatus === "PAID" ? "LUNAS (Terverifikasi)" : "BELUM LUNAS (Kasbon/Pending)"}
                </strong>
              </span>
            </div>

            <div className="text-right sm:self-end">
              <span className="text-[10px] text-text-muted block">Total Tagihan:</span>
              <span className="text-base font-black text-primary-sage block">
                {formatCurrency(order.totalAmount)}
              </span>
              {order.totalPoints ? (
                <span className="text-[10px] text-status-success font-bold block">
                  +{order.totalPoints} Poin TP HNI
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Catatan Khusus */}
        {order.notes && (
          <div className="p-3 rounded-xl bg-canvas border border-border-subtle text-xs space-y-1">
            <span className="font-bold text-text-primary flex items-center gap-1.5 text-[11px]">
              <FileText className="w-3 h-3 text-primary-sage" />
              Catatan dari Pembeli / Kasir:
            </span>
            <p className="text-text-muted italic">{order.notes}</p>
          </div>
        )}

        {/* Timeline Perubahan Status */}
        {order.timeline && order.timeline.length > 0 && (
          <div className="p-3.5 rounded-xl bg-canvas border border-border-subtle space-y-2">
            <span className="font-bold text-text-primary flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-text-muted">
              <Clock className="w-3.5 h-3.5 text-primary-sage" />
              Histori Alur Status Pesanan
            </span>
            <div className="space-y-2 relative pl-4 border-l-2 border-primary-sage/30 mt-1">
              {order.timeline.map((evt, idx) => (
                <div key={idx} className="relative text-xs">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary-sage border-2 border-surface" />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-text-primary">{evt.status}</span>
                    <span className="text-[10px] text-text-muted">{formatDate(evt.timestamp)}</span>
                  </div>
                  <p className="text-text-muted text-[11px] mt-0.5 leading-snug">{evt.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TijarahModal>
  );
};

export default OrderDetailModal;
