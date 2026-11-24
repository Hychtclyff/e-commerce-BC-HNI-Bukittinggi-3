"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Lock, ShieldCheck } from "lucide-react";

import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahAlert } from "@/components/atom/tijarahAlert";
import {
    getPasswordSchema,
    PasswordFormData,
} from "@/modules/profile/schemas/password.schema";

export interface ChangePasswordFormProps {
    onSubmit?: (data: PasswordFormData) => Promise<any> | any;
    isLoading?: boolean;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
    onSubmit,
    isLoading = false,
}) => {
    const t = useTranslations("passwordForm");
    const tBtn = useTranslations("commonBtn");

    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PasswordFormData>({
        resolver: zodResolver(getPasswordSchema(t)),
        defaultValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const handleFormSubmit = async (data: PasswordFormData) => {
        setSuccessMsg(null);
        setErrorMsg(null);
        try {
            if (onSubmit) {
                await onSubmit(data);
            }
            setSuccessMsg(t("success"));
            reset();
        } catch (err: any) {
            setErrorMsg(err?.message || "Gagal memperbarui kata sandi.");
        }
    };

    return (
        <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="flex flex-col gap-4"
        >
            {successMsg && (
                <TijarahAlert
                    tijarahVariant="success"
                    title="Sukses"
                    description={successMsg}
                    className="mb-2"
                />
            )}
            {errorMsg && (
                <TijarahAlert
                    tijarahVariant="danger"
                    title="Gagal"
                    description={errorMsg}
                    className="mb-2"
                />
            )}

            {/* Kata Sandi Saat Ini */}
            <Controller
                name="oldPassword"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="old-password"
                        type="password"
                        label={t("oldPassword")}
                        placeholder={t("oldPasswordPlaceholder")}
                        isInvalid={!!errors.oldPassword}
                        errorMessage={errors.oldPassword?.message}
                        startContent={<Lock className="w-4 h-4 text-text-muted" />}
                        required
                    />
                )}
            />

            {/* Kata Sandi Baru */}
            <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="new-password"
                        type="password"
                        label={t("newPassword")}
                        placeholder={t("newPasswordPlaceholder")}
                        isInvalid={!!errors.newPassword}
                        errorMessage={errors.newPassword?.message}
                        startContent={<Lock className="w-4 h-4 text-text-muted" />}
                        required
                    />
                )}
            />

            {/* Konfirmasi Kata Sandi Baru */}
            <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="confirm-password"
                        type="password"
                        label={t("confirmPassword")}
                        placeholder={t("confirmPasswordPlaceholder")}
                        isInvalid={!!errors.confirmPassword}
                        errorMessage={errors.confirmPassword?.message}
                        startContent={<Lock className="w-4 h-4 text-text-muted" />}
                        required
                    />
                )}
            />

            <div className="mt-2 pt-3 border-t border-border-subtle flex justify-end">
                <TijarahButton
                    id="update-password-btn"
                    tijarahVariant="primary"
                    size="sm"
                    type="submit"
                    isLoading={isLoading || isSubmitting}
                    className="font-bold py-2 px-5 flex items-center gap-1.5"
                >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t("submitBtn")}</span>
                </TijarahButton>
            </div>
        </form>
    );
};
