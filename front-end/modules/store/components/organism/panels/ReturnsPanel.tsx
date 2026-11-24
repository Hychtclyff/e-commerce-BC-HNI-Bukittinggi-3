"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RotateCcw, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { storeApi } from "../../../api/store.api";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { formatCurrency } from "@/utils/formatters";
import { showToast } from "@/utils/toast";

export function ReturnsPanel() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReturns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storeApi.getOrderReturns();
      setReturns(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const handleDecision = async (id: string, status: "APPROVED" | "REJECTED" | "REFUNDED") => {
    try {
      await storeApi.processOrderReturn(id, {
        status,
        adminNotes:
          status === "REFUNDED"
            ? "Dana / kompensasi telah dikembalikan."
            : status === "APPROVED"
              ? "Pengajuan retur disetujui oleh admin toko."
              : "Pengajuan retur ditolak setelah peninjauan.",
      });
      showToast.success("Retur Diproses", `Status retur diubah menjadi ${status}.`);
      await loadReturns();
    } catch (err: any) {
      showToast.error("Gagal", err?.message || "Tidak dapat memproses retur.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary-sage" />
            <span>Manajemen Retur & Komplain Pesanan</span>
          </h2>
          <p className="text-xs text-text-muted">
            Tinjau pengajuan komplain/retur dari pelanggan dan proses persetujuan atau pengembalian dana.
          </p>
        </div>
        <TijarahButton
          type="button"
          size="sm"
          tijarahVariant="outline"
          onClick={loadReturns}
          className="text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </TijarahButton>
      </div>

      {returns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle p-10 text-center text-xs text-text-muted">
          {loading ? "Memuat pengajuan retur..." : "Belum ada pengajuan retur atau komplain."}
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((ret) => (
            <div
              key={ret.id}
              className="rounded-2xl border border-border-subtle bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-text-primary">#{ret.orderNumber}</span>
                  <TijarahBadge
                    tijarahVariant={
                      ret.status === "REFUNDED" || ret.status === "APPROVED"
                        ? "success"
                        : ret.status === "REJECTED"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {ret.status}
                  </TijarahBadge>
                </div>
                <p className="text-xs font-semibold text-text-primary">
                  {ret.reason} •{" "}
                  <span className="text-text-muted font-normal">
                    {ret.customerName || ret.customerEmail || "Pelanggan"}
                  </span>
                </p>
                <p className="text-xs text-text-muted">{ret.description}</p>
                {ret.evidenceUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <a
                      href={ret.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block w-16 h-16 rounded-xl overflow-hidden border border-border-subtle bg-canvas shrink-0"
                      title="Klik untuk memperbesar bukti"
                    >
                      <img
                        src={ret.evidenceUrl}
                        alt={`Bukti retur #${ret.orderNumber}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </a>
                    <a
                      href={ret.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-primary-sage hover:underline inline-block"
                    >
                      Lihat Bukti Lampiran ↗
                    </a>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-xs font-mono font-bold text-text-primary mr-2">
                  {formatCurrency(Number(ret.refundAmount || 0))}
                </span>
                {ret.status === "PENDING" && (
                  <>
                    <TijarahButton
                      type="button"
                      size="sm"
                      tijarahVariant="outline"
                      onClick={() => handleDecision(ret.id, "APPROVED")}
                      className="text-xs font-bold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                    </TijarahButton>
                    <TijarahButton
                      type="button"
                      size="sm"
                      tijarahVariant="danger"
                      onClick={() => handleDecision(ret.id, "REJECTED")}
                      className="text-xs font-bold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Tolak
                    </TijarahButton>
                  </>
                )}
                {ret.status === "APPROVED" && (
                  <TijarahButton
                    type="button"
                    size="sm"
                    tijarahVariant="primary"
                    onClick={() => handleDecision(ret.id, "REFUNDED")}
                    className="text-xs font-bold"
                  >
                    Tandai Sudah Refund
                  </TijarahButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
