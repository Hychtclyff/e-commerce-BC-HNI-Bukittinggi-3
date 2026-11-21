"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  B2BCreditProfileData,
  CreditLedgerEntry,
  CreditAccountStatus,
  CreditApplicationPayload,
} from "../../../types/profile.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahAlert } from "@/components/atom/tijarahAlert";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { useProfileTranslation } from "../../../hooks/useProfileTranslation";
import { KasbonApplicationForm } from "../form/kasbonApplicationForm";
import useProfile from "../../../hooks/useProfile";
import {
  CreditCard,
  ChevronDown,
  ChevronUp,
  QrCode,
  Building2,
  FileText,
  Truck,
  CheckCircle2,
  X,
  Copy,
  ShoppingBag,
  RefreshCw,
  Clock,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Info,
} from "lucide-react";

interface KasbonPanelProps {
  creditAccount?: B2BCreditProfileData | null;
  ledgerEntries?: CreditLedgerEntry[];
  daysUntilDue?: number | null;
  isLoading?: boolean;
  isError?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onApplyCredit?: (payload: CreditApplicationPayload) => Promise<any>;
}

export function KasbonPanel({
  creditAccount,
  ledgerEntries = [],
  daysUntilDue,
  isLoading,
  isError,
  error,
  onRefresh,
  onApplyCredit,
}: KasbonPanelProps) {
  const { t, isEn } = useProfileTranslation();
  const tKasbon = useTranslations("kasbonPanel");
  const { applyCreditAccount } = useProfile();

  const [expandedLedgerId, setExpandedLedgerId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"BANK" | "VA" | "QRIS">("QRIS");
  const [copiedText, setCopiedText] = useState(false);

  // Status Kasbon: UNREGISTERED | PENDING_APPROVAL | ACTIVE | REJECTED | LOCKED
  const kasbonStatus: CreditAccountStatus = creditAccount?.status ?? (creditAccount ? "ACTIVE" : "UNREGISTERED");
  const [isReapplying, setIsReapplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplicationSubmit = async (payload: CreditApplicationPayload) => {
    setIsSubmitting(true);
    try {
      if (onApplyCredit) {
        await onApplyCredit(payload);
      } else {
        await applyCreditAccount(payload);
      }
      setIsReapplying(false);
      if (onRefresh) {
        onRefresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. STATE: DALAM PROSES VERIFIKASI / MENUNGGU PERSETUJUAN ADMIN
  // ─────────────────────────────────────────────────────────────────────────────
  if (kasbonStatus === "PENDING_APPROVAL" && !isReapplying) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl">
        <TijarahCard
          tijarahVariant="default"
          className="p-6 sm:p-8 border border-accent-gold/40 bg-gradient-to-br from-surface to-accent-gold/5 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent-gold/15 text-accent-gold flex items-center justify-center shrink-0">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <TijarahBadge tijarahVariant="warning" className="text-xs font-bold mb-1">
                  {tKasbon("pendingBadge")}
                </TijarahBadge>
                <h3 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  {tKasbon("pendingTitle")}
                </h3>
              </div>
            </div>
            {onRefresh && (
              <TijarahButton
                type="button"
                tijarahVariant="outline"
                onClick={onRefresh}
                className="text-xs py-2 px-4 self-start sm:self-auto font-bold"
                startContent={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
              >
                Periksa Status
              </TijarahButton>
            )}
          </div>

          <p className="text-sm text-text-muted mt-5 leading-relaxed">
            {tKasbon("pendingDesc")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 p-4 rounded-xl border border-border-subtle bg-surface shadow-sm">
            <div>
              <span className="text-xs text-text-muted block">{tKasbon("pendingAmount")}</span>
              <span className="text-base font-extrabold text-primary-sage font-mono">
                Rp {(creditAccount?.creditLimit || 2000000).toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-xs text-text-muted block">{tKasbon("pendingTenor")}</span>
              <span className="text-sm font-bold text-text-primary">
                {tKasbon("pendingTenorValue")}
              </span>
            </div>
            <div>
              <span className="text-xs text-text-muted block">{tKasbon("pendingDate")}</span>
              <span className="text-sm font-semibold text-text-primary">
                {creditAccount?.appliedAt
                  ? new Date(creditAccount.appliedAt).toLocaleDateString(isEn ? "en-US" : "id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Hari ini"}
              </span>
            </div>
            <div>
              <span className="text-xs text-text-muted block">{tKasbon("pendingReviewTime")}</span>
              <span className="text-sm font-bold text-accent-gold">
                {tKasbon("pendingReviewTimeValue")}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2.5 text-xs text-text-muted p-3.5 rounded-xl bg-canvas border border-border-subtle">
            <Info className="w-4 h-4 text-primary-sage shrink-0" />
            <span>{tKasbon("pendingNotice")}</span>
          </div>
        </TijarahCard>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. STATE: PENGAJUAN DITOLAK
  // ─────────────────────────────────────────────────────────────────────────────
  if (kasbonStatus === "REJECTED" && !isReapplying) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl">
        <TijarahCard
          tijarahVariant="default"
          className="p-6 sm:p-8 border border-red-300/40 bg-gradient-to-br from-surface to-red-500/5 shadow-xl"
        >
          <div className="flex items-center gap-4 pb-6 border-b border-border-subtle">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 text-red-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <TijarahBadge tijarahVariant="danger" className="text-xs font-bold mb-1">
                {tKasbon("rejectedBadge")}
              </TijarahBadge>
              <h3 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                {tKasbon("rejectedTitle")}
              </h3>
            </div>
          </div>

          <p className="text-sm text-text-muted mt-5 leading-relaxed">
            {tKasbon("rejectedDesc")}
          </p>

          {creditAccount?.rejectionReason && (
            <div className="mt-4 p-4 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 text-xs sm:text-sm text-red-800 dark:text-red-300">
              <span className="font-bold block mb-1">{tKasbon("rejectedReason")}</span>
              <span>{creditAccount.rejectionReason}</span>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border-subtle flex justify-end">
            <TijarahButton
              type="button"
              tijarahVariant="primary"
              onClick={() => setIsReapplying(true)}
              className="font-bold py-2.5 px-6 text-sm"
            >
              {tKasbon("reapplyBtn")}
            </TijarahButton>
          </div>
        </TijarahCard>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. STATE: BELUM MENDAFTAR (UNREGISTERED) ATAU MODE MENGAJUKAN ULANG
  // ─────────────────────────────────────────────────────────────────────────────
  if (kasbonStatus === "UNREGISTERED" || isReapplying) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl">
        <TijarahCard
          tijarahVariant="default"
          className="p-6 sm:p-8 border border-accent-gold/40 bg-gradient-to-br from-surface to-accent-gold/5 shadow-xl"
        >
          <div className="flex items-start gap-4 pb-6 border-b border-border-subtle">
            <div className="w-12 h-12 rounded-2xl bg-accent-gold/15 text-accent-gold flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-accent-gold uppercase tracking-wider">
                Fasilitas Tempo Khusus Agen HNI
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mt-0.5">
                {tKasbon("gatewayTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
                {tKasbon("gatewaySubtitle")}
              </p>
            </div>
          </div>

          {/* 3 Keuntungan Utama Fasilitas Tempo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="p-4 rounded-xl border border-border-subtle bg-surface flex flex-col gap-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-primary-sage font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>{tKasbon("benefit1Title")}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {tKasbon("benefit1Desc")}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border-subtle bg-surface flex flex-col gap-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-accent-gold font-bold text-sm">
                <Calendar className="w-4 h-4" />
                <span>{tKasbon("benefit2Title")}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {tKasbon("benefit2Desc")}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border-subtle bg-surface flex flex-col gap-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>{tKasbon("benefit3Title")}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {tKasbon("benefit3Desc")}
              </p>
            </div>
          </div>

          {/* Formulir Pengajuan Sederhana Tanpa Birokrasi Ribet */}
          <KasbonApplicationForm
            onSubmit={handleApplicationSubmit}
            isLoading={isSubmitting}
            onSuccess={() => {
              setIsReapplying(false);
              if (onRefresh) onRefresh();
            }}
          />
        </TijarahCard>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. STATE: AKTIF (NORMAL / LOCKED) - DASHBOARD LENGKAP
  // ─────────────────────────────────────────────────────────────────────────────
  const limit = creditAccount?.creditLimit ?? 2000000;
  const currentBalance = creditAccount?.currentBalance ?? 2000000;
  const usedBalance = creditAccount?.usedBalance ?? (limit - currentBalance);
  const isLocked = creditAccount?.isLocked ?? false;

  const usagePercent = Math.min(100, Math.round((usedBalance / limit) * 100));

  const formattedDueDate = creditAccount?.dueDate
    ? new Date(creditAccount.dueDate).toLocaleDateString(isEn ? "en-US" : "id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "H+14";

  // Mock Ledger Entries with purchased product item details if empty
  const defaultLedger: CreditLedgerEntry[] = [
    {
      id: "led_01",
      creditProfileId: "cred_mock_001",
      type: "DISBURSEMENT",
      amount: 750000,
      runningBalance: 750000,
      referenceNo: "INV/2026/09/BC3-0042",
      description: isEn ? "Wholesale Purchase 1 Koli HNI Herba" : "Pengambilan Barang Tempo 1 Koli Herba HNI",
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      items: [
        { id: "p1", productName: "Minyak Herba Sinergi (MHS 100ml)", qty: 5, unitPrice: 45000, tpPoints: 10, totalPrice: 225000 },
        { id: "p2", productName: "Sari Kurma Healthy Dates 350g", qty: 3, unitPrice: 50000, tpPoints: 12, totalPrice: 150000 },
        { id: "p3", productName: "Susu Kambing Etta Goat Milk HNI", qty: 5, unitPrice: 75000, tpPoints: 20, totalPrice: 375000 },
      ],
    },
    {
      id: "led_00",
      creditProfileId: "cred_mock_001",
      type: "REPAYMENT",
      amount: 500000,
      runningBalance: 0,
      referenceNo: "PAY/2026/09/BC3-0012",
      description: isEn ? "Partial Credit Repayment via QRIS BC 3" : "Pelunasan Sebagian Kasbon Via QRIS BC 3",
      createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  const activeEntries = ledgerEntries.length > 0 ? ledgerEntries : defaultLedger;

  const toggleExpand = (id: string) => {
    setExpandedLedgerId((prev) => (prev === id ? null : id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Alert & Status */}
      {isLocked ? (
        <TijarahAlert
          tijarahVariant="danger"
          title={isEn ? "CREDIT ACCOUNT LOCKED (AUTO-LOCK D+14)" : "AKUN KASBON TERKUNCI (AUTO-LOCK H+14)"}
          description={isEn ? "You have overdue payments past the 14-day due limit. Please complete payment to unlock credit option." : "Anda memiliki tunggakan yang telah melewati batas jatuh tempo 14 hari. Silakan lakukan pelunasan ke kasir BC 3 Bukittinggi untuk membuka kembali opsi tempo."}
        />
      ) : daysUntilDue !== null && daysUntilDue !== undefined && daysUntilDue <= 5 ? (
        <TijarahAlert
          tijarahVariant="warning"
          title={isEn ? "CREDIT DUE DATE WARNING" : "PERINGATAN JATUH TEMPO KASBON"}
          description={isEn ? `Your credit balance is due in ${daysUntilDue} days (${formattedDueDate}). Please settle before D+14.` : `Tagihan kasbon Anda akan jatuh tempo dalam ${daysUntilDue} hari (${formattedDueDate}). Harap lunasi sebelum H+14 agar akun tidak ter-lock otomatis.`}
        />
      ) : null}

      {/* 2. Plafon Summary Cards */}
      <TijarahCard tijarahVariant="default" className="p-6 border border-border-subtle">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-text-primary">{t("kasbonManagementTitle", "Manajemen Plafon Kasbon B2B")}</h3>
              <TijarahBadge tijarahVariant={isLocked ? "danger" : "success"} className="text-xs font-bold">
                {isLocked ? t("kasbonLocked", "Terkunci") : t("kasbonActive", "Aktif (Normal)")}
              </TijarahBadge>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {t("kasbonDesc", "Fasilitas belanja tempo khusus Stokis / Agen Terdaftar BC HNI 3 Bukittinggi.")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-2 rounded-xl border border-border-subtle hover:bg-canvas text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                title="Muat Ulang Kasbon"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            )}

            <TijarahButton
              id="pay-kasbon-btn"
              tijarahVariant="primary"
              size="sm"
              onClick={() => setShowPaymentModal(true)}
              className="font-bold py-2.5 px-5 shadow-md flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>{t("payKasbonNow", "Bayar Kasbon Sekarang")}</span>
            </TijarahButton>
          </div>
        </div>

        {isError && (
          <div className="mt-3 p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 text-xs text-status-danger">
            Gagal mengambil data akun kasbon: {error}. Menampilkan data tempo lokal.
          </div>
        )}

        {/* Progress Bar Limit Usage */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-text-muted">{t("creditUsage", "Penggunaan Limit Kredit")}</span>
            <span className="text-text-primary font-bold">{usagePercent}% {t("used", "Dipakai")}</span>
          </div>
          <div className="w-full h-3 rounded-full bg-canvas border border-border-subtle overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                usagePercent > 80 ? "bg-status-danger" : "bg-primary-sage"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>

        {/* 3 Metric Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-canvas p-4 rounded-xl border border-border-subtle/70">
            <span className="text-xs text-text-muted font-medium block">{t("totalCreditLimit", "Total Plafon Kredit")}</span>
            <span className="text-lg font-bold text-text-primary">
              Rp {limit.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="bg-canvas p-4 rounded-xl border border-border-subtle/70">
            <span className="text-xs text-text-muted font-medium block">{t("activeDebt", "Pinjaman Aktif")}</span>
            <span className="text-lg font-extrabold text-status-danger">
              Rp {usedBalance.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="bg-canvas p-4 rounded-xl border border-border-subtle/70">
            <span className="text-xs text-text-muted font-medium block">{t("dueDateH14", "Tanggal Jatuh Tempo (H+14)")}</span>
            <span className="text-sm font-bold text-accent-gold">
              {formattedDueDate}
            </span>
          </div>
        </div>
      </TijarahCard>

      {/* 3. Immutable Credit Ledger Table with Accordion Product Item Details */}
      <TijarahCard tijarahVariant="default" className="p-6 border border-border-subtle">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h4 className="font-bold text-base text-text-primary">{t("ledgerTitle", "Riwayat Mutasi Buku Besar (Credit Ledger)")}</h4>
          <span className="text-xs text-text-muted">{t("immutableLedgerNotice", "*Mutasi bersifat immutable*")}</span>
        </div>

        <div className="flex flex-col gap-3">
          {activeEntries.map((entry) => {
            const isDisbursement = entry.type === "DISBURSEMENT";
            const isExpanded = expandedLedgerId === entry.id;
            const formattedDate = new Date(entry.createdAt).toLocaleDateString(isEn ? "en-US" : "id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={entry.id}
                className="border border-border-subtle rounded-2xl overflow-hidden transition-all bg-surface"
              >
                {/* Accordion Row Header */}
                <div
                  onClick={() => toggleExpand(entry.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-canvas/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TijarahBadge
                      tijarahVariant={isDisbursement ? "warning" : "success"}
                      className="text-xs px-2.5 py-0.5"
                    >
                      {isDisbursement ? t("typeDisbursement", "Pencairan Kasbon") : t("typeRepayment", "Pelunasan Tagihan")}
                    </TijarahBadge>
                    <div>
                      <div className="font-bold text-sm text-text-primary font-mono">
                        {entry.referenceNo || "-"}
                      </div>
                      <div className="text-xs text-text-muted">{formattedDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-right">
                      <div
                        className={`font-extrabold text-sm ${
                          isDisbursement ? "text-status-danger" : "text-status-success"
                        }`}
                      >
                        {isDisbursement ? "+" : "-"} Rp {entry.amount.toLocaleString("id-ID")}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {t("ledgerBalance", "Saldo")}: Rp {entry.runningBalance.toLocaleString("id-ID")}
                      </div>
                    </div>

                    <button type="button" className="text-text-muted hover:text-text-primary">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Accordion Content: Item Details & Nota Receipts */}
                {isExpanded && (
                  <div className="p-4 bg-canvas/40 border-t border-border-subtle/80 flex flex-col gap-4 text-xs animate-fade-in-down">
                    {/* Description */}
                    <div className="text-text-muted font-medium">
                      📌 {t("description", "Keterangan")}: <strong className="text-text-primary">{entry.description}</strong>
                    </div>

                    {/* Receipt Details Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface p-3 rounded-xl border border-border-subtle">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-sage" />
                        <div>
                          <span className="text-[11px] text-text-muted block">{t("invoiceReceipt", "Resi Belanja (Invoice Toko)")}</span>
                          <span className="font-bold font-mono text-text-primary">{entry.referenceNo}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-accent-gold" />
                        <div>
                          <span className="text-[11px] text-text-muted block">{t("shippingReceipt", "Resi Pengiriman / Travel L300")}</span>
                          <span className="font-bold font-mono text-text-primary">L300-REG-BKT-042</span>
                        </div>
                      </div>
                    </div>

                    {/* Purchased Products Table */}
                    {entry.items && entry.items.length > 0 && (
                      <div>
                        <span className="font-extrabold text-text-primary flex items-center gap-1.5 mb-2">
                          <ShoppingBag className="w-4 h-4 text-primary-sage" />
                          <span>{t("itemDetails", "Rincian Produk Yang Dibeli")} ({entry.items.length}):</span>
                        </span>
                        <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-canvas text-text-muted border-b border-border-subtle">
                              <tr>
                                <th className="py-2 px-3">SKU</th>
                                <th className="py-2 px-3 text-center">{t("qty", "Qty")}</th>
                                <th className="py-2 px-3 text-right">{t("unitPrice", "Harga Satuan")}</th>
                                <th className="py-2 px-3 text-right">Poin TP</th>
                                <th className="py-2 px-3 text-right">{t("subtotal", "Subtotal")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.items.map((prod) => (
                                <tr key={prod.id} className="border-b border-border-subtle/50">
                                  <td className="py-2 px-3 font-semibold text-text-primary">{prod.productName}</td>
                                  <td className="py-2 px-3 text-center font-bold">{prod.qty}</td>
                                  <td className="py-2 px-3 text-right text-text-muted">Rp {prod.unitPrice.toLocaleString("id-ID")}</td>
                                  <td className="py-2 px-3 text-right text-accent-gold font-bold">{prod.tpPoints * prod.qty} TP</td>
                                  <td className="py-2 px-3 text-right font-bold text-text-primary">Rp {prod.totalPrice.toLocaleString("id-ID")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </TijarahCard>

      {/* 4. Payment Modal UI (Transfer Bank, VA, & QRIS) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-border-subtle rounded-3xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-5 relative animate-pop-in">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-5 right-5 text-text-muted hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-primary-sage">{t("payKasbon", "Pelunasan Kasbon B2B")}</span>
              <h3 className="text-xl font-extrabold text-text-primary">{t("selectPaymentMethod", "Pilih Metode Pembayaran")}</h3>
              <p className="text-xs text-text-muted mt-0.5">{t("activeDebt", "Total Tagihan Kasbon Aktif")}: <strong className="text-status-danger font-bold text-sm">Rp {usedBalance.toLocaleString("id-ID")}</strong></p>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-canvas p-1 rounded-xl border border-border-subtle">
              <button
                type="button"
                onClick={() => setPaymentMethod("QRIS")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === "QRIS" ? "bg-primary-sage text-white shadow" : "text-text-muted hover:text-text-primary"
                }`}
              >
                <QrCode className="w-4 h-4" /> QRIS BC 3
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("VA")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === "VA" ? "bg-primary-sage text-white shadow" : "text-text-muted hover:text-text-primary"
                }`}
              >
                <Building2 className="w-4 h-4" /> Virtual Acc
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("BANK")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === "BANK" ? "bg-primary-sage text-white shadow" : "text-text-muted hover:text-text-primary"
                }`}
              >
                <CreditCard className="w-4 h-4" /> Transfer Bank
              </button>
            </div>

            {/* Selected Method Details */}
            {paymentMethod === "QRIS" && (
              <div className="flex flex-col items-center justify-center gap-3 p-4 bg-canvas rounded-2xl border border-border-subtle text-center">
                <div className="w-44 h-44 bg-white p-2 rounded-2xl shadow border border-border-subtle flex items-center justify-center">
                  <QrCode className="w-36 h-36 text-slate-800" />
                </div>
                <span className="text-xs font-bold text-text-primary">{t("qrisPayment", "Scan QRIS BC HNI 3 Bukittinggi")}</span>
                <span className="text-[11px] text-text-muted">BCA, Mandiri, BSI, GoPay, OVO, ShopeePay</span>
              </div>
            )}

            {paymentMethod === "VA" && (
              <div className="flex flex-col gap-3 p-4 bg-canvas rounded-2xl border border-border-subtle text-xs">
                <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-border-subtle">
                  <span className="text-text-muted font-medium">BSI Virtual Account:</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-sm text-primary-sage">
                    <span>9988 0123 4567 8900</span>
                    <button type="button" onClick={() => copyToClipboard("9988012345678900")} className="text-text-muted hover:text-text-primary">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "BANK" && (
              <div className="flex flex-col gap-3 p-4 bg-canvas rounded-2xl border border-border-subtle text-xs">
                <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-border-subtle">
                  <span className="text-text-muted font-medium">BSI Bukittinggi (BC HNI 3):</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-sm text-text-primary">
                    <span>7123456789</span>
                    <button type="button" onClick={() => copyToClipboard("7123456789")} className="text-text-muted hover:text-text-primary">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {copiedText && (
              <div className="text-center text-xs text-status-success font-bold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Copied!
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
              <TijarahButton tijarahVariant="ghost" size="sm" onClick={() => setShowPaymentModal(false)}>
                {t("cancel", "Tutup")}
              </TijarahButton>
              <TijarahButton tijarahVariant="primary" size="sm" onClick={() => setShowPaymentModal(false)} className="font-bold">
                {t("saveChanges", "Konfirmasi Pembayaran")}
              </TijarahButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
