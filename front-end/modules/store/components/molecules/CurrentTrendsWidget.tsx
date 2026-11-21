"use client";

import React from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { formatCurrency } from "@/utils/formatters";
import {
  TrendingUp,
  Sparkles,
  Flame,
  Activity,
  Package,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { StoreTabType } from "../../types/store.types";

export interface ICurrentTrendsWidgetProps {
  onNavigateTab?: (tab: StoreTabType) => void;
  fastMovingHerbs?: Array<{
    sku: string;
    name: string;
    salesQty: number;
    velocity: string;
    growth: string;
    stockLeft: number;
    status: string;
    synergyWith: string;
  }>;
  popularHealthConcerns?: Array<{
    issue: string;
    searchSurge: string;
    recommendedSynergy: string;
    tag: string;
    color: string;
  }>;
}

export const CurrentTrendsWidget: React.FC<ICurrentTrendsWidgetProps> = ({
  onNavigateTab,
  fastMovingHerbs = [],
  popularHealthConcerns = [],
}) => {

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header Ringkasan Tren */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-sage/15 text-primary-sage flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-text-primary tracking-tight flex items-center gap-2">
              <span>Ringkasan Tren Permintaan &amp; Pasar Saat Ini</span>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live AI Insights
              </span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Pantau produk herbal yang mengalami lonjakan penjualan cepat dan pola keluhan kesehatan pasien minggu ini.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateTab && (
            <TijarahButton
              type="button"
              heroVariant="outline"
              size="sm"
              onClick={() => onNavigateTab("restock")}
              className="text-xs h-8 px-3 font-bold text-text-primary flex items-center gap-1"
            >
              <span>Ajukan Pengadaan PO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </TijarahButton>
          )}
        </div>
      </div>

      {/* Grid 2 Kolom: Fast-Moving Herba & Pola Resep Keluhan Sehat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Kolom 1 (7 cols): Produk Fast-Moving Terlaris */}
        <TijarahCard className="lg:col-span-7 p-4 sm:p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-subtle">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                Top Fast-Moving Herba (Perputaran Tercepat)
              </span>
              <span className="text-[11px] text-text-muted">7 Hari Terakhir</span>
            </div>

            <div className="space-y-3">
              {fastMovingHerbs.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-canvas/30 border border-dashed border-border-subtle flex flex-col items-center justify-center">
                  <Flame className="w-6 h-6 text-text-muted/40 mb-1.5" />
                  <p className="text-xs font-semibold text-text-muted">Belum ada data produk fast-moving</p>
                  <p className="text-[11px] text-text-muted/70 mt-0.5">
                    Data laju penjualan herba akan otomatis muncul berdasarkan riwayat transaksi toko.
                  </p>
                </div>
              ) : (
                fastMovingHerbs.map((item, idx) => (
                  <div
                    key={item.sku}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-canvas/40 hover:bg-canvas/80 border border-border-subtle transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-surface border border-border-subtle text-[11px] font-black text-text-primary flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-text-primary block">{item.name}</span>
                          <span className="text-[10px] font-mono text-text-muted">{item.sku}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
                          <span>Laju: <strong className="text-text-primary">{item.velocity}</strong></span>
                          <span>•</span>
                          <span className="text-status-success font-bold flex items-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3" /> {item.growth}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-black text-text-primary">{item.salesQty} Terjual</span>
                      {item.status === "RESTOCK_URGENT" ? (
                        <span className="text-[10px] font-bold text-status-danger bg-status-danger/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Sisa {item.stockLeft}
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted">Stok: {item.stockLeft} botol</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
            <span>Rekomendasi Sinergi Herba otomatis terhubung ke POS</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("inventory")}
                className="font-bold text-primary-sage hover:underline cursor-pointer"
              >
                Lihat Detail Inventori &rarr;
              </button>
            )}
          </div>
        </TijarahCard>

        {/* Kolom 2 (5 cols): Pola Keluhan Kesehatan & Paket Sinergi Terpopuler */}
        <TijarahCard className="lg:col-span-5 p-4 sm:p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-subtle">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-500" />
                Tren Keluhan &amp; Resep Sinergi
              </span>
              <span className="text-[10px] bg-canvas px-2 py-0.5 rounded border border-border-subtle text-text-muted">
                Thibbun Nabawi
              </span>
            </div>

            <div className="space-y-3">
              {popularHealthConcerns.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-canvas/30 border border-dashed border-border-subtle flex flex-col items-center justify-center">
                  <Activity className="w-6 h-6 text-text-muted/40 mb-1.5" />
                  <p className="text-xs font-semibold text-text-muted">Belum ada data pola keluhan</p>
                  <p className="text-[11px] text-text-muted/70 mt-0.5">
                    Analisis resep sinergi herbal akan otomatis dikompilasi dari tren permintaan pelanggan.
                  </p>
                </div>
              ) : (
                popularHealthConcerns.map((c) => (
                  <div
                    key={c.issue}
                    className="p-3 rounded-xl bg-canvas/40 border border-border-subtle space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary-sage" />
                        {c.issue}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${c.color}`}>
                        {c.searchSurge}
                      </span>
                    </div>

                    <div className="text-[11px] text-text-muted leading-relaxed">
                      <span className="font-semibold text-text-primary">Paket Sinergi: </span>
                      <span>{c.recommendedSynergy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-primary-sage/10 rounded-xl border border-primary-sage/20 mt-3 flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-text-primary">
              Katalog khasiat &amp; resep telah tersinkron dengan POS kasir.
            </span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("vouchers")}
                className="text-[11px] font-black text-primary-sage hover:underline shrink-0 ml-2 cursor-pointer"
              >
                Buat Promo Paket &rarr;
              </button>
            )}
          </div>
        </TijarahCard>
      </div>
    </div>
  );
};

export default CurrentTrendsWidget;
