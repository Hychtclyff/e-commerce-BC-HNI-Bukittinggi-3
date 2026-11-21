"use client";

import React from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { Activity } from "lucide-react";

export interface DiseaseTrend {
  name: string;
  trend: "UP" | "DOWN" | "STABLE";
  value: number;
}

interface DiseaseTrendCardProps {
  data: DiseaseTrend[];
}

export const DiseaseTrendCard: React.FC<DiseaseTrendCardProps> = ({ data }) => {
  return (
    <TijarahCard tijarahVariant="default" className="p-4 rounded-2xl border border-border-subtle">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-status-danger" />
        <span className="font-bold text-sm">Penyakit Tren</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {data.map((item) => (
          <span key={item.name} className="px-2 py-1 rounded-lg bg-surface border border-border-subtle text-[11px] font-bold">
            {item.name}
            <span className="ml-1.5 text-text-muted">({item.value})</span>
          </span>
        ))}
      </div>
    </TijarahCard>
  );
};