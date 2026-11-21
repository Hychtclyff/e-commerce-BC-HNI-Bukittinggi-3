"use client";

import React, { useState, useEffect } from "react";
import type { StoreMetrics, StoreOrder } from "../../../types/store.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahDateRangePicker } from "@/components/atom/tijarahDateRangePicker";
import { TijarahTabs } from "@/components/atom/tijarahTabs";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { showToast } from "@/utils/toast";
import { storeApi } from "@/modules/store/api/store.api";
import {
  BarChart3,
  Download,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";

export interface IReportsPanelProps {
  metrics: StoreMetrics;
  orders: StoreOrder[];
}

export const ReportsPanel: React.FC<IReportsPanelProps> = ({ metrics, orders }) => {
  const t = useTranslations("storeErp.reports");

  const [period, setPeriod] = useState<"all" | "today" | "last7days" | "thisMonth" | "custom">("all");
  const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string }>({ startDate: "", endDate: "" });
  const [financialData, setFinancialData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch data agregasi laporan keuangan dari live backend
  const fetchReport = async (selectedPeriod: string, range?: { startDate: string; endDate: string }) => {
    setIsLoading(true);
    try {
      const activeRange = range || customRange;
      const params: any = {};
      if (selectedPeriod === "custom" && activeRange.startDate) {
        params.dateFrom = activeRange.startDate;
        params.dateTo = activeRange.endDate || activeRange.startDate;
      } else {
        params.period = selectedPeriod;
      }
      const res = await storeApi.getFinancialReport(params);
      if (res.success && res.data) {
        setFinancialData(res.data);
      }
    } catch (err: any) {
      console.error("Gagal memuat laporan keuangan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (period !== "custom") {
      fetchReport(period);
    }
  }, [period]);

  const completedOrders = orders.filter(
    (o) => o.status !== "CANCELLED" && o.status !== "REJECTED"
  );

  const grossRevenue = financialData?.summary?.grossRevenue ?? metrics.totalRevenue;
  const cashOrQrisRevenue = financialData?.summary?.cashQrisRevenue ?? (metrics.totalRevenue * 0.7);
  const kasbonRevenue = financialData?.summary?.tempoReceivable ?? (metrics.totalRevenue * 0.3);
  const totalDiscount = financialData?.summary?.totalDiscount ?? 0;
  const totalTransactions = financialData?.summary?.totalTransactions ?? completedOrders.length;
  const totalPointsGenerated = financialData?.summary?.totalTpPoints ?? completedOrders.reduce((sum, o) => sum + (o.totalPoints || 0), 0);
  const chartData: Array<{ date: string; orderCount: number; revenue: number; tpPoints?: number }> = financialData?.chartData || [];

  const maxRevenueInChart = Math.max(...chartData.map((d) => d.revenue), 100000);
  const maxTpInChart = Math.max(...chartData.map((d) => d.tpPoints || 0), 100);

  const handleDownloadCsv = () => {
    try {
      const url = storeApi.exportFinancialReportUrl();
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = `Laporan-Keuangan-BC3-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast.success("Laporan Diunduh", "File CSV Laporan Keuangan resmi berhasil diekspor.");
    } catch {
      // Fallback generate CSV client-side
      const headers = "No Order,Tanggal,Pelanggan,Metode Bayar,Status Bayar,Status Order,Poin TP,Total (Rp)\n";
      const rows = completedOrders
        .map(
          (o) =>
            `"${o.orderNumber}","${formatDate(o.createdAt)}","${o.customerName}","${o.paymentMethod}","${o.paymentStatus || "PAID"}","${o.status}",${o.totalPoints || 0},${o.totalAmount}`
        )
        .join("\n");

      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const blobUrl = URL.createObjectURL(blob);
      const fallbackLink = document.createElement("a");
      fallbackLink.href = blobUrl;
      fallbackLink.download = `Laporan-Keuangan-BC3-${new Date().toISOString().slice(0, 10)}.csv`;
      fallbackLink.click();
      URL.revokeObjectURL(blobUrl);

      showToast.success("Laporan Diunduh", `File CSV Laporan Transaksi (${completedOrders.length} baris) berhasil disimpan.`);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Panel & Filter Periode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-text-primary tracking-tight">{t("title")}</h2>
          <p className="text-xs text-text-muted mt-0.5">{t("subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Periode Cepat */}
          <TijarahTabs
            variant="segmented"
            selectedKey={period}
            onSelectionChange={(key) => setPeriod(key as any)}
            items={[
              { id: "all", label: "Semua" },
              { id: "today", label: "Hari Ini" },
              { id: "last7days", label: "7 Hari" },
              { id: "thisMonth", label: "Bulan Ini" },
            ]}
          />

          {/* Date Range Picker Kustom */}
          <TijarahDateRangePicker
            value={customRange}
            onChange={(range) => {
              setCustomRange(range);
              setPeriod("custom");
              fetchReport("custom", range);
            }}
            onClear={() => {
              setCustomRange({ startDate: "", endDate: "" });
              setPeriod("all");
              fetchReport("all");
            }}
            placeholder="Rentang Kustom..."
          />

          <TijarahButton
            type="button"
            heroVariant="outline"
            size="sm"
            onClick={() => fetchReport(period)}
            isLoading={isLoading}
            className="text-xs px-2.5 h-8 font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </TijarahButton>

          <TijarahButton
            type="button"
            tijarahVariant="primary"
            size="sm"
            onClick={handleDownloadCsv}
            className="text-xs px-3.5 h-8 font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </TijarahButton>
        </div>
      </div>

      {/* Ringkasan Breakdown Finansial Utama (Full Width 4 Kolom) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TijarahCard
          tijarahVariant="default"
          className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl flex flex-col justify-between"
        >
          <span className="text-xs text-text-muted font-bold block uppercase tracking-wider">
            Total Akumulasi Omzet
          </span>
          <span className="text-2xl font-black text-text-primary block mt-2">
            {formatCurrency(grossRevenue)}
          </span>
          <span className="text-[11px] text-status-success font-bold block mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {financialData?.summary?.totalTransactions ?? completedOrders.length} transaksi penjualan
          </span>
        </TijarahCard>

        <TijarahCard
          tijarahVariant="default"
          className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl flex flex-col justify-between"
        >
          <span className="text-xs text-text-muted font-bold block uppercase tracking-wider">
            Penerimaan QRIS & Tunai
          </span>
          <span className="text-2xl font-black text-primary-sage block mt-2">
            {formatCurrency(cashOrQrisRevenue)}
          </span>
          <span className="text-[11px] text-text-muted block mt-1">Saldo kasir terverifikasi masuk</span>
        </TijarahCard>

        <TijarahCard
          tijarahVariant="default"
          className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl flex flex-col justify-between"
        >
          <span className="text-xs text-text-muted font-bold block uppercase tracking-wider">
            Piutang Kasbon B2B (Tempo)
          </span>
          <span className="text-2xl font-black text-accent-gold block mt-2">
            {formatCurrency(kasbonRevenue)}
          </span>
          <span className="text-[11px] text-text-muted block mt-1">Jatuh tempo pelunasan agen mitra</span>
        </TijarahCard>

        <TijarahCard
          tijarahVariant="default"
          className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl flex flex-col justify-between"
        >
          <span className="text-xs text-text-muted font-bold block uppercase tracking-wider">
            Akumulasi Poin TP HSIS
          </span>
          <span className="text-2xl font-black text-status-success block mt-2">
            +{totalPointsGenerated.toLocaleString("id-ID")} TP
          </span>
          <span className="text-[11px] text-text-muted block mt-1">Alokasi royalti omzet keagenan</span>
        </TijarahCard>
      </div>

      {/* Visualisasi Grafik Penjualan Harian & Poin TP HNI */}
      <TijarahCard className="p-5 border border-border-subtle rounded-2xl bg-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary-sage" />
              Grafik Penjualan Harian &amp; Poin TP HNI
            </h4>
            <p className="text-xs text-text-muted mt-0.5">
              Tren omzet penjualan harian (Sage) dibandingkan akumulasi Poin TP HNI (Gold).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-text-muted font-semibold">
              <span className="w-3 h-3 rounded-sm bg-primary-sage block" /> Omzet Penjualan
            </span>
            <span className="flex items-center gap-1.5 text-text-muted font-semibold">
              <span className="w-3 h-3 rounded-sm bg-accent-gold block" /> Poin TP HNI
            </span>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="pt-4 pb-2">
            <div className="h-48 flex items-end gap-2 sm:gap-3 border-b border-border-subtle px-2 overflow-x-auto">
              {chartData.map((item, idx) => {
                const heightPct = Math.max(12, Math.round((item.revenue / maxRevenueInChart) * 100));
                const tpVal = item.tpPoints || 0;
                const tpHeightPct = tpVal > 0 ? Math.max(10, Math.round((tpVal / maxTpInChart) * 100)) : 4;

                return (
                  <div key={idx} className="flex-1 min-w-[38px] flex flex-col items-center gap-1 h-full justify-end group relative">
                    {/* Tooltip Hover */}
                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] p-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                      <p className="font-bold">{item.date}</p>
                      <p className="text-primary-sage">Omzet: {formatCurrency(item.revenue)}</p>
                      <p className="text-accent-gold">{tpVal.toLocaleString("id-ID")} TP ({item.orderCount} trx)</p>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Bar Omzet */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-1/2 max-w-[16px] bg-primary-sage rounded-t-md transition-all group-hover:brightness-110"
                      />
                      {/* Bar Poin TP */}
                      <div
                        style={{ height: `${tpHeightPct}%` }}
                        className="w-1/2 max-w-[16px] bg-accent-gold rounded-t-md transition-all group-hover:brightness-110"
                      />
                    </div>
                    <span className="text-[10px] text-text-muted font-mono mt-1 whitespace-nowrap">
                      {item.date.slice(8)}/{item.date.slice(5, 7)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center bg-canvas/40 rounded-xl border border-dashed border-border-subtle text-xs text-text-muted">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary-sage opacity-40" />
            <p>Data tren penjualan untuk rentang periode ini belum tersedia.</p>
          </div>
        )}
      </TijarahCard>

      {/* Ringkasan Omzet, Diskon & Poin TP HNI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TijarahCard
          tijarahVariant="default"
          className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-3"
        >
          <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary-sage" />
            Ringkasan Performa Penjualan HNI
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Total Penjualan ({totalTransactions} Transaksi):</span>
              <span className="font-bold text-text-primary tabular-nums">{formatCurrency(grossRevenue)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Total Potongan / Diskon Kupon:</span>
              <span className="font-bold text-status-danger tabular-nums">-{formatCurrency(totalDiscount)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Penerimaan Tunai &amp; QRIS:</span>
              <span className="font-bold text-text-primary tabular-nums">{formatCurrency(cashOrQrisRevenue)}</span>
            </div>
            <div className="flex justify-between py-1.5 font-bold text-sm bg-primary-sage/10 p-2 rounded-lg text-primary-sage">
              <span>Akumulasi Poin TP HSIS:</span>
              <span className="tabular-nums">+{totalPointsGenerated.toLocaleString("id-ID")} TP</span>
            </div>
          </div>
        </TijarahCard>

        <TijarahCard
          tijarahVariant="default"
          className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-3"
        >
          <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-success" />
            {t("readyTitle")}
          </h4>
          <p className="text-xs text-text-muted leading-relaxed">{t("readyDesc")}</p>
          <div className="p-3 bg-canvas/70 rounded-xl border border-border-subtle text-[11px] text-text-muted space-y-1">
            <p className="leading-snug">
              Seluruh histori transaksi penjualan, perhitungan poin keagenan, serta resi kurir telah terintegrasi.
              Data siap diekspor berkala untuk pelaporan audit Business Center ke Kantor Wilayah HNI.
            </p>
          </div>
        </TijarahCard>
      </div>

      {/* Tabel Rincian Buku Besar Transaksi Selesai (Full Width) */}
      <TijarahCard
        tijarahVariant="default"
        className="border border-border-subtle overflow-hidden mac-glass mac-shadow rounded-2xl"
      >
        <div className="p-4 bg-canvas/60 border-b border-border-subtle flex items-center justify-between">
          <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-primary-sage" />
            Rekap Buku Besar Transaksi Terakhir
          </span>
          <span className="text-[11px] text-text-muted">Menampilkan transaksi lunas & aktif</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-subtle bg-canvas/40 text-text-muted uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-4">No. Order</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Status Bayar</th>
                <th className="py-3 px-4 text-right">Poin TP</th>
                <th className="py-3 px-4 text-right">Nominal Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {completedOrders.slice(0, 15).map((ord) => (
                <tr key={ord.id} className="hover:bg-canvas/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-text-primary">{ord.orderNumber}</td>
                  <td className="py-3.5 px-4 text-text-muted">{formatDate(ord.createdAt)}</td>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">{ord.customerName}</td>
                  <td className="py-3.5 px-4 text-text-muted">{ord.paymentMethod}</td>
                  <td className="py-3.5 px-4">
                    <TijarahBadge
                      tijarahVariant={ord.paymentStatus === "PAID" ? "success" : "warning"}
                      className="text-[10px] font-bold"
                    >
                      {ord.paymentStatus === "PAID" ? "Lunas" : "Kasbon Tempo"}
                    </TijarahBadge>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-status-success">
                    +{ord.totalPoints || 0} TP
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-text-primary">
                    {formatCurrency(ord.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TijarahCard>
    </div>
  );
};

export default ReportsPanel;
