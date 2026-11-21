import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { getVouchersSchema, validateVoucherSchema } from './voucher.schema';
import { voucherController } from './voucher.controller';

export async function voucherRoutes(route: FastifyInstance) {
    const server = route.withTypeProvider<ZodTypeProvider>();

    server.get(
        '/',
        getVouchersSchema,
        voucherController.getVouchers
    );

    server.get(
        '/:userId',
        getVouchersSchema,
        voucherController.getVouchers
    );

    server.post(
        '/validate',
        validateVoucherSchema,
        voucherController.validateVoucher
    );
}
