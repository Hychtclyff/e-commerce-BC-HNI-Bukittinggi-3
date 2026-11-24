"use client";

import React, { useState, useEffect } from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { newsApi } from "../api/news.api";
import { storeApi } from "@/modules/store/api/store.api";
import type { NewsArticle, NewsCategory, NewsStatus, NewsPayload } from "../types/news.types";
import { showToast } from "@/utils/toast";
import { TijarahGoogleDocEditor } from "@/components/rich-editor/TijarahGoogleDocEditor";
import { MediaUploader } from "@/modules/media/components/MediaUploader";
import {
  Newspaper,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Tag,
  BookOpen,
  Sparkles,
  RefreshCw,
  X,
  Save,
  CheckCircle2,
  Clock,
  Layers,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

const CATEGORY_OPTIONS: Array<{ key: NewsCategory; label: string; badgeVariant: "primary" | "secondary" | "success" | "warning" }> = [
  { key: "HERBAL", label: "Herbal & Thibbun Nabawi", badgeVariant: "success" },
  { key: "EDUKASI", label: "Edukasi & Resep Sehat", badgeVariant: "primary" },
  { key: "PROMO", label: "Promo & Diskon Gerai", badgeVariant: "warning" },
  { key: "PENGUMUMAN", label: "Pengumuman Resmi BC", badgeVariant: "secondary" },
  { key: "EVENT", label: "Agenda & Pelatihan HNI", badgeVariant: "primary" },
];

const STATUS_OPTIONS: Array<{ key: NewsStatus; label: string }> = [
  { key: "PUBLISHED", label: "Terbit (Published)" },
  { key: "DRAFT", label: "Draf (Draft)" },
  { key: "ARCHIVED", label: "Arsip (Archived)" },
];

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80";

export const NewsPanel: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [previewArticle, setPreviewArticle] = useState<NewsArticle | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<NewsArticle | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [editorLang, setEditorLang] = useState<"id" | "en">("id");
  const [formTitle, setFormTitle] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<NewsCategory>("HERBAL");
  const [formStatus, setFormStatus] = useState<NewsStatus>("PUBLISHED");
  const [formThumbnail, setFormThumbnail] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formSummaryEn, setFormSummaryEn] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formContentEn, setFormContentEn] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formTaggedProductIds, setFormTaggedProductIds] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; sku: string; name: string }>>([]);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const data = await newsApi.getNewsList();
      setArticles(data);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
    storeApi
      .getInventory()
      .then((items) => setAvailableProducts((items || []).map((i) => ({ id: i.id, sku: i.sku, name: i.name }))))
      .catch(() => {});
  }, []);

  const openCreateModal = () => {
    setEditingArticle(null);
    setEditorLang("id");
    setFormTitle("");
    setFormTitleEn("");
    setFormSlug("");
    setFormCategory("HERBAL");
    setFormStatus("PUBLISHED");
    setFormThumbnail("");
    setFormExcerpt("");
    setFormSummaryEn("");
    setFormContent("");
    setFormContentEn("");
    setFormTags("herbal, hni, kesehatan");
    setFormTaggedProductIds([]);
    setIsFormOpen(true);
  };

  const openEditModal = (art: NewsArticle) => {
    setEditingArticle(art);
    setEditorLang("id");
    setFormTitle(art.title);
    setFormTitleEn(art.titleEn || "");
    setFormSlug(art.slug);
    setFormCategory(art.category);
    setFormStatus(art.status);
    setFormThumbnail(art.thumbnailUrl || "");
    setFormExcerpt(art.excerpt || art.summary || "");
    setFormSummaryEn(art.summaryEn || "");
    setFormContent(art.content);
    setFormContentEn(art.contentEn || "");
    setFormTags((art.tags || []).join(", "));
    setFormTaggedProductIds(art.taggedProductIds || []);
    setIsFormOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingArticle) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setFormSlug(generated);
    }
  };

  const handleSaveArticle = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      showToast.error("Validasi Gagal", "Judul dan konten artikel berita wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = formTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const payload: NewsPayload = {
        title: formTitle.trim(),
        titleEn: formTitleEn.trim() || undefined,
        slug: formSlug.trim() || formTitle.toLowerCase().replace(/\s+/g, "-"),
        category: formCategory,
        status: formStatus,
        thumbnailUrl: formThumbnail.trim() || undefined,
        excerpt: formExcerpt.trim() || formContent.slice(0, 160) + "...",
        summaryEn: formSummaryEn.trim() || undefined,
        content: formContent.trim(),
        contentEn: formContentEn.trim() || undefined,
        tags: tagsArray,
        taggedProductIds: formTaggedProductIds,
      };

      if (editingArticle) {
        const res = await newsApi.updateNews(editingArticle.id, payload);
        if (res.success) {
          showToast.success("Artikel Diperbarui", res.message);
          setIsFormOpen(false);
          await loadNews();
        } else {
          showToast.error("Gagal Memperbarui", res.message);
        }
      } else {
        const res = await newsApi.createNews(payload);
        if (res.success) {
          showToast.success("Artikel Diterbitkan", res.message);
          setIsFormOpen(false);
          await loadNews();
        } else {
          showToast.error("Gagal Menerbitkan", res.message);
        }
      }
    } catch (err: any) {
      showToast.error("Terjadi Kesalahan", err?.message || "Gagal menyimpan artikel.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!deletingArticle) return;
    try {
      const res = await newsApi.deleteNews(deletingArticle.id);
      if (res.success) {
        showToast.success("Artikel Dihapus", res.message);
        setDeletingArticle(null);
        await loadNews();
      } else {
        showToast.error("Gagal Menghapus", res.message);
      }
    } catch (err: any) {
      showToast.error("Terjadi Kesalahan", err?.message || "Gagal menghapus artikel.");
    }
  };

  // Filter Articles
  const filteredArticles = articles.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      a.title.toLowerCase().includes(q) ||
      (a.excerpt || a.summary || "").toLowerCase().includes(q) ||
      (a.tags && a.tags.some((t) => t.toLowerCase().includes(q)));

    const matchesCategory = selectedCategory === "ALL" || a.category === selectedCategory;
    const matchesStatus = selectedStatus === "ALL" || a.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPublished = articles.filter((a) => a.status === "PUBLISHED").length;
  const totalDraft = articles.filter((a) => a.status === "DRAFT").length;
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  const getCategoryMeta = (cat: NewsCategory) => {
    return CATEGORY_OPTIONS.find((c) => c.key === cat) || {
      key: cat,
      label: cat,
      badgeVariant: "secondary" as const,
    };
  };

  // ─── TAMPILAN FULL-PAGE GOOGLE DOCS STUDIO UNTUK ARTIKEL / BLOG ───
  if (isFormOpen) {
    return (
      <div className="space-y-6 w-full animate-in fade-in duration-200">
        {/* Sticky Header Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-surface border border-border-subtle mac-glass mac-shadow rounded-2xl">
          <div className="flex items-center gap-3">
            <TijarahButton
              size="sm"
              heroVariant="outline"
              onClick={() => setIsFormOpen(false)}
              className="h-9 px-3 text-xs font-bold text-text-primary flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar</span>
            </TijarahButton>

            <div className="h-6 w-px bg-border-subtle hidden sm:block" />

            <div>
              <h2 className="text-base font-black text-text-primary tracking-tight">
                {editingArticle ? `Edit Artikel: ${editingArticle.title}` : "Tulis Artikel / Berita Baru"}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
                <span>Google Docs Document Studio</span>
                <span>•</span>
                <span className="font-mono text-primary-sage font-bold">
                  {formSlug ? `/${formSlug}` : "/draft-slug"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TijarahButton
              size="sm"
              heroVariant="outline"
              onClick={() => setIsFormOpen(false)}
              isDisabled={isSaving}
              className="text-xs font-bold"
            >
              Batal
            </TijarahButton>

            <TijarahButton
              size="sm"
              tijarahVariant="primary"
              onClick={handleSaveArticle}
              isDisabled={isSaving}
              className="text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Menyimpan..." : editingArticle ? "Simpan Perubahan" : "Terbitkan Artikel"}</span>
            </TijarahButton>
          </div>
        </div>

        {/* 2-Column Full-Page Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Document Workspace (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Language Toggle ID / EN */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-surface border border-border-subtle rounded-xl">
              <span className="text-xs font-bold text-text-muted px-2">
                Bahasa Konten Artikel:
              </span>
              <div className="flex items-center gap-1.5 bg-canvas p-1 rounded-lg border border-border-subtle">
                <button
                  type="button"
                  onClick={() => setEditorLang("id")}
                  className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${
                    editorLang === "id" ? "bg-primary-sage text-white" : "text-text-muted"
                  }`}
                >
                  🇮🇩 Indonesia (Utama)
                </button>
                <button
                  type="button"
                  onClick={() => setEditorLang("en")}
                  className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${
                    editorLang === "en" ? "bg-primary-sage text-white" : "text-text-muted"
                  }`}
                >
                  🇬🇧 English Version
                </button>
              </div>
            </div>

            {/* Judul Artikel Besar */}
            <div className="p-5 bg-surface border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                {editorLang === "id" ? "Judul Artikel / Berita (ID)" : "Article Title (EN)"}{" "}
                {editorLang === "id" && <span className="text-status-danger">*</span>}
              </label>
              <input
                type="text"
                placeholder={
                  editorLang === "id"
                    ? "Tuliskan judul artikel berita yang menarik di sini..."
                    : "Enter English article title (optional, falls back to ID if empty)..."
                }
                value={editorLang === "id" ? formTitle : formTitleEn}
                onChange={(e) =>
                  editorLang === "id"
                    ? handleTitleChange(e.target.value)
                    : setFormTitleEn(e.target.value)
                }
                className="w-full text-lg sm:text-xl font-black text-text-primary bg-canvas/40 border border-border-subtle rounded-xl px-4 py-3 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-sage transition-all"
              />
            </div>

            {/* Google Docs Editor Penuh */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                {editorLang === "id"
                  ? "Lembar Dokumen Konten Lengkap (ID)"
                  : "Full Article Content (EN)"}{" "}
                {editorLang === "id" && <span className="text-status-danger">*</span>}
              </label>
              <TijarahGoogleDocEditor
                key={editorLang}
                documentTitle={
                  (editorLang === "id" ? formTitle : formTitleEn) || "Draft Dokumen Artikel"
                }
                value={editorLang === "id" ? formContent : formContentEn}
                onChange={(html) =>
                  editorLang === "id" ? setFormContent(html) : setFormContentEn(html)
                }
                minHeight="520px"
              />
            </div>
          </div>

          {/* Sidebar Metadata & Settings (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Status & Kategori */}
            <TijarahCard className="p-4 sm:p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-3.5">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border-subtle">
                <Layers className="w-4 h-4 text-primary-sage" />
                Pengaturan Publikasi
              </h4>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">Status Publikasi</label>
                <TijarahSelect
                  selectedKey={formStatus}
                  onSelectionChange={(k) => k && setFormStatus(String(k) as NewsStatus)}
                  className="w-full text-xs"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <TijarahSelect.Item id={s.key} key={s.key} textValue={s.label}>
                      <span className="font-bold text-xs">{s.label}</span>
                    </TijarahSelect.Item>
                  ))}
                </TijarahSelect>
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">Kategori Konten</label>
                <TijarahSelect
                  selectedKey={formCategory}
                  onSelectionChange={(k) => k && setFormCategory(String(k) as NewsCategory)}
                  className="w-full text-xs"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <TijarahSelect.Item id={c.key} key={c.key} textValue={c.label}>
                      <span className="font-bold text-xs">{c.label}</span>
                    </TijarahSelect.Item>
                  ))}
                </TijarahSelect>
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">Slug URL (Permalink)</label>
                <TijarahInput
                  placeholder="slug-artikel-berita"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </TijarahCard>

            {/* Foto Sampul */}
            <TijarahCard className="p-4 sm:p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border-subtle">
                <Sparkles className="w-4 h-4 text-primary-sage" />
                Foto Sampul (Thumbnail)
              </h4>

              <MediaUploader
                category="NEWS"
                accept="image"
                value={formThumbnail}
                onChange={setFormThumbnail}
                label=""
                helperText="Tarik & lepas gambar sampul artikel berita atau klik untuk memilih"
                allowManualUrl
                compact
              />
            </TijarahCard>

            {/* Excerpt & Tags */}
            <TijarahCard className="p-4 sm:p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border-subtle">
                <Tag className="w-4 h-4 text-primary-sage" />
                Ringkasan &amp; Tagar SEO
              </h4>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  {editorLang === "id" ? "Ringkasan Pendek (ID)" : "Short Summary (EN)"}
                </label>
                <TijarahTextArea
                  placeholder={
                    editorLang === "id"
                      ? "1-2 kalimat ringkasan pengantar..."
                      : "1-2 sentences English summary..."
                  }
                  value={editorLang === "id" ? formExcerpt : formSummaryEn}
                  onChange={(e) =>
                    editorLang === "id"
                      ? setFormExcerpt(e.target.value)
                      : setFormSummaryEn(e.target.value)
                  }
                  className="text-xs min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">Tagar (Pisahkan koma)</label>
                <TijarahInput
                  placeholder="herbal, mhs, kesehatan, hni"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Tag Produk Unggulan (#5EA17B35) */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <label className="text-xs font-bold text-text-primary block">
                  Highlight / Tag Produk Terkait
                </label>
                <TijarahSelect
                  aria-label="Tag Produk Terkait"
                  selectedKey=""
                  onSelectionChange={(key) => {
                    const id = String(key || "");
                    if (id && !formTaggedProductIds.includes(id)) {
                      setFormTaggedProductIds((prev) => [...prev, id]);
                    }
                  }}
                  placeholder="+ Pilih produk untuk di-highlight..."
                >
                  {availableProducts
                    .filter((p) => !formTaggedProductIds.includes(p.id))
                    .map((p) => (
                      <TijarahSelect.Item key={p.id} id={p.id}>
                        {p.sku} — {p.name}
                      </TijarahSelect.Item>
                    ))}
                </TijarahSelect>
                {formTaggedProductIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formTaggedProductIds.map((pid) => {
                      const prod = availableProducts.find((p) => p.id === pid);
                      return (
                        <span
                          key={pid}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-sage/10 text-primary-sage border border-primary-sage/25 text-[11px] font-semibold"
                        >
                          <span>{prod ? prod.name : pid}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormTaggedProductIds((prev) => prev.filter((id) => id !== pid))
                            }
                            className="hover:text-status-danger cursor-pointer"
                            aria-label="Hapus tag produk"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </TijarahCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-text-primary flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary-sage" />
              Master Berita &amp; Edukasi Herba HNI
            </h2>
            <TijarahBadge tijarahVariant="primary" className="text-[10px] font-bold">
              Katalog Blog Gerai
            </TijarahBadge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Publikasi artikel edukasi thibbun nabawi, pengumuman promo toko, panduan herbal resmi, dan agenda pelatihan mitra.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TijarahButton
            size="sm"
            tijarahVariant="outline"
            onClick={loadNews}
            isDisabled={isLoading}
            className="text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </TijarahButton>

          <TijarahButton
            size="sm"
            tijarahVariant="primary"
            onClick={openCreateModal}
            className="text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tulis Artikel Baru
          </TijarahButton>
        </div>
      </div>

      {/* 2. Metrik Ringkasan Berita */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TijarahCard className="p-4 border border-border-subtle rounded-2xl bg-surface">
          <span className="text-xs font-semibold text-text-muted">Total Artikel</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{articles.length}</span>
            <span className="text-xs text-text-muted">Konten</span>
          </div>
        </TijarahCard>

        <TijarahCard className="p-4 border border-border-subtle rounded-2xl bg-surface">
          <span className="text-xs font-semibold text-text-muted">Tayang (Published)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-status-success">{totalPublished}</span>
            <span className="text-xs text-text-muted">Aktif Dibaca</span>
          </div>
        </TijarahCard>

        <TijarahCard className="p-4 border border-border-subtle rounded-2xl bg-surface">
          <span className="text-xs font-semibold text-text-muted">Draf (Draft)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-accent-gold">{totalDraft}</span>
            <span className="text-xs text-text-muted">Menunggu Rilis</span>
          </div>
        </TijarahCard>

        <TijarahCard className="p-4 border border-border-subtle rounded-2xl bg-surface">
          <span className="text-xs font-semibold text-text-muted">Total Pembaca</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary-sage">{totalViews.toLocaleString("id-ID")}</span>
            <span className="text-xs text-text-muted">Tayangan</span>
          </div>
        </TijarahCard>
      </div>

      {/* 3. Filter & Pencarian Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface p-3 border border-border-subtle rounded-2xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <TijarahInput
            placeholder="Cari judul artikel, topik, atau tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-canvas border border-border-subtle p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-primary-sage text-white shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Semua Kategori
            </button>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                  selectedCategory === cat.key
                    ? "bg-primary-sage text-white shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {cat.label.split(" ")[0]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-canvas border border-border-subtle p-0.5 rounded-xl text-xs font-bold">
            {["ALL", "PUBLISHED", "DRAFT"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                  selectedStatus === st
                    ? "bg-primary-sage text-white shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {st === "ALL" ? "Semua Status" : st === "PUBLISHED" ? "Tayang" : "Draf"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Grid Kartu Artikel Berita */}
      {isLoading ? (
        <div className="text-center py-12 text-text-muted text-xs">Memuat katalog artikel berita...</div>
      ) : filteredArticles.length === 0 ? (
        <TijarahCard className="p-12 text-center border border-border-subtle rounded-3xl bg-surface">
          <Newspaper className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-40" />
          <h4 className="text-sm font-bold text-text-primary">Tidak Ada Artikel</h4>
          <p className="text-xs text-text-muted mt-1">
            {search ? "Tidak ada artikel yang cocok dengan pencarian Anda." : "Belum ada artikel berita yang diterbitkan."}
          </p>
        </TijarahCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((art) => {
            const catMeta = getCategoryMeta(art.category);

            return (
              <TijarahCard
                key={art.id}
                className="border border-border-subtle rounded-3xl bg-surface overflow-hidden hover:border-primary-sage/40 transition-all flex flex-col justify-between shadow-2xs group"
              >
                <div>
                  {/* Thumbnail Image */}
                  <div className="h-44 w-full bg-canvas relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={art.thumbnailUrl || FALLBACK_THUMBNAIL}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <TijarahBadge tijarahVariant={catMeta.badgeVariant} className="text-[10px] font-bold shadow-xs">
                        {catMeta.label}
                      </TijarahBadge>

                      <TijarahBadge
                        tijarahVariant={art.status === "PUBLISHED" ? "success" : "secondary"}
                        className="text-[10px] font-bold shadow-xs"
                      >
                        {art.status}
                      </TijarahBadge>
                    </div>

                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{art.views} views</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-text-muted">
                      <Calendar className="w-3 h-3 text-primary-sage" />
                      <span>{art.publishedAt?.slice(0, 10) || art.createdAt.slice(0, 10)}</span>
                    </div>

                    <h3 className="font-black text-sm text-text-primary line-clamp-2 leading-snug group-hover:text-primary-sage transition-colors">
                      {art.title}
                    </h3>

                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {art.excerpt || art.content.slice(0, 120)}
                    </p>

                    {/* Tags */}
                    {art.tags && art.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        {art.tags.slice(0, 3).map((tg, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-canvas border border-border-subtle/80 px-1.5 py-0.2 rounded-md text-text-muted"
                          >
                            #{tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3 border-t border-border-subtle/50 flex items-center justify-between bg-canvas/30">
                  <div className="flex items-center gap-1">
                    <TijarahButton
                      size="sm"
                      heroVariant="ghost"
                      onClick={() => setPreviewArticle(art)}
                      className="text-xs font-bold text-primary-sage flex items-center gap-1 px-2 h-7"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </TijarahButton>
                    <a
                      href={`/id/news/${art.id || art.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-text-muted hover:text-primary-sage p-1.5 rounded-lg hover:bg-canvas transition-colors inline-flex items-center gap-1"
                      title="Buka halaman publik artikel (slug)"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <TijarahButton
                      size="sm"
                      heroVariant="ghost"
                      onClick={() => openEditModal(art)}
                      className="text-xs font-bold text-text-primary h-7 px-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </TijarahButton>

                    <TijarahButton
                      size="sm"
                      heroVariant="ghost"
                      onClick={() => setDeletingArticle(art)}
                      className="text-xs font-bold text-status-danger hover:bg-status-danger/10 h-7 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </TijarahButton>
                  </div>
                </div>
              </TijarahCard>
            );
          })}
        </div>
      )}

      {/* 6. Modal Baca / Preview Artikel */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-3xl p-6 w-full max-w-2xl mx-auto shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <div className="flex items-center gap-2">
                <TijarahBadge tijarahVariant="primary" className="text-[10px] font-bold">
                  {previewArticle.category}
                </TijarahBadge>
                <span className="text-xs text-text-muted">{previewArticle.publishedAt?.slice(0, 10)}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="p-1 rounded-lg hover:bg-canvas transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-black text-text-primary leading-tight">
                {previewArticle.title}
              </h2>

              {previewArticle.thumbnailUrl && (
                <div className="h-56 w-full rounded-2xl overflow-hidden bg-canvas">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewArticle.thumbnailUrl}
                    alt={previewArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <p className="text-xs sm:text-sm text-text-primary leading-relaxed whitespace-pre-line">
                {previewArticle.content}
              </p>

              {previewArticle.tags && previewArticle.tags.length > 0 && (
                <div className="pt-3 border-t border-border-subtle flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3 h-3 text-primary-sage" />
                  {previewArticle.tags.map((tg, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-canvas border border-border-subtle px-2 py-0.5 rounded-md font-semibold text-text-muted"
                    >
                      #{tg}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-6 border-t border-border-subtle flex justify-end">
              <TijarahButton
                size="sm"
                tijarahVariant="primary"
                onClick={() => setPreviewArticle(null)}
                className="text-xs font-bold"
              >
                Tutup Pratinjau
              </TijarahButton>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Konfirmasi Hapus */}
      {deletingArticle && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-3xl p-6 w-full max-w-sm mx-auto shadow-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-status-danger/10 text-status-danger flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-text-primary">Hapus Artikel Ini?</h4>
            <p className="text-xs text-text-muted">
              Artikel "<strong>{deletingArticle.title}</strong>" akan dihapus secara permanen dari database.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <TijarahButton
                size="sm"
                tijarahVariant="outline"
                onClick={() => setDeletingArticle(null)}
                className="text-xs font-bold"
              >
                Batal
              </TijarahButton>
              <TijarahButton
                size="sm"
                tijarahVariant="primary"
                onClick={handleDeleteArticle}
                className="text-xs font-bold bg-status-danger hover:bg-status-danger/90 text-white"
              >
                Hapus Permanen
              </TijarahButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPanel;