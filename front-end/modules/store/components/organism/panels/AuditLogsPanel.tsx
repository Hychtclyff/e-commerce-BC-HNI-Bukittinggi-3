"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShieldAlert, RefreshCw, Search } from "lucide-react";
import { storeApi } from "../../../api/store.api";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { formatDate } from "@/utils/formatters";

export function AuditLogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storeApi.getAuditLogs({
        module: moduleFilter !== "ALL" ? moduleFilter : undefined,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        search: searchTerm.trim() || undefined,
      });
      setLogs(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, actionFilter, searchTerm]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary-sage" />
            <span>Audit Trail & Log Aktivitas Staf</span>
          </h2>
          <p className="text-xs text-text-muted">
            Rekam jejak aktivitas operasional sensitif seperti buka/tutup shift kasir, PO, retur, dan perubahan pengaturan toko.
          </p>
        </div>
        <TijarahButton
          type="button"
          size="sm"
          tijarahVariant="outline"
          onClick={loadLogs}
          className="text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </TijarahButton>
      </div>

      {/* Filter Bar (#1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl border border-border-subtle bg-surface">
        <TijarahInput
          placeholder="Cari target, ringkasan, atau user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<Search className="w-3.5 h-3.5 text-text-muted" />}
          className="text-xs"
        />
        <TijarahSelect
          aria-label="Filter Modul"
          selectedKey={moduleFilter}
          onSelectionChange={(key) => setModuleFilter(String(key || "ALL"))}
        >
          <TijarahSelect.Item id="ALL">Semua Modul</TijarahSelect.Item>
          <TijarahSelect.Item id="ORDERS">ORDERS (Pesanan)</TijarahSelect.Item>
          <TijarahSelect.Item id="INVENTORY">INVENTORY (Produk)</TijarahSelect.Item>
          <TijarahSelect.Item id="SETTINGS">SETTINGS (Pengaturan)</TijarahSelect.Item>
          <TijarahSelect.Item id="RBAC">RBAC (Role &amp; Akses)</TijarahSelect.Item>
          <TijarahSelect.Item id="RETURNS">RETURNS (Retur)</TijarahSelect.Item>
        </TijarahSelect>
        <TijarahSelect
          aria-label="Filter Aksi"
          selectedKey={actionFilter}
          onSelectionChange={(key) => setActionFilter(String(key || "ALL"))}
        >
          <TijarahSelect.Item id="ALL">Semua Aksi</TijarahSelect.Item>
          <TijarahSelect.Item id="CREATE">CREATE</TijarahSelect.Item>
          <TijarahSelect.Item id="UPDATE">UPDATE</TijarahSelect.Item>
          <TijarahSelect.Item id="DELETE">DELETE</TijarahSelect.Item>
          <TijarahSelect.Item id="APPROVE">APPROVE</TijarahSelect.Item>
          <TijarahSelect.Item id="SHIP">SHIP</TijarahSelect.Item>
          <TijarahSelect.Item id="READY_FOR_PICKUP">READY_FOR_PICKUP</TijarahSelect.Item>
          <TijarahSelect.Item id="COMPLETE">COMPLETE</TijarahSelect.Item>
          <TijarahSelect.Item id="REJECT">REJECT</TijarahSelect.Item>
        </TijarahSelect>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-subtle bg-canvas text-text-muted uppercase text-[10px]">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Aktor</th>
                <th className="py-3 px-4">Modul / Aksi</th>
                <th className="py-3 px-4">Ringkasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-text-muted">
                    {loading ? "Memuat log aktivitas..." : "Belum ada catatan audit aktivitas."}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-canvas/50">
                    <td className="py-3 px-4 whitespace-nowrap text-text-muted font-mono">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary">{log.actorEmail || log.actorId || "SYSTEM"}</div>
                      <div className="text-[10px] text-text-muted">{log.actorRole || "STAFF"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-primary-sage/10 text-primary-sage font-mono text-[10px] font-bold">
                        {log.module} • {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-primary">{log.summary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
