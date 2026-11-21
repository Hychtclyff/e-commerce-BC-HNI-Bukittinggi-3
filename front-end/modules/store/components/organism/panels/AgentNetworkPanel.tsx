"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTabs, TijarahTabList, TijarahTab } from "@/components/atom/tijarahTabs";
import { storeApi } from "@/modules/store/api/store.api";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { showToast } from "@/utils/toast";
import {
  Users,
  RefreshCw,
  Search,
  Phone,
  CheckCircle2,
  Clock,
  X,
  Upload,
  Download,
} from "lucide-react";

export interface IAgentNetworkPanelProps {
  onRefreshParent?: () => void;
}

type RegistrationFilter = "ALL" | "REGISTERED" | "UNREGISTERED_HSIS";

export const AgentNetworkPanel: React.FC<IAgentNetworkPanelProps> = ({ onRefreshParent }) => {
  const locale = useLocale();
  const isEn = locale === "en";

  const [members, setMembers] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalAgents: 0,
    registeredCount: 0,
    hsisSyncedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingHsis, setIsSyncingHsis] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [regFilter, setRegFilter] = useState<RegistrationFilter>("ALL");

  const loadNetworkData = async () => {
    setIsLoading(true);
    try {
      const res = await storeApi.getAgentNetwork();
      const combined = [
        ...(res.rootAgent ? [res.rootAgent] : []),
        ...(res.downlines || []),
      ];
      setMembers(combined);
      setSummary({
        totalAgents: res.totalAgents ?? combined.length,
        registeredCount:
          (res as any).registeredCount ?? combined.filter((m: any) => m.isRegisteredUser).length,
        hsisSyncedCount:
          (res as any).hsisSyncedCount ??
          combined.filter((m: any) => !m.isRegisteredUser || m.sourceChannel === "HSIS_SYNC").length,
      });
    } catch (err: any) {
      showToast.error(
        isEn ? "Failed to Load Network" : "Gagal Memuat Jaringan",
        err?.message || ""
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNetworkData();
  }, []);

  const handleSyncHsisBuyers = async () => {
    setIsSyncingHsis(true);
    try {
      const res = await storeApi.syncHsisSales();
      await loadNetworkData();
      if (onRefreshParent) onRefreshParent();
      showToast.success(
        isEn ? "HSIS Network Synced" : "Jaringan HSIS Disinkronkan",
        isEn
          ? `${res?.importedCount ?? 0} HSIS transactions processed.`
          : `${res?.importedCount ?? 0} transaksi HSIS diproses.`
      );
    } catch (err: any) {
      showToast.error(
        isEn ? "Sync Failed" : "Sinkronisasi Gagal",
        err?.message || ""
      );
    } finally {
      setIsSyncingHsis(false);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = [
      "ID,Nama,Upline,Niaga,Peringkat",
      "3466897,SADRI UMAR,3466846,AB,A",
      "3466859,MULIANI SOLTA,3466846,AB,A",
    ].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Template-Jaringan-Agen-HSIS.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCsvLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleCsvFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsImportingCsv(true);
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length < 2) {
        throw new Error(isEn ? "CSV file is empty or missing rows." : "File CSV kosong atau tidak memiliki baris data.");
      }

      const delimiter = lines[0].includes(";") ? ";" : ",";
      const headers = parseCsvLine(lines[0], delimiter).map((h) => h.toLowerCase());
      const idIdx = headers.findIndex((h) => h === "id" || h === "hni_id" || h === "hniid");
      const nameIdx = headers.findIndex((h) => h === "nama" || h === "name");
      const uplineIdx = headers.findIndex((h) => h === "upline");
      const niagaIdx = headers.findIndex((h) => h === "niaga" || h === "tier");
      const rankIdx = headers.findIndex((h) => h === "peringkat" || h === "rank");

      if (idIdx < 0 || nameIdx < 0) {
        throw new Error(
          isEn
            ? "CSV header must contain 'ID' and 'Nama' columns (download template for reference)."
            : "Header CSV wajib memiliki kolom 'ID' dan 'Nama' (unduh template untuk format yang sesuai)."
        );
      }

      const items: Array<{ hniId: string; name: string; upline?: string; niaga?: string; peringkat?: string }> = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i], delimiter);
        const hniId = (cols[idIdx] || "").trim();
        const name = (cols[nameIdx] || "").trim();
        if (!hniId || !name) continue;
        items.push({
          hniId,
          name,
          upline: uplineIdx >= 0 ? (cols[uplineIdx] || "").trim() : undefined,
          niaga: niagaIdx >= 0 ? (cols[niagaIdx] || "").trim() : undefined,
          peringkat: rankIdx >= 0 ? (cols[rankIdx] || "").trim() : undefined,
        });
      }

      if (items.length === 0) {
        throw new Error(isEn ? "No valid rows found in CSV." : "Tidak ada baris data valid di dalam file CSV.");
      }

      const res = await storeApi.importAgentNetworkCsv(items);
      await loadNetworkData();
      if (onRefreshParent) onRefreshParent();
      showToast.success(isEn ? "CSV Imported" : "Import CSV Berhasil", res.message);
    } catch (err: any) {
      showToast.error(isEn ? "Import Failed" : "Import CSV Gagal", err?.message || "");
    } finally {
      setIsImportingCsv(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const isReg = Boolean(m.isRegisteredUser);
      if (regFilter === "REGISTERED" && !isReg) return false;
      if (regFilter === "UNREGISTERED_HSIS" && isReg) return false;
      if (q) {
        return (
          String(m.name || "").toLowerCase().includes(q) ||
          String(m.hniId || m.hniMemberId || "").toLowerCase().includes(q) ||
          String(m.phone || m.phoneNumber || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [members, regFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header */}
      <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-text-primary">
            {isEn ? "Transacted Agent & Buyer Network" : "Jaringan Agen & Pembeli Toko"}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {isEn
              ? "All agents and customers who have transacted in Tijarah or via HSIS Utama sync (including unregistered HSIS buyers)."
              : "Daftar agen dan pelanggan yang pernah bertransaksi di Tijarah maupun dari sinkronisasi penjualan HSIS (termasuk yang belum registrasi akun Tijarah)."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvFileSelected}
            className="hidden"
          />

          <TijarahButton
            type="button"
            tijarahVariant="outline"
            size="sm"
            onClick={handleDownloadCsvTemplate}
            className="text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isEn ? "CSV Template" : "Template CSV"}</span>
          </TijarahButton>

          <TijarahButton
            type="button"
            tijarahVariant="outline"
            size="sm"
            isLoading={isImportingCsv}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isEn ? "Import CSV" : "Import CSV"}</span>
          </TijarahButton>

          <TijarahButton
            type="button"
            tijarahVariant="outline"
            size="sm"
            onClick={loadNetworkData}
            isDisabled={isLoading || isSyncingHsis || isImportingCsv}
            className="text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isEn ? "Refresh" : "Muat Ulang"}</span>
          </TijarahButton>

          <TijarahButton
            type="button"
            tijarahVariant="primary"
            size="sm"
            onClick={handleSyncHsisBuyers}
            isLoading={isSyncingHsis}
            className="text-xs h-8 px-3 rounded-lg font-semibold flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isEn ? "Sync HSIS Buyers" : "Sync Pembeli HSIS"}</span>
          </TijarahButton>
        </div>
      </div>

      {/* Aligned Summary Strip */}
      <div className="bg-surface border border-border-subtle rounded-xl grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-text-muted block">
            {isEn ? "Total Network Members" : "Total Agen / Pembeli"}
          </span>
          <span className="text-base font-bold text-text-primary tabular-nums mt-0.5 block">
            {summary.totalAgents}
          </span>
        </div>
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-text-muted block">
            {isEn ? "Registered in Tijarah" : "Terdaftar Akun Tijarah"}
          </span>
          <span className="text-base font-bold text-status-success tabular-nums mt-0.5 block">
            {summary.registeredCount}
          </span>
        </div>
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-text-muted block">
            {isEn ? "Unregistered (HSIS Sync)" : "Belum Registrasi (Sync HSIS)"}
          </span>
          <span className="text-base font-bold text-accent-gold tabular-nums mt-0.5 block">
            {summary.hsisSyncedCount}
          </span>
        </div>
      </div>

      {/* Table + Filters */}
      <TijarahCard className="border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-canvas/60 border-b border-border-subtle flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="w-full lg:w-72">
            <TijarahInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? "Search name, HNI ID, or phone..." : "Cari nama, ID HNI, atau HP..."}
              startContent={<Search className="w-3.5 h-3.5 text-text-muted" />}
              endContent={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-text-muted hover:text-text-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : undefined
              }
              className="text-xs h-8"
            />
          </div>

          <TijarahTabs
            selectedKey={regFilter}
            onSelectionChange={(k) => setRegFilter(String(k) as RegistrationFilter)}
            variant="segmented"
            className="w-auto"
          >
            <TijarahTabList variant="segmented">
              <TijarahTab id="ALL">{isEn ? "All" : "Semua"}</TijarahTab>
              <TijarahTab id="REGISTERED">{isEn ? "Registered" : "Terdaftar Tijarah"}</TijarahTab>
              <TijarahTab id="UNREGISTERED_HSIS">
                {isEn ? "HSIS (Unregistered)" : "Belum Registrasi (HSIS)"}
              </TijarahTab>
            </TijarahTabList>
          </TijarahTabs>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas/80 border-b border-border-subtle text-text-muted uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-4">{isEn ? "Member / Buyer" : "Nama & Kontak"}</th>
                <th className="py-2.5 px-4">ID HNI</th>
                <th className="py-2.5 px-4">{isEn ? "Account Status" : "Status Akun"}</th>
                <th className="py-2.5 px-4 text-right">{isEn ? "Orders" : "Order"}</th>
                <th className="py-2.5 px-4 text-right">{isEn ? "Total Spent" : "Total Belanja"}</th>
                <th className="py-2.5 px-4 text-right">TP</th>
                <th className="py-2.5 px-4">{isEn ? "Last Tx" : "Terakhir"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-text-muted">
                    {isEn ? "No network members found." : "Belum ada data anggota jaringan."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-text-primary block">{m.name}</span>
                      <span className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {m.phone || m.phoneNumber || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary-sage">
                      {m.hniId || m.hniMemberId || "-"}
                    </td>
                    <td className="py-3 px-4">
                      {m.isRegisteredUser ? (
                        <TijarahBadge tijarahVariant="success" className="text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isEn ? "Registered" : "Terdaftar Tijarah"}</span>
                        </TijarahBadge>
                      ) : (
                        <TijarahBadge tijarahVariant="warning" className="text-[10px] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{isEn ? "HSIS Sync (Unregistered)" : "Belum Registrasi (HSIS)"}</span>
                        </TijarahBadge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                      {m.totalOrders || 0}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-text-primary tabular-nums whitespace-nowrap">
                      {formatCurrency(m.totalSpent || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-accent-gold tabular-nums">
                      {m.totalTpPoints || 0}
                    </td>
                    <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                      {m.lastTransactionAt ? formatDate(m.lastTransactionAt) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TijarahCard>
    </div>
  );
};

export default AgentNetworkPanel;
