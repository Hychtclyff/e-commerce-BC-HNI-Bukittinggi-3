"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller, Form } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { User, Mail, Phone, CheckCircle2 } from "lucide-react";

import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahAlert } from "@/components/atom/tijarahAlert";
import useProfile from "@/modules/profile/hooks/useProfile";
import { UserProfileData } from "@/modules/profile/types/profile.types";
import {
    getIdentitySchema,
    IdentityFormData,
} from "@/modules/profile/schemas/identity.schema";

export interface IdentityFormProps {
    user?: UserProfileData | null;
    onUpdate?: (data: { fullName?: string; email?: string; phoneNumber?: string }) => Promise<any>;
    isUpdating?: boolean;
}

export const IdentityForm: React.FC<IdentityFormProps> = ({
    user: propUser,
    onUpdate: propOnUpdate,
    isUpdating: propIsUpdating,
}) => {
    const t = useTranslations("form");
    const tBtn = useTranslations("commonBtn");

    // Gunakan fallback useProfile jika props tidak disediakan langsung
    const profileHook = useProfile();
    const currentUser = propUser ?? profileHook.user;
    const handleUpdate = propOnUpdate ?? profileHook.updateProfile;
    const updating = propIsUpdating ?? profileHook.isUpdating;

    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const {
        control,
        reset,
        formState: { errors },
    } = useForm<IdentityFormData>({
        resolver: zodResolver(getIdentitySchema(t)),
        defaultValues: {
            fullName: currentUser?.fullName || "",
            email: currentUser?.email || "",
            phoneNumber: currentUser?.phoneNumber || "",
        },
        mode: "onBlur",
    });

    // Update form saat data profil pengguna termuat / berubah
    useEffect(() => {
        if (currentUser) {
            reset({
                fullName: currentUser.fullName || "",
                email: currentUser.email || "",
                phoneNumber: currentUser.phoneNumber || "",
            });
        }
    }, [currentUser?.fullName, currentUser?.email, currentUser?.phoneNumber, reset]);

    const onSubmit = async (data: IdentityFormData) => {
        setSuccessMsg(null);
        setErrorMsg(null);
        try {
            await handleUpdate(data);
            setSuccessMsg(t("successUpdate"));
        } catch (err: any) {
            setErrorMsg(err?.message || t("failedUpdate"));
        }
    };

    return (
        <Form control={control} onSubmit={({ data }) => onSubmit(data)} className="flex flex-col gap-4">
            {successMsg && (
                <TijarahAlert
                    tijarahVariant="success"
                    title="Sukses"
                    description={successMsg}
                    className="mb-2"
                />
            )}

            {
                errorMsg && (
                    <TijarahAlert
                        tijarahVariant="danger"
                        title="Gagal"
                        description={errorMsg}
                        className="mb-2"
                    />
                )
            }

            {/* Nama Lengkap */}
            <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="profile-fullname"
                        type="text"
                        label={t("fullName")}
                        placeholder={t("fullNamePlaceholder")}
                        isInvalid={!!errors.fullName}
                        errorMessage={errors.fullName?.message}
                        startContent={<User className="w-4 h-4 text-text-muted" />}
                        required
                    />
                )}
            />

            {/* Email Utama */}
            <Controller
                name="email"
                control={control}
                render={({ field }) => (
                    <div>
                        <TijarahInput
                            {...field}
                            id="profile-email"
                            type="email"
                            label={t("email")}
                            placeholder={t("emailPlaceholder")}
                            isInvalid={!!errors.email}
                            errorMessage={errors.email?.message}
                            startContent={<Mail className="w-4 h-4 text-text-muted" />}
                            required
                        />
                        <p className="text-[11px] text-text-muted mt-1.5 flex items-start gap-1 font-medium">
                            <span>💡</span>
                            <span>{t("emailAlert")}</span>
                        </p>
                    </div>
                )}
            />

            {/* Nomor Telepon / WA */}
            <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="profile-phone"
                        type="number"

                        label={t("phone")}
                        placeholder={t("phonePlaceholder")}
                        isInvalid={!!errors.phoneNumber}
                        errorMessage={errors.phoneNumber?.message}
                        startContent={<Phone className="w-4 h-4 text-text-muted" />}
                        required
                    />
                )}
            />

            {/* Tombol Simpan */}
            <div className="mt-4 pt-4 border-t border-border-subtle flex justify-end">
                <TijarahButton
                    id="save-personal-btn"
                    type="submit"
                    isLoading={updating}
                    tijarahVariant="primary"
                    className="font-bold py-2.5 px-6 flex items-center gap-2"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{tBtn("Submit")}</span>
                </TijarahButton>
            </div>
        </Form >
    );
};