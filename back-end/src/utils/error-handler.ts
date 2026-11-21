import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export const errorHandler = (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const err: any = error;

    // 1. Zod Validation Error (dari fastify-type-provider-zod)
    if (error.validation || error instanceof ZodError) {
        return reply.status(400).send({
            success: false,
            message: 'Validasi data gagal',
            // fastify-type-provider-zod menyertakan detail error di error.validation
            errors: error.validation || (error as unknown as ZodError).issues || error.message,
        });
    }

    // 2. Prisma 8 Database Errors
    // SQL Driver errors surface as SqlQueryError with a kind and sqlState.
    if (err.kind === 'sql_query') {
        // Postgres 23505: Unique constraint violation (formerly P2002)
        if (err.sqlState === '23505') {
            const target = err.constraint || err.column || 'field';
            return reply.status(409).send({
                success: false,
                message: `Data dengan ${target} tersebut sudah digunakan (Duplikat).`,
            });
        }
        
        // Postgres 23503: Foreign key violation
        if (err.sqlState === '23503') {
            return reply.status(400).send({
                success: false,
                message: 'Data yang direferensikan tidak ditemukan atau tidak valid.',
            });
        }
        
        // Error Prisma SQL driver lainnya
        return reply.status(400).send({
            success: false,
            message: 'Permintaan operasi database tidak valid.',
            error_code: err.sqlState,
        });
    }

    // Prisma 8 Runtime Errors (formerly PrismaClientValidationError, etc.)
    if (err.name === 'RuntimeError') {
        return reply.status(400).send({
            success: false,
            message: 'Kesalahan saat menjalankan kueri database (RuntimeError).',
            error_code: err.code,
        });
    }

    // 3. Fastify Built-in Client Errors (misal: 404 Route Not Found, 415 Unsupported Media Type)
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        return reply.status(error.statusCode).send({
            success: false,
            message: error.message,
        });
    }

    // 4. Default Internal Server Error (500)
    // Log error asli ke sistem log (Pino) untuk debugging
    request.log.error(error);
    
    // Sembunyikan detail error dari sisi client untuk keamanan (bocornya struktur sistem/DB)
    return reply.status(500).send({
        success: false,
        message: 'Terjadi kesalahan pada sistem server.',
    });
};
