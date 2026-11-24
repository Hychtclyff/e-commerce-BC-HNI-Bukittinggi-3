import { pool } from '@/prisma/db';

/**
 * Background worker untuk mengecek pesanan yang sedang dikemas (PAID / PROCESSING)
 * dan belum diprint, lalu memasukkannya ke antrean print (QUEUED).
 */
export async function processPrintQueueCheck() {
  try {
    const res = await pool.query(
      `UPDATE orders.orders
       SET print_status = 'QUEUED', "updatedAt" = NOW()
       WHERE "orderStatus" IN ('PAID', 'PROCESSING', 'READY_FOR_PICKUP')
         AND COALESCE(print_status, 'NOT_PRINTED') = 'NOT_PRINTED'
       RETURNING id, "orderNumber"`
    );
    if (res.rows.length > 0) {
      console.log(`[printQueue] ${res.rows.length} pesanan masuk ke antrean print (QUEUED).`);
    }
    return res.rows.length;
  } catch (err: any) {
    console.warn('[printQueue] Check warning:', err?.message);
    return 0;
  }
}

export function startPrintQueueCron(intervalMs: number = 60000) {
  processPrintQueueCheck().catch(() => {});
  return setInterval(() => {
    processPrintQueueCheck().catch(() => {});
  }, intervalMs);
}
