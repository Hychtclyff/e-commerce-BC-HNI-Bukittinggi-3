"use client";

import { useState, useEffect, useTransition } from "react";
import { authService } from "@/modules/auth/services/auth.service";
import clsx from "clsx";
import { TijarahButton } from "@/components/atom/tijarahButton";

/**
 * Variasi styling kustom untuk tombol Kirim Ulang Verifikasi / OTP
 */
export const RESEND_BTN_VARIANTS = {
    link: "text-sm font-semibold text-primary-sage hover:text-primary-dark hover:underline transition-colors p-0 bg-transparent shadow-none border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-0 h-auto",
    button: "w-full rounded-xl border border-border-subtle bg-canvas px-4 py-2.5 text-sm font-semibold text-text-primary transition-all hover:bg-surface hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "px-3 py-1.5 rounded-lg text-sm font-semibold text-primary-sage hover:bg-primary-sage/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "w-full rounded-xl border border-primary-sage px-4 py-2 text-sm font-semibold text-primary-sage hover:bg-primary-sage hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed",
} as const;

export type ResendBtnVariant = keyof typeof RESEND_BTN_VARIANTS;

export interface ResendVerificationButtonProps {
    email?: string;
    label?: string;
    loadingLabel?: string;
    type?: "signup" | "email_change";
    initialCooldown?: number; // State awal cooldown (default 60s)
    variant?: ResendBtnVariant;
    className?: string;
}

export function ResendVerificationButton({
    email = "",
    label = "Resend Code",
    loadingLabel = "Sending...",
    type = "signup",
    initialCooldown = 60,
    variant = "link",
    className = "",
}: ResendVerificationButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [cooldown, setCooldown] = useState(initialCooldown);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [successText, setSuccessText] = useState<string | null>(null);

    // Countdown timer 60 detik
    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [cooldown]);

    const handleResend = () => {
        if (cooldown > 0 || !email) return;
        setErrorText(null);
        setSuccessText(null);

        startTransition(async () => {
            try {
                const res = await authService.resendOtp(email, type);
                if (res?.error) {
                    setErrorText(res.error);
                } else {
                    const cd =
                        res?.data?.cooldownSeconds ||
                        res?.data?.cooldown ||
                        res?.cooldownSeconds ||
                        res?.cooldown ||
                        60;
                    setSuccessText(res?.message || "Kode OTP baru telah dikirim ke email Anda.");
                    setCooldown(cd);
                }
            } catch (err: any) {
                console.error("Gagal mengirim ulang OTP:", err);
                const msg =
                    err?.response?.data?.message ||
                    err?.data?.message ||
                    err?.message ||
                    "Gagal mengirim ulang kode OTP.";

                setErrorText(msg);

                const cd =
                    err?.response?.data?.data?.cooldownSeconds ||
                    err?.response?.data?.cooldownSeconds ||
                    err?.data?.cooldownSeconds ||
                    60;

                // Jika error berkenaan dengan rate limit 60s, jalankan cooldown dari BE
                if (
                    msg.includes("60 seconds") ||
                    msg.includes("rate limit") ||
                    msg.includes("security purposes") ||
                    err?.response?.status === 429
                ) {
                    setCooldown(cd);
                }
            }
        });
    };

    const isDisabled = isPending || cooldown > 0 || !email;
    const variantStyle = RESEND_BTN_VARIANTS[variant] || RESEND_BTN_VARIANTS.link;

    return (
        <div className="flex flex-col items-center gap-1.5 w-full">
            <TijarahButton
                id="resend-verification-btn"
                type="button"
                tijarahVariant="ghost"
                size="sm"
                onPress={handleResend}
                isDisabled={isDisabled}
                isLoading={isPending}
                className={clsx(variantStyle, className)}
            >
                {isPending ? (
                    <span>{loadingLabel}</span>
                ) : cooldown > 0 ? (
                    <span className="text-text-muted">
                        {label} ({cooldown}s)
                    </span>
                ) : (
                    <span>{label}</span>
                )}
            </TijarahButton>

            {errorText && (
                <p className="text-xs text-status-danger text-center animate-fadeIn font-medium">
                    {errorText}
                </p>
            )}

            {successText && (
                <p className="text-xs text-status-success text-center animate-fadeIn font-medium">
                    {successText}
                </p>
            )}
        </div>
    );
}

export default ResendVerificationButton;
