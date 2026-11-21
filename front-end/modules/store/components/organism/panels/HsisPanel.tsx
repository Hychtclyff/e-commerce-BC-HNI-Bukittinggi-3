"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTabs, TijarahTabList, TijarahTab } from "@/components/atom/tijarahTabs";
import { formatCurrency, formatDate } from "@/utils/formatters";
import {
  RefreshCw,
  Plus,
  Play,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  Link2,
  Copy,
  FileSpreadsheet,
  Store,
  Server,
  Search,
  X,
  KeyRound,
  Wifi,
} from "lucide-react";
import type {
  StoreHsisSession,
  StoreHsisEndpoint,
  HsisControllerMeta,
} from "../../../types/store.types";
import { HsisEndpointFormModal } from "../modals/HsisEndpointFormModal";
import { HsisConnectModal } from "../modals/HsisConnectModal";
import { DeleteConfirmModal } from "../modals/DeleteConfirmModal";
import { storeApi } from "../../../api/store.api";
import { showToast } from "@/utils/toast";

export interface IHsisPanelProps {
  session?: StoreHsisSession;
  endpoints?: StoreHsisEndpoint[];
  controllersMeta?: HsisControllerMeta[];
  isLoading: boolean;
  onSync: () => void;
  onCreateEndpoint?: (payload: any) => Promise<any>;
  onUpdateEndpoint?: (params: { id: string; payload: any }) => Promise<any>;
  onDeleteEndpoint?: (id: string) => Promise<any>;
  onDispatchEndpoint?: (id: string, payload?: any) => Promise<any>;
  onRunAutoLogin?: (username?: string, password?: string) => Promise<any>;
}

