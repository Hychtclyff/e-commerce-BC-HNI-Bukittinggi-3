"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { StoreTabType, StoreOrder } from "./types/store.types";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import { hasErpAccess } from "@/lib/auth/erpAccess";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { useStoreErp } from "./hooks/useStoreErp";
import { StoreHeader } from "./components/organism/StoreHeader";
import { StoreSidebarNav } from "./components/organism/StoreSidebarNav";
import { OverviewPanel } from "./components/organism/panels/OverviewPanel";
import { CashierPanel } from "./components/organism/panels/CashierPanel";
import { InventoryPanel } from "./components/organism/panels/InventoryPanel";
import { OrdersPanel } from "./components/organism/panels/OrdersPanel";
import { KasbonPanel } from "./components/organism/panels/KasbonPanel";
import { VouchersPanel } from "./components/organism/panels/VouchersPanel";
import { TemplatesPanel } from "./components/organism/panels/TemplatesPanel";
import { ReportsPanel } from "./components/organism/panels/ReportsPanel";
import { DevicesPanel } from "./components/organism/panels/DevicesPanel";
import { AgentsPanel } from "./components/organism/panels/AgentsPanel";
import { HsisPanel } from "./components/organism/panels/HsisPanel";
import { ProductOrderManagementPanel } from "./components/organism/panels/ProductOrderManagementPanel";
import { DeliveryMethodPanel } from "./components/organism/panels/DeliveryMethodPanel";
import { EsignaturePanel } from "./components/organism/panels/EsignaturePanel";
import { ProductKnowledgePanel } from "./components/organism/panels/ProductKnowledgePanel";
import { NewsPanel } from "@/modules/news/components/NewsPanel";
import { ContactsPanel } from "./components/organism/panels/ContactsPanel";
import { MediaLibraryPanel } from "./components/organism/panels/MediaLibraryPanel";
import { PurchasingPanel } from "./components/organism/panels/PurchasingPanel";
import { ReturnsPanel } from "./components/organism/panels/ReturnsPanel";
import { AuditLogsPanel } from "./components/organism/panels/AuditLogsPanel";
import { StoreSettingsPanel } from "./components/organism/panels/StoreSettingsPanel";
import { CashierShiftBanner } from "./components/molecules/CashierShiftBanner";
import { RejectOrderModal } from "./components/organism/modals/RejectOrderModal";
import { ShipOrderModal } from "./components/organism/modals/ShipOrderModal";
import { ReceiptPrintModal } from "./components/organism/modals/ReceiptPrintModal";

