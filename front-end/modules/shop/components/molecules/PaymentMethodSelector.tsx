"use client";

import React, { useState } from "react";
import {
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Wallet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { PaymentMethodType } from "../../types/shop.types";

export interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethodType;
  onSelectPaymentMethod: (method: PaymentMethodType) => void;
  isAgent: boolean;
  kasbonEligible?: boolean;
  creditLimitAvailable?: number;
  shippingType?: "PICKUP" | "DELIVERY";
}

interface PaymentOption {
  id: PaymentMethodType;
  name: string;
  desc: string;
  tag: string;
  tagColor?: string;
  badge?: string;
  available: boolean;
  category: "qris" | "va" | "ewallet" | "b2b" | "manual";
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  onSelectPaymentMethod,
  isAgent,
  kasbonEligible = false,
  creditLimitAvailable = 2000000,
  shippingType = "DELIVERY",
}) => {
  // Collapsible category state (all open by default for clear scanability)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const virtualAccounts: PaymentOption[] = [
    {
      id: "VA_BCA",
      name: "BCA Virtual Account",
      desc: "Verifikasi instan via BCA Mobile & KlikBCA",
      tag: "BCA",
      tagColor: "bg-blue-600 text-white",
      badge: "Instan 24 Jam",
      available: true,
      category: "va",
    },
    {
      id: "VA_MANDIRI",
      name: "Mandiri Virtual Account",
      desc: "Verifikasi instan via Livin' by Mandiri & ATM",
      tag: "Mandiri",
      tagColor: "bg-blue-900 text-amber-300",
      badge: "Instan 24 Jam",
      available: true,
      category: "va",
    },
    {
      id: "VA_BNI",
      name: "BNI Virtual Account",
      desc: "Verifikasi instan via BNI Mobile Banking",
      tag: "BNI",
      tagColor: "bg-teal-700 text-white",
      badge: "Instan 24 Jam",
      available: true,
      category: "va",
    },
    {
      id: "VA_BRI",
      name: "BRI Virtual Account (BRIVA)",
      desc: "Verifikasi instan via BRImo & ATM BRI",
      tag: "BRI",
      tagColor: "bg-blue-700 text-orange-200",
      badge: "Instan 24 Jam",
      available: true,
      category: "va",
    },
    {
      id: "VA_BSI",
      name: "BSI Virtual Account",
      desc: "Bank Syariah Indonesia Mobile & ATM",
      tag: "BSI Syariah",
      tagColor: "bg-emerald-700 text-white",
      badge: "Syariah",
      available: true,
      category: "va",
    },
    {
      id: "VA_PERMATA",
      name: "Permata Virtual Account",
      desc: "Verifikasi instan via PermataMobile X",
      tag: "Permata",
      tagColor: "bg-purple-800 text-emerald-200",
      badge: "Instan 24 Jam",
      available: true,
      category: "va",
    },
    {
      id: "VA_MUAMALAT",
      name: "Muamalat Virtual Account",
      desc: "Bank Muamalat Mobile & ATM",
      tag: "Muamalat",
      tagColor: "bg-purple-900 text-white",
      badge: "Syariah",
      available: true,
      category: "va",
    },
    {
      id: "VA_CIMB",
      name: "CIMB Niaga Virtual Account",
      desc: "Verifikasi instan via OCTO Mobile & Clicks",
      tag: "CIMB",
      tagColor: "bg-red-800 text-white",
      badge: "Instan 24 Jam",
      available: true,
      category: "va",
    },
  ];

  const eWallets: PaymentOption[] = [
    {
      id: "EWALLET_SHOPEEPAY",
      name: "ShopeePay",
      desc: "Buka aplikasi Shopee untuk bayar",
      tag: "ShopeePay",
      tagColor: "bg-orange-600 text-white",
      badge: "Aplikasi",
      available: true,
      category: "ewallet",
    },
    {
      id: "EWALLET_GOPAY",
      name: "GoPay",
      desc: "Bayar praktis melalui aplikasi GoPay / Gojek",
      tag: "GoPay",
      tagColor: "bg-emerald-600 text-white",
      badge: "Aplikasi",
      available: true,
      category: "ewallet",
    },
    {
      id: "EWALLET_OVO",
      name: "OVO",
      desc: "Notifikasi pembayaran instan ke aplikasi OVO",
      tag: "OVO",
      tagColor: "bg-purple-700 text-white",
      badge: "Aplikasi",
      available: true,
      category: "ewallet",
    },
    {
      id: "EWALLET_DANA",
      name: "DANA",
      desc: "Verifikasi instan via aplikasi dompet digital DANA",
      tag: "DANA",
      tagColor: "bg-sky-600 text-white",
      badge: "Aplikasi",
      available: true,
      category: "ewallet",
    },
  ];

  // Helper to find currently selected method details for summary banner
  const allMethods: PaymentOption[] = [
    {
      id: "QRIS",
      name: "QRIS Dinamis (Semua E-Wallet & M-Banking)",
      desc: "BCA Mobile, Livin, BRImo, GoPay, OVO, DANA, ShopeePay & aplikasi QRIS",
      tag: "QRIS",
      tagColor: "bg-red-600 text-white",
      badge: "Paling Populer",
      available: true,
      category: "qris",
    },
    ...virtualAccounts,
    ...eWallets,
    {
      id: "B2B_CREDIT",
      name: "Kasbon B2B Tempo (H+14)",
      desc: "Belanja tempo khusus Agen / Stokis HNI terdaftar",
      tag: "Kasbon H+14",
      tagColor: "bg-primary-sage text-white",
      badge: "Tempo H+14",
      available: isAgent,
      category: "b2b",
    },
    {
      id: "BANK_TRANSFER_MOCKUP",
      name: "Transfer Manual Toko (BSI)",
      desc: "Rekening Resmi BC3 Bukittinggi & konfirmasi manual admin",
      tag: "BSI Toko",
      tagColor: "bg-teal-800 text-white",
      badge: "Manual",
      available: true,
      category: "manual",
    },
    {
      id: "CASH_STORE",
      name: "Bayar Tunai di Kasir",
      desc: "Pembayaran tunai saat mengambil pesanan di outlet",
      tag: "Kasir Outlet",
      tagColor: "bg-slate-700 text-white",
      badge: "Outlet",
      available: true,
      category: "manual",
    },
  ];

  const selectedItem = allMethods.find((m) => m.id === paymentMethod);

  return (
    <div className="flex flex-col gap-5">
      {/* Active Selection Banner */}
      {selectedItem && (
        <div className="p-3.5 rounded-2xl bg-primary-sage/10 border border-primary-sage/30 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-sage text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-primary-sage tracking-wider block">
                Metode Pembayaran Terpilih:
              </span>
              <h5 className="text-xs font-black text-text-primary">
                {selectedItem.name}
              </h5>
            </div>
          </div>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-2xs ${selectedItem.tagColor || 'bg-primary-sage text-white'}`}>
            {selectedItem.tag}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SECTION: QRIS DINAMIS */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-600/10 text-red-600 flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-black text-text-primary">
              QRIS (Semua E-Wallet & Mobile Banking)
            </h4>
          </div>
          <span className="text-[10px] font-bold text-primary-sage">Verifikasi Instan</span>
        </div>

        <div
          onClick={() => onSelectPaymentMethod("QRIS")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
            paymentMethod === "QRIS"
              ? "border-primary-sage bg-primary-sage/10 ring-2 ring-primary-sage/20 shadow-xs"
              : "border-border-subtle bg-surface hover:border-primary-sage/40"
          }`}
        >
          <div className="pt-0.5">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
              paymentMethod === "QRIS" ? "border-primary-sage bg-primary-sage" : "border-border-subtle bg-surface"
            }`}>
              {paymentMethod === "QRIS" && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-text-primary">
                QRIS Dinamis Resmi
              </span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-600 text-white">
                QRIS
              </span>
              <TijarahBadge tijarahVariant="primary" className="text-[9px] px-1.5 py-0">
                Paling Praktis
              </TijarahBadge>
            </div>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
              Bisa di-scan dari aplikasi apa saja: GoPay, OVO, DANA, ShopeePay, LinkAja, BCA Mobile, Livin Mandiri, BRImo, BSI Mobile, dll.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION: VIRTUAL ACCOUNT (TRANSFER BANK OTOMATIS) */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-2 pt-2">
        <div
          onClick={() => toggleCategory("va")}
          className="flex items-center justify-between pb-1 border-b border-border-subtle cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-black text-text-primary">
              Virtual Account (Transfer Otomatis 24 Jam)
            </h4>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted hover:text-text-primary">
            <span className="text-[10px] font-medium">{virtualAccounts.length} Bank</span>
            {collapsedCategories["va"] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>

        {!collapsedCategories["va"] && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {virtualAccounts.map((va) => {
              const isSelected = paymentMethod === va.id;
              return (
                <div
                  key={va.id}
                  onClick={() => onSelectPaymentMethod(va.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? "border-primary-sage bg-primary-sage/10 ring-2 ring-primary-sage/20 shadow-xs"
                      : "border-border-subtle bg-surface hover:border-primary-sage/40"
                  }`}
                >
                  <div className="pt-0.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? "border-primary-sage bg-primary-sage" : "border-border-subtle bg-surface"
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs ${va.tagColor}`}>
                        {va.tag}
                      </span>
                      <span className="text-xs font-bold text-text-primary truncate">
                        {va.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">
                      {va.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION: DOMPET DIGITAL (E-WALLET) */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-2 pt-2">
        <div
          onClick={() => toggleCategory("ewallet")}
          className="flex items-center justify-between pb-1 border-b border-border-subtle cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-600/10 text-orange-600 flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-black text-text-primary">
              Dompet Digital (E-Wallet)
            </h4>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted hover:text-text-primary">
            <span className="text-[10px] font-medium">{eWallets.length} Opsi</span>
            {collapsedCategories["ewallet"] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>

        {!collapsedCategories["ewallet"] && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {eWallets.map((ew) => {
              const isSelected = paymentMethod === ew.id;
              return (
                <div
                  key={ew.id}
                  onClick={() => onSelectPaymentMethod(ew.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? "border-primary-sage bg-primary-sage/10 ring-2 ring-primary-sage/20 shadow-xs"
                      : "border-border-subtle bg-surface hover:border-primary-sage/40"
                  }`}
                >
                  <div className="pt-0.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? "border-primary-sage bg-primary-sage" : "border-border-subtle bg-surface"
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs ${ew.tagColor}`}>
                        {ew.tag}
                      </span>
                      <span className="text-xs font-bold text-text-primary">
                        {ew.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">
                      {ew.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. SECTION: KASBON B2B & METODE TOKO */}
      {/* ========================================================================= */}
      {((kasbonEligible && isAgent) || shippingType === "PICKUP") && (
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between pb-1 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600/10 text-primary-sage flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-black text-text-primary">
                {kasbonEligible && isAgent
                  ? shippingType === "PICKUP"
                    ? "Kasbon Tempo H+14 & Toko Fisik"
                    : "Kasbon Tempo H+14"
                  : "Pembayaran di Toko Fisik"}
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {/* Kasbon B2B: hanya tampil jika sudah terverifikasi / eligible kasbon */}
            {kasbonEligible && isAgent && (
              <div
                onClick={() => onSelectPaymentMethod("B2B_CREDIT")}
                className={`p-3 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
                  paymentMethod === "B2B_CREDIT"
                    ? "border-primary-sage bg-primary-sage/10 ring-1 ring-primary-sage/30"
                    : "border-border-subtle bg-surface hover:border-primary-sage/40"
                }`}
              >
                <div className="pt-0.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    paymentMethod === "B2B_CREDIT" ? "border-primary-sage bg-primary-sage" : "border-border-subtle bg-surface"
                  }`}>
                    {paymentMethod === "B2B_CREDIT" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-text-primary">
                      Kasbon B2B Tempo (H+14)
                    </span>
                    <TijarahBadge tijarahVariant="primary" className="text-[9px] px-1.5 py-0">
                      Tempo H+14
                    </TijarahBadge>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Khusus Agen / Stokis HNI terverifikasi.
                  </p>
                  <span className="text-[9px] font-bold text-primary-sage flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3 h-3" /> Plafon Tersedia
                  </span>
                </div>
              </div>
            )}

            {/* Bayar Tunai di Kasir: hanya muncul jika metode pengambilan PICKUP */}
            {shippingType === "PICKUP" && (
              <div
                onClick={() => onSelectPaymentMethod("CASH_STORE")}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                  paymentMethod === "CASH_STORE"
                    ? "border-primary-sage bg-primary-sage/10 ring-1 ring-primary-sage/30"
                    : "border-border-subtle bg-surface hover:border-primary-sage/40"
                }`}
              >
                <div className="pt-0.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    paymentMethod === "CASH_STORE" ? "border-primary-sage bg-primary-sage" : "border-border-subtle bg-surface"
                  }`}>
                    {paymentMethod === "CASH_STORE" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-text-primary">
                      Bayar Tunai di Kasir (Cash on Store)
                    </span>
                    <TijarahBadge tijarahVariant="secondary" className="text-[9px] px-1.5 py-0">
                      Outlet
                    </TijarahBadge>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Lakukan pembayaran tunai langsung saat mengambil barang di outlet BC HNI 3 Bukittinggi.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
