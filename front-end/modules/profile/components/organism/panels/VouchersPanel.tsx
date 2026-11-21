"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { UserVoucher } from "../../../types/profile.types";
import { useVouchers } from "../../../hooks/useVouchers";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { ClaimVoucherForm } from "../form/claimVoucherForm";
import { Ticket, RefreshCw } from "lucide-react";

interface VouchersPanelProps {
  vouchers?: UserVoucher[];
}

export function VouchersPanel({ vouchers: propVouchers }: VouchersPanelProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "id-ID";
  const { vouchers: hookVouchers, isLoading, isError, error, refreshVouchers } = useVouchers();
  const vouchers = propVouchers || hookVouchers;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-text-primary">{t("claimVoucherTitle")}</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {t("claimVoucherSubtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => refreshVouchers()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-sage hover:underline cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>{t("reloadBtn")}</span>
        </button>
      </div>

      {isError && (
        <div className="p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 text-xs text-status-danger">
          {error}
        </div>
      )}

      {/* Claim Voucher Code Input Form */}
      <TijarahCard tijarahVariant="default" className="p-4 sm:p-5 border border-border-subtle">
        <ClaimVoucherForm />
      </TijarahCard>

      {/* Daftar Voucher Aktif */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading && vouchers.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-text-muted">
            ...
          </div>
        ) : (
          vouchers.map((v) => (
            <TijarahCard
              key={v.id}
              tijarahVariant="default"
              className="p-4 sm:p-5 border border-border-subtle hover:border-primary-sage/40 transition-colors flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-sage/10 text-primary-sage flex items-center justify-center shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-text-primary leading-tight">{v.title}</h4>
                    <span className="font-mono text-xs font-bold text-primary-sage bg-primary-sage/10 px-2 py-0.5 rounded mt-1 inline-block">
                      {v.code}
                    </span>
                  </div>
                </div>

                <TijarahBadge
                  tijarahVariant={v.isUsed ? "secondary" : "success"}
                  className="text-[10px] px-2 py-0.5 shrink-0"
                >
                  {v.isUsed ? t("voucherUsedBadge") : t("voucherActiveBadge")}
                </TijarahBadge>
              </div>

              <p className="text-xs text-text-muted leading-relaxed">{v.description}</p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-muted pt-3 border-t border-border-subtle/50">
                <span>{t("minPurchaseLabel")} Rp {v.minPurchase.toLocaleString(dateLocale)}</span>
                <span>
                  {t("validLabel")}{" "}
                  {new Date(v.validUntil).toLocaleDateString(dateLocale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </TijarahCard>
          ))
        )}
      </div>
    </div>
  );
}

export default VouchersPanel;
