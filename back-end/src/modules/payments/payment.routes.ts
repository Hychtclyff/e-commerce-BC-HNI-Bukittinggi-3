import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { paymentController } from "./payment.controller";
import {
    syncPaymentStatusSchema,
    confirmTransferSchema,
    codConfirmSchema,
    getReceiptSchema,
} from "./payment.schema";
import { requireStoreStaff } from "@/utils/authGuard";

export async function paymentRoutes(route: FastifyInstance) {
    const server = route.withTypeProvider<ZodTypeProvider>();

    // Webhook Xendit
    server.post("/webhook", paymentController.handleXenditWebhook);

    // Sync status pembayaran langsung dari Xendit API
    server.get("/sync-status/:orderId", syncPaymentStatusSchema, paymentController.syncPaymentStatus);

    // Admin & Courier protected routes
    server.register(async (staff) => {
        staff.addHook("preHandler", requireStoreStaff);
        staff.post("/admin/confirm-transfer", confirmTransferSchema, paymentController.confirmManualTransfer);
        staff.post("/orders/:orderId/cod-confirm", codConfirmSchema, paymentController.confirmCod);
    });

    // View Receipt HTML
    server.get("/receipt/:orderId", getReceiptSchema, paymentController.getReceiptHtml);

    // Real-time SSE stream for ERP (all orders) & Customer (/orders/[slug])
    server.get("/stream", paymentController.streamOrderUpdates);
    server.get("/stream/:orderKey", paymentController.streamOrderUpdates);
}
