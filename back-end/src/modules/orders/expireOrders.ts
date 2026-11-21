import { pool } from '@/prisma/db';
import { notificationsService } from '../notifications/notifications.service';

export interface ICancelExpiredOrdersResult {
  totalScanned: number;
  cancelledCount: number;
  restoredItemsCount: number;
  cancelledOrderNumbers: string[];
}

/**
 * Worker / Service untuk membatalkan pesanan kedaluwarsa secara otomatis
 * dan mengembalikan kuantitas stok produk ke inventaris secara live.
 */
export async function cancelExpiredOrders(): Promise<ICancelExpiredOrdersResult> {
  const client = await pool.connect();
  let cancelledCount = 0;
  let restoredItemsCount = 0;
  const cancelledOrderNumbers: string[] = [];

  try {
    // 1. Cari order yang berstatus PENDING / PENDING_PAYMENT yang melewati batas pembayaran
    // Kriteria:
    // a. paymentStatus = 'PENDING' atau 'UNPAID'
    // b. orderStatus IN ('PENDING', 'PENDING_PAYMENT')
    // c. dueDate < NOW() ATAU createdAt < NOW() - INTERVAL '24 hours'
    const expiredOrdersQuery = `
      SELECT id, "orderNumber", "userId", "totalAmount", "createdAt", "dueDate"
      FROM orders.orders
      WHERE "orderStatus" IN ('PENDING', 'PENDING_PAYMENT')
        AND ("paymentStatus" IN ('PENDING', 'UNPAID') OR "paymentStatus" IS NULL)
        AND (
          ("dueDate" IS NOT NULL AND "dueDate" < NOW())
          OR ("dueDate" IS NULL AND "createdAt" < NOW() - INTERVAL '24 hours')
        )
    `;

    const expiredRes = await client.query(expiredOrdersQuery);
    const expiredOrders = expiredRes.rows;

    if (expiredOrders.length === 0) {
      return {
        totalScanned: 0,
        cancelledCount: 0,
        restoredItemsCount: 0,
        cancelledOrderNumbers: [],
      };
    }

    for (const order of expiredOrders) {
      try {
        await client.query('BEGIN');

        // 2. Ambil seluruh item pesanan dari orders.order_items
        const itemsRes = await client.query(
          `SELECT "productId", sku, qty, "productName" 
           FROM orders.order_items 
           WHERE "orderId" = $1`,
          [order.id]
        );

        // 3. Kembalikan stok produk ke tabel products.products
        for (const item of itemsRes.rows) {
          const qty = Number(item.qty) || 1;
          if (item.productId) {
            await client.query(
              `UPDATE products.products 
               SET stock = stock + $1, "updatedAt" = NOW() 
               WHERE id = $2`,
              [qty, item.productId]
            );
          } else if (item.sku) {
            await client.query(
              `UPDATE products.products 
               SET stock = stock + $1, "updatedAt" = NOW() 
               WHERE sku = $2`,
              [qty, item.sku]
            );
          }
          restoredItemsCount += qty;
        }

        // 4. Update status order menjadi CANCELLED & EXPIRED
        await client.query(
          `UPDATE orders.orders
           SET "orderStatus" = 'CANCELLED',
               "paymentStatus" = 'EXPIRED',
               "cancellationReason" = 'Batas waktu pembayaran telah kedaluwarsa (Auto-Cancelled by System)',
               "updatedAt" = NOW()
           WHERE id = $1`,
          [order.id]
        );

        await client.query('COMMIT');
        cancelledCount++;
        cancelledOrderNumbers.push(order.orderNumber);

        // 5. Kirim notifikasi sistem jika ada userId
        if (order.userId) {
          notificationsService
            .createNotification({
              userId: order.userId,
              title: 'Pesanan Kedaluwarsa Dibatalkan',
              message: `Pesanan ${order.orderNumber} telah dibatalkan otomatis karena melewati batas waktu pembayaran. Stok produk telah dikembalikan.`,
              category: 'ORDER_STATUS',
              referenceId: order.id,
            })
            .catch(() => {});
        }
      } catch (orderErr) {
        await client.query('ROLLBACK');
        console.error(`[expireOrders] Gagal membatalkan order ${order.orderNumber}:`, orderErr);
      }
    }

    return {
      totalScanned: expiredOrders.length,
      cancelledCount,
      restoredItemsCount,
      cancelledOrderNumbers,
    };
  } finally {
    client.release();
  }
}

/**
 * Menjalankan background worker berkala untuk pembatalan order expired
 */
export function startExpiredOrdersCron(intervalMs: number = 600000): NodeJS.Timeout {
  console.log(`[expireOrders] Background worker diaktifkan (interval: ${intervalMs / 1000}s)`);

  // Jalankan run pertama setelah 10 detik
  setTimeout(async () => {
    try {
      const res = await cancelExpiredOrders();
      if (res.cancelledCount > 0) {
        console.log(`[expireOrders] Berhasil auto-cancel ${res.cancelledCount} order kedaluwarsa:`, res.cancelledOrderNumbers);
      }
    } catch (err) {
      console.error('[expireOrders] Error pada run inisial:', err);
    }
  }, 10000);

  // Jadwalkan berulang
  return setInterval(async () => {
    try {
      const res = await cancelExpiredOrders();
      if (res.cancelledCount > 0) {
        console.log(`[expireOrders] Berhasil auto-cancel ${res.cancelledCount} order kedaluwarsa:`, res.cancelledOrderNumbers);
      }
    } catch (err) {
      console.error('[expireOrders] Error pada periodic check:', err);
    }
  }, intervalMs);
}
