"use client";

import { StoreOrder, type ReceiptTemplateConfig } from "@/modules/store/types/store.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, CheckCircle2, User, Award, Phone } from "lucide-react";
import { useAuthStore } from "@/modules/auth/services/auth.store";

export interface IReceiptTemplateProps {
  order: StoreOrder;
  template?: ReceiptTemplateConfig;
  cashierName?: string;
  signatureCode?: string;
}

export const ReceiptTemplate: React.FC<IReceiptTemplateProps> = ({
  order,
  template,
  cashierName,
  signatureCode,
}) => {
  const authUser = useAuthStore((state) => state.user);
  const activeCashier =
    cashierName ||
    order.actedByName ||
    authUser?.fullName ||
    authUser?.name ||
    "Kasir Toko BC3 Bukittinggi";

  const verificationHash =
    signatureCode ||
    order.actedBySignatureCode ||
    `SIG-${order.orderNumber}-${order.id.slice(-6)}-${Date.now().toString(36).toUpperCase()}`;

  const safeTemplate: ReceiptTemplateConfig = {
    storeName: template?.storeName || "TIJARAH BC 3 BUKITTINGGI",
    tagline: template?.tagline || "Business Center Resmi HNI Halal Network",
    whatsappContact: template?.whatsappContact || "081267890123",
    storeAddress: template?.storeAddress || "Jl. Panorama No. 18, Guguk Panjang, Bukittinggi",
    headerNotice: template?.headerNotice || "Nota Transaksi & Bukti Serah Terima Syariah",
    footerNotes:
      template?.footerNotes ||
      "Barang herba yang telah dibeli dilindungi jaminan keaslian segel HNI. Tukar kemasan cacat maksimal 2x24 jam.",
    greetingMessage: template?.greetingMessage || "Jazakumullah Khairan Telah Berbelanja di BC 3",
    paperWidth: template?.paperWidth || "80mm",
    showPoints: template?.showPoints ?? true,
    showCourier: template?.showCourier ?? true,
    showBarcode: template?.showBarcode ?? true,
    showQrCode: template?.showQrCode ?? true,
  };

  const widthClass = safeTemplate.paperWidth === "58mm" ? "max-w-[260px]" : "max-w-[340px]";

  return (
    <TijarahCard
      tijarahVariant="default"
      className={`${widthClass} mx-auto bg-white text-slate-900 p-5 rounded-2xl border border-slate-300 font-mono text-[11px] leading-tight shadow-md select-none print:shadow-none print:border-none`}
    >
      {/* 1. Header Toko & Tagline */}
      <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1 leading-normal">
        <div className="inline-flex items-center justify-center gap-1.5 mb-1">
          <Award className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase leading-none">
            Halal Mart HNI
          </span>
        </div>

        <h3 className="font-black text-xs uppercase tracking-wider text-slate-900">
          {safeTemplate.storeName}
        </h3>
        <p className="text-[9px] text-slate-600 font-sans">{safeTemplate.tagline}</p>
        <p className="text-[9px] text-slate-500 font-sans">{safeTemplate.storeAddress}</p>
        {safeTemplate.whatsappContact && (
          <p className="text-[9px] text-slate-600 font-sans font-bold">
            WA: {safeTemplate.whatsappContact}
          </p>
        )}
      </div>

      {/* 2. Rincian Nota & Kasir (Dilayani Oleh) */}
      <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-slate-500">No. Nota / PO:</span>
          <span className="font-bold text-slate-900">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Waktu Transaksi:</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Nama Pelanggan:</span>
          <span className="font-bold text-slate-900">{order.customerName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Metode Bayar:</span>
          <span className="font-bold uppercase text-emerald-800">{order.paymentMethod}</span>
        </div>

        {/* POIN 8: Dilayani Oleh */}
        <div className="flex justify-between items-center pt-1 border-t border-dotted border-slate-200 text-slate-700">
          <span className="text-slate-500">Dilayani oleh:</span>
          <span className="font-bold text-slate-900">{activeCashier}</span>
        </div>

        {order.trackingNumber && safeTemplate.showCourier && (
          <div className="flex justify-between items-center text-blue-700 font-bold pt-0.5">
            <span>No. Resi ({order.courierName || "Kurir"}):</span>
            <span className="font-mono">{order.trackingNumber}</span>
          </div>
        )}
      </div>

      {/* 3. Daftar Produk Pesanan */}
      <div className="py-2.5 border-b border-dashed border-slate-300 space-y-2">
        <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
          Rincian Produk Herba
        </div>

        {order.items && order.items.length > 0 ? (
          order.items.map((it: any, idx: number) => {
            const qty = Number(it.quantity ?? it.qty ?? 1);
            const price = Number(it.price ?? it.unitPrice ?? 0);
            const lineTotal = Number(it.subtotal ?? it.totalPrice ?? qty * price);
            return (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="pr-2">
                  <span className="font-bold text-slate-800 block leading-tight">{it.productName}</span>
                  <span className="text-slate-500 text-[10px]">
                    {qty} x {formatCurrency(price)}
                  </span>
                </div>
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  {formatCurrency(lineTotal)}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-slate-400 italic text-center py-2">Tidak ada rincian item</div>
        )}
      </div>

      {/* 4. Total Tagihan & Poin TP */}
      <div className="pt-2.5 pb-2 space-y-1.5 text-xs">
        <div className="flex justify-between items-center font-black text-sm pt-0.5">
          <span>TOTAL BAYAR:</span>
          <span className="text-emerald-800">{formatCurrency(order.totalAmount)}</span>
        </div>

        {order.totalPoints && safeTemplate.showPoints ? (
          <div className="flex justify-between items-center text-[10px] text-emerald-700 font-bold bg-emerald-50 p-1 rounded">
            <span>Akumulasi Poin TP HSIS:</span>
            <span>+{order.totalPoints} TP</span>
          </div>
        ) : null}
      </div>

      {/* 5. Tanda Tangan Elektronik & QR Code Kriptografis (Poin 8) */}
      <div className="my-2 p-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 text-center space-y-1.5">
        <div className="flex items-center justify-center gap-1 text-emerald-800 font-bold text-[10px]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>TANDA TANGAN ELEKTRONIK SAH</span>
        </div>

        <div className="flex items-center justify-center py-1">
          <QRCodeSVG
            value={`TIJARAH-AUTH:${order.orderNumber}|${activeCashier}|${verificationHash}`}
            size={76}
            level="M"
          />
        </div>

        <div className="space-y-0.5">
          <span className="font-mono text-[9px] font-bold text-slate-600 block">{verificationHash}</span>
          <span className="text-[8px] text-slate-500 block font-sans font-semibold">
            Petugas: {activeCashier}
          </span>
          <span className="text-[8px] text-slate-400 block font-sans">
            Telah diverifikasi oleh kasir &amp; teregistrasi secara digital
          </span>
        </div>
      </div>

      {/* 6. Footer Struk */}
      <div className="pt-2 text-center text-[9px] text-slate-500 space-y-1 font-sans">
        <p className="font-bold text-slate-700">{safeTemplate.greetingMessage}</p>
        <p className="whitespace-pre-line text-[8px] leading-tight text-slate-400">
          {safeTemplate.footerNotes}
        </p>
      </div>
    </TijarahCard>
  );
};

export default ReceiptTemplate;
