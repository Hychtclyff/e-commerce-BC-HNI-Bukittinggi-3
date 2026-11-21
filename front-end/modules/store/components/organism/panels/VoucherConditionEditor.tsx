"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { storeApi } from "@/modules/store/api/store.api";
import type { StoreVoucher, StoreCustomer, StoreInventoryItem } from "@/modules/store/types/store.types";
import { showToast } from "@/utils/toast";
import { formatCurrency } from "@/utils/formatters";
import {
  SlidersHorizontal,
  Users,
  Check,
  X,
  Save,
  DollarSign,
  Search,
  CreditCard,
  Layers,
  Tag,
  CalendarClock,
  Plus,
  Trash2,
} from "lucide-react";

export interface VoucherCustomRule {
  field: "SUBTOTAL" | "TOTAL_QTY" | "TOTAL_TP_POINTS";
  operator: ">=" | "<=" | "==";
  value: number;
}

export interface VoucherConditions {
  audienceTypes?: string[];
  targetAudience?: string;
  targetUserIds?: string[];
  minPurchaseCount?: number;
  minTransactionAmount?: number;
  maxDiscountAmount?: number;
  minItemsCount?: number;
  maxUsagePerUser?: number;
  allowedPaymentMethods?: string[];
  allowedCategories?: string[];
  allowedProductSkus?: string[];
  validFrom?: string;
  allowedDaysOfWeek?: number[];
  allowedShippingTypes?: string[];
  applicableChannels?: string[];
  autoApply?: boolean;
  stackable?: boolean;
  customRules?: VoucherCustomRule[];
}

