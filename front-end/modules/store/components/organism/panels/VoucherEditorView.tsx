"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { voucherSchema, type VoucherFormData } from "../../../schemas/store.schema";
import { storeApi, type VoucherPayload } from "../../../api/store.api";
import type { StoreVoucher, StoreCustomer, StoreInventoryItem } from "../../../types/store.types";
import type { VoucherConditions, VoucherCustomRule } from "./VoucherConditionEditor";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Search,
  Check,
} from "lucide-react";

interface VoucherEditorViewProps {
  voucher: StoreVoucher | null;
  onCancel: () => void;
  onSubmit: (payload: VoucherPayload) => Promise<void>;
  isSaving: boolean;
}

const PAYMENT_METHODS = [
  { id: "CASH_STORE", labelId: "Tunai Gerai", labelEn: "Cash at Store" },
  { id: "QRIS_MOCKUP", labelId: "QRIS", labelEn: "QRIS" },
  { id: "BANK_TRANSFER_MOCKUP", labelId: "Transfer Bank", labelEn: "Bank Transfer" },
  { id: "B2B_CREDIT", labelId: "Kasbon Tempo B2B", labelEn: "B2B Credit" },
];

const DAYS_OF_WEEK = [
  { id: 0, labelId: "Min", labelEn: "Sun" },
  { id: 1, labelId: "Sen", labelEn: "Mon" },
  { id: 2, labelId: "Sel", labelEn: "Tue" },
  { id: 3, labelId: "Rab", labelEn: "Wed" },
  { id: 4, labelId: "Kam", labelEn: "Thu" },
  { id: 5, labelId: "Jum", labelEn: "Fri" },
  { id: 6, labelId: "Sab", labelEn: "Sat" },
];

const SHIPPING_TYPES = [
  { id: "DELIVERY", labelId: "Kirim Kurir", labelEn: "Delivery" },
  { id: "PICKUP", labelId: "Ambil di Gerai", labelEn: "Store Pickup" },
];

const CHANNELS = [
  { id: "ONLINE", labelId: "Toko Online", labelEn: "Online Store" },
  { id: "POS_CASHIER", labelId: "Kasir POS Gerai", labelEn: "POS Cashier" },
];

