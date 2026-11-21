"use client";

import React, { useState } from "react";
import { Ticket, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { VoucherItem } from "@/modules/vouchers/types/vouchers.types";
import { VoucherCard } from "./VoucherCard";
import { useVouchers } from "@/modules/vouchers/hooks/useVouchers";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";

export interface VoucherSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  appliedCode?: string;
  onSelectVoucher: (voucher: VoucherItem) => void;
  availableVouchers?: VoucherItem[];
}

export const VoucherSelectorModal: React.FC<VoucherSelectorModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  appliedCode,
  onSelectVoucher,
  availableVouchers: propVouchers,
}) => {
  const t = useTranslations("vouchers");
  const [inputCode, setInputCode] = useState("");
  const { vouchers: hookVouchers, applyVoucher } = useVouchers();

  const vouchers = propVouchers && propVouchers.length > 0 ? propVouchers : hookVouchers;

  const handleApplyManual = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) return;

    const matched = vouchers.find((v) => v.code.toUpperCase() === code);
    if (matched) {
      const success = await applyVoucher(matched, subtotal);
      if (success) {
        onSelectVoucher(matched);
        setInputCode("");
        onClose();
      }
    } else {
      // Coba apply via code string
      const success = await applyVoucher(code, subtotal);
      if (success) {
        const dummyOrFound = {
          id: code,
          code,
          title: `Voucher Promo ${code}`,
          description: "Voucher promo terverifikasi",
          discountType: "FIXED" as const,
          discountValue: 0,
          minPurchase: 0,
          validUntil: new Date().toISOString(),
        };
        onSelectVoucher(dummyOrFound);
        setInputCode("");
        onClose();
      }
    }
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={{ id: t("modalTitle"), en: t("modalTitle") }}
      description={{
        id: "Pilih atau masukkan kode voucher untuk diskon belanja",
        en: "Select or enter a voucher code for shopping discount",
      }}
      maxWidth="lg"
      variant="default"
      icon={<Ticket className="w-5 h-5 text-primary-sage" />}
      showCloseIcon
    >
      <div className="flex flex-col gap-4 pt-2 max-h-[70vh]">
        {/* Manual Voucher Input */}
        <div className="flex gap-2 items-center shrink-0">
          <div className="flex-1">
            <TijarahInput
              id="voucher-selector-code-input"
              placeholder={t("inputPlaceholder")}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyManual();
                }
              }}
              startContent={<Ticket className="w-4 h-4 text-text-muted" />}
            />
          </div>
          <TijarahButton
            type="button"
            tijarahVariant="primary"
            onClick={handleApplyManual}
            isDisabled={!inputCode.trim()}
            className="text-xs font-semibold px-4 py-2 shrink-0"
          >
            {t("applyBtn")}
          </TijarahButton>
        </div>

        {/* Voucher Cards Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[50vh]">
          {vouchers.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted flex flex-col items-center gap-2">
              <Ticket className="w-8 h-8 opacity-30 text-primary-sage" />
              <p>Belum ada voucher aktif saat ini.</p>
            </div>
          ) : (
            vouchers.map((v) => {
              const isSelected = appliedCode?.toUpperCase() === v.code.toUpperCase();
              return (
                <VoucherCard
                  key={v.id || v.code}
                  voucher={v}
                  subtotal={subtotal}
                  isSelected={isSelected}
                  onSelect={(selected) => {
                    onSelectVoucher(selected);
                    onClose();
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </TijarahModal>
  );
};

export default VoucherSelectorModal;
