import { FastifyRequest, FastifyReply } from 'fastify';
import { addressService } from './address.service';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';
import { getLanguageFromRequest, t } from '@/i18n';
import { GetAddressesParams, AddressIdParams, CreateAddressBody, UpdateAddressBody } from './address.schema';

export const addressController = {
    getAddresses: async (req: FastifyRequest<{ Params: GetAddressesParams }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const userId = req.params.userId || (req.query as any)?.userId || (req as any).user?.id;

        try {
            const data = await addressService.getAddresses(userId, lang);

            return responseUtil.success({
                reply: res,
                message: t('addresses.get_addresses_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    createAddress: async (req: FastifyRequest<{ Body: CreateAddressBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);
        const userId = req.body.userId || (req.query as any)?.userId || (req as any).user?.id;

        try {
            const data = await addressService.createAddress({
                ...req.body,
                userId,
            }, lang);

            return responseUtil.created({
                reply: res,
                message: t('addresses.create_address_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    updateAddress: async (req: FastifyRequest<{ Params: AddressIdParams; Body: UpdateAddressBody }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await addressService.updateAddress(req.params.id, req.body, lang);

            return responseUtil.success({
                reply: res,
                message: t('addresses.update_address_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    deleteAddress: async (req: FastifyRequest<{ Params: AddressIdParams }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await addressService.deleteAddress(req.params.id, lang);

            return responseUtil.success({
                reply: res,
                message: t('addresses.delete_address_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            throw error;
        }
    },

    setPrimaryAddress: async (req: FastifyRequest<{ Params: AddressIdParams }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await addressService.setPrimaryAddress(req.params.id, lang);

            return responseUtil.success({
                reply: res,
                message: t('addresses.set_primary_success', {}, lang),
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
