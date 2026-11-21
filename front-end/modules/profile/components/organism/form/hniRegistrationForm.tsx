"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller, Form } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Leaf, ArrowRight, Pencil, ShieldCheck, AlertCircle } from "lucide-react";

import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahAlert } from "@/components/atom/tijarahAlert";
import { TijarahModal } from "@/components/atom/tijarahModal";
import useProfile from "@/modules/profile/hooks/useProfile";
import { HniProfileData } from "@/modules/profile/types/profile.types";
import {
    getHniRegistrationSchema,
    HniRegistrationFormData,
} from "@/modules/profile/schemas/hni.schema";
import { SearchHniProfileSearch } from "./SearchHniProfileForm";

export interface HniRegistrationFormProps {
    hniProfile?: HniProfileData | null;
    onSubmit?: (data: HniRegistrationFormData) => Promise<any> | any;
    isLoading?: boolean;
}

export const HniRegistrationForm: React.FC<HniRegistrationFormProps> = ({
    hniProfile: propHniProfile,
    onSubmit: propOnSubmit,
    isLoading: propIsLoading,
}) => {
    const t = useTranslations("hniForm");
    const tCommon = useTranslations("commonBtn");
    const [successMsg, setSuccessMsg] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Best Practice: Konsumsi useProfile langsung sebagai fallback bila props tidak dioper
    const profileHook = useProfile();
    const currentHni = propHniProfile !== undefined ? propHniProfile : profileHook.hniProfile;
    const isUpdating = propIsLoading ?? profileHook.isSavingHni;

    const isVerified = !!currentHni?.isVerified;
    const hasProfile = !!currentHni?.hniMemberId;
    const isPendingVerification = hasProfile && !isVerified;

    // Mode edit:
    // - Jika profil baru (!hasProfile): form aktif (true)
    // - Jika dalam proses verifikasi (isPendingVerification): terkunci total (false)
    // - Jika sudah terverifikasi (isVerified): awalnya terkunci (false), dibuka setelah konfirmasi modal
    const [isEditing, setIsEditing] = useState<boolean>(!hasProfile && !isPendingVerification);
    const [showEditConfirmModal, setShowEditConfirmModal] = useState<boolean>(false);

    // Kriteria canEdit: Hanya boleh edit jika TIDAK dalam proses verifikasi, dan (merupakan profil baru ATAU sedang dalam mode edit)
    const canEdit = !isPendingVerification && (!hasProfile || isEditing);

    const {
        control,
        setValue,
        getValues,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<HniRegistrationFormData>({
        resolver: zodResolver(getHniRegistrationSchema(t)),
        defaultValues: {
            memberId: currentHni?.hniMemberId || "",
            memberName: currentHni?.hniMemberName || "",
            uplineName: currentHni?.uplineName || "",
            rank: currentHni?.rank || currentHni?.titleStatus || "",
            phoneNumber: "",
        },
    });

    // Sinkronisasi status edit dan form saat data profil HNI berubah
    useEffect(() => {
        if (currentHni?.hniMemberId) {
            reset({
                memberId: currentHni.hniMemberId || "",
                memberName: currentHni.hniMemberName || "",
                uplineName: currentHni.uplineName || "",
                rank: currentHni.rank || currentHni.titleStatus || "",
                phoneNumber: "",
            });
            // Jika ada profil tersimpan (baik pending maupun sudah verified), mode edit awal = false
            setIsEditing(false);
        } else {
            setIsEditing(true);
        }
    }, [currentHni, reset]);

    const [isFromSystem, setIsFromSystem] = useState<boolean>(false);

    const handleFormSubmit = async (formData: HniRegistrationFormData) => {
        setSubmitError(null);
        try {
            const formVals = getValues ? getValues() : ({} as any);
            const memberId = String(formData?.memberId || formVals?.memberId || (formData as any)?.hniMemberId || "").trim();
            const memberName = String(formData?.memberName || formVals?.memberName || (formData as any)?.hniMemberName || "").trim();
            const uplineName = String(formData?.uplineName || formVals?.uplineName || (formData as any)?.uplineName || "").trim();
            const rank = String(formData?.rank || formVals?.rank || (formData as any)?.rank || "").trim();

            const payload = {
                memberId,
                memberName,
                hniMemberId: memberId,
                hniMemberName: memberName,
                uplineName,
                rank,
                rankMarketing: rank,
                isVerified: true, // Status langsung aktif / terverifikasi dari sistem, jangan pending
            };

            if (propOnSubmit) {
                await propOnSubmit(payload as any);
            } else {
                await profileHook.saveHniProfile(payload);
            }
            setSuccessMsg(true);
            setIsEditing(false);
        } catch (err: any) {
            setSubmitError(err?.message || "Gagal mengaktifkan data agen HNI");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Status Alert - Cukup satu notifikasi di bagian atas */}
            {isVerified && !isEditing && (
                <TijarahAlert
                    tijarahVariant="success"
                    title={t("verifiedAlertTitle")}
                    description={t("verifiedAlertDesc")}
                    className="mb-2"
                />
            )}

            {isPendingVerification && (
                <TijarahAlert
                    tijarahVariant="warning"
                    title={t("pendingAlertTitle")}
                    description={t("pendingAlertDesc")}
                    className="mb-2"
                />
            )}

            {isVerified && isEditing && (
                <TijarahAlert
                    tijarahVariant="warning"
                    title={t("editModeAlertTitle")}
                    description={t("editModeAlertDesc")}
                    className="mb-2"
                />
            )}

            {/* Pencarian Agen HNI melalui HSIS (Hanya aktif saat formulir dapat diedit) */}
            {canEdit && (
                <SearchHniProfileSearch
                    canEdit={canEdit}
                    onSelectMember={(member) => {
                        if (member) {
                            setIsFromSystem(true);
                            setValue("memberId", member.hniMemberId, { shouldValidate: true });
                            setValue("memberName", member.hniMemberName, { shouldValidate: true });
                            if (member.uplineName) {
                                setValue("uplineName", member.uplineName, { shouldValidate: true });
                            }
                            if (member.rank || member.titleStatus || member.directStatus) {
                                setValue("rank", member.rank || member.titleStatus || member.directStatus, { shouldValidate: true });
                            }
                            if (member.phoneNumber) {
                                setValue("phoneNumber", member.phoneNumber, { shouldValidate: true });
                            }
                        } else {
                            setIsFromSystem(false);
                        }
                    }}
                />
            )}

            <Form
                control={control}
                onSubmit={({ data }) => handleFormSubmit(data)}
                className="flex flex-col gap-6"
            >
                {successMsg && (
                    <TijarahAlert
                        tijarahVariant="success"
                        title="Keanggotaan HNI Berhasil Terverifikasi & Aktif!"
                        description="Data ID Agen Anda telah terhubung resmi dengan sistem live HSIS HNI dan langsung berstatus aktif."
                        className="mb-2"
                    />
                )}
                {submitError && (
                    <TijarahAlert
                        tijarahVariant="danger"
                        title="Gagal"
                        description={submitError}
                        className="mb-2"
                    />
                )}

                {/* Section 1: HNI Member Data */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-primary-sage border-b border-border-subtle pb-2">
                        <Leaf className="w-4 h-4" />
                        <span>{t("sectionHni")}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Controller
                            name="memberId"
                            control={control}
                            render={({ field }) => (
                                <TijarahInput
                                    {...field}
                                    id="gate-hni-id"
                                    disabled={!canEdit}
                                    label={t("memberId")}
                                    placeholder={t("memberIdPlaceholder")}
                                    isInvalid={!!errors.memberId}
                                    errorMessage={errors.memberId?.message}
                                    required
                                />
                            )}
                        />

                        <Controller
                            name="memberName"
                            control={control}
                            render={({ field }) => (
                                <TijarahInput
                                    {...field}
                                    id="gate-hni-name"
                                    disabled={!canEdit}
                                    label={t("memberName")}
                                    placeholder={t("memberNamePlaceholder")}
                                    isInvalid={!!errors.memberName}
                                    errorMessage={errors.memberName?.message}
                                    required
                                />
                            )}
                        />

                        <Controller
                            name="uplineName"
                            control={control}
                            render={({ field }) => (
                                <TijarahInput
                                    {...field}
                                    id="gate-hni-upline"
                                    disabled={!canEdit}
                                    label={t("uplineName")}
                                    placeholder={t("uplineNamePlaceholder")}
                                    isInvalid={!!errors.uplineName}
                                    errorMessage={errors.uplineName?.message}
                                />
                            )}
                        />

                        <Controller
                            name="rank"
                            control={control}
                            render={({ field }) => (
                                <TijarahInput
                                    {...field}
                                    id="gate-hni-rank"
                                    disabled={!canEdit}
                                    label={t("rank")}
                                    placeholder={t("rankPlaceholder")}
                                    isInvalid={!!errors.rank}
                                    errorMessage={errors.rank?.message}
                                />
                            )}
                        />

                        <Controller
                            name="phoneNumber"
                            control={control}
                            render={({ field }) => (
                                <TijarahInput
                                    {...field}
                                    id="gate-hni-phone"
                                    disabled={!canEdit}
                                    label={t("phone")}
                                    placeholder={t("phonePlaceholder")}
                                    isInvalid={!!errors.phoneNumber}
                                    errorMessage={errors.phoneNumber?.message}
                                    className="sm:col-span-2"
                                />
                            )}
                        />
                    </div>
                </div>

                {/* Footer Tombol - Disembunyikan saat pending verifikasi agar notifikasi hanya satu di atas */}
                {!isPendingVerification && (
                    <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
                        {isVerified && !isEditing ? (
                            /* Tombol Edit setelah diverifikasi */
                            <TijarahButton
                                id="edit-hni-btn"
                                type="button"
                                tijarahVariant="outline"
                                onClick={() => setShowEditConfirmModal(true)}
                                className="font-bold py-2.5 px-6 text-sm flex items-center gap-2"
                            >
                                <Pencil className="w-4 h-4" />
                                <span>{t("editBtn")}</span>
                            </TijarahButton>
                        ) : (
                            /* Tombol Simpan & Batal (untuk registrasi baru atau mode edit aktif) */
                            <>
                                {isVerified && (
                                    <TijarahButton
                                        type="button"
                                        tijarahVariant="ghost"
                                        onClick={() => {
                                            setIsEditing(false);
                                            reset({
                                                memberId: currentHni?.hniMemberId || "",
                                                memberName: currentHni?.hniMemberName || "",
                                                uplineName: currentHni?.uplineName || "",
                                                rank: currentHni?.rank || currentHni?.titleStatus || "",
                                                phoneNumber: "",
                                            });
                                        }}
                                        className="px-5 py-2.5 text-sm"
                                    >
                                        {tCommon("cancel")}
                                    </TijarahButton>
                                )}

                                <TijarahButton
                                    id="submit-hni-gate-btn"
                                    type="submit"
                                    isLoading={isUpdating || isSubmitting}
                                    tijarahVariant="primary"
                                    className="font-bold py-3 px-8 text-base shadow-md flex items-center gap-2"
                                >
                                    <span>{isVerified ? t("saveChangesBtn") : t("submitBtn")}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </TijarahButton>
                            </>
                        )}
                    </div>
                )}
            </Form>

            {/* Modal Konfirmasi Edit Profil HNI (Dukungan Dwibahasa ID & EN) */}
            <TijarahModal
                isOpen={showEditConfirmModal}
                onClose={() => setShowEditConfirmModal(false)}
                variant="warning"
                title={t("modalConfirmTitle")}
                description={t("modalConfirmDesc")}
                confirmText={t("modalConfirmYes")}
                cancelText={tCommon("cancel")}
                onConfirm={() => {
                    setIsEditing(true);
                    setShowEditConfirmModal(false);
                }}
            />
        </div>
    );
};

export default HniRegistrationForm;
