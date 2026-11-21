import { pool } from '@/prisma/db';
import { AppError } from '../../utils/AppError';
import { notificationsService } from '../notifications/notifications.service';

export type VerificationFlowType =
  | 'MANUAL_TRANSFER'
  | 'QRIS_INSTANT'
  | 'B2B_CREDIT'
  | 'STORE_PICKUP'
  | 'COURIER_SHIPPING'
  | 'ORDER_COMPLETION';

/**
 * 1. Flow Verifikasi Transfer Bank Manual
 * Dipanggil saat admin toko memeriksa bukti transfer pelanggan
 */
export async function flowManualTransferVerification(
  orderId: string,
  params: {
    adminId?: string;
    action: 'APPROVE' | 'REJECT';
    rejectionReason?: string;
    notes?: string;
  }
) {
  const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
  if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
  const order = existing.rows[0];
  const userId = order.userId;
  const orderNumber = order.orderNumber;

  if (params.action === 'APPROVE') {
    // Alihkan ke PROCESSING (Sedang Dikemas) dan tandai PAID
    const nextStatus = order.shippingType === 'PICKUP' ? 'READY_FOR_PICKUP' : 'PROCESSING';
    await pool.query(
      `UPDATE orders.orders 
       SET "orderStatus" = $1, 
           "paymentStatus" = 'PAID', 
           notes = COALESCE($2, notes), 
           "updatedAt" = NOW()
       WHERE id = $3`,
      [nextStatus, params.notes || 'Pembayaran transfer manual disetujui oleh kasir/admin', orderId]
    );

    if (userId) {
      await notificationsService.createNotification({
        userId,
        title: 'Pembayaran Transfer Terverifikasi',
        message: `Bukti transfer pesanan #${orderNumber} telah diverifikasi. Pesanan Anda kini berstatus "${nextStatus === 'READY_FOR_PICKUP' ? 'Siap Diambil' : 'Sedang Dikemas'}".`,
        category: 'ORDER_STATUS',
        referenceId: orderId,
      });
    }

    return {
      flow: 'MANUAL_TRANSFER',
      orderId,
      orderNumber,
      orderStatus: nextStatus,
      paymentStatus: 'PAID',
      message: 'Verifikasi transfer disetujui. Pesanan dialihkan ke ' + nextStatus,
    };
  } else {
    // REJECT
    const reason = params.rejectionReason || 'Bukti transfer tidak valid atau dana belum masuk rekening';
    await pool.query(
      `UPDATE orders.orders 
       SET "orderStatus" = 'REJECTED', 
           "paymentStatus" = 'UNPAID', 
           "rejectionReason" = $1, 
           "updatedAt" = NOW()
       WHERE id = $2`,
      [reason, orderId]
    );

    if (userId) {
      await notificationsService.createNotification({
        userId,
        title: 'Verifikasi Transfer Ditolak',
        message: `Pesanan #${orderNumber} ditolak: ${reason}. Silakan lakukan pemesanan ulang atau hubungi admin.`,
        category: 'ORDER_STATUS',
        referenceId: orderId,
      });
    }

    return {
      flow: 'MANUAL_TRANSFER',
      orderId,
      orderNumber,
      orderStatus: 'REJECTED',
      paymentStatus: 'UNPAID',
      rejectionReason: reason,
      message: 'Pesanan transfer ditolak',
    };
  }
}

/**
 * 2. Flow Verifikasi Instan QRIS / Payment Gateway
 * Dipanggil secara otomatis oleh webhook gateway atau simulasi pembayaran instan
 */
