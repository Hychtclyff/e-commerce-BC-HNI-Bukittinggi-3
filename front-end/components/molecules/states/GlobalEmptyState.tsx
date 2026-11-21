"use client";

import React from "react";
import { PackageOpen, ArrowRight, RefreshCw } from "lucide-react";
import { TijarahButton } from "@/components/atom/tijarahButton";
import clsx from "clsx";

export interface GlobalEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const GlobalEmptyState: React.FC<GlobalEmptyStateProps> = ({
  title = "Belum Ada Data",
  description = "Tidak ada data yang tersedia untuk ditampilkan saat ini.",
  icon,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  className,
}) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-surface border border-dashed border-border-subtle my-4 transition-all animate-in fade-in-50",
        className
      )}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-canvas border border-border-subtle flex items-center justify-center text-primary-sage shadow-xs mb-4">
        {icon || <PackageOpen className="w-8 h-8 sm:w-10 sm:h-10 opacity-60 text-primary-sage" />}
      </div>

      <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight max-w-md">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-text-muted mt-1.5 max-w-sm sm:max-w-md leading-relaxed">
        {description}
      </p>

      {(actionText || secondaryActionText) && (
        <div className="flex items-center gap-3 mt-6 flex-wrap justify-center">
          {actionText && onAction && (
            <TijarahButton
              type="button"
              tijarahVariant="primary"
              size="sm"
              onClick={onAction}
              className="text-xs font-bold py-2 px-5 flex items-center gap-1.5 shadow-sm"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </TijarahButton>
          )}

          {secondaryActionText && onSecondaryAction && (
            <TijarahButton
              type="button"
              tijarahVariant="outline"
              size="sm"
              onClick={onSecondaryAction}
              className="text-xs font-semibold py-2 px-4"
            >
              {secondaryActionText}
            </TijarahButton>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalEmptyState;
