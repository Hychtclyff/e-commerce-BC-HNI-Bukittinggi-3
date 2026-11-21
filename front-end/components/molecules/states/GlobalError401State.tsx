"use client";

import React from "react";
import { Lock, LogIn, ArrowLeft, ShieldAlert } from "lucide-react";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { Link, useRouter } from "@/lib/i18n/navigation";
import clsx from "clsx";

export interface GlobalError401StateProps {
  title?: string;
  description?: string;
  nextUrl?: string;
  onTriggerLogin?: () => void;
  className?: string;
}

export const GlobalError401State: React.FC<GlobalError401StateProps> = ({
  title = "Sesi Telah Berakhir atau Belum Masuk (401)",
  description = "Akses ke halaman atau data ini memerlukan autentikasi aktif. Silakan masuk ke akun mitra Tijarah Anda untuk melanjutkan.",
  nextUrl,
  onTriggerLogin,
  className,
}) => {
  const router = useRouter();

  const handleLogin = () => {
    if (onTriggerLogin) {
      onTriggerLogin();
      return;
    }
    const target = nextUrl ? `/login?next=${encodeURIComponent(nextUrl)}` : "/login";
    router.push(target);
  };

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-surface border border-accent-gold/30 my-4 transition-all shadow-xs animate-in fade-in-50",
        className
      )}
    >
      <div className="relative mb-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-accent-gold/15 border border-accent-gold/40 flex items-center justify-center text-accent-gold shadow-xs">
          <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent-gold text-white flex items-center justify-center shadow-xs">
          <ShieldAlert className="w-3.5 h-3.5" />
        </div>
      </div>

      <span className="text-[11px] font-bold uppercase tracking-wider text-accent-gold bg-accent-gold/15 px-3 py-0.5 rounded-full mb-2">
        Error 401 • Autentikasi Diperlukan
      </span>

      <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight max-w-md">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-text-muted mt-2 max-w-sm sm:max-w-md leading-relaxed">
        {description}
      </p>

      <div className="flex items-center gap-3 mt-6 flex-wrap justify-center">
        <TijarahButton
          type="button"
          tijarahVariant="primary"
          size="sm"
          onClick={handleLogin}
          className="text-xs font-bold py-2 px-6 flex items-center gap-2 shadow-md shadow-primary-sage/20"
        >
          <LogIn className="w-4 h-4" />
          <span>Masuk ke Akun Saya</span>
        </TijarahButton>

        <Link href="/">
          <TijarahButton
            type="button"
            tijarahVariant="outline"
            size="sm"
            className="text-xs font-semibold py-2 px-4 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </TijarahButton>
        </Link>
      </div>
    </div>
  );
};

export default GlobalError401State;
