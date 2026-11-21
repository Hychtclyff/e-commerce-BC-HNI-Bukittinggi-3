import { FastifyCorsOptions } from '@fastify/cors';
import { env } from './env';

export const corsOptions: FastifyCorsOptions = {
    origin:
        env.NODE_ENV === 'production'
            ? ['https://localhost:3000', 'http://localhost:3000', env.FRONTEND_URL].filter(Boolean) as string[]
            : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Accept-Language',
        'x-user-id',
        'X-User-Id',
        'x-requested-with',
        'X-Requested-With',
    ],
};
