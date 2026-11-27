import { FastifyCorsOptions } from '@fastify/cors';
import { env } from './env';

function normalizeOrigin(url?: string): string {
    return (url || '').trim().replace(/\/+$/, '');
}

const staticAllowedOrigins = new Set(
    [
        'http://localhost:3000',
        'https://localhost:3000',
        'http://127.0.0.1:3000',
        'https://tijrah.vercel.app',
        'https://tijarah.vercel.app',
        'https://e-commerce-bc-hni-bukittinggi-3.onrender.com',
        normalizeOrigin(env.FRONTEND_URL),
        normalizeOrigin(env.BACKEND_URL),
        ...(env.CORS_ORIGINS || '').split(',').map((o) => normalizeOrigin(o)),
    ].filter(Boolean)
);

const vercelPreviewPattern = /^https:\/\/tijra?h(-[a-z0-9-]+)?\.vercel\.app$/i;

export const corsOptions: FastifyCorsOptions = {
    origin: (origin, cb) => {
        // Allow server-to-server, curl, healthchecks, and non-browser requests (no Origin header)
        if (!origin || env.NODE_ENV !== 'production') {
            return cb(null, true);
        }

        const normalized = normalizeOrigin(origin);
        if (staticAllowedOrigins.has(normalized) || vercelPreviewPattern.test(normalized)) {
            return cb(null, true);
        }

        return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Accept-Language',
        'Language',
        'x-user-id',
        'X-User-Id',
        'x-requested-with',
        'X-Requested-With',
    ],
};
