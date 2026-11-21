"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Ticket, Tag, Check, Sparkles, AlertCircle } from "lucide-react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { VoucherItem } from "@/types/checkout.types";

export interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  vouchers: VoucherItem[];
  selectedVoucherCode?: string;
  onSelectVoucher: (voucher: VoucherItem) => void;
  subtotal?: number;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  onClose,
  vouchers,
  selectedVoucherCode,
  onSelectVoucher,
  subtotal = 0,
}) => {
  const t = useTranslations("voucherModal");
  const [manualCode, setManualCode] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const handleApplyManual = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const code = manualCode.trim().toUpperCase();
    if (!code) return;

    const matched = vouchers.find(
      (v) => v.code.toUpperCase() === code && !v.isUsed
    );

    if (!matched) {
      setInputError("Kode voucher tidak valid atau sudah kadaluarsa.");
      return;
    }

    if (subtotal > 0 && subtotal < matched.minPurchase) {
      setInputError(
        `Minimal belanja untuk voucher ini adalah ${formatCurrency(matched.minPurchase)}`
      );
      return;
    }

    onSelectVoucher(matched);
    setManualCode("");
    onClose();
  };

  const getDiscountLabel = (v: VoucherItem) => {
    if (v.discountType === "FIXED") {
      return `Potongan ${formatCurrency(v.discountValue)}`;
    }
    if (v.discountType === "PERCENTAGE") {
      return `Diskon ${v.discountValue}%${v.maxDiscount ? ` (Maks. ${formatCurrency(v.maxDiscount)})` : ""}`;
    }
    if (v.discountType === "SHIPPING_SUBSIDY") {
      return `Subsidi Ongkir ${formatCurrency(v.discountValue)}`;
    }
    return `Diskon ${v.discountValue}`;
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={{ id: t("title"), en: t("title") }}
      description={{ id: t("subtitle"), en: t("subtitle") }}
      maxWidth="md"
      variant="default"
      icon={<Ticket className="w-6 h-6 text-primary-sage" />}
      showCloseIcon
    >
      <div className="flex flex-col gap-5 pt-2">
        {/* Manual Voucher Input Form */}
        <form onSubmit={handleApplyManual} className="flex items-center gap-2">
          <div className="flex-1">
            <TijarahInput
              id="manual-voucher-input"
              placeholder={t("inputPlaceholder")}
              value={manualCode}
              onChange={(e) => {
                setManualCode(e.target.value.toUpperCase());
                setInputError(null);
              }}
              startContent={<Tag className="w-4 h-4 text-text-muted" />}
            />
          </div>
          <TijarahButton
            type="submit"
            tijarahVariant="primary"
            size="sm"
            className="font-bold py-2.5 px-5"
          >
            {t("applyBtn")}
          </TijarahButton>
        </form>

        {inputError && (
          <div className="text-xs text-status-danger flex items-center gap-1.5 font-medium -mt-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{inputError}</span>
          </div>
        )}

        {/* Voucher List */}
        <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
          {vouchers.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6">
              {t("noVouchers")}
            </p>
          ) : (
            vouchers.map((voucher) => {
              const isSelected = selectedVoucherCode === voucher.code;
              const isEligible = subtotal === 0 || subtotal >= voucher.minPurchase;

              return (
                <div
                  key={voucher.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? "border-primary-sage bg-primary-sage/10 shadow-sm"
                      : "border-border-subtle bg-canvas hover:border-primary-sage/40"
                  } ${!isEligible ? "opacity-60" : ""}`}
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-primary-sage bg-surface border border-border-subtle px-2.5 py-0.5 rounded-lg inline-block">
                        {voucher.code}
                      </span>
                      <TijarahBadge tijarahVariant="warning" className="text-[10px]">
                        {getDiscountLabel(voucher)}
                      </TijarahBadge>
                    </div>

                    <h4 className="text-xs font-bold text-text-primary mt-1">
                      {voucher.title}
                    </h4>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      {voucher.description}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-text-muted mt-1">
                      <span>{t("minPurchase")}: {formatCurrency(voucher.minPurchase)}</span>
                      <span>•</span>
                      <span>{t("validUntil")}: {formatDate(voucher.validUntil, "id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>

                  <div className="sm:self-center">
                    <TijarahButton
                      type="button"
                      size="sm"
                      tijarahVariant={isSelected ? "primary" : "outline"}
                      isDisabled={!isEligible || voucher.isUsed}
                      onClick={() => {
                        onSelectVoucher(voucher);
                        onClose();
                      }}
                      className="w-full sm:w-auto text-xs font-bold whitespace-nowrap"
                    >
                      {isSelected ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{t("selected")}</span>
                        </span>
                      ) : (
                        <span>{t("selectBtn")}</span>
                      )}
                    </TijarahButton>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </TijarahModal>
  );
};
export default VoucherModal;
