"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/utils/formatters";
import { TrendingUp, Sparkles, DollarSign, ArrowUpRight } from "lucide-react";

export interface IFinancialDataPoint {
  month: string;
  revenue: number;
  expense: number;
  profit: number;
}

export interface IFinancialChartProps {
  data?: IFinancialDataPoint[];
}

export const FinancialChart: React.FC<IFinancialChartProps> = ({ data = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-sage" />
          <span className="font-bold text-xs text-text-primary uppercase tracking-wider">
            Tren Finansial & Profitabilitas
          </span>
        </div>
        <div className="h-48 w-full flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-xl bg-surface/30 p-6 text-center">
          <TrendingUp className="w-8 h-8 text-text-muted/40 mb-2 stroke-[1.5]" />
          <p className="text-sm font-medium text-text-muted">Belum ada data riwayat finansial</p>
          <p className="text-xs text-text-muted/70 mt-1 max-w-sm">
            Grafik analitik profitabilitas akan otomatis terisi seiring transaksi penjualan yang terekam.
          </p>
        </div>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.revenue, d.expense, d.profit)), 1);

  // Ambil data bulan aktif / terakhir untuk highlight insight
  const currentMonthData = hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];
  const marginPercentage = (
    (currentMonthData.profit / currentMonthData.revenue) *
    100
  ).toFixed(1);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Legend & Judul */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-sage" />
          <span className="font-bold text-xs text-text-primary uppercase tracking-wider">
            Tren Finansial & Profitabilitas 6 Bulan Terakhir
          </span>
        </div>

        {/* Legend Indikator Warna */}
        <div className="flex items-center gap-4 text-xs font-semibold flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-primary-sage inline-block shadow-xs" />
            <span className="text-text-muted">Omzet Penjualan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-status-danger/80 inline-block shadow-xs" />
            <span className="text-text-muted">Pengeluaran & HPP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-status-success inline-block shadow-xs" />
            <span className="text-text-muted">Laba Bersih</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualizer dengan Tooltip & Hover State (Poin 15) */}
      <div className="overflow-x-auto pb-1">
      <div className="h-56 min-w-[420px] w-full flex items-end gap-2 sm:gap-4 pt-10 pb-2 border-b border-border-subtle relative">
        {data.map((item, idx) => {
          const revHeight = Math.round((item.revenue / maxVal) * 100);
          const expHeight = Math.round((item.expense / maxVal) * 100);
          const profHeight = Math.round((item.profit / maxVal) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative"
            >
              {/* Tooltip Dinamis Saat Hover Bar */}
              {isHovered && (
                <div className="absolute -top-12 z-20 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap transition-all flex flex-col items-center">
                  <span>{item.month}: {formatCurrency(item.revenue)}</span>
                  <span className="text-[9px] text-emerald-400 dark:text-emerald-600 font-semibold">
                    Laba Bersih: {formatCurrency(item.profit)}
                  </span>
                  <div className="w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45 -mb-1 mt-0.5" />
                </div>
              )}

              {/* Batang Barchart 3 Bar */}
              <div
                className={`w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full transition-opacity duration-200 ${
                  hoveredIdx !== null && !isHovered ? "opacity-40" : "opacity-100"
                }`}
              >
                {/* Revenue Bar */}
                <div
                  style={{ height: `${revHeight}%` }}
                  className="w-1/3 bg-primary-sage rounded-t-sm transition-all duration-300 relative group-hover:brightness-110 shadow-xs"
                />
                {/* Expense Bar */}
                <div
                  style={{ height: `${expHeight}%` }}
                  className="w-1/3 bg-status-danger/70 rounded-t-sm transition-all duration-300 relative group-hover:brightness-110 shadow-xs"
                />
                {/* Profit Bar */}
                <div
                  style={{ height: `${profHeight}%` }}
                  className="w-1/3 bg-status-success rounded-t-sm transition-all duration-300 relative group-hover:brightness-110 shadow-xs"
                />
              </div>

              {/* Label Bulan di Sumbu X */}
              <span
                className={`text-[10px] font-bold transition-colors ${
                  isHovered ? "text-primary-sage font-extrabold" : "text-text-muted"
                }`}
              >
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
      </div>

      {/* Kartu Insight Cerdas Finansial (Poin 15) */}
      <div className="p-3.5 rounded-xl bg-canvas/80 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-sage/15 text-primary-sage flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-text-primary block">
              Insight Finansial Bulan {currentMonthData.month}:
            </span>
            <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">
              Omzet tercatat <strong>{formatCurrency(currentMonthData.revenue)}</strong> dengan laba bersih{" "}
              <strong className="text-status-success">{formatCurrency(currentMonthData.profit)}</strong> (Margin Profit{" "}
              <strong>{marginPercentage}%</strong>). Pertumbuhan ditopang oleh tingginya repeat order produk herba harian.
            </p>
          </div>
        </div>

        <div className="text-right sm:self-center shrink-0">
          <span className="text-[10px] text-text-muted uppercase font-bold block">Margin Keuntungan:</span>
          <span className="text-sm font-black text-status-success flex items-center gap-1 justify-end">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {marginPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default FinancialChart;
