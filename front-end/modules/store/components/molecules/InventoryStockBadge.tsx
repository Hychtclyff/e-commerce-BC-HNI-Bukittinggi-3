"use client";

import React from "react";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";

interface InventoryStockBadgeProps {
  stock: number;
  className?: string;
}

export const InventoryStockBadge: React.FC<InventoryStockBadgeProps> = ({ stock, className }) => {
  if (stock <= 0) {
    return (
      <TijarahBadge
        tijarahVariant="danger"
        className={`px-2 py-0.5 text-[11px] font-medium flex items-center gap-1 tabular-nums ${className || ""}`}
      >
        <AlertOctagon className="w-3 h-3 shrink-0" />
        <span>Habis (0)</span>
      </TijarahBadge>
    );
  }

  if (stock < 10) {
    return (
      <TijarahBadge
        tijarahVariant="warning"
        className={`px-2 py-0.5 text-[11px] font-medium flex items-center gap-1 tabular-nums ${className || ""}`}
      >
        <AlertTriangle className="w-3 h-3 shrink-0" />
        <span>Menipis ({stock})</span>
      </TijarahBadge>
    );
  }

  return (
    <TijarahBadge
      tijarahVariant="success"
      className={`px-2 py-0.5 text-[11px] font-medium flex items-center gap-1 tabular-nums ${className || ""}`}
    >
      <CheckCircle2 className="w-3 h-3 shrink-0" />
      <span>Aman ({stock})</span>
    </TijarahBadge>
  );
};

export default InventoryStockBadge;
