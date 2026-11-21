"use client";

import React, { useState } from "react";
import type {
  StoreRestockRecommendation,
  StoreStockVelocity,
  StoreDiseaseTrend,
} from "../../../types/store.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahTabs } from "@/components/atom/tijarahTabs";
import { showToast } from "@/utils/toast";
import {
  Boxes,
  TrendingUp,
  AlertTriangle,
  Flame,
  Sparkles,
  Share2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Activity,
  Layers,
  ShoppingBag,
} from "lucide-react";

export interface IRestockPanelProps {
  velocity: StoreStockVelocity[];
  recommendations: StoreRestockRecommendation[];
  diseaseTrends?: StoreDiseaseTrend[];
  isLoading: boolean;
}

export const RestockPanel: React.FC<IRestockPanelProps> = ({
  velocity,
  recommendations,
  diseaseTrends = [],
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<"ai-trends" | "recommendations" | "velocity">(
    "ai-trends"
  );
  const [submittingPoId, setSubmittingPoId] = useState<string | null>(null);

  const handleApplyAiRestock = (trend: StoreDiseaseTrend) => {
    setSubmittingPoId(trend.id);
    setTimeout(() => {
      setSubmittingPoId(null);
      showToast.success(
        "PO Restock Diajukan ke Pusat",
        `Pengadaan darurat untuk herba penanganan "${trend.diseaseName}" (${trend.recommendedSkus.join(", ")}) berhasil diteruskan ke Logistik HNI.`
      );
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-text-primary tracking-tight">
              Velocity & Rekomendasi Restock AI
            </h2>
            <TijarahBadge tijarahVariant="primary" className="text-[10px] font-bold">
              AI Health Trend Radar
            </TijarahBadge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Prediksi kebutuhan stok herba berbasis lonjakan tren penyakit di medsos, cuaca, dan laju penjualan harian.
          </p>
        </div>

        {/* Tab Switcher */}
        <TijarahTabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as any)}
          variant="segmented"
          items={[
            {
              id: "ai-trends",
              label: "Tren Medsos & Iklim",
              icon: <Sparkles className="w-3.5 h-3.5 text-accent-gold" />,
            },
            {
              id: "recommendations",
              label: `Kebutuhan PO (${recommendations.length})`,
              icon: <Boxes className="w-3.5 h-3.5" />,
            },
            {
              id: "velocity",
              label: "Velocity SKU",
              icon: <TrendingUp className="w-3.5 h-3.5" />,
            },
          ]}
        />
      </div>

      {/* ─── TAB 1: HASIL ANALISIS TREN PENYAKIT DI MEDSOS (POIN 7) ─── */}
      {activeTab === "ai-trends" && (
        <div className="space-y-4">
          {diseaseTrends.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-canvas/30 border border-dashed border-border-subtle flex flex-col items-center justify-center">
              <Activity className="w-8 h-8 text-text-muted/40 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-text-muted">Belum ada data tren penyakit &amp; sentimen medsos</p>
              <p className="text-xs text-text-muted/70 mt-1 max-w-md">
                Peringatan tren otomatis diperbarui ketika algoritma AI mendeteksi lonjakan isu kesehatan lokal atau data analitik terintegrasi.
              </p>
            </div>
          ) : (
            <>
              {/* Banner Insight AI Musiman */}
              <TijarahCard
                tijarahVariant="default"
                className="p-5 border border-accent-gold/40 bg-accent-gold/5 mac-glass mac-shadow rounded-2xl relative overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent-gold/20 text-accent-gold flex items-center justify-center shrink-0 shadow-sm">
                    <Flame className="w-6 h-6 animate-pulse" />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-base text-text-primary">
                        Peringatan Tren Medsos: Dampak Kabut Asap Karhutla Regional
                      </h3>
                      <TijarahBadge tijarahVariant="danger" className="text-[10px] font-black uppercase">
                        Lonjakan Tinggi (+145%)
                      </TijarahBadge>
                    </div>

                    <p className="text-xs text-text-muted leading-relaxed max-w-4xl">
                      Algoritma monitoring sentimen mendeteksi peningkatan drastis pembicaraan terkait keluhan{" "}
                      <strong>ISPA, batuk kering berkepanjangan, dan iritasi tenggorokan</strong> di wilayah Sumatera Barat
                      dan Riau akibat titik api karhutla. Sistem merekomendasikan stokis menyiapkan paket sinergi khusus
                      agar permintaan mendesak masyarakat terpenuhi.
                    </p>
                  </div>
                </div>
              </TijarahCard>

              {/* Kartu Daftar Kasus Tren Penyakit */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {diseaseTrends.map((trend) => (
                  <TijarahCard
                    key={trend.id}
                    tijarahVariant="default"
                    className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-primary-sage" />
                          {trend.seasonContext}
                        </span>

                        <TijarahBadge
                          tijarahVariant={
                            trend.urgency === "EMERGENCY"
                              ? "danger"
                              : trend.urgency === "HIGH"
                              ? "warning"
                              : "primary"
                          }
                          className="text-[10px] font-bold"
                        >
                          {trend.urgency === "EMERGENCY" ? "Darurat Restock" : "Permintaan Naik"}
                        </TijarahBadge>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-text-primary leading-snug">
                          {trend.diseaseName}
                        </h4>
                        <p className="text-[11px] text-text-muted mt-0.5">Topik: {trend.topic}</p>
                      </div>

                      {/* Metrik Pertumbuhan Medsos */}
                      <div className="p-3 bg-canvas/60 rounded-xl border border-border-subtle text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-text-muted">Kenaikan Isu Medsos:</span>
                          <span className="font-extrabold text-status-danger">
                            +{trend.socialMentionGrowth}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-text-muted">
                          <span>Sumber Pantauan:</span>
                          <span className="font-medium text-text-primary">{trend.sources.join(", ")}</span>
                        </div>
                      </div>

                      {/* Rekomendasi Sinergi Herba HNI */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-sage block">
                          Rekomendasi Paket Sinergi HNI:
                        </span>
                        <p className="text-xs text-text-muted leading-relaxed italic bg-surface/50 p-2.5 rounded-lg border border-border-subtle/60">
                          &quot;{trend.aiInsight}&quot;
                        </p>
                      </div>
                    </div>

                    {/* Tombol Aksi 1-Klik Buat PO Restock */}
                    <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-text-muted font-bold">
                        {trend.recommendedSkus.length} SKU Relevan
                      </span>

                      <TijarahButton
                        type="button"
                        tijarahVariant="primary"
                        size="sm"
                        isLoading={submittingPoId === trend.id}
                        onClick={() => handleApplyAiRestock(trend)}
                        className="text-xs px-3 h-8 font-bold flex items-center gap-1 shadow-xs"
                      >
                        <span>Ajukan PO Restock AI</span>
                        <ArrowRight className="w-3 h-3" />
                      </TijarahButton>
                    </div>
                  </TijarahCard>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 2: REKOMENDASI PO STOK (TABEL BEST-PRACTICE) ─── */}
      {activeTab === "recommendations" && (
        <TijarahCard
          tijarahVariant="default"
          className="border border-border-subtle overflow-hidden mac-glass mac-shadow rounded-2xl"
        >
          <div className="p-4 bg-canvas/60 border-b border-border-subtle flex items-center justify-between">
            <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-primary-sage" />
              Daftar Usulan PO Restock ke Pusat HNI
            </span>
            <span className="text-[11px] text-text-muted">Dihitung otomatis per lead-time logistik 3 hari</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-canvas/40 text-text-muted uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">SKU / Nama Produk</th>
                  <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                  <th className="py-3 px-4 text-center">Batas Safety</th>
                  <th className="py-3 px-4 text-center">Usulan PO (Qty)</th>
                  <th className="py-3 px-4">Catatan Kebutuhan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {recommendations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-text-muted">
                      Tidak ada usulan PO restock saat ini. Seluruh stok produk berada dalam batas aman.
                    </td>
                  </tr>
                ) : (
                  recommendations.map((rec) => (
                    <tr key={rec.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-text-primary block">{rec.name}</span>
                        <span className="font-mono text-[10px] text-text-muted font-normal mt-0.5">
                          {rec.sku}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-black text-xs ${
                            rec.currentStock === 0
                              ? "text-status-danger"
                              : rec.currentStock <= rec.safetyStock
                              ? "text-status-warning"
                              : "text-text-primary"
                          }`}
                        >
                          {rec.currentStock} Unit
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-text-muted">{rec.safetyStock} Unit</td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-primary-sage text-sm bg-primary-sage/15 px-2.5 py-0.5 rounded-full border border-primary-sage/20">
                          +{rec.suggestedQty} Unit
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-text-muted text-[11px] max-w-xs">{rec.note}</td>

                      <td className="py-3.5 px-4 text-right">
                        <TijarahButton
                          type="button"
                          tijarahVariant="primary"
                          size="sm"
                          onClick={() =>
                            showToast.success(
                              "PO Disiapkan",
                              `Pengajuan PO ${rec.suggestedQty} pcs ${rec.name} siap dicetak.`
                            )
                          }
                          className="text-xs px-2.5 h-7 font-bold"
                        >
                          Order PO
                        </TijarahButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TijarahCard>
      )}

      {/* ─── TAB 3: VELOCITY PERPUTARAN BARANG (TABEL BEST-PRACTICE) ─── */}
      {activeTab === "velocity" && (
        <TijarahCard
          tijarahVariant="default"
          className="border border-border-subtle overflow-hidden mac-glass mac-shadow rounded-2xl"
        >
          <div className="p-4 bg-canvas/60 border-b border-border-subtle flex items-center justify-between">
            <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary-sage" />
              Tingkat Perputaran Produk (Velocity Ranking)
            </span>
            <span className="text-[11px] text-text-muted">Analisis 30 hari transaksi kasir & online</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-canvas/40 text-text-muted uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Nama Produk & SKU</th>
                  <th className="py-3 px-4 text-center">Rata-rata Terjual</th>
                  <th className="py-3 px-4 text-center">Terakhir Laku</th>
                  <th className="py-3 px-4 text-center">Kategori Velocity</th>
                  <th className="py-3 px-4 text-right">Rekomendasi Buffer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {velocity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-text-muted">
                      Belum ada data analisis laju perputaran stok (velocity).
                    </td>
                  </tr>
                ) : (
                  velocity.map((v) => (
                    <tr key={v.sku} className="hover:bg-canvas/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-text-primary block">{v.name}</span>
                        <span className="font-mono text-[10px] text-text-muted font-normal mt-0.5">
                          {v.sku}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-text-primary">
                        {v.avgDailySales} unit/hari
                      </td>

                      <td className="py-3.5 px-4 text-center text-text-muted">
                        {v.daysSinceLastSale === 0 ? "Hari ini" : `${v.daysSinceLastSale} hari lalu`}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <TijarahBadge
                          tijarahVariant={
                            v.velocity === "FAST_MOVING"
                              ? "success"
                              : v.velocity === "SLOW_MOVING"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {v.velocity === "FAST_MOVING"
                            ? "Fast Moving"
                            : v.velocity === "SLOW_MOVING"
                            ? "Slow Moving"
                            : "Dead Stock"}
                        </TijarahBadge>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-primary-sage">
                        +{v.recommendedQty} Unit
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TijarahCard>
      )}
    </div>
  );
};

export default RestockPanel;