export function StoreDashboard() {
  const user = useAuthStore((state) => state.user);

  if (!hasErpAccess(user)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-border-subtle bg-surface p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-status-danger/10 text-status-danger flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-text-primary">
              Akses ERP Ditolak (403)
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Halaman ini hanya dapat diakses oleh akun dengan role Owner, Admin, Manager, Kasir, atau Staf Toko. Akun pelanggan/agen umum tidak memiliki izin akses ERP.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <Link href="/">
              <TijarahButton
                type="button"
                tijarahVariant="primary"
                size="sm"
                className="text-xs font-bold px-4 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Beranda</span>
              </TijarahButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <StoreDashboardContent />;
}

function StoreDashboardContent() {
  const [activeTab, setActiveTabState] = useState<StoreTabType>("overview");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab") as StoreTabType | null;
    const savedTab = sessionStorage.getItem("tijarah_erp_active_tab") as StoreTabType | null;
    const initialTab = urlTab || savedTab;
    if (initialTab) {
      setActiveTabState(initialTab);
    }
  }, []);

  const setActiveTab = useCallback((nextTab: StoreTabType) => {
    setActiveTabState(nextTab);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("tijarah_erp_active_tab", nextTab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", nextTab);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // State untuk Modal Aksi Pesanan
  const [selectedOrderForShip, setSelectedOrderForShip] =
    useState<StoreOrder | null>(null);
  const [selectedOrderForReject, setSelectedOrderForReject] =
    useState<StoreOrder | null>(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] =
    useState<StoreOrder | null>(null);

  // Hook Utama ERP Toko
  const {
    inventory,
    isInventoryLoading,
    createInventory,
    updateInventory,
    deleteInventory,
    isSavingInventory,
    isDeletingInventory,

    orders,
    isOrdersLoading,
    shipOrder,
    isShippingOrder,
    confirmReceived,
    completeOrder,
    readyForPickup,
    isReadyingForPickup,
    isAdvancingOrder,
    rejectOrder,
    isRejectingOrder,
    confirmOrderRefund,
    triggerPrintOrder,
    verifyPickupOrder,
    isVerifyingPickup,
    createPosOrder,
    isCreatingPosOrder,

    creditApps,
    isCreditLoading,
    approveCredit,
    isApprovingCredit,
    rejectCredit,
    isRejectingCredit,

    vouchers,
    isVouchersLoading,
    voucherStats,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    isSavingVoucher,
    isDeletingVoucher,

    devices,
    isDevicesLoading,
    createDevice,
    updateDevice,
    deleteDevice,
    isSavingDevice,
    isDeletingDevice,

    agents,
    isAgentsLoading,
    createAgent,
    updateAgent,
    deleteAgent,
    setAgentPassword,
    resetAgentPassword,
    isSavingAgent,
    isDeletingAgent,

    hsisSession,
    isHsisLoading,
    triggerHsisSync,
    hsisEndpoints,
    hsisControllers,
    createHsisEndpoint,
    updateHsisEndpoint,
    deleteHsisEndpoint,
    dispatchHsisEndpoint,
    runHsisAutoLogin,

    reconciliationEntries,
    isReconciliationLoading,
    resyncHsisPoints,
    adjustReconciliation,

    stockVelocity,
    isVelocityLoading,
    restockRecommendations,
    isRestockLoading,
    diseaseTrends,

    shipments,
    isShipmentsLoading,

    customers,
    isCustomersLoading,

    merchants,
    isMerchantsLoading,
    createMerchant,
    updateMerchant,
    deleteMerchant,

    nonHniProducts,
    isNonHniLoading,
    createNonHniProduct,
    updateNonHniProduct,
    deleteNonHniProduct,
    isSavingMerchant,
    isDeletingMerchant,

    esignatures,
    isEsignaturesLoading,
    createEsignature,
    deleteEsignature,
    downloadEsignature,
    isSavingEsignature,
    isDeletingEsignature,

    productKnowledge,
    isProductKnowledgeLoading,
    createProductKnowledge,
    updateProductKnowledge,
    deleteProductKnowledge,
    saveTestimonial,
    deleteTestimonial,
    isSavingProductKnowledge,
    isDeletingProductKnowledge,

    metrics,
    isRefreshing,
    refetchAll,
  } = useStoreErp();

  // Handlers Aksi Pesanan
  const handleConfirmShip = async (
    orderId: string,
    payload: { courierName: string; trackingNumber: string; notes?: string },
  ) => {
    await shipOrder({ orderId, payload });
  };

  const handleConfirmReject = async (orderId: string, reason: string) => {
    await rejectOrder({ orderId, payload: { rejectionReason: reason } });
  };

  // Handlers Aksi Kasbon
  const handleApproveCredit = async (id: string) => {
    await approveCredit(id);
  };

  const handleRejectCredit = async (id: string) => {
    await rejectCredit({
      id,
      reason: "Dokumen persyaratan keagenan belum memenuhi syarat plafon",
    });
  };

  // Handlers Rekonsiliasi & E-Signature
  const handleResyncPoints = async (orderId: string) => {
    await resyncHsisPoints(orderId);
  };

  const handleAdjustReconciliation = async (id: string, note: string) => {
    await adjustReconciliation({ id, note });
  };

  const handleDownloadSignature = async (sig: any) => {
    await downloadEsignature(sig);
  };

  return (
    <div className="w-full min-h-screen bg-canvas flex font-sans text-text-primary antialiased selection:bg-primary-sage/20">
      {/* 1. Sidebar Nav (Desktop) */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 border-r border-border-subtle bg-canvas sticky top-0 h-screen z-20">
        <StoreSidebarNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          metrics={metrics}
        />
      </aside>

      {/* 2. Main Right Area: Topbar + Dynamic Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        <StoreHeader
          metrics={metrics}
          isRefreshing={isRefreshing}
          onRefreshAll={refetchAll}
        />

        {/* Mobile Horizontal Navigation Tabs */}
        <div className="md:hidden border-b border-border-subtle bg-canvas px-3 py-1.5 overflow-x-auto scrollbar-hide">
          <StoreSidebarNav
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            metrics={metrics}
            isMobileHorizontal
          />
        </div>

        {/* Dynamic Panels */}
        <main className="flex-1 p-3 sm:p-4 lg:p-5 min-w-0 bg-canvas/40">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <OverviewPanel
              metrics={metrics}
              orders={orders}
              inventory={inventory}
              onNavigateTab={setActiveTab}
              onOpenShipModal={(ord) => setSelectedOrderForShip(ord)}
              onOpenRejectModal={(ord) => setSelectedOrderForReject(ord)}
              onOpenReceiptModal={(ord) => setSelectedOrderForReceipt(ord)}
              onConfirmReceived={(id) => confirmReceived(id)}
              onCompleteOrder={(id, cashReceived) => completeOrder({ orderId: id, cashReceived })}
              isAdvancing={isAdvancingOrder}
            />
          )}

          {/* TAB 1.5: MODUL KASIR POS & TASK PICKUP */}
          {/* {activeTab === "cashier" && (
            <CashierPanel
              inventory={inventory}
              orders={orders}
              customers={customers}
              agents={agents}
              vouchers={vouchers}
              isLoading={isInventoryLoading || isOrdersLoading}
              onCreatePosOrder={createPosOrder}
              onReadyForPickup={(id) => readyForPickup(id)}
              onVerifyPickupOrder={verifyPickupOrder}
              onOpenReceiptModal={(ord) => setSelectedOrderForReceipt(ord)}
              onOpenRejectModal={(ord) => setSelectedOrderForReject(ord)}
              onRefresh={refetchAll}
              isCreatingPosOrder={isCreatingPosOrder}
              isReadyingForPickup={isReadyingForPickup}
              isVerifyingPickup={isVerifyingPickup}
            />
          )} */}

          {/* TAB 2: INVENTORY & STOCK + KATALOG NON-HNI */}
          {activeTab === "inventory" && (
            <InventoryPanel
              inventory={inventory}
              isLoading={isInventoryLoading}
              onRefresh={refetchAll}
              onCreateItem={createInventory}
              onUpdateItem={updateInventory}
              onDeleteItem={deleteInventory}
              isSaving={isSavingInventory}
              isDeleting={isDeletingInventory}
              nonHniProducts={nonHniProducts}
              isNonHniLoading={isNonHniLoading}
              onCreateNonHniProduct={createNonHniProduct}
              onUpdateNonHniProduct={updateNonHniProduct}
              onDeleteNonHniProduct={deleteNonHniProduct}
              isSavingNonHni={isSavingMerchant}
              isDeletingNonHni={isDeletingMerchant}
            />
          )}

          {/* TAB 3: ORDERS & ALUR STATUS */}
          {activeTab === "orders" && (
            <OrdersPanel
              orders={orders}
              isLoading={isOrdersLoading}
              onOpenShipModal={(ord) => setSelectedOrderForShip(ord)}
              onOpenRejectModal={(ord) => setSelectedOrderForReject(ord)}
              onOpenReceiptModal={(ord) => setSelectedOrderForReceipt(ord)}
              onConfirmReceived={(id) => confirmReceived(id)}
              onCompleteOrder={(id, cashReceived) => completeOrder({ orderId: id, cashReceived })}
              onReadyForPickup={(id) => readyForPickup(id)}
              onConfirmRefund={(id, payload) => confirmOrderRefund({ orderId: id, ...payload })}
              onNavigateToCashier={() => setActiveTab("cashier")}
              onNavigateToEsignature={() => setActiveTab("esignature")}
              esignatures={esignatures}
              onRefresh={refetchAll}
              isAdvancing={isAdvancingOrder}
              isReadyingForPickup={isReadyingForPickup}
            />
          )}

          {/* TAB 4: KASBON B2B */}
          {activeTab === "credit" && (
            <KasbonPanel
              applications={creditApps}
              isLoading={isCreditLoading}
              onApprove={handleApproveCredit}
              onReject={handleRejectCredit}
              isApproving={isApprovingCredit}
              isRejecting={isRejectingCredit}
            />
          )}

          {/* TAB 5: VOUCHERS (CRUD LENGKAP) */}
          {activeTab === "vouchers" && (
            <VouchersPanel
              vouchers={vouchers}
              isLoading={isVouchersLoading}
              voucherStats={voucherStats}
              onCreateVoucher={createVoucher}
              onUpdateVoucher={updateVoucher}
              onDeleteVoucher={deleteVoucher}
              onRefresh={refetchAll}
              isSaving={isSavingVoucher}
              isDeleting={isDeletingVoucher}
            />
          )}

          {/* TAB 6: TEMPLATES */}
          {activeTab === "templates" && <TemplatesPanel />}

          {/* TAB 7: REPORTS (FULL WIDTH) */}
          {activeTab === "reports" && (
            <ReportsPanel metrics={metrics} orders={orders} />
          )}

          {/* TAB 8: DEVICES (CRUD LENGKAP) */}
          {activeTab === "devices" && (
            <DevicesPanel
              devices={devices}
              isLoading={isDevicesLoading}
              onRefresh={refetchAll}
              onCreateDevice={createDevice}
              onUpdateDevice={updateDevice}
              onDeleteDevice={deleteDevice}
              isSaving={isSavingDevice}
              isDeleting={isDeletingDevice}
            />
          )}

          {/* TAB 9: AGENTS, CRM & LOYALTY (UNIFIED) */}
          {activeTab === "agents" && (
            <AgentsPanel
              agents={agents}
              customers={customers}
              isLoading={isAgentsLoading}
              isCustomersLoading={isCustomersLoading}
              onRefresh={refetchAll}
              onCreateAgent={createAgent}
              onUpdateAgent={updateAgent}
              onDeleteAgent={deleteAgent}
              onSetPassword={(id, newPassword) =>
                setAgentPassword({ id, newPassword })
              }
              onResetPassword={resetAgentPassword}
              isSaving={isSavingAgent}
              isDeleting={isDeletingAgent}
            />
          )}

          {/* TAB 10: HSIS */}
          {activeTab === "hsis" && (
            <HsisPanel
              session={hsisSession}
              endpoints={hsisEndpoints}
              controllersMeta={hsisControllers}
              isLoading={isHsisLoading}
              onSync={triggerHsisSync}
              onCreateEndpoint={createHsisEndpoint}
              onUpdateEndpoint={updateHsisEndpoint}
              onDeleteEndpoint={deleteHsisEndpoint}
              onDispatchEndpoint={dispatchHsisEndpoint}
              onRunAutoLogin={runHsisAutoLogin}
            />
          )}

          {/* TAB 12: PRODUCT ORDER MANAGEMENT & AI DISEASE TRENDS */}
          {activeTab === "restock" && (
            <ProductOrderManagementPanel
              velocity={stockVelocity}
              recommendations={restockRecommendations}
              diseaseTrends={diseaseTrends}
              isLoading={isVelocityLoading || isRestockLoading}
            />
          )}

          {/* TAB 13.5: DELIVERY METHOD (ALUR SCAN QR VS USER VERIFY) */}
          {activeTab === "deliveryMethod" && <DeliveryMethodPanel />}

          {/* TAB 16: E-SIGNATURE (MANAJEMEN TANDA TANGAN DIGITAL KARYAWAN) */}
          {activeTab === "esignature" && (
            <EsignaturePanel
              signatures={esignatures}
              agents={agents}
              orders={orders}
              isLoading={isEsignaturesLoading}
              onDownload={handleDownloadSignature}
              onCreateSignature={createEsignature}
              onDeleteSignature={deleteEsignature}
              isSaving={isSavingEsignature}
              isDeleting={isDeletingEsignature}
            />
          )}

          {/* TAB 17: KHASIAT, KOMPOSISI & TESTIMONI (MODUL BARU) */}
          {activeTab === "productKnowledge" && (
            <ProductKnowledgePanel
              products={productKnowledge}
              isLoading={isProductKnowledgeLoading}
              onRefresh={refetchAll}
              onCreateProduct={createProductKnowledge}
              onUpdateProduct={updateProductKnowledge}
              onDeleteProduct={deleteProductKnowledge}
              onSaveTestimonial={saveTestimonial}
              onDeleteTestimonial={deleteTestimonial}
              isSaving={isSavingProductKnowledge}
              isDeleting={isDeletingProductKnowledge}
            />
          )}

          {/* TAB 18: MASTER NEWS / BLOG (POIN 5) */}
          {activeTab === "news" && <NewsPanel />}

          {/* TAB 19: MANAJEMEN KONTAK & PESAN PUBLIK */}
          {(activeTab as string) === "contacts" && <ContactsPanel />}

          {/* TAB 20: MANAJEMEN MEDIA GAMBAR & DOKUMEN PDF (SUPABASE STORAGE) */}
          {activeTab === "media" && <MediaLibraryPanel />}

          {/* TAB 22: MANAJEMEN RETUR & KOMPLAIN */}
          {activeTab === "returns" && <ReturnsPanel />}

          {/* TAB 23: AUDIT TRAIL */}
          {activeTab === "auditLogs" && <AuditLogsPanel />}

          {/* TAB 24: PENGATURAN TOKO TERPUSAT */}
          {activeTab === "settings" && <StoreSettingsPanel />}
        </main>
      </div>

      {/* 3. Modals Interaktif Pengiriman, Penolakan & Cetak Resi */}
      <ShipOrderModal
        isOpen={!!selectedOrderForShip}
        onClose={() => setSelectedOrderForShip(null)}
        order={selectedOrderForShip}
        onConfirmShip={handleConfirmShip}
        isLoading={isShippingOrder}
      />

      <RejectOrderModal
        isOpen={!!selectedOrderForReject}
        onClose={() => setSelectedOrderForReject(null)}
        order={selectedOrderForReject}
        onConfirmReject={handleConfirmReject}
        isLoading={isRejectingOrder}
      />

      <ReceiptPrintModal
        isOpen={!!selectedOrderForReceipt}
        onClose={() => setSelectedOrderForReceipt(null)}
        order={selectedOrderForReceipt}
        onPrinted={(orderId) => {
          triggerPrintOrder(orderId).catch(() => {});
        }}
      />
    </div>
  );
}

export default StoreDashboard;