export async function flowQrisInstantVerification(
  orderId: string,
  params: {
    transactionId?: string;
    gatewayStatus: 'SETTLEMENT' | 'EXPIRED' | 'CANCELLED';
    rawPayload?: any;
  }
) {
  const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
  if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
  const order = existing.rows[0];
  const userId = order.userId;
  const orderNumber = order.orderNumber;

  if (params.gatewayStatus === 'SETTLEMENT') {
    const nextStatus = order.shippingType === 'PICKUP' ? 'READY_FOR_PICKUP' : 'PROCESSING';
    await pool.query(
      `UPDATE orders.orders 
       SET "orderStatus" = $1, 
           "paymentStatus" = 'PAID', 
           notes = COALESCE($2, notes), 
           "updatedAt" = NOW()
       WHERE id = $3`,
      [
        nextStatus,
        `Pembayaran QRIS instan terverifikasi gateway (${params.transactionId || 'QRIS-LIVE'})`,
        orderId,
      ]
    );

    if (userId) {
      await notificationsService.createNotification({
        userId,
        title: 'Pembayaran QRIS Berhasil',
        message: `Pembayaran QRIS untuk pesanan #${orderNumber} telah lunas terkonfirmasi secara realtime.`,
        category: 'ORDER_STATUS',
        referenceId: orderId,
      });
    }

    return {
      flow: 'QRIS_INSTANT',
      orderId,
      orderNumber,
      orderStatus: nextStatus,
      paymentStatus: 'PAID',
      message: 'Pembayaran QRIS berhasil diselesaikan instan',
    };
  } else {
    // EXPIRED / CANCELLED
    await pool.query(
      `UPDATE orders.orders 
       SET "orderStatus" = 'CANCELLED', 
           "cancellationReason" = 'Waktu pembayaran QRIS telah kedaluwarsa (Expired)', 
           "updatedAt" = NOW()
       WHERE id = $1`,
      [orderId]
    );

    if (userId) {
      await notificationsService.createNotification({
        userId,
        title: 'Sesi QRIS Kedaluwarsa',
        message: `Batas waktu pembayaran pesanan #${orderNumber} telah berakhir. Pesanan otomatis dibatalkan.`,
        category: 'ORDER_STATUS',
        referenceId: orderId,
      });
    }

    return {
      flow: 'QRIS_INSTANT',
      orderId,
      orderNumber,
      orderStatus: 'CANCELLED',
      message: 'Sesi QRIS expired atau dibatalkan',
    };
  }
}

/**
 * 3. Flow Verifikasi Kredit B2B / Tempo Stokis & Agen
 * Dipanggil saat memvalidasi permohonan belanja tempo piutang
 */
export async function flowB2BCreditVerification(
  orderId: string,
  params: {
    adminId?: string;
    approved: boolean;
    tenorDays?: number;
    creditNotes?: string;
  }
) {
  const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
  if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
  const order = existing.rows[0];
  const userId = order.userId;
  const orderNumber = order.orderNumber;

  if (params.approved) {
    const days = params.tenorDays || 14;
    await pool.query(
      `UPDATE orders.orders 
       SET "orderStatus" = 'PROCESSING', 
           "paymentStatus" = 'ON_CREDIT', 
           "dueDate" = NOW() + ($1 || ' days')::interval,
           notes = COALESCE($2, notes),
           "updatedAt" = NOW()
       WHERE id = $3`,
      [days.toString(), params.creditNotes || `Kredit B2B disetujui (Tenor ${days} hari)`, orderId]
    );

    if (userId) {
      await notificationsService.createNotification({
        userId,
        title: 'Kredit B2B Disetujui',
        message: `Pengajuan tempo pesanan #${orderNumber} disetujui dengan tenor ${days} hari. Pesanan diproses ke pengemasan.`,
        category: 'ORDER_STATUS',
        referenceId: orderId,
      });
    }

    return {
      flow: 'B2B_CREDIT',
      orderId,
      orderNumber,
      orderStatus: 'PROCESSING',
      paymentStatus: 'ON_CREDIT',
      tenorDays: days,
      message: `Kredit B2B disetujui dengan batas tempo ${days} hari`,
    };
  } else {
    await pool.query(
      `UPDATE orders.orders 
       SET "orderStatus" = 'REJECTED', 
           "rejectionReason" = $1, 
           "updatedAt" = NOW()
       WHERE id = $2`,
      [params.creditNotes || 'Batas limit kredit tidak mencukupi atau riwayat jatuh tempo belum diselesaikan', orderId]
    );

    return {
      flow: 'B2B_CREDIT',
      orderId,
      orderNumber,
      orderStatus: 'REJECTED',
      message: 'Kredit B2B ditolak oleh pengelola toko',
    };
  }
}

/**
 * 4. Flow Verifikasi Ambil di Toko (Store Pickup)
 * Dipanggil saat pembeli datang ke gerai dan kasir memverifikasi kode pesanan
 */
export async function flowPickupVerification(
  orderId: string,
  params: {
    staffId?: string;
    pickupOtpOrCode?: string;
    notes?: string;
  }
) {
  const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
  if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
  const order = existing.rows[0];
  const userId = order.userId;
  const orderNumber = order.orderNumber;

  // Selesaikan pesanan langsung di kasir
  await pool.query(
    `UPDATE orders.orders 
     SET "orderStatus" = 'COMPLETED', 
         "paymentStatus" = 'PAID', 
         notes = COALESCE($1, notes),
         "updatedAt" = NOW()
     WHERE id = $2`,
    [params.notes || 'Barang telah diserahkan di gerai BC HNI 3 Bukittinggi', orderId]
  );

  if (userId) {
    await notificationsService.createNotification({
      userId,
      title: 'Barang Telah Diambil (Selesai)',
      message: `Pesanan #${orderNumber} telah Anda ambil di outlet BC HNI 3 Bukittinggi. Terima kasih atas kunjungan Anda!`,
      category: 'ORDER_STATUS',
      referenceId: orderId,
    });
  }

  return {
    flow: 'STORE_PICKUP',
    orderId,
    orderNumber,
    orderStatus: 'COMPLETED',
    paymentStatus: 'PAID',
    message: 'Barang berhasil diverifikasi dan diserahkan kepada pembeli',
  };
}

