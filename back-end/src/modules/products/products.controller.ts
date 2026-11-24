import { FastifyRequest, FastifyReply } from 'fastify';
import { productsService } from './products.service';
import { productEngagementService } from './productEngagement.service';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';
import { getLanguageFromRequest, t } from '@/i18n';
import { GetProductsQuery } from './products.schema';

export const productsController = {
    getHighlightProducts: async (req: FastifyRequest<{ Querystring: { limit?: string } }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        try {
            const limit = req.query?.limit ? Number(req.query.limit) : 8;
            const data = await productsService.getHighlightProducts(limit);
            return responseUtil.success({
                reply: res,
                message: t('products.get_products_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    getProducts: async (req: FastifyRequest<{ Querystring: GetProductsQuery }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await productsService.getProducts(req.query, lang);

            return responseUtil.success({
                reply: res,
                message: t('products.get_products_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    getProductById: async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await productsService.getProductById(req.params.id, lang);

            return responseUtil.success({
                reply: res,
                message: t('products.get_products_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    getProductReviews: async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        try {
            const data = await productEngagementService.getReviews(req.params.id);
            return responseUtil.success({ reply: res, message: 'Ulasan produk berhasil dimuat.', data });
        } catch (error: any) {
            if (error instanceof AppError) return responseUtil.appError(res, error);
            throw error;
        }
    },

    createProductReview: async (
        req: FastifyRequest<{ Params: { id: string }; Body: { rating: number; comment?: string } }>,
        res: FastifyReply
    ) => {
        const userId = (req as any).user?.id;
        if (!userId) return responseUtil.unauthorized(res, 'Autentikasi diperlukan.');
        try {
            const data = await productEngagementService.createReview(req.params.id, userId, req.body);
            return responseUtil.created({ reply: res, message: 'Ulasan produk berhasil disimpan.', data });
        } catch (error: any) {
            if (error instanceof AppError) return responseUtil.appError(res, error);
            throw error;
        }
    },

    getRelatedProducts: async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        try {
            const data = await productEngagementService.getRelatedProducts(req.params.id);
            return responseUtil.success({ reply: res, message: 'Produk terkait berhasil dimuat.', data });
        } catch (error: any) {
            if (error instanceof AppError) return responseUtil.appError(res, error);
            throw error;
        }
    },
};
