import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
    getProfileSchema,
    updateProfileSchema,
    updateHniProfileSchema,
    searchHNIProfileSchema,
    searchHniByIdSchema,
} from './profile.schema';
import { profileController } from './profile.controller';

export async function profileRoutes(route: FastifyInstance) {
    const server = route.withTypeProvider<ZodTypeProvider>();

    // 1. Static search routes first to prevent conflict with /:id
    server.post(
        '/search-hni-by-id',
        searchHniByIdSchema,
        profileController.searchHniById
    );

    server.get(
        '/search-hni',
        searchHNIProfileSchema,
        profileController.searchHNIProfile
    );

    server.get(
        '/searchHniProfile',
        searchHNIProfileSchema,
        profileController.searchHNIProfile
    );

    // 2. Parameterized user profile routes
    server.get(
        '/:id',
        getProfileSchema,
        profileController.getProfile
    );

    server.put(
        '/:id',
        updateProfileSchema,
        profileController.updateProfile
    );

    server.post(
        '/:id/hni',
        updateHniProfileSchema,
        profileController.saveHniProfile
    );

    server.put(
        '/:id/hni',
        updateHniProfileSchema,
        profileController.saveHniProfile
    );
}
