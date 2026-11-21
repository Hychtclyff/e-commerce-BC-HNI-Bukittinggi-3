"use client";

import React from "react";
import { Ticket, Check, Sparkles, Clock, AlertCircle } from "lucide-react";
import { VoucherItem } from "@/modules/vouchers/types/vouchers.types";
import { useTranslations } from "next-intl";
import { TijarahButton } from "@/components/atom/tijarahButton";

interface VoucherCardProps {
  voucher: VoucherItem;
  subtotal?: number;
  isSelected?: boolean;
  onSelect?: (voucher: VoucherItem) => void;
  showApplyButton?: boolean;
}

export const VoucherCard: React.FC<VoucherCardProps> = ({
  voucher,
  subtotal = 0,
  isSelected = false,
  onSelect,
  showApplyButton = true,
}) => {
  const t = useTranslations("vouchers");
  const isEligible = subtotal >= voucher.minPurchase;

  const handleSelect = () => {
    if (isEligible && onSelect) {
      onSelect(voucher);
    }
  };

  const getDiscountBadge = () => {
    if (voucher.discountType === "PERCENTAGE") {
      return `${voucher.discountValue}% OFF`;
    }
    if (voucher.discountType === "SHIPPING_SUBSIDY") {
      return `Subsidi Rp ${voucher.discountValue.toLocaleString("id-ID")}`;
    }
    return `Potongan Rp ${voucher.discountValue.toLocaleString("id-ID")}`;
  };

  return (
    <div
      onClick={handleSelect}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        isSelected
          ? "border-primary-sage bg-primary-sage/10 ring-2 ring-primary-sage/30 shadow-md"
          : isEligible
          ? "border-border-subtle hover:border-primary-sage/60 bg-surface hover:shadow-md cursor-pointer"
          : "border-border-subtle/40 bg-canvas/60 opacity-65 cursor-not-allowed"
      }`}
    >
      {/* Decorative Ticket Cutouts */}
      <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-canvas border border-border-subtle/80" />
      <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-canvas border border-border-subtle/80" />

      <div className="p-4 pl-6 pr-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Header info */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-sage/15 text-primary-sage font-bold text-[10px] tracking-wide">
                <Sparkles className="w-3 h-3" />
                {getDiscountBadge()}
              </span>

              {isSelected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-primary-sage px-2 py-0.5 rounded-full shadow-xs">
                  <Check className="w-3 h-3" /> {t("active")}
                </span>
              )}
            </div>

            <h4 className="font-bold text-xs sm:text-sm text-text-primary mb-1 leading-snug">
              {voucher.title}
            </h4>

            <p className="text-[11px] text-text-muted line-clamp-2 mb-3 leading-relaxed">
              {voucher.description}
            </p>

            {/* Code tag & rules */}
            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-dashed border-border-subtle">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md border border-dashed border-primary-sage/40 bg-primary-sage/10 text-primary-sage select-all">
                {voucher.code}
              </span>

              {showApplyButton && isEligible && (
                <TijarahButton
                  type="button"
                  tijarahVariant={isSelected ? "outline" : "primary"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect();
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold h-7"
                >
                  {isSelected ? t("active") : t("applyBtn")}
                </TijarahButton>
              )}
            </div>
          </div>
        </div>

        {/* Warning if subtotal not met */}
        {!isEligible && (
          <div className="mt-2.5 pt-2 border-t border-border-subtle/50 flex items-center gap-1.5 text-[10px] text-status-danger font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              {t("minPurchaseWarning", {
                min: voucher.minPurchase.toLocaleString("id-ID"),
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoucherCard;
