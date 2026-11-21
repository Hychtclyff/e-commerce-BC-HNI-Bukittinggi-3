"use client";

import React from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import clsx from "clsx";

interface StoreMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badgeText?: string;
  badgeVariant?: "primary" | "secondary" | "success" | "warning" | "danger";
  isUrgent?: boolean;
  className?: string;
}

export const StoreMetricCard: React.FC<StoreMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badgeText,
  badgeVariant = "secondary",
  isUrgent = false,
  className,
}) => {
  return (
    <TijarahCard
      tijarahVariant="default"
      className={clsx(
        "p-5.5 relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg rounded-2xl mac-glass",
        isUrgent && "border-[var(--status-warning)]/40 bg-[var(--status-warning)]/5",
        className
      )}
    >
        <div className="flex items-start justify-between gap-3 mb-3.5">
        <span className="text-xs font-semibold text-text-muted tracking-tight">{title}</span>
        <div className="p-2.5 rounded-2xl bg-[var(--canvas)]/80 text-primary-sage border border-[var(--border-subtle)] shrink-0 mac-shadow">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">{value}</span>
        {badgeText && (
          <TijarahBadge tijarahVariant={badgeVariant} className="text-[10px] px-2.5 py-0.5 font-bold shadow-xs">
            {badgeText}
          </TijarahBadge>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-text-muted mt-2 font-medium leading-relaxed">
          {subtitle}
        </p>
      )}
    </TijarahCard>
  );
};

export default StoreMetricCard;
