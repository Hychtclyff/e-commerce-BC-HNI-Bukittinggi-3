"use client";

import React, { useState } from "react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import type { StoreInventoryItem } from "../../../types/store.types";
import { formatCurrency } from "@/utils/formatters";
import { Layers, Plus, Trash2, AlertCircle } from "lucide-react";

export interface IBreakdownProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentProduct: StoreInventoryItem | null;
  onSubmit: (payload: {
    parentProductId: string;
    pouchQtyToBreak: number;
    breakdownType: "SINGLE" | "MIX";
    singleConfig?: {
      name?: string;
      sachetRatio: number;
      sachetPrice?: number;
    };
    mixItems?: Array<{
      name: string;
      qty: number;
      price: number;
    }>;
  }) => Promise<void>;
  isLoading: boolean;
}

export const BreakdownProductModal: React.FC<IBreakdownProductModalProps> = ({
  isOpen,
  onClose,
  parentProduct,
  onSubmit,
  isLoading,
}) => {
  const [pouchQty, setPouchQty] = useState<number>(1);
  const [breakdownType, setBreakdownType] = useState<"SINGLE" | "MIX">("SINGLE");

  // Single Item config
  const defaultRatio = parentProduct?.defaultBreakdownQty || 20;
  const [singleRatio, setSingleRatio] = useState<number>(defaultRatio);
  const defaultSinglePrice = Math.round((parentProduct?.regularPrice || 0) / defaultRatio);
  const [singlePrice, setSinglePrice] = useState<number>(defaultSinglePrice);
  const [singleName, setSingleName] = useState<string>("");

  // Mix items config
  const [mixItems, setMixItems] = useState<Array<{ name: string; qty: number; price: number }>>([
    { name: "Hibis Siang Sachet", qty: 10, price: 6000 },
    { name: "Hibis Malam Sachet", qty: 10, price: 7000 },
  ]);

  const [errorMessage, setErrorMessage] = useState<string>("");

  React.useEffect(() => {
    if (parentProduct) {
      const ratio = parentProduct.defaultBreakdownQty || 20;
      setSingleRatio(ratio);
      setSinglePrice(Math.round(parentProduct.regularPrice / ratio));
      setSingleName(`${parentProduct.name} - Eceran/Sachet`);
      setPouchQty(1);
      setErrorMessage("");
    }
  }, [parentProduct, isOpen]);

  if (!parentProduct) return null;

  const totalCapacity = (singleRatio || defaultRatio) * pouchQty;
  const totalMixUnits = mixItems.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);

  const handleAddMixItem = () => {
    setMixItems([...mixItems, { name: "", qty: 1, price: 5000 }]);
  };

  const handleRemoveMixItem = (index: number) => {
    setMixItems(mixItems.filter((_, i) => i !== index));
  };

  const handleUpdateMixItem = (index: number, field: string, val: any) => {
    const updated = [...mixItems];
    updated[index] = { ...updated[index], [field]: val };
    setMixItems(updated);
  };

  const handleConfirm = async () => {
    setErrorMessage("");
    if (pouchQty < 1) {
      setErrorMessage("Jumlah pouch yang dipecah minimal 1.");
      return;
    }
    if (pouchQty > parentProduct.stock) {
      setErrorMessage(`Stok fisik tidak mencukupi (Tersedia: ${parentProduct.stock}).`);
      return;
    }

    if (breakdownType === "SINGLE") {
      if (singleRatio <= 1) {
        setErrorMessage("Rasio sachet per pouch harus lebih dari 1.");
        return;
      }
      await onSubmit({
        parentProductId: parentProduct.id,
        pouchQtyToBreak: pouchQty,
        breakdownType: "SINGLE",
        singleConfig: {
          name: singleName.trim() || `${parentProduct.name} - Eceran/Sachet`,
          sachetRatio: singleRatio,
          sachetPrice: singlePrice,
        },
      });
      onClose();
    } else {
      if (mixItems.length === 0) {
        setErrorMessage("Daftar varian mix tidak boleh kosong.");
        return;
      }
      if (totalMixUnits !== totalCapacity) {
        setErrorMessage(
          `Total kuantitas eceran (${totalMixUnits}) tidak cocok dengan kapasitas produk induk (${totalCapacity}). Silakan periksa kembali rincian pecahan.`
        );
        return;
      }
      await onSubmit({
        parentProductId: parentProduct.id,
        pouchQtyToBreak: pouchQty,
        breakdownType: "MIX",
        mixItems,
      });
      onClose();
    }
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title="Pecah Produk / Jual Per Sachet"
      description={`Konversi kemasan induk "${parentProduct.name}" menjadi produk eceran satuan tanpa poin.`}
      confirmText="Eksekusi Pecah Produk"
      confirmVariant="primary"
      isConfirmLoading={isLoading}
      onConfirm={handleConfirm}
      showCancelButton
      cancelText="Batal"
      maxWidth="lg"
    >
      <div className="space-y-4 pt-1 text-xs">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Info Induk */}
        <div className="p-3 rounded-xl bg-canvas border border-border-subtle flex items-center justify-between">
          <div>
            <p className="font-semibold text-text-primary">{parentProduct.name}</p>
            <p className="text-[11px] text-text-muted">
              SKU: <span className="font-mono">{parentProduct.sku}</span> | Stok Fisik: <strong className="text-primary-sage">{parentProduct.stock} {parentProduct.unit}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-text-muted block">Harga Non-Agen</span>
            <span className="font-mono font-semibold text-text-primary tabular-nums">{formatCurrency(parentProduct.regularPrice)}</span>
          </div>
        </div>

        {/* Input Jumlah Pouch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <TijarahInput
              type="number"
              label="Jumlah Pouch yang Dipecah*"
              value={pouchQty.toString()}
              onChange={(e) => setPouchQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="text-xs font-bold"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-text-primary mb-1">Tipe Eceran</span>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => setBreakdownType("SINGLE")}
                className={`text-xs py-1.5 px-2 rounded-lg border text-center font-semibold transition-colors ${
                  breakdownType === "SINGLE"
                    ? "bg-[var(--badge-primary-bg)] border-primary-sage text-[var(--badge-primary-text)]"
                    : "bg-surface border-border-subtle hover:bg-canvas text-text-muted"
                }`}
              >
                Single Item
              </button>
              <button
                type="button"
                onClick={() => setBreakdownType("MIX")}
                className={`text-xs py-1.5 px-2 rounded-lg border text-center font-semibold transition-colors ${
                  breakdownType === "MIX"
                    ? "bg-[var(--badge-primary-bg)] border-primary-sage text-[var(--badge-primary-text)]"
                    : "bg-surface border-border-subtle hover:bg-canvas text-text-muted"
                }`}
              >
                Multi-Item Mix
              </button>
            </div>
          </div>
        </div>

        {breakdownType === "SINGLE" ? (
          <div className="space-y-3 p-3 rounded-xl bg-surface border border-border-subtle">
            <p className="font-semibold text-text-primary flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary-sage" />
              Konfigurasi Eceran Single Item
            </p>

            <TijarahInput
              label="Nama Produk Eceran Baru"
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              className="text-xs"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TijarahInput
                type="number"
                label="Rasio Sachet Per Pouch*"
                value={singleRatio.toString()}
                onChange={(e) => {
                  const r = Math.max(1, parseInt(e.target.value) || 1);
                  setSingleRatio(r);
                  setSinglePrice(Math.round(parentProduct.regularPrice / r));
                }}
                className="text-xs font-bold"
              />

              <TijarahInput
                type="number"
                label="Harga Jual Eceran Per Sachet (Rp)*"
                value={singlePrice.toString()}
                onChange={(e) => setSinglePrice(parseInt(e.target.value) || 0)}
                className="text-xs font-bold text-primary-sage"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-canvas text-[11px] text-text-muted border border-border-subtle flex justify-between items-center">
              <span>Total stok sachet baru yang ditambahkan:</span>
              <strong className="text-text-primary font-mono text-xs tabular-nums">+{pouchQty * singleRatio} Sachet</strong>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-3 rounded-xl bg-surface border border-border-subtle">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-text-primary flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary-sage" />
                Varian Campuran Hasil Eceran
              </p>
              <TijarahButton
                type="button"
                tijarahVariant="secondary"
                size="sm"
                onClick={handleAddMixItem}
                className="text-[11px] h-7 px-2"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah Baris</span>
              </TijarahButton>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {mixItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-canvas p-2 rounded-lg border border-border-subtle">
                  <div className="flex-1">
                    <input
                      type="text"
                      aria-label={`Nama varian ${idx + 1}`}
                      placeholder="Nama Varian (misal: Hibis Siang)"
                      value={item.name}
                      onChange={(e) => handleUpdateMixItem(idx, "name", e.target.value)}
                      className="w-full text-xs bg-transparent border-0 focus:outline-none text-text-primary font-medium"
                    />
                  </div>
                  <div className="w-16">
                    <input
                      type="number"
                      aria-label={`Kuantitas varian ${idx + 1}`}
                      placeholder="Qty"
                      value={item.qty.toString()}
                      onChange={(e) => handleUpdateMixItem(idx, "qty", parseInt(e.target.value) || 0)}
                      className="w-full text-xs bg-surface border border-border-subtle rounded-md px-2 py-1 text-center font-semibold tabular-nums"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      aria-label={`Harga varian ${idx + 1}`}
                      placeholder="Harga"
                      value={item.price.toString()}
                      onChange={(e) => handleUpdateMixItem(idx, "price", parseInt(e.target.value) || 0)}
                      className="w-full text-xs bg-surface border border-border-subtle rounded-md px-2 py-1 text-right font-semibold text-primary-sage tabular-nums"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Hapus varian ${idx + 1}`}
                    onClick={() => handleRemoveMixItem(idx)}
                    className="p-1 text-status-danger hover:bg-[var(--badge-danger-bg)] rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-canvas border border-border-subtle text-[11px] tabular-nums">
              <span>Kapasitas Induk: <strong>{totalCapacity} Pcs</strong></span>
              <span>
                Total Rincian:{" "}
                <strong className={totalMixUnits === totalCapacity ? "text-primary-sage" : "text-status-danger"}>
                  {totalMixUnits} Pcs
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </TijarahModal>
  );
};

export default BreakdownProductModal;