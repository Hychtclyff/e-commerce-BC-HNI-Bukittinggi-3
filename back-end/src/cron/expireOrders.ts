import { pool } from '@/prisma/db';

/**
 * Worker Cron: Otomatis membatalkan pesanan yang belum dibayar dalam batas waktu
 * serta mengembalikan stok produk ke etalase toko (Poin 11).
 */
export async function expirePendingPayments() {
  try {
    const expiredRes = await pool.query(`
      SELECT id, "orderNumber", "userId" 
      FROM orders.orders 
      WHERE "orderStatus" = 'PENDING' 
        AND "paymentStatus" = 'UNPAID'
        AND "createdAt" < NOW() - INTERVAL '24 hours'
    `);

    let count = 0;
    for (const row of expiredRes.rows) {
      await pool.query(
        `UPDATE orders.orders 
         SET "orderStatus" = 'CANCELLED', 
             "paymentStatus" = 'EXPIRED',
             "cancellationReason" = 'Kedaluwarsa: Melebihi batas waktu pembayaran 24 jam',
             "updatedAt" = NOW()
         WHERE id = $1`,
        [row.id]
      );

      // Kembalikan kuantitas stok produk
      const itemsRes = await pool.query(
        `SELECT "productId", quantity FROM orders.order_items WHERE "orderId" = $1`,
        [row.id]
      );

      for (const item of itemsRes.rows) {
        await pool.query(
          `UPDATE products.products SET stock = stock + $1 WHERE id = $2`,
          [item.quantity, item.productId]
        );
      }

      count++;
    }

    return { cancelled: count };
  } catch (err) {
    console.error('Error in expirePendingPayments worker:', err);
    return { cancelled: 0 };
  }
}