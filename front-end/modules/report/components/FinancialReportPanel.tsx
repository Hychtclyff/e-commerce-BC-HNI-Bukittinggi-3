"use client";

import React, { useState } from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahTabs } from "@/components/atom/tijarahTabs";
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";

export const FinancialReportPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    // Placeholder: call report API with query params
  };

  return (
    <TijarahCard tijarahVariant="default" className="p-5 rounded-2xl border border-border-subtle mac-glass mac-shadow space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-sage/15 text-primary-sage flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-text-primary">Laporan Keuangan &amp; Arus Kas</h3>
            <p className="text-[11px] text-text-muted">Ringkasan pendapatan, beban operasional, dan mutasi saldo.</p>
          </div>
        </div>
        <TijarahButton type="button" tijarahVariant="secondary" size="sm" onClick={load} className="text-xs">
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor Laporan</span>
        </TijarahButton>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <TijarahTabs
          variant="segmented"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key)}
          items={[
            { id: "overview", label: "Ringkasan", icon: <DollarSign className="w-3.5 h-3.5" /> },
            { id: "income", label: "Pendapatan", icon: <TrendingUp className="w-3.5 h-3.5 text-status-success" /> },
            { id: "expense", label: "Pengeluaran", icon: <TrendingDown className="w-3.5 h-3.5 text-status-danger" /> },
            { id: "cashflow", label: "Arus Kas", icon: <Wallet className="w-3.5 h-3.5 text-accent-gold" /> },
          ]}
        />

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-xs h-8 px-2.5 rounded-xl border border-border-subtle bg-canvas/70 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-sage"
          />
          <span className="text-xs text-text-muted">s/d</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-xs h-8 px-2.5 rounded-xl border border-border-subtle bg-canvas/70 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-sage"
          />
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-xl border border-border-subtle bg-surface/80">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Pendapatan</span>
            <span className="block text-xl font-black text-status-success mt-1">Rp 0</span>
            <span className="text-[10px] text-text-muted mt-1 block">Akumulasi periode berjalan</span>
          </div>
          <div className="p-4 rounded-xl border border-border-subtle bg-surface/80">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Beban &amp; HPP</span>
            <span className="block text-xl font-black text-status-danger mt-1">Rp 0</span>
            <span className="text-[10px] text-text-muted mt-1 block">Operasional &amp; logistik</span>
          </div>
          <div className="p-4 rounded-xl border border-border-subtle bg-surface/80">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Net Profit Bersih</span>
            <span className="block text-xl font-black text-primary-sage mt-1">Rp 0</span>
            <span className="text-[10px] text-text-muted mt-1 block">Margin usaha sehat</span>
          </div>
        </div>
      )}

      {activeTab === "income" && (
        <div className="p-6 rounded-xl border border-dashed border-border-subtle bg-canvas/40 text-center text-xs text-text-muted">
          Belum ada pos transaksi penjualan tercatat untuk rentang tanggal ini.
        </div>
      )}

      {activeTab === "expense" && (
        <div className="p-6 rounded-xl border border-dashed border-border-subtle bg-canvas/40 text-center text-xs text-text-muted">
          Belum ada catatan biaya operasional atau faktur retur keluar.
        </div>
      )}

      {activeTab === "cashflow" && (
        <div className="p-6 rounded-xl border border-dashed border-border-subtle bg-canvas/40 text-center text-xs text-text-muted">
          Mutasi kas tunai dan saldo bank kasir sinkron real-time.
        </div>
      )}
    </TijarahCard>
  );
};