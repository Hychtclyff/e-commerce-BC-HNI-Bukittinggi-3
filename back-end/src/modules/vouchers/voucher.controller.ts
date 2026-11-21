import { FastifyRequest, FastifyReply } from 'fastify';
import { voucherService } from './voucher.service';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';
import { getLanguageFromRequest, t } from '@/i18n';
import { GetVouchersParams, ValidateVoucherBody } from './voucher.schema';

export const voucherController = {
    getVouchers: async (req: FastifyRequest<{ Params: GetVouchersParams }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const userId = req.params.userId || (req.query as any)?.userId || (req as any).user?.id;

        try {
            const data = await voucherService.getUserVouchers(userId, lang);

            return responseUtil.success({
                reply: res,
                message: t('vouchers.get_vouchers_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    validateVoucher: async (req: FastifyRequest<{ Body: ValidateVoucherBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        try {
            const resolvedUserId = req.body.userId || (req as any).user?.id;
            const result = await voucherService.validateVoucher(
                req.body.code,
                req.body.subtotal,
                req.body.shippingCost || 0,
                lang,
                resolvedUserId,
                {
                    paymentMethod: req.body.paymentMethod,
                    items: req.body.items,
                }
            );

            return responseUtil.success({
                reply: res,
                message: t('vouchers.get_vouchers_success', {}, lang),
                data: {
                    code: result.voucher.code,
                    title: result.voucher.title,
                    discountType: result.voucher.discountType,
                    discountAmount: result.discountAmount,
                    finalSubtotal: Math.max(0, req.body.subtotal - result.discountAmount),
                    minPurchase: result.voucher.minPurchase,
                },
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    }
};
