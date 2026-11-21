"use client";

import React, { useEffect, useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { useRouter } from "@/lib/i18n/navigation";

export const GlobalLoginModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("/profile");
  const router = useRouter();

  useEffect(() => {
    const handleUnauthorized = (e: any) => {
      const url = e.detail?.redirectUrl || window.location.pathname;
      setRedirectPath(url);
      setIsOpen(true);
    };

    window.addEventListener("unauthorized_session", handleUnauthorized);
    return () => {
      window.removeEventListener("unauthorized_session", handleUnauthorized);
    };
  }, []);

  const handleNavigateLogin = () => {
    setIsOpen(false);
    const target = `/login?next=${encodeURIComponent(redirectPath)}`;
    router.push(target);
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={{ id: "Sesi Masuk Berakhir (401)", en: "Session Expired (401)" }}
      description={{
        id: "Permintaan data memerlukan sesi login aktif. Silakan masuk kembali ke akun mitra Tijarah Anda untuk melanjutkan.",
        en: "Data request requires an active login session. Please sign in to your Tijarah partner account to continue.",
      }}
      variant="warning"
      icon={<Lock className="w-6 h-6 text-accent-gold" />}
      maxWidth="sm"
      showCloseIcon
      onConfirm={handleNavigateLogin}
      confirmText={{ id: "Masuk Sekarang", en: "Login Now" }}
      confirmVariant="primary"
      showCancelButton
      cancelText={{ id: "Tutup", en: "Close" }}
    />
  );
};

export default GlobalLoginModal;
