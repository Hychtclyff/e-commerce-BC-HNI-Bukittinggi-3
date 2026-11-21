"use client";

import React, { useState } from "react";
import { UserOrderSummary } from "../../types/profile.types";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { useProfileTranslation } from "../../hooks/useProfileTranslation";
import { formatCurrency } from "@/utils/formatters";
import {
  FileText,
  Truck,
  X,
  Printer,
  Building2,
  Calendar,
  CreditCard,
  Sparkles,
  User,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Package,
} from "lucide-react";

interface OrderReceiptModalProps {
  order: UserOrderSummary | null;
  onClose: () => void;
}

export function OrderReceiptModal({ order, onClose }: OrderReceiptModalProps) {
  const { t } = useProfileTranslation();
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!order) return null;

  const invoiceNumber = order.orderNumber || order.invoiceNo;
  const orderDate = order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) : "-");

  const items = order.items && order.items.length > 0
    ? order.items
    : order.previewItems && order.previewItems.length > 0
    ? order.previewItems
    : [];

  // Unduh Nota/Resi Profile sebagai PDF
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (typeof window === "undefined") return;
    try {
      setIsGeneratingPdf(true);
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = document.getElementById(`profile-receipt-printable-${invoiceNumber}`);
      if (!element) {
        throw new Error("Elemen nota tidak ditemukan.");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.getElementById(`profile-receipt-printable-${invoiceNumber}`);
          if (clonedEl) {
            clonedEl.style.color = "#111827";
            clonedEl.style.backgroundColor = "#ffffff";
            const allElements = clonedEl.querySelectorAll("*");
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              const style = htmlEl.getAttribute("style") || "";
              if (style.includes("oklab") || style.includes("oklch") || style.includes("lab(")) {
                htmlEl.removeAttribute("style");
              }
              const computed = window.getComputedStyle(htmlEl);
              if (
                computed.color.includes("lab") ||
                computed.color.includes("oklab") ||
                computed.color.includes("oklch") ||
                computed.borderColor.includes("lab") ||
                computed.borderColor.includes("oklab") ||
                computed.borderColor.includes("oklch")
              ) {
                htmlEl.style.color = "#111827";
                htmlEl.style.borderColor = "#e5e7eb";
              }
              if (
                computed.backgroundColor.includes("lab") ||
                computed.backgroundColor.includes("oklab") ||
                computed.backgroundColor.includes("oklch")
              ) {
                htmlEl.style.backgroundColor = "#ffffff";
              }
            });
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Nota-Resi-${invoiceNumber}.pdf`);
    } catch (error: any) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyInvoice = () => {
    navigator.clipboard.writeText(invoiceNumber);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case "COMPLETED":
        return <TijarahBadge tijarahVariant="success">{t("completed", "Selesai")}</TijarahBadge>;
      case "DELIVERED":
        return <TijarahBadge tijarahVariant="success">{t("deliveredStatus", "Sampai Tujuan")}</TijarahBadge>;
      case "SHIPPED":
        return <TijarahBadge tijarahVariant="primary">{t("shipped", "Dikirim")}</TijarahBadge>;
      case "PROCESSING":
        return <TijarahBadge tijarahVariant="success">{t("processing", "Diproses")}</TijarahBadge>;
      case "PENDING_PAYMENT":
        return <TijarahBadge tijarahVariant="warning">{t("pendingPayment", "Belum Bayar")}</TijarahBadge>;
      case "WAITING_APPROVAL":
        return <TijarahBadge tijarahVariant="warning">{t("waitingApproval", "Menunggu Konfirmasi")}</TijarahBadge>;
      case "READY_FOR_PICKUP":
        return <TijarahBadge tijarahVariant="warning">{t("readyForPickup", "Siap Diambil")}</TijarahBadge>;
      case "REJECTED":
        return <TijarahBadge tijarahVariant="danger">{t("rejectedTab", "Ditolak")}</TijarahBadge>;
      case "CANCELLED":
        return <TijarahBadge tijarahVariant="secondary">{t("cancelled", "Dibatalkan")}</TijarahBadge>;
      default:
        return <TijarahBadge tijarahVariant="secondary">{order.status}</TijarahBadge>;
    }
  };

  return (
    <TijarahModal
      isOpen={!!order}
      onClose={onClose}
      title={{ id: t("invoiceReceipt", "Faktur Resmi & Rincian Pesanan"), en: "Official Invoice & Order Details" }}
      maxWidth="xl"
      variant="default"
      icon={<FileText className="w-5 h-5 text-primary-sage" />}
      showCloseIcon
    >
      <div
        id={`profile-receipt-printable-${invoiceNumber}`}
        className="flex flex-col gap-6 pt-2 max-h-[75vh] overflow-y-auto pr-1"
      >

        {/* Modal Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-border-subtle pr-10">
          <div className="w-12 h-12 rounded-2xl bg-primary-sage/15 text-primary-sage flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase font-extrabold tracking-wider text-primary-sage">
                {t("invoiceReceipt", "Faktur Resmi & Rincian Pesanan")}
              </span>
              {getStatusBadge()}
            </div>
            <h3 className="text-lg sm:text-xl font-black font-mono text-text-primary flex items-center gap-2 mt-1 truncate">
              <span>{invoiceNumber}</span>
              <button
                type="button"
                onClick={handleCopyInvoice}
                title="Salin No Faktur"
                className="text-xs text-text-muted hover:text-primary-sage transition-colors cursor-pointer"
              >
                📋
              </button>
            </h3>
            {copiedMsg && (
              <span className="text-[11px] text-status-success font-bold mt-0.5 block">
                Nomor faktur berhasil disalin!
              </span>
            )}
          </div>
        </div>

        {/* Rejection / Cancellation Alert */}
        {(order.rejectionReason || order.cancellationReason) && (
          <div className="p-4 rounded-2xl bg-status-danger/10 border border-status-danger/30 flex items-start gap-3 text-xs text-status-danger">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">
                {order.status === "REJECTED" ? "Alasan Penolakan Toko:" : "Alasan Pembatalan:"}
              </strong>
              <p className="mt-0.5 leading-relaxed">
                {order.rejectionReason || order.cancellationReason}
              </p>
            </div>
          </div>
        )}

        {/* Key Info Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Metadata Transaksi */}
          <div className="bg-canvas p-4 rounded-2xl border border-border-subtle flex flex-col gap-2">
            <span className="font-extrabold text-primary-sage uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> BC HNI 3 Bukittinggi
            </span>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-text-muted font-medium">Tanggal Transaksi:</span>
              <span className="font-semibold text-text-primary">{orderDate}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-text-muted font-medium">Metode Pembayaran:</span>
              <span className="font-bold text-text-primary">{order.paymentMethod}</span>
            </div>
            {order.dueDate && (
              <div className="flex flex-wrap justify-between gap-2 text-accent-gold font-bold">
                <span>Jatuh Tempo (H+14):</span>
                <span>{new Date(order.dueDate).toLocaleDateString("id-ID")}</span>
              </div>
            )}
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-text-muted font-medium">Posting Poin HSIS:</span>
              <span className="font-mono font-bold text-accent-gold">
                {order.hsisReceiptNo || (order.hsisPostingStatus === "POSTED" ? "POSTED" : "Antrean Sistem")}
              </span>
            </div>
          </div>

          {/* Metadata Pengiriman */}
          <div className="bg-canvas p-4 rounded-2xl border border-border-subtle flex flex-col gap-2">
            <span className="font-extrabold text-accent-gold uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4" /> Info Pengiriman
            </span>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-text-muted font-medium">Opsi Kirim:</span>
              <span className="font-semibold text-text-primary">
                {order.shippingType === "PICKUP" ? "Ambil Sendiri di Toko" : "Diantar Kurir / Kargo"}
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-text-muted font-medium">Kurir / Armada:</span>
              <span className="font-semibold text-text-primary">
                {order.shipping?.courierName || order.shippingCourier || "Armada Toko BC3"}
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-text-muted font-medium">Nomor Resi:</span>
              <span className="font-mono font-bold text-primary-sage">
                {order.trackingNumber || order.shipping?.trackingNumber || "Belum ada resi"}
              </span>
            </div>
            {order.shipping?.destinationAddress && (
              <div className="pt-1 text-[11px] text-text-muted border-t border-border-subtle/60 leading-tight">
                <span className="font-semibold text-text-primary block mb-0.5">Alamat Tujuan:</span>
                {order.shipping.destinationAddress}
              </div>
            )}
          </div>
        </div>

        {/* Product Items Table */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm text-text-primary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent-gold" />
              Daftar Barang ({items.length})
            </span>
            <span className="text-xs text-text-muted font-semibold">
              Harga Mitra Agen & Poin TP Aktif
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-canvas text-text-muted font-semibold border-b border-border-subtle">
                <tr>
                  <th className="py-2.5 px-3">Produk</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Harga</th>
                  <th className="py-2.5 px-3 text-right">Poin TP</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {items.map((it) => {
                  const qty = it.qty || 1;
                  const price = it.unitPrice || 0;
                  const pts = (it.tpPoints || 0) * qty;
                  const tot = it.totalPrice || price * qty;
                  return (
                    <tr key={it.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-text-primary">
                        {it.productName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{qty}</td>
                      <td className="py-2.5 px-3 text-right text-text-muted">
                        {formatCurrency(price)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-accent-gold font-bold">
                        {pts > 0 ? `${pts} TP` : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-text-primary">
                        {formatCurrency(tot)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grand Total Summary */}
        <div className="p-4 rounded-2xl bg-primary-sage/10 border border-primary-sage/30 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs text-text-muted font-semibold block">Total Akumulasi Poin HSIS</span>
            <span className="text-base sm:text-lg font-black text-accent-gold flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              {order.totalPoints} TP
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-text-muted font-semibold block">Total Pembayaran</span>
            <span className="text-lg sm:text-xl font-black text-primary-sage">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border-subtle">
          <TijarahButton
            tijarahVariant="primary"
            size="sm"
            onClick={handleDownloadPdf}
            isDisabled={isGeneratingPdf}
            className="flex items-center gap-1.5 text-xs py-2"
          >
            <FileText className="w-4 h-4" />
            <span>{isGeneratingPdf ? "Merender PDF..." : "Download Resi PDF"}</span>
          </TijarahButton>
          <TijarahButton
            tijarahVariant="outline"
            size="sm"
            onClick={onClose}
            className="font-bold text-xs py-2 px-6"
          >
            Tutup
          </TijarahButton>
        </div>
      </div>
    </TijarahModal>
  );
}

export default OrderReceiptModal;