/**
 * 5. Flow Verifikasi Pengiriman Kurir / Ekspedisi (Courier Shipping)
 * Dipanggil saat staf gudang menempelkan label dan memasukkan nomor resi ekspedisi
 */
export async function flowCourierShippingVerification(
  orderId: string,
  params: {
    staffId?: string;
    courierName: string;
    trackingNumber: string;
    notes?: string;
  }
) {
  if (!params.trackingNumber || !params.trackingNumber.trim()) {
    throw new AppError('Nomor resi (AWB) pengiriman wajib diisi', 400);
  }

  const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
  if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
  const order = existing.rows[0];
  const userId = order.userId;
  const orderNumber = order.orderNumber;

  await pool.query(
    `UPDATE orders.orders 
     SET "orderStatus" = 'SHIPPED', 
         "shippingCourier" = $1, 
         "trackingNumber" = $2, 
         notes = COALESCE($3, notes),
         "updatedAt" = NOW()
     WHERE id = $4`,
    [params.courierName, params.trackingNumber.trim(), params.notes || null, orderId]
  );

  if (userId) {
    await notificationsService.createNotification({
      userId,
      title: 'Pesanan Telah Dikirimkan',
      message: `Pesanan #${orderNumber} telah diserahkan ke ${params.courierName} dengan No. Resi: ${params.trackingNumber.trim()}. Silakan lacak pengiriman Anda.`,
      category: 'ORDER_STATUS',
      referenceId: orderId,
    });
  }

  return {
    flow: 'COURIER_SHIPPING',
    orderId,
    orderNumber,
    orderStatus: 'SHIPPED',
    trackingNumber: params.trackingNumber.trim(),
    courierName: params.courierName,
    message: `Pesanan berhasil dialihkan ke SHIPPED dengan resi ${params.trackingNumber.trim()}`,
  };
}

/**
 * 6. Flow Penyelesaian Pesanan & Sinkronisasi Akhir (Order Completion)
 * Dipanggil saat pesanan tiba atau dikonfirmasi pembeli / sistem
 */
export async function flowOrderCompletionVerification(
  orderId: string,
  params: {
    completedBy?: string;
    role?: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
    notes?: string;
  }
) {
  const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
  if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
  const order = existing.rows[0];
  const userId = order.userId;
  const orderNumber = order.orderNumber;

  await pool.query(
    `UPDATE orders.orders 
     SET "orderStatus" = 'COMPLETED', 
         "updatedAt" = NOW()
     WHERE id = $1`,
    [orderId]
  );

  if (userId) {
    await notificationsService.createNotification({
      userId,
      title: 'Pesanan Selesai',
      message: `Pesanan #${orderNumber} telah selesai seutuhnya. Poin TP dan hak royalti Anda telah tercatat. Terima kasih!`,
      category: 'ORDER_STATUS',
      referenceId: orderId,
    });
  }

  return {
    flow: 'ORDER_COMPLETION',
    orderId,
    orderNumber,
    orderStatus: 'COMPLETED',
    message: 'Pesanan berhasil diselesaikan seutuhnya',
  };
}

/**
 * Dispatcher Terpusat untuk Seluruh Flow Verifikasi
 */
export async function dispatchVerificationFlow(
  flowType: VerificationFlowType,
  orderId: string,
  payload: any
) {
  switch (flowType) {
    case 'MANUAL_TRANSFER':
      return flowManualTransferVerification(orderId, payload);
    case 'QRIS_INSTANT':
      return flowQrisInstantVerification(orderId, payload);
    case 'B2B_CREDIT':
      return flowB2BCreditVerification(orderId, payload);
    case 'STORE_PICKUP':
      return flowPickupVerification(orderId, payload);
    case 'COURIER_SHIPPING':
      return flowCourierShippingVerification(orderId, payload);
    case 'ORDER_COMPLETION':
      return flowOrderCompletionVerification(orderId, payload);
    default:
      throw new AppError(`Tipe flow verifikasi '${flowType}' tidak dikenal`, 400);
  }
}
