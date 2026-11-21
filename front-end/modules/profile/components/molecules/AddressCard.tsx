"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { AddressData } from "../../types/profile.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";

interface AddressCardProps {
  address: AddressData;
  onSetPrimary?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function AddressCard({ address, onSetPrimary, onDelete }: AddressCardProps) {
  const t = useTranslations();

  return (
    <TijarahCard
      tijarahVariant="default"
      className={`p-4 sm:p-5 transition-all duration-200 border ${
        address.isPrimary
          ? "border-primary-sage/40 dark:border-primary-sage/50 bg-primary-sage/5"
          : "border-border-subtle"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-base text-text-primary">{address.recipientName}</h4>
          <span className="text-xs text-text-muted font-medium">({address.phoneNumber})</span>
          {address.isPrimary && (
            <TijarahBadge tijarahVariant="success" className="text-[10px] px-2 py-0.5">
              {t("primaryAddressBadge")}
            </TijarahBadge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!address.isPrimary && onSetPrimary && (
            <TijarahButton
              tijarahVariant="outline"
              size="sm"
              onClick={() => onSetPrimary(address.id)}
              className="text-xs py-1 px-2.5 h-8"
            >
              {t("setPrimary")}
            </TijarahButton>
          )}
          {onDelete && (
            <TijarahButton
              tijarahVariant="danger"
              size="sm"
              onClick={() => onDelete(address.id)}
              className="text-xs py-1 px-2.5 h-8"
            >
              {t("delete")}
            </TijarahButton>
          )}
        </div>
      </div>

      <p className="text-xs sm:text-sm text-text-primary/90 leading-relaxed font-normal">
        {address.fullAddress}
      </p>
      <p className="text-xs text-text-muted mt-1 font-medium">
        {t("districtShort")} {address.district}, {address.city}, {address.province} {address.postalCode}
      </p>

      {address.notes && (
        <div className="mt-3 pt-2.5 border-t border-border-subtle/60 flex items-start gap-2 text-xs text-accent-gold font-medium">
          <span className="shrink-0">🚛 {t("courierNotePrefix")}</span>
          <span>{address.notes}</span>
        </div>
      )}
    </TijarahCard>
  );
}
