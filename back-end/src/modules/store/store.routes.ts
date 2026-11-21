import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { storeController } from './store.controller';
import { hsisDispatcher } from './hsis/hsis.dispatcher';

export async function storeRoutes(route: FastifyInstance) {
  // 1. Metrics & Overview
  route.get('/metrics', storeController.getMetrics);

  // 2. Orders & Fulfillment Flow
  route.get('/orders', storeController.getOrders);
  route.post('/orders/pos', storeController.createPosOrder);
  route.put('/orders/:id/approve', storeController.approveOrder);
  route.post('/orders/:id/approve', storeController.approveOrder);
  route.put('/orders/:id/ship', storeController.shipOrder);
  route.post('/orders/:id/ship', storeController.shipOrder);
  route.put('/orders/:id/confirm-delivered', storeController.confirmDelivered);
  route.post('/orders/:id/confirm-delivered', storeController.confirmDelivered);
  route.put('/orders/:id/complete', storeController.completeOrder);
  route.post('/orders/:id/complete', storeController.completeOrder);
  route.put('/orders/:id/ready-for-pickup', storeController.setReadyForPickup);
  route.post('/orders/:id/ready-for-pickup', storeController.setReadyForPickup);
  route.put('/orders/:id/reject', storeController.rejectOrder);
  route.post('/orders/:id/reject', storeController.rejectOrder);
  route.post('/orders/:id/verify-flow', storeController.executeVerificationFlow);
  route.post('/orders/cancel-expired', storeController.cancelExpiredOrders);

  // 3. Inventory & Stock (Export & Import - Poin 14)
  route.get('/inventory', storeController.getInventory);
  route.get('/inventory/export', storeController.exportInventoryCsv);
  route.post('/inventory/import', storeController.importInventory);
  route.post('/inventory', storeController.createInventory);
  route.put('/inventory/:id', storeController.updateInventory);
  route.delete('/inventory/:id', storeController.deleteInventory);
  route.post('/inventory/breakdown', storeController.breakdownProduct);
  route.post('/inventory/reconcile-points', storeController.reconcileProductPoints);

  // 4. POS Devices
  route.get('/devices', storeController.getDevices);
  route.get('/devices/status', storeController.checkDevicesStatus);
  route.get('/devices/:id/ping', storeController.pingDevice);
  route.post('/devices', storeController.createDevice);
  route.put('/devices/:id', storeController.updateDevice);
  route.delete('/devices/:id', storeController.deleteDevice);

  // 4b. Delivery Methods & Dynamic Shipping Rates
  route.get('/delivery-methods', storeController.getDeliveryMethods);
  route.get('/delivery-methods/:id', storeController.getDeliveryMethodById);
  route.post('/delivery-methods', storeController.createDeliveryMethod);
  route.post('/delivery-methods/reset', storeController.resetDeliveryMethods);
  route.put('/delivery-methods/:id', storeController.updateDeliveryMethod);
  route.delete('/delivery-methods/:id', storeController.deleteDeliveryMethod);
  route.post('/shipping-rates', storeController.calculateShippingRates);

  // 5. Staff & Agents & Jaringan Agen
  route.get('/agents', storeController.getAgents);
  route.get('/agents/network', storeController.getAgentNetwork);
  route.post('/agents/import', storeController.importAgentsCsv);
  route.post('/agents/sync-self', storeController.syncSelfAgent);
  route.post('/agents', storeController.createAgent);
  route.put('/agents/:id', storeController.updateAgent);
  route.delete('/agents/:id', storeController.deleteAgent);
  route.post('/agents/:id/password', storeController.setAgentPassword);

  // 5b. Manajemen Semua Pengguna Terdaftar Sistem (Users & Network CRUD)
  route.get('/users', storeController.getSystemUsers);
  route.get('/users/:id', storeController.getSystemUserDetail);
  route.post('/users', storeController.createSystemUser);
  route.put('/users/:id', storeController.updateSystemUser);
  route.delete('/users/:id', storeController.deleteSystemUser);
  route.post('/users/:id/reset-password', storeController.resetSystemUserPassword);

  // 6. Merchants & Non-HNI
  route.get('/merchants', storeController.getMerchants);
  route.post('/merchants', storeController.createMerchant);
  route.put('/merchants/:id', storeController.updateMerchant);
  route.delete('/merchants/:id', storeController.deleteMerchant);

  route.get('/non-hni-products', storeController.getNonHniProducts);
  route.post('/non-hni-products', storeController.createNonHniProduct);
  route.put('/non-hni-products/:id', storeController.updateNonHniProduct);
  route.delete('/non-hni-products/:id', storeController.deleteNonHniProduct);

  // 7. E-Signatures
  route.get('/esignatures', storeController.getEsignatures);
  route.post('/esignatures', storeController.createEsignature);
  route.delete('/esignatures/:id', storeController.deleteEsignature);

  // 8. Product Knowledge & Testimonials & Khasit Table Editor
  route.get('/product-knowledge', storeController.getProductKnowledge);
  route.post('/product-knowledge', storeController.createProductKnowledge);
  route.put('/product-knowledge/batch', storeController.batchUpdateProductKnowledge);
  route.put('/product-knowledge/:id', storeController.updateProductKnowledge);
  route.delete('/product-knowledge/:id', storeController.deleteProductKnowledge);
  route.post('/product-knowledge/:productId/testimonials', storeController.createTestimonial);
  route.delete('/testimonials/:id', storeController.deleteTestimonial);

  // 9. HSIS Dynamic Endpoints CRUD & Dispatcher (Poin 8)
  route.get('/hsis-endpoints', storeController.getHsisEndpoints);
  route.post('/hsis-endpoints', storeController.createHsisEndpoint);
  route.put('/hsis-endpoints/:id', storeController.updateHsisEndpoint);
  route.delete('/hsis-endpoints/:id', storeController.deleteHsisEndpoint);
  route.post('/hsis-endpoints/:id/dispatch', storeController.dispatchHsisEndpoint);
  route.get('/hsis-controllers', storeController.getHsisControllers);

  // 10. HSIS Interactive Chrome Login & Token Management
  route.post('/hsis/auto-login', storeController.triggerHsisAutoLogin);
  route.post('/hsis/token', storeController.saveHsisToken);
  route.post('/hsis/test', storeController.testHsisConnection);

  // 10b. HSIS Purchase Orders & Cek Barang Datang (Poin 6)
  route.get('/hsis/po', storeController.getHsisPurchaseOrders);
  route.post('/hsis/po/sync', storeController.syncHsisPurchaseOrders);
  route.post('/hsis/po', storeController.createHsisPurchaseOrder);
  route.post('/hsis/po/:id/receive', storeController.receiveHsisOrder);

  // 10b-2. HSIS Two-Way Sales Sync & Stock/Saldo Reconciliation
  route.post('/hsis/sync-saldo', storeController.syncHsisSaldo);
  route.post('/hsis/sync-sales', storeController.syncHsisSales);
  route.get('/hsis/reconciliation-report', storeController.getHsisReconciliationReport);
  route.post('/hsis/orders/:orderId/link-invoice', storeController.linkHsisInvoice);

  // 10c. Kupon Dinamis, CRUD Voucher & Multi-Select User Conditions (Poin 9)
  route.get('/vouchers', storeController.getStoreVouchers);
  route.post('/vouchers', storeController.createStoreVoucher);
  route.put('/vouchers/:id', storeController.updateStoreVoucher);
  route.delete('/vouchers/:id', storeController.deleteStoreVoucher);
  route.put('/vouchers/:id/conditions', storeController.updateVoucherConditions);

  // 11. Live Logistics, CRM, Analytics & Reconciliation
  route.get('/shipments', storeController.getShipments);
  route.get('/customers', storeController.getCustomers);
  route.get('/stock-velocity', storeController.getStockVelocity);
  route.get('/restock-recommendations', storeController.getRestockRecommendations);
  route.get('/reconciliation', storeController.getReconciliation);
  route.get('/hsis-session', storeController.getHsisSession);
  route.get('/disease-trends', storeController.getDiseaseTrends);

  // 12. Laporan Keuangan (Poin 13)
  route.get('/reports/financial', storeController.getFinancialReport);
  route.get('/reports/financial/export', storeController.exportFinancialReportCsv);

  // 13. Manajemen Kontak & Pesan Publik
  route.get('/contact-info', storeController.getContactInfo);
  route.put('/contact-info', storeController.updateContactInfo);
  route.get('/contact-messages', storeController.getContactMessages);
  route.post('/contact-messages', storeController.createContactMessage);
  route.patch('/contact-messages/:id', storeController.updateContactMessage);
  route.delete('/contact-messages/:id', storeController.deleteContactMessage);
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
