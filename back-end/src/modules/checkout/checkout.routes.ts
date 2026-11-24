import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
    calculateCheckoutSchema,
    processCheckoutSchema,
    approveOrderSchema,
    rejectOrderSchema,
    shipOrderSchema,
} from './checkout.schema';
import { checkoutController } from './checkout.controller';
import { requireAuth, requireNonProduction, requireStoreStaff } from '@/utils/authGuard';

export async function checkoutRoutes(route: FastifyInstance) {
    const server = route.withTypeProvider<ZodTypeProvider>();

    // --- CLIENT CHECKOUT & ORDERS ---

    server.post(
        '/calculate',
        calculateCheckoutSchema,
        checkoutController.calculateCheckout
    );

    server.register(async (authed) => {
        authed.addHook('preHandler', requireAuth);
        authed.post('/process', processCheckoutSchema, checkoutController.processCheckout);
        authed.post('/orders/:id/regenerate-payment', checkoutController.regeneratePaymentCode);

        authed.register(async (nonProd) => {
            nonProd.addHook('preHandler', requireNonProduction);
            nonProd.post('/payments/mock-pay/:orderId', checkoutController.simulateMockPayment);
        });
    });

    server.get(
        '/orders/:id/receipt',
        checkoutController.getOrderReceipt
    );

    // --- OWNER / ADMIN APPROVAL ENDPOINTS ---

    server.register(async (staff) => {
        staff.addHook('preHandler', requireStoreStaff);
        staff.post('/admin/orders/:id/approve', approveOrderSchema, checkoutController.approveOrder);
        staff.post('/admin/orders/:id/ship', shipOrderSchema, checkoutController.shipOrder);
        staff.post('/admin/orders/:id/reject', rejectOrderSchema, checkoutController.rejectOrder);
    });
}
