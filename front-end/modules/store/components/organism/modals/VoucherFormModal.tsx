"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { voucherSchema, type VoucherFormData } from "../../../schemas/store.schema";
import type { StoreVoucher } from "../../../types/store.types";
import type { VoucherPayload } from "../../../api/store.api";

export interface IVoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: StoreVoucher | null;
  onSubmit: (payload: VoucherPayload) => Promise<void>;
  isLoading: boolean;
}

export const VoucherFormModal: React.FC<IVoucherFormModalProps> = ({
  isOpen,
  onClose,
  voucher,
  onSubmit,
  isLoading,
}) => {
  const t = useTranslations("storeErp.vouchers");
  const isEdit = !!voucher;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any, any, VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      code: "",
      title: "",
      description: "",
      discountType: "FIXED",
      discountValue: 15000 as any,
      minPurchase: 100000 as any,
      maxDiscount: undefined as any,
      quota: 50 as any,
      isActive: true as any,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    },
  });

  const selectedDiscountType = watch("discountType");
  const currentIsActive = watch("isActive");

  useEffect(() => {
    if (voucher) {
      reset({
        code: voucher.code,
        title: voucher.title || "",
        description: voucher.description || "",
        discountType: voucher.discountType,
        discountValue: voucher.discountValue as any,
        minPurchase: voucher.minPurchase as any,
        maxDiscount: voucher.maxDiscount ?? (undefined as any),
        quota: voucher.quota as any,
        isActive: voucher.isActive as any,
        expiresAt: voucher.expiresAt.slice(0, 10),
      });
    } else {
      reset({
        code: "",
        title: "",
        description: "",
        discountType: "FIXED",
        discountValue: 15000 as any,
        minPurchase: 100000 as any,
        maxDiscount: undefined as any,
        quota: 50 as any,
        isActive: true as any,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      });
    }
  }, [voucher, reset, isOpen]);

  const translateError = (msg?: string) => {
    if (!msg) return undefined;
    if (msg === "INVALID_CODE") return t("errInvalidCode");
    if (msg === "REQUIRED") return t("errRequired");
    if (msg === "MAX_100_PERCENT") return t("errMax100");
    return msg;
  };

  const handleFormSubmit = async (data: VoucherFormData) => {
    await onSubmit({
      code: data.code,
      title: data.title || data.code,
      description: data.description || data.title || data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minPurchase: data.minPurchase,
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
      quota: data.quota,
      isActive: data.isActive,
      expiresAt: `${data.expiresAt}T23:59:59Z`,
    });
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t("formEditTitle", { code: voucher.code }) : t("formCreateTitle")}
      description={isEdit ? t("formEditDesc") : t("formCreateDesc")}
      confirmText={isEdit ? t("formSubmitEdit") : t("formSubmitCreate")}
      confirmVariant="primary"
      isConfirmLoading={isLoading}
      onConfirm={handleSubmit(handleFormSubmit)}
      showCancelButton
      cancelText={t("formCancel")}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TijarahInput
            label={t("fieldCode")}
            placeholder={t("fieldCodePlaceholder")}
            {...register("code")}
            isInvalid={!!errors.code}
            errorMessage={translateError(errors.code?.message as string)}
            className="text-xs font-mono font-bold uppercase tracking-wider"
          />

          <TijarahInput
            label={t("fieldTitle")}
            placeholder={t("fieldTitlePlaceholder")}
            {...register("title")}
            className="text-xs"
          />
        </div>

        <TijarahInput
          label={t("fieldDescription")}
          placeholder={t("fieldDescriptionPlaceholder")}
          {...register("description")}
          className="text-xs"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">{t("fieldDiscountType")}</label>
            <TijarahSelect
              selectedKey={selectedDiscountType}
              onSelectionChange={(key) => {
                if (key) setValue("discountType", String(key) as any);
              }}
              className="text-xs"
            >
              <TijarahSelect.Item id="FIXED">{t("typeFixed")}</TijarahSelect.Item>
              <TijarahSelect.Item id="PERCENT">{t("typePercent")}</TijarahSelect.Item>
              <TijarahSelect.Item id="SHIPPING_SUBSIDY">{t("typeShipping")}</TijarahSelect.Item>
            </TijarahSelect>
          </div>

          <TijarahInput
            type="number"
            label={
              selectedDiscountType === "PERCENT"
                ? t("fieldDiscountPercent")
                : selectedDiscountType === "SHIPPING_SUBSIDY"
                ? t("fieldDiscountShipping")
                : t("fieldDiscountFixed")
            }
            placeholder={selectedDiscountType === "PERCENT" ? "10" : "15000"}
            {...register("discountValue")}
            isInvalid={!!errors.discountValue}
            errorMessage={translateError(errors.discountValue?.message as string)}
            className="text-xs font-bold text-primary-sage"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TijarahInput
            type="number"
            label={t("fieldMinPurchase")}
            placeholder="100000"
            {...register("minPurchase")}
            isInvalid={!!errors.minPurchase}
            errorMessage={translateError(errors.minPurchase?.message as string)}
            className="text-xs"
          />

          <TijarahInput
            type="number"
            label={t("fieldMaxDiscount")}
            placeholder="50000"
            {...register("maxDiscount")}
            className="text-xs"
          />

          <TijarahInput
            type="number"
            label={t("fieldQuota")}
            placeholder="50"
            {...register("quota")}
            isInvalid={!!errors.quota}
            errorMessage={translateError(errors.quota?.message as string)}
            className="text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TijarahInput
            type="date"
            label={t("fieldExpiresAt")}
            {...register("expiresAt")}
            isInvalid={!!errors.expiresAt}
            errorMessage={translateError(errors.expiresAt?.message as string)}
            className="text-xs"
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">{t("fieldIsActive")}</label>
            <TijarahSelect
              selectedKey={String(currentIsActive)}
              onSelectionChange={(key) => {
                if (key) setValue("isActive", (key === "true") as any);
              }}
              className="text-xs"
            >
              <TijarahSelect.Item id="true">{t("statusOptionActive")}</TijarahSelect.Item>
              <TijarahSelect.Item id="false">{t("statusOptionInactive")}</TijarahSelect.Item>
            </TijarahSelect>
          </div>
        </div>
      </form>
    </TijarahModal>
  );
};

export default VoucherFormModal;
