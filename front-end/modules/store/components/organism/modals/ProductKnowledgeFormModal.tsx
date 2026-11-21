"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import {
  productKnowledgeSchema,
  type ProductKnowledgeFormData,
} from "../../../schemas/store.schema";
import type { StoreProductKnowledge } from "../../../types/store.types";
import type { ProductKnowledgePayload } from "../../../api/store.api";
import { ImageIcon, Sparkles, FileText } from "lucide-react";
import { TijarahGoogleDocEditor } from "@/components/rich-editor/TijarahGoogleDocEditor";

export interface IProductKnowledgeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledge: StoreProductKnowledge | null;
  onSubmit: (payload: ProductKnowledgePayload) => Promise<void>;
  isLoading: boolean;
}

export const ProductKnowledgeFormModal: React.FC<IProductKnowledgeFormModalProps> = ({
  isOpen,
  onClose,
  knowledge,
  onSubmit,
  isLoading,
}) => {
  const isEdit = !!knowledge;
  const [useDocEditor, setUseDocEditor] = useState(false);

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
  }, [knowledge, reset, isOpen]);

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
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Khasiat #${knowledge.sku}` : "Tambah Katalog Khasiat & Komposisi"}
      description={
        isEdit
          ? "Perbarui informasi manfaat thibbun nabawi, komposisi herba, dan aturan konsumsi."
          : "Dokumentasikan khasiat herba HNI, sertifikasi BPOM/Halal, serta anjuran pemakaian."
      }
      confirmText={isEdit ? "Simpan Khasiat" : "Daftarkan Produk"}
      confirmVariant="primary"
      isConfirmLoading={isLoading}
      onConfirm={handleSubmit(handleFormSubmit)}
      showCancelButton
      cancelText="Batal"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3.5 pt-1">
        {/* Layout URL Gambar & Live Preview Box */}
        <div className="p-3.5 rounded-2xl border border-border-subtle bg-canvas/60 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-border-subtle overflow-hidden bg-surface flex items-center justify-center shrink-0 shadow-xs relative">
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
              <div className="flex flex-col items-center justify-center text-text-muted p-2 text-center">
                <ImageIcon className="w-7 h-7 mb-1 text-primary-sage/70" />
                <span className="text-[10px] leading-tight font-medium">Belum ada foto</span>
              </div>
            )}
            <span className="absolute bottom-1 right-1 bg-surface/90 text-[9px] font-bold px-1.5 py-0.5 rounded text-text-primary shadow-xs">
              Preview
            </span>
          </div>

          <div className="flex-1 w-full space-y-1.5">
            <TijarahInput
              label="URL Gambar Produk Herbal"
              placeholder="https://images.unsplash.com/... atau path CDN HNI"
              {...register("imageUrl")}
              className="text-xs"
            />
            <p className="text-[11px] text-text-muted flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary-sage shrink-0" />
              <span>Gunakan tautan gambar PNG/JPG transparan atau berlatar bersih resolusi 600x600px.</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <TijarahInput
              label="Kode SKU Produk*"
              placeholder="Contoh: HNI-HERB-008"
              {...register("sku")}
              isInvalid={!!errors.sku}
              errorMessage={errors.sku?.message as string}
              className="text-xs font-mono font-bold uppercase"
            />
          </div>

          <div>
            <TijarahInput
              label="Nama Produk Herbal*"
              placeholder="Contoh: Spirulina 60 Kapsul"
              {...register("name")}
              isInvalid={!!errors.name}
              errorMessage={errors.name?.message as string}
              className="text-xs font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <TijarahInput
              label="Kategori Produk*"
              placeholder="Herbal / Suplemen / Minuman"
              {...register("category")}
              isInvalid={!!errors.category}
              errorMessage={errors.category?.message as string}
              className="text-xs"
            />
          </div>

          <div>
            <TijarahInput
              label="Nomor Izin BPOM*"
              placeholder="Contoh: POM TR 165 691 501"
              {...register("bpomNumber")}
              isInvalid={!!errors.bpomNumber}
              errorMessage={errors.bpomNumber?.message as string}
              className="text-xs font-mono"
            />
          </div>

          <div>
            <TijarahInput
              label="Sertifikat Halal MUI*"
              placeholder="Contoh: LPPOM MUI 00130084780917"
              {...register("halalNumber")}
              isInvalid={!!errors.halalNumber}
              errorMessage={errors.halalNumber?.message as string}
              className="text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-text-primary block">
              Khasiat &amp; Manfaat Herba*
            </label>
            <button
              type="button"
              onClick={() => setUseDocEditor(!useDocEditor)}
              className="text-[11px] font-bold text-primary-sage hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{useDocEditor ? "Gunakan Input Baris Teks" : "Buka Mode Editor Google Docs"}</span>
            </button>
          </div>

          {useDocEditor ? (
            <div className="mt-1">
              <TijarahGoogleDocEditor
                documentTitle={watchedName ? `Dokumen Khasiat: ${watchedName}` : "Dokumen Khasiat Herba"}
                value={typeof watchedBenefits === "string" ? watchedBenefits : ""}
                onChange={(html) => setValue("benefits", html, { shouldValidate: true })}
                minHeight="180px"
              />
            </div>
          ) : (
            <TijarahTextArea
              placeholder="Meredakan radang tenggorokan&#10;Meningkatkan daya tahan tubuh&#10;Membantu pemulihan stamina"
              {...register("benefits")}
              className="text-xs min-h-[70px]"
            />
          )}

          {errors.benefits && (
            <span className="text-xs text-status-danger font-medium mt-1 block">
              {errors.benefits?.message as string}
            </span>
          )}
        </div>

        <div>
          <TijarahTextArea
            label="Komposisi Bahan Alami (Satu per baris)*"
            placeholder="Virgin Coconut Oil 50%&#10;Oleum Olea Europaea (Minyak Zaitun) 30%&#10;Cengkeh & Kayu Manis 20%"
            {...register("composition")}
            className="text-xs min-h-[70px]"
          />
          {errors.composition && (
            <span className="text-xs text-status-danger font-medium">
              {errors.composition?.message as string}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <TijarahTextArea
              label="Aturan Pakai & Dosis Anjuran*"
              placeholder="Dewasa: 3x2 kapsul sehari sebelum makan. Anak: 2x1 kapsul."
              {...register("usageRules")}
              className="text-xs min-h-[60px]"
            />
            {errors.usageRules && (
              <span className="text-xs text-status-danger font-medium">
                {errors.usageRules?.message as string}
              </span>
            )}
          </div>

          <div>
            <TijarahTextArea
              label="Peringatan / Kontraindikasi (Opsional)"
              placeholder="Tidak dianjurkan untuk wanita hamil trimester pertama..."
              {...register("contraindications")}
              className="text-xs min-h-[60px]"
            />
          </div>
        </div>
      </form>
    </TijarahModal>
  );
};

export default ProductKnowledgeFormModal;
