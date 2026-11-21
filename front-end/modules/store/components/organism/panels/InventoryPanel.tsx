"use client";

import React, { useState, useMemo } from "react";
import type { StoreInventoryItem, StoreNonHniProduct } from "../../../types/store.types";
import type { InventoryPayload, NonHniProductPayload } from "../../../api/store.api";
import { InventoryStockBadge } from "../../molecules/InventoryStockBadge";
import { InventoryFormModal } from "../modals/InventoryFormModal";
import { NonHniProductFormModal } from "../modals/NonHniProductFormModal";
import { DeleteConfirmModal } from "../modals/DeleteConfirmModal";
import { InventoryImportModal } from "../modals/InventoryImportModal";
import { BreakdownProductModal } from "../modals/BreakdownProductModal";
import { storeApi } from "@/modules/store/api/store.api";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { TijarahTabs, TijarahTabList, TijarahTab } from "@/components/atom/tijarahTabs";
import { formatCurrency } from "@/utils/formatters";
import { showToast } from "@/utils/toast";
import {
  Search,
  Boxes,
  Plus,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Calendar,
  Download,
  Upload,
  Layers,
  ArrowRightLeft,
  Check,
  X,
  Package,
} from "lucide-react";
import { useTranslations } from "next-intl";

export interface IInventoryPanelProps {
  inventory: StoreInventoryItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateItem?: (payload: InventoryPayload) => Promise<any>;
  onUpdateItem?: (params: { id: string; payload: InventoryPayload }) => Promise<any>;
  onDeleteItem?: (id: string) => Promise<any>;
  isSaving?: boolean;
  isDeleting?: boolean;
  nonHniProducts?: StoreNonHniProduct[];
  isNonHniLoading?: boolean;
  onCreateNonHniProduct?: (payload: NonHniProductPayload) => Promise<any>;
  onUpdateNonHniProduct?: (params: { id: string; payload: NonHniProductPayload }) => Promise<any>;
  onDeleteNonHniProduct?: (id: string) => Promise<any>;
  isSavingNonHni?: boolean;
  isDeletingNonHni?: boolean;
}

