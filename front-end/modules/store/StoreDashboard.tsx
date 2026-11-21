"use client";

import React, { useState } from "react";
import type { StoreTabType, StoreOrder } from "./types/store.types";
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
import { RejectOrderModal } from "./components/organism/modals/RejectOrderModal";
import { ShipOrderModal } from "./components/organism/modals/ShipOrderModal";
import { ReceiptPrintModal } from "./components/organism/modals/ReceiptPrintModal";

export function StoreDashboard() {
  const [activeTab, setActiveTab] = useState<StoreTabType>("overview");

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
              onCompleteOrder={(id) => completeOrder(id)}
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
              onCompleteOrder={(id) => completeOrder(id)}
              onReadyForPickup={(id) => readyForPickup(id)}
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
      />
    </div>
  );
}

export default StoreDashboard;
