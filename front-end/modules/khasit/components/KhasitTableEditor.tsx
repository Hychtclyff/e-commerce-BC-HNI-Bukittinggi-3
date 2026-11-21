"use client";

import React, { useState, useEffect } from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { showToast } from "@/utils/toast";
import { storeApi } from "@/modules/store/api/store.api";
import type { StoreProductKnowledge } from "@/modules/store/types/store.types";
import {
  Table as TableIcon,
  Plus,
  Save,
  RotateCcw,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  HelpCircle,
} from "lucide-react";

export interface EditableKhasitRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  benefits: string;
  composition: string;
  usageRules: string;
  bpomNumber: string;
  halalNumber: string;
  isDirty?: boolean;
  isNew?: boolean;
}

interface KhasitTableEditorProps {
  initialProducts?: StoreProductKnowledge[];
  onSavedSuccess?: () => void;
}

export const KhasitTableEditor: React.FC<KhasitTableEditorProps> = ({
  initialProducts = [],
  onSavedSuccess,
}) => {
  const [rows, setRows] = useState<EditableKhasitRow[]>([]);
  const [originalRows, setOriginalRows] = useState<EditableKhasitRow[]>([]);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Inisialisasi baris dari data katalog produk
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      const mapped: EditableKhasitRow[] = initialProducts.map((p) => ({
        id: p.id,
        sku: p.sku || "",
        name: p.name || "",
        category: p.category || "Herbal Sunnah",
        benefits: Array.isArray(p.benefits) ? p.benefits.join(", ") : String(p.benefits || ""),
        composition: Array.isArray(p.composition) ? p.composition.join(", ") : String(p.composition || ""),
        usageRules: p.usageRules || "",
        bpomNumber: p.bpomNumber || "",
        halalNumber: p.halalNumber || "",
        isDirty: false,
        isNew: false,
      }));
      setRows(mapped);
      setOriginalRows(JSON.parse(JSON.stringify(mapped)));
    }
  }, [initialProducts]);

  const handleCellChange = (id: string, field: keyof EditableKhasitRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            [field]: value,
            isDirty: true,
          };
        }
        return r;
      })
    );
  };

  const handleAddNewRow = () => {
    const newId = `new-${Date.now()}`;
    const newRow: EditableKhasitRow = {
      id: newId,
      sku: `HNI-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      category: "Herbal Sunnah",
      benefits: "",
      composition: "",
      usageRules: "3 x 2 kapsul sehari sesudah makan",
      bpomNumber: "POM TR ",
      halalNumber: "ID0041000000000",
      isDirty: true,
      isNew: true,
    };
    setRows([newRow, ...rows]);
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReset = () => {
    setRows(JSON.parse(JSON.stringify(originalRows)));
    showToast.info("Perubahan Dibatalkan", "Tabel khasiat dikembalikan ke kondisi awal database.");
  };

  const handleBatchSave = async () => {
    const dirtyRows = rows.filter((r) => r.isDirty || r.isNew);
    if (dirtyRows.length === 0) {
      showToast.info("Tidak Ada Perubahan", "Semua baris data sudah sesuai dengan database.");
      return;
    }

    // Validasi baris baru
    const invalidRows = dirtyRows.filter((r) => !r.name.trim() || !r.sku.trim());
    if (invalidRows.length > 0) {
      showToast.error("Validasi Gagal", "Pastikan semua baris yang diedit memiliki Nama dan SKU/Kode yang valid.");
      return;
    }

    setIsSaving(true);
    try {
      const itemsToSave = dirtyRows.map((r) => ({
        id: r.isNew ? undefined : r.id,
        sku: r.sku.trim(),
        name: r.name.trim(),
        category: r.category.trim(),
        benefits: r.benefits.split(",").map((s) => s.trim()).filter(Boolean),
        composition: r.composition.split(",").map((s) => s.trim()).filter(Boolean),
        usageRules: r.usageRules.trim(),
        bpomNumber: r.bpomNumber.trim(),
        halalNumber: r.halalNumber.trim(),
      }));

      const res = await storeApi.batchUpdateProductKnowledge(itemsToSave);
      if (res.success) {
        showToast.success("Batch Simpan Berhasil", res.message || `${dirtyRows.length} produk berhasil disimpan.`);
        // Mark as clean
        const cleanedRows = rows.map((r) => ({ ...r, isDirty: false, isNew: false }));
        setRows(cleanedRows);
        setOriginalRows(JSON.parse(JSON.stringify(cleanedRows)));
        if (onSavedSuccess) onSavedSuccess();
      } else {
        showToast.error("Gagal Menyimpan", res.message);
      }
    } catch (err: any) {
      showToast.error("Terjadi Kesalahan", err?.message || "Gagal melakukan batch update tabel khasiat.");
    } finally {
      setIsSaving(false);
    }
  };

  const dirtyCount = rows.filter((r) => r.isDirty || r.isNew).length;

  const filteredRows = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.sku.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.benefits.toLowerCase().includes(q) ||
      r.bpomNumber.toLowerCase().includes(q)
    );
  });

  return (
    <TijarahCard tijarahVariant="default" className="p-5 rounded-3xl border border-border-subtle bg-surface shadow-sm space-y-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary-sage" />
            <h3 className="font-black text-base text-text-primary">
              Table Editor Katalog Khasiat Herba (Spreadsheet In-Place)
            </h3>
            {dirtyCount > 0 && (
              <TijarahBadge tijarahVariant="warning" className="text-[10px] font-bold animate-pulse">
                {dirtyCount} Baris Diedit
              </TijarahBadge>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Ketik langsung pada setiap sel tabel seperti Microsoft Excel / Word. Tekan <kbd className="px-1.5 py-0.5 bg-canvas border border-border-subtle rounded text-[10px] font-mono">Tab</kbd> untuk pindah kolom.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <TijarahButton
            size="sm"
            tijarahVariant="outline"
            onClick={handleAddNewRow}
            className="text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tambah Baris Cepat
          </TijarahButton>

          {dirtyCount > 0 && (
            <TijarahButton
              size="sm"
              tijarahVariant="outline"
              onClick={handleReset}
              isDisabled={isSaving}
              className="text-xs font-bold text-text-muted"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Batal
            </TijarahButton>
          )}

          <TijarahButton
            size="sm"
            tijarahVariant="primary"
            onClick={handleBatchSave}
            isDisabled={isSaving || dirtyCount === 0}
            className="text-xs font-bold shadow-sm"
          >
            <Save className={`w-3.5 h-3.5 mr-1.5 ${isSaving ? "animate-spin" : ""}`} />
            {isSaving ? "Menyimpan Batch..." : `Simpan Semua Perubahan (${dirtyCount})`}
          </TijarahButton>
        </div>
      </div>

      {/* 2. Search & Info Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <TijarahInput
            placeholder="Filter herba / BPOM / khasiat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>

        <div className="text-xs text-text-muted font-medium flex items-center gap-1.5">
          <span>Menampilkan <strong>{filteredRows.length}</strong> dari <strong>{rows.length}</strong> produk herba</span>
        </div>
      </div>

      {/* 3. In-Place Editable Table */}
      <div className="overflow-x-auto border border-border-subtle rounded-2xl bg-canvas/40 max-h-[560px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-surface z-10 shadow-xs border-b border-border-subtle">
            <tr className="text-text-muted text-[10px] uppercase font-bold tracking-wider">
              <th className="py-2.5 px-3 w-12 text-center">Status</th>
              <th className="py-2.5 px-3 min-w-[110px]">SKU / Kode</th>
              <th className="py-2.5 px-3 min-w-[170px]">Nama Produk Herba</th>
              <th className="py-2.5 px-3 min-w-[130px]">Kategori</th>
              <th className="py-2.5 px-3 min-w-[220px]">Khasiat &amp; Manfaat Utama</th>
              <th className="py-2.5 px-3 min-w-[190px]">Komposisi Kandungan</th>
              <th className="py-2.5 px-3 min-w-[180px]">Aturan Pakai / Dosis</th>
              <th className="py-2.5 px-3 min-w-[120px]">No BPOM</th>
              <th className="py-2.5 px-3 min-w-[120px]">Sertifikasi Halal</th>
              <th className="py-2.5 px-2 text-center w-12">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60 bg-surface">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-xs text-text-muted">
                  Tidak ada herba yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              filteredRows.map((r, idx) => {
                const isRowEdited = r.isDirty || r.isNew;

                return (
                  <tr
                    key={r.id}
                    className={`transition-colors hover:bg-canvas/50 ${
                      isRowEdited ? "bg-accent-gold/5" : ""
                    }`}
                  >
                    {/* Status dirty / clean */}
                    <td className="py-2 px-2 text-center">
                      {isRowEdited ? (
                        <span
                          title="Baris telah diedit tapi belum disimpan"
                          className="w-2.5 h-2.5 rounded-full bg-accent-gold inline-block animate-pulse"
                        />
                      ) : (
                        <span
                          title="Tersinkron dengan database"
                          className="w-2 h-2 rounded-full bg-status-success/60 inline-block"
                        />
                      )}
                    </td>

                    {/* SKU */}
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={r.sku}
                        onChange={(e) => handleCellChange(r.id, "sku", e.target.value)}
                        placeholder="HNI-001"
                        className="w-full text-xs font-mono font-bold bg-transparent border-0 border-b border-transparent focus:border-primary-sage focus:outline-none px-1 py-1 rounded"
                      />
                    </td>

                    {/* Nama Produk */}
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => handleCellChange(r.id, "name", e.target.value)}
                        placeholder="Nama Produk Herba"
                        className="w-full text-xs font-bold text-text-primary bg-transparent border-0 border-b border-transparent focus:border-primary-sage focus:outline-none px-1 py-1 rounded"
                      />
                    </td>

                    {/* Kategori */}
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={r.category}
                        onChange={(e) => handleCellChange(r.id, "category", e.target.value)}
                        placeholder="Herbal Sunnah"
                        className="w-full text-xs bg-transparent border-0 border-b border-transparent focus:border-primary-sage focus:outline-none px-1 py-1 rounded text-text-muted"
                      />
                    </td>

                    {/* Khasiat */}
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={r.benefits}
                        onChange={(e) => handleCellChange(r.id, "benefits", e.target.value)}
                        placeholder="Menurunkan kolesterol, stamina..."
                        className="w-full text-xs bg-transparent border-0 border-b border-transparent focus:border-primary-sage focus:outline-none px-1 py-1 rounded text-text-primary"
                      />
                    </td>

                    {/* Komposisi */}
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={r.composition}
                        onChange={(e) => handleCellChange(r.id, "composition", e.target.value)}
                        placeholder="Nigella sativa, madu murni..."
                        className="w-full text-xs bg-transparent border-0 border-b border-transparent focus:border-primary-sage focus:outline-none px-1 py-1 rounded text-text-muted"
                      />
                    </td>

                    {/* Aturan Pakai */}
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={r.usageRules}
                        onChange={(e) => handleCellChange(r.id, "usageRules", e.target.value)}
                        placeholder="3x2 kapsul per hari"
                        className="w-full text-xs bg-transparent border-0 border-b border-transparent focus:border-primary-sage focus:outline-none px-1 py-1 rounded text-text-muted"
                      />
                    </td>

                    {/* No BPOM */}
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={r.bpomNumber}
                        onChange={(e) => handleCellChange(r.id, "bpomNumber", e.target.value)}
                        placeholder="POM TR..."
                        className="w-full text-xs font-mono bg-transparent border-0 border-b border-transparent focus:border-primary-sage focus:outline-none px-1 py-1 rounded text-text-muted"
                      />
                    </td>

                    {/* No Halal */}
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={r.halalNumber}
                        onChange={(e) => handleCellChange(r.id, "halalNumber", e.target.value)}
                        placeholder="Halal MUI/BPJPH"
                        className="w-full text-xs font-mono bg-transparent border-0 border-b border-transparent focus:border-primary-sage focus:outline-none px-1 py-1 rounded text-text-muted"
                      />
                    </td>

                    {/* Aksi Hapus Baris */}
                    <td className="py-1 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(r.id)}
                        title="Hapus baris dari tabel"
                        className="p-1 rounded text-text-muted hover:text-status-danger hover:bg-status-danger/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </TijarahCard>
  );
};

export default KhasitTableEditor;