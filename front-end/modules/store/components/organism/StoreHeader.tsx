"use client";

import React from "react";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeSwitch } from "@/components/theme-switch";
import { StoreMetrics } from "../../types/store.types";
import { Store, RefreshCw, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface StoreHeaderProps {
  metrics: StoreMetrics;
  isRefreshing: boolean;
  onRefreshAll: () => void;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  metrics,
  isRefreshing,
  onRefreshAll,
}) => {
  const t = useTranslations("storeErp.header");
  const locale = useLocale();
  const isEn = locale === "en";

  return (
    <header className="w-full bg-surface border-b border-border-subtle sticky top-0 z-30 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
      {/* Branding & Status Operasional */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[var(--badge-primary-bg)] border border-[var(--badge-primary-border)] text-primary-sage flex items-center justify-center shrink-0">
          <Store className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xs sm:text-sm font-bold text-text-primary tracking-tight truncate">
              TIJARAH STORE ERP
            </h1>
            <TijarahBadge
              tijarahVariant="success"
              className="text-[10px] px-1.5 py-0.5 font-semibold shrink-0"
            >
              {t("activeBadge")}
            </TijarahBadge>
          </div>
          <p className="text-[11px] text-text-muted truncate hidden sm:block">
            {isEn
              ? "Business Center Stockist 3 • Warehouse & Back-Office"
              : "Business Center Stokis BC 3 • Sistem Gudang & Back-Office"}
          </p>
        </div>
      </div>

      {/* Ringkasan Cepat & Kontrol Operasional */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="hidden xl:flex items-center gap-1.5 mr-1 text-[11px]">
          <span className="px-2 py-1 rounded-md bg-canvas text-text-muted border border-border-subtle font-medium tabular-nums">
            SKU: <strong className="text-text-primary">{metrics.totalSku}</strong>
          </span>
          {metrics.lowStockCount > 0 && (
            <span className="px-2 py-1 rounded-md bg-[var(--badge-warning-bg)] text-status-warning border border-status-warning/30 font-medium tabular-nums">
              {t("lowStockAlert")} <strong>{metrics.lowStockCount}</strong>
            </span>
          )}
        </div>

        {/* Tombol Sinkronisasi Data Real-time */}
        <TijarahButton
          type="button"
          tijarahVariant="secondary"
          size="sm"
          isLoading={isRefreshing}
          onClick={onRefreshAll}
          className="text-xs px-2.5 h-8 font-medium flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{isEn ? "Sync Data" : "Sinkron Data"}</span>
        </TijarahButton>

        <LanguageSwitch />
        <ThemeSwitch />

        {/* Navigasi Kembali ke Toko Belanja Konsumen */}
        <Link href={`/${locale}/shop`}>
          <TijarahButton
            type="button"
            tijarahVariant="secondary"
            size="sm"
            className="text-xs px-2.5 h-8 font-medium flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-primary-sage" />
            <span className="hidden md:inline">{isEn ? "Storefront" : "Ke Etalase"}</span>
          </TijarahButton>
        </Link>
      </div>
    </header>
  );
};

export default StoreHeader;
