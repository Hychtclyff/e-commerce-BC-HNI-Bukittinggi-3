import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { getProductsSchema } from './products.schema';
import { productsController } from './products.controller';

export async function productRoutes(route: FastifyInstance) {
    const server = route.withTypeProvider<ZodTypeProvider>();

    server.get(
        '/highlights',
        productsController.getHighlightProducts
    );

    server.get(
        '/',
        getProductsSchema,
        productsController.getProducts
    );

    server.get(
        '/:id',
        productsController.getProductById
    );
}
