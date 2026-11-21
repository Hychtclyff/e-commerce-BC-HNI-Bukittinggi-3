import { FastifyRequest, FastifyReply } from "fastify";
import { deliveryService } from "./delivery.service";
import { responseUtil } from "@/utils/response";
import { AppError } from "@/utils/AppError";
import { getLanguageFromRequest } from "@/i18n";
import { deliveryScanGetSchema, deliveryScanPostSchema } from "./delivery.schema";

export const deliveryController = {
    getScanData: async (req: FastifyRequest<{ Params: { token: string } }>, res: FastifyReply) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await deliveryService.getScanData(req.params.token, lang);
            return responseUtil.success({
                reply: res,
                message: "Data pengiriman berhasil dimuat.",
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            return responseUtil.internalServerError(res, error.message);
        }
    },

    submitScanEvent: async (
        req: FastifyRequest<{ Params: { token: string }; Body: {
            latitude: number;
            longitude: number;
            photoBase64?: string;
            note?: string;
            event: string;
        } }>,
        res: FastifyReply,
    ) => {
        const lang = getLanguageFromRequest(req);

        try {
            const data = await deliveryService.submitScanEvent(req.params.token, req.body, lang);
            return responseUtil.success({
                reply: res,
                message: "Event pengiriman berhasil disimpan.",
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(res, error);
            }
            return responseUtil.internalServerError(res, error.message);
        }
    },
};
