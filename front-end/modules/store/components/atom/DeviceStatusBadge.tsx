"use client";

import React from "react";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { Wifi, AlertCircle, Clock, CheckCircle2, RefreshCw } from "lucide-react";

export interface DeviceStatusBadgeProps {
  status: "ONLINE" | "OFFLINE" | "TIMEOUT" | "CHECKING";
  latencyMs?: number;
  lastPing?: string;
  className?: string;
}

export const DeviceStatusBadge: React.FC<DeviceStatusBadgeProps> = ({
  status,
  latencyMs,
  className = "",
}) => {
  if (status === "CHECKING") {
    return (
      <TijarahBadge tijarahVariant="secondary" className={`text-[10px] font-bold flex items-center gap-1 ${className}`}>
        <RefreshCw className="w-3 h-3 animate-spin text-text-muted" />
        <span>Memeriksa...</span>
      </TijarahBadge>
    );
  }

  if (status === "ONLINE") {
    return (
      <TijarahBadge tijarahVariant="success" className={`text-[10px] font-bold flex items-center gap-1.5 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-status-success animate-pulse inline-block" />
        <span>Terhubung</span>
        {latencyMs !== undefined && latencyMs > 0 && (
          <span className="font-mono text-[9px] opacity-80">({latencyMs}ms)</span>
        )}
      </TijarahBadge>
    );
  }

  if (status === "TIMEOUT") {
    return (
      <TijarahBadge tijarahVariant="warning" className={`text-[10px] font-bold flex items-center gap-1 ${className}`}>
        <Clock className="w-3 h-3 text-accent-gold" />
        <span>Timeout (RTO)</span>
      </TijarahBadge>
    );
  }

  return (
    <TijarahBadge tijarahVariant="danger" className={`text-[10px] font-bold flex items-center gap-1 ${className}`}>
      <span className="w-2 h-2 rounded-full bg-status-danger inline-block" />
      <span>Terputus / Tidak Ada Koneksi</span>
    </TijarahBadge>
  );
};

export default DeviceStatusBadge;
