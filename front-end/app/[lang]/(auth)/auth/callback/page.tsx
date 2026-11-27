"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { authService } from "@/modules/auth/services/auth.service";
import { useAuthStore } from "@/modules/auth/services/auth.store";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const lang = (params?.lang as string) || "id";
  const [statusText, setStatusText] = useState("Memproses autentikasi...");
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    let isMounted = true;

    const processCallback = async () => {
      try {
        let savedNext: string | null = null;
        if (typeof window !== "undefined") {
          try {
            savedNext = sessionStorage.getItem("oauth_next");
            if (savedNext) sessionStorage.removeItem("oauth_next");
          } catch {
            savedNext = null;
          }
        }
        const next = searchParams.get("next") || savedNext || `/${lang}`;
        const queryError =
          searchParams.get("error_description") || searchParams.get("error");
        if (queryError) {
          router.replace(`/${lang}/login?error=${encodeURIComponent(queryError)}`);
          return;
        }

        const code = searchParams.get("code");

        // ── 1. Penanganan PKCE Code (?code=...) ─────────────────────────────
        if (code) {
          if (isMounted) setStatusText("Mengubah kode verifikasi...");
          const res = await authService.exchangeCode(code);
          const payload = res?.data ?? res;
          if (res?.error) {
            router.replace(`/${lang}/login?error=${encodeURIComponent(res.error)}`);
            return;
          }
          if (payload?.requireOtp) {
            const targetEmail = payload.email || "";
            router.replace(
              `/${lang}/verify-email?email=${encodeURIComponent(targetEmail)}`
            );
            return;
          }
          router.replace(next);
          return;
        }

        // ── 2. Penanganan Implicit Grant Hash Fragment (#access_token=...) ─
        const hash = typeof window !== "undefined" ? window.location.hash : "";

        if (hash && hash.includes("error=")) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const errorDesc =
            hashParams.get("error_description") ||
            hashParams.get("error") ||
            "Autentikasi gagal";
          router.replace(`/${lang}/login?error=${encodeURIComponent(errorDesc)}`);
          return;
        }

        if (hash && hash.includes("access_token=")) {
          if (isMounted) setStatusText("Menyimpan sesi pengguna...");
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token") || "";
          const type = hashParams.get("type");

          if (accessToken) {
            const response = await authService.authHashCode(accessToken, refreshToken);
            const payload = response?.data ?? response;

            if (payload?.requireOtp) {
              const targetEmail = payload.email || "";
              router.replace(
                `/${lang}/verify-email?email=${encodeURIComponent(targetEmail)}`
              );
              return;
            }

            if (response?.error) {
              router.replace(
                `/${lang}/login?error=${encodeURIComponent(response.error)}`
              );
              return;
            }

            if (payload?.appToken || payload?.token) {
              setAuth({
                user: payload.user || null,
                accessToken: payload.appToken || payload.token,
                refreshToken: payload.refreshToken || refreshToken || null,
              });
            }

            // Bersihkan URL hash agar token tidak berada di address bar
            window.history.replaceState(null, "", window.location.pathname);

            if (type === "signup" || type === "email_change") {
              router.replace(`/${lang}?success=email-verified`);
            } else if (type === "recovery") {
              router.replace(`/${lang}/profile`);
            } else {
              router.replace(next);
            }
            return;
          }
        }

        // ── 3. Fallback jika tidak ada code maupun hash token ────────────────
        router.replace(`/${lang}/login?error=oauth-callback-failed`);
      } catch (err: any) {
        console.error("Callback error:", err);
        router.replace(
          `/${lang}/login?error=${encodeURIComponent(err?.message || "Autentikasi gagal")}`
        );
      }
    };

    processCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams, params, router, lang]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-subtle bg-surface-card p-8 shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-sage border-t-transparent" />
        <p className="text-sm font-medium text-text-primary">{statusText}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-subtle bg-surface-card p-8 shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-sage border-t-transparent" />
            <p className="text-sm font-medium text-text-primary">Memproses autentikasi...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
