"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { nonHniProductSchema, type NonHniProductFormData } from "../../../schemas/store.schema";
import type { StoreNonHniProduct, StoreMerchant } from "../../../types/store.types";
import type { NonHniProductPayload } from "../../../api/store.api";

export interface INonHniProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: StoreNonHniProduct | null;
  merchants?: StoreMerchant[];
  onSubmit: (payload: NonHniProductPayload) => Promise<void>;
  isLoading: boolean;
}

export const NonHniProductFormModal: React.FC<INonHniProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSubmit,
  isLoading,
}) => {
  const t = useTranslations("storeErp.nonHni");
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any, any, NonHniProductFormData>({
    resolver: zodResolver(nonHniProductSchema),
    defaultValues: {
      name: "",
      category: "Perlengkapan POS",
      price: 25000 as any,
      stock: 20 as any,
      merchantId: "",
      weight: 100 as any,
      dimensions: "",
      warranty: "-",
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        category: product.category,
        price: product.price as any,
        stock: (product.stock ?? 20) as any,
        merchantId: product.merchantId || "",
        weight: (product.weight ?? 100) as any,
        dimensions: product.dimensions || "",
        warranty: product.warranty || "-",
      });
    } else {
      reset({
        name: "",
        category: "Perlengkapan POS",
        price: 25000 as any,
        stock: 20 as any,
        merchantId: "",
        weight: 100 as any,
        dimensions: "",
        warranty: "-",
      });
    }
  }, [product, reset, isOpen]);

  const handleFormSubmit = async (data: NonHniProductFormData) => {
    await onSubmit({
      name: data.name,
      category: data.category,
      price: data.price,
      stock: data.stock,
      merchantId: undefined,
      weight: data.weight,
      dimensions: data.dimensions,
      warranty: data.warranty,
    });
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t("modalEditTitle", { name: product.name }) : t("modalCreateTitle")}
      description={isEdit ? t("modalEditDesc") : t("modalCreateDesc")}
      confirmText={isEdit ? t("saveBtn") : t("createBtn")}
      confirmVariant="primary"
      isConfirmLoading={isLoading}
      onConfirm={handleSubmit(handleFormSubmit)}
      showCancelButton
      cancelText={t("cancelBtn")}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TijarahInput
            label={t("fieldName")}
            placeholder={t("fieldNamePlaceholder")}
            {...register("name")}
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message as string}
            className="text-xs font-semibold"
          />

          <TijarahInput
            label={t("fieldCategory")}
            placeholder={t("fieldCategoryPlaceholder")}
            {...register("category")}
            isInvalid={!!errors.category}
            errorMessage={errors.category?.message as string}
            className="text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TijarahInput
            type="number"
            label={t("fieldPrice")}
            placeholder="45000"
            {...register("price")}
            isInvalid={!!errors.price}
            errorMessage={errors.price?.message as string}
            className="text-xs font-bold text-primary-sage"
          />

          <TijarahInput
            type="number"
            label={t("fieldStock")}
            placeholder="20"
            {...register("stock")}
            isInvalid={!!errors.stock}
            errorMessage={errors.stock?.message as string}
            className="text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TijarahInput
            type="number"
            label={t("fieldWeight")}
            placeholder="100"
            {...register("weight")}
            className="text-xs"
          />

          <TijarahInput
            label={t("fieldDimensions")}
            placeholder="80x80mm"
            {...register("dimensions")}
            className="text-xs"
          />

          <TijarahInput
            label={t("fieldWarranty")}
            placeholder="-"
            {...register("warranty")}
            className="text-xs"
          />
        </div>
      </form>
    </TijarahModal>
  );
};

export default NonHniProductFormModal;
