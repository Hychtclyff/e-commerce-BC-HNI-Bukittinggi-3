"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Form, Link } from "@heroui/react";
import { LoginFormData, LoginSchemas } from "@/modules/auth/services/auth.schema";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahAlert } from "@/components/atom/tijarahAlert";
import { clsx } from "clsx";
import { motion } from "framer-motion";

export interface LoginFormProps {
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    forgotPasswordLabel: string;
    loginBtnLabel: string;
    serverError?: string | null;
    serverHint?: string | null;
    isPending?: boolean;
    onSubmit?: (data: LoginFormData) => void;
}

export function LoginForm({
    emailLabel,
    emailPlaceholder,
    passwordLabel,
    passwordPlaceholder,
    forgotPasswordLabel,
    loginBtnLabel,
    serverError,
    serverHint,
    isPending,
    onSubmit = (data) => {
        console.log("Login submit:", data);
    },
}: LoginFormProps) {
    const t = useTranslations("Auth");
    const [showPassword, setShowPassword] = useState(false);

    // Inisialisasi React Hook Form dengan Zod Resolver terjemahan
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(LoginSchemas.login(t)),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    return (
        <Form
            id="login-form"
            method="post"
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(onSubmit)(e);
            }}
            className="flex flex-col gap-4 w-full"
            validationBehavior="aria"
        >
            {/* Server Error Alert menggunakan TijarahAlert */}
            {serverError && (
                <TijarahAlert
                    tijarahVariant="danger"
                    title="Gagal Masuk"
                    description={serverError}
                    className="w-full mb-1"
                />
            )}

            {/* Server Hint Alert jika ada bantuan/petunjuk dari backend */}
            {serverHint && (
                <TijarahAlert
                    tijarahVariant="warning"
                    title="Petunjuk"
                    description={serverHint}
                    className="w-full mb-2"
                />
            )}

            {/* Email Field menggunakan TijarahInput */}
            <Controller
                name="email"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="login-email"
                        type="email"
                        label={emailLabel}
                        placeholder={emailPlaceholder}
                        autoComplete="email"
                        tijarahVariant="primary"
                        isInvalid={!!errors.email}
                        errorMessage={errors.email?.message}
                        radius="lg"
                    />
                )}  
            />

            {/* Password Field menggunakan TijarahInput + Tombol Show/Hide */}
            <div className="w-full flex flex-col gap-1">
                <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                        <TijarahInput
                            {...field}
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            label={passwordLabel}
                            placeholder={passwordPlaceholder}
                            autoComplete="current-password"
                            tijarahVariant="primary"
                            isInvalid={!!errors.password}
                            errorMessage={errors.password?.message}
                            radius="lg"
                            endContent={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    tabIndex={-1}
                                    className={clsx(
                                        "focus:outline-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    )}
                                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.05 10.05 0 014.122-.963c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-1.503 1.503L3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            }
                        />
                    )}
                />

                {/* Link Lupa Password diatur posisinya di bawah/kanan */}
                <div className="flex justify-end mt-1">
                    <Link href="/forgot-password" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        {forgotPasswordLabel}
                    </Link>
                </div>
            </div>

            {/* Submit Button menggunakan TijarahButton */}
            <motion.div
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
                <TijarahButton
                    id="login-submit"
                    type="submit"
                    isLoading={isPending}
                    tijarahVariant="primary"
                    className="w-full mt-2 font-bold shadow-md rounded-xl py-3 transition-all duration-200"
                >
                    {loginBtnLabel}
                </TijarahButton>
            </motion.div>
        </Form>
    );
}

export default LoginForm;
