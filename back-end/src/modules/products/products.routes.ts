import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { getProductsSchema } from './products.schema';
import { productsController } from './products.controller';
import { requireAuth } from '@/utils/authGuard';

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

    server.get(
        '/:id/reviews',
        productsController.getProductReviews
    );

    server.register(async (authed) => {
        authed.addHook('preHandler', requireAuth);
        authed.post('/:id/reviews', productsController.createProductReview);
    });

    server.get(
        '/:id/related',
        productsController.getRelatedProducts
    );
}
