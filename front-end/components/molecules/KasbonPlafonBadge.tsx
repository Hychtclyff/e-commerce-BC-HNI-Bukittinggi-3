"use client";

import React from "react";
import { CreditCard, ShieldCheck, AlertCircle, Calendar } from "lucide-react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { formatCurrency } from "@/utils/formatters";

interface KasbonPlafonBadgeProps {
  isEligible: boolean;
  availableBalance: number;
  totalOrderAmount: number;
  dueDateDays?: number;
  className?: string;
}

export const KasbonPlafonBadge: React.FC<KasbonPlafonBadgeProps> = ({
  isEligible,
  availableBalance,
  totalOrderAmount,
  dueDateDays = 14,
  className = "",
}) => {
  const isBalanceSufficient = availableBalance >= totalOrderAmount;

  return (
    <div
      className={`p-3.5 rounded-2xl border transition-all ${
        isEligible && isBalanceSufficient
          ? "border-primary-sage/40 bg-primary-sage/10 text-text-primary"
          : isEligible && !isBalanceSufficient
          ? "border-status-warning/40 bg-status-warning/10 text-text-primary"
          : "border-border-subtle bg-canvas opacity-75 text-text-muted"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isEligible && isBalanceSufficient
                ? "bg-primary-sage text-white shadow-xs"
                : "bg-surface border border-border-subtle text-text-muted"
            }`}
          >
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs text-text-primary">
                Fasilitas Kasbon B2B Toko
              </span>
              <TijarahBadge
                tijarahVariant={isEligible && isBalanceSufficient ? "primary" : "secondary"}
                className="text-[9px] px-1.5 py-0"
              >
                Tempo H+{dueDateDays}
              </TijarahBadge>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Plafon Tersedia:{" "}
              <strong className="text-primary-sage font-bold font-mono">
                {formatCurrency(availableBalance)}
              </strong>
            </p>
          </div>
        </div>

        {isEligible && isBalanceSufficient ? (
          <span className="text-[10px] font-bold text-status-success bg-status-success/15 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Memenuhi Syarat
          </span>
        ) : isEligible && !isBalanceSufficient ? (
          <span className="text-[10px] font-bold text-status-warning bg-status-warning/15 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Saldo Kurang
          </span>
        ) : (
          <span className="text-[10px] text-text-muted bg-canvas px-2 py-0.5 rounded-full shrink-0">
            Khusus Agen HNI
          </span>
        )}
      </div>

      {isEligible && !isBalanceSufficient && (
        <div className="mt-2.5 pt-2 border-t border-status-warning/20 text-[10px] text-status-warning font-medium">
          Total belanja ({formatCurrency(totalOrderAmount)}) melebihi sisa plafon kasbon Anda.
        </div>
      )}
    </div>
  );
};

export default KasbonPlafonBadge;
