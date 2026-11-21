"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { TijarahSwitch } from "@/components/atom/tijarahSwitch";
import { inventorySchema, type InventoryFormData } from "../../../schemas/store.schema";
import type { StoreInventoryItem } from "../../../types/store.types";
import type { InventoryPayload } from "../../../api/store.api";
import { formatCurrency } from "@/utils/formatters";
import { showToast } from "@/utils/toast";
import { Layers, Sparkles, AlertCircle } from "lucide-react";
import { MediaUploader } from "@/modules/media/components/MediaUploader";

export interface IInventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StoreInventoryItem | null;
  onSubmit: (payload: InventoryPayload) => Promise<void>;
  isLoading: boolean;
}

export const InventoryFormModal: React.FC<IInventoryFormModalProps> = ({
  isOpen,
  onClose,
  item,
  onSubmit,
  isLoading,
}) => {
  const isEdit = !!item;
  const [isSeparable, setIsSeparable] = useState<boolean>(false);
  const [breakdownType, setBreakdownType] = useState<"SINGLE" | "MIX">("SINGLE");
  const [autoBreakdownOneStock, setAutoBreakdownOneStock] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any, any, InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      sku: "",
      name: "",
      category: "Herbal",
      unit: "Botol",
      stock: 10 as any,
      safetyStock: 5 as any,
      regularPrice: 50000 as any,
      agentPrice: 40000 as any,
      points: 10 as any,
      expirationDate: "",
      description: "",
      isSeparable: false,
      defaultBreakdownQty: 20 as any,
      breakdownType: "SINGLE",
      allowAgentPrice: true,
      physicalStock: 10 as any,
      pointStock: 10 as any,
    },
  });

  const watchRegularPrice = watch("regularPrice") || 0;
  const watchBreakdownQty = watch("defaultBreakdownQty") || 20;
  const watchStock = watch("stock") || 0;

  const estimatedSachetPrice = Math.round(Number(watchRegularPrice) / (Number(watchBreakdownQty) || 1));

  useEffect(() => {
    setAutoBreakdownOneStock(false);
    if (item) {
      setImageUrl(item.imageUrl || "");
      setIsSeparable(Boolean(item.isSeparable));
      reset({
        sku: item.sku,
        name: item.name,
        category: item.category,
        unit: item.unit,
        stock: item.stock as any,
        safetyStock: item.safetyStock as any,
        regularPrice: item.regularPrice as any,
        agentPrice: item.agentPrice as any,
        points: item.points as any,
        expirationDate: item.expirationDate || "",
        description: item.description || "",
        isSeparable: Boolean(item.isSeparable),
        defaultBreakdownQty: (item.defaultBreakdownQty ?? 20) as any,
        breakdownType: "SINGLE",
        allowAgentPrice: item.allowAgentPrice !== false,
        physicalStock: (item.physicalStock ?? item.stock) as any,
        pointStock: (item.pointStock ?? item.stock) as any,
      });
    } else {
      setImageUrl("");
      setIsSeparable(false);
      reset({
        sku: "",
        name: "",
        category: "Herbal",
        unit: "Botol",
        stock: 10 as any,
        safetyStock: 5 as any,
        regularPrice: 50000 as any,
        agentPrice: 40000 as any,
        points: 10 as any,
        expirationDate: "",
        description: "",
        isSeparable: false,
        defaultBreakdownQty: 20 as any,
        breakdownType: "SINGLE",
        allowAgentPrice: true,
        physicalStock: 10 as any,
        pointStock: 10 as any,
      });
    }
  }, [item, reset, isOpen]);

  const handleToggleSeparable = (val: boolean) => {
    setIsSeparable(val);
    setValue("isSeparable", val);
    if (!val) {
      setAutoBreakdownOneStock(false);
    }
  };

  const handleFormSubmit = async (data: InventoryFormData) => {
    if (isSeparable && autoBreakdownOneStock && Number(data.stock) < 1) {
      showToast.error("Stok Tidak Cukup", "Stok produk induk minimal 1 kemasan agar dapat langsung diecerkan.");
      return;
    }

    await onSubmit({
      sku: data.sku,
      name: data.name,
      category: data.category,
      unit: data.unit,
      stock: data.stock,
      safetyStock: data.safetyStock,
      regularPrice: data.regularPrice,
      agentPrice: data.agentPrice,
      points: data.points,
      expirationDate: data.expirationDate,
      description: data.description,
      imageUrl: imageUrl || item?.imageUrl || "/images/products/default.png",
      isSeparable: isSeparable,
      defaultBreakdownQty: isSeparable ? Number(data.defaultBreakdownQty) : null,
      allowAgentPrice: data.allowAgentPrice !== false,
      physicalStock: data.physicalStock ?? data.stock,
      pointStock: data.pointStock ?? data.stock,
      autoBreakdownOneStock: isSeparable && autoBreakdownOneStock,
    });
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Produk #${item.sku}` : "Tambah Produk Master Baru"}
      description={
        isEdit
          ? "Perbarui informasi inventori, harga agen, rasio eceran, dan saldo stok fisik vs poin."
          : "Daftarkan SKU baru ke dalam katalog inventori Business Center HNI."
      }
      confirmText={isEdit ? "Simpan Perubahan" : "Tambah Produk"}
      confirmVariant="primary"
      isConfirmLoading={isLoading}
      onConfirm={handleSubmit(handleFormSubmit)}
      showCancelButton
      cancelText="Batal"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto px-0.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <TijarahInput
              label="Kode SKU Produk*"
              placeholder="Contoh: HNI-HERB-008"
              {...register("sku")}
              isInvalid={!!errors.sku}
              errorMessage={errors.sku?.message as string}
              className="text-xs font-mono font-bold"
            />
          </div>

          <div>
            <TijarahInput
              label="Nama Produk Herbal*"
              placeholder="Contoh: Spirulina 60 Kapsul"
              {...register("name")}
              isInvalid={!!errors.name}
              errorMessage={errors.name?.message as string}
              className="text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <TijarahInput
              label="Kategori Produk*"
              placeholder="Herbal / Suplemen / Kosmetik / Makanan Sehat"
              {...register("category")}
              isInvalid={!!errors.category}
              errorMessage={errors.category?.message as string}
              className="text-xs"
            />
          </div>

          <div>
            <TijarahInput
              label="Satuan Barang*"
              placeholder="Botol / Pouch / Box / Tube / Sachet"
              {...register("unit")}
              isInvalid={!!errors.unit}
              errorMessage={errors.unit?.message as string}
              className="text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <TijarahInput
              type="number"
              label="Stok Master Sistem*"
              placeholder="0"
              {...register("stock")}
              isInvalid={!!errors.stock}
              errorMessage={errors.stock?.message as string}
              className="text-xs"
            />
          </div>

          <div>
            <TijarahInput
              type="number"
              label="Stok Fisik Gudang"
              placeholder="0"
              {...register("physicalStock")}
              isInvalid={!!errors.physicalStock}
              errorMessage={errors.physicalStock?.message as string}
              className="text-xs font-semibold text-text-primary"
            />
          </div>

          <div>
            <TijarahInput
              type="number"
              label="Saldo Poin Tercatat"
              placeholder="0"
              {...register("pointStock")}
              isInvalid={!!errors.pointStock}
              errorMessage={errors.pointStock?.message as string}
              className="text-xs font-semibold text-primary-sage"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <TijarahInput
              type="number"
              label="Harga Konsumen (Rp)*"
              placeholder="85000"
              {...register("regularPrice")}
              isInvalid={!!errors.regularPrice}
              errorMessage={errors.regularPrice?.message as string}
              className="text-xs"
            />
          </div>

          <div>
            <TijarahInput
              type="number"
              label="Harga Agen HNI (Rp)*"
              placeholder="70000"
              {...register("agentPrice")}
              isInvalid={!!errors.agentPrice}
              errorMessage={errors.agentPrice?.message as string}
              className="text-xs font-bold text-primary-sage"
            />
          </div>

          <div>
            <TijarahInput
              type="number"
              label="Poin TP HNI*"
              placeholder="20"
              {...register("points")}
              isInvalid={!!errors.points}
              errorMessage={errors.points?.message as string}
              className="text-xs font-bold text-status-success"
            />
          </div>
        </div>

        {/* Seksi Fitur Eceran (PRD Bagian B) */}
        <div className="p-3 rounded-xl bg-canvas border border-border-subtle flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--badge-primary-bg)] border border-[var(--badge-primary-border)] text-primary-sage flex items-center justify-center">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">Bisa Di Ecer</p>
                <p className="text-[11px] text-text-muted">Aktifkan jika produk dapat dipecah menjadi sachet atau item satuan</p>
              </div>
            </div>
            <TijarahSwitch
              isSelected={isSeparable}
              onValueChange={handleToggleSeparable}
              aria-label="Aktifkan mode eceran produk"
            />
          </div>

          {isSeparable && (
            <div className="pt-3 border-t border-border-subtle flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <TijarahInput
                    type="number"
                    label="1 Kemasan Berisi Berapa Sachet/Pcs?*"
                    placeholder="20"
                    {...register("defaultBreakdownQty")}
                    isInvalid={!!errors.defaultBreakdownQty}
                    errorMessage={errors.defaultBreakdownQty?.message as string}
                    className="text-xs font-bold"
                  />
                  <span className="text-[10px] text-text-muted mt-1 block tabular-nums">
                    Estimasi default: {formatCurrency(estimatedSachetPrice)} / sachet
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-medium text-text-primary mb-1">
                    Tipe Eceran
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setBreakdownType("SINGLE");
                        setValue("breakdownType", "SINGLE");
                      }}
                      className={`text-xs py-1.5 px-3 rounded-lg border text-center font-semibold transition-colors ${
                        breakdownType === "SINGLE"
                          ? "bg-[var(--badge-primary-bg)] border-primary-sage text-[var(--badge-primary-text)]"
                          : "bg-surface border-border-subtle hover:bg-canvas text-text-muted"
                      }`}
                    >
                      Single Item
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBreakdownType("MIX");
                        setValue("breakdownType", "MIX");
                      }}
                      className={`text-xs py-1.5 px-3 rounded-lg border text-center font-semibold transition-colors ${
                        breakdownType === "MIX"
                          ? "bg-[var(--badge-primary-bg)] border-primary-sage text-[var(--badge-primary-text)]"
                          : "bg-surface border-border-subtle hover:bg-canvas text-text-muted"
                      }`}
                    >
                      Multi-Item Mix
                    </button>
                  </div>
                  <span className="text-[10px] text-text-muted mt-1 block">
                    {breakdownType === "SINGLE"
                      ? "Contoh: Kopi Sevel (rasio sachet identik)"
                      : "Contoh: Hibis Mix (pad siang + pad malam)"}
                  </span>
                </div>
              </div>

              {/* Trigger Langsung Ecerkan 1 Stok (Pouch) */}
              <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-surface border border-border-subtle">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-primary-sage text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      1x
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">Ecerkan 1 Kemasan Saat Disimpan</p>
                      <p className="text-[11px] text-text-muted">
                        Potong 1 stok induk dan otomatis buat varian eceran ({watchBreakdownQty || 20} sachet, 0 TP)
                      </p>
                    </div>
                  </div>
                  <TijarahSwitch
                    isSelected={autoBreakdownOneStock}
                    aria-label="Ecerkan 1 kemasan saat disimpan"
                    onValueChange={(val) => {
                      if (val && Number(watchStock) < 1) {
                        showToast.error("Stok Tidak Cukup", "Stok produk induk minimal 1 kemasan agar dapat langsung diecerkan.");
                        return;
                      }
                      setAutoBreakdownOneStock(val);
                    }}
                  />
                </div>

                {autoBreakdownOneStock && (
                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] tabular-nums">
                    <span className="text-text-muted">
                      Sisa Stok Induk: <strong className="text-text-primary">{Math.max(0, Number(watchStock) - 1)} kemasan</strong>
                    </span>
                    <span className="text-primary-sage font-semibold">
                      Stok Eceran Terbentuk: +{watchBreakdownQty || 20} sachet
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-surface border border-border-subtle text-[11px] text-text-muted">
                <AlertCircle className="w-4 h-4 text-primary-sage shrink-0 mt-0.5" />
                <span>
                  Produk pecahan otomatis disetel <strong>0 Poin TP</strong> dan hanya berlaku <strong>Harga Konsumen</strong> (non-agen). Admin tetap dapat mengubah harga jual eceran di kemudian hari.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <TijarahInput
              type="date"
              label="Tanggal Kadaluarsa (Expired Date)"
              {...register("expirationDate")}
              isInvalid={!!errors.expirationDate}
              errorMessage={errors.expirationDate?.message as string}
              className="text-xs"
            />
          </div>

          <div>
            <TijarahTextArea
              label="Deskripsi / Khasiat Singkat"
              placeholder="Sinergi herba untuk daya tahan tubuh..."
              {...register("description")}
              className="text-xs min-h-[60px]"
            />
          </div>
        </div>

        <MediaUploader
          category="PRODUCT"
          entityId={item?.id}
          accept="image"
          value={imageUrl}
          onChange={setImageUrl}
          label="Foto Produk (Drag & Drop)"
          helperText="Tarik & lepas gambar produk atau klik untuk unggah ke Supabase Storage"
          allowManualUrl
          compact
        />
      </form>
    </TijarahModal>
  );
};

export default InventoryFormModal;
