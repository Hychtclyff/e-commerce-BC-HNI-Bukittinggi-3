"use client";

import React, { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { UserProfileData, HniProfileData, B2BCreditProfileData, AddressData } from "../../../types/profile.types";
import { HniAgentCard } from "../../molecules/HniAgentCard";
import { AddressCard } from "../../molecules/AddressCard";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { CreditCard, MapPin, ArrowRight, ShieldAlert, Heart } from "lucide-react";
import { shopApi } from "@/modules/shop/api/shop.api";
import { formatCurrency } from "@/utils/formatters";

interface OverviewPanelProps {
  user: UserProfileData;
  hniProfile?: HniProfileData | null;
  creditAccount?: B2BCreditProfileData | null;
  primaryAddress?: AddressData | null;
  onNavigateTab: (tab: any) => void;
}

export function OverviewPanel({
  user,
  hniProfile,
  creditAccount,
  primaryAddress,
  onNavigateTab,
}: OverviewPanelProps) {
  const t = useTranslations();
  const locale = useLocale();
  const numLocale = locale === "en" ? "en-US" : "id-ID";
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    shopApi.getWishlist().then((items) => {
      if (Array.isArray(items)) setWishlist(items);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. HNI Agent Card Section */}
      {hniProfile ? (
        <HniAgentCard hni={hniProfile} />
      ) : (
        <TijarahCard tijarahVariant="default" className="p-4 sm:p-6 border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-accent-gold shrink-0" />
            <div>
              <h4 className="font-bold text-base text-text-primary">{t("hniNotConnected")}</h4>
              <p className="text-xs text-text-muted mt-1">{t("connectHniSubtitle")}</p>
            </div>
          </div>
          <TijarahButton tijarahVariant="primary" size="sm" onClick={() => onNavigateTab("hni")} className="font-bold flex items-center gap-1.5 w-full sm:w-auto justify-center">
            <span>{t("connectHniBtn")}</span>
            <ArrowRight className="w-4 h-4" />
          </TijarahButton>
        </TijarahCard>
      )}

      {/* 2. Quick Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plafon Kasbon Card (Temporarily disabled per #22)
        <TijarahCard tijarahVariant="default" className="p-4 sm:p-6 border border-border-subtle flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs uppercase tracking-wider font-bold text-primary-sage flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-primary-sage" /> {t("kasbonManagementTitle")}
              </span>
              <span className="text-xs bg-primary-sage/10 text-primary-sage px-2.5 py-0.5 rounded-full font-bold">{t("dueDateH14")}</span>
            </div>
            <div className="text-2xl font-extrabold text-text-primary">
              Rp {(creditAccount?.currentBalance ?? 0).toLocaleString(numLocale)}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {t("totalCreditLimit")}: Rp {(creditAccount?.creditLimit ?? 0).toLocaleString(numLocale)}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-text-muted">
              {creditAccount?.isLocked ? t("statsCreditLocked") : t("statsCreditActive")}
            </span>
            <TijarahButton tijarahVariant="outline" size="sm" onClick={() => onNavigateTab("kasbon")} className="text-xs py-1 flex items-center gap-1">
              <span>{t("ledgerTitle")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </TijarahButton>
          </div>
        </TijarahCard>
        */}

        {/* Primary Address Card */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary-sage" /> {t("primaryAddressHeader")}
            </h4>
            <button type="button" onClick={() => onNavigateTab("addresses")} className="text-xs text-primary-sage font-semibold hover:underline">
              {t("manageAddresses")}
            </button>
          </div>
          {primaryAddress ? (
            <AddressCard address={primaryAddress} />
          ) : (
            <TijarahCard tijarahVariant="default" className="p-5 border border-dashed border-border-subtle text-center">
              <p className="text-xs text-text-muted">{t("noPrimaryAddress")}</p>
              <TijarahButton tijarahVariant="outline" size="sm" onClick={() => onNavigateTab("addresses")} className="mt-3 text-xs">
                + {t("newAddressForm")}
              </TijarahButton>
            </TijarahCard>
          )}
        </div>
      </div>

      {/* Wishlist Saya */}
      <TijarahCard tijarahVariant="default" className="p-5 sm:p-6 border border-border-subtle">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>{locale === "en" ? "My Wishlist" : "Produk Favorit (Wishlist)"}</span>
          </h4>
          <Link href="/products" className="text-xs font-semibold text-primary-sage hover:underline">
            {locale === "en" ? "Browse Catalog" : "Jelajahi Katalog"}
          </Link>
        </div>

        {wishlist.length === 0 ? (
          <p className="text-xs text-text-muted">
            {locale === "en"
              ? "No saved products yet. Click the heart icon on any product to save it here."
              : "Belum ada produk favorit. Klik ikon hati pada halaman produk untuk menyimpannya di sini."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {wishlist.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-canvas hover:border-primary-sage transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-surface overflow-hidden shrink-0 flex items-center justify-center border border-border-subtle">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Heart className="w-4 h-4 text-text-muted/40" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text-primary truncate">{item.name}</p>
                  <p className="text-xs font-mono font-semibold text-primary-sage">
                    {formatCurrency(Number(item.normalPrice ?? item.regularPrice ?? 0))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </TijarahCard>
    </div>
  );
}
