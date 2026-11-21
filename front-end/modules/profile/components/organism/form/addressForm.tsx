"use client";

import React, { useState } from "react";
import { useForm, Controller, Form } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Truck } from "lucide-react";

import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahAlert } from "@/components/atom/tijarahAlert";
import {
    getAddressSchema,
    AddressFormData,
} from "@/modules/profile/schemas/address.schema";

export interface AddressFormProps {
    onSubmit: (data: AddressFormData) => Promise<any> | any;
    onCancel?: () => void;
    isLoading?: boolean;
    defaultValues?: Partial<AddressFormData>;
}

export const AddressForm: React.FC<AddressFormProps> = ({
    onSubmit,
    onCancel,
    isLoading = false,
    defaultValues,
}) => {
    const t = useTranslations("addressForm");
    const tBtn = useTranslations("commonBtn");
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AddressFormData>({
        resolver: zodResolver(getAddressSchema(t)),
        defaultValues: {
            recipientName: defaultValues?.recipientName || "",
            phoneNumber: defaultValues?.phoneNumber || "",
            fullAddress: defaultValues?.fullAddress || "",
            district: defaultValues?.district || "",
            city: defaultValues?.city || "Bukittinggi",
            province: defaultValues?.province || "Sumatera Barat",
            postalCode: defaultValues?.postalCode || "26181",
            notes: defaultValues?.notes || "",
        },
    });

    const handleFormSubmit = async (data: AddressFormData) => {
        setSubmitError(null);
        try {
            await onSubmit(data);
            reset();
        } catch (err: any) {
            setSubmitError(err?.message || "Gagal menyimpan alamat");
        }
    };

    return (
        <Form
            control={control}
            onSubmit={({ data }) => handleFormSubmit(data)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
            {submitError && (
                <div className="sm:col-span-2">
                    <TijarahAlert
                        tijarahVariant="danger"
                        title="Gagal"
                        description={submitError}
                        className="mb-2"
                    />
                </div>
            )}

            {/* Nama Penerima */}
            <Controller
                name="recipientName"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="addr-recipient"
                        type="text"
                        label={t("recipientName")}
                        placeholder={t("recipientNamePlaceholder")}
                        isInvalid={!!errors.recipientName}
                        errorMessage={errors.recipientName?.message}
                        required
                    />
                )}
            />

            {/* Nomor Telepon / WA */}
            <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="addr-phone"
                        type="tel"
                        label={t("phone")}
                        placeholder={t("phonePlaceholder")}
                        isInvalid={!!errors.phoneNumber}
                        errorMessage={errors.phoneNumber?.message}
                        required
                    />
                )}
            />

            {/* Alamat Lengkap */}
            <div className="sm:col-span-2">
                <Controller
                    name="fullAddress"
                    control={control}
                    render={({ field }) => (
                        <div>
                            <TijarahTextArea
                                {...field}
                                id="addr-full"
                                label={t("fullAddress")}
                                placeholder={t("fullAddressPlaceholder")}
                                tijarahVariant={errors.fullAddress ? "error" : "primary"}
                                required
                            />
                            {errors.fullAddress && (
                                <p className="text-xs text-status-danger mt-1">
                                    {errors.fullAddress.message}
                                </p>
                            )}
                        </div>
                    )}
                />
            </div>

            {/* Kecamatan */}
            <Controller
                name="district"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="addr-district"
                        type="text"
                        label={t("district")}
                        placeholder={t("districtPlaceholder")}
                        isInvalid={!!errors.district}
                        errorMessage={errors.district?.message}
                        required
                    />
                )}
            />

            {/* Kota / Kabupaten */}
            <Controller
                name="city"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="addr-city"
                        type="text"
                        label={t("city")}
                        placeholder={t("cityPlaceholder")}
                        isInvalid={!!errors.city}
                        errorMessage={errors.city?.message}
                        required
                    />
                )}
            />

            {/* Provinsi */}
            <Controller
                name="province"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="addr-province"
                        type="text"
                        label={t("province")}
                        placeholder={t("provincePlaceholder")}
                        isInvalid={!!errors.province}
                        errorMessage={errors.province?.message}
                        required
                    />
                )}
            />

            {/* Kode Pos */}
            <Controller
                name="postalCode"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="addr-postal"
                        type="text"
                        label={t("postalCode")}
                        placeholder={t("postalCodePlaceholder")}
                        isInvalid={!!errors.postalCode}
                        errorMessage={errors.postalCode?.message}
                        required
                    />
                )}
            />

            {/* Catatan Kurir */}
            <div className="sm:col-span-2">
                <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                        <TijarahInput
                            {...field}
                            id="addr-notes"
                            type="text"
                            label={t("notes")}
                            placeholder={t("notesPlaceholder")}
                            startContent={<Truck className="w-4 h-4 text-text-muted" />}
                        />
                    )}
                />
            </div>

            {/* Action Buttons */}
            <div className="sm:col-span-2 flex justify-end gap-2 mt-2 pt-3 border-t border-border-subtle">
                {onCancel && (
                    <TijarahButton
                        tijarahVariant="ghost"
                        size="sm"
                        type="button"
                        onClick={onCancel}
                    >
                        {tBtn("Cancel")}
                    </TijarahButton>
                )}
                <TijarahButton
                    tijarahVariant="primary"
                    size="sm"
                    type="submit"
                    isLoading={isLoading || isSubmitting}
                    className="font-bold"
                >
                    {tBtn("Submit")}
                </TijarahButton>
            </div>
        </Form>
    );
};
