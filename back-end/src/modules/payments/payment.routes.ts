import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { paymentController } from "./payment.controller";
import {
    syncPaymentStatusSchema,
    confirmTransferSchema,
    codConfirmSchema,
    getReceiptSchema,
} from "./payment.schema";

export async function paymentRoutes(route: FastifyInstance) {
    const server = route.withTypeProvider<ZodTypeProvider>();

    // Webhook Xendit
    server.post("/webhook", paymentController.handleXenditWebhook);

    // Sync status pembayaran langsung dari Xendit API
    server.get("/sync-status/:orderId", syncPaymentStatusSchema, paymentController.syncPaymentStatus);

    // Admin confirm manual transfer
    server.post("/admin/confirm-transfer", confirmTransferSchema, paymentController.confirmManualTransfer);

    // Courier confirm COD
    server.post("/orders/:orderId/cod-confirm", codConfirmSchema, paymentController.confirmCod);

    // View Receipt HTML
    server.get("/receipt/:orderId", getReceiptSchema, paymentController.getReceiptHtml);

    // Real-time SSE stream for ERP (all orders) & Customer (/orders/[slug])
    server.get("/stream", paymentController.streamOrderUpdates);
    server.get("/stream/:orderKey", paymentController.streamOrderUpdates);
}
