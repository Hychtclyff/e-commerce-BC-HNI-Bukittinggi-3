import { RateLimitPluginOptions } from '@fastify/rate-limit';
import { env } from './env';

export const rateLimitOptions: RateLimitPluginOptions = {
    // Batas default (bisa di-override per route nanti)
    max: 100,
    
    // Waktu tunggu reset
    timeWindow: '1 minute',
    
    // 💡 Trik: Bypass rate limit sepenuhnya ketika di environment development
    allowList: (req) => {
        return env.NODE_ENV === 'development';
    },
    
    // Pesan error jika user melebihi limit (agar seragam dengan schema JSON)
    errorResponseBuilder: (request, context) => {
        return {
            success: false,
            message: `Terlalu banyak permintaan (Spam). Silakan coba lagi dalam beberapa saat.`,
        };
    },
};
