"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Clock, Lock, Unlock } from "lucide-react";
import { storeApi } from "../../api/store.api";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { showToast } from "@/utils/toast";

export function CashierShiftBanner() {
  const [shift, setShift] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"open" | "close" | null>(null);
  const [cashInput, setCashInput] = useState("0");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadShift = useCallback(async () => {
    try {
      const current = await storeApi.getCurrentShift();
      setShift(current);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadShift();
  }, [loadShift]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalMode === "open") {
        await storeApi.openShift({ openingCash: Number(cashInput || 0), notes: notes.trim() || undefined });
        showToast.success("Shift Dibuka", "Kasir siap menerima transaksi.");
      } else if (modalMode === "close" && shift?.id) {
        const closed = await storeApi.closeShift(shift.id, {
          closingCash: Number(cashInput || 0),
          notes: notes.trim() || undefined,
        });
        showToast.success(
          "Shift Ditutup",
          `Selisih kas: ${formatCurrency(Number(closed.cashDifference || 0))}`
        );
      }
      setModalMode(null);
      setCashInput("0");
      setNotes("");
      await loadShift();
    } catch (err: any) {
      showToast.error("Gagal", err?.message || "Gagal memproses shift kasir.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              shift ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
            }`}
          >
            {shift ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-xs font-bold text-text-primary">
              {shift ? `Shift Aktif: ${shift.cashierName}` : "Shift Kasir Belum Dibuka"}
            </p>
            <p className="text-[11px] text-text-muted flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {shift
                ? `Modal Awal: ${formatCurrency(Number(shift.openingCash || 0))} • Dibuka ${formatDate(shift.openedAt)}`
                : "Buka shift untuk mencatat modal awal & rekonsiliasi kas harian."}
            </p>
          </div>
        </div>

        <TijarahButton
          type="button"
          size="sm"
          tijarahVariant={shift ? "danger" : "primary"}
          onClick={() => setModalMode(shift ? "close" : "open")}
          className="text-xs font-bold"
        >
          {shift ? "Tutup Shift & Rekonsiliasi" : "Buka Shift Kasir"}
        </TijarahButton>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface p-5 shadow-lg space-y-4"
          >
            <h3 className="text-sm font-bold text-text-primary">
              {modalMode === "open" ? "Buka Shift Kasir Baru" : "Tutup Shift & Rekonsiliasi Kas"}
            </h3>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-muted">
                {modalMode === "open" ? "Modal Tunai Awal di Laci (Rp)" : "Total Uang Tunai Aktual di Laci (Rp)"}
              </label>
              <input
                type="number"
                min={0}
                required
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-muted">Catatan Shift (Opsional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Shift pagi..."
                className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
              />
            </div>
            <div className="flex justify-end gap-2">
              <TijarahButton
                type="button"
                size="sm"
                tijarahVariant="outline"
                onClick={() => setModalMode(null)}
                className="text-xs font-bold"
              >
                Batal
              </TijarahButton>
              <TijarahButton
                type="submit"
                size="sm"
                tijarahVariant="primary"
                isLoading={submitting}
                className="text-xs font-bold"
              >
                {modalMode === "open" ? "Buka Shift" : "Simpan & Tutup"}
              </TijarahButton>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
