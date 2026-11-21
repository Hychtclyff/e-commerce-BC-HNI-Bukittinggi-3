import { FastifyReply } from 'fastify';

interface SuccessResponseParams<T> {
  reply: FastifyReply;
  code?: number;
  message?: string;
  data?: T;
  meta?: any;
}

export const responseUtil = {
  // --- SUCCESS RESPONSES (2xx) ---

  /** 200 OK - Untuk request sukses secara umum (GET, PUT, PATCH) */
  success<T>({ reply, message = 'Success', data, meta }: Omit<SuccessResponseParams<T>, 'code'>) {
    return reply.code(200).send({
      status: 'success',
      message,
      ...(data !== undefined && { data }),
      ...(meta !== undefined && { meta }),
    });
  },

  /** 201 Created - Untuk request sukses membuat resource baru (POST) */
  created<T>({ reply, message = 'Created successfully', data, meta }: Omit<SuccessResponseParams<T>, 'code'>) {
    return reply.code(201).send({
      status: 'success',
      message,
      ...(data !== undefined && { data }),
      ...(meta !== undefined && { meta }),
    });
  },

  // --- ERROR RESPONSES (4xx & 5xx) ---
  // Catatan: Jika melempar (throw) error dari Service, gunakan Error handler Fastify.
  // Method di bawah ini digunakan jika Anda ingin me-return error secara manual di Controller.

  /** 400 Bad Request - Validasi gagal atau input salah */
  badRequest(reply: FastifyReply, message = 'Bad Request') {
    return reply.code(400).send({ status: 'error', message });
  },

  /** 401 Unauthorized - Belum login atau token tidak valid */
  unauthorized(reply: FastifyReply, message = 'Unauthorized') {
    return reply.code(401).send({ status: 'error', message });
  },

  /** 403 Forbidden - Sudah login tapi tidak punya akses (role tidak sesuai) */
  forbidden(reply: FastifyReply, message = 'Forbidden') {
    return reply.code(403).send({ status: 'error', message });
  },

  /** 404 Not Found - Data tidak ditemukan */
  notFound(reply: FastifyReply, message = 'Not Found') {
    return reply.code(404).send({ status: 'error', message });
  },

  /** 500 Internal Server Error - Kesalahan sistem */
  internalServerError(reply: FastifyReply, message = 'Internal Server Error') {
    return reply.code(500).send({ status: 'error', message });
  },

  /** AppError standard handler helper */
  appError(reply: FastifyReply, error: { statusCode?: number; message: string; details?: any }) {
    return reply.code(error.statusCode || 500).send({
      status: 'error',
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }
};

// Tetap export sendSuccess untuk kompatibilitas ke belakang (backward compatibility)
export function sendSuccess<T>({ reply, code = 200, message = 'Success', data, meta }: SuccessResponseParams<T>) {
  return reply.code(code).send({
    status: 'success',
    message,
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta }),
  });
}
