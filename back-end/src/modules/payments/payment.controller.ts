import { FastifyRequest, FastifyReply } from "fastify";
import { paymentService } from "./payment.service";
import { responseUtil } from "@/utils/response";
import { AppError } from "@/utils/AppError";
import { getLanguageFromRequest } from "@/i18n";
import { db } from "@/prisma/db";
import { env } from "@/config/env";
import { OrderIdParams, ConfirmTransferBody, CodConfirmBody } from "./payment.type";
import { paymentEvents, OrderRealtimeEvent } from "./paymentEvents";

export const paymentController = {
    handleXenditWebhook: async (req: FastifyRequest, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const signature = req.headers["x-callback-token"] as string;

        if (env.XENDIT_WEBHOOK_TOKEN && signature && signature !== env.XENDIT_WEBHOOK_TOKEN) {
            return responseUtil.unauthorized(res, "Unauthorized: Invalid callback token");
        }

        try {
            const data = await paymentService.handleXenditWebhook(req.body, signature, lang);
            return responseUtil.success({
                reply: res,
                message: "Webhook processed successfully",
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    syncPaymentStatus: async (req: FastifyRequest<{ Params: OrderIdParams }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await paymentService.syncOrderPaymentWithXendit(req.params.orderId, lang);
            return responseUtil.success({
                reply: res,
                message: "Status pembayaran berhasil disinkronisasi dengan Xendit.",
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    confirmManualTransfer: async (req: FastifyRequest<{ Body: ConfirmTransferBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const adminUserId = (req as any).user?.id || "ADMIN";

        try {
            const data = await paymentService.confirmManualTransfer(req.body.orderId, adminUserId, req.body.bankName, lang);
            return responseUtil.success({
                reply: res,
                message: "Transfer manual berhasil dikonfirmasi.",
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    confirmCod: async (req: FastifyRequest<{ Params: OrderIdParams; Body: CodConfirmBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await paymentService.confirmCod(req.params.orderId, req.body.courierUserId, req.body.signature, lang);
            return responseUtil.success({
                reply: res,
                message: "Pembayaran COD berhasil dikonfirmasi.",
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    getReceiptHtml: async (req: FastifyRequest<{ Params: OrderIdParams }>, res: FastifyReply) => {
        try {
            const receipt = await (db.orm as any).payments?.PaymentReceipt?.where({ orderId: req.params.orderId }).first();
            if (!receipt) {
                return responseUtil.notFound(res, "Resi tidak ditemukan.");
            }

            return res.type("text/html").send(receipt.receiptHtml);
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            return responseUtil.internalServerError(res, error.message);
        }
    },

    streamOrderUpdates: async (
        req: FastifyRequest<{ Params: { orderKey?: string } }>,
        res: FastifyReply
    ) => {
        const orderKey = req.params?.orderKey;

        res.raw.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
        });

        res.raw.write(`event: connected\ndata: ${JSON.stringify({ ok: true, orderKey: orderKey || "ALL" })}\n\n`);

        const onOrderUpdated = (payload: OrderRealtimeEvent) => {
            if (
                orderKey &&
                payload.orderId !== orderKey &&
                payload.slug !== orderKey &&
                payload.orderNumber !== orderKey
            ) {
                return;
            }
            res.raw.write(`event: order-updated\ndata: ${JSON.stringify(payload)}\n\n`);
        };

        paymentEvents.on("order-updated", onOrderUpdated);
        const heartbeat = setInterval(() => {
            res.raw.write(`: heartbeat\n\n`);
        }, 25000);

        req.raw.on("close", () => {
            clearInterval(heartbeat);
            paymentEvents.off("order-updated", onOrderUpdated);
        });
    },
};
