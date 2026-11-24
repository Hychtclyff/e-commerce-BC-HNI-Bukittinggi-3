import { FastifyRequest, FastifyReply } from 'fastify';
import { profileService } from './profile.service';
import { productEngagementService } from '../products/productEngagement.service';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';
import { getLanguageFromRequest, t } from '@/i18n';
import { GetProfileParams, SearchHNIProfileQuery, UpdateHniProfileBody, UpdateProfileBody } from './profile.schema';

export const profileController = {
    getWishlist: async (req: FastifyRequest, res: FastifyReply) => {
        const userId = (req as any).user?.id;
        if (!userId) return responseUtil.unauthorized(res, 'Autentikasi diperlukan.');
        try {
            const data = await productEngagementService.getWishlist(userId);
            return responseUtil.success({ reply: res, message: 'Daftar wishlist berhasil dimuat.', data });
        } catch (error: any) {
            if (error instanceof AppError) return responseUtil.appError(res, error);
            throw error;
        }
    },

    toggleWishlist: async (req: FastifyRequest<{ Body: { productId: string } }>, res: FastifyReply) => {
        const userId = (req as any).user?.id;
        if (!userId) return responseUtil.unauthorized(res, 'Autentikasi diperlukan.');
        try {
            const data = await productEngagementService.toggleWishlist(userId, req.body.productId);
            return responseUtil.success({ reply: res, message: 'Wishlist diperbarui.', data });
        } catch (error: any) {
            if (error instanceof AppError) return responseUtil.appError(res, error);
            throw error;
        }
    },

    getProfile: async (req: FastifyRequest<{ Params: GetProfileParams }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await profileService.getProfile(req.params.id, lang);

            return responseUtil.success({
                reply: res,
                message: t('profile.get_profile_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    updateProfile: async (req: FastifyRequest<{ Params: GetProfileParams; Body: UpdateProfileBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await profileService.updateProfile(req.params.id, req.body, lang);

            return responseUtil.success({
                reply: res,
                message: t('profile.update_profile_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    saveHniProfile: async (req: FastifyRequest<{ Params: GetProfileParams; Body: UpdateHniProfileBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await profileService.saveHniProfile(req.params.id, req.body, lang);

            return responseUtil.success({
                reply: res,
                message: t('profile.save_hni_profile_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    searchHNIProfile: async (req: FastifyRequest<{ Querystring: SearchHNIProfileQuery }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const { noHandphone, keyword, searchType, filterType, start, limit } = req.query;
            const searchKeyword = noHandphone || keyword;
            const data = await profileService.searchHNIProfile({
                keyword: searchKeyword,
                searchType,
                filterType,
                start,
                limit
            }, lang);

            return responseUtil.success({
                reply: res,
                message: t('profile.search_hni_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    searchHniById: async (req: FastifyRequest<{ Body: { code: string; jual?: string } }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const result = await profileService.searchHniMemberById(req.body, lang);

            return responseUtil.success({
                reply: res,
                message: t('profile.search_hni_success', {}, lang),
                data: result.data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },
};