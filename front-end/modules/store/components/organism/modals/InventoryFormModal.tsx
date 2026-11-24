"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { TijarahSwitch } from "@/components/atom/tijarahSwitch";
import { inventorySchema, type InventoryFormData } from "../../../schemas/store.schema";
import type { StoreInventoryItem } from "../../../types/store.types";
import { storeApi, type InventoryPayload } from "../../../api/store.api";
import { mediaApi, type MediaAsset } from "@/modules/media/api/media.api";
import { formatCurrency } from "@/utils/formatters";
import { showToast } from "@/utils/toast";
import { Layers, AlertCircle, ArrowLeft, Plus, Save } from "lucide-react";
import { MediaUploader } from "@/modules/media/components/MediaUploader";

export interface IInventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StoreInventoryItem | null;
  onSubmit: (payload: InventoryPayload) => Promise<void>;
  isLoading: boolean;
  existingImageUrls?: string[];
}

export const InventoryFormModal: React.FC<IInventoryFormModalProps> = ({
  isOpen,
  onClose,
  item,
  onSubmit,
  isLoading,
  existingImageUrls = [],
}) => {
  const isEdit = !!item;
  const [isSeparable, setIsSeparable] = useState<boolean>(false);
  const [breakdownType, setBreakdownType] = useState<"SINGLE" | "MIX">("SINGLE");
  const [autoBreakdownOneStock, setAutoBreakdownOneStock] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; code: string; name: string }[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [showNewUnit, setShowNewUnit] = useState(false);

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
  const watchCategory = watch("category") || "Herbal";
  const watchUnit = watch("unit") || "Botol";

  const estimatedSachetPrice = Math.round(Number(watchRegularPrice) / (Number(watchBreakdownQty) || 1));

  useEffect(() => {
    if (!isOpen) return;
    storeApi.getProductCategories().then(setCategories).catch(() => {});
    storeApi.getProductUnits().then(setUnits).catch(() => {});
    mediaApi.listMedia({ category: "PRODUCT", type: "IMAGE" }).then(setMediaAssets).catch(() => {});
  }, [isOpen]);

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await storeApi.createProductCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, created]);
      setValue("category", created.name, { shouldValidate: true });
      setNewCategoryName("");
      setShowNewCategory(false);
      showToast.success("Kategori Ditambahkan", `Kategori "${created.name}" berhasil disimpan.`);
    } catch (err: any) {
      showToast.error("Gagal Menambah Kategori", err?.message || "Terjadi kesalahan.");
    }
  };

  const handleAddNewUnit = async () => {
    if (!newUnitName.trim()) return;
    try {
      const code = newUnitName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 16);
      const created = await storeApi.createProductUnit({ code, name: newUnitName.trim() });
      setUnits((prev) => [...prev, created]);
      setValue("unit", created.name, { shouldValidate: true });
      setNewUnitName("");
      setShowNewUnit(false);
      showToast.success("Satuan Ditambahkan", `Satuan "${created.name}" berhasil disimpan.`);
    } catch (err: any) {
      showToast.error("Gagal Menambah Satuan", err?.message || "Terjadi kesalahan.");
    }
  };

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

  const handleFormInvalid = (fieldErrors: any) => {
    const firstErr = Object.values(fieldErrors)[0] as { message?: string } | undefined;
    showToast.error(
      "Validasi Produk Gagal",
      firstErr?.message || "Mohon periksa kembali kolom wajib dan pastikan tidak ada nilai negatif."
    );
  };

  const handleFormSubmit = async (data: InventoryFormData) => {
    if (Number(data.stock) < 0 || Number(data.regularPrice) <= 0 || Number(data.agentPrice) < 0 || Number(data.points) < 0) {
      showToast.error("Nilai Tidak Valid", "Stok, harga agen, dan poin tidak boleh negatif; harga konsumen minimal Rp 1.");
      return;
    }

    if (isSeparable && autoBreakdownOneStock && Number(data.stock) < 1) {
      showToast.error("Stok Tidak Cukup", "Stok produk induk minimal 1 kemasan agar dapat langsung diecerkan.");
      return;
    }

    const finalImageUrl = (imageUrl || item?.imageUrl || "").trim();
    if (
      finalImageUrl &&
      finalImageUrl !== "/images/products/default.png" &&
      existingImageUrls.includes(finalImageUrl)
    ) {
      showToast.error(
        "Foto Produk Duplikat",
        "Gambar yang dipilih sudah digunakan oleh produk lain. Gunakan gambar berbeda atau unggah foto baru."
      );
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
      imageUrl: finalImageUrl || "/images/products/default.png",
      isSeparable: isSeparable,
      defaultBreakdownQty: isSeparable ? Number(data.defaultBreakdownQty) : null,
      allowAgentPrice: data.allowAgentPrice !== false,
      physicalStock: data.stock,
      pointStock: data.pointStock ?? data.stock,
      autoBreakdownOneStock: isSeparable && autoBreakdownOneStock,
    });
    onClose();
  };

  if (!isOpen) return null;

  const categoryOptions = Array.from(
    new Set([
      "Herbal",
      "Suplemen",
      "Kosmetik",
      "Makanan Sehat",
      ...categories.map((c) => c.name),
      watchCategory,
    ].filter(Boolean))
  );

  const unitOptions = Array.from(
    new Set([
      "Botol",
      "Pouch",
      "Box",
      "Tube",
      "Sachet",
      "Pcs",
      ...units.map((u) => u.name),
      watchUnit,
    ].filter(Boolean))
  );

  const selectableMedia = mediaAssets.filter((m) => Boolean(m.publicUrl));

  return (
    <TijarahCard tijarahVariant="default" className="p-5 sm:p-6 space-y-5 w-full">
      {/* Header Inline Form (#24) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <TijarahButton
            type="button"
            size="sm"
            tijarahVariant="outline"
            onClick={onClose}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </TijarahButton>
          <div>
            <h2 className="text-base font-bold text-text-primary">
              {isEdit ? `Edit Produk #${item.sku}` : "Tambah Produk Master Baru"}
            </h2>
            <p className="text-xs text-text-muted">
              {isEdit
                ? "Perbarui informasi inventori, harga agen, rasio eceran, dan saldo stok fisik vs poin."
                : "Daftarkan SKU baru ke dalam katalog inventori Business Center HNI."}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit, handleFormInvalid)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Kategori Dropdown (#26) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-text-primary">Kategori Produk*</label>
              <button
                type="button"
                onClick={() => setShowNewCategory((v) => !v)}
                className="text-[11px] font-semibold text-primary-sage hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> {showNewCategory ? "Tutup" : "Kategori Baru"}
              </button>
            </div>
            <TijarahSelect
              aria-label="Kategori Produk"
              selectedKey={watchCategory}
              onSelectionChange={(key) => setValue("category", String(key), { shouldValidate: true })}
            >
              {categoryOptions.map((cat) => (
                <TijarahSelect.Item key={cat} id={cat}>
                  {cat}
                </TijarahSelect.Item>
              ))}
            </TijarahSelect>
            {errors.category && (
              <p className="text-[11px] text-status-danger">{errors.category.message as string}</p>
            )}
            {showNewCategory && (
              <div className="flex items-center gap-2 pt-1">
                <TijarahInput
                  placeholder="Nama kategori baru..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="text-xs flex-1"
                />
                <TijarahButton type="button" size="sm" tijarahVariant="primary" onClick={handleAddNewCategory}>
                  Simpan
                </TijarahButton>
              </div>
            )}
          </div>

          {/* Satuan Barang Dropdown (#27) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-text-primary">Satuan Barang*</label>
              <button
                type="button"
                onClick={() => setShowNewUnit((v) => !v)}
                className="text-[11px] font-semibold text-primary-sage hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> {showNewUnit ? "Tutup" : "Satuan Baru"}
              </button>
            </div>
            <TijarahSelect
              aria-label="Satuan Barang"
              selectedKey={watchUnit}
              onSelectionChange={(key) => setValue("unit", String(key), { shouldValidate: true })}
            >
              {unitOptions.map((u) => (
                <TijarahSelect.Item key={u} id={u}>
                  {u}
                </TijarahSelect.Item>
              ))}
            </TijarahSelect>
            {errors.unit && (
              <p className="text-[11px] text-status-danger">{errors.unit.message as string}</p>
            )}
            {showNewUnit && (
              <div className="flex items-center gap-2 pt-1">
                <TijarahInput
                  placeholder="Nama satuan baru (mis. Dus / Strip)..."
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="text-xs flex-1"
                />
                <TijarahButton type="button" size="sm" tijarahVariant="primary" onClick={handleAddNewUnit}>
                  Simpan
                </TijarahButton>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <TijarahInput
              type="number"
              min={0}
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
              min={0}
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
              min={1}
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
              min={0}
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
              min={0}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-primary">
              Pilih dari Media Library (Opsional)
            </label>
            <TijarahSelect
              aria-label="Pilih dari Media Library"
              selectedKey={selectableMedia.some((m) => m.publicUrl === imageUrl) ? imageUrl : ""}
              onSelectionChange={(key) => {
                const chosen = String(key || "");
                if (!chosen) return;
                if (
                  chosen !== "/images/products/default.png" &&
                  existingImageUrls.includes(chosen)
                ) {
                  showToast.warning(
                    "Gambar Sudah Dipakai",
                    "Gambar ini sudah dipakai oleh produk lain. Sebaiknya gunakan gambar unik untuk setiap SKU."
                  );
                }
                setImageUrl(chosen);
              }}
              placeholder="Pilih gambar yang sudah diunggah..."
            >
              {selectableMedia.map((asset) => (
                <TijarahSelect.Item key={asset.id} id={asset.publicUrl || asset.id}>
                  {asset.fileName}
                </TijarahSelect.Item>
              ))}
            </TijarahSelect>
            <span className="text-[10px] text-text-muted block">
              Pilih foto dari Media Library atau unggah foto baru di bawah ini.
            </span>
          </div>
        </div>

        <MediaUploader
          category="PRODUCT"
          entityId={item?.id}
          accept="image"
          value={imageUrl}
          onChange={(url) => {
            if (url && url !== "/images/products/default.png" && existingImageUrls.includes(url)) {
              showToast.warning(
                "Gambar Sudah Dipakai",
                "Gambar ini sudah digunakan oleh produk lain."
              );
            }
            setImageUrl(url);
          }}
          label="Foto Produk (Drag & Drop)"
          helperText="Tarik & lepas gambar produk atau klik untuk unggah ke Supabase Storage"
          allowManualUrl={false}
          compact
        />

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
          <TijarahButton
            type="button"
            tijarahVariant="outline"
            size="sm"
            onClick={onClose}
            isDisabled={isLoading}
            className="text-xs font-bold px-4"
          >
            Batal
          </TijarahButton>
          <TijarahButton
            type="submit"
            tijarahVariant="primary"
            size="sm"
            isLoading={isLoading}
            className="text-xs font-bold px-5 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEdit ? "Simpan Perubahan" : "Tambah Produk"}</span>
          </TijarahButton>
        </div>
      </form>
    </TijarahCard>
  );
};

export default InventoryFormModal;
