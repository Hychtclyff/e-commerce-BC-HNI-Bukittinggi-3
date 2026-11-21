"use client";

import React from "react";
import { StoreOrder } from "../../types/store.types";
import type { ReceiptTemplateConfig } from "../../types/store.types";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface StoreReceiptPreviewProps {
  order: StoreOrder;
}

export const StoreReceiptPreview: React.FC<StoreReceiptPreviewProps & { template?: ReceiptTemplateConfig }> = ({ order, template }) => {
  const safeTemplate: ReceiptTemplateConfig = {
    storeName: template?.storeName || "TIJARAH BC 3 BUKITTINGGI",
    tagline: template?.tagline || "Business Center Resmi HNI Halal Network",
    whatsappContact: template?.whatsappContact || "081267890123",
    storeAddress: template?.storeAddress || "Jl. Panorama No. 18, Bukittinggi",
    headerNotice: template?.headerNotice || "",
    footerNotes: template?.footerNotes || "Barang yang sudah dibeli dapat ditukar jika cacat kemasan saat diterima dengan menyertakan video unboxing.",
    greetingMessage: template?.greetingMessage || "Terima Kasih Telah Berbelanja di BC 3",
    paperWidth: template?.paperWidth || "80mm",
    showPoints: template?.showPoints ?? true,
    showCourier: template?.showCourier ?? true,
    showBarcode: template?.showBarcode ?? true,
    showQrCode: template?.showQrCode ?? true,
  };

  const widthClass =
    safeTemplate.paperWidth === "58mm"
      ? "max-w-[240px]"
      : "max-w-[320px]";

  return (
    <div
      className={`${widthClass} bg-white text-slate-900 p-4 rounded-xl border border-slate-200 font-mono text-[11px] leading-tight shadow-inner`}
    >
      {/* Header Nota */}
      <div className="text-center pb-3 border-b border-dashed border-slate-300">
        <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-900 break-words">
          {safeTemplate.storeName}
        </h4>
        <p className="text-[9px] text-slate-500 mt-0.5 break-words">
          {safeTemplate.tagline}
        </p>
        <p className="text-[9px] text-slate-500 break-words">
          {safeTemplate.storeAddress}
        </p>
        {safeTemplate.headerNotice ? (
          <p className="text-[9px] text-slate-500 break-words">{safeTemplate.headerNotice}</p>
        ) : null}
        {safeTemplate.whatsappContact ? (
          <p className="text-[9px] text-slate-500 break-words">WA: {safeTemplate.whatsappContact}</p>
        ) : null}
      </div>

      {/* Rincian Resi */}
      <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-500">No. Order:</span>
          <span className="font-bold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tanggal:</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Customer:</span>
          <span className="font-bold">{order.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Metode Bayar:</span>
          <span>{order.paymentMethod}</span>
        </div>
        {order.trackingNumber && safeTemplate.showCourier && (
          <div className="flex justify-between text-blue-700 font-bold">
            <span>No. Resi ({order.courierName || "Kurir"}):</span>
            <span>{order.trackingNumber}</span>
          </div>
        )}
      </div>

      {/* Item Belanja */}
      <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
        <div className="font-bold text-[10px] text-slate-500 uppercase">Daftar Produk Pesanan</div>
        {order.items && order.items.length > 0 ? (
          order.items.map((it, idx) => (
            <div key={idx} className="flex justify-between items-start text-[11px]">
              <div>
                <span className="font-medium">{it.productName}</span>
                <span className="text-slate-500 block text-[10px]">
                  {it.quantity}x @ {formatCurrency(it.price)}
                </span>
              </div>
              <span className="font-bold">{formatCurrency(it.quantity * it.price)}</span>
            </div>
          ))
        ) : (
          <div className="text-slate-400 italic text-center py-2">Tidak ada rincian item</div>
        )}
      </div>

      {/* Total & Poin */}
      <div className="pt-3 space-y-1.5 text-xs">
        <div className="flex justify-between font-extrabold text-sm pt-1">
          <span>TOTAL PEMBAYARAN:</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
        {order.totalPoints && safeTemplate.showPoints ? (
          <div className="flex justify-between text-[10px] text-emerald-700 font-bold">
            <span>Akumulasi Poin TP:</span>
            <span>+{order.totalPoints} TP</span>
          </div>
        ) : null}
      </div>

      {/* Barcode / QR Code Optional */}
      {(safeTemplate.showBarcode || safeTemplate.showQrCode) && (
        <div className="py-2 border-t border-dashed border-slate-300 flex items-center justify-around text-center mt-3">
          {safeTemplate.showBarcode && (
            <div className="flex flex-col items-center">
              <span className="font-mono text-[9px] tracking-widest bg-slate-100 px-2 py-0.5 border border-slate-300">
                |||| | ||||| || |
              </span>
              <span className="text-[8px] text-slate-500 mt-0.5">{order.orderNumber}</span>
            </div>
          )}
          {safeTemplate.showQrCode && (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border border-slate-300 flex items-center justify-center bg-slate-50">
                <span className="text-[8px] font-bold text-slate-400">QR</span>
              </div>
              <span className="text-[8px] text-slate-500 mt-0.5">Validasi Syariah</span>
            </div>
          )}
        </div>
      )}

      {/* Footer Catatan Toko */}
      <div className="mt-3 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">{safeTemplate.greetingMessage}</p>
        <p className="whitespace-pre-line text-[9px] text-slate-500">{safeTemplate.footerNotes}</p>
      </div>
    </div>
  );
};

export default StoreReceiptPreview;
