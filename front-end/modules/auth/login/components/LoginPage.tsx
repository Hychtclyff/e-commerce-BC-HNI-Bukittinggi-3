"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GoogleAuthButton, AuthAlert, AuthCardWrapper } from "@/modules/auth/components/common";
import { LoginForm } from "./LoginForm";
import { LoginFormData } from "@/modules/auth/services/auth.schema";
import { authService } from "@/modules/auth/services/auth.service";

export const LoginPage = () => {
    const t = useTranslations("Auth");
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [serverHint, setServerHint] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("expired") === "1") {
                setServerHint("Sesi Anda telah berakhir. Silakan login kembali untuk melanjutkan.");
            }
        }
    }, []);

    const { mutate: login, isPending } = useMutation({
        mutationKey: ["login"],
        mutationFn: (data: LoginFormData) => authService.login(data),
        onSuccess: () => {
            setServerError(null);
            setServerHint(null);
            if (typeof window !== "undefined") {
                const nextUrl = new URLSearchParams(window.location.search).get("next");
                if (nextUrl && nextUrl.startsWith("/")) {
                    router.push(nextUrl);
                    return;
                }
            }
            router.push("/");
        },
        onError: (error: any, variables: LoginFormData) => {
            const resData = error?.data || error?.response?.data;
            const details = resData?.details;
            const isRequireOtp =
                details?.requireOtp ||
                details?.code === "email_not_confirmed" ||
                resData?.message?.includes("Email is not confirmed") ||
                error?.message?.includes("Email is not confirmed");

            if (isRequireOtp) {
                const targetEmail = details?.email || variables?.email;
                if (targetEmail) {
                    router.push(`/verify-email?email=${encodeURIComponent(targetEmail)}`);
                    return;
                }
            }

            const errorMessage =
                resData?.message ||
                error?.message ||
                "Gagal melakukan login. Silakan coba lagi.";
            const hintMessage = details?.hint || null;

            setServerError(errorMessage);
            setServerHint(hintMessage);
        },
    });

    const handleSubmit = (data: LoginFormData) => {
        login(data);
    };

    return (
        <AuthCardWrapper>
            {/* Header */}
            <div className="text-center">
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 text-3xl mb-3 shadow-inner cursor-pointer"
                >
                    🔑
                </motion.div>
                <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
                    {t("loginTitle")}
                </h2>
                <p className="text-xs sm:text-sm text-text-muted mt-1.5 leading-relaxed">
                    {t("loginSubtitle")}
                </p>
            </div>

            <Suspense fallback={null}>
                <AuthAlert />
            </Suspense>
            <GoogleAuthButton mode="login" label={t("googleLoginBtn")} />

            {/* Divider */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border-subtle" />
                <span className="text-xs text-text-muted px-1">{t("orDivider")}</span>
                <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {/* Email/Password Form */}
            <Suspense fallback={null}>
                <LoginForm
                    onSubmit={handleSubmit}
                    emailLabel={t("emailLabel")}
                    emailPlaceholder={t("emailPlaceholder")}
                    passwordLabel={t("passwordLabel")}
                    passwordPlaceholder={t("passwordPlaceholder")}
                    forgotPasswordLabel={t("forgotPassword")}
                    loginBtnLabel={t("loginBtn")}
                    serverError={serverError}
                    serverHint={serverHint}
                    isPending={isPending}
                />
            </Suspense>

            {/* Register link */}
            <p className="text-center text-xs sm:text-sm text-text-muted">
                {t("registerLink")}{" "}
                <Link
                    href="/register"
                    className="font-semibold text-primary-sage hover:text-primary-dark hover:underline transition-colors"
                >
                    {t("signUpText")}
                </Link>
            </p>

            <div className="text-center">
                <Link href="/" className="text-xs text-text-muted hover:text-text-primary transition-colors">
                    {t("backToHome")}
                </Link>
            </div>
        </AuthCardWrapper>
    );
};

// Aliases for compatibility
export const Login = LoginPage;
export default LoginPage;
