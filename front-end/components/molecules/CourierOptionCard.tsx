"use client";

import React from "react";
import { Truck, Clock, ShieldCheck } from "lucide-react";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { formatCurrency } from "@/utils/formatters";

export interface CourierOption {
  id: string;
  name: string;
  cost: number;
  etd: string;
  desc: string;
  badge?: string;
}

interface CourierOptionCardProps {
  courier: CourierOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const CourierOptionCard: React.FC<CourierOptionCardProps> = ({
  courier,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(courier.id)}
      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
        isSelected
          ? "border-primary-sage bg-primary-sage/10 ring-2 ring-primary-sage/30 shadow-xs"
          : "border-border-subtle bg-surface hover:border-primary-sage/40 hover:bg-canvas/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isSelected
              ? "bg-primary-sage text-white shadow-xs"
              : "bg-canvas text-primary-sage border border-border-subtle"
          }`}
        >
          <Truck className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs text-text-primary">
              {courier.name}
            </span>
            {courier.badge && (
              <TijarahBadge
                tijarahVariant={isSelected ? "primary" : "secondary"}
                className="text-[9px] px-1.5 py-0"
              >
                {courier.badge}
              </TijarahBadge>
            )}
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">{courier.desc}</p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className="font-mono text-xs font-bold text-text-primary block">
          {courier.cost === 0 ? "Gratis" : formatCurrency(courier.cost)}
        </span>
        <span className="text-[10px] text-text-muted flex items-center justify-end gap-1 mt-0.5">
          <Clock className="w-3 h-3" /> {courier.etd}
        </span>
      </div>
    </div>
  );
};

export default CourierOptionCard;
