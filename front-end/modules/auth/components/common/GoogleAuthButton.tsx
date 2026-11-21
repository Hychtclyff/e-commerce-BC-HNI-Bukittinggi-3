"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { authService } from "@/modules/auth/services/auth.service";
import { loginWithGoogle } from "@/app/[lang]/(auth)/actions";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahAlert } from "@/components/atom/tijarahAlert";

export interface GoogleAuthButtonProps {
    mode?: "login" | "register";
    label: string;
}

export function GoogleAuthButton({ mode = "login", label }: GoogleAuthButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleClick = () => {
        setError(null);
        startTransition(async () => {
            try {
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                const pathname = typeof window !== "undefined" ? window.location.pathname : "";
                const localeMatch = pathname.match(/^\/(id|en)/);
                const locale = localeMatch ? localeMatch[1] : "id";
                const nextPath = mode === "register" ? `/${locale}/profile/complete` : `/${locale}`;
                const redirectTo = `${origin}/${locale}/auth/callback?next=${nextPath}`;

                // Try Backend Google OAuth URL Endpoint first (Per PANDUAN_AUTH_BACKEND)
                try {
                    const res = await authService.getGoogleOAuthUrl(redirectTo);
                    const authUrl = res?.data?.url || res?.url || (typeof res?.data === "string" ? res.data : null);
                    if (authUrl) {
                        window.location.href = authUrl;
                        return;
                    }
                } catch (backendErr) {
                    console.warn("Backend getGoogleOAuthUrl fallback to Supabase OAuth Server Action", backendErr);
                }

                // Fallback to Server Action (Supabase OAuth)
                await loginWithGoogle(mode);
            } catch (err: any) {
                setError(err?.message || "Gagal terhubung ke Google. Coba lagi.");
            }
        });
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <motion.div
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
                <TijarahButton
                    id={`google-${mode}-btn`}
                    type="button"
                    onClick={handleClick}
                    isLoading={isPending}
                    tijarahVariant="secondary"
                    className="w-full font-semibold shadow-sm py-2.5 border border-border-subtle hover:bg-canvas transition-all duration-200 flex items-center justify-center gap-3"
                >
                    {!isPending && (
                        <svg
                            aria-hidden="true"
                            className="h-5 w-5 shrink-0"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                    )}
                    <span>{isPending ? "Menghubungkan..." : label}</span>
                </TijarahButton>
            </motion.div>

            {error && (
                <TijarahAlert
                    tijarahVariant="danger"
                    title="Koneksi Gagal"
                    description={error}
                    className="w-full text-xs mt-1"
                />
            )}
        </div>
    );
}

export default GoogleAuthButton;
