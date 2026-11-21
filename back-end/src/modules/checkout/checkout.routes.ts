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

export async function checkoutRoutes(route: FastifyInstance) {
    const server = route.withTypeProvider<ZodTypeProvider>();

    // --- CLIENT CHECKOUT & ORDERS ---

    server.post(
        '/calculate',
        calculateCheckoutSchema,
        checkoutController.calculateCheckout
    );

    server.post(
        '/process',
        processCheckoutSchema,
        checkoutController.processCheckout
    );

    server.post(
        '/payments/mock-pay/:orderId',
        checkoutController.simulateMockPayment
    );

    server.post(
        '/orders/:id/regenerate-payment',
        checkoutController.regeneratePaymentCode
    );

    server.get(
        '/orders/:id/receipt',
        checkoutController.getOrderReceipt
    );

    // --- OWNER / ADMIN APPROVAL ENDPOINTS ---

    server.post(
        '/admin/orders/:id/approve',
        approveOrderSchema,
        checkoutController.approveOrder
    );

    server.post(
        '/admin/orders/:id/ship',
        shipOrderSchema,
        checkoutController.shipOrder
    );

    server.post(
        '/admin/orders/:id/reject',
        rejectOrderSchema,
        checkoutController.rejectOrder
    );
}
