"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Printer,
  Download,
  MapPin,
  Truck,
  Building2,
  FileText,
  Check,
  CheckCircle2,
  Clock,
  Package,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sliders,
  Wrench,
} from "lucide-react";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge, TijarahBadgeVariant } from "@/components/atom/tijarahBadge";
import { TijarahAlert } from "@/components/atom/tijarahAlert";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { OrderReceiptResponse, OrderStatusType } from "@/types/checkout.types";
import { ReceiptTemplate } from "@/modules/store/components/organism/templates/ReceiptTemplate";
import type { StoreOrder, ReceiptTemplateConfig } from "@/modules/store/types/store.types";
import { toast } from "@/utils/toast";

export interface CheckoutReceiptCardProps {
  receipt: OrderReceiptResponse;
  onPrint?: () => void;
}

export const CheckoutReceiptCard: React.FC<CheckoutReceiptCardProps> = ({
  receipt,
  onPrint,
}) => {
  const t = useTranslations("receipt");
  const locale = useLocale();
  const isEn = locale === "en";
  const [erpTemplate, setErpTemplate] = useState<ReceiptTemplateConfig | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("store_receipt_template");
      if (raw) {
        setErpTemplate(JSON.parse(raw) as ReceiptTemplateConfig);
      }
    } catch {
      // fallback to ReceiptTemplate defaults
    }
  }, []);

  const erpStoreOrder: StoreOrder = useMemo(() => {
    const r = receipt as any;
    return {
      id: r.id || r.orderId || receipt.orderNumber,
      orderNumber: receipt.orderNumber,
      customerName: r.recipientName || r.customerName || r.userName || "Pelanggan",
      customerPhone: r.recipientPhone || r.customerPhone || r.userPhone || "-",
      shippingAddress: receipt.shippingAddressText || "-",
      status: receipt.orderStatus as any,
      paymentStatus: receipt.paymentStatus as any,
      paymentMethod: receipt.paymentMethod as any,
      deliveryMethod: receipt.shippingType === "PICKUP" ? "PICKUP" : "DELIVERY",
      courierName: r.shippingCourier || r.courierName || undefined,
      trackingNumber: r.trackingNumber || r.resiNumber || undefined,
      items: (receipt.items || []).map((it: any, idx: number) => {
        const q = Number(it.qty ?? it.quantity) || 1;
        const unit = Number(it.unitPrice ?? it.price ?? (it.totalPrice ? Number(it.totalPrice) / q : 0)) || 0;
        const sub = Number(it.totalPrice ?? it.subtotal) || unit * q;
        return {
          id: it.id || `item-${idx}`,
          productId: it.productId || "",
          productName: it.productName,
          sku: it.sku || "",
          qty: q,
          quantity: q,
          unitPrice: unit,
          price: unit,
          subtotal: sub,
          points: Number(it.tpPoints ?? it.points) || 0,
        };
      }),
      subtotal: Number(receipt.subtotal) || 0,
      shippingCost: Number(receipt.shippingCost) || 0,
      discountAmount: Number(receipt.discountAmount) || 0,
      totalAmount: Number(receipt.totalAmount) || 0,
      totalPoints: Number(receipt.totalTpPoints) || 0,
      createdAt: receipt.createdAt || new Date().toISOString(),
    };
  }, [receipt]);

  const { orderStatus } = receipt;

  // Timeline steps for order lifecycle
  const lifecycleSteps: {
    status: OrderStatusType;
    label: string;
    icon: React.ElementType;
    desc: string;
  }[] = [
    {
      status: "PENDING_PAYMENT",
      label: isEn ? "Awaiting Payment" : "Menunggu Pembayaran",
      icon: Clock,
      desc: isEn ? "Complete payment using your selected method." : "Selesaikan pembayaran sesuai metode yang dipilih.",
    },
    {
      status: "PROCESSING",
      label: isEn ? "Order Packing" : "Pesanan Dikemas",
      icon: Package,
      desc: isEn ? "Your order is being prepared and packed for shipment." : "Pesanan sedang disiapkan dan dipacking rapi untuk pengiriman.",
    },
    {
      status: "SHIPPED",
      label: isEn ? "Shipped / Ready for Pickup" : "Dalam Pengiriman / Siap Ambil",
      icon: Truck,
      desc: isEn ? "Package is with the courier or ready at the outlet." : "Paket diantar kurir atau siap diambil di outlet.",
    },
    {
      status: "COMPLETED",
      label: isEn ? "Order Completed" : "Pesanan Selesai",
      icon: CheckCircle2,
      desc: isEn ? "Items received & HSIS points posted." : "Barang diterima & poin HSIS terposting.",
    },
  ];

  const getOrderStatusBadge = (status: OrderStatusType | string) => {
    let variant: TijarahBadgeVariant = "secondary";
    let label = status;

    switch (status) {
      case "PENDING_PAYMENT":
        variant = "warning";
        label = t("statusPendingPayment");
        break;
      case "WAITING_APPROVAL":
        variant = "warning";
        label = t("statusWaitingApproval");
        break;
      case "PROCESSING":
        variant = "primary";
        label = t("statusProcessing");
        break;
      case "SHIPPED":
        variant = "primary";
        label = t("statusShipped");
        break;
      case "READY_FOR_PICKUP":
        variant = "warning";
        label = t("statusReadyForPickup");
        break;
      case "DELIVERED":
      case "COMPLETED":
        variant = "success";
        label = t("statusCompleted");
        break;
      case "REJECTED":
        variant = "danger";
        label = t("statusRejected");
        break;
      case "CANCELLED":
        variant = "danger";
        label = t("statusCancelled");
        break;
      default:
        variant = "secondary";
        label = status;
        break;
    }

    return <TijarahBadge tijarahVariant={variant}>{label}</TijarahBadge>;
  };

  const getStatusAlert = () => {
    switch (orderStatus) {
      case "PENDING_PAYMENT":
        return (
          <TijarahAlert
            tijarahVariant="warning"
            title={isEn ? "Awaiting Order Payment" : "Menunggu Pembayaran Pesanan"}
            description={
              isEn
                ? "Please complete payment according to the instructions above so the store can verify your order."
                : "Silakan lakukan pembayaran sesuai instruksi di atas agar pesanan segera diverifikasi oleh tim toko."
            }
          />
        );
      case "PROCESSING":
        return (
          <TijarahAlert
            tijarahVariant="success"
            title={isEn ? "Order Being Prepared" : "Pesanan Sedang Dipersiapkan"}
            description={
              isEn
                ? "Items are in stock and being packed carefully for delivery or pickup."
                : "Barang ready stok dan sedang disiapkan serta dipacking rapi untuk pengiriman atau pengambilan."
            }
          />
        );
      case "SHIPPED":
        return (
          <TijarahAlert
            tijarahVariant="success"
            title={isEn ? "In Transit / Ready for Pickup" : "Dalam Pengiriman / Siap Diambil"}
            description={
              isEn
                ? "Your package has been handed over to the courier or is ready for pickup at BC 3 Bukittinggi."
                : "Paket telah diserahkan ke kurir pengiriman atau siap diambil langsung di outlet BC 3 Bukittinggi."
            }
          />
        );
      case "COMPLETED":
        return (
          <TijarahAlert
            tijarahVariant="success"
            title={isEn ? "Order Completed" : "Transaksi Belanja Selesai"}
            description={
              isEn
                ? "Thank you for shopping at BC HNI 3 Bukittinggi. Transaction TP points have been allocated to HSIS."
                : "Terima kasih telah berbelanja di Pusat Distribusi BC HNI 3 Bukittinggi. Poin TP transaksi telah dialokasikan ke sistem HSIS."
            }
          />
        );
      case "REJECTED":
        return (
          <TijarahAlert
            tijarahVariant="danger"
            title={isEn ? "Order Rejected by Store" : "Pesanan Ditolak oleh Toko"}
            description={
              receipt.rejectionReason ||
              (isEn
                ? "Physical stock in the store warehouse is out of stock. B2B credit or funds will be restored automatically."
                : "Stok fisik produk di gudang toko habis. Plafon Kasbon atau dana akan dipulihkan secara otomatis.")
            }
          />
        );
      default:
        return null;
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Unduh Nota/Resi Resmi sebagai PDF (Menggunakan jsPDF & html2canvas dengan safe color handling)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (typeof window === "undefined") return;
    try {
      setIsGeneratingPdf(true);
      toast.info("Memproses PDF", "Sedang merender nota/resi resmi...");

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element =
        document.getElementById(`erp-receipt-printable-${receipt.orderNumber}`) ||
        document.getElementById(`receipt-printable-${receipt.orderNumber}`);
      if (!element) {
        throw new Error("Elemen nota tidak ditemukan.");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const clonedEl =
            clonedDoc.getElementById(`erp-receipt-printable-${receipt.orderNumber}`) ||
            clonedDoc.getElementById(`receipt-printable-${receipt.orderNumber}`);
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
      const paperMm = erpTemplate?.paperWidth === "58mm" ? 58 : 80;
      const marginMm = 2;
      const contentWidthMm = paperMm - marginMm * 2;
      const contentHeightMm = (canvas.height * contentWidthMm) / canvas.width;
      const pageHeightMm = Math.ceil(contentHeightMm + marginMm * 2);

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: [paperMm, pageHeightMm],
      });

      pdf.addImage(imgData, "PNG", marginMm, marginMm, contentWidthMm, contentHeightMm);

      pdf.save(`Nota-Resi-${receipt.orderNumber}.pdf`);
      toast.success("PDF Berhasil Diunduh", `Nota ${receipt.orderNumber} berhasil disimpan sebagai PDF.`);
    } catch (error: any) {
      console.error("PDF generation error:", error);
      toast.error("Gagal Mengunduh PDF", error.message || "Terjadi kesalahan saat mencetak PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Mini QR stamp for receipt verification
  const verificationQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=2&data=TIJARAH-VERIFIED-${encodeURIComponent(receipt.orderNumber)}`;

  return (
    <div
      id={`receipt-printable-${receipt.orderNumber}`}
      className="w-full max-w-4xl mx-auto rounded-3xl border-2 border-border-subtle bg-surface shadow-2xl overflow-hidden print:shadow-none print:border-none print:p-0 print:max-w-full"
    >
      {/* 1. Action Bar (Download & Print Actions) - Hidden on Print */}
      <div className="p-4 sm:p-5 bg-surface-subtle/50 border-b border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
        <div>
          <span className="text-[11px] font-bold text-primary-sage uppercase tracking-wider block">
            Faktur & Lifecycle Status Terpadu
          </span>
          <h3 className="text-base font-extrabold text-text-primary">
            Struk & Progres Pesanan #{receipt.orderNumber}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Tombol Unduh PDF Nota Resi (menggunakan Template Resi ERP) */}
          <TijarahButton
            type="button"
            tijarahVariant="primary"
            onClick={handleDownloadPdf}
            isDisabled={isGeneratingPdf}
            className="text-xs font-bold py-2 px-4 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? (isEn ? "Rendering PDF..." : "Merender PDF...") : (isEn ? "Download ERP Receipt PDF" : "Unduh Resi / Nota PDF")}</span>
          </TijarahButton>
        </div>
      </div>

      {/* Off-screen ERP Receipt Template for PDF Export */}
      <div
        id={`erp-receipt-printable-${receipt.orderNumber}`}
        aria-hidden="true"
        className="fixed -left-[9999px] top-0 bg-white p-4 pointer-events-none"
      >
        <ReceiptTemplate order={erpStoreOrder} template={erpTemplate} />
      </div>

      {/* Main Unified Card Body */}
      <div className="p-6 sm:p-10 space-y-8 bg-surface print:p-0">
        {/* 2. Header Faktur Toko Resmi */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b-2 border-border-subtle pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-primary-sage tracking-tight">
                TIJARAH
              </span>
              <span className="text-xs font-extrabold text-text-muted">|</span>
              <span className="text-sm sm:text-base font-extrabold text-text-primary">
                BC HNI 3 BUKITTINGGI
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-sm">
              Jl. Sudirman No. 45, Tarok Dipo, Guguk Panjang, Kota Bukittinggi, Sumatera Barat
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              WhatsApp CS: 0812-3456-7890 &bull; https://tijarah.co
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 shrink-0">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Bukti Transaksi Resmi
            </span>
            <div className="text-xl font-mono font-black text-text-primary">
              #{receipt.orderNumber}
            </div>
            <div className="text-xs text-text-muted">
              {formatDate(receipt.createdAt)}
            </div>
            <div className="pt-1 flex sm:justify-end gap-2">
              {getOrderStatusBadge(receipt.orderStatus)}
            </div>
          </div>
        </div>

        {/* 3. TERPADU: Lifecycle Status & Tahapan Progres Toko */}
        <div className="p-5 sm:p-6 rounded-2xl bg-surface-subtle/60 border border-border-subtle space-y-4 print:border-none print:p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-primary-sage">
                Lifecycle & Tahapan Pesanan
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-sage/10 text-primary-sage">
                Real-Time
              </span>
            </div>
          </div>

          {/* Dynamic Status Alert Banner */}
          {getStatusAlert()}

          {/* Horizontal Steps Timeline */}
          {orderStatus !== "REJECTED" ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {lifecycleSteps.map((st) => {
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
                        ? "border-border-subtle bg-surface opacity-90"
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
                      {isPassed && <Check className="w-2.5 h-2.5 text-primary-sage stroke-[2.5]" />}
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
                <span className="font-extrabold block">STATUS: PESANAN DITOLAK (REJECTED)</span>
                <span>
                  {receipt.rejectionReason ||
                    "Stok fisik produk di gudang toko habis. Plafon Kasbon B2B atau dana Anda telah dipulihkan secara otomatis."}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Customer & Shipping Info Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl bg-surface-subtle/50 border border-border-subtle">
          {/* Kolom Pembeli */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              {isEn ? "Buyer & Membership Info" : "Data Pembeli & Kemitraan"}
            </span>
            <div className="text-sm font-black text-text-primary">
              {receipt.userName}
            </div>
            <div className="text-xs text-text-muted">
              {isEn ? "HNI Agent ID:" : "ID Agen HNI:"}{" "}
              <strong className="text-text-primary">{receipt.hniMemberId || "Non-Member"}</strong>
            </div>
            {receipt.isAgentPriceApplied && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-sage mt-1">
                <Check className="w-3 h-3 stroke-[2.5]" />
                {isEn ? "HNI Agent Special Pricing Active" : "Harga Khusus Agen Mitra HNI Aktif"}
              </span>
            )}
          </div>

          {/* Kolom Pengiriman */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              {isEn ? "Destination & Fulfillment" : "Tujuan & Pengambilan"}
            </span>
            <div className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              {receipt.shippingType === "DELIVERY" ? (
                <Truck className="w-4 h-4 text-primary-sage shrink-0" />
              ) : (
                <Building2 className="w-4 h-4 text-accent-gold shrink-0" />
              )}
              <span>
                {receipt.shippingType === "DELIVERY"
                  ? (isEn ? "Courier / Expedition Delivery" : "Kurir / Pengiriman Ekspedisi")
                  : (isEn ? "Store Pickup at BC3 Outlet" : "Ambil di Outlet BC3 (Pickup)")}
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
              {receipt.shippingAddressText || "Outlet BC HNI 3 Bukittinggi (Jl. Sudirman No. 45)"}
            </p>
          </div>

          {/* Baris Pembayaran */}
          <div className="md:col-span-2 pt-3 border-t border-border-subtle/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-text-muted">{isEn ? "Payment Method: " : "Metode Pembayaran: "}</span>
              <strong className="text-text-primary font-bold">
                {receipt.paymentMethod.replace(/_/g, " ")}
              </strong>
              {receipt.vaNumber && (
                <span className="ml-2 font-mono bg-surface px-2 py-0.5 rounded border border-border-subtle">
                  VA: {receipt.vaNumber}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-text-muted">{isEn ? "Payment Status: " : "Status Tagihan: "}</span>
              <span
                className={`font-black px-2.5 py-0.5 rounded-full text-[11px] ${
                  receipt.paymentStatus === "PAID"
                    ? "bg-status-success/20 text-status-success border border-status-success/30"
                    : receipt.paymentStatus === "TEMPO_ACTIVE"
                    ? "bg-primary-sage/20 text-primary-sage border border-primary-sage/30"
                    : "bg-status-warning/20 text-status-warning border border-status-warning/30"
                }`}
              >
                {receipt.paymentStatus === "PAID"
                  ? (isEn ? "PAID (VERIFIED)" : "LUNAS (VERIFIED)")
                  : receipt.paymentStatus === "TEMPO_ACTIVE"
                  ? (isEn ? "TEMPO ACTIVE D+14" : "TEMPO AKTIF H+14")
                  : (isEn ? "UNPAID" : "BELUM LUNAS")}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Tabel Item Belanja */}
        <div className="border border-border-subtle rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs sm:text-sm">
            <thead className="bg-surface-subtle/70 border-b border-border-subtle text-text-muted font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10">No</th>
                <th className="py-3 px-4">{isEn ? "Product Name" : "Nama Produk"}</th>
                <th className="py-3 px-4 text-center w-16">Qty</th>
                <th className="py-3 px-4 text-right">{isEn ? "Price" : "Harga"}</th>
                <th className="py-3 px-4 text-right hidden sm:table-cell">{isEn ? "TP Points" : "Poin TP"}</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {receipt.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-surface-subtle/30 transition-colors">
                  <td className="py-3 px-4 text-text-muted font-medium">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-text-primary block">{item.productName}</span>
                    {item.tpPoints > 0 && (
                      <span className="sm:hidden text-[10px] text-accent-gold font-bold">
                        {item.tpPoints * item.qty} TP
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-text-primary">{item.qty}</td>
                  <td className="py-3 px-4 text-right text-text-muted whitespace-nowrap">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-accent-gold whitespace-nowrap hidden sm:table-cell">
                    {item.tpPoints > 0 ? `${item.tpPoints * item.qty} TP` : "-"}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-text-primary whitespace-nowrap">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 6. Perhitungan Total (Summary Calculation) */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-2">
          {/* QR Stamp & Digital Verification Notice */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-surface-subtle/40 border border-border-subtle w-full sm:w-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={verificationQrUrl}
              alt="QR Verifikasi Struk"
              className="w-14 h-14 rounded-lg bg-white p-1 border border-border-subtle shrink-0"
            />
            <div className="text-[11px] text-text-muted space-y-0.5">
              <div className="font-black text-text-primary uppercase tracking-wide">
                {isEn ? "Digital Receipt Verification" : "Verifikasi Struk Digital"}
              </div>
              <p>{isEn ? "Official encrypted receipt by Tijarah BC3." : "Struk resmi terenkripsi sistem Tijarah BC3."}</p>
              <p className="font-mono text-[10px] text-text-muted">ID: {receipt.orderNumber}</p>
            </div>
          </div>

          {/* Breakdown Angka */}
          <div className="w-full sm:w-72 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-text-muted">
              <span>{t("subtotal")}</span>
              <span className="font-semibold text-text-primary">{formatCurrency(receipt.subtotal)}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>{t("shippingCost")}</span>
              <span className="font-semibold text-text-primary">{formatCurrency(receipt.shippingCost)}</span>
            </div>
            {receipt.discountAmount > 0 && (
              <div className="flex justify-between text-status-success font-bold">
                <span>{t("discount")}</span>
                <span>-{formatCurrency(receipt.discountAmount)}</span>
              </div>
            )}
            {receipt.totalTpPoints > 0 && (
              <div className="flex justify-between text-accent-gold font-extrabold">
                <span>{isEn ? "Total HSIS Points" : "Total Poin HSIS"}</span>
                <span>{receipt.totalTpPoints} TP</span>
              </div>
            )}
            <div className="flex justify-between items-baseline text-base sm:text-lg font-black text-text-primary pt-3 border-t-2 border-border-subtle">
              <span>{t("grandTotal")}</span>
              <span className="text-primary-sage">{formatCurrency(receipt.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* 7. Footer Catatan & Tanda Tangan Kasir */}
        <div className="pt-6 border-t border-border-subtle/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-text-muted">
          <div>
            <p className="font-semibold text-text-primary">
              {isEn
                ? "Thank you for shopping at Tijarah Halal Network International."
                : "Terima kasih telah berbelanja di Tijarah Halal Network International."}
            </p>
            <p className="mt-0.5">
              {isEn
                ? "Purchased items have been checked according to HNI halal & quality standards."
                : "Barang yang sudah dibeli telah dicek sesuai standar halal & kualitas HNI."}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="block font-medium">
              {isEn ? "Cashier / System Validator:" : "Kasir / Validator Sistem:"}
            </span>
            <strong className="text-text-primary font-bold">
              {isEn ? "BC HNI 3 Bukittinggi Digital System" : "Sistem Digital BC HNI 3 Bukittinggi"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutReceiptCard;
