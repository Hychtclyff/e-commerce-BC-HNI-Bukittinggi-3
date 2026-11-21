"use client";

import React, { useState } from "react";
import { useForm, Controller, Form } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Tag, Sparkles, CheckCircle2 } from "lucide-react";

import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import {
    getVoucherSchema,
    VoucherFormData,
} from "@/modules/profile/schemas/voucher.schema";

export interface ClaimVoucherFormProps {
    onClaim?: (code: string) => Promise<any> | any;
    isLoading?: boolean;
}

export const ClaimVoucherForm: React.FC<ClaimVoucherFormProps> = ({
    onClaim,
    isLoading = false,
}) => {
    const t = useTranslations("voucherForm");
    const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<VoucherFormData>({
        resolver: zodResolver(getVoucherSchema(t)),
        defaultValues: {
            code: "",
        },
    });

    const handleFormSubmit = async (data: VoucherFormData) => {
        try {
            if (onClaim) {
                await onClaim(data.code);
            }
            setClaimedNotice(t("success", { code: data.code }));
            reset();
            setTimeout(() => setClaimedNotice(null), 4000);
        } catch (err: any) {
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <Form
                control={control}
                onSubmit={() => handleSubmit(handleFormSubmit)}
                className="flex flex-col sm:flex-row items-center gap-3"
            >
                <div className="flex-1 w-full">
                    <Controller
                        name="code"
                        control={control}
                        render={({ field }) => (
                            <TijarahInput
                                {...field}
                                id="claim-voucher-input"
                                placeholder={t("placeholder")}
                                isInvalid={!!errors.code}
                                errorMessage={errors.code?.message}
                                startContent={<Tag className="w-4 h-4 text-text-muted" />}
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                        )}
                    />
                </div>
                <TijarahButton
                    type="submit"
                    tijarahVariant="primary"
                    size="sm"
                    isLoading={isLoading || isSubmitting}
                    className="w-full sm:w-auto font-bold py-2.5 px-6 flex items-center justify-center gap-2"
                >
                    <Sparkles className="w-4 h-4" />
                    <span>{t("submitBtn")}</span>
                </TijarahButton>
            </Form>

            {claimedNotice && (
                <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/30 text-xs text-status-success flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{claimedNotice}</span>
                </div>
            )}
        </div>
    );
};