export const HsisPanel: React.FC<IHsisPanelProps> = ({
  session,
  endpoints = [],
  controllersMeta = [],
  isLoading,
  onSync,
  onCreateEndpoint,
  onUpdateEndpoint,
  onDeleteEndpoint,
  onDispatchEndpoint,
}) => {
  const t = useTranslations("storeErp.hsis");
  const locale = useLocale();
  const isEn = locale === "en";

  const [activeTab, setActiveTab] = useState<"pending" | "discrepancy" | "offline" | "endpoints">("pending");
  const [syncingSales, setSyncingSales] = useState(false);
  const [syncingSaldo, setSyncingSaldo] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [reconSearch, setReconSearch] = useState("");
  const [reconStatusFilter, setReconStatusFilter] = useState<
    "ALL" | "ANOMALY" | "EXPLAINED_BY_PENDING" | "SYNCED"
  >("ALL");
  const [invoiceInputs, setInvoiceInputs] = useState<Record<string, string>>({});
  const [linkingOrderId, setLinkingOrderId] = useState<string | null>(null);

  // Endpoint Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [selectedEndpointForEdit, setSelectedEndpointForEdit] = useState<StoreHsisEndpoint | null>(null);
  const [selectedEndpointForDelete, setSelectedEndpointForDelete] = useState<StoreHsisEndpoint | null>(null);
  const [testingEndpointId, setTestingEndpointId] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<{ id: string; result: any } | null>(null);

  const loadReport = useCallback(async () => {
    setLoadingReport(true);
    try {
      const data = await storeApi.getHsisReconciliationReport();
      setReport(data);
    } catch (err: any) {
      console.warn("Failed to load HSIS reconciliation report:", err?.message);
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleSyncSaldoOnly = async () => {
    setSyncingSaldo(true);
    try {
      const res = await storeApi.syncHsisSaldo();
      if (res?.report) {
        setReport(res.report);
      } else {
        await loadReport();
      }
      await onSync();
      showToast.success(
        t("syncSaldoSuccessTitle"),
        t("syncSaldoSuccessDesc", { synced: res?.syncedCount ?? 0 })
      );
    } catch (err: any) {
      showToast.error(isEn ? "HSIS Saldo Sync Failed" : "Sinkronisasi Saldo HSIS Gagal", err?.message || "");
    } finally {
      setSyncingSaldo(false);
    }
  };

  const handleSyncSalesAndSaldo = async () => {
    setSyncingSales(true);
    try {
      const res = await storeApi.syncHsisSales();
      if (res?.report) {
        setReport(res.report);
      } else {
        await loadReport();
      }
      await onSync();
      if (res?.saldoError) {
        showToast.warning(t("syncSaldoWarningTitle"), res.saldoError);
      }
      if (Array.isArray(res?.lineErrors) && res.lineErrors.length > 0) {
        showToast.warning(
          isEn ? "Some HSIS Lines Failed" : "Sebagian Detail Nota HSIS Gagal",
          `${res.lineErrors[0].invoiceId}: ${res.lineErrors[0].error}`
        );
      }
      showToast.success(
        t("syncSuccessTitle"),
        `${t("syncSuccessDesc", {
          imported: res?.importedCount ?? 0,
          suggested: res?.suggestedMatches?.length ?? 0,
        })} (Fetched: ${res?.totalRowsFetched ?? 0}, Existing: ${res?.skippedExistingCount ?? 0})`
      );
    } catch (err: any) {
      showToast.error(isEn ? "HSIS Sync Failed" : "Sinkronisasi HSIS Gagal", err?.message || "");
    } finally {
      setSyncingSales(false);
    }
  };

  const handleLinkInvoice = async (orderId: string, overrideInvoiceId?: string) => {
    const invoiceId = (overrideInvoiceId ?? invoiceInputs[orderId] ?? "").trim();
    if (!invoiceId) {
      showToast.warning(t("invoicePlaceholder"));
      return;
    }
    setLinkingOrderId(orderId);
    try {
      await storeApi.linkHsisInvoice(orderId, invoiceId);
      showToast.success(t("linkSuccess"), `#${invoiceId}`);
      setInvoiceInputs((prev) => ({ ...prev, [orderId]: "" }));
      await loadReport();
    } catch (err: any) {
      showToast.error(isEn ? "Failed to Link Invoice" : "Gagal Menautkan Invoice", err?.message || "");
    } finally {
      setLinkingOrderId(null);
    }
  };

  const handleCopySkuSummary = (order: any) => {
    const lines = (order.items || [])
      .map((it: any) => `${it.sku || it.productName} x${it.qty}`)
      .join(", ");
    const text = `Order: ${order.orderNumber} | HNI ID: ${order.hniMemberId || "-"} | ${lines}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast.success(t("copiedToast"));
    }
  };

  const handleSubmitEndpoint = async (payload: any) => {
    if (selectedEndpointForEdit && onUpdateEndpoint) {
      await onUpdateEndpoint({ id: selectedEndpointForEdit.id, payload });
      showToast.success(isEn ? "Endpoint updated" : "Endpoint HSIS diperbarui");
    } else if (onCreateEndpoint) {
      await onCreateEndpoint(payload);
      showToast.success(isEn ? "Endpoint created" : "Endpoint HSIS ditambahkan");
    }
  };

  const handleConfirmDeleteEndpoint = async () => {
    if (!selectedEndpointForDelete || !onDeleteEndpoint) return;
    await onDeleteEndpoint(selectedEndpointForDelete.id);
    setSelectedEndpointForDelete(null);
    showToast.success(isEn ? "Endpoint deleted" : "Endpoint HSIS dihapus");
  };

  const handleTestDispatch = async (endpoint: StoreHsisEndpoint) => {
    setTestingEndpointId(endpoint.id);
    try {
      if (onDispatchEndpoint) {
        const res = await onDispatchEndpoint(endpoint.id, {
          body: { agentId: "00192831", note: "Test trigger from ERP" },
        });
        setDispatchResult({ id: endpoint.id, result: res });
      }
      showToast.success(`${endpoint.controller} OK`);
    } catch (err: any) {
      showToast.error(isEn ? "Dispatch failed" : "Gagal eksekusi", err?.message);
    } finally {
      setTestingEndpointId(null);
    }
  };

  const summary = report?.summary || {
    pendingHsisOrdersCount: 0,
    anomalyItemsCount: 0,
    offlineHsisOrdersCount: 0,
  };
  const pendingOrders: any[] = report?.pendingOrders || [];
  const suggestedMatches: any[] = report?.suggestedMatches || [];
  const offlineOrders: any[] = report?.offlineOrders || [];
  const allDiscrepancyItems: any[] = report?.items || [];

  const reconCounts = useMemo(() => {
    let anomaly = 0;
    let explained = 0;
    let synced = 0;
    for (const item of allDiscrepancyItems) {
      if (item.status === "ANOMALY") anomaly++;
      else if (item.status === "EXPLAINED_BY_PENDING") explained++;
      else synced++;
    }
    return {
      all: allDiscrepancyItems.length,
      anomaly,
      explained,
      synced,
    };
  }, [allDiscrepancyItems]);

  const discrepancyItems = useMemo(() => {
    const q = reconSearch.trim().toLowerCase();
    return allDiscrepancyItems.filter((it: any) => {
      if (reconStatusFilter !== "ALL" && it.status !== reconStatusFilter) return false;
      if (q) {
        return (
          String(it.sku || "").toLowerCase().includes(q) ||
          String(it.name || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allDiscrepancyItems, reconStatusFilter, reconSearch]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Header & Sync Controls */}
      <TijarahCard tijarahVariant="default" className="p-4 sm:p-5 rounded-2xl border border-border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-text-primary">{t("title")}</h2>
              <TijarahBadge
                tijarahVariant={session?.status === "ACTIVE" ? "success" : "warning"}
                className="text-[10px] font-bold"
              >
                {session?.status === "ACTIVE" ? t("online") : t("offline")}
              </TijarahBadge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">{t("subtitle")}</p>
            {session?.token && (
              <p className="text-[11px] font-mono text-text-muted mt-1">
                Token: <strong className="text-text-primary">{session.token}</strong>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <TijarahButton
              type="button"
              tijarahVariant="outline"
              size="sm"
              onClick={() => setIsConnectOpen(true)}
              className="text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-primary-sage" />
              <span>{isEn ? "Connect HSIS Token" : "Hubungkan Token HSIS"}</span>
            </TijarahButton>

            <TijarahButton
              type="button"
              tijarahVariant="outline"
              size="sm"
              isLoading={testingConnection}
              onClick={async () => {
                setTestingConnection(true);
                try {
                  const res = await storeApi.testHsisConnection();
                  showToast.success(isEn ? "HSIS Connected" : "Koneksi HSIS OK", res.message);
                  onSync();
                } catch (err: any) {
                  showToast.error(
                    isEn ? "Connection Failed" : "Koneksi Gagal",
                    err?.message || "Token HSIS tidak valid."
                  );
                } finally {
                  setTestingConnection(false);
                }
              }}
              className="text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Wifi className="w-3.5 h-3.5 text-primary-sage" />
              <span>{isEn ? "Test Connection" : "Uji Koneksi"}</span>
            </TijarahButton>

            <TijarahButton
              type="button"
              tijarahVariant="outline"
              size="sm"
              onClick={loadReport}
              isDisabled={loadingReport || syncingSaldo || syncingSales}
              className="text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingReport ? "animate-spin" : ""}`} />
              <span>{t("refreshReportBtn")}</span>
            </TijarahButton>

            <TijarahButton
              type="button"
              tijarahVariant="outline"
              size="sm"
              onClick={handleSyncSaldoOnly}
              isDisabled={syncingSaldo || syncingSales || isLoading}
              className="text-xs font-bold rounded-lg flex items-center gap-1.5 border-primary-sage/40 text-primary-sage"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingSaldo ? "animate-spin" : ""}`} />
              <span>{syncingSaldo ? t("syncingSaldoBtn") : t("syncSaldoBtn")}</span>
            </TijarahButton>

            <TijarahButton
              type="button"
              tijarahVariant="primary"
              size="sm"
              onClick={handleSyncSalesAndSaldo}
              isDisabled={syncingSales || syncingSaldo || isLoading}
              className="text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingSales ? "animate-spin" : ""}`} />
              <span>{syncingSales ? t("syncingBtn") : t("syncSalesBtn")}</span>
            </TijarahButton>
          </div>
        </div>
      </TijarahCard>

      {/* 2. Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <TijarahCard className="p-4 rounded-xl border border-border-subtle">
          <span className="text-xs font-semibold text-text-muted">{t("metricPending")}</span>
          <div className="text-2xl font-bold text-status-warning mt-1">
            {summary.pendingHsisOrdersCount}
          </div>
          <span className="text-[11px] text-text-muted">{t("metricPendingSub")}</span>
        </TijarahCard>

        <TijarahCard className="p-4 rounded-xl border border-border-subtle">
          <span className="text-xs font-semibold text-text-muted">{t("metricSuggested")}</span>
          <div className="text-2xl font-bold text-primary-sage mt-1">
            {suggestedMatches.length}
          </div>
          <span className="text-[11px] text-text-muted">{t("metricSuggestedSub")}</span>
        </TijarahCard>

        <TijarahCard className="p-4 rounded-xl border border-border-subtle">
          <span className="text-xs font-semibold text-text-muted">{t("metricAnomalies")}</span>
          <div className={`text-2xl font-bold mt-1 ${summary.anomalyItemsCount > 0 ? "text-status-danger" : "text-status-success"}`}>
            {summary.anomalyItemsCount}
          </div>
          <span className="text-[11px] text-text-muted">{t("metricAnomaliesSub")}</span>
        </TijarahCard>

        <TijarahCard className="p-4 rounded-xl border border-border-subtle">
          <span className="text-xs font-semibold text-text-muted">{t("metricOffline")}</span>
          <div className="text-2xl font-bold text-text-primary mt-1">
            {summary.offlineHsisOrdersCount}
          </div>
          <span className="text-[11px] text-text-muted">{t("metricOfflineSub")}</span>
        </TijarahCard>
      </div>

      {/* 3. Navigation Tabs */}
      <TijarahTabs
        variant="segmented"
        selectedKey={activeTab}
        onSelectionChange={(k) => setActiveTab(String(k) as any)}
        listClassName="overflow-x-auto max-w-full"
        items={[
          {
            id: "pending",
            label: (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Link2 className="w-3.5 h-3.5" />
                {t("tabPending")} ({pendingOrders.length})
              </span>
            ),
          },
          {
            id: "discrepancy",
            label: (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {t("tabDiscrepancy")} ({summary.anomalyItemsCount})
              </span>
            ),
          },
          {
            id: "offline",
            label: (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Store className="w-3.5 h-3.5" />
                {t("tabOffline")} ({offlineOrders.length})
              </span>
            ),
          },
          {
            id: "endpoints",
            label: (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Server className="w-3.5 h-3.5" />
                {t("tabEndpoints")} ({endpoints.length})
              </span>
            ),
          },
        ]}
      />

      {/* 4. Tab 1: Order Belum Integrasi HSIS */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {suggestedMatches.length > 0 && (
            <TijarahCard className="p-4 rounded-xl border border-primary-sage/30 bg-primary-sage/5 space-y-3">
              <div className="text-xs font-bold text-primary-sage flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t("suggestedBannerTitle", { count: suggestedMatches.length })}</span>
              </div>
              <div className="space-y-2">
                {suggestedMatches.map((m) => (
                  <div
                    key={`${m.orderId}-${m.hsisInvoiceId}`}
                    className="p-3 rounded-lg bg-surface border border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-text-primary">{m.orderNumber}</span>
                      <span className="text-text-muted mx-2">&harr;</span>
                      <span className="font-mono font-bold text-primary-sage">HSIS #{m.hsisInvoiceId}</span>
                      <span className="text-text-muted ml-2">
                        ({m.hsisMemberId} • {formatCurrency(m.hsisAmount)})
                      </span>
                    </div>
                    <TijarahButton
                      type="button"
                      size="sm"
                      tijarahVariant="primary"
                      isDisabled={linkingOrderId === m.orderId}
                      onClick={() => handleLinkInvoice(m.orderId, m.hsisInvoiceId)}
                      className="text-xs font-bold rounded-lg"
                    >
                      {t("suggestedMatchAction")}
                    </TijarahButton>
                  </div>
                ))}
              </div>
            </TijarahCard>
          )}

          <TijarahCard className="rounded-xl border border-border-subtle overflow-hidden">
            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted">{t("noPendingOrders")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-canvas border-b border-border-subtle text-text-muted uppercase text-[10px] font-bold">
                      <th className="py-3 px-4">{t("colOrder")}</th>
                      <th className="py-3 px-4">{t("colCustomer")}</th>
                      <th className="py-3 px-4">{t("colItems")}</th>
                      <th className="py-3 px-4 text-right">{t("colAmount")}</th>
                      <th className="py-3 px-4">{t("colAction")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {pendingOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-canvas/50">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-text-primary block">{ord.orderNumber}</span>
                          <TijarahBadge tijarahVariant="warning" className="text-[10px] mt-1">
                            {t("badgePending")}
                          </TijarahBadge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-text-primary block">{ord.customerName}</span>
                          <span className="font-mono text-[11px] text-text-muted">
                            HNI: {ord.hniMemberId || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            {(ord.items || []).map((it: any, idx: number) => (
                              <div key={idx} className="text-[11px] text-text-primary">
                                {it.qty}x {it.sku || it.productName}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-text-primary whitespace-nowrap">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <TijarahButton
                              type="button"
                              size="sm"
                              tijarahVariant="outline"
                              onClick={() => handleCopySkuSummary(ord)}
                              className="text-[11px] px-2.5 h-8 rounded-lg flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{t("copySkuBtn")}</span>
                            </TijarahButton>
                            <input
                              type="text"
                              value={invoiceInputs[ord.id] || ""}
                              onChange={(e) =>
                                setInvoiceInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))
                              }
                              placeholder={t("invoicePlaceholder")}
                              className="h-8 px-2.5 rounded-lg border border-border-subtle bg-canvas text-xs font-mono text-text-primary w-40 focus:outline-none focus:border-primary-sage"
                            />
                            <TijarahButton
                              type="button"
                              size="sm"
                              tijarahVariant="primary"
                              isDisabled={linkingOrderId === ord.id}
                              onClick={() => handleLinkInvoice(ord.id)}
                              className="text-[11px] px-3 h-8 rounded-lg font-bold"
                            >
                              {t("linkBtn")}
                            </TijarahButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TijarahCard>
        </div>
      )}

      {/* 5. Tab 2: Rekonsiliasi & Discrepancy Report */}
      {activeTab === "discrepancy" && (
        <TijarahCard className="rounded-xl border border-border-subtle overflow-hidden">
          <div className="p-4 border-b border-border-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-canvas/50">
            <div className="w-full lg:w-72">
              <TijarahInput
                value={reconSearch}
                onChange={(e) => setReconSearch(e.target.value)}
                placeholder={t("reconSearchPlaceholder")}
                startContent={<Search className="w-3.5 h-3.5 text-text-muted" />}
                endContent={
                  reconSearch ? (
                    <button
                      type="button"
                      onClick={() => setReconSearch("")}
                      className="text-text-muted hover:text-text-primary"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : undefined
                }
                className="text-xs h-8"
              />
            </div>

            <div className="flex items-center overflow-x-auto">
              <TijarahTabs
                selectedKey={reconStatusFilter}
                onSelectionChange={(key) => setReconStatusFilter(String(key) as any)}
                variant="segmented"
                className="w-auto"
              >
                <TijarahTabList variant="segmented">
                  <TijarahTab id="ALL">
                    {t("reconFilterAll")} ({reconCounts.all})
                  </TijarahTab>
                  <TijarahTab id="ANOMALY">
                    {t("reconFilterAnomaly")} ({reconCounts.anomaly})
                  </TijarahTab>
                  <TijarahTab id="EXPLAINED_BY_PENDING">
                    {t("reconFilterExplained")} ({reconCounts.explained})
                  </TijarahTab>
                  <TijarahTab id="SYNCED">
                    {t("reconFilterSynced")} ({reconCounts.synced})
                  </TijarahTab>
                </TijarahTabList>
              </TijarahTabs>
            </div>
          </div>

          {discrepancyItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">{t("noAnomalies")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-canvas border-b border-border-subtle text-text-muted uppercase text-[10px] font-bold">
                    <th className="py-3 px-4">{t("colSku")}</th>
                    <th className="py-3 px-4 text-right">{t("colTijarahStock")}</th>
                    <th className="py-3 px-4 text-right">{t("colHsisSaldo")}</th>
                    <th className="py-3 px-4 text-right">{t("colPendingQty")}</th>
                    <th className="py-3 px-4 text-right">{t("reconColAnomalyValue")}</th>
                    <th className="py-3 px-4 text-center">{t("colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {discrepancyItems.map((it: any) => (
                    <tr key={it.productId} className="hover:bg-canvas/50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-primary-sage block">{it.sku}</span>
                        <span className="text-text-primary font-medium">{it.name}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">{it.tijarahStock}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">{it.hsisSaldo}</td>
                      <td className="py-3 px-4 text-right font-mono text-status-warning font-semibold tabular-nums">
                        {it.pendingIntegrationQty}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <span className={`font-mono font-bold block ${it.unexplainedDiff !== 0 ? "text-status-danger" : "text-status-success"}`}>
                          {it.unexplainedDiff > 0 ? `+${it.unexplainedDiff}` : it.unexplainedDiff}
                        </span>
                        {it.unexplainedDiff !== 0 && (
                          <span className="text-[11px] text-text-muted">
                            {formatCurrency(Math.abs(it.unexplainedValue || 0))}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <TijarahBadge
                          tijarahVariant={
                            it.status === "ANOMALY"
                              ? "danger"
                              : it.status === "EXPLAINED_BY_PENDING"
                              ? "warning"
                              : "success"
                          }
                          className="text-[10px]"
                        >
                          {it.status === "ANOMALY"
                            ? t("badgeAnomaly")
                            : it.status === "EXPLAINED_BY_PENDING"
                            ? t("badgeExplained")
                            : t("badgeSynced")}
                        </TijarahBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TijarahCard>
      )}

      {/* 6. Tab 3: Offline HSIS Sales */}
      {activeTab === "offline" && (
        <TijarahCard className="rounded-xl border border-border-subtle overflow-hidden">
          {offlineOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">{t("noOfflineOrders")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-canvas border-b border-border-subtle text-text-muted uppercase text-[10px] font-bold">
                    <th className="py-3 px-4">{t("colInvoiceId")}</th>
                    <th className="py-3 px-4">{t("colOrder")}</th>
                    <th className="py-3 px-4">{t("colCustomer")}</th>
                    <th className="py-3 px-4 text-right">{t("colAmount")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {offlineOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-canvas/50">
                      <td className="py-3 px-4 font-mono font-bold text-primary-sage">{o.invoiceId || "-"}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-text-primary block">{o.orderNumber}</span>
                        <span className="text-[10px] text-text-muted">{formatDate(o.createdAt)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-text-primary block">{o.hsisCustomerName}</span>
                        <span className="font-mono text-[11px] text-text-muted">SC: {o.hsisMemberId || "-"}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-text-primary whitespace-nowrap">
                        {formatCurrency(o.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TijarahCard>
      )}

      {/* 7. Tab 4: Gateway & Endpoints */}
      {activeTab === "endpoints" && (
        <TijarahCard className="p-4 sm:p-5 rounded-xl border border-border-subtle space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
              <Layers className="w-4 h-4 text-primary-sage" />
              <span>{t("tabEndpoints")}</span>
            </div>
            {onCreateEndpoint && (
              <TijarahButton
                type="button"
                size="sm"
                tijarahVariant="primary"
                onClick={() => {
                  setSelectedEndpointForEdit(null);
                  setIsFormOpen(true);
                }}
                className="text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isEn ? "Add Endpoint" : "Tambah Endpoint"}</span>
              </TijarahButton>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-border-subtle text-text-muted uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-3">Controller</th>
                  <th className="py-2.5 px-3 text-right">{t("colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {endpoints.map((ep) => (
                  <tr key={ep.id} className="hover:bg-canvas/50">
                    <td className="py-2.5 px-3 font-mono font-bold">{ep.method}</td>
                    <td className="py-2.5 px-3 font-mono text-text-primary">{ep.route}</td>
                    <td className="py-2.5 px-3 text-text-muted">{ep.controller}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <TijarahButton
                          type="button"
                          size="sm"
                          tijarahVariant="outline"
                          isLoading={testingEndpointId === ep.id}
                          onClick={() => handleTestDispatch(ep)}
                          className="text-xs px-2.5 h-7 rounded-lg"
                        >
                          <Play className="w-3 h-3" />
                        </TijarahButton>
                        <TijarahButton
                          type="button"
                          size="sm"
                          heroVariant="ghost"
                          onClick={() => {
                            setSelectedEndpointForEdit(ep);
                            setIsFormOpen(true);
                          }}
                          className="text-xs px-2 h-7 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </TijarahButton>
                        <TijarahButton
                          type="button"
                          size="sm"
                          heroVariant="ghost"
                          onClick={() => setSelectedEndpointForDelete(ep)}
                          className="text-xs px-2 h-7 rounded-lg text-status-danger"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </TijarahButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {dispatchResult && (
            <div className="p-3 rounded-lg bg-slate-950 text-slate-100 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">Response ({dispatchResult.id})</span>
                <button
                  type="button"
                  onClick={() => setDispatchResult(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  &times;
                </button>
              </div>
              <pre className="font-mono text-[11px] overflow-x-auto max-h-40">
                {JSON.stringify(dispatchResult.result, null, 2)}
              </pre>
            </div>
          )}
        </TijarahCard>
      )}

      <HsisConnectModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        onConnected={() => {
          onSync();
          loadReport();
        }}
      />

      <HsisEndpointFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        endpoint={selectedEndpointForEdit}
        controllersMeta={controllersMeta}
        onSubmit={handleSubmitEndpoint}
        isLoading={isLoading}
      />

      <DeleteConfirmModal
        isOpen={!!selectedEndpointForDelete}
        onClose={() => setSelectedEndpointForDelete(null)}
        title={isEn ? "Delete HSIS Endpoint?" : "Hapus Endpoint HSIS?"}
        itemName={selectedEndpointForDelete?.name || ""}
        description={selectedEndpointForDelete?.route || ""}
        onConfirm={handleConfirmDeleteEndpoint}
        isLoading={isLoading}
      />
    </div>
  );
};

export default HsisPanel;
