import fp from 'fastify-plugin';
import { db } from '../prisma/db';
import { env } from '../config/env';

// Kita ekspor tipe dari instance DB Prisma 8 agar auto-complete jalan
export type DbClient = typeof db;

declare module 'fastify' {
  interface FastifyInstance {
    prisma: DbClient;
  }
}

/**
 * Database connection pool retry configuration
 */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Retry helper untuk koneksi database
 */
async function retryConnection(
  fn: () => Promise<any>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY_MS
): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) {
      throw error;
    }

    // Jika error adalah connection issue, retry
    if (
      error?.message?.includes('Connection terminated') ||
      error?.message?.includes('connection refused') ||
      error?.message?.includes('ECONNREFUSED') ||
      error?.code === 'ECONNREFUSED'
    ) {
      console.warn(
        `⚠️ Database connection failed, retrying (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryConnection(fn, retries - 1, delay);
    }

    throw error;
  }
}

export default fp(async (fastify) => {
  try {
    // Di Prisma 8, instance `db` siap digunakan langsung.
    // Kita jalankan query 1 untuk memancing koneksi awal (warm-up) dengan retry logic.
    await retryConnection(async () => {
      const plan = db.raw.sql`SELECT 1`.affectedCount().build();
      await db.runtime().execute(plan);
    });

    fastify.log.info('✅ Prisma 8 terhubung ke database Supabase');

    fastify.decorate('prisma', db);

    // Endpoint health check untuk mengecek koneksi DB secara live
    fastify.get('/health/db', async (request, reply) => {
      try {
        const plan = fastify.prisma.raw.sql`SELECT 1`.affectedCount().build();
        await fastify.prisma.runtime().execute(plan);
        return reply.status(200).send({
          success: true,
          message: 'Koneksi database sehat (Healthy)',
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        request.log.error({ error }, 'Database health check failed');
        return reply.status(500).send({
          success: false,
          message: 'Koneksi database terputus atau bermasalah (Unhealthy)',
          error: error?.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Memastikan koneksi ditutup dengan bersih saat aplikasi mati
    fastify.addHook('onClose', async (server) => {
      try {
        await server.prisma.close();
        server.log.info('Prisma terputus dari database (graceful shutdown)');
      } catch (err) {
        server.log.error({ err }, 'Error closing Prisma connection');
      }
    });
  } catch (err: any) {
    fastify.log.error(
      { err, message: err?.message, code: err?.code },
      '❌ Gagal terhubung ke database via Prisma 8'
    );
    process.exit(1);
  }
});
