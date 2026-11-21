"use client";

import React, { useState } from "react";
import type {
  StoreProductKnowledge,
  StoreProductTestimonial,
} from "../../../types/store.types";
import type {
  ProductKnowledgePayload,
  TestimonialPayload,
} from "../../../api/store.api";
import { ProductKnowledgeEditorView } from "./ProductKnowledgeEditorView";
import { TestimonialFormModal } from "../modals/TestimonialFormModal";
import { DeleteConfirmModal } from "../modals/DeleteConfirmModal";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import {
  BookOpen,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  MessageSquarePlus,
  RefreshCw,
  ImageIcon,
  ShieldCheck,
  Award,
} from "lucide-react";
import { FileSpreadsheet } from "lucide-react";
import { KhasitTableEditor } from "@/modules/khasit/components/KhasitTableEditor";

export interface IProductKnowledgePanelProps {
  products: StoreProductKnowledge[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateProduct?: (payload: ProductKnowledgePayload) => Promise<any>;
  onUpdateProduct?: (params: { id: string; payload: ProductKnowledgePayload }) => Promise<any>;
  onDeleteProduct?: (id: string) => Promise<any>;
  onSaveTestimonial?: (params: { productId: string; payload: TestimonialPayload }) => Promise<any>;
  onDeleteTestimonial?: (params: { productId: string; testimonialId: string }) => Promise<any>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export const ProductKnowledgePanel: React.FC<IProductKnowledgePanelProps> = ({
  products,
  isLoading,
  onRefresh,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onSaveTestimonial,
  onDeleteTestimonial,
  isSaving = false,
  isDeleting = false,
}) => {
  const [viewMode, setViewMode] = useState<"CARDS" | "SPREADSHEET">("CARDS");

  const [selectedProduct, setSelectedProduct] = useState<StoreProductKnowledge | null>(
    products[0] || null
  );

  // Editor View State (Full Page Google Docs Studio, no modal)
  const [isEditorViewOpen, setIsEditorViewOpen] = useState(false);
  const [productForEdit, setProductForEdit] = useState<StoreProductKnowledge | null>(null);
  const [productForDelete, setProductForDelete] = useState<StoreProductKnowledge | null>(null);

  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [testimonialForDelete, setTestimonialForDelete] = useState<StoreProductTestimonial | null>(null);

  // Sync selected product if list updates
  const activeProduct =
    products.find((p) => p.id === selectedProduct?.id) || products[0] || null;

  const handleOpenCreateProduct = () => {
    setProductForEdit(null);
    setIsEditorViewOpen(true);
  };

  const handleSubmitProductForm = async (payload: ProductKnowledgePayload) => {
    if (productForEdit && onUpdateProduct) {
      await onUpdateProduct({ id: productForEdit.id, payload });
    } else if (onCreateProduct) {
      await onCreateProduct(payload);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productForDelete || !onDeleteProduct) return;
    await onDeleteProduct(productForDelete.id);
    setProductForDelete(null);
    if (selectedProduct?.id === productForDelete.id) {
      setSelectedProduct(products[1] || null);
    }
  };

  const handleOpenAddTestimonial = () => {
    setIsTestimonialModalOpen(true);
  };

  const handleSubmitTestimonial = async (payload: TestimonialPayload) => {
    if (!activeProduct || !onSaveTestimonial) return;
    await onSaveTestimonial({ productId: activeProduct.id, payload });
  };

  const handleConfirmDeleteTestimonial = async () => {
    if (!testimonialForDelete || !onDeleteTestimonial) return;
    await onDeleteTestimonial({
      productId: activeProduct?.id || "",
      testimonialId: testimonialForDelete.id,
    });
    setTestimonialForDelete(null);
  };

  const fallbackImage =
    "https://images.unsplash.com/photo-1608248597359-009770e6a88b?auto=format&fit=crop&w=600&q=80";

  // ─── TAMPILAN FULL-PAGE WORKSPACE GOOGLE DOCS (BUKAN MODAL) ───
  if (isEditorViewOpen) {
    return (
      <ProductKnowledgeEditorView
        knowledge={productForEdit}
        onBack={() => setIsEditorViewOpen(false)}
        onSubmit={handleSubmitProductForm}
        isLoading={isSaving}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-primary-sage" />
            <span>Katalog Khasiat, Komposisi &amp; Testimoni</span>
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Panduan khasiat herba thibbun nabawi HNI, referensi ilmiah, aturan pakai resmi, dan ulasan kepuasan mitra.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-surface border border-border-subtle p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("CARDS")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === "CARDS"
                  ? "bg-primary-sage text-white shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Detail &amp; Testimoni</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("SPREADSHEET")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === "SPREADSHEET"
                  ? "bg-primary-sage text-white shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Spreadsheet Editor</span>
            </button>
          </div>

          <TijarahButton
            type="button"
            heroVariant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
            className="text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>Segarkan</span>
          </TijarahButton>

          <TijarahButton
            type="button"
            tijarahVariant="primary"
            size="sm"
            onClick={handleOpenCreateProduct}
            className="text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Khasiat Produk</span>
          </TijarahButton>
        </div>
      </div>

      {/* Conditionally Render Spreadsheet Table Editor or Cards */}
      {viewMode === "SPREADSHEET" ? (
        <KhasitTableEditor initialProducts={products} onSavedSuccess={onRefresh} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Navigasi Produk Herba */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider block px-1">
            Pilih Produk Herba ({products.length})
          </span>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {products.map((item) => {
              const isSelected = activeProduct?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedProduct(item)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-primary-sage/15 border-primary-sage/40 shadow-xs dark:bg-primary-sage/20"
                      : "bg-surface border-border-subtle hover:bg-canvas/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Thumbnail Kecil Gambar Produk */}
                    <div className="w-12 h-12 rounded-xl border border-border-subtle overflow-hidden bg-canvas shrink-0 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl || fallbackImage}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackImage;
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-primary-sage font-bold block">
                        {item.sku}
                      </span>
                      <h4 className="font-bold text-xs text-text-primary truncate mt-0.5">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-text-muted block mt-0.5">
                        {item.category} • {item.testimonials.length} Testimoni
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <TijarahButton
                      type="button"
                      heroVariant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductForEdit(item);
                        setIsEditorViewOpen(true);
                      }}
                      className="text-xs px-2 h-7 font-bold text-primary-sage"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </TijarahButton>

                    <TijarahButton
                      type="button"
                      heroVariant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductForDelete(item);
                      }}
                      className="text-xs px-2 h-7 font-bold text-status-danger hover:bg-status-danger/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </TijarahButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Rincian Khasiat, Komposisi & Testimoni */}
        <div className="lg:col-span-8 space-y-5">
          {activeProduct ? (
            <>
              {/* Kartu Header Khasiat Produk dengan Layout Gambar Terintegrasi (Poin 4) */}
              <TijarahCard
                tijarahVariant="default"
                className="p-5 sm:p-6 border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-5"
              >
                {/* Bagian Hero Produk: Foto Produk Besar + Metadata Lengkap */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b border-border-subtle">
                  {/* Container Foto Produk Utama */}
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl border border-border-subtle overflow-hidden bg-canvas shrink-0 shadow-md relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeProduct.imageUrl || fallbackImage}
                      alt={activeProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackImage;
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-center">
                      <span className="text-[10px] text-white/95 font-bold tracking-wide">
                        Original Herba HNI
                      </span>
                    </div>
                  </div>

                  {/* Informasi Produk & Legalitas Resmi */}
                  <div className="flex-1 w-full space-y-3 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-primary-sage bg-primary-sage/10 px-2.5 py-0.5 rounded-md border border-primary-sage/25">
                            {activeProduct.sku}
                          </span>
                          <span className="text-xs text-text-muted font-medium bg-canvas px-2 py-0.5 rounded border border-border-subtle">
                            {activeProduct.category}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-text-primary mt-1.5 leading-snug">
                          {activeProduct.name}
                        </h3>
                      </div>

                      <TijarahButton
                        type="button"
                        tijarahVariant="secondary"
                        size="sm"
                        onClick={() => {
                          setProductForEdit(activeProduct);
                          setIsEditorViewOpen(true);
                        }}
                        className="text-xs font-bold flex items-center gap-1.5 self-center sm:self-start shadow-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-primary-sage" />
                        <span>Edit Khasiat Produk</span>
                      </TijarahButton>
                    </div>

                    {/* Badge Sertifikasi Halal & BPOM */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>BPOM: {activeProduct.bpomNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-sage/10 text-primary-sage border border-primary-sage/25 text-xs font-bold">
                        <Award className="w-4 h-4 shrink-0" />
                        <span>{activeProduct.halalNumber}</span>
                      </div>
                    </div>

                    <p className="text-xs text-text-muted leading-relaxed">
                      Produk herba alami thibbun nabawi berstandar Good Manufacturing Practice (GMP) yang diproduksi secara higienis, halal, dan berkhasiat tinggi.
                    </p>
                  </div>
                </div>

                {/* Grid Khasiat & Komposisi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Manfaat & Khasiat */}
                  <div className="p-4 rounded-xl bg-canvas/70 border border-border-subtle space-y-2.5">
                    <span className="text-xs font-bold text-primary-sage flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      Khasiat & Manfaat Utama
                    </span>
                    <ul className="space-y-1.5 text-xs text-text-primary">
                      {activeProduct.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Komposisi Bahan Baku */}
                  <div className="p-4 rounded-xl bg-canvas/70 border border-border-subtle space-y-2.5">
                    <span className="text-xs font-bold text-primary-sage flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <BookOpen className="w-3.5 h-3.5" />
                      Komposisi Bahan Alami
                    </span>
                    <ul className="space-y-1.5 text-xs text-text-muted">
                      {activeProduct.composition.map((comp, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-sage shrink-0 mt-1.5" />
                          <span>{comp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Aturan Pakai & Peringatan */}
                <div className="p-4 rounded-xl bg-primary-sage/10 border border-primary-sage/20 text-xs space-y-1.5">
                  <span className="font-bold text-text-primary block text-[11px]">
                    Anjuran Aturan Pakai:
                  </span>
                  <p className="text-text-muted leading-relaxed">{activeProduct.usageRules}</p>
                  {activeProduct.contraindications && (
                    <p className="text-[11px] text-status-warning font-semibold pt-1.5 border-t border-primary-sage/20 mt-1">
                      Perhatian: {activeProduct.contraindications}
                    </p>
                  )}
                </div>
              </TijarahCard>

              {/* Bagian Ulasan & Testimoni Pelanggan */}
              <TijarahCard
                tijarahVariant="default"
                className="p-5 sm:p-6 border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>Testimoni Mitra & Konsumen ({activeProduct.testimonials.length})</span>
                    </h4>
                    <p className="text-[11px] text-text-muted">
                      Pengalaman nyata penggunaan herba untuk edukasi pembeli dan mitra keagenan.
                    </p>
                  </div>

                  <TijarahButton
                    type="button"
                    heroVariant="outline"
                    size="sm"
                    onClick={handleOpenAddTestimonial}
                    className="text-xs font-bold flex items-center gap-1.5"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Tulis Testimoni</span>
                  </TijarahButton>
                </div>

                {activeProduct.testimonials.length === 0 ? (
                  <div className="py-8 text-center text-text-muted text-xs flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5 text-text-muted" />
                    <span>Belum ada testimoni untuk produk herba ini. Jadilah yang pertama menulis!</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeProduct.testimonials.map((tst) => (
                      <div
                        key={tst.id}
                        className="p-3.5 rounded-xl bg-canvas/80 border border-border-subtle space-y-2 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-text-primary block">
                              {tst.customerName}
                            </span>
                            <span className="text-[10px] text-text-muted">{tst.customerRole}</span>
                          </div>

                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < tst.rating
                                    ? "text-amber-500 fill-amber-500"
                                    : "text-text-muted/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-text-muted italic leading-relaxed">
                          "{tst.content}"
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-border-subtle/50">
                          <span>{tst.date}</span>
                          <TijarahButton
                            type="button"
                            heroVariant="ghost"
                            size="sm"
                            onClick={() => setTestimonialForDelete(tst)}
                            className="text-status-danger h-5 px-1.5 text-[10px] hover:bg-status-danger/10"
                          >
                            Hapus
                          </TijarahButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TijarahCard>
            </>
          ) : (
            <div className="p-12 text-center text-text-muted text-xs">
              Pilih produk herba di sisi kiri untuk melihat rincian khasiat dan testimoni.
            </div>
          )}
        </div>
      </div>
      )}


      {/* Modal Form Tulis Testimoni */}
      <TestimonialFormModal
        isOpen={isTestimonialModalOpen}
        onClose={() => setIsTestimonialModalOpen(false)}
        productName={activeProduct?.name || ""}
        testimonial={null}
        onSubmit={handleSubmitTestimonial}
        isLoading={isSaving}
      />

      {/* Modal Konfirmasi Hapus Produk Khasiat */}
      <DeleteConfirmModal
        isOpen={!!productForDelete}
        onClose={() => setProductForDelete(null)}
        title="Hapus Katalog Khasiat Produk?"
        itemName={productForDelete?.name || ""}
        description={`Apakah Anda yakin ingin menghapus data khasiat dan komposisi "${productForDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleConfirmDeleteProduct}
        isLoading={isDeleting}
      />

      {/* Modal Konfirmasi Hapus Testimoni */}
      <DeleteConfirmModal
        isOpen={!!testimonialForDelete}
        onClose={() => setTestimonialForDelete(null)}
        title="Hapus Testimoni Pelanggan?"
        itemName={`Testimoni ${testimonialForDelete?.customerName || ""}`}
        description={`Hapus testimoni dari "${testimonialForDelete?.customerName}"?`}
        onConfirm={handleConfirmDeleteTestimonial}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProductKnowledgePanel;
