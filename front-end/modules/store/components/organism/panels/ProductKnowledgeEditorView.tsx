"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { TijarahGoogleDocEditor } from "@/components/rich-editor/TijarahGoogleDocEditor";
import {
  productKnowledgeSchema,
  type ProductKnowledgeFormData,
} from "../../../schemas/store.schema";
import type { StoreProductKnowledge } from "../../../types/store.types";
import type { ProductKnowledgePayload } from "../../../api/store.api";
import {
  ArrowLeft,
  Save,
  BookOpen,
  Sparkles,
  ImageIcon,
  ShieldCheck,
  Award,
  Layers,
  AlertTriangle,
  FileText,
} from "lucide-react";

export interface ProductKnowledgeEditorViewProps {
  knowledge: StoreProductKnowledge | null;
  onBack: () => void;
  onSubmit: (payload: ProductKnowledgePayload) => Promise<void>;
  isLoading?: boolean;
}

export const ProductKnowledgeEditorView: React.FC<ProductKnowledgeEditorViewProps> = ({
  knowledge,
  onBack,
  onSubmit,
  isLoading = false,
}) => {
  const isEdit = !!knowledge;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any, any, ProductKnowledgeFormData>({
    resolver: zodResolver(productKnowledgeSchema),
    defaultValues: {
      sku: "",
      name: "",
      category: "Herbal",
      bpomNumber: "POM TR ",
      halalNumber: "LPPOM MUI ",
      benefits: "" as any,
      composition: "" as any,
      usageRules: "",
      contraindications: "",
      imageUrl: "",
    },
  });

  const watchedImageUrl = watch("imageUrl");
  const watchedName = watch("name");
  const watchedSku = watch("sku");
  const watchedBenefits = watch("benefits") || "";

  useEffect(() => {
    if (knowledge) {
      reset({
        sku: knowledge.sku,
        name: knowledge.name,
        category: knowledge.category,
        bpomNumber: knowledge.bpomNumber,
        halalNumber: knowledge.halalNumber,
        benefits: knowledge.benefits.join("\n") as any,
        composition: knowledge.composition.join("\n") as any,
        usageRules: knowledge.usageRules,
        contraindications: knowledge.contraindications || "",
        imageUrl: knowledge.imageUrl || "",
      });
    } else {
      reset({
        sku: "",
        name: "",
        category: "Herbal",
        bpomNumber: "POM TR ",
        halalNumber: "LPPOM MUI ",
        benefits: "" as any,
        composition: "" as any,
        usageRules: "",
        contraindications: "",
        imageUrl: "",
      });
    }
  }, [knowledge, reset]);

  const handleFormSubmit = async (data: ProductKnowledgeFormData) => {
    await onSubmit({
      sku: data.sku,
      name: data.name,
      category: data.category,
      bpomNumber: data.bpomNumber,
      halalNumber: data.halalNumber,
      benefits: data.benefits,
      composition: data.composition,
      usageRules: data.usageRules,
      contraindications: data.contraindications,
      imageUrl: data.imageUrl,
    });
    onBack();
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* 1. Sticky Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-surface border border-border-subtle mac-glass mac-shadow rounded-2xl">
        <div className="flex items-center gap-3">
          <TijarahButton
            type="button"
            heroVariant="outline"
            size="sm"
            onClick={onBack}
            className="h-9 px-3 text-xs font-bold text-text-primary flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </TijarahButton>

          <div className="h-6 w-px bg-border-subtle hidden sm:block" />

          <div>
            <h2 className="text-base font-black text-text-primary tracking-tight flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-sage" />
              <span>
                {isEdit ? `Edit Khasiat: ${knowledge.name}` : "Penyusunan Khasiat & Resep Produk Baru"}
              </span>
            </h2>
            <p className="text-[11px] text-text-muted mt-0.5">
              Ruang kerja dokumen penuh (Google Docs Editor) untuk menyusun referensi ilmiah dan khasiat herba HNI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TijarahButton
            type="button"
            heroVariant="outline"
            size="sm"
            onClick={onBack}
            isDisabled={isLoading}
            className="text-xs font-bold"
          >
            Batal
          </TijarahButton>

          <TijarahButton
            type="button"
            tijarahVariant="primary"
            size="sm"
            onClick={handleSubmit(handleFormSubmit)}
            isDisabled={isLoading}
            className="text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? "Menyimpan..." : isEdit ? "Simpan Perubahan Dokumen" : "Daftarkan ke Katalog"}</span>
          </TijarahButton>
        </div>
      </div>

      {/* 2. Full-Page Document Studio Layout (Grid 12 Kolom) */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Google Docs Editor & Panduan Konsumsi (8/12) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Editor Google Docs Utama untuk Khasiat & Manfaat */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary-sage" />
                <span>Dokumen Khasiat, Manfaat &amp; Resep Sinergi (Google Docs Editor)*</span>
              </label>
              <span className="text-[10px] text-text-muted font-medium bg-canvas px-2 py-0.5 rounded border border-border-subtle">
                Format Bebas: Heading, Bold, List &amp; Tautan
              </span>
            </div>

            <TijarahGoogleDocEditor
              documentTitle={watchedName ? `Khasiat & Resep: ${watchedName}` : "Dokumen Khasiat Herba"}
              value={typeof watchedBenefits === "string" ? watchedBenefits : ""}
              onChange={(html) => setValue("benefits", html, { shouldValidate: true })}
              minHeight="480px"
            />

            {errors.benefits && (
              <span className="text-xs text-status-danger font-medium mt-1 block">
                {errors.benefits?.message as string}
              </span>
            )}
          </div>

          {/* Aturan Pakai & Dosis */}
          <TijarahCard className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-3">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border-subtle">
              <ShieldCheck className="w-4 h-4 text-primary-sage" />
              Aturan Pakai &amp; Anjuran Dosis Konsumsi*
            </h3>
            <TijarahTextArea
              placeholder="Contoh: Dewasa: 3 x 2 kapsul sehari sebelum makan. Anak-anak: 2 x 1 kapsul sehari. Perbanyak minum air hangat."
              {...register("usageRules")}
              className="text-xs min-h-[90px] font-sans"
            />
            {errors.usageRules && (
              <span className="text-xs text-status-danger font-medium">
                {errors.usageRules?.message as string}
              </span>
            )}
          </TijarahCard>

          {/* Peringatan / Kontraindikasi */}
          <TijarahCard className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-3">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border-subtle">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Peringatan &amp; Kontraindikasi Khusus (Opsional)
            </h3>
            <TijarahTextArea
              placeholder="Contoh: Tidak dianjurkan untuk ibu hamil trimester pertama atau pasien dengan riwayat alergi getah tanaman..."
              {...register("contraindications")}
              className="text-xs min-h-[80px] font-sans"
            />
          </TijarahCard>
        </div>

        {/* Kolom Kanan: Identitas & Metadata Produk (4/12) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Foto Produk & Preview */}
          <TijarahCard className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-3.5">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border-subtle">
              <Sparkles className="w-4 h-4 text-primary-sage" />
              Visual Produk Herba
            </h3>

            <div className="w-full aspect-square rounded-2xl border border-border-subtle overflow-hidden bg-canvas/60 flex items-center justify-center relative shadow-xs">
              {watchedImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={watchedImageUrl}
                  alt="Preview Produk"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1608248597359-009770e6a88b?auto=format&fit=crop&w=400&q=80";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-text-muted p-4 text-center">
                  <ImageIcon className="w-8 h-8 mb-1.5 text-primary-sage/70" />
                  <span className="text-xs font-semibold text-text-primary">Belum Ada Gambar</span>
                  <span className="text-[10px] text-text-muted mt-0.5">Masukkan tautan URL di bawah</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">URL Gambar Produk</label>
              <TijarahInput
                placeholder="https://images.unsplash.com/... atau path CDN"
                {...register("imageUrl")}
                className="text-xs"
              />
            </div>
          </TijarahCard>

          {/* Informasi SKU & Legalitas */}
          <TijarahCard className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-3.5">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border-subtle">
              <Layers className="w-4 h-4 text-primary-sage" />
              Identitas &amp; Sertifikasi
            </h3>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Kode SKU Produk <span className="text-status-danger">*</span>
              </label>
              <TijarahInput
                placeholder="Contoh: HNI-MHS-100"
                {...register("sku")}
                isInvalid={!!errors.sku}
                errorMessage={errors.sku?.message as string}
                className="text-xs font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Nama Produk Herbal <span className="text-status-danger">*</span>
              </label>
              <TijarahInput
                placeholder="Contoh: Minyak Herba Sinergi (MHS)"
                {...register("name")}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message as string}
                className="text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Kategori Produk <span className="text-status-danger">*</span>
              </label>
              <TijarahInput
                placeholder="Herbal / Suplemen / Minuman Alami"
                {...register("category")}
                isInvalid={!!errors.category}
                errorMessage={errors.category?.message as string}
                className="text-xs"
              />
            </div>

            <div className="pt-2 border-t border-border-subtle space-y-3">
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Nomor Izin BPOM RI <span className="text-status-danger">*</span>
                </label>
                <TijarahInput
                  placeholder="POM TR 165 691 501"
                  {...register("bpomNumber")}
                  isInvalid={!!errors.bpomNumber}
                  errorMessage={errors.bpomNumber?.message as string}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Sertifikat Halal MUI <span className="text-status-danger">*</span>
                </label>
                <TijarahInput
                  placeholder="LPPOM MUI 00130084780917"
                  {...register("halalNumber")}
                  isInvalid={!!errors.halalNumber}
                  errorMessage={errors.halalNumber?.message as string}
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </TijarahCard>

          {/* Komposisi Bahan Alami */}
          <TijarahCard className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-3">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border-subtle">
              <Award className="w-4 h-4 text-emerald-500" />
              Komposisi Bahan Alami*
            </h3>
            <TijarahTextArea
              placeholder="Virgin Coconut Oil 50%&#10;Oleum Olea Europaea (Zaitun) 30%&#10;Cengkeh & Kayu Manis 20%"
              {...register("composition")}
              className="text-xs min-h-[90px] font-sans"
            />
            {errors.composition && (
              <span className="text-xs text-status-danger font-medium">
                {errors.composition?.message as string}
              </span>
            )}
          </TijarahCard>
        </div>
      </form>
    </div>
  );
};

export default ProductKnowledgeEditorView;
