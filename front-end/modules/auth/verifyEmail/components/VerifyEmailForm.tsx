"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/modules/auth/services/auth.service";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import { Link } from "@/lib/i18n/navigation";
import { AuthAlert } from "@/modules/auth/components/common/AuthAlert";
import { ResendVerificationButton } from "./ResendVerificationButton";
import { InputOTP } from "@heroui/react";

export const VerifyEmailForm = () => {
    const t = useTranslations("Auth");
    const searchParams = useSearchParams();
    const router = useRouter();
    const params = useParams();
    const lang = (params?.lang as string) || "id";
    const user = useAuthStore((state) => state.user);
    const email = searchParams.get("email") || user?.email || "";

    const [otp, setOtp] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { mutate: verifyOtp, isPending } = useMutation({
        mutationFn: (code: string) => authService.verifyOtp(email, code),
        onSuccess: (data) => {
            if (data?.error) {
                setErrorMessage(data.error);
                return;
            }
            // Setelah OTP berhasil diverifikasi, redirect ke homepage
            router.push(`/${lang}?success=email-verified`);
            router.refresh();
        },
        onError: (err: any) => {
            setErrorMessage(err?.message || "Verifikasi OTP gagal. Silakan coba lagi.");
        },
    });

    useEffect(() => {
        if (otp && otp.trim().length === 6 && email) {
            setErrorMessage(null);
            verifyOtp(otp.trim());
        }
    }, [otp, email, verifyOtp]);

    return (
        <div className="w-full max-w-md">
            <div className="relative overflow-hidden bg-surface border border-border-subtle rounded-3xl shadow-lg p-8 md:p-10">
                {/* Decorative blobs */}
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary-sage/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-accent-gold/8 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-6 justify-center items-center">
                    <div>
                        {/* Animated envelope icon */}
                        <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-primary-sage/10 mb-5">
                            <svg
                                className="w-10 h-10 text-primary-sage animate-[fadeInDown_0.5s_ease_both]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-extrabold text-text-primary text-center">
                            {t("verifyEmailTitle")}
                        </h1>
                        <p className="mt-3 text-sm text-text-muted leading-relaxed max-w-xs mx-auto">
                            {t("verifyEmailDesc")}
                        </p>
                        {email && (
                            <p className="mt-2 text-sm font-semibold text-primary-sage break-all text-center">
                                {decodeURIComponent(email)}
                            </p>
                        )}
                    </div>

                    {errorMessage && (
                        <div className="rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-xs text-status-danger">
                            {errorMessage}
                        </div>
                    )}

                    <Suspense fallback={null}>
                        <AuthAlert />
                    </Suspense>

                    <div className="flex flex-col items-center justify-center gap-2">
                        <InputOTP
                            value={otp}
                            onChange={(val) => setOtp(val)}
                            maxLength={6}
                            isDisabled={isPending}
                        >
                            <InputOTP.Group>
                                <InputOTP.Slot index={0} />
                                <InputOTP.Slot index={1} />
                                <InputOTP.Slot index={2} />
                            </InputOTP.Group>
                            <InputOTP.Separator />
                            <InputOTP.Group>
                                <InputOTP.Slot index={3} />
                                <InputOTP.Slot index={4} />
                                <InputOTP.Slot index={5} />
                            </InputOTP.Group>
                        </InputOTP>
                        {isPending && (
                            <p className="text-xs text-primary-sage animate-pulse mt-1">
                                Memverifikasi kode OTP...
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-1.5 px-1 pt-1">
                        <p className="text-xs text-text-muted">Didn&apos;t receive a code?</p>
                        <ResendVerificationButton email={email} type="signup" />
                    </div>

                    <div className="h-px bg-border-subtle" />

                    {/* Bottom links */}
                    <div className="flex flex-col gap-2">
                        <Link
                            href="/login"
                            className="text-sm font-semibold text-primary-sage hover:text-primary-dark hover:underline transition-colors"
                        >
                            {t("verifyAlreadyVerified")} →
                        </Link>
                        <Link href="/" className="text-xs text-text-muted hover:text-text-primary transition-colors">
                            {t("backToHome")}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailForm;
