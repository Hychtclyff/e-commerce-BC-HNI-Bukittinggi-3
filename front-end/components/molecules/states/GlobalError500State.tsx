"use client";

import React from "react";
import { ServerCrash, RefreshCw, MessageSquare, AlertTriangle } from "lucide-react";
import { TijarahButton } from "@/components/atom/tijarahButton";
import clsx from "clsx";

export interface GlobalError500StateProps {
  title?: string;
  description?: string;
  errorMessage?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export const GlobalError500State: React.FC<GlobalError500StateProps> = ({
  title = "Terjadi Gangguan pada Server (500)",
  description = "Layanan backend sedang mengalami kendala sementara atau sedang dalam pemeliharaan. Silakan coba memuat ulang beberapa saat lagi.",
  errorMessage,
  onRetry,
  isRetrying = false,
  className,
}) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-surface border border-status-danger/25 my-4 transition-all shadow-xs animate-in fade-in-50",
        className
      )}
    >
      <div className="relative mb-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-status-danger/10 border border-status-danger/30 flex items-center justify-center text-status-danger shadow-xs">
          <ServerCrash className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-status-danger text-white flex items-center justify-center shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
      </div>

      <span className="text-[11px] font-bold uppercase tracking-wider text-status-danger bg-status-danger/10 px-3 py-0.5 rounded-full mb-2">
        Error 500 • Internal Server Error
      </span>

      <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight max-w-md">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-text-muted mt-2 max-w-sm sm:max-w-md leading-relaxed">
        {description}
      </p>

      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-xl bg-canvas border border-border-subtle max-w-md w-full text-[11px] font-mono text-status-danger text-left truncate">
          Detail: {errorMessage}
        </div>
      )}

      <div className="flex items-center gap-3 mt-6 flex-wrap justify-center">
        {onRetry && (
          <TijarahButton
            type="button"
            tijarahVariant="primary"
            size="sm"
            onClick={onRetry}
            isDisabled={isRetrying}
            className="text-xs font-bold py-2 px-5 flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5", isRetrying && "animate-spin")} />
            <span>{isRetrying ? "Memuat Ulang..." : "Coba Muat Ulang"}</span>
          </TijarahButton>
        )}

        <a
          href="https://wa.me/6281234567890?text=Halo%20Admin%20BC3%20Tijarah%2C%20saya%20mengalami%20gangguan%20server%20500."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-border-subtle bg-canvas hover:bg-surface text-text-primary transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5 text-status-success" />
          <span>Hubungi Bantuan Toko</span>
        </a>
      </div>
    </div>
  );
};

export default GlobalError500State;
