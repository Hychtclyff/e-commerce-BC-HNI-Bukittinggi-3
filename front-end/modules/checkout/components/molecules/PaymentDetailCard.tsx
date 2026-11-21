"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  QrCode,
  Building2,
  Download,
  AlertCircle,
  Calendar,
  Smartphone,
  CreditCard,
  Wallet,
  CheckCircle2,
  Clock,
  Receipt,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { OrderReceiptResponse } from "@/types/checkout.types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { toast } from "@/utils/toast";

export interface PaymentDetailCardProps {
  receipt: OrderReceiptResponse;
  onSyncStatus?: () => void;
  isSyncing?: boolean;
  isAutoChecking?: boolean;
}

export const PaymentDetailCard: React.FC<PaymentDetailCardProps> = ({
  receipt,
  onSyncStatus,
  isSyncing = false,
  isAutoChecking = false,
}) => {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const isEn = locale === "en";
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [activeInstructionTab, setActiveInstructionTab] = useState<"mbanking" | "atm" | "ibanking">("mbanking");
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);

  const {
    paymentMethod,
    paymentStatus,
    vaNumber,
    bankCode,
    qrString,
    paymentUrl,
    paymentExpiredAt,
    totalAmount,
    dueDate,
  } = receipt;

  const isVA = paymentMethod.startsWith("VA_");
  const isQRIS = paymentMethod === "QRIS" || paymentMethod === "QRIS_MOCKUP";
  const isEWallet = paymentMethod.startsWith("EWALLET_");
  const isKasbon = paymentMethod === "B2B_CREDIT";
  const isManualBank = paymentMethod === "BANK_TRANSFER_MOCKUP";
  const isCashOrCod = paymentMethod === "CASH_STORE" || paymentMethod === "COD";

  // Bank display information
  const bankInfo: Record<string, { name: string; tag: string; color: string; bg: string }> = {
    BCA: { name: "Bank Central Asia (BCA)", tag: "BCA", color: "text-blue-700", bg: "bg-blue-600" },
    MANDIRI: { name: "Bank Mandiri", tag: "MANDIRI", color: "text-blue-900", bg: "bg-blue-900" },
    BNI: { name: "Bank Negara Indonesia (BNI)", tag: "BNI", color: "text-teal-700", bg: "bg-teal-700" },
    BRI: { name: "Bank Rakyat Indonesia (BRIVA)", tag: "BRI", color: "text-blue-700", bg: "bg-blue-700" },
    BSI: { name: "Bank Syariah Indonesia (BSI)", tag: "BSI SYARIAH", color: "text-emerald-700", bg: "bg-emerald-700" },
    PERMATA: { name: "Permata Bank", tag: "PERMATA", color: "text-green-700", bg: "bg-green-700" },
    CIMB: { name: "CIMB Niaga", tag: "CIMB", color: "text-rose-700", bg: "bg-rose-700" },
    MUAMALAT: { name: "Bank Muamalat", tag: "MUAMALAT", color: "text-purple-700", bg: "bg-purple-700" },
  };

  const detectedBank = bankCode ? bankCode.toUpperCase() : paymentMethod.replace("VA_", "").toUpperCase();
  const currentBank = bankInfo[detectedBank] || {
    name: `Bank ${detectedBank}`,
    tag: detectedBank,
    color: "text-primary-sage",
    bg: "bg-primary-sage",
  };

  // E-Wallet display information
  const ewalletInfo: Record<string, { name: string; color: string }> = {
    EWALLET_SHOPEEPAY: { name: "ShopeePay", color: "text-orange-600" },
    EWALLET_OVO: { name: "OVO Cash", color: "text-purple-600" },
    EWALLET_DANA: { name: "DANA Indonesia", color: "text-blue-600" },
    EWALLET_GOPAY: { name: "GoPay / Gojek", color: "text-emerald-600" },
  };
  const currentEWallet = ewalletInfo[paymentMethod] || { name: "E-Wallet", color: "text-primary-sage" };

  const handleCopy = (text: string, type: "va" | "amount" | "account") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "va") {
        setCopiedVa(true);
        setTimeout(() => setCopiedVa(false), 2500);
        toast.success(t("detailCopyVaTitle"), t("detailCopyVaDesc"));
      } else if (type === "amount") {
        setCopiedAmount(true);
        setTimeout(() => setCopiedAmount(false), 2500);
        toast.success(t("detailCopyAmountTitle"), t("detailCopyAmountDesc"));
      } else {
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2500);
        toast.success(t("detailCopyAccTitle"), t("detailCopyAccDesc"));
      }
    }
  };

  // QR Code URL (Use qrString or fallback to paymentUrl or invoice link)
  const qrData = qrString || paymentUrl || `TIJARAH-ORDER-${receipt.orderNumber}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(qrData)}`;

  // Format Expiry or Due Date
  const expiryDisplay = paymentExpiredAt
    ? formatDate(paymentExpiredAt)
    : "24 Jam dari pemesanan";

  return (
    <div className="w-full rounded-2xl border border-border-subtle bg-surface mac-shadow overflow-hidden">
      {/* 1. Header Banner */}
      <div className="p-4 sm:p-6 bg-canvas border-b border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary-sage text-white flex items-center justify-center shrink-0">
            {isVA && <Building2 className="w-5 h-5" />}
            {isQRIS && <QrCode className="w-5 h-5" />}
            {isEWallet && <Smartphone className="w-5 h-5" />}
            {isKasbon && <Calendar className="w-5 h-5" />}
            {isManualBank && <CreditCard className="w-5 h-5" />}
            {isCashOrCod && <Wallet className="w-5 h-5" />}
            {!isVA && !isQRIS && !isEWallet && !isKasbon && !isManualBank && !isCashOrCod && (
              <Receipt className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-primary-sage uppercase tracking-wider">
                {t("detailHeaderTag")}
              </span>
              {paymentStatus === "PAID" ? (
                <TijarahBadge tijarahVariant="success">{t("detailStatusPaid")}</TijarahBadge>
              ) : paymentStatus === "TEMPO_ACTIVE" ? (
                <TijarahBadge tijarahVariant="primary">{t("detailStatusTempo")}</TijarahBadge>
              ) : (
                <TijarahBadge tijarahVariant="warning">{t("detailStatusUnpaid")}</TijarahBadge>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight mt-0.5">
              {isVA && currentBank.name}
              {isQRIS && t("detailQrisTitle")}
              {isEWallet && currentEWallet.name}
              {isKasbon && t("detailKasbonTitle")}
              {isManualBank && t("detailManualBankTitle")}
              {isCashOrCod && (paymentMethod === "COD" ? t("detailCodTitle") : t("detailCashTitle"))}
              {paymentMethod === "ONLINE_XENDIT" && t("detailXenditTitle")}
            </h3>
          </div>
        </div>

        {/* Expiry / Due Date Badge */}
        {paymentStatus === "UNPAID" && (
          <div className="flex items-center gap-2 text-xs text-text-muted bg-surface/80 px-3.5 py-1.5 rounded-full border border-border-subtle shadow-xs">
            <Clock className="w-3.5 h-3.5 text-status-warning shrink-0" />
            <span>
              {t("detailPayBefore")} <strong className="text-text-primary font-bold">{paymentExpiredAt ? formatDate(paymentExpiredAt) : t("detailExpiryDefault")}</strong>
            </span>
          </div>
        )}

        {paymentStatus === "TEMPO_ACTIVE" && dueDate && (
          <div className="flex items-center gap-2 text-xs text-text-muted bg-primary-sage/10 px-3.5 py-1.5 rounded-full border border-primary-sage/30">
            <Calendar className="w-3.5 h-3.5 text-primary-sage shrink-0" />
            <span>
              {t("detailDueDate")} <strong className="text-text-primary font-bold">{formatDate(dueDate)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Unpaid Payment Alert Notice */}
      {paymentStatus === "UNPAID" && (
        <div className="mx-4 mt-4 sm:mx-7 sm:mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-2 flex-wrap">
              <span>{t("detailWaitingTitle", { orderNumber: receipt.orderNumber })}</span>
              {isAutoChecking && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  {t("detailAutoCheckActive")}
                </span>
              )}
            </div>
            <p className="text-text-muted leading-relaxed">
              {t("detailWaitingDesc", { amount: formatCurrency(totalAmount) })}
            </p>
          </div>
        </div>
      )}

      {/* 2. Main Content Body */}
      <div className="p-5 sm:p-7 space-y-6">
        {/* === SECTION A: VIRTUAL ACCOUNT === */}
        {isVA && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Virtual Account Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-surface-subtle/50 border border-border-subtle hover:border-primary-sage/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-muted">{t("detailVaNumberLabel")}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md text-white ${currentBank.bg}`}>
                      {currentBank.tag}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-black text-text-primary tracking-wider break-all">
                    {vaNumber || "381659999896000"}
                  </div>
                  <p className="text-[11px] text-text-muted mt-1">
                    {isEn ? "Account Name:" : "Atas Nama:"}{" "}
                    <strong className="text-text-primary font-semibold">Tijarah / {receipt.userName}</strong>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border-subtle">
                  <TijarahButton
                    type="button"
                    tijarahVariant={copiedVa ? "primary" : "outline"}
                    onClick={() => handleCopy(vaNumber || "381659999896000", "va")}
                    className="w-full text-xs font-bold py-2 flex items-center justify-center gap-2 rounded-lg"
                  >
                    {copiedVa ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>
                      {copiedVa
                        ? (isEn ? "Copied to Clipboard!" : "Tersalin ke Clipboard!")
                        : (isEn ? "Copy VA Number" : "Salin Nomor VA")}
                    </span>
                  </TijarahButton>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-surface-subtle/50 border border-border-subtle hover:border-primary-sage/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-muted">{t("detailTotalBillLabel")}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-status-success/15 text-status-success">
                      {isEn ? "Exact to last digit" : "Tepat hingga digit terakhir"}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-primary-sage">
                    {formatCurrency(totalAmount)}
                  </div>
                  <p className="text-[11px] text-text-muted mt-1">
                    {isEn
                      ? "Automatically verified without transfer receipt"
                      : "Otomatis diverifikasi tanpa konfirmasi bukti transfer"}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border-subtle">
                  <TijarahButton
                    type="button"
                    tijarahVariant={copiedAmount ? "primary" : "outline"}
                    onClick={() => handleCopy(totalAmount.toString(), "amount")}
                    className="w-full text-xs font-bold py-2 flex items-center justify-center gap-2 rounded-lg"
                  >
                    {copiedAmount ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>
                      {copiedAmount
                        ? (isEn ? "Amount Copied!" : "Nominal Tersalin!")
                        : (isEn ? "Copy Amount" : "Salin Nominal")}
                    </span>
                  </TijarahButton>
                </div>
              </div>
            </div>

            {/* Collapsible Tata Cara Bayar Virtual Account */}
            <div className="rounded-xl border border-border-subtle overflow-hidden">
              <button
                type="button"
                onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
                className="w-full px-5 py-3.5 bg-surface-subtle/40 hover:bg-surface-subtle flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-sage" />
                  <span className="text-xs sm:text-sm font-bold text-text-primary">
                    {isEn
                      ? `${currentBank.name} Payment Instructions`
                      : `Petunjuk Cara Pembayaran ${currentBank.name}`}
                  </span>
                </div>
                {isInstructionsOpen ? (
                  <ChevronUp className="w-4 h-4 text-text-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                )}
              </button>

              {isInstructionsOpen && (
                <div className="p-4 sm:p-5 bg-surface border-t border-border-subtle space-y-4">
                  {/* Tabs */}
                  <div className="flex items-center gap-2 border-b border-border-subtle pb-2 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setActiveInstructionTab("mbanking")}
                      className={`text-xs font-bold pb-2 px-3 whitespace-nowrap shrink-0 transition-colors border-b-2 -mb-2 ${
                        activeInstructionTab === "mbanking"
                          ? "border-primary-sage text-primary-sage"
                          : "border-transparent text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {t("detailTabMbanking")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInstructionTab("atm")}
                      className={`text-xs font-bold pb-2 px-3 whitespace-nowrap shrink-0 transition-colors border-b-2 -mb-2 ${
                        activeInstructionTab === "atm"
                          ? "border-primary-sage text-primary-sage"
                          : "border-transparent text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {t("detailTabAtm")} {currentBank.tag}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInstructionTab("ibanking")}
                      className={`text-xs font-bold pb-2 px-3 whitespace-nowrap shrink-0 transition-colors border-b-2 -mb-2 ${
                        activeInstructionTab === "ibanking"
                          ? "border-primary-sage text-primary-sage"
                          : "border-transparent text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {t("detailTabIbanking")}
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="text-xs text-text-muted space-y-2.5 leading-relaxed pt-1">
                    {activeInstructionTab === "mbanking" && (
                      <ol className="list-decimal list-inside space-y-2">
                        <li>{isEn ? `Open ${currentBank.name} Mobile Banking app on your phone.` : `Buka aplikasi Mobile Banking ${currentBank.name} pada smartphone Anda.`}</li>
                        <li>{isEn ? "Select Transfer > Virtual Account or Pay Bill." : "Pilih menu Transfer lalu pilih Virtual Account atau Bayar Tagihan."}</li>
                        <li>{isEn ? "Enter Virtual Account number:" : "Masukkan nomor Virtual Account:"} <strong className="text-text-primary font-mono font-bold">{vaNumber || "381659999896000"}</strong>.</li>
                        <li>{isEn ? `Verify recipient Tijarah / ${receipt.userName} and exact bill amount.` : `Pastikan nama penerima tagihan adalah Tijarah / ${receipt.userName} dan nominal tagihan sesuai.`}</li>
                        <li>{isEn ? "Enter your Mobile Banking PIN to complete payment." : "Masukkan PIN transaksi Mobile Banking Anda untuk menyelesaikan pembayaran."}</li>
                      </ol>
                    )}

                    {activeInstructionTab === "atm" && (
                      <ol className="list-decimal list-inside space-y-2">
                        <li>{isEn ? `Insert your ATM card and PIN at ${currentBank.tag} ATM.` : `Masukkan kartu ATM dan PIN Anda di mesin ATM ${currentBank.tag}.`}</li>
                        <li>{isEn ? "Select Other Transactions > Transfer / Payment." : "Pilih menu Transaksi Lainnya > Transfer / Pembayaran."}</li>
                        <li>{isEn ? "Select To Virtual Account." : "Pilih ke Rekening Virtual Account."}</li>
                        <li>{isEn ? "Enter Virtual Account number:" : "Ketik nomor Virtual Account:"} <strong className="text-text-primary font-mono font-bold">{vaNumber || "381659999896000"}</strong>.</li>
                        <li>{isEn ? "Confirm payment details and select YES to proceed." : "Periksa layar konfirmasi pembayaran, kemudian pilih YA untuk memproses."}</li>
                        <li>{isEn ? "Keep your ATM receipt as proof of transaction." : "Simpan struk ATM sebagai bukti transaksi Anda."}</li>
                      </ol>
                    )}

                    {activeInstructionTab === "ibanking" && (
                      <ol className="list-decimal list-inside space-y-2">
                        <li>{isEn ? `Log in to your ${currentBank.name} Internet Banking portal.` : `Login ke portal Internet Banking ${currentBank.name} Anda.`}</li>
                        <li>{isEn ? "Open Fund Transfer or Virtual Account Payment." : "Buka menu Transfer Dana atau Pembayaran Virtual Account."}</li>
                        <li>{isEn ? "Enter VA number:" : "Masukkan nomor VA:"} <strong className="text-text-primary font-mono font-bold">{vaNumber || "381659999896000"}</strong>.</li>
                        <li>{isEn ? "Verify bill details and enter your authentication token." : "Verifikasi detail tagihan lalu masukkan kode otentikasi / respon token Key Anda."}</li>
                        <li>{isEn ? "Transaction complete and order status will update automatically." : "Transaksi selesai dan status pesanan akan langsung terverifikasi otomatis."}</li>
                      </ol>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === SECTION B: QRIS DINAMIS === */}
        {isQRIS && (
          <div className="flex flex-col md:flex-row items-center gap-8 py-2">
            {/* QR Code Container */}
            <div className="flex flex-col items-center">
              <div className="relative p-3 rounded-3xl bg-white border-2 border-primary-sage/30 shadow-lg group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl}
                  alt="Kode QRIS Tijarah"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl"
                />
                <div className="absolute inset-x-0 bottom-3 flex justify-center">
                  <span className="text-[10px] font-bold bg-white/95 px-3 py-0.5 rounded-full shadow-xs text-text-primary border border-border-subtle flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-primary-sage" />
                    QRIS Standar Nasional (NMID)
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <a
                  href={qrImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`QRIS-${receipt.orderNumber}.png`}
                >
                  <TijarahButton
                    type="button"
                    tijarahVariant="outline"
                    className="text-xs font-bold py-1.5 px-3.5 flex items-center gap-1.5 border-border-subtle"
                  >
                    <Download className="w-3.5 h-3.5 text-primary-sage" />
                    <span>{isEn ? "Download QR Code" : "Unduh Kode QR"}</span>
                  </TijarahButton>
                </a>
              </div>
            </div>

            {/* QRIS Instructions & Details */}
            <div className="flex-1 space-y-4">
              <div className="p-4 rounded-xl bg-surface-subtle/50 border border-border-subtle">
                <span className="text-xs font-semibold text-text-muted">
                  {isEn ? "Total QRIS Payment" : "Total Pembayaran QRIS"}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-primary-sage mt-1">
                  {formatCurrency(totalAmount)}
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {isEn ? "Scan with any QRIS-supported banking or e-wallet app." : "Pindai menggunakan aplikasi apa saja yang mendukung QRIS."}
                </p>
              </div>

              {/* Supported Wallets / Banks Badges */}
              <div>
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                  {isEn ? "Supported Apps:" : "Dapat dipindai dari:"}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    "GoPay",
                    "OVO",
                    "DANA",
                    "ShopeePay",
                    "LinkAja",
                    "BCA Mobile",
                    "Livin' Mandiri",
                    "BRImo",
                    "BSI Mobile",
                  ].map((app) => (
                    <span
                      key={app}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-surface border border-border-subtle text-text-secondary"
                    >
                      {app}
                    </span>
                  ))}
                </div>
              </div>

              {/* How to Pay */}
              <div className="space-y-2 text-xs text-text-muted">
                <div className="font-bold text-text-primary">{isEn ? "Payment Steps:" : "Langkah Pembayaran:"}</div>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>{isEn ? "Open your preferred Mobile Banking or E-Wallet app." : "Buka aplikasi Mobile Banking atau E-Wallet pilihan Anda."}</li>
                  <li>{isEn ? "Select Scan / Pay QR." : "Pilih menu Scan / Bayar QR."}</li>
                  <li>{isEn ? "Point your camera at the QR code." : "Arahkan kamera smartphone ke kode QR di samping."}</li>
                  <li>{isEn ? `Verify the amount (${formatCurrency(totalAmount)}) and confirm payment.` : `Periksa nominal tagihan (${formatCurrency(totalAmount)}) dan konfirmasi pembayaran.`}</li>
                  <li>{isEn ? "Payment will be detected automatically in real time." : "Sistem akan mendeteksi pelunasan secara real-time."}</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* === SECTION C: E-WALLET === */}
        {isEWallet && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-surface-subtle/50 border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-text-muted">{isEn ? "E-Wallet Method" : "Metode Dompet Digital"}</span>
                <h4 className={`text-xl font-black ${currentEWallet.color} mt-0.5`}>
                  {currentEWallet.name}
                </h4>
                <p className="text-xs text-text-muted mt-1">
                  {t("detailTotalBillLabel")}: <strong className="text-text-primary font-bold">{formatCurrency(totalAmount)}</strong>
                </p>
              </div>

              {paymentUrl && (
                <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                  <TijarahButton
                    type="button"
                    tijarahVariant="primary"
                    className="font-extrabold text-xs py-2 px-5 flex items-center gap-2 rounded-lg"
                  >
                    <span>{isEn ? `Continue to ${currentEWallet.name}` : `Lanjutkan ke ${currentEWallet.name}`}</span>
                    <ExternalLink className="w-4 h-4" />
                  </TijarahButton>
                </a>
              )}
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              {isEn
                ? `Click the button above to open ${currentEWallet.name} and authorize payment before the deadline.`
                : `Klik tombol di atas untuk membuka aplikasi ${currentEWallet.name} dan lakukan otorisasi pembayaran sebelum batas waktu berakhir.`}
            </p>
          </div>
        )}

        {/* === SECTION D: KASBON B2B TEMPO H+14 === */}
        {isKasbon && (
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-extrabold text-text-primary">
                  {isEn ? "B2B Credit Facility Applied" : "Fasilitas Kasbon B2B Berhasil Diterapkan"}
                </h4>
                <p className="text-xs text-text-muted mt-0.5">
                  {isEn ? "Invoice of" : "Tagihan sebesar"}{" "}
                  <strong className="text-text-primary font-black">{formatCurrency(totalAmount)}</strong>{" "}
                  {isEn ? "has been recorded in your HNI B2B Credit Ledger." : "telah dicatat ke Buku Kasbon HNI Anda."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-emerald-500/20 text-xs">
              <div>
                <span className="text-text-muted">{t("detailDueDate")}</span>
                <div className="font-extrabold text-emerald-800 dark:text-emerald-300 mt-0.5">
                  {dueDate ? formatDate(dueDate) : (isEn ? "14 Days from Order" : "14 Hari ke Depan")}
                </div>
              </div>
              <div>
                <span className="text-text-muted">{isEn ? "Order Status:" : "Status Pesanan:"}</span>
                <div className="font-extrabold text-text-primary mt-0.5">
                  {isEn ? "Awaiting confirmation from BC HNI 3 Bukittinggi" : "Menunggu Konfirmasi BC HNI 3 Bukittinggi"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === SECTION E: MANUAL BANK TRANSFER TOKO === */}
        {isManualBank && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-surface-subtle/50 border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-text-muted">
                  {isEn ? "Official Store Bank Account (BSI)" : "Rekening Resmi Toko (BSI)"}
                </span>
                <div className="text-xl font-mono font-black text-text-primary mt-1">
                  7123456789
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Bank Syariah Indonesia {isEn ? "acct. name" : "a.n."} <strong>BC HNI 3 Bukittinggi</strong>
                </p>
              </div>
              <TijarahButton
                type="button"
                tijarahVariant={copiedAccount ? "primary" : "outline"}
                onClick={() => handleCopy("7123456789", "account")}
                className="text-xs font-bold py-2 px-4 flex items-center gap-1.5 rounded-lg"
              >
                {copiedAccount ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedAccount ? t("detailCopiedBtn") : (isEn ? "Copy Account No." : "Salin No. Rekening")}</span>
              </TijarahButton>
            </div>

            <div className="text-xs text-text-muted space-y-1 leading-relaxed">
              <p>
                {isEn ? "Transfer exact amount of" : "Transfer tepat senilai"}{" "}
                <strong className="text-text-primary font-bold">{formatCurrency(totalAmount)}</strong>.
              </p>
              <p>
                {isEn
                  ? `After transferring, please confirm via BC3 Admin WhatsApp with your transfer receipt and order #${receipt.orderNumber}.`
                  : `Setelah melakukan transfer, silakan konfirmasi melalui WhatsApp Admin BC3 dengan menyertakan foto struk transfer dan nomor pesanan #${receipt.orderNumber}.`}
              </p>
            </div>
          </div>
        )}

        {/* === SECTION F: CASH / COD === */}
        {isCashOrCod && (
          <div className="p-5 rounded-xl bg-surface-subtle/50 border border-border-subtle flex items-start gap-3">
            <Wallet className="w-5 h-5 text-primary-sage shrink-0 mt-0.5" />
            <div className="text-xs text-text-muted space-y-1">
              <div className="font-bold text-text-primary">
                {paymentMethod === "COD"
                  ? (isEn ? "Pay Cash to Courier (COD)" : "Bayar Tunai ke Kurir (COD)")
                  : (isEn ? "Pay Cash at Outlet Cashier" : "Bayar Tunai di Kasir Outlet")}
              </div>
              <p>
                {paymentMethod === "COD"
                  ? (isEn
                      ? `Prepare exact cash of ${formatCurrency(totalAmount)} to hand over to the courier upon delivery.`
                      : `Siapkan uang pas senilai ${formatCurrency(totalAmount)} untuk diserahkan kepada kurir saat pesanan tiba di alamat Anda.`)
                  : (isEn
                      ? `Please visit BC HNI 3 Bukittinggi cashier (Jl. Sudirman No. 45) with order #${receipt.orderNumber} and pay ${formatCurrency(totalAmount)}.`
                      : `Silakan menuju meja kasir BC HNI 3 Bukittinggi (Jl. Sudirman No. 45) dengan menunjukkan nomor pesanan #${receipt.orderNumber} dan membayar tunai senilai ${formatCurrency(totalAmount)}.`)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer Action Bar (Sync status & Gateway Portal) */}
      <div className="p-4 sm:p-5 bg-surface-subtle/40 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-text-muted w-full sm:w-auto">
          {isAutoChecking && paymentStatus === "UNPAID" ? (
            <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
              <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              <span>
                {isEn
                  ? "Real-time payment sync active"
                  : "Sinkronisasi pembayaran real-time aktif"}
              </span>
            </span>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-primary-sage shrink-0" />
              <span>
                {isEn
                  ? "Instant automatic verification once payment is received."
                  : "Verifikasi instan otomatis setelah pembayaran diterima."}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto sm:justify-end">
          {paymentUrl && (
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <TijarahButton
                type="button"
                tijarahVariant="outline"
                className="text-xs font-bold py-2 px-3.5 flex items-center justify-center gap-1.5 w-full border-border-subtle text-text-secondary hover:text-text-primary"
              >
                <span>{t("detailOpenXendit")}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </TijarahButton>
            </a>
          )}

          {onSyncStatus && paymentStatus === "UNPAID" && (
            <TijarahButton
              type="button"
              tijarahVariant="primary"
              onClick={onSyncStatus}
              isDisabled={isSyncing}
              className="text-xs font-extrabold py-2 px-4 flex items-center justify-center gap-2 w-full sm:w-auto shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? t("detailCheckingStatus") : t("detailCheckStatus")}</span>
            </TijarahButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailCard;
