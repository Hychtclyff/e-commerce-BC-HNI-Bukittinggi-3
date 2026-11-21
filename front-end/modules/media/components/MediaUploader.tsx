"use client";

import React, { useRef, useState } from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import {
  UploadCloud,
  ImageIcon,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { mediaApi, type MediaAsset, type MediaCategory } from "../api/media.api";
import { showToast } from "@/utils/toast";

export interface MediaUploaderProps {
  value?: string;
  onChange: (url: string, asset?: MediaAsset) => void;
  category?: MediaCategory;
  entityId?: string;
  accept?: "image" | "pdf" | "both";
  label?: string;
  helperText?: string;
  allowManualUrl?: boolean;
  compact?: boolean;
}

const IMAGE_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const PDF_MIME = "application/pdf";

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  value = "",
  onChange,
  category = "GENERAL",
  entityId,
  accept = "image",
  label = "Unggah Gambar",
  helperText,
  allowManualUrl = false,
  compact = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAsset, setUploadedAsset] = useState<MediaAsset | null>(null);

  const acceptAttr =
    accept === "image"
      ? "image/jpeg,image/png,image/webp,image/gif"
      : accept === "pdf"
      ? "application/pdf"
      : "image/jpeg,image/png,image/webp,image/gif,application/pdf";

  const validateFile = (file: File): string | null => {
    const isImage = IMAGE_MIMES.includes(file.type);
    const isPdf = file.type === PDF_MIME;

    if (accept === "image" && !isImage) {
      return "Format gambar harus JPG, PNG, WEBP, atau GIF.";
    }
    if (accept === "pdf" && !isPdf) {
      return "Format dokumen harus PDF.";
    }
    if (accept === "both" && !isImage && !isPdf) {
      return "Format file harus gambar (JPG/PNG/WEBP/GIF) atau PDF.";
    }

    const maxBytes = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return isPdf ? "Ukuran PDF maksimal 10 MB." : "Ukuran gambar maksimal 5 MB.";
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const errMsg = validateFile(file);
    if (errMsg) {
      showToast.error("File Tidak Valid", errMsg);
      return;
    }

    setIsUploading(true);
    try {
      const asset = await mediaApi.uploadMedia(file, { category, entityId });
      setUploadedAsset(asset);

      let resolvedUrl = asset.publicUrl || "";
      if (!resolvedUrl) {
        const signed = await mediaApi.getAccessUrl(asset.id);
        resolvedUrl = signed.url;
      }

      onChange(resolvedUrl, asset);
      showToast.success("Upload Berhasil", `${asset.fileName} berhasil disimpan.`);
    } catch (err: any) {
      showToast.error("Gagal Upload", err?.message || "Gagal mengunggah file ke Supabase.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const isPdfPreview =
    uploadedAsset?.mimeType === PDF_MIME || value.toLowerCase().includes(".pdf");

  return (
    <div className="space-y-2.5 w-full">
      {label && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-text-primary">{label}</span>
          <TijarahBadge tijarahVariant="primary" className="text-[10px]">
            {accept === "pdf" ? "PDF Max 10MB" : accept === "both" ? "IMG / PDF" : "JPG / PNG / WEBP Max 5MB"}
          </TijarahBadge>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <TijarahCard
        className={`border-2 border-dashed transition-colors shadow-none ${
          isDragging
            ? "border-primary-sage bg-primary-sage/10"
            : "border-border-subtle bg-canvas/40 hover:border-primary-sage/60"
        }`}
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          onClick={() => !isUploading && inputRef.current?.click()}
          className={`cursor-pointer flex flex-col items-center justify-center text-center gap-2 ${
            compact ? "p-3" : "p-4 sm:p-5"
          }`}
        >
          {isUploading ? (
            <div className="w-full max-w-xs space-y-2 py-2">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary-sage">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mengunggah ke Supabase Storage...</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-primary-sage/20 overflow-hidden">
                <div className="h-full w-1/2 bg-primary-sage rounded-full animate-pulse" />
              </div>
            </div>
          ) : value ? (
            <div
              className="w-full flex flex-col sm:flex-row items-center gap-3 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {isPdfPreview ? (
                <div className="w-16 h-16 rounded-xl bg-status-danger/10 border border-status-danger/30 flex items-center justify-center shrink-0">
                  <FileText className="w-7 h-7 text-status-danger" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-border-subtle bg-surface shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={value}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span className="truncate">
                    {uploadedAsset?.fileName || "File Terpasang"}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted truncate">{value}</p>
                <div className="flex items-center gap-2 pt-1">
                  <TijarahButton
                    type="button"
                    size="sm"
                    tijarahVariant="primary"
                    onClick={() => inputRef.current?.click()}
                    className="h-7 text-[11px] font-semibold px-2.5 flex items-center gap-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Ganti File</span>
                  </TijarahButton>
                  <TijarahButton
                    type="button"
                    size="sm"
                    tijarahVariant="danger"
                    onClick={() => {
                      setUploadedAsset(null);
                      onChange("");
                    }}
                    className="h-7 text-[11px] font-semibold px-2.5 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </TijarahButton>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-primary-sage/10 text-primary-sage flex items-center justify-center">
                {accept === "pdf" ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-text-primary">
                  Tarik &amp; lepas (Drag &amp; Drop) file di sini
                </p>
                <p className="text-[11px] text-text-muted">
                  {helperText || "atau klik area ini untuk memilih file dari perangkat"}
                </p>
              </div>
              <TijarahButton
                type="button"
                size="sm"
                tijarahVariant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="h-7 text-[11px] font-semibold mt-1 px-3 flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Pilih File</span>
              </TijarahButton>
            </>
          )}
        </div>
      </TijarahCard>

      {allowManualUrl && (
        <TijarahInput
          label="Atau tempel URL eksternal"
          placeholder="https://..."
          value={value}
          onChange={(e) => {
            setUploadedAsset(null);
            onChange(e.target.value);
          }}
          className="text-xs"
        />
      )}
    </div>
  );
};

export default MediaUploader;
