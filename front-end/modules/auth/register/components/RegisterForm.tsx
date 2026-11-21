"use client";

import React, { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@heroui/react";
import { authSchema, type RegisterInput } from "@/modules/auth/services/auth.schema";
import { authService } from "@/modules/auth/services/auth.service";
import { useRouter } from "@/lib/i18n/navigation";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahAlert } from "@/components/atom/tijarahAlert";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { TijarahSelect } from "@/components/atom/tijarahSelect";

export interface RegisterFormProps {
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    registerBtnLabel: string;
    optionalLabel?: string;
    hniIdLaterInfo: string;
}

const COUNTRY_CODES = [
    { code: "+62", label: "🇮🇩 +62", country: "Indonesia" },
    { code: "+60", label: "🇲🇾 +60", country: "Malaysia" },
    { code: "+65", label: "🇸🇬 +65", country: "Singapore" },
    { code: "+966", label: "🇸🇦 +966", country: "Saudi Arabia" },
    { code: "+1", label: "🇺🇸 +1", country: "USA/Canada" },
    { code: "+61", label: "🇦🇺 +61", country: "Australia" },
    { code: "+44", label: "🇬🇧 +44", country: "United Kingdom" },
    { code: "+81", label: "🇯🇵 +81", country: "Japan" },
];

export function RegisterForm({
    nameLabel,
    namePlaceholder,
    emailLabel,
    emailPlaceholder,
    phoneLabel,
    phonePlaceholder,
    passwordLabel,
    passwordPlaceholder,
    registerBtnLabel,
    hniIdLaterInfo,
}: RegisterFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [countryCode, setCountryCode] = useState("+62");
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        setValue,
        getValues,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(authSchema.register),
        defaultValues: {
            fullName: "",
            email: "",
            phoneNumber: "",
            password: "",
        },
        mode: "onTouched",
    });

    const onSubmit = (data: RegisterInput) => {
        setServerError(null);
        startTransition(async () => {
            try {
                const sanitizedPhone = data.phoneNumber.replace(/^0+/, "");
                const formattedPhone = `${countryCode}${sanitizedPhone}`;

                await authService.register({
                    email: data.email,
                    password: data.password,
                    fullName: data.fullName,
                    phoneNumber: formattedPhone,
                });

                // Auto login or redirect to verify-email
                router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
            } catch (err: any) {
                setServerError(
                    err.message || "Pendaftaran gagal. Silakan periksa kembali data Anda."
                );
            }
        });
    };

    // Handler terpisah untuk perubahan kode negara
    const handleCountryCodeChange = (keys: any) => {
        let selectedKeyStr = "";
        if (typeof keys === "string" || typeof keys === "number") {
            selectedKeyStr = String(keys);
        } else if (keys && typeof keys === "object") {
            const firstKey = Array.from(keys)[0];
            if (firstKey) selectedKeyStr = String(firstKey);
        }

        const matched = COUNTRY_CODES.find((c) => c.code === selectedKeyStr);
        const newCode = matched ? matched.code : "+62";

        setCountryCode(newCode);
        const currentPhone = getValues("phoneNumber") || "";
        const maxAllowed = 14 - newCode.length;
        if (currentPhone.length > maxAllowed) {
            setValue("phoneNumber", currentPhone.slice(0, maxAllowed), { shouldValidate: true });
        }
    };

    // Handler terpisah untuk pengolahan & pembersihan nomor HP
    const handlePhoneNumberChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        fieldOnChange: (val: string) => void
    ) => {
        let raw = e.target.value.trim();
        const matchedCountry = COUNTRY_CODES.find((c) => c.code === countryCode);
        let selectedCode = matchedCountry ? matchedCountry.code : "+62";

        if (raw.startsWith("+")) {
            const matched = COUNTRY_CODES.find((c) => raw.startsWith(c.code));
            if (matched) {
                selectedCode = matched.code;
                setCountryCode(matched.code);
                raw = raw.slice(matched.code.length);
            }
        } else {
            const matched = COUNTRY_CODES.find((c) => {
                const numCode = c.code.replace("+", "");
                return raw.startsWith(numCode) && raw.length > numCode.length + 5;
            });
            if (matched) {
                const numCode = matched.code.replace("+", "");
                selectedCode = matched.code;
                setCountryCode(matched.code);
                raw = raw.slice(numCode.length);
            }
        }

        let val = raw.replace(/\D/g, "");

        if (val.startsWith("0")) {
            val = val.replace(/^0+/, "");
        }

        const maxAllowedDigits = 14 - selectedCode.length;

        if (val.length > maxAllowedDigits) {
            val = val.slice(0, maxAllowedDigits);
        }

        fieldOnChange(val);
    };

    return (
        <Form
            id="register-form"
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
                    title="Pendaftaran Gagal"
                    description={serverError}
                    className="w-full mb-1"
                />
            )}

            {/* Full Name Field */}
            <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="register-name"
                        type="text"
                        label={nameLabel}
                        placeholder={namePlaceholder}
                        autoComplete="name"
                        tijarahVariant="primary"
                        isInvalid={!!errors.fullName}
                        errorMessage={errors.fullName?.message}
                        radius="lg"
                    />
                )}
            />

            {/* Email Field */}
            <Controller
                name="email"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="register-email"
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

            {/* Phone Field dengan Kode Negara */}
            <div className="w-full flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {phoneLabel} *
                </label>
                <div className="flex items-start gap-2">
                    <div className="w-36 shrink-0">
                        <TijarahSelect
                            selectedKey={countryCode}
                            onSelectionChange={handleCountryCodeChange}
                            aria-label="Pilih Kode Negara"
                        >
                            {COUNTRY_CODES.map((item) => (
                                <TijarahSelect.Item id={item.code} key={item.code} textValue={item.label}>
                                    {item.label}
                                </TijarahSelect.Item>
                            ))}
                        </TijarahSelect>
                    </div>
                    <div className="flex-1">
                        <Controller
                            name="phoneNumber"
                            control={control}
                            render={({ field }) => (
                                <TijarahInput
                                    {...field}
                                    id="register-phone"
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={14}
                                    placeholder={phonePlaceholder}
                                    autoComplete="tel"
                                    tijarahVariant="primary"
                                    isInvalid={!!errors.phoneNumber}
                                    errorMessage={errors.phoneNumber?.message}
                                    radius="lg"
                                    onChange={(e) => handlePhoneNumberChange(e, field.onChange)}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Password Field */}
            <Controller
                name="password"
                control={control}
                render={({ field }) => (
                    <TijarahInput
                        {...field}
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        label={passwordLabel}
                        placeholder={passwordPlaceholder}
                        autoComplete="new-password"
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

            {/* Info Box HNI ID */}
            <TijarahAlert
                tijarahVariant="warning"
                title="Informasi ID HNI"
                description={hniIdLaterInfo}
                className="w-full text-xs"
            />

            {/* Submit Button */}
            <motion.div
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
                <TijarahButton
                    id="register-submit"
                    type="submit"
                    isLoading={isPending}
                    tijarahVariant="primary"
                    className="w-full mt-2 font-bold shadow-md rounded-xl py-3 transition-all duration-200"
                >
                    {registerBtnLabel} →
                </TijarahButton>
            </motion.div>
        </Form>
    );
}

export default RegisterForm;
