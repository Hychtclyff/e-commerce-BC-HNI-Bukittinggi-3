import { FastifyRequest, FastifyReply } from 'fastify';
import { checkoutService } from './checkout.service';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';
import { getLanguageFromRequest, t } from '@/i18n';
import { CalculateCheckoutBody, ProcessCheckoutBody, ApproveOrderBody, RejectOrderBody, ShipOrderBody } from './checkout.schema';

export const checkoutController = {
    calculateCheckout: async (req: FastifyRequest<{ Body: CalculateCheckoutBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const userId = req.body.userId || (req as any).user?.id || "GUEST_USER";

        try {
            const data = await checkoutService.calculateCheckout(userId, req.body, lang);

            return responseUtil.success({
                reply: res,
                message: t('checkout.calculate_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    processCheckout: async (req: FastifyRequest<{ Body: ProcessCheckoutBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const userId = req.body.userId || (req as any).user?.id;

        if (!userId) {
            return responseUtil.badRequest(res, t('profile.user_not_found', {}, lang));
        }

        try {
            const data = await checkoutService.processCheckout(userId, req.body, lang);

            return responseUtil.created({
                reply: res,
                message: req.body.paymentMethod === 'B2B_CREDIT'
                    ? t('checkout.kasbon_success', {}, lang)
                    : t('checkout.process_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    simulateMockPayment: async (req: FastifyRequest<{ Params: { orderId: string } }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await checkoutService.simulateMockPayment(req.params.orderId, lang);

            return responseUtil.success({
                reply: res,
                message: t('checkout.mock_pay_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    getOrderReceipt: async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await checkoutService.getOrderReceipt(req.params.id, lang);

            return responseUtil.success({
                reply: res,
                message: t('checkout.receipt_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    regeneratePaymentCode: async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await checkoutService.regeneratePaymentCode(req.params.id, lang);
            return responseUtil.success({
                reply: res,
                message: t('checkout.regenerate_payment_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    // --- OWNER / ADMIN HANDLERS ---

    approveOrder: async (req: FastifyRequest<{ Params: { id: string }; Body: ApproveOrderBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const adminUserId = (req as any).user?.id || "OWNER";

        try {
            const data = await checkoutService.approveOrder(req.params.id, req.body, adminUserId, lang);

            return responseUtil.success({
                reply: res,
                message: t('checkout.approve_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    shipOrder: async (req: FastifyRequest<{ Params: { id: string }; Body: ShipOrderBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const adminUserId = (req as any).user?.id || "OWNER";

        try {
            const data = await checkoutService.shipOrder(req.params.id, req.body, adminUserId, lang);

            return responseUtil.success({
                reply: res,
                message: "Status pesanan berhasil diperbarui menjadi SHIPPED / Siap Diambil.",
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    rejectOrder: async (req: FastifyRequest<{ Params: { id: string }; Body: RejectOrderBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const adminUserId = (req as any).user?.id || "OWNER";

        try {
            const data = await checkoutService.rejectOrder(req.params.id, req.body, adminUserId, lang);

            return responseUtil.success({
                reply: res,
                message: t('checkout.reject_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    }
};
