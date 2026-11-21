"use client";

import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  HelpCircle,
} from "lucide-react";
import clsx from "clsx";
import { useLocale } from "next-intl";
import { TijarahButton, TijarahButtonVariant } from "./tijarahButton";

export type ModalVariant = "warning" | "danger" | "info" | "success" | "default";

export type BilingualString = string | { id: string; en: string };

export interface TijarahModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: BilingualString;
  description?: BilingualString;
  children?: React.ReactNode;
  variant?: ModalVariant;
  locale?: "id" | "en";

  // Aksi Konfirmasi (Jika disediakan, menjadi Action/Confirmation Modal)
  onConfirm?: () => Promise<void> | void;
  confirmText?: BilingualString;
  confirmVariant?: TijarahButtonVariant;
  isConfirmLoading?: boolean;

  // Aksi Batal / Tutup
  cancelText?: BilingualString;
  showCancelButton?: boolean;

  // Mode statis deskriptif (hanya tombol tutup tunggal)
  closeButtonText?: BilingualString;

  // Penyesuaian layout
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  showCloseIcon?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

/**
 * Helper untuk menerjemahkan teks dwibahasa secara aman
 */
export function resolveBilingual(
  text?: BilingualString,
  currentLocale: "id" | "en" = "id"
): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[currentLocale] || text.id || text.en || "";
}

const variantStyles: Record<
  ModalVariant,
  {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    defaultConfirmVariant: TijarahButtonVariant;
  }
> = {
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-[var(--badge-warning-bg)] border border-status-warning/30",
    iconColor: "text-status-warning",
    defaultConfirmVariant: "primary",
  },
  danger: {
    icon: AlertCircle,
    iconBg: "bg-[var(--badge-danger-bg)] border border-status-danger/30",
    iconColor: "text-status-danger",
    defaultConfirmVariant: "danger",
  },
  info: {
    icon: Info,
    iconBg: "bg-[var(--badge-primary-bg)] border border-[var(--badge-primary-border)]",
    iconColor: "text-primary-sage",
    defaultConfirmVariant: "primary",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-[var(--badge-success-bg)] border border-status-success/30",
    iconColor: "text-status-success",
    defaultConfirmVariant: "primary",
  },
  default: {
    icon: HelpCircle,
    iconBg: "bg-canvas border border-border-subtle",
    iconColor: "text-text-muted",
    defaultConfirmVariant: "primary",
  },
};

const maxWidthStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

export const TijarahModal: React.FC<TijarahModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  variant = "default",
  locale: propLocale,
  onConfirm,
  confirmText,
  confirmVariant,
  isConfirmLoading = false,
  cancelText,
  showCancelButton = true,
  closeButtonText,
  maxWidth = "md",
  showCloseIcon = true,
  closeOnOverlayClick = true,
  className,
  icon: customIcon,
}) => {
  // Ambil locale dari hook next-intl secara aman
  let detectedLocale: "id" | "en" = "id";
  try {
    const loc = useLocale();
    if (loc === "en" || loc === "id") detectedLocale = loc;
  } catch {
    detectedLocale = "id";
  }
  const activeLocale = propLocale || detectedLocale;

  const currentVariant = variantStyles[variant];
  const IconComponent = currentVariant.icon;

  // Keyboard Escape listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isConfirmLoading) {
        onClose();
      }
    },
    [isOpen, isConfirmLoading, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  const resolvedTitle = resolveBilingual(title, activeLocale);
  const resolvedDescription = resolveBilingual(description, activeLocale);

  const defaultConfirmText = activeLocale === "en" ? "Continue" : "Lanjutkan";
  const defaultCancelText = activeLocale === "en" ? "Cancel" : "Batal";
  const defaultCloseText = activeLocale === "en" ? "Close" : "Tutup";

  const resolvedConfirm = resolveBilingual(confirmText, activeLocale) || defaultConfirmText;
  const resolvedCancel = resolveBilingual(cancelText, activeLocale) || defaultCancelText;
  const resolvedClose = resolveBilingual(closeButtonText, activeLocale) || defaultCloseText;

  const hasAction = typeof onConfirm === "function";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (closeOnOverlayClick && !isConfirmLoading) {
                onClose();
              }
            }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              "relative w-full rounded-xl bg-surface border border-border-subtle shadow-xl p-5 z-10 flex flex-col gap-3.5 text-text-primary",
              maxWidthStyles[maxWidth],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button X */}
            {showCloseIcon && (
              <button
                type="button"
                onClick={onClose}
                disabled={isConfirmLoading}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Header: Icon & Title */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
              {variant !== "default" || customIcon ? (
                <div
                  className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    currentVariant.iconBg
                  )}
                >
                  {customIcon ? customIcon : <IconComponent className={clsx("w-5 h-5", currentVariant.iconColor)} />}
                </div>
              ) : null}

              <div className="flex flex-col gap-0.5 min-w-0 pr-6">
                <h3 className="text-sm sm:text-base font-bold text-text-primary leading-snug">
                  {resolvedTitle}
                </h3>
                {resolvedDescription && (
                  <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line">
                    {resolvedDescription}
                  </p>
                )}
              </div>
            </div>

            {/* Custom Content Body (opsional jika modal kustom) */}
            {children && <div className="mt-0.5">{children}</div>}

            {/* Footer Buttons */}
            <div className="mt-1 pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
              {hasAction ? (
                // ── Mode Modal dengan Aksi (Action / Confirmation) ────
                <>
                  {showCancelButton && (
                    <TijarahButton
                      type="button"
                      tijarahVariant="ghost"
                      onClick={onClose}
                      isDisabled={isConfirmLoading}
                      className="px-4 py-2 text-sm"
                    >
                      {resolvedCancel}
                    </TijarahButton>
                  )}

                  <TijarahButton
                    type="button"
                    tijarahVariant={confirmVariant || currentVariant.defaultConfirmVariant}
                    onClick={onConfirm}
                    isLoading={isConfirmLoading}
                    className="font-bold px-5 py-2 text-sm"
                  >
                    {resolvedConfirm}
                  </TijarahButton>
                </>
              ) : (
                // ── Mode Modal Tanpa Aksi / Statis Deskriptif ────────
                <TijarahButton
                  type="button"
                  tijarahVariant="primary"
                  onClick={onClose}
                  className="px-5 py-2 text-sm font-semibold"
                >
                  {resolvedClose}
                </TijarahButton>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TijarahModal;
