import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
    getAddressesSchema,
    createAddressSchema,
    updateAddressSchema,
    addressIdOnlySchema,
} from './address.schema';
import { addressController } from './address.controller';

export async function addressRoutes(route: FastifyInstance) {
    const server = route.withTypeProvider<ZodTypeProvider>();

    server.get(
        '/',
        getAddressesSchema,
        addressController.getAddresses
    );

    server.get(
        '/:userId',
        getAddressesSchema,
        addressController.getAddresses
    );

    server.post(
        '/',
        createAddressSchema,
        addressController.createAddress
    );

    server.put(
        '/:id',
        updateAddressSchema,
        addressController.updateAddress
    );

    server.delete(
        '/:id',
        addressIdOnlySchema,
        addressController.deleteAddress
    );

    server.patch(
        '/:id/primary',
        addressIdOnlySchema,
        addressController.setPrimaryAddress
    );
}
