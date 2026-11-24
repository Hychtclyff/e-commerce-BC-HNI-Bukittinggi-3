
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { storeController } from './store.controller';
import { erpExtensionsController } from './erpExtensions.controller';
import { hsisDispatcher } from './hsis/hsis.dispatcher';
import { requireStoreStaff } from '@/utils/authGuard';

export async function storeRoutes(route: FastifyInstance) {
  // Public store routes (dapat diakses oleh publik / storefront / checkout)
  route.get('/contact-info', storeController.getContactInfo);
  route.post('/contact-messages', storeController.createContactMessage);
  route.get('/delivery-methods', storeController.getDeliveryMethods);
  route.get('/delivery-methods/:id', storeController.getDeliveryMethodById);
  route.post('/shipping-rates', storeController.calculateShippingRates);
  route.get('/settings', erpExtensionsController.getStoreSettings);

  // Protected store staff routes (hanya untuk staf toko & pemilik)
  route.register(async (staffRoute) => {
    staffRoute.addHook('preHandler', requireStoreStaff);

    // 1. Metrics & Overview
    staffRoute.get('/metrics', storeController.getMetrics);

    // 2. Orders & Fulfillment Flow
    staffRoute.get('/orders', storeController.getOrders);
    staffRoute.post('/orders/pos', storeController.createPosOrder);
    staffRoute.put('/orders/:id/approve', storeController.approveOrder);
    staffRoute.post('/orders/:id/approve', storeController.approveOrder);
    staffRoute.put('/orders/:id/ship', storeController.shipOrder);
    staffRoute.post('/orders/:id/ship', storeController.shipOrder);
    staffRoute.put('/orders/:id/confirm-delivered', storeController.confirmDelivered);
    staffRoute.post('/orders/:id/confirm-delivered', storeController.confirmDelivered);
    staffRoute.put('/orders/:id/complete', storeController.completeOrder);
    staffRoute.post('/orders/:id/complete', storeController.completeOrder);
    staffRoute.put('/orders/:id/ready-for-pickup', storeController.setReadyForPickup);
    staffRoute.post('/orders/:id/ready-for-pickup', storeController.setReadyForPickup);
    staffRoute.put('/orders/:id/reject', storeController.rejectOrder);
    staffRoute.post('/orders/:id/reject', storeController.rejectOrder);
    staffRoute.post('/orders/:id/confirm-refund', storeController.confirmOrderRefund);
    staffRoute.post('/orders/:id/print', storeController.triggerPrintOrder);
    staffRoute.post('/orders/:id/verify-flow', storeController.executeVerificationFlow);
    staffRoute.post('/orders/cancel-expired', storeController.cancelExpiredOrders);

    // 3. Inventory & Stock (Export & Import - Poin 14)
    staffRoute.get('/inventory', storeController.getInventory);
    staffRoute.get('/inventory/export', storeController.exportInventoryCsv);
    staffRoute.post('/inventory/import', storeController.importInventory);
    staffRoute.post('/inventory', storeController.createInventory);
    staffRoute.put('/inventory/:id', storeController.updateInventory);
    staffRoute.delete('/inventory/:id', storeController.deleteInventory);
    staffRoute.post('/inventory/breakdown', storeController.breakdownProduct);
    staffRoute.post('/inventory/reconcile-points', storeController.reconcileProductPoints);

    // 4. POS Devices
    staffRoute.get('/devices', storeController.getDevices);
    staffRoute.get('/devices/status', storeController.checkDevicesStatus);
    staffRoute.get('/devices/:id/ping', storeController.pingDevice);
    staffRoute.post('/devices', storeController.createDevice);
    staffRoute.put('/devices/:id', storeController.updateDevice);
    staffRoute.delete('/devices/:id', storeController.deleteDevice);

    // 4b. Delivery Methods & Dynamic Shipping Rates (Staff / Owner Management)
    staffRoute.post('/delivery-methods', storeController.createDeliveryMethod);
    staffRoute.post('/delivery-methods/reset', storeController.resetDeliveryMethods);
    staffRoute.put('/delivery-methods/:id', storeController.updateDeliveryMethod);
    staffRoute.delete('/delivery-methods/:id', storeController.deleteDeliveryMethod);

    // 5. Staff & Agents & Jaringan Agen
    staffRoute.get('/agents', storeController.getAgents);
    staffRoute.get('/agents/network', storeController.getAgentNetwork);
    staffRoute.post('/agents/import', storeController.importAgentsCsv);
    staffRoute.post('/agents/sync-self', storeController.syncSelfAgent);
    staffRoute.post('/agents', storeController.createAgent);
    staffRoute.put('/agents/:id', storeController.updateAgent);
    staffRoute.delete('/agents/:id', storeController.deleteAgent);
    staffRoute.post('/agents/:id/password', storeController.setAgentPassword);

    // 5b. Manajemen Semua Pengguna Terdaftar Sistem (Users & Network CRUD)
    staffRoute.get('/users', storeController.getSystemUsers);
    staffRoute.get('/users/:id', storeController.getSystemUserDetail);
    staffRoute.post('/users', storeController.createSystemUser);
    staffRoute.put('/users/:id', storeController.updateSystemUser);
    staffRoute.delete('/users/:id', storeController.deleteSystemUser);
    staffRoute.post('/users/:id/reset-password', storeController.resetSystemUserPassword);

    // 6. Merchants & Non-HNI
    staffRoute.get('/merchants', storeController.getMerchants);
    staffRoute.post('/merchants', storeController.createMerchant);
    staffRoute.put('/merchants/:id', storeController.updateMerchant);
    staffRoute.delete('/merchants/:id', storeController.deleteMerchant);

    staffRoute.get('/non-hni-products', storeController.getNonHniProducts);
    staffRoute.post('/non-hni-products', storeController.createNonHniProduct);
    staffRoute.put('/non-hni-products/:id', storeController.updateNonHniProduct);
    staffRoute.delete('/non-hni-products/:id', storeController.deleteNonHniProduct);

    // 7. E-Signatures
    staffRoute.get('/esignatures', storeController.getEsignatures);
    staffRoute.post('/esignatures', storeController.createEsignature);
    staffRoute.delete('/esignatures/:id', storeController.deleteEsignature);

    // 8. Product Knowledge & Testimonials & Khasit Table Editor
    staffRoute.get('/product-knowledge', storeController.getProductKnowledge);
    staffRoute.post('/product-knowledge', storeController.createProductKnowledge);
    staffRoute.put('/product-knowledge/batch', storeController.batchUpdateProductKnowledge);
    staffRoute.put('/product-knowledge/:id', storeController.updateProductKnowledge);
    staffRoute.delete('/product-knowledge/:id', storeController.deleteProductKnowledge);
    staffRoute.post('/product-knowledge/:productId/testimonials', storeController.createTestimonial);
    staffRoute.delete('/testimonials/:id', storeController.deleteTestimonial);

    // 9. HSIS Dynamic Endpoints CRUD & Dispatcher (Poin 8)
    staffRoute.get('/hsis-endpoints', storeController.getHsisEndpoints);
    staffRoute.post('/hsis-endpoints', storeController.createHsisEndpoint);
    staffRoute.put('/hsis-endpoints/:id', storeController.updateHsisEndpoint);
    staffRoute.delete('/hsis-endpoints/:id', storeController.deleteHsisEndpoint);
    staffRoute.post('/hsis-endpoints/:id/dispatch', storeController.dispatchHsisEndpoint);
    staffRoute.get('/hsis-controllers', storeController.getHsisControllers);

    // 10. HSIS Interactive Chrome Login & Token Management
    staffRoute.post('/hsis/auto-login', storeController.triggerHsisAutoLogin);
    staffRoute.post('/hsis/token', storeController.saveHsisToken);
    staffRoute.post('/hsis/test', storeController.testHsisConnection);

    // 10b. HSIS Purchase Orders & Cek Barang Datang (Poin 6)
    staffRoute.get('/hsis/po', storeController.getHsisPurchaseOrders);
    staffRoute.post('/hsis/po/sync', storeController.syncHsisPurchaseOrders);
    staffRoute.post('/hsis/po', storeController.createHsisPurchaseOrder);
    staffRoute.post('/hsis/po/:id/receive', storeController.receiveHsisOrder);

    // 10b-2. HSIS Two-Way Sales Sync & Stock/Saldo Reconciliation
    staffRoute.post('/hsis/sync-saldo', storeController.syncHsisSaldo);
    staffRoute.post('/hsis/sync-sales', storeController.syncHsisSales);
    staffRoute.get('/hsis/reconciliation-report', storeController.getHsisReconciliationReport);
    staffRoute.post('/hsis/orders/:orderId/link-invoice', storeController.linkHsisInvoice);

    // 10c. Kupon Dinamis, CRUD Voucher & Multi-Select User Conditions (Poin 9)
    staffRoute.get('/vouchers', storeController.getStoreVouchers);
    staffRoute.post('/vouchers', storeController.createStoreVoucher);
    staffRoute.put('/vouchers/:id', storeController.updateStoreVoucher);
    staffRoute.delete('/vouchers/:id', storeController.deleteStoreVoucher);
    staffRoute.put('/vouchers/:id/conditions', storeController.updateVoucherConditions);

    // 11. Live Logistics, CRM, Analytics & Reconciliation
    staffRoute.get('/shipments', storeController.getShipments);
    staffRoute.get('/customers', storeController.getCustomers);
    staffRoute.get('/stock-velocity', storeController.getStockVelocity);
    staffRoute.get('/restock-recommendations', storeController.getRestockRecommendations);
    staffRoute.get('/reconciliation', storeController.getReconciliation);
    staffRoute.get('/hsis-session', storeController.getHsisSession);
    staffRoute.get('/disease-trends', storeController.getDiseaseTrends);

    // 12. Laporan Keuangan (Poin 13)
    staffRoute.get('/reports/financial', storeController.getFinancialReport);
    staffRoute.get('/reports/financial/export', storeController.exportFinancialReportCsv);

    // 13. Manajemen Pengaturan Kontak & Pesan Masuk (Staff Staf / Admin Only)
    staffRoute.put('/contact-info', storeController.updateContactInfo);
    staffRoute.get('/contact-messages', storeController.getContactMessages);
    staffRoute.patch('/contact-messages/:id', storeController.updateContactMessage);
    staffRoute.delete('/contact-messages/:id', storeController.deleteContactMessage);

    // 14. Manajemen Shift Kasir (Buka / Tutup Kasir)
    staffRoute.get('/shifts/current', erpExtensionsController.getCurrentShift);
    staffRoute.get('/shifts', erpExtensionsController.getShifts);
    staffRoute.post('/shifts/open', erpExtensionsController.openShift);
    staffRoute.post('/shifts/:id/close', erpExtensionsController.closeShift);

    // 15. Purchasing, Supplier & Hutang Dagang (Accounts Payable)
    staffRoute.get('/suppliers', erpExtensionsController.getSuppliers);
    staffRoute.post('/suppliers', erpExtensionsController.createSupplier);
    staffRoute.delete('/suppliers/:id', erpExtensionsController.deleteSupplier);
    staffRoute.get('/purchase-orders', erpExtensionsController.getPurchaseOrders);
    staffRoute.post('/purchase-orders', erpExtensionsController.createPurchaseOrder);
    staffRoute.post('/purchase-orders/:id/receive', erpExtensionsController.receivePurchaseOrder);
    staffRoute.post('/purchase-orders/:id/pay', erpExtensionsController.payPurchaseOrder);

    // 16. Retur / Refund Pesanan
    staffRoute.get('/returns', erpExtensionsController.getOrderReturns);
    staffRoute.put('/returns/:id', erpExtensionsController.processOrderReturn);

    // 17. Audit Trail & Pengaturan Toko Terpusat
    staffRoute.get('/audit-logs', erpExtensionsController.getAuditLogs);
    staffRoute.put('/settings', erpExtensionsController.updateStoreSettings);

    // 17b. Master Kategori & Satuan Produk
    staffRoute.get('/product-categories', erpExtensionsController.getProductCategories);
    staffRoute.post('/product-categories', erpExtensionsController.createProductCategory);
    staffRoute.get('/product-units', erpExtensionsController.getProductUnits);
    staffRoute.post('/product-units', erpExtensionsController.createProductUnit);

    // 18. RBAC Roles & Permissions
    staffRoute.get('/rbac/roles', erpExtensionsController.getRbacRoles);
    staffRoute.get('/rbac/permissions', erpExtensionsController.getRbacPermissions);
    staffRoute.put('/rbac/roles/:id/permissions', erpExtensionsController.updateRolePermissions);
    staffRoute.put('/rbac/users/:userId/role', erpExtensionsController.assignUserRole);
  });
}

/**
 * Dynamic Wildcard Route Dispatcher untuk HSIS:
 * Menangkap seluruh request ke /api/v1/hsis/* dan mencocokkan route di database (Poin 8)
 */
export async function hsisDynamicRoutes(route: FastifyInstance) {
  route.all('/*', async (req: FastifyRequest, reply: FastifyReply) => {
    return await hsisDispatcher.matchAndDispatch(req, reply);
  });
}
