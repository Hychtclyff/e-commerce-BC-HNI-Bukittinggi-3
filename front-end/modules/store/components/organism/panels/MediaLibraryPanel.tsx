"use client";

import React, { useEffect, useState } from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTabs } from "@/components/atom/tijarahTabs";
import {
  ImageIcon,
  FileText,
  Trash2,
  ExternalLink,
  Copy,
  RefreshCw,
  Search,
} from "lucide-react";
import { mediaApi, type MediaAsset } from "@/modules/media/api/media.api";
import { MediaUploader } from "@/modules/media/components/MediaUploader";
import { showToast } from "@/utils/toast";
import { formatDate } from "@/utils/formatters";

export const MediaLibraryPanel: React.FC = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "IMAGE" | "PDF">("ALL");
  const [search, setSearch] = useState("");

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const data = await mediaApi.listMedia({
        type: typeFilter,
        search: search.trim() || undefined,
      });
      setAssets(data);
    } catch (err: any) {
      showToast.error("Gagal Memuat Media", err?.message || "Tidak dapat mengambil daftar media.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAssets();
  }, [typeFilter]);

  const handleOpenAsset = async (asset: MediaAsset) => {
    try {
      const { url } = await mediaApi.getAccessUrl(asset.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      showToast.error("Gagal Membuka File", err?.message || "Tidak dapat membuat URL akses.");
    }
  };

  const handleCopyUrl = async (asset: MediaAsset) => {
    try {
      const { url } = await mediaApi.getAccessUrl(asset.id);
      await navigator.clipboard.writeText(url);
      showToast.success("URL Disalin", asset.fileName);
    } catch (err: any) {
      showToast.error("Gagal Menyalin", err?.message || "Tidak dapat menyalin URL.");
    }
  };

  const handleDelete = async (asset: MediaAsset) => {
    try {
      await mediaApi.deleteMedia(asset.id);
      setAssets((prev) => prev.filter((item) => item.id !== asset.id));
      showToast.success("Aset Dihapus", `${asset.fileName} telah dihapus.`);
    } catch (err: any) {
      showToast.error("Gagal Menghapus", err?.message || "Tidak dapat menghapus aset.");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-black text-text-primary tracking-tight">
              Manajemen Media &amp; Dokumen PDF
            </h2>
            <TijarahBadge tijarahVariant="primary" className="text-[10px] font-bold">
              Supabase Storage
            </TijarahBadge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Kelola gambar produk, thumbnail berita, foto profil, dan arsip dokumen PDF secara terpusat.
          </p>
        </div>

        <TijarahButton
          type="button"
          size="sm"
          tijarahVariant="outline"
          onClick={() => void loadAssets()}
          isLoading={isLoading}
          className="text-xs font-semibold shrink-0 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Muat Ulang</span>
        </TijarahButton>
      </div>

      <MediaUploader
        accept="both"
        category="DOCUMENT"
        label="Unggah Cepat Gambar atau Dokumen PDF"
        helperText="Gambar disimpan ke bucket publik (tijarah-media), PDF ke bucket privat (tijarah-docs)"
        onChange={() => {
          void loadAssets();
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <TijarahTabs
          selectedKey={typeFilter}
          onSelectionChange={(key) => setTypeFilter(key as "ALL" | "IMAGE" | "PDF")}
          variant="segmented"
          items={[
            { id: "ALL", label: "Semua" },
            { id: "IMAGE", label: "Gambar", icon: <ImageIcon className="w-3.5 h-3.5" /> },
            { id: "PDF", label: "Dokumen PDF", icon: <FileText className="w-3.5 h-3.5" /> },
          ]}
        />

        <div className="flex items-center gap-2 w-full sm:w-72">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <TijarahInput
              placeholder="Cari nama file..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void loadAssets();
              }}
              className="text-xs pl-8"
            />
          </div>
        </div>
      </div>

      {assets.length === 0 ? (
        <TijarahCard className="border border-dashed border-border-subtle bg-canvas/40 p-12 text-center text-xs text-text-muted">
          {isLoading ? "Memuat daftar media..." : "Belum ada file gambar atau PDF yang diunggah."}
        </TijarahCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => {
            const isPdf = asset.mimeType === "application/pdf";
            return (
              <TijarahCard key={asset.id} className="border border-border-subtle bg-surface p-3.5 space-y-3">
                {isPdf ? (
                  <div className="h-36 rounded-xl bg-status-danger/10 border border-status-danger/20 flex flex-col items-center justify-center gap-2">
                    <FileText className="w-10 h-10 text-status-danger" />
                    <TijarahBadge tijarahVariant="danger" className="text-[10px] font-bold">
                      PDF Privat (Signed URL)
                    </TijarahBadge>
                  </div>
                ) : (
                  <div className="h-36 rounded-xl overflow-hidden border border-border-subtle bg-canvas">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.publicUrl || ""}
                      alt={asset.fileName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-text-primary truncate flex items-center gap-1.5">
                      {isPdf ? (
                        <FileText className="w-3.5 h-3.5 text-status-danger shrink-0" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-primary-sage shrink-0" />
                      )}
                      <span className="truncate">{asset.fileName}</span>
                    </span>
                    <TijarahBadge tijarahVariant="secondary" className="text-[10px] shrink-0">
                      {asset.category}
                    </TijarahBadge>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {formatBytes(asset.sizeBytes)} • {formatDate(asset.createdAt)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-subtle">
                  <div className="flex items-center gap-1.5">
                    <TijarahButton
                      type="button"
                      size="sm"
                      tijarahVariant="outline"
                      onClick={() => void handleOpenAsset(asset)}
                      className="h-7 text-[11px] px-2.5 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka</span>
                    </TijarahButton>
                    <TijarahButton
                      type="button"
                      size="sm"
                      tijarahVariant="outline"
                      onClick={() => void handleCopyUrl(asset)}
                      className="h-7 text-[11px] px-2.5 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin URL</span>
                    </TijarahButton>
                  </div>
                  <TijarahButton
                    type="button"
                    size="sm"
                    tijarahVariant="danger"
                    onClick={() => void handleDelete(asset)}
                    aria-label="Hapus aset"
                    className="h-7 px-2 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </TijarahButton>
                </div>
              </TijarahCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MediaLibraryPanel;
