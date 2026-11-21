"use client";

import React from "react";
import { HniProfileData } from "../../types/profile.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { useProfileTranslation } from "../../hooks/useProfileTranslation";

interface HniAgentCardProps {
  hni: HniProfileData;
}

export function HniAgentCard({ hni }: HniAgentCardProps) {
  const { t } = useProfileTranslation();

  return (
    <TijarahCard
      tijarahVariant="default"
      className="p-6 relative overflow-hidden bg-gradient-to-br from-surface via-surface to-primary-sage/10 border border-accent-gold/30 shadow-lg"
    >
      {/* Decorative Gold Badge Watermark */}
      <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-accent-gold/10 blur-xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent-gold/15 border border-accent-gold/30 flex items-center justify-center text-2xl shadow-inner">
            🌱
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-accent-gold">
              {t("hniCardTitle", "Kartu ID Agen HNI Bukittinggi")}
            </span>
            <h3 className="text-xl font-extrabold text-text-primary tracking-tight">
              {hni.hniMemberName}
            </h3>
          </div>
        </div>

        <TijarahBadge
          tijarahVariant={hni.isVerified ? "success" : "warning"}
          className="text-xs px-3 py-1 font-semibold"
        >
          {hni.isVerified ? t("hniVerified", "✓ Terverifikasi HSIS") : t("hniUnverified", "⚠️ Menunggu Verifikasi")}
        </TijarahBadge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <div>
          <span className="text-xs text-text-muted font-medium block">{t("hniMemberId", "ID Member HNI")}</span>
          <span className="text-base font-bold font-mono text-primary-sage tracking-wider">
            {hni.hniMemberId}
          </span>
        </div>

        <div>
          <span className="text-xs text-text-muted font-medium block">{t("titleStatus", "Pangkat / Tier")}</span>
          <span className="text-sm font-bold text-text-primary">
            {hni.titleStatus || "Mitra Agen"}
          </span>
        </div>

        <div>
          <span className="text-xs text-text-muted font-medium block">{t("totalPoints", "Total Poin TP")}</span>
          <span className="text-base font-extrabold text-accent-gold">
            {hni.totalPointsTP?.toLocaleString("id-ID") || 0} TP
          </span>
        </div>

        <div>
          <span className="text-xs text-text-muted font-medium block">{t("agencyName", "Pusat Distribusi")}</span>
          <span className="text-sm font-bold text-text-primary">
            {hni.agencyName || "BC HNI 3 Bukittinggi"}
          </span>
        </div>
      </div>

      {hni.uplineName && (
        <div className="mt-4 pt-3 border-t border-border-subtle/50 text-xs text-text-muted flex items-center gap-2">
          <span>{t("upline", "Upline Pembina")}:</span>
          <span className="font-semibold text-text-primary">{hni.uplineName}</span>
          {hni.uplineId && <span className="font-mono text-text-muted">({hni.uplineId})</span>}
        </div>
      )}
    </TijarahCard>
  );
}
