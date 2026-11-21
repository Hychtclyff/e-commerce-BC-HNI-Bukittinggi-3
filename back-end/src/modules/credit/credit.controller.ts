import { FastifyRequest, FastifyReply } from 'fastify';
import { creditService } from './credit.service';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';
import { getLanguageFromRequest, t } from '@/i18n';
import { ApplyCreditBody, ApproveCreditApplicationBody, GetCreditParams, GetCreditQuery, RejectCreditApplicationBody } from './credit.schema';

export const creditController = {
    getCreditAccount: async (req: FastifyRequest<{ Params: GetCreditParams; Querystring: GetCreditQuery }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const userId = req.params.userId || (req as any).user?.id || (req.query as any)?.userId;

        if (!userId) {
            return responseUtil.badRequest(res, t('profile.user_not_found', {}, lang));
        }

        try {
            const data = await creditService.getCreditAccount(userId, lang);

            return responseUtil.success({
                reply: res,
                message: t('credit.get_account_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    applyCredit: async (req: FastifyRequest<{ Body: ApplyCreditBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const userId = req.body.userId || (req as any).user?.id;

        if (!userId) {
            return responseUtil.badRequest(res, t('profile.user_not_found', {}, lang));
        }

        try {
            const data = await creditService.applyCredit(userId, req.body, lang);

            return responseUtil.created({
                reply: res,
                message: t('credit.apply_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    getCreditLedger: async (req: FastifyRequest<{ Params: GetCreditParams; Querystring: GetCreditQuery }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const userId = req.params.userId || (req as any).user?.id || (req.query as any)?.userId;

        if (!userId) {
            return responseUtil.badRequest(res, t('profile.user_not_found', {}, lang));
        }

        try {
            const data = await creditService.getCreditLedger(userId, lang);

            return responseUtil.success({
                reply: res,
                message: t('credit.get_ledger_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    // --- ADMIN CONTROLLERS ---

    getApplications: async (req: FastifyRequest<{ Querystring: GetCreditQuery }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await creditService.getApplications(req.query, lang);

            return responseUtil.success({
                reply: res,
                message: t('credit.get_applications_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    approveApplication: async (req: FastifyRequest<{ Params: GetCreditParams; Body: ApproveCreditApplicationBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const targetId = req.params.id || req.params.userId || "";
        const adminUserId = (req as any).user?.id || "ADMIN";

        try {
            const data = await creditService.approveApplication(targetId, req.body, adminUserId, lang);

            return responseUtil.success({
                reply: res,
                message: t('credit.approve_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    rejectApplication: async (req: FastifyRequest<{ Params: GetCreditParams; Body: RejectCreditApplicationBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const targetId = req.params.id || req.params.userId || "";
        const adminUserId = (req as any).user?.id || "ADMIN";

        try {
            const data = await creditService.rejectApplication(targetId, req.body, adminUserId, lang);

            return responseUtil.success({
                reply: res,
                message: t('credit.reject_success', {}, lang),
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
