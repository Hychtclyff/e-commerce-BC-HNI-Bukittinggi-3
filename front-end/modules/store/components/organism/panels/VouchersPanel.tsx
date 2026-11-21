"use client";

import React, { useState, useMemo } from "react";
import type { StoreVoucher } from "../../../types/store.types";
import type { VoucherPayload } from "../../../api/store.api";
import { DeleteConfirmModal } from "../modals/DeleteConfirmModal";
import { VoucherEditorView } from "./VoucherEditorView";
import type { VoucherConditions } from "./VoucherConditionEditor";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTabs, TijarahTabList, TijarahTab } from "@/components/atom/tijarahTabs";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Ticket, Plus, Edit2, Trash2, Search, Copy, X } from "lucide-react";
import { useTranslations } from "next-intl";

export interface IVouchersPanelProps {
  vouchers: StoreVoucher[];
  isLoading: boolean;
  voucherStats?: {
    allocatedBudget: number;
    realizedBudget: number;
    roi: number;
  };
  onCreateVoucher?: (payload: VoucherPayload) => Promise<any>;
  onUpdateVoucher?: (params: { id: string; payload: VoucherPayload }) => Promise<any>;
  onDeleteVoucher?: (id: string) => Promise<any>;
  onRefresh?: () => Promise<any>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

function summarizeConditions(cond?: VoucherConditions | null): string[] {
  if (!cond) return [];
  const tags: string[] = [];
  if (Array.isArray(cond.audienceTypes) && cond.audienceTypes.length > 0) {
    tags.push(...cond.audienceTypes);
  } else if (cond.targetAudience && cond.targetAudience !== "ALL" && cond.targetAudience !== "MULTI") {
    tags.push(cond.targetAudience);
  }
  if (Number(cond.minItemsCount || 1) > 1) tags.push(`Min ${cond.minItemsCount} item`);
  if (Number(cond.minPurchaseCount || 0) > 0) tags.push(`Min ${cond.minPurchaseCount} order`);
  if (Array.isArray(cond.allowedPaymentMethods) && cond.allowedPaymentMethods.length > 0) {
    tags.push(cond.allowedPaymentMethods.join("/"));
  }
  if (Array.isArray(cond.allowedCategories) && cond.allowedCategories.length > 0) {
    tags.push(cond.allowedCategories.join(", "));
  }
  if (Array.isArray(cond.allowedProductSkus) && cond.allowedProductSkus.length > 0) {
    tags.push(`${cond.allowedProductSkus.length} SKU`);
  }
  if (Array.isArray(cond.allowedDaysOfWeek) && cond.allowedDaysOfWeek.length > 0) {
    tags.push(`${cond.allowedDaysOfWeek.length} hari`);
  }
  if (Array.isArray(cond.allowedShippingTypes) && cond.allowedShippingTypes.length > 0) {
    tags.push(cond.allowedShippingTypes.join("/"));
  }
  if (Array.isArray(cond.applicableChannels) && cond.applicableChannels.length > 0) {
    tags.push(cond.applicableChannels.join("/"));
  }
  if (cond.autoApply) tags.push("Auto-Apply");
  if (cond.stackable) tags.push("Stackable");
  if (Array.isArray(cond.customRules) && cond.customRules.length > 0) {
    tags.push(`+${cond.customRules.length} rule`);
  }
  return tags;
}

export const VouchersPanel: React.FC<IVouchersPanelProps> = ({
  vouchers,
  isLoading,
  voucherStats,
  onCreateVoucher,
  onUpdateVoucher,
  onDeleteVoucher,
  onRefresh,
  isSaving = false,
  isDeleting = false,
}) => {
  const t = useTranslations("storeErp.vouchers");

  // undefined = list mode, null = create mode, StoreVoucher = edit mode (or clone if id === "")
  const [editingVoucher, setEditingVoucher] = useState<StoreVoucher | null | undefined>(undefined);
  const [selectedVoucherForDelete, setSelectedVoucherForDelete] = useState<StoreVoucher | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const filteredVouchers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return vouchers.filter((v) => {
      if (statusFilter === "ACTIVE" && !v.isActive) return false;
      if (statusFilter === "INACTIVE" && v.isActive) return false;
      if (q) {
        return (
          v.code.toLowerCase().includes(q) ||
          (v.title || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [vouchers, searchTerm, statusFilter]);

  const handleUnifiedSave = async (payload: VoucherPayload) => {
    if (editingVoucher && editingVoucher.id && onUpdateVoucher) {
      await onUpdateVoucher({ id: editingVoucher.id, payload });
    } else if (onCreateVoucher) {
      await onCreateVoucher(payload);
    }
    setEditingVoucher(undefined);
    if (onRefresh) await onRefresh();
  };

  const handleDuplicate = (vouch: StoreVoucher) => {
    setEditingVoucher({
      ...vouch,
      id: "",
      code: `${vouch.code.slice(0, 15)}_COPY`,
      usedCount: 0,
    });
  };

  const handleConfirmDelete = async () => {
    if (!selectedVoucherForDelete || !onDeleteVoucher) return;
    await onDeleteVoucher(selectedVoucherForDelete.id);
    setSelectedVoucherForDelete(null);
  };

  const handleToggleStatus = async (voucher: StoreVoucher) => {
    if (!onUpdateVoucher) return;
    await onUpdateVoucher({
      id: voucher.id,
      payload: {
        code: voucher.code,
        title: voucher.title,
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minPurchase: voucher.minPurchase,
        maxDiscount: voucher.maxDiscount,
        quota: voucher.quota,
        isActive: !voucher.isActive,
        expiresAt: voucher.expiresAt,
        conditions: voucher.conditions,
      },
    });
  };

  // Unified Full-Page Editor Mode (Create / Edit + Multi-Syarat)
  if (editingVoucher !== undefined) {
    return (
      <VoucherEditorView
        voucher={editingVoucher}
        onCancel={() => setEditingVoucher(undefined)}
        onSubmit={handleUnifiedSave}
        isSaving={isSaving}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header */}
      <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">{t("title")}</h2>
          <p className="text-xs text-text-muted mt-0.5">{t("subtitle")}</p>
        </div>

        <TijarahButton
          type="button"
          tijarahVariant="primary"
          size="sm"
          onClick={() => setEditingVoucher(null)}
          className="text-xs px-3.5 h-8 font-semibold flex items-center gap-1.5 rounded-lg shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t("createBtn")}</span>
        </TijarahButton>
      </div>

      {/* Compact Inline Metric Strip */}
      <div className="bg-surface border border-border-subtle rounded-xl grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-text-muted block">{t("statAllocated")}</span>
          <span className="text-base font-bold text-text-primary tabular-nums mt-0.5 block">
            {formatCurrency(voucherStats?.allocatedBudget || 0)}
          </span>
        </div>
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-text-muted block">{t("statRealized")}</span>
          <span className="text-base font-bold text-primary-sage tabular-nums mt-0.5 block">
            {formatCurrency(voucherStats?.realizedBudget || 0)}
          </span>
        </div>
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-text-muted block">{t("statRoi")}</span>
          <span className="text-base font-bold text-text-primary tabular-nums mt-0.5 block">
            {voucherStats?.roi || 0}x
          </span>
        </div>
      </div>

      {/* Voucher Data Table */}
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
        {/* Search & Status Filter */}
        <div className="px-4 py-2.5 bg-canvas/60 border-b border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="w-full sm:w-72">
            <TijarahInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("searchPlaceholder")}
              startContent={<Search className="w-3.5 h-3.5 text-text-muted" />}
              endContent={
                searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="text-text-muted hover:text-text-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : undefined
              }
              className="text-xs h-8"
            />
          </div>

          <TijarahTabs
            selectedKey={statusFilter}
            onSelectionChange={(k) => setStatusFilter(String(k) as any)}
            variant="segmented"
            className="w-auto"
          >
            <TijarahTabList variant="segmented">
              <TijarahTab id="ALL">{t("filterAll")}</TijarahTab>
              <TijarahTab id="ACTIVE">{t("statusActive")}</TijarahTab>
              <TijarahTab id="INACTIVE">{t("statusInactive")}</TijarahTab>
            </TijarahTabList>
          </TijarahTabs>
        </div>

        {isLoading && vouchers.length === 0 ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-10 rounded-lg bg-canvas animate-pulse" />
            ))}
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center gap-2">
            <Ticket className="w-6 h-6 text-text-muted" />
            <p className="text-sm font-semibold text-text-primary">{t("emptyTitle")}</p>
            <p className="text-xs text-text-muted max-w-md">{t("emptyDesc")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-canvas/80 border-b border-border-subtle text-text-muted uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-4">{t("colVoucher")}</th>
                  <th className="py-2.5 px-4">{t("colDiscount")}</th>
                  <th className="py-2.5 px-4">{t("colRules")}</th>
                  <th className="py-2.5 px-4">{t("colQuota")}</th>
                  <th className="py-2.5 px-4">{t("colExpires")}</th>
                  <th className="py-2.5 px-4 text-center">{t("colStatus")}</th>
                  <th className="py-2.5 px-4 text-right">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredVouchers.map((vouch) => {
                  const quota = Number(vouch.quota || 0);
                  const used = Number(vouch.usedCount || 0);
                  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
                  const ruleTags = summarizeConditions(vouch.conditions as VoucherConditions | undefined);

                  return (
                    <tr key={vouch.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-primary-sage block">{vouch.code}</span>
                        {vouch.title && vouch.title !== vouch.code && (
                          <span className="text-[11px] text-text-muted line-clamp-1">{vouch.title}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-text-primary block">
                          {vouch.discountType === "PERCENT"
                            ? t("discountPercentLabel", { value: vouch.discountValue })
                            : vouch.discountType === "SHIPPING_SUBSIDY"
                            ? t("discountShippingLabel", { value: formatCurrency(vouch.discountValue) })
                            : t("discountFixedLabel", { value: formatCurrency(vouch.discountValue) })}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          {t("minBuy")}: {formatCurrency(vouch.minPurchase)}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-[220px]">
                        {ruleTags.length === 0 ? (
                          <span className="text-[11px] text-text-muted">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {ruleTags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-canvas border border-border-subtle text-[10px] text-text-primary font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                            {ruleTags.length > 3 && (
                              <span className="text-[10px] text-text-muted font-medium">
                                +{ruleTags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 w-36">
                        <div className="flex justify-between text-[11px] tabular-nums mb-1">
                          <span className="font-medium text-text-primary">
                            {used}/{quota}
                          </span>
                          <span className="text-text-muted">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-canvas overflow-hidden">
                          <div className="h-full bg-primary-sage rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                        {formatDate(vouch.expiresAt)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(vouch)}
                          title={t("toggleStatusHint")}
                          className="cursor-pointer focus:outline-none"
                        >
                          <TijarahBadge
                            tijarahVariant={vouch.isActive ? "success" : "secondary"}
                            className="text-[10px] font-semibold"
                          >
                            {vouch.isActive ? t("statusActive") : t("statusInactive")}
                          </TijarahBadge>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <TijarahButton
                            type="button"
                            heroVariant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(vouch)}
                            title={t("duplicateBtn")}
                            className="text-xs px-2 h-7 font-medium text-text-muted hover:text-text-primary inline-flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </TijarahButton>

                          <TijarahButton
                            type="button"
                            heroVariant="ghost"
                            size="sm"
                            onClick={() => setEditingVoucher(vouch)}
                            className="text-xs px-2 h-7 font-medium text-primary-sage inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{t("edit")}</span>
                          </TijarahButton>

                          <TijarahButton
                            type="button"
                            heroVariant="ghost"
                            size="sm"
                            onClick={() => setSelectedVoucherForDelete(vouch)}
                            className="text-xs px-2 h-7 font-medium text-status-danger hover:bg-status-danger/10 inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t("delete")}</span>
                          </TijarahButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={!!selectedVoucherForDelete}
        onClose={() => setSelectedVoucherForDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("deleteTitle")}
        itemName={selectedVoucherForDelete?.code || ""}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default VouchersPanel;
