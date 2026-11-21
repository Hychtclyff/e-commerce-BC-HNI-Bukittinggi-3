"use client";

import React, { useState } from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { showToast } from "@/utils/toast";
import { storeApi } from "@/modules/store/api/store.api";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Layers,
  ArrowRight,
} from "lucide-react";

export interface IInventoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InventoryImportModal: React.FC<IInventoryImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<
    Array<{ sku: string; stock: number; mode: "SET" | "ADD" }>
  >([]);
  const [importMode, setImportMode] = useState<"ADD" | "SET">("ADD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateContent =
      "\uFEFFSKU,Nama Produk,Kategori,Harga Konsumen,Harga Agen,Stok,Poin TP,Status\nEX-FOOD,Extra Food HNI,Herbal,80000,60000,50,20,AKTIF\nMHS-100,Minyak Herba Sinergi,Herbal,45000,30000,100,10,AKTIF\n";
    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Template-Import-Stok-Tijarah.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast.success("Template Diunduh", "Template CSV seragam (sesuai format Export) berhasil diunduh.");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!/\.(csv|tsv|txt)$/i.test(selected.name)) {
      setParseError("Format file harus .csv, .tsv, atau .txt (jika dari Excel, pilih Save As CSV).");
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawText = String(event.target?.result || "").replace(/^\uFEFF/, "");
        const lines = rawText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length < 2) {
          setParseError("File kosong atau tidak memiliki baris data.");
          return;
        }

        // Auto-detect delimiter (semicolon from Excel ID locale, tab, or comma)
        const headerLine = lines[0];
        const delimiter = headerLine.includes(";") ? ";" : headerLine.includes("\t") ? "\t" : ",";
        const splitCsvLine = (line: string) =>
          line.split(delimiter).map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim());

        const headers = splitCsvLine(headerLine).map((h) => h.toLowerCase());
        const skuIdx = headers.findIndex((h) => h === "sku" || h === "pc" || h.includes("kode"));
        const stockIdx = headers.findIndex((h) => h === "stok" || h === "stock" || h === "qty");
        const modeIdx = headers.findIndex((h) => h === "mode");

        const resolvedSkuIdx = skuIdx >= 0 ? skuIdx : 0;
        const resolvedStockIdx = stockIdx >= 0 ? stockIdx : 1;

        const items: Array<{ sku: string; stock: number; mode: "SET" | "ADD" }> = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = splitCsvLine(lines[i]);
          const sku = cols[resolvedSkuIdx];
          const stock = parseInt(cols[resolvedStockIdx], 10);
          const modeCol = ((modeIdx >= 0 ? cols[modeIdx] : "") || importMode).toUpperCase();
          const mode: "SET" | "ADD" = modeCol === "SET" ? "SET" : "ADD";

          if (sku && !isNaN(stock)) {
            items.push({ sku, stock, mode });
          }
        }

        if (items.length === 0) {
          setParseError("Tidak ada baris data valid. Pastikan ada kolom SKU dan Stok.");
          return;
        }

        setParsedItems(items);
      } catch (err: any) {
        setParseError(`Gagal membaca file: ${err.message}`);
      }
    };
    reader.readAsText(selected);
  };

  const handleExecuteImport = async () => {
    if (parsedItems.length === 0) {
      showToast.error("Data Kosong", "Silakan pilih dan upload file CSV terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Pastikan mode sesuai pilihan global jika belum ditentukan per baris
      const finalItems = parsedItems.map((item) => ({
        ...item,
        mode: importMode,
      }));

      const res = await storeApi.importInventory(finalItems);
      if (res.success) {
        showToast.success("Import Berhasil", res.message);
        onSuccess();
        onClose();
      } else {
        showToast.error("Gagal Import", res.message);
      }
    } catch (err: any) {
      showToast.error("Terjadi Kesalahan", err?.message || "Gagal memproses import stok.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-border-subtle rounded-xl w-full max-w-xl mx-auto shadow-xl p-5 space-y-4">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--badge-primary-bg)] border border-[var(--badge-primary-border)] text-primary-sage flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-text-primary">
                Import Stok Massal Produk
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Perbarui kuantitas inventaris fisik melalui file spreadsheet CSV.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal import"
            className="w-7 h-7 rounded-lg hover:bg-canvas flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Template & Mode Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-canvas rounded-xl border border-border-subtle text-xs">
          <div>
            <span className="font-semibold text-text-primary block">Metode Pembaruan Stok:</span>
            <span className="text-[11px] text-text-muted">
              Tentukan apakah stok CSV akan ditambahkan ke stok lama atau menimpa.
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setImportMode("ADD")}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors text-xs border ${
                importMode === "ADD"
                  ? "bg-primary-sage text-white border-primary-sage"
                  : "bg-surface border-border-subtle text-text-muted hover:bg-canvas"
              }`}
            >
              + Tambah (ADD)
            </button>
            <button
              type="button"
              onClick={() => setImportMode("SET")}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors text-xs border ${
                importMode === "SET"
                  ? "bg-accent-gold text-white border-accent-gold"
                  : "bg-surface border-border-subtle text-text-muted hover:bg-canvas"
              }`}
            >
              = Timpa (SET)
            </button>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-text-muted flex items-center justify-between">
            <span>Pilih File CSV:</span>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-primary-sage hover:underline flex items-center gap-1 text-[11px] font-semibold"
            >
              <Download className="w-3 h-3" />
              Unduh Template CSV
            </button>
          </div>

          <label className="border border-dashed border-border-subtle hover:border-primary-sage rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-canvas/60 hover:bg-canvas transition-colors text-center">
            <Upload className="w-6 h-6 text-primary-sage mb-1.5" />
            <span className="font-semibold text-xs text-text-primary">
              {file ? file.name : "Klik atau seret file CSV ke sini"}
            </span>
            <span className="text-[11px] text-text-muted mt-0.5">
              Format yang didukung: .csv, .tsv, .txt (sesuai format Export CSV)
            </span>
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {parseError && (
            <div className="p-2.5 bg-[var(--badge-danger-bg)] border border-status-danger/30 rounded-lg text-status-danger text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        {/* Preview Tabel Baris yang Ditemukan */}
        {parsedItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary-sage" />
                {parsedItems.length} baris produk teridentifikasi:
              </span>
              <span className="text-[11px] text-text-muted">
                Mode aktif: {importMode === "ADD" ? "Penambahan Stok" : "Timpa Total Stok"}
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto border border-border-subtle rounded-lg bg-canvas/50 divide-y divide-border-subtle text-xs">
              {parsedItems.slice(0, 8).map((it, idx) => (
                <div key={idx} className="py-1.5 px-3 flex items-center justify-between">
                  <span className="font-mono font-semibold text-text-primary">{it.sku}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary-sage tabular-nums">
                      {importMode === "ADD" ? `+${it.stock}` : `${it.stock}`} unit
                    </span>
                    <TijarahBadge tijarahVariant="secondary" className="text-[10px]">
                      {importMode}
                    </TijarahBadge>
                  </div>
                </div>
              ))}
              {parsedItems.length > 8 && (
                <div className="py-1.5 px-3 text-center text-[10px] text-text-muted">
                  +{parsedItems.length - 8} produk lainnya...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
          <TijarahButton
            type="button"
            tijarahVariant="secondary"
            size="sm"
            onClick={onClose}
            isDisabled={isSubmitting}
            className="text-xs px-3 h-8 font-medium"
          >
            Batal
          </TijarahButton>

          <TijarahButton
            type="button"
            tijarahVariant="primary"
            size="sm"
            onClick={handleExecuteImport}
            isLoading={isSubmitting}
            isDisabled={parsedItems.length === 0}
            className="text-xs px-3.5 h-8 font-semibold flex items-center gap-1.5"
          >
            <span>Eksekusi Import Stok</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </TijarahButton>
        </div>
      </div>
    </div>
  );
};
