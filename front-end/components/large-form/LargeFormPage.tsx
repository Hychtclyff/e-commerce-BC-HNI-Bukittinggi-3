"use client";

import React from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { ArrowLeft, Save, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export interface LargeFormSection {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface LargeFormPageProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onBack?: () => void;
  onSave?: () => void | Promise<void>;
  onSaveDraft?: () => void | Promise<void>;
  isSaving?: boolean;
  isDraftSaving?: boolean;
  saveButtonText?: string;
  draftButtonText?: string;
  showDraftButton?: boolean;
  isDirty?: boolean;
  sections?: LargeFormSection[];
  children?: React.ReactNode;
  sidebarSummary?: React.ReactNode;
}

export const LargeFormPage: React.FC<LargeFormPageProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  onBack,
  onSave,
  onSaveDraft,
  isSaving = false,
  isDraftSaving = false,
  saveButtonText = "Simpan Perubahan",
  draftButtonText = "Simpan Draf",
  showDraftButton = true,
  isDirty = false,
  sections = [],
  children,
  sidebarSummary,
}) => {
  return (
    <div className="w-full min-h-screen bg-canvas pb-16 font-sans text-text-primary antialiased">
      {/* 1. Sticky Action Header (Navigation + Primary Actions) */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border-subtle px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Sisi Kiri: Tombol Kembali & Breadcrumb & Judul */}
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-9 h-9 rounded-xl border border-border-subtle bg-surface hover:bg-canvas text-text-muted hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Kembali"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div>
              {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-0.5">
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                      {crumb.href ? (
                        <Link href={crumb.href} className="hover:text-primary-sage transition-colors">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span>{crumb.label}</span>
                      )}
                      {idx < breadcrumbs.length - 1 && <span className="opacity-50">/</span>}
                    </React.Fragment>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-text-primary leading-tight">
                  {title}
                </h1>
                {isDirty && (
                  <TijarahBadge tijarahVariant="warning" className="text-[10px] font-bold">
                    Ada Perubahan
                  </TijarahBadge>
                )}
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onBack && (
              <TijarahButton
                size="sm"
                tijarahVariant="outline"
                onClick={onBack}
                className="text-xs font-bold px-3"
              >
                Batal
              </TijarahButton>
            )}

            {showDraftButton && onSaveDraft && (
              <TijarahButton
                size="sm"
                tijarahVariant="secondary"
                onClick={onSaveDraft}
                isDisabled={isDraftSaving || isSaving}
                className="text-xs font-bold px-3"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                {isDraftSaving ? "Menyimpan Draf..." : draftButtonText}
              </TijarahButton>
            )}

            {onSave && (
              <TijarahButton
                size="sm"
                tijarahVariant="primary"
                onClick={onSave}
                isDisabled={isSaving}
                className="text-xs font-bold px-4 shadow-sm"
              >
                <Save className={`w-3.5 h-3.5 mr-1.5 ${isSaving ? "animate-spin" : ""}`} />
                {isSaving ? "Menyimpan..." : saveButtonText}
              </TijarahButton>
            )}
          </div>
        </div>
      </header>

      {/* 2. Subtitle / Notification Bar */}
      {subtitle && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-2">
          <p className="text-xs text-text-muted">{subtitle}</p>
        </div>
      )}

      {/* 3. Main Form Container (Split 2 Kolom atau Single Full Column) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-4">
        {sidebarSummary ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kolom Kiri: Form Sections Utama */}
            <div className="lg:col-span-8 space-y-6">
              {sections.length > 0
                ? sections.map((sec) => (
                    <TijarahCard
                      key={sec.id}
                      className="p-6 border border-border-subtle rounded-3xl bg-surface shadow-2xs space-y-4"
                    >
                      <div className="border-b border-border-subtle pb-3">
                        <div className="flex items-center gap-2">
                          {sec.icon && <span className="text-primary-sage">{sec.icon}</span>}
                          <h3 className="font-bold text-sm text-text-primary">{sec.title}</h3>
                        </div>
                        {sec.description && (
                          <p className="text-xs text-text-muted mt-0.5">{sec.description}</p>
                        )}
                      </div>
                      <div>{sec.content}</div>
                    </TijarahCard>
                  ))
                : children}
            </div>

            {/* Kolom Kanan: Sticky Sidebar Ringkasan */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              {sidebarSummary}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {sections.length > 0
              ? sections.map((sec) => (
                  <TijarahCard
                    key={sec.id}
                    className="p-6 border border-border-subtle rounded-3xl bg-surface shadow-2xs space-y-4"
                  >
                    <div className="border-b border-border-subtle pb-3">
                      <div className="flex items-center gap-2">
                        {sec.icon && <span className="text-primary-sage">{sec.icon}</span>}
                        <h3 className="font-bold text-sm text-text-primary">{sec.title}</h3>
                      </div>
                      {sec.description && (
                        <p className="text-xs text-text-muted mt-0.5">{sec.description}</p>
                      )}
                    </div>
                    <div>{sec.content}</div>
                  </TijarahCard>
                ))
              : children}
          </div>
        )}
      </main>
    </div>
  );
};

export default LargeFormPage;
