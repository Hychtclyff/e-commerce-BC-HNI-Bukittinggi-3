import crypto from 'crypto';
import { pool } from '@/prisma/db';
import { AppError } from '@/utils/AppError';

export const orderReturnService = {
  async getUserReturns(userId: string) {
    const res = await pool.query(
      `SELECT id, order_id AS "orderId", order_number AS "orderNumber", user_id AS "userId",
              reason, description, evidence_url AS "evidenceUrl", status,
              admin_notes AS "adminNotes", refund_amount AS "refundAmount",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM orders.order_returns
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  },

  async getOrderReturn(orderIdOrSlug: string, userId: string) {
    const orderRes = await pool.query(
      `SELECT id, "userId" FROM orders.orders WHERE id = $1 OR slug = $1 OR "orderNumber" = $1 LIMIT 1`,
      [orderIdOrSlug]
    );
    if (orderRes.rows.length === 0) {
      throw new AppError('Pesanan tidak ditemukan.', 404);
    }
    const order = orderRes.rows[0];
    if (order.userId !== userId) {
      throw new AppError('Anda tidak berhak mengakses pesanan ini.', 403);
    }

    const res = await pool.query(
      `SELECT id, order_id AS "orderId", order_number AS "orderNumber", user_id AS "userId",
              reason, description, evidence_url AS "evidenceUrl", status,
              admin_notes AS "adminNotes", refund_amount AS "refundAmount",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM orders.order_returns
       WHERE order_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [order.id]
    );
    return res.rows[0] || null;
  },

  async createOrderReturn(
    orderIdOrSlug: string,
    userId: string,
    payload: { reason: string; description: string; evidenceUrl?: string }
  ) {
    const orderRes = await pool.query(
      `SELECT id, "orderNumber", "userId", "orderStatus", "totalAmount"
       FROM orders.orders
       WHERE id = $1 OR slug = $1 OR "orderNumber" = $1
       LIMIT 1`,
      [orderIdOrSlug]
    );
    if (orderRes.rows.length === 0) {
      throw new AppError('Pesanan tidak ditemukan.', 404);
    }

    const order = orderRes.rows[0];
    if (order.userId !== userId) {
      throw new AppError('Anda tidak berhak mengajukan retur untuk pesanan ini.', 403);
    }

    const allowedStatuses = new Set(['COMPLETED']);
    if (!allowedStatuses.has(String(order.orderStatus).toUpperCase())) {
      throw new AppError(
        'Pengajuan retur/komplain hanya dapat dilakukan setelah pesanan berstatus SELESAI (COMPLETED).',
        400
      );
    }

    if (!payload.evidenceUrl || !payload.evidenceUrl.trim()) {
      throw new AppError('Foto bukti retur wajib diunggah sebelum mengajukan retur.', 400);
    }

    const existing = await pool.query(
      `SELECT id, status FROM orders.order_returns WHERE order_id = $1 AND status = 'PENDING' LIMIT 1`,
      [order.id]
    );
    if (existing.rows.length > 0) {
      throw new AppError('Pengajuan retur untuk pesanan ini sedang menunggu peninjauan.', 400);
    }

    const id = `RET-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    const inserted = await pool.query(
      `INSERT INTO orders.order_returns
         (id, order_id, order_number, user_id, reason, description, evidence_url, status, refund_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
       RETURNING id, order_id AS "orderId", order_number AS "orderNumber", user_id AS "userId",
                 reason, description, evidence_url AS "evidenceUrl", status,
                 admin_notes AS "adminNotes", refund_amount AS "refundAmount",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        id,
        order.id,
        order.orderNumber,
        userId,
        payload.reason.trim(),
        payload.description.trim(),
        payload.evidenceUrl?.trim() || null,
        Number(order.totalAmount || 0),
      ]
    );

    await pool.query(
      `UPDATE orders.orders SET "orderStatus" = 'RETURN_REQUESTED', "updatedAt" = NOW() WHERE id = $1`,
      [order.id]
    );

    return inserted.rows[0];
  },
};