export const VoucherEditorView: React.FC<VoucherEditorViewProps> = ({
  voucher,
  onCancel,
  onSubmit,
  isSaving,
}) => {
  const t = useTranslations("storeErp.vouchers");
  const locale = useLocale();
  const isEn = locale === "en";
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
  const watchedMinPurchase = watch("minPurchase");
  const watchedMaxDiscount = watch("maxDiscount");

  // Multi-condition state
  const [audienceTypes, setAudienceTypes] = useState<string[]>([]);
  const [minCount, setMinCount] = useState<number>(0);
  const [minItems, setMinItems] = useState<number>(1);
  const [maxUsagePerUser, setMaxUsagePerUser] = useState<number>(1);
  const [allowedPayments, setAllowedPayments] = useState<string[]>([]);
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [allowedSkus, setAllowedSkus] = useState<string[]>([]);
  const [validFrom, setValidFrom] = useState<string>("");
  const [allowedDays, setAllowedDays] = useState<number[]>([]);
  const [allowedShippingTypes, setAllowedShippingTypes] = useState<string[]>([]);
  const [applicableChannels, setApplicableChannels] = useState<string[]>([]);
  const [autoApply, setAutoApply] = useState<boolean>(false);
  const [stackable, setStackable] = useState<boolean>(false);
  const [customRules, setCustomRules] = useState<VoucherCustomRule[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Reference data
  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [inventory, setInventory] = useState<StoreInventoryItem[]>([]);
  const [isLoadingRef, setIsLoadingRef] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [skuSearch, setSkuSearch] = useState("");

  useEffect(() => {
    const loadRefData = async () => {
      setIsLoadingRef(true);
      try {
        const [custData, invData] = await Promise.all([
          storeApi.getCustomers().catch(() => []),
          storeApi.getInventory().catch(() => []),
        ]);
        setCustomers(custData);
        setInventory(invData);
      } finally {
        setIsLoadingRef(false);
      }
    };
    loadRefData();
  }, []);

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

      const existing = (voucher.conditions || {}) as VoucherConditions;
      const initAudiences = Array.isArray(existing.audienceTypes)
        ? existing.audienceTypes
        : existing.targetAudience && existing.targetAudience !== "ALL" && existing.targetAudience !== "MULTI"
        ? [existing.targetAudience]
        : [];
      setAudienceTypes(initAudiences);
      setMinCount(existing.minPurchaseCount || 0);
      setMinItems(existing.minItemsCount || 1);
      setMaxUsagePerUser(existing.maxUsagePerUser ?? 1);
      setAllowedPayments(existing.allowedPaymentMethods || []);
      setAllowedCategories(existing.allowedCategories || []);
      setAllowedSkus(existing.allowedProductSkus || []);
      setValidFrom(existing.validFrom ? existing.validFrom.slice(0, 10) : "");
      setAllowedDays(existing.allowedDaysOfWeek || []);
      setAllowedShippingTypes(existing.allowedShippingTypes || []);
      setApplicableChannels(existing.applicableChannels || []);
      setAutoApply(Boolean(existing.autoApply));
      setStackable(Boolean(existing.stackable));
      setCustomRules(existing.customRules || []);
      setSelectedUserIds(existing.targetUserIds || []);
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
      setAudienceTypes([]);
      setMinCount(0);
      setMinItems(1);
      setMaxUsagePerUser(1);
      setAllowedPayments([]);
      setAllowedCategories([]);
      setAllowedSkus([]);
      setValidFrom("");
      setAllowedDays([]);
      setAllowedShippingTypes([]);
      setApplicableChannels([]);
      setAutoApply(false);
      setStackable(false);
      setCustomRules([]);
      setSelectedUserIds([]);
    }
  }, [voucher, reset]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>(["HERBAL", "BEVERAGE", "COSMETICS"]);
    for (const item of inventory) {
      if (item.category) set.add(String(item.category).toUpperCase());
    }
    return Array.from(set);
  }, [inventory]);

  const toggleItem = <T,>(arr: T[], val: T, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const handleToggleAudience = (key: string) => {
    setAudienceTypes((prev) => {
      if (prev.includes(key)) return prev.filter((x) => x !== key);
      if (key === "AGENTS_ONLY") return [...prev.filter((x) => x !== "CONSUMERS_ONLY"), key];
      if (key === "CONSUMERS_ONLY") return [...prev.filter((x) => x !== "AGENTS_ONLY"), key];
      return [...prev, key];
    });
  };

  const translateError = (msg?: string) => {
    if (!msg) return undefined;
    if (msg === "INVALID_CODE") return t("errInvalidCode");
    if (msg === "REQUIRED") return t("errRequired");
    if (msg === "MAX_100_PERCENT") return t("errMax100");
    return msg;
  };

  const handleUnifiedSubmit = async (data: VoucherFormData) => {
    const defaultExpiry = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const resolvedExpiresDate = data.expiresAt?.trim() || defaultExpiry;

    const conditions: VoucherConditions = {
      audienceTypes,
      targetAudience:
        audienceTypes.length === 1 ? audienceTypes[0] : audienceTypes.length === 0 ? "ALL" : "MULTI",
      targetUserIds: audienceTypes.includes("SPECIFIC_USERS") ? selectedUserIds : [],
      minPurchaseCount: Number(minCount) || 0,
      minTransactionAmount: Number(data.minPurchase ?? 0) || 0,
      maxDiscountAmount: data.maxDiscount ? Number(data.maxDiscount) : 0,
      minItemsCount: Number(minItems) || 1,
      maxUsagePerUser: Number(maxUsagePerUser) || 1,
      allowedPaymentMethods: allowedPayments,
      allowedCategories,
      allowedProductSkus: allowedSkus,
      validFrom: validFrom ? `${validFrom}T00:00:00Z` : undefined,
      allowedDaysOfWeek: allowedDays,
      allowedShippingTypes,
      applicableChannels,
      autoApply,
      stackable,
      customRules: customRules.filter((r) => Number(r.value) > 0),
    };

    await onSubmit({
      code: data.code,
      title: data.title || data.code,
      description: data.description || data.title || data.code,
      discountType: data.discountType || "FIXED",
      discountValue: Number(data.discountValue ?? 0),
      minPurchase: Number(data.minPurchase ?? 0),
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
      quota: Number(data.quota ?? 100),
      isActive: data.isActive ?? true,
      expiresAt: `${resolvedExpiresDate}T23:59:59Z`,
      conditions,
    });
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(userSearch)) ||
      (c.hniMemberId && c.hniMemberId.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredInventory = inventory
    .filter(
      (it) =>
        it.sku.toLowerCase().includes(skuSearch.toLowerCase()) ||
        it.name.toLowerCase().includes(skuSearch.toLowerCase())
    )
    .slice(0, 30);

  const audienceOptions = [
    { key: "AGENTS_ONLY", label: t("condAudAgents"), desc: t("condAudAgentsDesc") },
    { key: "CONSUMERS_ONLY", label: t("condAudConsumers"), desc: t("condAudConsumersDesc") },
    { key: "FIRST_TIME_BUYER", label: t("condAudFirstTime"), desc: t("condAudFirstTimeDesc") },
    { key: "SPECIFIC_USERS", label: t("condAudSpecific"), desc: t("condAudSpecificDesc") },
  ];

  const activeRuleCount =
    audienceTypes.length +
    (Number(watchedMinPurchase || 0) > 0 ? 1 : 0) +
    (Number(watchedMaxDiscount || 0) > 0 ? 1 : 0) +
    (minItems > 1 ? 1 : 0) +
    (minCount > 0 ? 1 : 0) +
    (maxUsagePerUser !== 1 ? 1 : 0) +
    allowedPayments.length +
    allowedCategories.length +
    allowedSkus.length +
    (validFrom ? 1 : 0) +
    (allowedDays.length > 0 ? 1 : 0) +
    customRules.length;

  return (
    <form onSubmit={handleSubmit(handleUnifiedSubmit)} className="flex flex-col gap-5 w-full">
      {/* Top Action Bar */}
      <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 px-2.5 rounded-lg border border-border-subtle bg-canvas hover:bg-surface text-xs font-medium text-text-primary inline-flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("backToList")}</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-text-primary truncate">
              {isEdit ? t("formEditTitle", { code: voucher.code }) : t("formCreateTitle")}
            </h2>
            <p className="text-[11px] text-text-muted truncate">
              {t("rulesCount", { count: activeRuleCount })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <TijarahButton
            type="button"
            tijarahVariant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs h-8 px-3 rounded-lg"
          >
            {t("formCancel")}
          </TijarahButton>
          <TijarahButton
            type="submit"
            tijarahVariant="primary"
            size="sm"
            isLoading={isSaving}
            className="text-xs h-8 px-4 rounded-lg font-semibold flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEdit ? t("formSubmitEdit") : t("formSubmitCreate")}</span>
          </TijarahButton>
        </div>
      </div>

      {/* Unified 2-Column Editorial Form */}
      <div className="bg-surface border border-border-subtle rounded-xl p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column (7 cols): Basic Info + Transaction/Schedule + Custom Rules */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section: Basic Info */}
            <section className="space-y-3 pb-5 border-b border-border-subtle">
              <h3 className="text-sm font-semibold text-text-primary">{t("sectionBasic")}</h3>

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
                  <label className="text-xs font-semibold text-text-primary">
                    {t("fieldDiscountType")}
                  </label>
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
                  className="text-xs font-semibold text-primary-sage"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <TijarahInput
                  type="date"
                  label={t("condValidFrom")}
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="text-xs"
                />
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
            </section>

            {/* Section: Transaction & Payment Rules */}
            <section className="space-y-4 pb-5 border-b border-border-subtle">
              <h3 className="text-sm font-semibold text-text-primary">{t("sectionTransaction")}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <TijarahInput
                  type="number"
                  label={t("condMinItems")}
                  value={String(minItems)}
                  onChange={(e) => setMinItems(Math.max(1, Number(e.target.value) || 1))}
                  className="text-xs"
                />
                <TijarahInput
                  type="number"
                  label={t("condMinHistory")}
                  value={String(minCount)}
                  onChange={(e) => setMinCount(Number(e.target.value) || 0)}
                  className="text-xs"
                />
                <TijarahInput
                  type="number"
                  label={t("condMaxUsagePerUser")}
                  value={String(maxUsagePerUser)}
                  onChange={(e) => setMaxUsagePerUser(Math.max(1, Number(e.target.value) || 1))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted block">
                  {t("condPaymentTitle")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((pm) => {
                    const active = allowedPayments.includes(pm.id);
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => toggleItem(allowedPayments, pm.id, setAllowedPayments)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                          active
                            ? "bg-primary-sage text-white border-primary-sage"
                            : "bg-canvas text-text-primary border-border-subtle hover:bg-surface"
                        }`}
                      >
                        {active && <Check className="w-3 h-3" />}
                        <span>{isEn ? pm.labelEn : pm.labelId}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted block">
                  {t("condAllowedDays")}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const active = allowedDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleItem(allowedDays, d.id, setAllowedDays)}
                        className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                          active
                            ? "bg-primary-sage text-white border-primary-sage"
                            : "bg-canvas text-text-primary border-border-subtle hover:bg-surface"
                        }`}
                      >
                        {isEn ? d.labelEn : d.labelId}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted block">
                    {t("condShippingTitle")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SHIPPING_TYPES.map((st) => {
                      const active = allowedShippingTypes.includes(st.id);
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() =>
                            toggleItem(allowedShippingTypes, st.id, setAllowedShippingTypes)
                          }
                          className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                            active
                              ? "bg-primary-sage text-white border-primary-sage"
                              : "bg-canvas text-text-primary border-border-subtle hover:bg-surface"
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          <span>{isEn ? st.labelEn : st.labelId}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted block">
                    {t("condChannelTitle")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CHANNELS.map((ch) => {
                      const active = applicableChannels.includes(ch.id);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() =>
                            toggleItem(applicableChannels, ch.id, setApplicableChannels)
                          }
                          className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                            active
                              ? "bg-primary-sage text-white border-primary-sage"
                              : "bg-canvas text-text-primary border-border-subtle hover:bg-surface"
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          <span>{isEn ? ch.labelEn : ch.labelId}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApply}
                    onChange={(e) => setAutoApply(e.target.checked)}
                    className="rounded border-border-subtle"
                  />
                  <span>{t("condAutoApply")}</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stackable}
                    onChange={(e) => setStackable(e.target.checked)}
                    className="rounded border-border-subtle"
                  />
                  <span>{t("condStackable")}</span>
                </label>
              </div>
            </section>

            {/* Section: Custom Dynamic Rules */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-text-primary">{t("condCustomRulesTitle")}</h3>
                <TijarahButton
                  type="button"
                  size="sm"
                  tijarahVariant="outline"
                  onClick={() =>
                    setCustomRules((prev) => [...prev, { field: "SUBTOTAL", operator: ">=", value: 100000 }])
                  }
                  className="text-xs h-7 px-2.5 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t("condAddRule")}</span>
                </TijarahButton>
              </div>

              {customRules.length === 0 ? (
                <p className="text-xs text-text-muted">{t("condNoCustomRules")}</p>
              ) : (
                <div className="space-y-2">
                  {customRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 p-2.5 rounded-lg border border-border-subtle bg-canvas"
                    >
                      <div className="sm:col-span-5">
                        <TijarahSelect
                          aria-label={t("condCustomRulesTitle")}
                          selectedKey={rule.field}
                          onSelectionChange={(key) => {
                            if (key) {
                              setCustomRules((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, field: String(key) as any } : r))
                              );
                            }
                          }}
                          className="text-xs"
                        >
                          <TijarahSelect.Item id="SUBTOTAL">{t("condFieldSubtotal")}</TijarahSelect.Item>
                          <TijarahSelect.Item id="TOTAL_QTY">{t("condFieldTotalQty")}</TijarahSelect.Item>
                          <TijarahSelect.Item id="TOTAL_TP_POINTS">{t("condFieldTotalTp")}</TijarahSelect.Item>
                        </TijarahSelect>
                      </div>
                      <div className="sm:col-span-3">
                        <TijarahSelect
                          aria-label="Operator"
                          selectedKey={rule.operator}
                          onSelectionChange={(key) => {
                            if (key) {
                              setCustomRules((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, operator: String(key) as any } : r
                                )
                              );
                            }
                          }}
                          className="text-xs font-mono"
                        >
                          <TijarahSelect.Item id=">=">&gt;=</TijarahSelect.Item>
                          <TijarahSelect.Item id="<=">&lt;=</TijarahSelect.Item>
                          <TijarahSelect.Item id="==">=</TijarahSelect.Item>
                        </TijarahSelect>
                      </div>
                      <div className="sm:col-span-3">
                        <TijarahInput
                          type="number"
                          value={String(rule.value)}
                          onChange={(e) =>
                            setCustomRules((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, value: Number(e.target.value) || 0 } : r
                              )
                            )
                          }
                          className="text-xs font-mono"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setCustomRules((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-status-danger hover:bg-status-danger/10 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column (5 cols): Audience + VIP Users + Categories & SKUs */}
          <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-border-subtle lg:pl-6">
            {/* Audience Segments */}
            <section className="space-y-2.5 pb-5 border-b border-border-subtle">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{t("sectionAudience")}</h3>
                <p className="text-[11px] text-text-muted mt-0.5">{t("condAudienceHint")}</p>
              </div>

              <div className="space-y-1.5">
                {audienceOptions.map((opt) => {
                  const checked = audienceTypes.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleToggleAudience(opt.key)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-start justify-between gap-2 ${
                        checked
                          ? "border-primary-sage bg-primary-sage/10"
                          : "border-border-subtle bg-canvas hover:bg-surface"
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-text-primary block">{opt.label}</span>
                        <span className="text-[11px] text-text-muted block">{opt.desc}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                          checked
                            ? "border-primary-sage bg-primary-sage text-white"
                            : "border-border-subtle bg-surface"
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* VIP Customer Checklist */}
              {audienceTypes.includes("SPECIFIC_USERS") && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">
                      {t("condVipTitle")} ({selectedUserIds.length})
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedUserIds(customers.map((c) => c.id))}
                        className="text-primary-sage font-semibold hover:underline"
                      >
                        {t("condSelectAll")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUserIds([])}
                        className="text-status-danger font-semibold hover:underline"
                      >
                        {t("condClearAll")}
                      </button>
                    </div>
                  </div>
                  <TijarahInput
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={t("condSearchUser")}
                    startContent={<Search className="w-3.5 h-3.5 text-text-muted" />}
                    className="text-xs h-8"
                  />
                  <div className="max-h-48 overflow-y-auto divide-y divide-border-subtle border border-border-subtle rounded-lg bg-canvas">
                    {isLoadingRef ? (
                      <p className="text-center py-4 text-xs text-text-muted">{t("condLoadingUsers")}</p>
                    ) : filteredCustomers.length === 0 ? (
                      <p className="text-center py-4 text-xs text-text-muted">{t("condNoUsers")}</p>
                    ) : (
                      filteredCustomers.map((c) => {
                        const isSelected = selectedUserIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleItem(selectedUserIds, c.id, setSelectedUserIds)}
                            className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-surface"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-text-primary truncate">{c.name}</p>
                              <p className="text-[10px] text-text-muted truncate">
                                {c.hniMemberId ? `ID: ${c.hniMemberId}` : c.phone || c.id}
                              </p>
                            </div>
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-primary-sage border-primary-sage text-white"
                                  : "border-border-subtle bg-surface"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Categories & Specific SKUs */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">{t("sectionProducts")}</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted block">
                  {t("condCategoryTitle")}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableCategories.map((cat) => {
                    const active = allowedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleItem(allowedCategories, cat, setAllowedCategories)}
                        className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                          active
                            ? "bg-primary-sage text-white border-primary-sage"
                            : "bg-canvas text-text-primary border-border-subtle hover:bg-surface"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-muted">{t("condSkuTitle")}</label>
                  {allowedSkus.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAllowedSkus([])}
                      className="text-[11px] text-status-danger font-medium hover:underline"
                    >
                      {t("condClearAll")} ({allowedSkus.length})
                    </button>
                  )}
                </div>
                <TijarahInput
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  placeholder={t("condSkuPlaceholder")}
                  startContent={<Search className="w-3.5 h-3.5 text-text-muted" />}
                  className="text-xs h-8"
                />
                <div className="max-h-44 overflow-y-auto divide-y divide-border-subtle border border-border-subtle rounded-lg bg-canvas">
                  {filteredInventory.map((item) => {
                    const active = allowedSkus.includes(item.sku);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItem(allowedSkus, item.sku, setAllowedSkus)}
                        className="w-full text-left px-3 py-1.5 flex items-center justify-between gap-2 hover:bg-surface text-xs"
                      >
                        <span className="truncate">
                          <span className="font-mono font-semibold text-primary-sage">{item.sku}</span>{" "}
                          <span className="text-text-primary">{item.name}</span>
                        </span>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            active
                              ? "bg-primary-sage border-primary-sage text-white"
                              : "border-border-subtle bg-surface"
                          }`}
                        >
                          {active && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </form>
  );
};

export default VoucherEditorView;