export const InventoryPanel: React.FC<IInventoryPanelProps> = ({
  inventory,
  isLoading,
  onRefresh,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  isSaving = false,
  isDeleting = false,
  nonHniProducts = [],
  isNonHniLoading = false,
  onCreateNonHniProduct,
  onUpdateNonHniProduct,
  onDeleteNonHniProduct,
  isSavingNonHni = false,
  isDeletingNonHni = false,
}) => {
  const t = useTranslations("storeErp.inventory");
  const tNonHni = useTranslations("storeErp.nonHni");
  const [catalogTab, setCatalogTab] = useState<"HNI" | "NON_HNI">("HNI");
  const [nonHniSearch, setNonHniSearch] = useState("");
  const [isNonHniFormOpen, setIsNonHniFormOpen] = useState(false);
  const [selectedNonHniForEdit, setSelectedNonHniForEdit] = useState<StoreNonHniProduct | null>(null);
  const [selectedNonHniForDelete, setSelectedNonHniForDelete] = useState<StoreNonHniProduct | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "LOW" | "OUT" | "MISMATCH">("ALL");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<StoreInventoryItem | null>(null);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<StoreInventoryItem | null>(null);
  const [selectedItemForBreakdown, setSelectedItemForBreakdown] = useState<StoreInventoryItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBreakdownLoading, setIsBreakdownLoading] = useState(false);
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  const handleExportCsv = () => {
    try {
      const url = storeApi.exportInventoryCsvUrl();
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = `Stok-Inventory-BC3-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast.success("Export Berhasil", "Data inventaris produk berhasil diunduh.");
    } catch {
      const headers = "SKU,Nama Produk,Kategori,Harga,Stok,Satuan,Status\n";
      const rows = inventory
        .map(
          (item) =>
            `"${item.sku}","${item.name}","${item.category}",${item.regularPrice},${item.stock},"${item.unit}","${item.status}"`
        )
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Stok-Inventory-BC3-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(blobUrl);
      showToast.success("Export Berhasil", "Data inventaris produk berhasil diunduh.");
    }
  };

  const categories = useMemo(() => {
    const unique = Array.from(new Set(inventory.map((i) => i.category).filter(Boolean)));
    return unique.sort();
  }, [inventory]);

  const stats = useMemo(() => {
    let low = 0;
    let out = 0;
    let mismatch = 0;
    let totalPhysicalUnits = 0;

    for (const item of inventory) {
      if (item.status === "LOW_STOCK" || (item.stock > 0 && item.stock < 10)) low++;
      if (item.status === "OUT_OF_STOCK" || item.stock <= 0) out++;
      const p = item.stock ?? item.physicalStock ?? 0;
      const pt = item.pointStock ?? item.stock ?? 0;
      if (p !== pt) mismatch++;
      totalPhysicalUnits += p;
    }

    return {
      totalSku: inventory.length,
      low,
      out,
      mismatch,
      totalPhysicalUnits,
    };
  }, [inventory]);

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      if (stockFilter === "LOW" && item.status !== "LOW_STOCK" && !(item.stock > 0 && item.stock < 10)) {
        return false;
      }
      if (stockFilter === "OUT" && item.status !== "OUT_OF_STOCK" && item.stock > 0) {
        return false;
      }
      if (stockFilter === "MISMATCH") {
        const p = item.stock ?? item.physicalStock ?? 0;
        const pt = item.pointStock ?? item.stock ?? 0;
        if (p === pt) return false;
      }

      if (categoryFilter !== "ALL" && item.category !== categoryFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = item.name.toLowerCase().includes(term);
        const matchSku = item.sku.toLowerCase().includes(term);
        const matchCategory = item.category.toLowerCase().includes(term);
        return matchName || matchSku || matchCategory;
      }

      return true;
    });
  }, [inventory, stockFilter, categoryFilter, searchTerm]);

  const handleOpenCreate = () => {
    setSelectedItemForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: StoreInventoryItem) => {
    setSelectedItemForEdit(item);
    setIsFormOpen(true);
  };

  const handleOpenBreakdown = (item: StoreInventoryItem) => {
    setSelectedItemForBreakdown(item);
  };

  const handleExecuteBreakdown = async (payload: any) => {
    try {
      setIsBreakdownLoading(true);
      const res = await storeApi.breakdownProduct(payload);
      showToast.success("Pecah Produk Berhasil", res.message);
      onRefresh();
    } catch (e: any) {
      showToast.error("Gagal Memecah Produk", e?.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsBreakdownLoading(false);
    }
  };

  const handleQuickReconcile = async (item: StoreInventoryItem) => {
    try {
      setReconcilingId(item.id);
      const res = await storeApi.reconcileProductPoints({
        productId: item.id,
        action: "SYNC_TO_PHYSICAL",
      });
      showToast.success("Sinkronisasi Poin Berhasil", res.message);
      onRefresh();
    } catch (e: any) {
      showToast.error("Gagal Sinkronisasi Poin", e?.message || "Terjadi kesalahan.");
    } finally {
      setReconcilingId(null);
    }
  };

  const handleSubmitForm = async (payload: InventoryPayload) => {
    if (selectedItemForEdit && onUpdateItem) {
      await onUpdateItem({ id: selectedItemForEdit.id, payload });
    } else if (onCreateItem) {
      await onCreateItem(payload);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedItemForDelete || !onDeleteItem) return;
    await onDeleteItem(selectedItemForDelete.id);
    setSelectedItemForDelete(null);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setStockFilter("ALL");
  };

  const filteredNonHni = useMemo(() => {
    const q = nonHniSearch.trim().toLowerCase();
    if (!q) return nonHniProducts;
    return nonHniProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [nonHniProducts, nonHniSearch]);

  const nonHniTotalUnits = useMemo(
    () => nonHniProducts.reduce((sum, p) => sum + Number(p.stock ?? 0), 0),
    [nonHniProducts]
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 1. Shared Unified Header & Tab Bar (Identical Rhythm for HNI & Non-HNI) */}
      <TijarahCard tijarahVariant="default" className="px-4 py-3.5 space-y-3">
        {/* Top Row: Title & Context-Aware Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-text-primary tracking-tight">
                {catalogTab === "HNI" ? t("title") : tNonHni("title")}
              </h2>
              <TijarahBadge tijarahVariant="primary" className="tabular-nums font-semibold">
                {catalogTab === "HNI"
                  ? `${stats.totalSku} SKU • ${stats.totalPhysicalUnits} Unit Fisik`
                  : `${nonHniProducts.length} SKU • ${nonHniTotalUnits} Unit`}
              </TijarahBadge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {catalogTab === "HNI" ? t("subtitle") : tNonHni("subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {catalogTab === "HNI" && (
              <>
                <TijarahButton
                  type="button"
                  tijarahVariant="secondary"
                  size="sm"
                  onClick={handleExportCsv}
                  className="text-xs px-2.5 h-8 font-medium"
                  title="Download seluruh data stok produk master dalam format CSV"
                >
                  <Download className="w-3.5 h-3.5 text-text-muted" />
                  <span>Export CSV</span>
                </TijarahButton>

                <TijarahButton
                  type="button"
                  tijarahVariant="secondary"
                  size="sm"
                  onClick={() => setIsImportModalOpen(true)}
                  className="text-xs px-2.5 h-8 font-medium"
                  title="Upload file CSV untuk memperbarui stok produk secara massal"
                >
                  <Upload className="w-3.5 h-3.5 text-text-muted" />
                  <span>Import CSV</span>
                </TijarahButton>
              </>
            )}

            <TijarahButton
              type="button"
              tijarahVariant="secondary"
              size="sm"
              onClick={onRefresh}
              isLoading={catalogTab === "HNI" ? isLoading : isNonHniLoading}
              className="text-xs px-2.5 h-8 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Segarkan</span>
            </TijarahButton>

            <TijarahButton
              type="button"
              tijarahVariant="primary"
              size="sm"
              onClick={
                catalogTab === "HNI"
                  ? handleOpenCreate
                  : () => {
                      setSelectedNonHniForEdit(null);
                      setIsNonHniFormOpen(true);
                    }
              }
              className="text-xs px-3 h-8 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{catalogTab === "HNI" ? t("addProduct") : tNonHni("addBtn")}</span>
            </TijarahButton>
          </div>
        </div>

        {/* Bottom Row: Fixed-Position Segmented Tab Bar */}
        <div className="pt-2.5 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
          <TijarahTabs
            selectedKey={catalogTab}
            onSelectionChange={(k) => setCatalogTab(String(k) as "HNI" | "NON_HNI")}
            variant="segmented"
            className="w-auto"
          >
            <TijarahTabList variant="segmented">
              <TijarahTab id="HNI">
                {tNonHni("tabHniStock")} ({inventory.length})
              </TijarahTab>
              <TijarahTab id="NON_HNI">
                {tNonHni("tabNonHni")} ({nonHniProducts.length})
              </TijarahTab>
            </TijarahTabList>
          </TijarahTabs>
        </div>
      </TijarahCard>

      {catalogTab === "NON_HNI" ? (
        <>
          <TijarahCard tijarahVariant="default" className="overflow-hidden">
            <div className="px-4 py-2.5 bg-canvas/60 border-b border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="w-full sm:w-72">
                <TijarahInput
                  value={nonHniSearch}
                  onChange={(e) => setNonHniSearch(e.target.value)}
                  placeholder={tNonHni("searchPlaceholder")}
                  startContent={<Search className="w-3.5 h-3.5 text-text-muted" />}
                  className="text-xs h-8"
                />
              </div>
            </div>

            {filteredNonHni.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center gap-2">
                <Package className="w-6 h-6 text-text-muted" />
                <p className="text-sm font-semibold text-text-primary">{tNonHni("emptyTitle")}</p>
                <p className="text-xs text-text-muted max-w-md">{tNonHni("emptyDesc")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-canvas/80 border-b border-border-subtle text-text-muted uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-2.5 px-4">{tNonHni("colName")}</th>
                      <th className="py-2.5 px-4">{tNonHni("colCategory")}</th>
                      <th className="py-2.5 px-4 text-right">{tNonHni("colPrice")}</th>
                      <th className="py-2.5 px-4 text-right">{tNonHni("colStock")}</th>
                      <th className="py-2.5 px-4">{tNonHni("colSpec")}</th>
                      <th className="py-2.5 px-4 text-right">{tNonHni("colActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredNonHni.map((prod) => (
                      <tr key={prod.id} className="hover:bg-canvas/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-text-primary">{prod.name}</td>
                        <td className="py-3 px-4">
                          <TijarahBadge tijarahVariant="secondary" className="text-[10px]">
                            {prod.category}
                          </TijarahBadge>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-primary-sage tabular-nums">
                          {formatCurrency(prod.price)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                          {prod.stock ?? 0}
                        </td>
                        <td className="py-3 px-4 text-text-muted">
                          {[prod.weight ? `${prod.weight}g` : null, prod.dimensions].filter(Boolean).join(" · ") || "-"}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <TijarahButton
                              type="button"
                              heroVariant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedNonHniForEdit(prod);
                                setIsNonHniFormOpen(true);
                              }}
                              className="text-xs px-2 h-7 font-medium text-primary-sage inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>{tNonHni("edit")}</span>
                            </TijarahButton>
                            <TijarahButton
                              type="button"
                              heroVariant="ghost"
                              size="sm"
                              onClick={() => setSelectedNonHniForDelete(prod)}
                              className="text-xs px-2 h-7 font-medium text-status-danger hover:bg-status-danger/10 inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{tNonHni("delete")}</span>
                            </TijarahButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TijarahCard>

          <NonHniProductFormModal
            isOpen={isNonHniFormOpen}
            onClose={() => setIsNonHniFormOpen(false)}
            product={selectedNonHniForEdit}
            onSubmit={async (payload) => {
              if (selectedNonHniForEdit && onUpdateNonHniProduct) {
                await onUpdateNonHniProduct({ id: selectedNonHniForEdit.id, payload });
              } else if (onCreateNonHniProduct) {
                await onCreateNonHniProduct(payload);
              }
            }}
            isLoading={isSavingNonHni}
          />

          <DeleteConfirmModal
            isOpen={!!selectedNonHniForDelete}
            onClose={() => setSelectedNonHniForDelete(null)}
            onConfirm={async () => {
              if (!selectedNonHniForDelete || !onDeleteNonHniProduct) return;
              await onDeleteNonHniProduct(selectedNonHniForDelete.id);
              setSelectedNonHniForDelete(null);
            }}
            title={tNonHni("deleteTitle")}
            itemName={selectedNonHniForDelete?.name || ""}
            isLoading={isDeletingNonHni}
          />
        </>
      ) : (
        <>

      {/* 2. High-Density Data Table Container (HeroUI TijarahCard) */}
      <TijarahCard
        tijarahVariant="default"
        className="overflow-hidden"
      >
        {/* Integrated Filter & Search Control Bar */}
        <div className="px-3.5 py-2.5 bg-canvas/60 border-b border-border-subtle flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Left: Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <div className="w-full sm:w-72">
              <TijarahInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                startContent={<Search className="w-3.5 h-3.5 text-text-muted" />}
                endContent={
                  searchTerm ? (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      aria-label="Hapus pencarian"
                      className="text-text-muted hover:text-text-primary"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : undefined
                }
                className="w-full text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <TijarahSelect
                aria-label="Filter Kategori"
                selectedKey={categoryFilter}
                onSelectionChange={(key) => setCategoryFilter(String(key))}
                className="h-8 text-xs"
              >
                {[
                  <TijarahSelect.Item key="ALL" id="ALL" textValue={`Semua Kategori (${categories.length})`}>
                    Semua Kategori ({categories.length})
                  </TijarahSelect.Item>,
                  ...categories.map((cat) => (
                    <TijarahSelect.Item key={cat} id={cat} textValue={cat}>
                      {cat}
                    </TijarahSelect.Item>
                  )),
                ]}
              </TijarahSelect>
            </div>
          </div>

          {/* Right: Segmented Status Filter (HeroUI TijarahTabs) */}
          <div className="flex items-center overflow-x-auto">
            <TijarahTabs
              selectedKey={stockFilter}
              onSelectionChange={(key) =>
                setStockFilter(key as "ALL" | "LOW" | "OUT" | "MISMATCH")
              }
              variant="segmented"
              className="w-auto"
            >
              <TijarahTabList variant="segmented">
                <TijarahTab
                  id="ALL"
                  badge={
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-canvas border border-border-subtle text-text-muted tabular-nums">
                      {stats.totalSku}
                    </span>
                  }
                >
                  Semua
                </TijarahTab>
                <TijarahTab
                  id="LOW"
                  icon={<AlertTriangle className="w-3 h-3 text-status-warning" />}
                  badge={
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[var(--badge-warning-bg)] text-status-warning font-semibold tabular-nums">
                      {stats.low}
                    </span>
                  }
                >
                  Menipis
                </TijarahTab>
                <TijarahTab
                  id="OUT"
                  badge={
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[var(--badge-danger-bg)] text-status-danger font-semibold tabular-nums">
                      {stats.out}
                    </span>
                  }
                >
                  Habis
                </TijarahTab>
                <TijarahTab
                  id="MISMATCH"
                  icon={<ArrowRightLeft className="w-3 h-3 text-status-danger" />}
                  badge={
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[var(--badge-danger-bg)] text-status-danger font-semibold tabular-nums">
                      {stats.mismatch}
                    </span>
                  }
                >
                  Selisih Poin & Stok
                </TijarahTab>
              </TijarahTabList>
            </TijarahTabs>
          </div>
        </div>

        {/* Table Content Area */}
        {isLoading && inventory.length === 0 ? (
          <div className="p-6 space-y-2.5" role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-sage" />
              <span>{t("loading")}</span>
            </div>
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-9 w-full rounded-lg bg-canvas animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-canvas border border-border-subtle flex items-center justify-center text-text-muted">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs sm:text-sm text-text-primary">
                {searchTerm || categoryFilter !== "ALL" || stockFilter !== "ALL"
                  ? "Tidak Ada SKU yang Sesuai Filter"
                  : "Katalog Inventori Gudang Masih Kosong"}
              </p>
              <p className="text-xs text-text-muted mt-0.5 max-w-md">
                {searchTerm || categoryFilter !== "ALL" || stockFilter !== "ALL"
                  ? `Tidak ditemukan barang untuk kriteria pencarian "${searchTerm || stockFilter}".`
                  : "Tambahkan produk master HNI baru atau unggah file CSV untuk mengisi stok awal gudang."}
              </p>
            </div>
            {searchTerm || categoryFilter !== "ALL" || stockFilter !== "ALL" ? (
              <TijarahButton
                type="button"
                tijarahVariant="secondary"
                size="sm"
                onClick={handleResetFilters}
                className="mt-1 text-xs h-8 px-3"
              >
                Reset Filter Pencarian
              </TijarahButton>
            ) : (
              <TijarahButton
                type="button"
                tijarahVariant="primary"
                size="sm"
                onClick={handleOpenCreate}
                className="mt-1 text-xs h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("addProduct")}</span>
              </TijarahButton>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {stockFilter === "MISMATCH" ? (
              /* Tabel Khusus Tab Selisih Poin & Stok */
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-canvas/80 text-text-muted uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Nama Produk & Kategori</th>
                    <th className="py-2.5 px-3 text-right">Stok Fisik</th>
                    <th className="py-2.5 px-3 text-right">Poin Tercatat</th>
                    <th className="py-2.5 px-3 text-right">Selisih</th>
                    <th className="py-2.5 px-3">Indikasi Operasional</th>
                    <th className="py-2.5 px-3 text-right">Aksi Rekonsiliasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredItems.map((item) => {
                    const physical = item.stock ?? item.physicalStock ?? 0;
                    const points = item.pointStock ?? item.stock ?? 0;
                    const diff = points - physical;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-canvas/60 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono font-semibold text-text-primary whitespace-nowrap tabular-nums">
                          {item.sku}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary">
                              {item.name}
                            </span>
                            <TijarahBadge tijarahVariant="secondary" className="text-[10px]">
                              {item.category}
                            </TijarahBadge>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <TijarahBadge tijarahVariant="secondary" className="tabular-nums font-semibold">
                            {physical} {item.unit}
                          </TijarahBadge>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <TijarahBadge tijarahVariant="primary" className="tabular-nums font-semibold">
                            {points} Unit
                          </TijarahBadge>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <TijarahBadge tijarahVariant="danger" className="tabular-nums font-semibold">
                            {diff > 0 ? `+${diff} Poin Tertahan` : `${diff} Unit`}
                          </TijarahBadge>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {diff > 0 ? (
                              <TijarahBadge tijarahVariant="warning">
                                Pending Input HSIS / Pemakaian Internal
                              </TijarahBadge>
                            ) : (
                              <TijarahBadge tijarahVariant="secondary">
                                Stok Fisik Melebihi Saldo Poin
                              </TijarahBadge>
                            )}
                            {item.isSeparable && (
                              <TijarahBadge tijarahVariant="primary">
                                Item Eceran
                              </TijarahBadge>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <TijarahButton
                              type="button"
                              tijarahVariant="primary"
                              size="sm"
                              onClick={() => handleQuickReconcile(item)}
                              isLoading={reconcilingId === item.id}
                              className="text-[11px] px-2.5 h-7 font-semibold"
                              title="Menyesuaikan saldo poin lokal agar seimbang dengan stok fisik riil"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Samakan Poin</span>
                            </TijarahButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* Tabel Utama Inventori (Data-Dense 12-15+ Baris per Layar) */
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-canvas/80 text-text-muted uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-3">{t("sku")}</th>
                    <th className="py-2.5 px-3">{t("productName")}</th>
                    <th className="py-2.5 px-3">{t("category")}</th>
                    <th className="py-2.5 px-3 text-right">{t("regularPrice")}</th>
                    <th className="py-2.5 px-3 text-right">{t("agentPrice")}</th>
                    <th className="py-2.5 px-3 text-right">{t("points")}</th>
                    <th className="py-2.5 px-3 text-center">Fisik / Poin</th>
                    <th className="py-2.5 px-3 text-center">{t("stock")}</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredItems.map((item) => {
                    const physical = item.stock ?? item.physicalStock ?? 0;
                    const pointStk = item.pointStock ?? item.stock ?? 0;
                    const hasDiscrepancy = physical !== pointStk;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-canvas/60 transition-colors"
                      >
                        {/* SKU Code */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-text-primary tabular-nums">
                              {item.sku}
                            </span>
                            {item.isFraction && (
                              <TijarahBadge tijarahVariant="primary" className="text-[10px] px-1.5 py-0.2">
                                Eceran
                              </TijarahBadge>
                            )}
                          </div>
                          {item.expirationDate && (
                            <span className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5 tabular-nums">
                              <Calendar className="w-2.5 h-2.5 shrink-0" />
                              Exp: {item.expirationDate}
                            </span>
                          )}
                        </td>

                        {/* Nama Produk */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="font-semibold text-text-primary">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-text-muted">
                              ({item.unit}
                              {item.isSeparable && item.defaultBreakdownQty
                                ? ` • 1:${item.defaultBreakdownQty}`
                                : ""}
                              )
                            </span>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <TijarahBadge tijarahVariant="secondary">
                            {item.category}
                          </TijarahBadge>
                        </td>

                        {/* Harga Konsumen */}
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-text-primary whitespace-nowrap tabular-nums">
                          {formatCurrency(item.regularPrice)}
                        </td>

                        {/* Harga Agen HNI */}
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-primary-sage whitespace-nowrap tabular-nums">
                          {item.allowAgentPrice !== false ? (
                            formatCurrency(item.agentPrice)
                          ) : (
                            <span className="font-sans text-text-muted font-normal text-[11px]">
                              Non-Agen
                            </span>
                          )}
                        </td>

                        {/* Poin TP */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">
                          <TijarahBadge tijarahVariant="primary" className="font-mono font-semibold">
                            {item.points} TP
                          </TijarahBadge>
                        </td>

                        {/* Fisik vs Poin */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap tabular-nums">
                          <TijarahBadge
                            tijarahVariant={hasDiscrepancy ? "warning" : "secondary"}
                            className="font-mono gap-1"
                            title="Stok Fisik Gudang / Saldo Poin Tercatat"
                          >
                            <span>F:{physical}</span>
                            <span className="opacity-40">|</span>
                            <span>P:{pointStk}</span>
                          </TijarahBadge>
                        </td>

                        {/* Status & Sisa Stok */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <InventoryStockBadge stock={item.stock} />
                        </td>

                        {/* Aksi CRUD & Pecah Eceran */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {item.isSeparable && !item.isFraction && (
                              <TijarahButton
                                type="button"
                                tijarahVariant="warning"
                                size="sm"
                                onClick={() => handleOpenBreakdown(item)}
                                className="text-[11px] px-2 h-7 font-medium"
                                title="Pecah kemasan induk menjadi sachet eceran"
                              >
                                <Layers className="w-3 h-3" />
                                <span>Ecer</span>
                              </TijarahButton>
                            )}

                            <TijarahButton
                              type="button"
                              tijarahVariant="secondary"
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              className="text-[11px] px-2 h-7 font-medium"
                              title={`Edit ${item.name}`}
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </TijarahButton>

                            <TijarahButton
                              type="button"
                              tijarahVariant="ghost"
                              size="sm"
                              onClick={() => setSelectedItemForDelete(item)}
                              className="text-[11px] px-2 h-7 font-medium text-status-danger hover:bg-[var(--badge-danger-bg)]"
                              title={`Hapus ${item.name}`}
                              aria-label={`Hapus ${item.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </TijarahButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Compact Table Footer */}
        <div className="px-3.5 py-2 bg-canvas/60 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-text-muted">
          <span>
            Menampilkan <strong className="text-text-primary tabular-nums">{filteredItems.length}</strong> dari{" "}
            <strong className="text-text-primary tabular-nums">{inventory.length}</strong> SKU terdaftar
          </span>
          <div className="flex items-center gap-3 tabular-nums">
            <span>Aman: {stats.totalSku - stats.low - stats.out}</span>
            <span>•</span>
            <span>Menipis: {stats.low}</span>
            <span>•</span>
            <span>Habis: {stats.out}</span>
          </div>
        </div>
      </TijarahCard>

      {/* Modal Breakdown Sachet */}
      <BreakdownProductModal
        isOpen={!!selectedItemForBreakdown}
        onClose={() => setSelectedItemForBreakdown(null)}
        parentProduct={selectedItemForBreakdown}
        onSubmit={handleExecuteBreakdown}
        isLoading={isBreakdownLoading}
      />

      {/* Modal Form Tambah / Edit Produk */}
      <InventoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        item={selectedItemForEdit}
        onSubmit={handleSubmitForm}
        isLoading={isSaving}
      />

      {/* Modal Konfirmasi Hapus Produk */}
      <DeleteConfirmModal
        isOpen={!!selectedItemForDelete}
        onClose={() => setSelectedItemForDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Produk Master"
        itemName={selectedItemForDelete?.name || "Produk"}
        isLoading={isDeleting}
      />

      {/* Modal Import Stok Massal */}
      <InventoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={onRefresh}
      />
        </>
      )}
    </div>
  );
};

export default InventoryPanel;
