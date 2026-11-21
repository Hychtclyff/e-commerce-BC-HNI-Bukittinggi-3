import { FastifyInstance } from 'fastify';

export interface RouteMeta {
    method: string;
    path: string;
    prefix?: string;
}

// Global registry for all registered Fastify routes
export const registeredRoutes: RouteMeta[] = [];

/**
 * Menyimpan metadata rute yang terdaftar
 */
export function recordRoute(route: RouteMeta) {
    // Hindari duplikasi method + path yang identik
    const exists = registeredRoutes.some(
        (r) => r.method === route.method && r.path === route.path
    );
    if (!exists) {
        registeredRoutes.push(route);
    }
}

/**
 * Plugin Route Meta untuk inspeksi endpoint backend
 */
export async function metaRoutes(app: FastifyInstance) {
    const handler = async () => {
        return {
            status: 'success',
            total: registeredRoutes.length,
            timestamp: new Date().toISOString(),
            routes: registeredRoutes,
        };
    };

    // Tersedia via GET /api/v1/meta/routes dan alias GET /api/v1/_routes
    app.get('/routes', handler);
    app.get('/_routes', handler);
}
