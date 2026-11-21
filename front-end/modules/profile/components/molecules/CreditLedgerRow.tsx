"use client";

import React from "react";
import { CreditLedgerEntry } from "../../types/profile.types";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { useProfileTranslation } from "../../hooks/useProfileTranslation";

interface CreditLedgerRowProps {
  entry: CreditLedgerEntry;
}

export function CreditLedgerRow({ entry }: CreditLedgerRowProps) {
  const { t, isEn } = useProfileTranslation();
  const isDisbursement = entry.type === "DISBURSEMENT";
  const formattedDate = new Date(entry.createdAt).toLocaleDateString(isEn ? "en-US" : "id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <tr className="border-b border-border-subtle/50 hover:bg-canvas/50 transition-colors text-xs sm:text-sm">
      <td className="py-3 px-4 text-text-muted font-medium whitespace-nowrap">
        {formattedDate}
      </td>
      <td className="py-3 px-4">
        <TijarahBadge
          tijarahVariant={isDisbursement ? "warning" : "success"}
          className="text-[10px] px-2 py-0.5 font-bold"
        >
          {isDisbursement ? t("typeDisbursement", "Pencairan Kasbon") : t("typeRepayment", "Pelunasan Tagihan")}
        </TijarahBadge>
      </td>
      <td className="py-3 px-4 font-mono font-medium text-text-primary">
        {entry.referenceNo || "-"}
      </td>
      <td className="py-3 px-4 text-text-muted max-w-[200px] truncate">
        {entry.description}
      </td>
      <td
        className={`py-3 px-4 font-bold whitespace-nowrap text-right ${
          isDisbursement ? "text-status-danger" : "text-status-success"
        }`}
      >
        {isDisbursement ? "+" : "-"} Rp {entry.amount.toLocaleString("id-ID")}
      </td>
      <td className="py-3 px-4 font-semibold text-text-primary text-right whitespace-nowrap">
        Rp {entry.runningBalance.toLocaleString("id-ID")}
      </td>
    </tr>
  );
}