interface VoucherConditionEditorProps {
  voucher: StoreVoucher;
  onSaved?: () => void;
  onClose?: () => void;
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

export const VoucherConditionEditor: React.FC<VoucherConditionEditorProps> = ({
  voucher,
  onSaved,
  onClose,
}) => {
  const t = useTranslations("storeErp.vouchers");
  const locale = useLocale();
  const isEn = locale === "en";

  const [audienceTypes, setAudienceTypes] = useState<string[]>([]);
  const [minCount, setMinCount] = useState<number>(0);
  const [minAmount, setMinAmount] = useState<number>(voucher.minPurchase || 0);
  const [maxDiscount, setMaxDiscount] = useState<number>(voucher.maxDiscount || 0);
  const [minItems, setMinItems] = useState<number>(1);
  const [maxUsagePerUser, setMaxUsagePerUser] = useState<number>(1);
  const [allowedPayments, setAllowedPayments] = useState<string[]>([]);
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [allowedSkus, setAllowedSkus] = useState<string[]>([]);
  const [validFrom, setValidFrom] = useState<string>("");
  const [allowedDays, setAllowedDays] = useState<number[]>([]);
  const [customRules, setCustomRules] = useState<VoucherCustomRule[]>([]);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [inventory, setInventory] = useState<StoreInventoryItem[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [skuSearch, setSkuSearch] = useState("");

  useEffect(() => {
    const loadRefData = async () => {
      setIsLoadingCustomers(true);
      try {
        const [custData, invData] = await Promise.all([
          storeApi.getCustomers().catch(() => []),
          storeApi.getInventory().catch(() => []),
        ]);
        setCustomers(custData);
        setInventory(invData);
      } finally {
        setIsLoadingCustomers(false);
      }
    };
    loadRefData();

    const existing = ((voucher as any).conditions || {}) as VoucherConditions;
    const initAudiences = Array.isArray(existing.audienceTypes)
      ? existing.audienceTypes
      : existing.targetAudience && existing.targetAudience !== "ALL"
      ? [existing.targetAudience]
      : [];

    setAudienceTypes(initAudiences);
    setMinCount(existing.minPurchaseCount || 0);
    setMinAmount(existing.minTransactionAmount ?? voucher.minPurchase ?? 0);
    setMaxDiscount(existing.maxDiscountAmount ?? voucher.maxDiscount ?? 0);
    setMinItems(existing.minItemsCount || 1);
    setMaxUsagePerUser(existing.maxUsagePerUser ?? 1);
    setAllowedPayments(existing.allowedPaymentMethods || []);
    setAllowedCategories(existing.allowedCategories || []);
    setAllowedSkus(existing.allowedProductSkus || []);
    setValidFrom(existing.validFrom ? existing.validFrom.slice(0, 10) : "");
    setAllowedDays(existing.allowedDaysOfWeek || []);
    setCustomRules(existing.customRules || []);
    setSelectedUserIds(existing.targetUserIds || []);
  }, [voucher]);

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
      // AGENTS_ONLY and CONSUMERS_ONLY are mutually exclusive
      if (key === "AGENTS_ONLY") return [...prev.filter((x) => x !== "CONSUMERS_ONLY"), key];
      if (key === "CONSUMERS_ONLY") return [...prev.filter((x) => x !== "AGENTS_ONLY"), key];
      return [...prev, key];
    });
  };

  const handleAddCustomRule = () => {
    setCustomRules((prev) => [...prev, { field: "SUBTOTAL", operator: ">=", value: 100000 }]);
  };

  const handleUpdateCustomRule = (idx: number, patch: Partial<VoucherCustomRule>) => {
    setCustomRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleRemoveCustomRule = (idx: number) => {
    setCustomRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: VoucherConditions = {
        audienceTypes,
        targetAudience: audienceTypes.length === 1 ? audienceTypes[0] : audienceTypes.length === 0 ? "ALL" : "MULTI",
        targetUserIds: audienceTypes.includes("SPECIFIC_USERS") ? selectedUserIds : [],
        minPurchaseCount: Number(minCount) || 0,
        minTransactionAmount: Number(minAmount) || 0,
        maxDiscountAmount: Number(maxDiscount) || 0,
        minItemsCount: Number(minItems) || 1,
        maxUsagePerUser: Number(maxUsagePerUser) || 1,
        allowedPaymentMethods: allowedPayments,
        allowedCategories,
        allowedProductSkus: allowedSkus,
        validFrom: validFrom ? `${validFrom}T00:00:00Z` : undefined,
        allowedDaysOfWeek: allowedDays,
        customRules: customRules.filter((r) => Number(r.value) > 0),
      };

      const res = await storeApi.updateVoucherConditions(voucher.id, payload);
      if (res.success) {
        showToast.success(t("condSaveSuccess"), t("condSaveSuccessDesc"));
        if (onSaved) onSaved();
      } else {
        showToast.error(t("condSaveError"), res.message);
      }
    } catch (err: any) {
      showToast.error(t("condSaveError"), err?.message || "");
    } finally {
      setIsSaving(false);
    }
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

  const activeRuleCount =
    audienceTypes.length +
    (minAmount > 0 ? 1 : 0) +
    (maxDiscount > 0 ? 1 : 0) +
    (minItems > 1 ? 1 : 0) +
    (minCount > 0 ? 1 : 0) +
    (maxUsagePerUser !== 1 ? 1 : 0) +
    allowedPayments.length +
    allowedCategories.length +
    allowedSkus.length +
    (validFrom ? 1 : 0) +
    (allowedDays.length > 0 ? 1 : 0) +
    customRules.length;

  const audienceOptions = [
    { key: "AGENTS_ONLY", label: t("condAudAgents"), desc: t("condAudAgentsDesc") },
    { key: "CONSUMERS_ONLY", label: t("condAudConsumers"), desc: t("condAudConsumersDesc") },
    { key: "FIRST_TIME_BUYER", label: t("condAudFirstTime"), desc: t("condAudFirstTimeDesc") },
    { key: "SPECIFIC_USERS", label: t("condAudSpecific"), desc: t("condAudSpecificDesc") },
  ];

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-sage/15 text-primary-sage flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                {t("condTitle", { code: voucher.code })}
              </h3>
              <TijarahBadge tijarahVariant="primary" className="text-[10px] font-bold">
                {t("rulesCount", { count: activeRuleCount })}
              </TijarahBadge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">{t("condSubtitle")}</p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg hover:bg-canvas flex items-center justify-center text-text-muted hover:text-text-primary transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Dynamic Multi-Conditions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Multi-Select Audience */}
          <div className="p-4 rounded-xl bg-canvas/50 border border-border-subtle space-y-2.5">
            <div>
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary-sage" />
                {t("condAudienceTitle")}
              </h4>
              <p className="text-[11px] text-text-muted mt-0.5">{t("condAudienceHint")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {audienceOptions.map((opt) => {
                const checked = audienceTypes.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleToggleAudience(opt.key)}
                    className={`text-left p-3 rounded-xl border transition-colors flex items-start justify-between gap-2 ${
                      checked
                        ? "border-primary-sage bg-primary-sage/10"
                        : "border-border-subtle bg-surface hover:bg-canvas"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-text-primary block">{opt.label}</span>
                      <span className="text-[11px] text-text-muted block mt-0.5 leading-snug">{opt.desc}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                        checked ? "border-primary-sage bg-primary-sage text-white" : "border-border-subtle"
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Limits */}
          <div className="p-4 rounded-xl bg-canvas/50 border border-border-subtle space-y-3">
            <h4 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-accent-gold" />
              {t("condLimitsTitle")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <TijarahInput
                type="number"
                label={t("condMinAmount")}
                value={String(minAmount)}
                onChange={(e) => setMinAmount(Number(e.target.value) || 0)}
                className="text-xs"
              />
              <TijarahInput
                type="number"
                label={t("condMaxDiscount")}
                value={String(maxDiscount)}
                onChange={(e) => setMaxDiscount(Number(e.target.value) || 0)}
                className="text-xs"
              />
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
          </div>

          {/* 3 & 4. Multi-Select Payments & Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-canvas/50 border border-border-subtle space-y-2.5">
              <h4 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-primary-sage" />
                {t("condPaymentTitle")}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((pm) => {
                  const active = allowedPayments.includes(pm.id);
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => toggleItem(allowedPayments, pm.id, setAllowedPayments)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                        active
                          ? "bg-primary-sage text-white border-primary-sage"
                          : "bg-surface text-text-primary border-border-subtle hover:bg-canvas"
                      }`}
                    >
                      {isEn ? pm.labelEn : pm.labelId}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-canvas/50 border border-border-subtle space-y-2.5">
              <h4 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary-sage" />
                {t("condCategoryTitle")}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {availableCategories.map((cat) => {
                  const active = allowedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleItem(allowedCategories, cat, setAllowedCategories)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                        active
                          ? "bg-primary-sage text-white border-primary-sage"
                          : "bg-surface text-text-primary border-border-subtle hover:bg-canvas"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Specific SKUs Multi-Select */}
          <div className="p-4 rounded-xl bg-canvas/50 border border-border-subtle space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary-sage" />
                {t("condSkuTitle")}
              </h4>
              {allowedSkus.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAllowedSkus([])}
                  className="text-[11px] text-status-danger font-semibold hover:underline"
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
            <div className="max-h-32 overflow-y-auto flex flex-wrap gap-1.5 pt-1">
              {filteredInventory.map((item) => {
                const active = allowedSkus.includes(item.sku);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(allowedSkus, item.sku, setAllowedSkus)}
                    className={`px-2 py-1 rounded-md border text-[11px] font-mono transition-colors ${
                      active
                        ? "bg-primary-sage text-white border-primary-sage"
                        : "bg-surface text-text-primary border-border-subtle hover:bg-canvas"
                    }`}
                  >
                    {item.sku} · {item.name.slice(0, 18)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Schedule & Active Days */}
          <div className="p-4 rounded-xl bg-canvas/50 border border-border-subtle space-y-3">
            <h4 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-primary-sage" />
              {t("condScheduleTitle")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <TijarahInput
                type="date"
                label={t("condValidFrom")}
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="text-xs"
              />
              <div>
                <label className="text-[11px] font-semibold text-text-muted block mb-1.5">
                  {t("condAllowedDays")}
                </label>
                <div className="flex flex-wrap gap-1">
                  {DAYS_OF_WEEK.map((d) => {
                    const active = allowedDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleItem(allowedDays, d.id, setAllowedDays)}
                        className={`px-2 py-1 rounded-md border text-[11px] font-semibold transition-colors ${
                          active
                            ? "bg-primary-sage text-white border-primary-sage"
                            : "bg-surface text-text-primary border-border-subtle hover:bg-canvas"
                        }`}
                      >
                        {isEn ? d.labelEn : d.labelId}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 7. Dynamic Custom Rules Builder */}
          <div className="p-4 rounded-xl bg-canvas/50 border border-border-subtle space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-xs text-text-primary">{t("condCustomRulesTitle")}</h4>
              <TijarahButton
                type="button"
                size="sm"
                tijarahVariant="outline"
                onClick={handleAddCustomRule}
                className="text-[11px] h-7 px-2.5 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{t("condAddRule")}</span>
              </TijarahButton>
            </div>

            {customRules.length === 0 ? (
              <p className="text-[11px] text-text-muted">{t("condNoCustomRules")}</p>
            ) : (
              <div className="space-y-2">
                {customRules.map((rule, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 bg-surface p-2 rounded-lg border border-border-subtle">
                    <select
                      value={rule.field}
                      onChange={(e) => handleUpdateCustomRule(idx, { field: e.target.value as any })}
                      className="h-8 px-2 rounded-md border border-border-subtle bg-canvas text-xs text-text-primary"
                    >
                      <option value="SUBTOTAL">{t("condFieldSubtotal")}</option>
                      <option value="TOTAL_QTY">{t("condFieldTotalQty")}</option>
                      <option value="TOTAL_TP_POINTS">{t("condFieldTotalTp")}</option>
                    </select>
                    <select
                      value={rule.operator}
                      onChange={(e) => handleUpdateCustomRule(idx, { operator: e.target.value as any })}
                      className="h-8 px-2 rounded-md border border-border-subtle bg-canvas text-xs font-mono text-text-primary"
                    >
                      <option value=">=">&gt;=</option>
                      <option value="<=">&lt;=</option>
                      <option value="==">=</option>
                    </select>
                    <input
                      type="number"
                      value={rule.value}
                      onChange={(e) => handleUpdateCustomRule(idx, { value: Number(e.target.value) || 0 })}
                      className="h-8 w-28 px-2 rounded-md border border-border-subtle bg-canvas text-xs font-mono text-text-primary"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomRule(idx)}
                      className="p-1.5 text-status-danger hover:bg-status-danger/10 rounded-md ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: VIP Multi-Select Customers (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-3 p-4 rounded-xl bg-canvas/50 border border-border-subtle">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-xs text-text-primary">{t("condVipTitle")}</h4>
            <TijarahBadge tijarahVariant="primary" className="text-[10px]">
              {t("condSelectedCount", { count: selectedUserIds.length })}
            </TijarahBadge>
          </div>

          <TijarahInput
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder={t("condSearchUser")}
            startContent={<Search className="w-3.5 h-3.5 text-text-muted" />}
            className="text-xs h-8"
          />

          <div className="flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedUserIds(customers.map((c) => c.id))}
              className="text-primary-sage font-bold hover:underline"
            >
              {t("condSelectAll")} ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedUserIds([])}
              className="text-status-danger font-bold hover:underline"
            >
              {t("condClearAll")}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[420px] space-y-1.5 pr-1">
            {isLoadingCustomers ? (
              <p className="text-center py-8 text-xs text-text-muted">{t("condLoadingUsers")}</p>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-center py-8 text-xs text-text-muted">{t("condNoUsers")}</p>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedUserIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleItem(selectedUserIds, c.id, setSelectedUserIds)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? "border-primary-sage bg-primary-sage/10"
                        : "border-border-subtle bg-surface hover:bg-canvas"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-text-primary truncate">{c.name}</p>
                      <p className="text-[10px] text-text-muted truncate">
                        {c.hniMemberId ? `ID: ${c.hniMemberId}` : c.phone || c.id}
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-primary-sage border-primary-sage text-white" : "border-border-subtle"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {audienceTypes.includes("SPECIFIC_USERS") && (
            <p className="text-[11px] text-accent-gold font-medium bg-accent-gold/10 p-2.5 rounded-lg border border-accent-gold/20">
              {t("condVipHint")}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs text-text-muted">
          <span>{t("condSummaryLabel")} </span>
          <strong className="text-text-primary">
            {t("rulesCount", { count: activeRuleCount })}
          </strong>
          {minAmount > 0 && <span> · Min {formatCurrency(minAmount)}</span>}
        </div>

        <div className="flex items-center justify-end gap-2">
          {onClose && (
            <TijarahButton
              type="button"
              tijarahVariant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-xl"
            >
              {t("formCancel")}
            </TijarahButton>
          )}

          <TijarahButton
            type="button"
            tijarahVariant="primary"
            size="sm"
            isLoading={isSaving}
            onClick={handleSave}
            className="text-xs h-9 px-5 rounded-xl font-bold flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? t("condSavingBtn") : t("condSaveBtn")}</span>
          </TijarahButton>
        </div>
      </div>
    </div>
  );
};

export default VoucherConditionEditor;
