"use client";

import React, { useEffect, useState, useCallback } from "react";
import { RotateCcw, RefreshCw, ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/axios/client";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Link } from "@/lib/i18n/navigation";

export function ReturnsProfilePanel() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReturns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/orders/my-returns");
      setReturns(res.data?.data ?? []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-text-primary flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary-sage" />
            <span>Status Pengajuan Retur &amp; Komplain</span>
          </h3>
          <p className="text-xs text-text-muted">
            Pantau progres peninjauan retur barang dan pengembalian dana pesanan Anda.
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
        <TijarahCard tijarahVariant="default" className="p-8 border border-dashed border-border-subtle text-center">
          <p className="text-xs text-text-muted">
            {loading
              ? "Memuat riwayat retur Anda..."
              : "Belum ada pengajuan retur barang. Anda dapat mengajukan retur dari halaman detail pesanan yang berstatus Selesai."}
          </p>
        </TijarahCard>
      ) : (
        <div className="space-y-3">
          {returns.map((ret) => (
            <TijarahCard
              key={ret.id}
              tijarahVariant="default"
              className="p-4 sm:p-5 border border-border-subtle flex flex-col sm:flex-row gap-4 justify-between"
            >
              <div className="flex gap-3.5 min-w-0">
                {ret.evidenceUrl && (
                  <a
                    href={ret.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-16 h-16 rounded-xl border border-border-subtle bg-canvas overflow-hidden shrink-0 block"
                  >
                    <img
                      src={ret.evidenceUrl}
                      alt="Bukti Retur"
                      className="w-full h-full object-cover"
                    />
                  </a>
                )}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-text-primary">
                      #{ret.orderNumber}
                    </span>
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
                    <span className="text-[11px] text-text-muted">{formatDate(ret.createdAt)}</span>
                  </div>
                  <p className="text-xs font-bold text-text-primary">{ret.reason}</p>
                  <p className="text-xs text-text-muted">{ret.description}</p>
                  {ret.adminNotes && (
                    <p className="text-xs text-primary-sage font-semibold">
                      Catatan Toko: {ret.adminNotes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                <span className="text-xs font-mono font-bold text-text-primary">
                  {formatCurrency(Number(ret.refundAmount || 0))}
                </span>
                <Link
                  href={`/orders/${ret.orderId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-sage hover:underline"
                >
                  <span>Detail Pesanan</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </TijarahCard>
          ))}
        </div>
      )}
    </div>
  );
}
