import { pool } from '@/prisma/db';
import { AppError } from '../../utils/AppError';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import net from 'net';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { notificationsService } from '../notifications/notifications.service';
import { cancelExpiredOrders } from '../orders/expireOrders';
import { paymentEvents } from '../payments/paymentEvents';
import { logStoreActivity } from '@/utils/auditLog';
import { xenditService } from '../../config/xendit';
import { SupportedLanguage, t } from '@/i18n';
import { axiosClient, setRuntimeHsisAuth, getRuntimeHsisAuth } from '@/config/axios';
import { captureHsisTokenInteractive } from './hsis/hsisBrowserAuth';

const execAsync = promisify(exec);

export const storeService = {
  // ==========================================
  // 1. METRICS & RINGKASAN ERP
  // ==========================================
  async getMetrics() {
    const ordersRes = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN "orderStatus" IN ('COMPLETED', 'DELIVERED', 'SHIPPED', 'PROCESSING') AND "paymentStatus" = 'PAID' THEN "totalAmount" ELSE 0 END), 0) as total_revenue,
        COUNT(CASE WHEN "orderStatus" IN ('PENDING') THEN 1 END) as pending_approval,
        COUNT(CASE WHEN "orderStatus" = 'PROCESSING' THEN 1 END) as pending_shipment
      FROM orders.orders
    `);

    const productsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_sku,
        COUNT(CASE WHEN stock <= 10 THEN 1 END) as low_stock
      FROM products.products
    `);

    const creditRes = await pool.query(`
      SELECT COUNT(*) as pending_credit
      FROM b2b_credit.b2b_credit_applications
      WHERE status IN ('PENDING', 'PENDING_APPROVAL')
    `);

    const o = ordersRes.rows[0];
    const p = productsRes.rows[0];
    const c = creditRes.rows[0];

    return {
      totalRevenue: Number(o.total_revenue) || 0,
      totalOrders: Number(o.total_orders) || 0,
      pendingApprovalCount: Number(o.pending_approval) || 0,
      pendingShipmentCount: Number(o.pending_shipment) || 0,
      lowStockCount: Number(p.low_stock) || 0,
      totalSku: Number(p.total_sku) || 0,
      pendingCreditCount: Number(c.pending_credit) || 0,
    };
  },

  // ==========================================
  // 2. PESANAN (ORDERS & STORE APPROVAL)
  // ==========================================
  async getOrders() {
    const res = await pool.query(`
      SELECT 
        o.id,
        o."orderNumber",
        o."userId",
        COALESCE(o."recipientName", u."fullName", 'Pelanggan HNI') as "recipientName",
        COALESCE(o."recipientPhone", u."phoneNumber", '08123456789') as "recipientPhone",
        o."orderStatus",
        o."paymentStatus",
        o."paymentMethod",
        o."totalAmount",
        o.subtotal,
        o."shippingCost",
        o."discountAmount",
        o."totalTpPoints",
        o."shippingAddressText",
        o."shippingCourier",
        o."trackingNumber",
        o.notes,
        o."rejectionReason",
        o."cancellationReason",
        o.refund_bank_name AS "refundBankName",
        o.refund_account_number AS "refundAccountNumber",
        o.refund_account_name AS "refundAccountName",
        o.refund_proof_url AS "refundProofUrl",
        o.cash_received AS "cashReceived",
        COALESCE(o.print_status, 'NOT_PRINTED') AS "printStatus",
        o.printed_at AS "printedAt",
        COALESCE(o.refund_confirmed_by_user, FALSE) AS "refundConfirmedByUser",
        o.refund_confirmed_at AS "refundConfirmedAt",
        o."createdAt",
        o."updatedAt",
        o."shippingType",
        o.acted_by_user_id,
        o.acted_by_name,
        o.acted_by_signature_code,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'productId', oi."productId",
              'productName', oi."productName",
              'sku', oi.sku,
              'quantity', oi.qty,
              'unitPrice', oi."unitPrice",
              'subtotal', oi."totalPrice",
              'points', oi."tpPoints"
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items
      FROM orders.orders o
      LEFT JOIN core_auth.users u ON u.id = o."userId"
      LEFT JOIN orders.order_items oi ON oi."orderId" = o.id
      GROUP BY o.id, u."fullName", u."phoneNumber"
      ORDER BY o."createdAt" DESC
    `);

    return res.rows.map((row) => ({
      id: row.id,
      slug: row.slug || String(row.orderNumber || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      orderNumber: row.orderNumber,
      userId: row.userId,
      customerName: row.recipientName,
      customerPhone: row.recipientPhone,
      shippingAddress: row.shippingAddressText || 'Pickup di Outlet BC HNI 3 Bukittinggi',
      fulfillmentType: (row.shippingType === 'PICKUP' ? 'PICKUP' : 'DELIVERY') as 'PICKUP' | 'DELIVERY',
      status: row.orderStatus,
      paymentStatus: row.paymentStatus,
      paymentMethod: row.paymentMethod,
      totalAmount: Number(row.totalAmount),
      subtotal: Number(row.subtotal),
      shippingFee: Number(row.shippingCost),
      discount: Number(row.discountAmount),
      totalPoints: Number(row.totalTpPoints),
      courier: row.shippingCourier,
      trackingNumber: row.trackingNumber,
      notes: row.notes,
      rejectionReason: row.rejectionReason,
      actedByUserId: row.acted_by_user_id || null,
      actedByName: row.acted_by_name || null,
      actedBySignatureCode: row.acted_by_signature_code || null,
      createdAt: row.createdAt,
      items: row.items,
    }));
  },

  async requireEmployeeSignature(actor?: { userId?: string; fullName?: string }, lang: SupportedLanguage = 'id') {
    const userId = actor?.userId ? String(actor.userId).trim() : null;
    let fullName = actor?.fullName ? String(actor.fullName).trim() : null;

    if (userId && !fullName) {
      const userRes = await pool.query('SELECT "fullName" FROM core_auth.users WHERE id = $1 LIMIT 1', [userId]);
      if (userRes.rows[0]?.fullName) {
        fullName = String(userRes.rows[0].fullName).trim();
      }
    }

    const sigRes = await pool.query(
      `SELECT id, user_id, staff_id, signer_name, signer_role, verification_code
       FROM store.esignatures
       WHERE status = 'ACTIVE'
         AND (
           ($1::text IS NOT NULL AND (user_id = $1 OR staff_id = $1))
           OR ($2::text IS NOT NULL AND LOWER(signer_name) = LOWER($2))
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, fullName]
    );

    if (sigRes.rows.length === 0) {
      throw new AppError(t('store.signature_required', {}, lang), 400);
    }

    const sig = sigRes.rows[0];
    return {
      userId: sig.user_id || userId,
      signerName: sig.signer_name,
      verificationCode: sig.verification_code,
    };
  },

  async approveOrder(orderId: string, notes?: string, actor?: { userId?: string; fullName?: string }, lang: SupportedLanguage = 'id') {
    const sig = await this.requireEmployeeSignature(actor, lang);
    const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
    if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
    const order = existing.rows[0];
    const userId = order.userId || order["userId"];
    const orderNumber = order.orderNumber || order["orderNumber"];

    // Update status menjadi PROCESSING (Sedang Dikemas)
    await pool.query(
      `UPDATE orders.orders 
       SET "orderStatus" = 'PROCESSING', "paymentStatus" = 'PAID', notes = COALESCE($1, notes),
           acted_by_user_id = $2, acted_by_name = $3, acted_by_signature_code = $4, "updatedAt" = NOW()
       WHERE id = $5`,
      [notes || 'Disetujui oleh Toko BC HNI Bukittinggi', sig.userId, sig.signerName, sig.verificationCode, orderId]
    );

    paymentEvents.emitOrderUpdated({
      orderId,
      slug: order.slug,
      orderNumber,
      paymentStatus: 'PAID',
      orderStatus: 'PROCESSING',
      updatedAt: new Date().toISOString(),
    });

    await logStoreActivity({
      actorId: sig.userId,
      actorEmail: sig.signerName,
      actorRole: 'STAFF',
      action: 'APPROVE_ORDER',
      module: 'ORDERS',
      entityId: orderId,
      summary: `Menyetujui pesanan ${orderNumber} menjadi PROCESSING`,
    });

    if (userId) {
      await notificationsService.createNotification({
        userId,
        title: 'Pesanan Sedang Dikemas',
        message: `Pesanan #${orderNumber} telah disetujui toko dan saat ini sedang dikemas di gudang BC 3 Bukittinggi.`,
        category: 'ORDER_STATUS',
        referenceId: orderId,
      });
    }

    return { success: true, message: 'Pesanan disetujui dan dialihkan ke status Sedang Dikemas' };
  },

  async shipOrder(orderId: string, payload: { courierName: string; trackingNumber: string; notes?: string }, actor?: { userId?: string; fullName?: string }, lang: SupportedLanguage = 'id') {
    const sig = await this.requireEmployeeSignature(actor, lang);
    const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
    if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
    const order = existing.rows[0];
    const userId = order.userId || order["userId"];
    const orderNumber = order.orderNumber || order["orderNumber"];
    const courier = payload.courierName || order.shippingCourier || 'Kurir Toko';
    const resiInfo = payload.trackingNumber ? ` Nomor Resi: ${payload.trackingNumber}.` : '';

    await pool.query(
      `UPDATE orders.orders 
       SET "orderStatus" = 'SHIPPED', 
           "shippingCourier" = $1, 
           "trackingNumber" = $2, 
           notes = COALESCE($3, notes),
           acted_by_user_id = $4,
           acted_by_name = $5,
           acted_by_signature_code = $6,
           "updatedAt" = NOW()
       WHERE id = $7`,
      [payload.courierName, payload.trackingNumber, payload.notes || null, sig.userId, sig.signerName, sig.verificationCode, orderId]
    );

    paymentEvents.emitOrderUpdated({
      orderId,
      slug: order.slug,
      orderNumber,
      paymentStatus: order.paymentStatus,
      orderStatus: 'SHIPPED',
      updatedAt: new Date().toISOString(),
    });

    await logStoreActivity({
      actorId: sig.userId,
      actorEmail: sig.signerName,
      actorRole: 'STAFF',
      action: 'SHIP_ORDER',
      module: 'ORDERS',
      entityId: orderId,
      summary: `Mengirim pesanan ${orderNumber} via ${courier} (Resi: ${payload.trackingNumber || '-'})`,
    });

    if (userId) {
      await notificationsService.createNotification({
        userId,
        title: 'Pesanan Dalam Pengiriman',
        message: `Pesanan #${orderNumber} sedang dalam perjalanan via ${courier}.${resiInfo} Paket sedang menuju ke alamat tujuan Anda.`,
        category: 'ORDER_STATUS',
        referenceId: orderId,
      });
    }

    return { success: true, message: 'Pesanan dikirimkan dengan resi ' + payload.trackingNumber };
  },

  async confirmDelivered(orderId: string) {
    const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
    if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
    const order = existing.rows[0];
    const userId = order.userId || order["userId"];
    const orderNumber = order.orderNumber || order["orderNumber"];

    await pool.query(
      `UPDATE orders.orders 
       SET "orderStatus" = 'DELIVERED', "updatedAt" = NOW()
       WHERE id = $1`,
      [orderId]
    );

    if (userId) {
      await notificationsService.createNotification({
        userId,
        title: 'Pesanan Telah Tiba / Diterima',
        message: `Pesanan #${orderNumber} telah terkonfirmasi diterima oleh penerima. Harap periksa barang Anda dan pastikan kemasan dalam kondisi baik.`,
        category: 'ORDER_STATUS',
        referenceId: orderId,
      });
    }

    return { success: true, message: 'Konfirmasi barang telah diterima oleh pembeli' };
  },

  async completeOrder(
    orderId: string,
    actor?: { userId?: string; fullName?: string },
    lang: SupportedLanguage = 'id',
    cashReceived?: number
  ) {
    const sig = await this.requireEmployeeSignature(actor, lang);
    const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
    if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
    const order = existing.rows[0];
    const userId = order.userId || order["userId"];
    const orderNumber = order.orderNumber || order["orderNumber"];

    const resolvedCash =
      cashReceived !== undefined && Number.isFinite(Number(cashReceived))
        ? Number(cashReceived)
        : null;

    await pool.query(
      `UPDATE orders.orders 
       SET "orderStatus" = 'COMPLETED',
           "paymentStatus" = CASE WHEN "paymentStatus" = 'UNPAID' THEN 'PAID' ELSE "paymentStatus" END,
           cash_received = COALESCE($5, cash_received),
           acted_by_user_id = $1,
           acted_by_name = $2,
           acted_by_signature_code = $3,
           "updatedAt" = NOW()
       WHERE id = $4`,
      [sig.userId, sig.signerName, sig.verificationCode, orderId, resolvedCash]
    );

    paymentEvents.emitOrderUpdated({
      orderId,
      slug: order.slug,
      orderNumber,
      paymentStatus: order.paymentStatus === 'UNPAID' ? 'PAID' : order.paymentStatus,
      orderStatus: 'COMPLETED',
      updatedAt: new Date().toISOString(),
    });

    await logStoreActivity({
      actorId: sig.userId,
      actorEmail: sig.signerName,
      actorRole: 'STAFF',
      action: 'COMPLETE_ORDER',
      module: 'ORDERS',
      entityId: orderId,
      summary: `Menyelesaikan pesanan ${orderNumber}${resolvedCash !== null ? ` (Uang tunai diterima: Rp ${resolvedCash.toLocaleString('id-ID')})` : ''}`,
      metadata: resolvedCash !== null ? { cashReceived: resolvedCash } : null,
    });

    if (userId) {
      await notificationsService.createNotification({
        userId,
        title: 'Pesanan Selesai',
        message: `Pesanan #${orderNumber} telah selesai. Poin TP dan riwayat transaksi Anda telah diperbarui. Terima kasih telah berbelanja di BC HNI 3 Bukittinggi!`,
        category: 'ORDER_STATUS',
        referenceId: orderId,
      });
    }

    return { success: true, message: 'Pesanan diselesaikan' };
  },

  async createPosOrder(payload: {
    customerName: string;
    customerPhone?: string;
    customerType?: 'KONSUMEN' | 'AGEN' | 'STOCKIST';
    hniMemberId?: string;
    paymentMethod: string;
    cashReceived?: number;
    changeAmount?: number;
    discountAmount?: number;
    voucherCode?: string;
    notes?: string;
    items: Array<{
      productId: string;
      sku?: string;
      productName: string;
      quantity: number;
      price: number;
      points?: number;
    }>;
  }) {
    if (!payload.items || payload.items.length === 0) {
      throw new AppError('Keranjang kasir tidak boleh kosong', 400);
    }

    const orderId = `ord_pos_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `POS-${datePart}-${randSuffix}`;

    const subtotal = payload.items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
    const discountAmount = Math.max(0, Number(payload.discountAmount || 0));
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const totalPoints = payload.items.reduce(
      (sum, item) => sum + Number(item.points || 0) * Number(item.quantity || 1),
      0
    );
    const isXenditChannel =
      payload.paymentMethod === 'QRIS' ||
      payload.paymentMethod.startsWith('VA_') ||
      payload.paymentMethod.startsWith('EWALLET_');
    const isKasbon =
      payload.paymentMethod === 'KASBON' || payload.paymentMethod === 'B2B_CREDIT';

    const paymentStatus = isKasbon
      ? 'ON_CREDIT'
      : isXenditChannel
        ? 'UNPAID'
        : 'PAID';
    const initialOrderStatus = isXenditChannel ? 'PROCESSING' : 'COMPLETED';

    let qrString: string | undefined;
    let vaNumber: string | undefined;
    let bankCode: string | undefined = payload.paymentMethod.startsWith('VA_')
      ? payload.paymentMethod.replace('VA_', '')
      : undefined;
    let invoiceUrl: string | undefined;
    let invoiceId: string | undefined;

    if (isXenditChannel) {
      if (payload.paymentMethod === 'QRIS') {
        try {
          const qrRes = await xenditService.createQRIS({
            externalId: `qr-${orderNumber}`,
            amount: totalAmount,
          });
          qrString = qrRes.qrString;
        } catch {
          // Fallback deterministic QRIS string
        }
        if (!qrString) {
          qrString = `00020101021226600016ID.CO.TIJARAH.WWW01189360000201112233440215${orderNumber}520454995303360540${totalAmount}5802ID5919BC HNI BUKITTINGGI6011BUKITTINGGI61052611162230119${orderNumber}6304ABCD`;
        }
      } else if (payload.paymentMethod.startsWith('VA_') && bankCode) {
        try {
          const vaRes = await xenditService.createFixedVA({
            externalId: `va-${orderNumber}`,
            bankCode,
            name: payload.customerName || 'Pelanggan Tijarah',
            amount: totalAmount,
          });
          vaNumber = vaRes.accountNumber;
        } catch {
          // Fallback deterministic VA number
        }
        if (!vaNumber) {
          const bankPrefixes: Record<string, string> = {
            BCA: '38165',
            BRI: '88812',
            MANDIRI: '89022',
            BNI: '98814',
            BSI: '70014',
            PERMATA: '85281',
            CIMB: '59190',
            MUAMALAT: '84001',
          };
          const prefix = bankPrefixes[bankCode] || '88800';
          const numPart = (orderNumber.replace(/\D/g, '') + Date.now().toString()).slice(-10);
          vaNumber = `${prefix}${numPart}`;
        }
      }

      try {
        const specificMethods =
          payload.paymentMethod === 'QRIS'
            ? ['QRIS']
            : payload.paymentMethod.startsWith('VA_')
              ? [payload.paymentMethod.replace('VA_', '')]
              : payload.paymentMethod.startsWith('EWALLET_')
                ? [payload.paymentMethod.replace('EWALLET_', '')]
                : undefined;

        const inv = await xenditService.createInvoice({
          externalId: orderNumber,
          amount: totalAmount,
          description: `Kasir POS Tijarah #${orderNumber}`,
          customerEmail: (payload as any).customerEmail || 'kasir@tijarah.co',
          customerName: payload.customerName || 'Pelanggan Toko',
          customerPhone: payload.customerPhone || undefined,
          items: payload.items.map((it) => ({
            name: it.productName,
            price: it.price,
            quantity: it.quantity,
          })),
          paymentMethods: specificMethods,
        });
        invoiceId = inv.invoiceId;
        invoiceUrl = inv.invoiceUrl;
      } catch {
        // Ignore invoice fallback error
      }
    }

    const noteParts = [
      'Transaksi Kasir Walk-In (POS)',
      payload.customerType ? `Tipe: ${payload.customerType}` : null,
      payload.hniMemberId ? `ID HNI: ${payload.hniMemberId}` : null,
      payload.voucherCode ? `Voucher: ${payload.voucherCode}` : null,
      vaNumber ? `VA ${bankCode}: ${vaNumber}` : null,
      payload.notes || null,
    ].filter(Boolean);
    const combinedNotes = noteParts.join(' | ');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO orders.orders (
          id, "orderNumber", "recipientName", "recipientPhone",
          "orderStatus", "paymentStatus", "paymentMethod",
          subtotal, "shippingCost", "discountAmount", "totalAmount", "totalTpPoints",
          "shippingAddressText", "shippingCourier", "shippingType", notes, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4,
          $12, $5, $6,
          $7, 0, $8, $9, $10,
          'Transaksi Langsung di Meja Kasir BC 3', 'Walk-In Kasir POS', 'PICKUP', $11, NOW(), NOW()
        )`,
        [
          orderId,
          orderNumber,
          payload.customerName || 'Pelanggan Toko',
          payload.customerPhone || '-',
          paymentStatus,
          payload.paymentMethod || 'CASH',
          subtotal,
          discountAmount,
          totalAmount,
          totalPoints,
          combinedNotes,
          initialOrderStatus,
        ]
      );

      for (const item of payload.items) {
        const itemId = `oit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const qty = Math.max(1, Number(item.quantity || 1));
        const unitPrice = Number(item.price || 0);
        const itemPoints = Number(item.points || 0);

        await client.query(
          `INSERT INTO orders.order_items (
            id, "orderId", "productId", "productName", sku, qty, "unitPrice", "totalPrice", "tpPoints"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            itemId,
            orderId,
            item.productId || null,
            item.productName,
            item.sku || '',
            qty,
            unitPrice,
            qty * unitPrice,
            itemPoints * qty,
          ]
        );

        if (item.productId) {
          await client.query(
            `UPDATE products.products
             SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
                 physical_stock = GREATEST(0, COALESCE(physical_stock, stock, 0) - $1),
                 point_stock = CASE WHEN COALESCE(is_fraction, FALSE) = FALSE THEN GREATEST(0, COALESCE(point_stock, stock, 0) - $1) ELSE point_stock END,
                 "updatedAt" = NOW()
             WHERE id = $2`,
            [qty, item.productId]
          );
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return {
      id: orderId,
      orderNumber,
      customerName: payload.customerName || 'Pelanggan Toko',
      customerPhone: payload.customerPhone || '-',
      customerType: payload.customerType || 'KONSUMEN',
      totalAmount,
      totalPoints,
      status: initialOrderStatus,
      paymentMethod: payload.paymentMethod || 'CASH',
      paymentStatus,
      shippingMethod: 'Walk-In Kasir POS',
      fulfillmentType: 'PICKUP',
      notes: combinedNotes,
      qrString,
      vaNumber,
      bankCode,
      invoiceUrl,
      invoiceId,
      createdAt: new Date().toISOString(),
      items: payload.items.map((it, idx) => ({
        id: `oit_${idx}_${Date.now()}`,
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        price: it.price,
        points: (it.points || 0) * it.quantity,
      })),
    };
  },

  async setReadyForPickup(orderId: string, actor?: { userId?: string; fullName?: string }, lang: SupportedLanguage = 'id') {
    const sig = await this.requireEmployeeSignature(actor, lang);
    const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
    if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
    const order = existing.rows[0];
    const userId = order.userId || order["userId"];
    const orderNumber = order.orderNumber || order["orderNumber"];

    await pool.query(
      `UPDATE orders.orders 
       SET "orderStatus" = 'READY_FOR_PICKUP',
           acted_by_user_id = $1,
           acted_by_name = $2,
           acted_by_signature_code = $3,
           "updatedAt" = NOW()
       WHERE id = $4`,
      [sig.userId, sig.signerName, sig.verificationCode, orderId]
    );

    paymentEvents.emitOrderUpdated({
      orderId,
      slug: order.slug,
      orderNumber,
      paymentStatus: order.paymentStatus,
      orderStatus: 'READY_FOR_PICKUP',
      updatedAt: new Date().toISOString(),
    });

    await logStoreActivity({
      actorId: sig.userId,
      actorEmail: sig.signerName,
      actorRole: 'STAFF',
      action: 'READY_FOR_PICKUP',
      module: 'ORDERS',
      entityId: orderId,
      summary: `Menandai pesanan ${orderNumber} siap diambil di outlet`,
    });

    if (userId) {
      await notificationsService.createNotification({
        userId,
        title: 'Pesanan Siap Diambil di Outlet',
        message: `Pesanan #${orderNumber} telah selesai dikemas dan siap diambil di gerai BC HNI 3 Bukittinggi (Jl. Sudirman No. 45). Silakan tunjukkan nomor pesanan kepada petugas kasir.`,
        category: 'ORDER_STATUS',
        referenceId: orderId,
      });
    }

    return { success: true, message: 'Pesanan siap diambil oleh pembeli' };
  },

  async rejectOrder(orderId: string, reason: string, actor?: { userId?: string; fullName?: string }, lang: SupportedLanguage = 'id') {
    const sig = await this.requireEmployeeSignature(actor, lang);
    const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
    if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
    const order = existing.rows[0];
    const userId = order.userId || order["userId"];
    const orderNumber = order.orderNumber || order["orderNumber"];
    const wasPaid = String(order.paymentStatus || '').toUpperCase() === 'PAID';
    const isCreditLimit = String(order.paymentMethod || '').toUpperCase() === 'CREDIT_LIMIT';
    const nextPaymentStatus = wasPaid ? (isCreditLimit ? 'REFUNDED' : 'REFUND_PENDING') : order.paymentStatus;

    await pool.query(
      `UPDATE orders.orders 
       SET "orderStatus" = 'REJECTED', "rejectionReason" = $1, "paymentStatus" = $2,
           acted_by_user_id = $3, acted_by_name = $4, acted_by_signature_code = $5, "updatedAt" = NOW()
       WHERE id = $6`,
      [reason, nextPaymentStatus, sig.userId, sig.signerName, sig.verificationCode, orderId]
    );

    // Pulihkan stok produk untuk pesanan yang ditolak
    const itemsRes = await pool.query(
      `SELECT "productId", qty FROM orders.order_items WHERE "orderId" = $1`,
      [orderId]
    );
    for (const item of itemsRes.rows) {
      if (item.productId && Number(item.qty) > 0) {
        await pool.query(
          `UPDATE products.products SET stock = COALESCE(stock, 0) + $1 WHERE id = $2`,
          [Number(item.qty), item.productId]
        );
      }
    }

    // Jika pembayaran pakai plafon kasbon, pulihkan saldo kasbon
    if (isCreditLimit && userId && Number(order.totalAmount || 0) > 0) {
      await pool.query(
        `UPDATE users.credit_accounts
         SET current_balance = GREATEST(0, current_balance - $1), updated_at = NOW()
         WHERE user_id = $2`,
        [Number(order.totalAmount), userId]
      );
    }

    paymentEvents.emitOrderUpdated({
      orderId,
      slug: order.slug,
      orderNumber,
      paymentStatus: nextPaymentStatus,
      orderStatus: 'REJECTED',
      updatedAt: new Date().toISOString(),
    });

    await logStoreActivity({
      actorId: sig.userId,
      actorEmail: sig.signerName,
      actorRole: 'STAFF',
      action: 'REJECT_ORDER',
      module: 'ORDERS',
      entityId: orderId,
      summary: `Menolak pesanan ${orderNumber}${wasPaid ? ' (Dana masuk antrean refund)' : ''}: ${reason || '-'}`,
    });

    if (userId) {
      await notificationsService.createNotification({
        userId,
        title: 'Pesanan Ditolak Toko',
        message: wasPaid && !isCreditLimit
          ? `Mohon maaf, pesanan #${orderNumber} ditolak: ${reason || 'Kendala stok/operasional'}. Pesanan sudah dibayar akan diproses pengembalian dananya (REFUND_PENDING).`
          : `Mohon maaf, pesanan #${orderNumber} tidak dapat diproses: ${reason || 'Kendala ketersediaan stok produk atau operasional toko'}. Saldo plafon kasbon (jika ada) telah dipulihkan.`,
        category: 'ORDER_STATUS',
        referenceId: orderId,
      });
    }

    return { success: true, message: wasPaid && !isCreditLimit ? 'Pesanan ditolak & masuk antrean refund dana' : 'Pesanan ditolak' };
  },

  async confirmOrderRefund(
    orderId: string,
    payload: { refundProofUrl?: string; adminNotes?: string },
    actor?: { userId?: string; fullName?: string },
    lang: SupportedLanguage = 'id'
  ) {
    const sig = await this.requireEmployeeSignature(actor, lang);
    const existing = await pool.query('SELECT * FROM orders.orders WHERE id = $1', [orderId]);
    if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
    const order = existing.rows[0];
    const userId = order.userId || order['userId'];
    const orderNumber = order.orderNumber || order['orderNumber'];

    await pool.query(
      `UPDATE orders.orders
       SET "paymentStatus" = 'REFUNDED',
           refund_proof_url = COALESCE($1, refund_proof_url),
           acted_by_user_id = $2,
           acted_by_name = $3,
           acted_by_signature_code = $4,
           "updatedAt" = NOW()
       WHERE id = $5`,
      [payload.refundProofUrl?.trim() || null, sig.userId, sig.signerName, sig.verificationCode, orderId]
    );

    paymentEvents.emitOrderUpdated({
      orderId,
      slug: order.slug,
      orderNumber,
      paymentStatus: 'REFUNDED',
      orderStatus: order.orderStatus,
      updatedAt: new Date().toISOString(),
    });

    await logStoreActivity({
      actorId: sig.userId,
      actorEmail: sig.signerName,
      actorRole: 'STAFF',
      action: 'CONFIRM_REFUND',
      module: 'ORDERS',
      entityId: orderId,
      summary: `Mengonfirmasi pengembalian dana pesanan ${orderNumber}${payload.adminNotes ? `: ${payload.adminNotes}` : ''}`,
    });

    if (userId) {
      await notificationsService.createNotification({
        userId,
        title: 'Pengembalian Dana Selesai',
        message: `Dana untuk pesanan #${orderNumber} telah dikembalikan oleh toko.${payload.adminNotes ? ` Catatan: ${payload.adminNotes}` : ''}`,
        category: 'ORDER_STATUS',
        referenceId: orderId,
      });
    }

    return { success: true, message: 'Pengembalian dana berhasil dikonfirmasi (REFUNDED).' };
  },

  async triggerPrintOrder(
    orderId: string,
    actor?: { userId?: string; fullName?: string }
  ) {
    const existing = await pool.query('SELECT id, "orderNumber" FROM orders.orders WHERE id = $1', [orderId]);
    if (existing.rows.length === 0) throw new AppError('Pesanan tidak ditemukan', 404);
    const order = existing.rows[0];

    await pool.query(
      `UPDATE orders.orders
       SET print_status = 'PRINTED', printed_at = NOW(), "updatedAt" = NOW()
       WHERE id = $1`,
      [orderId]
    );

    await logStoreActivity({
      actorId: actor?.userId || null,
      actorEmail: actor?.fullName || 'STAFF',
      actorRole: 'STAFF',
      action: 'PRINT_ORDER',
      module: 'ORDERS',
      entityId: orderId,
      summary: `Mencetak resi pesanan ${order.orderNumber}`,
    });

    return { success: true, message: `Resi pesanan ${order.orderNumber} ditandai sudah diprint.`, printStatus: 'PRINTED' };
  },

  // ==========================================
  // 3. INVENTORI & STOK
  // ==========================================
  async ensureProductEceranColumns() {
    try {
      await pool.query(`
        ALTER TABLE products.products ADD COLUMN IF NOT EXISTS is_separable BOOLEAN DEFAULT FALSE;
        ALTER TABLE products.products ADD COLUMN IF NOT EXISTS default_breakdown_qty INT DEFAULT NULL;
        ALTER TABLE products.products ADD COLUMN IF NOT EXISTS is_fraction BOOLEAN DEFAULT FALSE;
        ALTER TABLE products.products ADD COLUMN IF NOT EXISTS parent_product_id VARCHAR(64) NULL;
        ALTER TABLE products.products ADD COLUMN IF NOT EXISTS allow_agent_price BOOLEAN DEFAULT TRUE;
        ALTER TABLE products.products ADD COLUMN IF NOT EXISTS reward_points INT DEFAULT 0;
        ALTER TABLE products.products ADD COLUMN IF NOT EXISTS physical_stock INT DEFAULT 0;
        ALTER TABLE products.products ADD COLUMN IF NOT EXISTS point_stock INT DEFAULT 0;

        CREATE TABLE IF NOT EXISTS store.stock_point_reconciliations (
          id VARCHAR(64) PRIMARY KEY,
          product_id VARCHAR(64) NOT NULL,
          physical_stock_before INT NOT NULL,
          point_stock_before INT NOT NULL,
          adjusted_point INT NOT NULL,
          reason VARCHAR(64) NOT NULL DEFAULT 'MANUAL_ADJUSTMENT',
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } catch (e: any) {
      console.warn('[storeService] ensureProductEceranColumns notice:', e?.message);
    }
  },

  async getInventory() {
    await this.ensureProductEceranColumns();

    const res = await pool.query(`
      SELECT 
        id,
        sku,
        name,
        category,
        unit,
        "normalPrice" as price,
        "agentPrice",
        stock,
        "tpPoints" as points,
        description,
        "imageUrl",
        "isActive",
        is_separable,
        default_breakdown_qty,
        is_fraction,
        parent_product_id,
        allow_agent_price,
        reward_points,
        COALESCE(stock, 0) as physical_stock,
        COALESCE(point_stock, stock, 0) as point_stock,
        "createdAt",
        "updatedAt"
      FROM products.products
      WHERE COALESCE("isActive", true) = true
      ORDER BY "createdAt" DESC
    `);

    return res.rows.map((row) => {
      const currentStock = Number(row.stock) || 0;
      const ptStock = row.point_stock !== null && row.point_stock !== undefined ? Number(row.point_stock) : currentStock;
      return {
        id: row.id,
        sku: row.sku || `SKU-${row.id.slice(0, 6)}`,
        name: row.name,
        category: row.category || 'Herbal',
        unit: row.unit || (row.is_fraction ? 'Sachet' : 'Botol'),
        stock: Number(row.stock) || 0,
        safetyStock: 10,
        allocatedStock: 2,
        price: Number(row.price),
        agentPrice: Number(row.agentPrice) || Number(row.price) * 0.85,
        points: Number(row.points) || 10,
        status: Number(row.stock) <= 0 ? 'OUT_OF_STOCK' : Number(row.stock) <= 10 ? 'LOW_STOCK' : 'AVAILABLE',
        description: row.description,
        imageUrl: row.imageUrl || null,
        isPublished: row.isActive,
        isSeparable: Boolean(row.is_separable),
        defaultBreakdownQty: row.default_breakdown_qty ? Number(row.default_breakdown_qty) : null,
        isFraction: Boolean(row.is_fraction),
        parentProductId: row.parent_product_id || null,
        allowAgentPrice: row.allow_agent_price !== false,
        rewardPoints: Number(row.reward_points) || 0,
        physicalStock: currentStock,
        pointStock: ptStock,
        mismatchDiff: ptStock - currentStock,
        hasMismatch: ptStock !== currentStock,
      };
    });
  },

  async createInventory(payload: any) {
    await this.ensureProductEceranColumns();
    const id = `PRD-${Date.now().toString().slice(-6)}`;
    const isSeparable = Boolean(payload.isSeparable);
    const defaultBreakdownQty = payload.defaultBreakdownQty ? Number(payload.defaultBreakdownQty) : 20;
    const autoBreakdownOneStock = Boolean(payload.autoBreakdownOneStock);
    const rawStock = Number(payload.stock || 0);
    if (rawStock < 0 || Number(payload.price || 0) < 0 || Number(payload.agentPrice || 0) < 0) {
      throw new AppError('Stok dan harga produk tidak boleh bernilai negatif (minus).', 400);
    }

    // Validasi pencegahan stok induk minus jika trigger ecerkan 1 stok aktif
    if (isSeparable && autoBreakdownOneStock && rawStock < 1) {
      throw new AppError('Stok produk induk minimal 1 kemasan agar dapat langsung diecerkan (tidak boleh 0 atau minus).', 400);
    }

    const initialStock = isSeparable && autoBreakdownOneStock ? Math.max(0, rawStock - 1) : rawStock;
    const physicalStock = payload.physicalStock !== undefined
      ? (isSeparable && autoBreakdownOneStock ? Math.max(0, Number(payload.physicalStock) - 1) : Number(payload.physicalStock))
      : initialStock;
    const pointStock = payload.pointStock !== undefined ? Number(payload.pointStock) : rawStock;

    const res = await pool.query(
      `INSERT INTO products.products 
       (id, sku, name, category, unit, "normalPrice", "agentPrice", stock, "tpPoints", description, "imageUrl", "isActive",
        is_separable, default_breakdown_qty, is_fraction, parent_product_id, allow_agent_price, reward_points, physical_stock, point_stock,
        "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
       RETURNING *`,
      [
        id,
        payload.sku,
        payload.name,
        payload.category || 'Perawatan & Herba',
        payload.unit || 'Pcs',
        payload.price,
        payload.allowAgentPrice === false ? payload.price : (payload.agentPrice || payload.price * 0.85),
        initialStock,
        payload.points || 10,
        payload.description || '',
        payload.imageUrl || null,
        isSeparable,
        isSeparable ? defaultBreakdownQty : null,
        Boolean(payload.isFraction),
        payload.parentProductId || null,
        payload.allowAgentPrice !== false,
        Number(payload.rewardPoints || 0),
        physicalStock,
        pointStock,
      ]
    );

    await logStoreActivity({
      action: 'CREATE_INVENTORY',
      module: 'INVENTORY',
      entityId: id,
      summary: `Menambahkan produk baru: ${payload.name} (${payload.sku})`,
    });

    const parentProduct = res.rows[0];

    // Jika trigger auto breakdown aktif, langsung buat produk pecahan
    if (isSeparable && autoBreakdownOneStock) {
      const fractionId = `PRD-F-${Date.now().toString().slice(-6)}`;
      const fractionSku = `${parentProduct.sku || 'SKU'}-ECH-${Math.floor(Math.random() * 899 + 100)}`;
      const sachetPrice = Math.round(Number(payload.price || 0) / defaultBreakdownQty);
      const fractionName = `${parentProduct.name} - Eceran/Sachet`;

      await pool.query(
        `INSERT INTO products.products 
         (id, sku, name, category, "normalPrice", "agentPrice", stock, "tpPoints", description, "isActive",
          is_separable, default_breakdown_qty, is_fraction, parent_product_id, allow_agent_price, reward_points, physical_stock, point_stock,
          "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $5, $6, 0, $7, true, false, NULL, true, $8, false, 0, $6, 0, NOW(), NOW())`,
        [
          fractionId,
          fractionSku,
          fractionName,
          parentProduct.category || 'Herbal',
          sachetPrice,
          defaultBreakdownQty,
          `Pecahan eceran resmi dari ${parentProduct.name}. Dijual per sachet tanpa poin agen.`,
          parentProduct.id,
        ]
      );
    }

    return parentProduct;
  },

  async updateInventory(id: string, payload: any) {
    await this.ensureProductEceranColumns();
    if (
      (payload.stock !== undefined && Number(payload.stock) < 0) ||
      (payload.price !== undefined && Number(payload.price) < 0) ||
      (payload.agentPrice !== undefined && Number(payload.agentPrice) < 0)
    ) {
      throw new AppError('Stok dan harga produk tidak boleh bernilai negatif (minus).', 400);
    }
    const isSeparable = payload.isSeparable !== undefined ? Boolean(payload.isSeparable) : null;
    const defaultBreakdownQty = payload.defaultBreakdownQty !== undefined ? (payload.defaultBreakdownQty ? Number(payload.defaultBreakdownQty) : null) : null;

    const res = await pool.query(
      `UPDATE products.products
       SET name = COALESCE($1, name),
           sku = COALESCE($2, sku),
           category = COALESCE($3, category),
           unit = COALESCE($17, unit),
           "normalPrice" = COALESCE($4, "normalPrice"),
           "agentPrice" = COALESCE($5, "agentPrice"),
           stock = COALESCE($6, stock),
           "tpPoints" = COALESCE($7, "tpPoints"),
           description = COALESCE($8, description),
           is_separable = CASE WHEN $9::boolean IS NOT NULL THEN $9::boolean ELSE is_separable END,
           default_breakdown_qty = CASE WHEN $10::integer IS NOT NULL THEN $10::integer ELSE default_breakdown_qty END,
           allow_agent_price = CASE WHEN $11::boolean IS NOT NULL THEN $11::boolean ELSE allow_agent_price END,
           reward_points = COALESCE($12, reward_points),
           physical_stock = COALESCE($13, physical_stock),
           point_stock = COALESCE($14, point_stock),
           "imageUrl" = COALESCE($15, "imageUrl"),
           "updatedAt" = NOW()
       WHERE id = $16
       RETURNING *`,
      [
        payload.name,
        payload.sku,
        payload.category,
        payload.price,
        payload.allowAgentPrice === false ? payload.price : payload.agentPrice,
        payload.stock,
        payload.points,
        payload.description,
        isSeparable,
        defaultBreakdownQty,
        payload.allowAgentPrice !== undefined ? Boolean(payload.allowAgentPrice) : null,
        payload.rewardPoints !== undefined ? Number(payload.rewardPoints) : null,
        payload.physicalStock !== undefined ? Number(payload.physicalStock) : null,
        payload.pointStock !== undefined ? Number(payload.pointStock) : null,
        payload.imageUrl !== undefined ? payload.imageUrl : null,
        id,
        payload.unit || null,
      ]
    );
    await logStoreActivity({
      action: 'UPDATE_INVENTORY',
      module: 'INVENTORY',
      entityId: id,
      summary: `Memperbarui data produk ${payload.name || id}`,
    });
    return res.rows[0];
  },

  /**
   * Pecah produk induk menjadi produk eceran / sachet
   */
  async breakdownProduct(payload: {
    parentProductId: string;
    pouchQtyToBreak?: number;
    breakdownType: 'SINGLE' | 'MIX';
    singleConfig?: {
      name?: string;
      sachetRatio: number;
      sachetPrice?: number;
    };
    mixItems?: Array<{
      name: string;
      qty: number;
      price: number;
    }>;
  }) {
    await this.ensureProductEceranColumns();

    // 1. Ambil data produk induk
    const parentRes = await pool.query(
      `SELECT * FROM products.products WHERE id = $1`,
      [payload.parentProductId]
    );
    if (parentRes.rows.length === 0) {
      throw new AppError('Produk induk tidak ditemukan', 404);
    }
    const parent = parentRes.rows[0];
    const pouchesToBreak = Number(payload.pouchQtyToBreak || 1);

    if (Number(parent.stock) < pouchesToBreak) {
      throw new AppError(`Stok produk induk tidak mencukupi (Tersedia: ${parent.stock}, diminta pecah: ${pouchesToBreak})`, 400);
    }

    const createdItems = [];

    if (payload.breakdownType === 'SINGLE') {
      const ratio = Number(payload.singleConfig?.sachetRatio || parent.default_breakdown_qty || 20);
      if (ratio <= 1) {
        throw new AppError('Rasio sachet per pouch harus lebih besar dari 1', 400);
      }

      const defaultName = payload.singleConfig?.name || `${parent.name} - Eceran/Sachet`;
      const normalPriceParent = Number(parent.normalPrice || 0);
      const defaultSachetPrice = payload.singleConfig?.sachetPrice || Math.round(normalPriceParent / ratio);
      const sachetStockToAdd = pouchesToBreak * ratio;

      // Cek apakah produk pecahan single untuk induk ini sudah ada
      const existingFraction = await pool.query(
        `SELECT id, stock, physical_stock, point_stock FROM products.products WHERE parent_product_id = $1 AND is_fraction = true LIMIT 1`,
        [parent.id]
      );

      if (existingFraction.rows.length > 0) {
        const frac = existingFraction.rows[0];
        const updated = await pool.query(
          `UPDATE products.products 
           SET stock = stock + $1,
               physical_stock = COALESCE(physical_stock, 0) + $1,
               "normalPrice" = COALESCE($2, "normalPrice"),
               "agentPrice" = COALESCE($2, "agentPrice"),
               "updatedAt" = NOW()
           WHERE id = $3
           RETURNING *`,
          [sachetStockToAdd, defaultSachetPrice, frac.id]
        );
        createdItems.push(updated.rows[0]);
      } else {
        const fractionId = `PRD-F-${Date.now().toString().slice(-6)}`;
        const fractionSku = `${parent.sku || 'SKU'}-ECH-${Math.floor(Math.random() * 899 + 100)}`;
        const inserted = await pool.query(
          `INSERT INTO products.products 
           (id, sku, name, category, "normalPrice", "agentPrice", stock, "tpPoints", description, "isActive",
            is_separable, default_breakdown_qty, is_fraction, parent_product_id, allow_agent_price, reward_points, physical_stock, point_stock,
            "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $5, $6, 0, $7, true, false, NULL, true, $8, false, 0, $6, 0, NOW(), NOW())
           RETURNING *`,
          [
            fractionId,
            fractionSku,
            defaultName,
            parent.category || 'Herbal',
            defaultSachetPrice,
            sachetStockToAdd,
            `Pecahan eceran resmi dari ${parent.name}. Dijual per sachet tanpa poin agen.`,
            parent.id,
          ]
        );
        createdItems.push(inserted.rows[0]);
      }
    } else {
      // Kasus MULTI-ITEM MIX (Contoh: Hibis Mix)
      const mixItems = payload.mixItems || [];
      if (mixItems.length === 0) {
        throw new AppError('Daftar varian hasil pecahan mix tidak boleh kosong', 400);
      }

      const totalMixQty = mixItems.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
      const expectedCapacity = (Number(parent.default_breakdown_qty) || 20) * pouchesToBreak;

      if (totalMixQty !== expectedCapacity) {
        throw new AppError(
          `Total kuantitas eceran tidak cocok dengan kapasitas produk induk. Silakan periksa kembali rincian pecahan. (Total: ${totalMixQty}, Kapasitas Induk: ${expectedCapacity})`,
          400
        );
      }

      for (const item of mixItems) {
        const fractionId = `PRD-MIX-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 89 + 10)}`;
        const fractionSku = `${parent.sku || 'SKU'}-MIX-${Math.floor(Math.random() * 899 + 100)}`;
        const inserted = await pool.query(
          `INSERT INTO products.products 
           (id, sku, name, category, "normalPrice", "agentPrice", stock, "tpPoints", description, "isActive",
            is_separable, default_breakdown_qty, is_fraction, parent_product_id, allow_agent_price, reward_points, physical_stock, point_stock,
            "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $5, $6, 0, $7, true, false, NULL, true, $8, false, 0, $6, 0, NOW(), NOW())
           RETURNING *`,
          [
            fractionId,
            fractionSku,
            item.name,
            parent.category || 'Herbal',
            Number(item.price) || 5000,
            Number(item.qty),
            `Varian eceran hasil pecahan campur dari ${parent.name}.`,
            parent.id,
          ]
        );
        createdItems.push(inserted.rows[0]);
      }
    }

    // Kurangi stok fisik & master produk induk
    await pool.query(
      `UPDATE products.products 
       SET stock = GREATEST(0, stock - $1),
           physical_stock = GREATEST(0, COALESCE(physical_stock, stock) - $1),
           "updatedAt" = NOW()
       WHERE id = $2`,
      [pouchesToBreak, parent.id]
    );

    return {
      success: true,
      message: `Berhasil memecah ${pouchesToBreak} pouch ${parent.name} menjadi produk eceran`,
      createdItems,
    };
  },

  /**
   * Rekonsiliasi Poin vs Stok Fisik per Produk
   */
  async reconcileProductPoints(payload: {
    productId: string;
    action: 'SYNC_TO_PHYSICAL' | 'ADJUST_MANUAL';
    targetPoints?: number;
    reason?: string;
    notes?: string;
  }) {
    await this.ensureProductEceranColumns();

    const pRes = await pool.query(
      `SELECT id, name, sku, stock, physical_stock, point_stock FROM products.products WHERE id = $1`,
      [payload.productId]
    );
    if (pRes.rows.length === 0) {
      throw new AppError('Produk tidak ditemukan', 404);
    }
    const product = pRes.rows[0];
    const physicalStock = Number(product.stock ?? 0);
    const pointStockBefore = Number(product.point_stock ?? product.stock ?? 0);

    const targetPoints = payload.action === 'SYNC_TO_PHYSICAL'
      ? physicalStock
      : Number(payload.targetPoints ?? physicalStock);

    // Update point_stock produk
    await pool.query(
      `UPDATE products.products 
       SET point_stock = $1,
           "updatedAt" = NOW()
       WHERE id = $2`,
      [targetPoints, product.id]
    );

    // Catat ke log rekonsiliasi
    const recId = `REC-${Date.now().toString().slice(-8)}`;
    await pool.query(
      `INSERT INTO store.stock_point_reconciliations
       (id, product_id, physical_stock_before, point_stock_before, adjusted_point, reason, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        recId,
        product.id,
        physicalStock,
        pointStockBefore,
        targetPoints,
        payload.reason || 'MANUAL_ADJUSTMENT',
        payload.notes || `Penyesuaian saldo poin dari ${pointStockBefore} menjadi ${targetPoints} (Stok fisik: ${physicalStock})`,
      ]
    );

    return {
      success: true,
      message: `Saldo poin untuk ${product.name} berhasil disesuaikan menjadi ${targetPoints} unit`,
      productId: product.id,
      physicalStock,
      pointStock: targetPoints,
    };
  },

  async deleteInventory(id: string) {
    const existing = await pool.query('SELECT id, name FROM products.products WHERE id = $1 LIMIT 1', [id]);
    if (existing.rows.length === 0) {
      return { id, deleted: true, alreadyRemoved: true };
    }
    const productName = existing.rows[0].name;

    try {
      await pool.query('DELETE FROM products.products WHERE id = $1', [id]);
    } catch {
      // Soft-delete if product is referenced by historical order_items
      await pool.query('UPDATE products.products SET "isActive" = false, stock = 0, "updatedAt" = NOW() WHERE id = $1', [id]);
    }

    await logStoreActivity({
      action: 'DELETE_INVENTORY',
      module: 'INVENTORY',
      entityId: id,
      summary: `Menghapus produk ${productName} (${id})`,
    });
    return { id, deleted: true };
  },

  // ==========================================
  // 4. PERANGKAT POS & PRINTER
  // ==========================================
  async getDevices() {
    const res = await pool.query('SELECT * FROM store.devices ORDER BY created_at ASC');
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      model: r.model,
      paperWidth: r.paper_width,
      connectionType: r.connection_type,
      ipAddress: r.ip_address,
      port: r.port,
      location: r.location || (r.is_default ? 'Kasir Utama' : 'Meja Kasir'),
      status: r.status,
      isDefault: r.is_default,
      lastPing: r.last_ping,
    }));
  },

  async createDevice(payload: any) {
    const id = `DEV-${Date.now().toString().slice(-4)}`;
    const res = await pool.query(
      `INSERT INTO store.devices 
       (id, name, type, model, paper_width, connection_type, ip_address, port, location, status, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        payload.name,
        payload.type,
        payload.model || null,
        payload.paperWidth || '80mm',
        payload.connectionType || (payload.ipAddress ? 'LAN' : 'USB'),
        payload.ipAddress || null,
        payload.port || 9100,
        payload.location || 'Meja Kasir',
        payload.status || 'OFFLINE',
        payload.isDefault || false,
      ]
    );
    return res.rows[0];
  },

  async updateDevice(id: string, payload: any) {
    const res = await pool.query(
      `UPDATE store.devices
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           model = COALESCE($3, model),
           paper_width = COALESCE($4, paper_width),
           connection_type = COALESCE($5, connection_type),
           ip_address = COALESCE($6, ip_address),
           port = COALESCE($7, port),
           location = COALESCE($8, location),
           status = COALESCE($9, status),
           is_default = COALESCE($10, is_default),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        payload.name,
        payload.type,
        payload.model,
        payload.paperWidth,
        payload.connectionType,
        payload.ipAddress,
        payload.port,
        payload.location,
        payload.status,
        payload.isDefault,
        id,
      ]
    );
    if (res.rows.length === 0) throw new AppError('Perangkat tidak ditemukan', 404);
    return res.rows[0];
  },

  async deleteDevice(id: string) {
    const res = await pool.query('DELETE FROM store.devices WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  // ==========================================
  // 4b. METODE PENGIRIMAN (DELIVERY METHODS)
  // ==========================================
  async getDeliveryMethods() {
    // Pastikan kolom destination_area ada (idempotent migration)
    try {
      await pool.query('ALTER TABLE store.delivery_methods ADD COLUMN IF NOT EXISTS destination_area VARCHAR(100)');
    } catch (e) {
      // Abaikan jika sudah ada atau izin terbatas
    }

    // Seed default methods jika tabel masih kosong
    try {
      const countRes = await pool.query('SELECT COUNT(*) FROM store.delivery_methods');
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        await pool.query(`
          INSERT INTO store.delivery_methods (id, name, code, type, verification_flow, description, is_active, estimated_time, base_cost, destination_area)
          VALUES
            ('DM-PICKUP', 'Ambil di Toko (Pickup)', 'STORE_PICKUP', 'STORE_PICKUP', 'CASHIER_HANDOVER', 'Pesanan diambil langsung di outlet toko dan diverifikasi oleh kasir.', true, 'Instan', 0, 'Outlet Toko'),
            ('DM-PASAMAN', 'Travel Bintang Terang (Pasaman)', 'TRV_PASAMAN', 'TRAVEL_EXPEDITION', 'USER_VERIFY_DIRECT', 'Pengiriman travel rute Pasaman via Bintang Terang.', true, '1-2 Hari', 30000, 'Pasaman'),
            ('DM-LUBUKBASUNG', 'Travel BSW (Lubuk Basung)', 'TRV_LUBUK_BASUNG', 'TRAVEL_EXPEDITION', 'USER_VERIFY_DIRECT', 'Pengiriman travel rute Lubuk Basung via BSW.', true, '1-2 Hari', 30000, 'Lubuk Basung'),
            ('DM-GENERAL', 'Pengiriman Ekspedisi General', 'EXP_GENERAL', 'TRAVEL_EXPEDITION', 'USER_VERIFY_DIRECT', 'Pengiriman reguler ke seluruh wilayah tujuan umum.', true, '2-4 Hari', 20000, 'General')
        `);
      }
    } catch (e) {
      // Abaikan jika insert gagal
    }

    const res = await pool.query(
      'SELECT id, name, code, type, verification_flow, description, is_active, estimated_time, base_cost, destination_area, pricing_mode, zone_rates, provider_code, created_at, updated_at FROM store.delivery_methods ORDER BY created_at ASC'
    );
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      type: r.type,
      verificationFlow: r.verification_flow,
      description: r.description,
      isActive: r.is_active,
      estimatedTime: r.estimated_time,
      baseCost: Number(r.base_cost) || 0,
      destinationArea: r.destination_area || '',
      pricingMode: r.pricing_mode || 'FLAT',
      zoneRates: Array.isArray(r.zone_rates) ? r.zone_rates : [],
      providerCode: r.provider_code || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async getDeliveryMethodById(id: string) {
    const res = await pool.query(
      'SELECT id, name, code, type, verification_flow, description, is_active, estimated_time, base_cost, destination_area, pricing_mode, zone_rates, provider_code, created_at, updated_at FROM store.delivery_methods WHERE id = $1',
      [id]
    );
    if (res.rows.length === 0) throw new AppError('Metode pengiriman tidak ditemukan', 404);
    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      code: r.code,
      type: r.type,
      verificationFlow: r.verification_flow,
      description: r.description,
      isActive: r.is_active,
      estimatedTime: r.estimated_time,
      baseCost: Number(r.base_cost) || 0,
      destinationArea: r.destination_area || '',
      pricingMode: r.pricing_mode || 'FLAT',
      zoneRates: Array.isArray(r.zone_rates) ? r.zone_rates : [],
      providerCode: r.provider_code || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async createDeliveryMethod(payload: any) {
    const id = `DM-${Date.now().toString().slice(-6)}`;
    const zoneRatesJson = JSON.stringify(Array.isArray(payload.zoneRates) ? payload.zoneRates : []);
    const res = await pool.query(
      `INSERT INTO store.delivery_methods
       (id, name, code, type, verification_flow, description, is_active, estimated_time, base_cost, destination_area, pricing_mode, zone_rates, provider_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13)
       RETURNING *`,
      [
        id,
        payload.name,
        payload.code,
        payload.type || 'TRAVEL_EXPEDITION',
        payload.verificationFlow || 'USER_VERIFY_DIRECT',
        payload.description || '',
        payload.isActive !== undefined ? payload.isActive : true,
        payload.estimatedTime || '',
        payload.baseCost || 0,
        payload.destinationArea || '',
        payload.pricingMode || 'FLAT',
        zoneRatesJson,
        payload.providerCode || null,
      ]
    );
    return res.rows[0];
  },

  async updateDeliveryMethod(id: string, payload: any) {
    const zoneRatesJson =
      payload.zoneRates !== undefined
        ? JSON.stringify(Array.isArray(payload.zoneRates) ? payload.zoneRates : [])
        : null;
    const res = await pool.query(
      `UPDATE store.delivery_methods
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           type = COALESCE($3, type),
           verification_flow = COALESCE($4, verification_flow),
           description = COALESCE($5, description),
           is_active = COALESCE($6, is_active),
           estimated_time = COALESCE($7, estimated_time),
           base_cost = COALESCE($8, base_cost),
           destination_area = COALESCE($9, destination_area),
           pricing_mode = COALESCE($10, pricing_mode),
           zone_rates = COALESCE($11::jsonb, zone_rates),
           provider_code = COALESCE($12, provider_code),
           updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [
        payload.name,
        payload.code,
        payload.type,
        payload.verificationFlow,
        payload.description,
        payload.isActive,
        payload.estimatedTime,
        payload.baseCost,
        payload.destinationArea,
        payload.pricingMode || null,
        zoneRatesJson,
        payload.providerCode || null,
        id,
      ]
    );
    if (res.rows.length === 0) throw new AppError('Metode pengiriman tidak ditemukan', 404);
    return res.rows[0];
  },

  async deleteDeliveryMethod(id: string) {
    const res = await pool.query('DELETE FROM store.delivery_methods WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async resetDeliveryMethods() {
    try {
      await pool.query('ALTER TABLE store.delivery_methods ADD COLUMN IF NOT EXISTS destination_area VARCHAR(100)');
      await pool.query('DELETE FROM store.delivery_methods');
      await pool.query(`
        INSERT INTO store.delivery_methods (id, name, code, type, verification_flow, description, is_active, estimated_time, base_cost, destination_area)
        VALUES 
          ('DM-PICKUP', 'Ambil di Toko (Pickup Kasir)', 'STORE_PICKUP', 'STORE_PICKUP', 'CASHIER_HANDOVER', 'Pesanan diambil langsung di outlet toko dan diverifikasi oleh kasir melalui QR atau nomor nota.', true, 'Instan', 0, 'Outlet Toko'),
          ('DM-PASAMAN', 'Travel Bintang Terang (Rute Pasaman)', 'TRV_PASAMAN', 'TRAVEL_EXPEDITION', 'USER_VERIFY_DIRECT', 'Pengiriman antar-kota rute Pasaman via armada Travel Bintang Terang. Otomatis terpilih saat alamat tujuan Pasaman.', true, '1-2 Hari', 30000, 'Pasaman'),
          ('DM-LUBUKBASUNG', 'Travel BSW (Rute Lubuk Basung)', 'TRV_LUBUK_BASUNG', 'TRAVEL_EXPEDITION', 'USER_VERIFY_DIRECT', 'Pengiriman antar-kota rute Lubuk Basung via armada Travel BSW. Otomatis terpilih saat alamat tujuan Lubuk Basung.', true, '1-2 Hari', 30000, 'Lubuk Basung'),
          ('DM-GENERAL', 'Pengiriman Travel / Ekspedisi General', 'EXP_GENERAL', 'TRAVEL_EXPEDITION', 'USER_VERIFY_DIRECT', 'Metode default ekspedisi rekanan toko untuk pengiriman ke seluruh kota/wilayah lainnya.', true, '2-3 Hari', 20000, 'General')
      `);
    } catch (e) {
      // Abaikan jika query gagal di DB mock/offline
    }

    const res = await pool.query(
      'SELECT id, name, code, type, verification_flow, description, is_active, estimated_time, base_cost, destination_area, created_at, updated_at FROM store.delivery_methods ORDER BY created_at ASC'
    );
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      type: r.type,
      verificationFlow: r.verification_flow,
      description: r.description,
      isActive: r.is_active,
      estimatedTime: r.estimated_time,
      baseCost: Number(r.base_cost) || 0,
      destinationArea: r.destination_area,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  // ==========================================
  // 5. STAF & AGEN
  // ==========================================
  async getAgents(query: {
    role?: string;
    position?: string;
    status?: string;
    search?: string;
    includePartners?: string;
  } = {}) {
    // Default: Staf Toko hanya staf internal gerai (bukan mitra hasil sync penjualan HSIS)
    const conditions: string[] = [];
    if (query.includePartners !== 'true') {
      conditions.push(`COALESCE(source_channel, 'TIJARAH') <> 'HSIS_SYNC'`);
      conditions.push(`UPPER(COALESCE(role, '')) IN ('OWNER', 'MANAGER', 'ADMIN', 'KASIR', 'GUDANG')`);
    }
    const values: any[] = [];

    if (query.role && query.role !== 'ALL') {
      values.push(query.role.trim().toUpperCase());
      conditions.push(`UPPER(COALESCE(role, '')) = $${values.length}`);
    }

    if (query.position && query.position !== 'ALL') {
      values.push(query.position.trim().toUpperCase());
      conditions.push(`UPPER(COALESCE(rank, '')) = $${values.length}`);
    }

    if (query.status && query.status !== 'ALL') {
      values.push(query.status.trim().toUpperCase());
      conditions.push(`UPPER(COALESCE(status, '')) = $${values.length}`);
    }

    if (query.search && query.search.trim()) {
      values.push(`%${query.search.trim()}%`);
      conditions.push(
        `(name ILIKE $${values.length} OR hni_id ILIKE $${values.length} OR phone ILIKE $${values.length} OR COALESCE(email, '') ILIKE $${values.length})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await pool.query(
      `SELECT * FROM store.agents ${whereClause} ORDER BY created_at ASC`,
      values
    );
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      hniId: r.hni_id,
      phone: r.phone,
      email: r.email,
      rank: r.rank,
      tier: r.tier,
      status: r.status,
      role: r.role,
      lastLogin: r.last_login || '2026-10-27T10:00:00Z',
    }));
  },

  async createAgent(payload: any) {
    const id = `AGT-${Date.now().toString().slice(-4)}`;
    const res = await pool.query(
      `INSERT INTO store.agents 
       (id, name, hni_id, phone, email, rank, tier, status, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8)
       RETURNING *`,
      [
        id,
        payload.name,
        payload.hniId,
        payload.phone,
        payload.email || null,
        payload.rank || 'AB',
        payload.tier || 'BC_3',
        payload.role || 'KASIR',
      ]
    );
    return res.rows[0];
  },

  async updateAgent(id: string, payload: any) {
    const res = await pool.query(
      `UPDATE store.agents
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           rank = COALESCE($4, rank),
           tier = COALESCE($5, tier),
           role = COALESCE($6, role),
           status = COALESCE($7, status),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        payload.name,
        payload.phone,
        payload.email,
        payload.rank,
        payload.tier,
        payload.role,
        payload.status,
        id,
      ]
    );
    return res.rows[0];
  },

  async deleteAgent(id: string) {
    const res = await pool.query('DELETE FROM store.agents WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async setAgentPassword(id: string, newPassword: string) {
    await pool.query(
      'UPDATE store.agents SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPassword, id]
    );
    return { success: true, message: 'Kata sandi agen berhasil diperbarui' };
  },

  /**
   * Poin 1: Sinkronisasi Identitas Diri Sendiri (Owner/Kasir) ke Jaringan Agen Toko
   */
  async syncSelfAgent(userId?: string) {
    let userRow: any = null;

    if (userId) {
      const uRes = await pool.query(
        `SELECT u.id, u."fullName", u."phoneNumber", u.email, u."userType",
                h."hniMemberId", h."hniMemberName", h.rank, h."uplineName"
         FROM core_auth.users u
         LEFT JOIN core_auth.hni_profiles h ON h."userId" = u.id
         WHERE u.id = $1`,
        [userId]
      );
      if (uRes.rows.length > 0) userRow = uRes.rows[0];
    }

    if (!userRow) {
      const fallbackRes = await pool.query(
        `SELECT u.id, u."fullName", u."phoneNumber", u.email, u."userType",
                h."hniMemberId", h."hniMemberName", h.rank, h."uplineName"
         FROM core_auth.users u
         LEFT JOIN core_auth.hni_profiles h ON h."userId" = u.id
         ORDER BY u."createdAt" ASC LIMIT 1`
      );
      if (fallbackRes.rows.length > 0) userRow = fallbackRes.rows[0];
    }

    if (!userRow) {
      throw new AppError('Pengguna toko tidak ditemukan untuk disinkronkan', 404);
    }

    const hniId = userRow.hniMemberId || '01093705';
    const name = userRow.hniMemberName || userRow.fullName || 'Pengelola Gerai BC3';
    const phone = userRow.phoneNumber || '081267890001';
    const email = userRow.email || 'bc3bukittinggi@hni.id';
    const rank = userRow.rank || 'ED';
    const tier = 'BC_3';
    const role = 'OWNER';

    const existingAgent = await pool.query(
      'SELECT * FROM store.agents WHERE hni_id = $1 OR email = $2 OR phone = $3',
      [hniId, email, phone]
    );

    let resultAgent: any;
    if (existingAgent.rows.length > 0) {
      const updateRes = await pool.query(
        `UPDATE store.agents
         SET name = $1, rank = $2, role = $3, status = 'ACTIVE', updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [name, rank, role, existingAgent.rows[0].id]
      );
      resultAgent = updateRes.rows[0];
    } else {
      const agtId = `AGT-ROOT-${Date.now().toString().slice(-4)}`;
      const insertRes = await pool.query(
        `INSERT INTO store.agents 
         (id, name, hni_id, phone, email, rank, tier, status, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8)
         RETURNING *`,
        [agtId, name, hniId, phone, email, rank, tier, role]
      );
      resultAgent = insertRes.rows[0];
    }

    return {
      success: true,
      message: 'Profil Anda berhasil disinkronkan ke dalam Jaringan Agen sebagai Root Node',
      data: {
        id: resultAgent.id,
        name: resultAgent.name,
        hniId: resultAgent.hni_id,
        phone: resultAgent.phone,
        email: resultAgent.email,
        rank: resultAgent.rank,
        tier: resultAgent.tier,
        role: resultAgent.role,
        status: resultAgent.status,
      },
    };
  },

  /**
   * Poin 1: Mengambil Struktur Pohon Jaringan Agen dengan Self-Node
   */
  async getAgentNetwork(userId?: string) {
    try {
      await this.syncSelfAgent(userId);
    } catch {
      // Fallback jika belum login / no user
    }

    const allAgentsRes = await pool.query('SELECT * FROM store.agents ORDER BY COALESCE(last_transaction_at, created_at) DESC');
    const all = allAgentsRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      hniId: r.hni_id,
      phone: r.phone,
      email: r.email,
      rank: r.rank,
      tier: r.tier,
      status: r.status,
      role: r.role,
      sourceChannel: r.source_channel || 'TIJARAH',
      isRegisteredUser: Boolean(r.is_registered_user),
      linkedUserId: r.linked_user_id || null,
      totalOrders: Number(r.total_orders) || 0,
      totalSpent: Number(r.total_spent) || 0,
      totalTpPoints: Number(r.total_tp_points) || 0,
      lastTransactionAt: r.last_transaction_at || null,
      lastLogin: r.last_login || '2026-10-30T10:00:00Z',
    }));

    // Gabungkan juga pembeli yang pernah bertransaksi di Tijarah (orders.orders) jika belum tercatat di store.agents
    try {
      const orderBuyersRes = await pool.query(`
        SELECT
          o."userId" as user_id,
          MAX(COALESCE(u."fullName", o."recipientName")) as buyer_name,
          MAX(u."phoneNumber") as phone,
          MAX(u.email) as email,
          MAX(COALESCE(hp."hniMemberId", o.hsis_member_id)) as hni_id,
          MAX(hp.rank) as rank,
          COUNT(o.id)::int as order_count,
          COALESCE(SUM(o."totalAmount"), 0)::float as total_spent,
          COALESCE(SUM(o."totalTpPoints"), 0)::int as total_tp,
          MAX(o."createdAt") as last_tx
        FROM orders.orders o
        LEFT JOIN core_auth.users u ON u.id = o."userId"
        LEFT JOIN core_auth.hni_profiles hp ON hp."userId" = o."userId"
        WHERE o."orderStatus" NOT IN ('CANCELLED', 'REJECTED')
        GROUP BY o."userId"
      `);

      const knownUserIds = new Set(all.map((a) => a.linkedUserId).filter(Boolean));
      const knownHniIds = new Set(all.map((a) => a.hniId).filter(Boolean));

      for (const b of orderBuyersRes.rows) {
        if (b.user_id === 'WALKIN_HSIS') continue;
        if (knownUserIds.has(b.user_id) || (b.hni_id && knownHniIds.has(b.hni_id))) {
          const matched = all.find((a) => a.linkedUserId === b.user_id || (b.hni_id && a.hniId === b.hni_id));
          if (matched && matched.totalOrders === 0) {
            matched.totalOrders = b.order_count;
            matched.totalSpent = b.total_spent;
            matched.totalTpPoints = b.total_tp;
            matched.lastTransactionAt = b.last_tx;
            matched.isRegisteredUser = true;
          }
          continue;
        }
        all.push({
          id: `ORD-BUYER-${b.user_id}`,
          name: b.buyer_name || 'Pelanggan Tijarah',
          hniId: b.hni_id || '-',
          phone: b.phone || '-',
          email: b.email || null,
          rank: b.rank || 'CUSTOMER',
          tier: b.hni_id ? 'AGEN_BIAYA' : 'RETAIL',
          status: 'ACTIVE',
          role: b.hni_id ? 'AGEN_HNI' : 'PELANGGAN',
          sourceChannel: 'TIJARAH',
          isRegisteredUser: true,
          linkedUserId: b.user_id,
          totalOrders: b.order_count,
          totalSpent: b.total_spent,
          totalTpPoints: b.total_tp,
          lastTransactionAt: b.last_tx,
          lastLogin: b.last_tx,
        });
      }
    } catch {
      // ignore if orders table unavailable
    }

    const rootAgent = all.find((a) => a.role === 'OWNER') || all[0] || null;
    const downlines = all.filter((a) => !rootAgent || a.id !== rootAgent.id);

    return {
      rootAgent,
      downlines,
      totalAgents: all.length,
      activeAgents: all.filter((a) => a.status === 'ACTIVE').length,
      hsisSyncedCount: all.filter((a) => a.sourceChannel === 'HSIS_SYNC' || !a.isRegisteredUser).length,
      registeredCount: all.filter((a) => a.isRegisteredUser).length,
    };
  },

  async importAgentsCsv(
    items: Array<{ hniId: string; name: string; upline?: string; niaga?: string; peringkat?: string }>
  ) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Daftar data CSV agen kosong', 400);
    }

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const raw of items) {
      const hniId = String(raw.hniId || '').trim();
      const name = String(raw.name || '').trim();
      if (!hniId || !name) {
        skippedCount++;
        continue;
      }

      const niaga = String(raw.niaga || 'AB').trim() || 'AB';
      const peringkat = String(raw.peringkat || niaga || 'AB').trim() || 'AB';
      const status = name.toUpperCase().includes('DISABLE') ? 'INACTIVE' : 'ACTIVE';

      const hpRes = await pool.query(
        'SELECT "userId" FROM core_auth.hni_profiles WHERE "hniMemberId" = $1 LIMIT 1',
        [hniId]
      );
      const linkedUserId = hpRes.rows[0]?.userId || null;
      const isRegisteredUser = Boolean(linkedUserId);

      const existing = await pool.query(
        'SELECT id FROM store.agents WHERE hni_id = $1 LIMIT 1',
        [hniId]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE store.agents
           SET name = $1,
               rank = $2,
               tier = $3,
               status = $4,
               linked_user_id = COALESCE(linked_user_id, $5),
               is_registered_user = COALESCE(is_registered_user, false) OR $6
           WHERE id = $7`,
          [name, peringkat, niaga, status, linkedUserId, isRegisteredUser, existing.rows[0].id]
        );
        updatedCount++;
      } else {
        const id = `AGT-CSV-${hniId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
        const phone = String((raw as any).phone || '-').trim() || '-';
        await pool.query(
          `INSERT INTO store.agents
           (id, name, hni_id, phone, rank, tier, status, role, source_channel, is_registered_user, linked_user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'AGEN_HNI', 'CSV_IMPORT', $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             rank = EXCLUDED.rank,
             tier = EXCLUDED.tier,
             status = EXCLUDED.status`,
          [id, name, hniId, phone, peringkat, niaga, status, isRegisteredUser, linkedUserId]
        );
        importedCount++;
      }
    }

    return {
      importedCount,
      updatedCount,
      skippedCount,
      message: `Import CSV selesai: ${importedCount} agen baru ditambahkan, ${updatedCount} diperbarui, ${skippedCount} baris kosong/dilewati.`,
    };
  },

  // ==========================================
  // 6. MULTI-MERCHANT & NON-HNI
  // ==========================================
  async getMerchants() {
    const res = await pool.query('SELECT * FROM store.merchants ORDER BY created_at ASC');
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      type: r.type,
      phone: r.phone,
      address: r.address,
      picName: r.pic_name,
      status: r.status,
      profitShareRate: r.profit_share_rate,
    }));
  },

  async createMerchant(payload: any) {
    const id = `MRC-${Date.now().toString().slice(-4)}`;
    const res = await pool.query(
      `INSERT INTO store.merchants
       (id, name, code, type, phone, address, pic_name, status, profit_share_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8)
       RETURNING *`,
      [
        id,
        payload.name,
        payload.code,
        payload.type || 'BRANCH',
        payload.phone,
        payload.address,
        payload.picName,
        payload.profitShareRate || 10,
      ]
    );
    return res.rows[0];
  },

  async updateMerchant(id: string, payload: any) {
    const res = await pool.query(
      `UPDATE store.merchants
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           pic_name = COALESCE($4, pic_name),
           profit_share_rate = COALESCE($5, profit_share_rate),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [payload.name, payload.phone, payload.address, payload.picName, payload.profitShareRate, id]
    );
    return res.rows[0];
  },

  async deleteMerchant(id: string) {
    const res = await pool.query('DELETE FROM store.merchants WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async getNonHniProducts() {
    const res = await pool.query('SELECT * FROM store.non_hni_products ORDER BY created_at ASC');
    return res.rows.map((r) => ({
      id: r.id,
      merchantId: r.merchant_id,
      name: r.name,
      sku: r.sku,
      category: r.category,
      price: r.price,
      stock: r.stock,
      unit: r.unit,
    }));
  },

  async createNonHniProduct(payload: any) {
    const id = `NH-${Date.now().toString().slice(-4)}`;
    const res = await pool.query(
      `INSERT INTO store.non_hni_products
       (id, merchant_id, name, sku, category, price, stock, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        payload.merchantId || null,
        payload.name,
        payload.sku,
        payload.category,
        payload.price,
        payload.stock || 0,
        payload.unit || 'PCS',
      ]
    );
    return res.rows[0];
  },

  async updateNonHniProduct(id: string, payload: any) {
    const res = await pool.query(
      `UPDATE store.non_hni_products
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           price = COALESCE($3, price),
           stock = COALESCE($4, stock),
           unit = COALESCE($5, unit),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [payload.name, payload.category, payload.price, payload.stock, payload.unit, id]
    );
    return res.rows[0];
  },

  async deleteNonHniProduct(id: string) {
    const res = await pool.query('DELETE FROM store.non_hni_products WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  // ==========================================
  // 7. E-SIGNATURE (BARCODE DIGITAL RESI)
  // ==========================================
  async getEsignatures() {
    const res = await pool.query('SELECT * FROM store.esignatures ORDER BY created_at DESC');
    return res.rows.map((r) => ({
      id: r.id,
      userId: r.user_id || null,
      staffId: r.staff_id || null,
      title: r.title,
      signerName: r.signer_name,
      signerRole: r.signer_role,
      verificationCode: r.verification_code,
      payloadHash: r.payload_hash,
      signatureImage: r.signature_image || null,
      status: r.status,
      createdAt: r.created_at,
    }));
  },

  async createEsignature(payload: any) {
    const id = `SIG-${Date.now().toString().slice(-4)}`;
    const vcode = `TJR-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const hash = `0x${Math.random().toString(16).substring(2, 26)}`;

    // Poin 3: Proteksi not-null constraint signer_name
    const rawSignerName = payload.signerName || payload.signer_name || payload.authorName || '';
    const signerName = String(rawSignerName).trim() || 'Kasir Toko BC3 Bukittinggi';
    const signerRole = String(payload.signerRole || payload.signer_role || 'KASIR').trim() || 'KASIR';
    const userId = payload.userId ? String(payload.userId).trim() : null;
    const staffId = payload.staffId ? String(payload.staffId).trim() : userId;
    const signatureImage = payload.signatureImage ? String(payload.signatureImage) : null;
    const title = String(payload.title || `Tanda Tangan Digital ${signerName}`).trim();

    const res = await pool.query(
      `INSERT INTO store.esignatures 
       (id, user_id, staff_id, title, signer_name, signer_role, verification_code, payload_hash, signature_image, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE')
       RETURNING *`,
      [id, userId, staffId, title, signerName, signerRole, vcode, hash, signatureImage]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id || null,
      staffId: r.staff_id || null,
      title: r.title,
      signerName: r.signer_name,
      signerRole: r.signer_role,
      verificationCode: r.verification_code,
      payloadHash: r.payload_hash,
      signatureImage: r.signature_image || null,
      status: r.status,
      createdAt: r.created_at,
    };
  },

  async deleteEsignature(id: string) {
    const res = await pool.query('DELETE FROM store.esignatures WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  // ==========================================
  // 8. KHASIAT, KOMPOSISI & TESTIMONI
  // ==========================================
  async getProductKnowledge() {
    const res = await pool.query(`
      SELECT 
        pk.id,
        pk.product_id,
        p.name AS linked_product_name,
        p.sku AS linked_product_sku,
        pk.name,
        pk.hni_code as sku,
        pk.category,
        pk.benefits,
        pk.composition,
        pk.bpom_number,
        pk.halal_status,
        pk.usage_guidelines,
        pk.image_url,
        pk.gallery_urls,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pt.id,
              'customerName', pt.author_name,
              'customerRole', pt.author_rank,
              'rating', pt.rating,
              'content', pt.comment,
              'date', TO_CHAR(pt.created_at, 'DD Mon YYYY')
            )
          ) FILTER (WHERE pt.id IS NOT NULL), '[]'
        ) as testimonials
      FROM store.product_knowledge pk
      LEFT JOIN products.products p ON p.id = pk.product_id
      LEFT JOIN store.product_testimonials pt ON pt.product_id = pk.id
      GROUP BY pk.id, p.name, p.sku
      ORDER BY pk.created_at ASC
    `);

    return res.rows.map((r) => ({
      id: r.id,
      productId: r.product_id || null,
      linkedProductName: r.linked_product_name || null,
      linkedProductSku: r.linked_product_sku || null,
      sku: r.sku,
      name: r.name,
      category: r.category,
      bpomNumber: r.bpom_number,
      halalNumber: r.halal_status,
      benefits: r.benefits || [],
      composition: r.composition || [],
      usageRules: r.usage_guidelines,
      imageUrl: r.image_url,
      galleryUrls: r.gallery_urls || [],
      testimonials: r.testimonials || [],
    }));
  },

  async createProductKnowledge(payload: any) {
    if (payload.productId) {
      const dup = await pool.query(
        `SELECT id, name FROM store.product_knowledge WHERE product_id = $1 LIMIT 1`,
        [payload.productId]
      );
      if (dup.rows.length > 0) {
        throw new AppError(`Produk ini sudah memiliki relasi khasiat (${dup.rows[0].name}). Relasi bersifat 1-to-1.`, 400);
      }
    }
    const id = `PK-${Date.now().toString().slice(-4)}`;
    const res = await pool.query(
      `INSERT INTO store.product_knowledge 
       (id, product_id, name, hni_code, category, benefits, composition, bpom_number, halal_status, usage_guidelines, image_url, gallery_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        id,
        payload.productId || null,
        payload.name,
        payload.sku,
        payload.category,
        payload.benefits || [],
        payload.composition || [],
        payload.bpomNumber,
        payload.halalNumber,
        payload.usageRules,
        payload.imageUrl || null,
        payload.galleryUrls || [],
      ]
    );
    return res.rows[0];
  },

  async updateProductKnowledge(id: string, payload: any) {
    if (payload.productId) {
      const dup = await pool.query(
        `SELECT id, name FROM store.product_knowledge WHERE product_id = $1 AND id <> $2 LIMIT 1`,
        [payload.productId, id]
      );
      if (dup.rows.length > 0) {
        throw new AppError(`Produk ini sudah tertaut ke khasiat lain (${dup.rows[0].name}). Relasi bersifat 1-to-1.`, 400);
      }
    }
    const res = await pool.query(
      `UPDATE store.product_knowledge
       SET product_id = COALESCE($1, product_id),
           name = COALESCE($2, name),
           category = COALESCE($3, category),
           benefits = COALESCE($4, benefits),
           composition = COALESCE($5, composition),
           bpom_number = COALESCE($6, bpom_number),
           halal_status = COALESCE($7, halal_status),
           usage_guidelines = COALESCE($8, usage_guidelines),
           image_url = COALESCE($9, image_url),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        payload.productId ?? null,
        payload.name,
        payload.category,
        payload.benefits,
        payload.composition,
        payload.bpomNumber,
        payload.halalNumber,
        payload.usageRules,
        payload.imageUrl,
        id,
      ]
    );
    return res.rows[0];
  },

  async deleteProductKnowledge(id: string) {
    const res = await pool.query('DELETE FROM store.product_knowledge WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Poin 4: Batch Update Tabel Khasiat Produk In-Place (Spreadsheet Table Editor)
   */
  async batchUpdateProductKnowledge(items: any[]) {
    if (!Array.isArray(items) || items.length === 0) return [];
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = [];
      for (const item of items) {
        if (!item.id) continue;
        const benefitsArray = Array.isArray(item.benefits)
          ? item.benefits
          : typeof item.benefits === 'string'
            ? item.benefits.split(',').map((s: string) => s.trim()).filter(Boolean)
            : null;

        const compositionArray = Array.isArray(item.composition)
          ? item.composition
          : typeof item.composition === 'string'
            ? item.composition.split(',').map((s: string) => s.trim()).filter(Boolean)
            : null;

        const res = await client.query(
          `UPDATE store.product_knowledge
           SET name = COALESCE($1, name),
               category = COALESCE($2, category),
               benefits = COALESCE($3, benefits),
               composition = COALESCE($4, composition),
               usage_guidelines = COALESCE($5, usage_guidelines),
               bpom_number = COALESCE($6, bpom_number),
               halal_status = COALESCE($7, halal_status),
               updated_at = NOW()
           WHERE id = $8
           RETURNING *`,
          [
            item.name,
            item.category,
            benefitsArray,
            compositionArray,
            item.usageRules || item.usageGuidelines,
            item.bpomNumber,
            item.halalNumber || item.halalStatus,
            item.id,
          ]
        );
        if (res.rows.length > 0) updated.push(res.rows[0]);
      }
      await client.query('COMMIT');
      return updated;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async createTestimonial(productId: string, payload: any) {
    const id = `TST-${Date.now().toString().slice(-4)}`;
    const res = await pool.query(
      `INSERT INTO store.product_testimonials 
       (id, product_id, author_name, author_rank, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        productId,
        payload.customerName,
        payload.customerRole || 'Pelanggan HNI',
        payload.rating || 5,
        payload.content,
      ]
    );
    return res.rows[0];
  },

  async deleteTestimonial(id: string) {
    const res = await pool.query('DELETE FROM store.product_testimonials WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  // ==========================================
  // 9. INTERACTIVE CHROME HSIS LOGIN & TOKEN SESSION
  // ==========================================
  async saveHsisToken(
    rawToken: string,
    sourceMethod: 'INTERACTIVE_BROWSER' | 'MANUAL_TOKEN' = 'MANUAL_TOKEN',
    rawCookie?: string
  ) {
    const cleanToken = String(rawToken || '').replace(/^Bearer\s+/i, '').replace(/"/g, '').trim();
    if (!cleanToken || cleanToken.length < 10) {
      throw new AppError('Token HSIS tidak valid atau terlalu pendek.', 400);
    }
    const cleanCookie = rawCookie ? String(rawCookie).trim() : null;
    const preview =
      cleanToken.length > 20
        ? `${cleanToken.slice(0, 12)}...${cleanToken.slice(-6)}`
        : `${cleanToken.slice(0, 8)}...`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO store.hsis_sessions
       (id, token_encrypted, cookie_encrypted, token_preview, source_method, status, expires_at, last_verified_at, updated_at)
       VALUES ('HSIS-SES-BC3', $1, $2, $3, $4, 'ACTIVE', $5, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         token_encrypted = EXCLUDED.token_encrypted,
         cookie_encrypted = EXCLUDED.cookie_encrypted,
         token_preview = EXCLUDED.token_preview,
         source_method = EXCLUDED.source_method,
         status = 'ACTIVE',
         expires_at = EXCLUDED.expires_at,
         last_verified_at = NOW(),
         updated_at = NOW()`,
      [cleanToken, cleanCookie, preview, sourceMethod, expiresAt]
    );

    setRuntimeHsisAuth(cleanToken, cleanCookie);

    return {
      id: 'HSIS-SES-BC3',
      token: preview,
      sourceMethod,
      status: 'ACTIVE',
      expiresAt: expiresAt.toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    };
  },

  async runHsisAutoLogin(_username?: string, _password?: string) {
    const captured = await captureHsisTokenInteractive(180000);
    const session = await this.saveHsisToken(captured.token, 'INTERACTIVE_BROWSER', captured.cookie);
    return {
      success: true,
      session,
      message: 'Login HSIS via window Chrome berhasil & token aktif tersimpan ke database.',
    };
  },

  async testHsisConnection() {
    await this.getHsisSession();
    const { token } = getRuntimeHsisAuth();
    if (!token) {
      throw new AppError('Token HSIS belum dikonfigurasi. Silakan hubungkan sesi HSIS terlebih dahulu.', 400);
    }

    try {
      const res = await axiosClient.post(
        '/saldo-cabang/saldo',
        { m: '', y: '', a: '', start: 0, limit: 1 },
        { timeout: 10000 }
      );
      console.log(res);

      await pool.query(
        `UPDATE store.hsis_sessions SET status = 'ACTIVE', last_verified_at = NOW(), updated_at = NOW() WHERE id = 'HSIS-SES-BC3'`
      );
      return {
        connected: true,
        status: 'ACTIVE',
        httpStatus: res.status,
        message: 'Koneksi ke server HSIS HNI berhasil & token valid.',
      };
    } catch (err: any) {
      const httpStatus = err?.response?.status;
      if (httpStatus === 401 || httpStatus === 403) {
        await pool.query(
          `UPDATE store.hsis_sessions SET status = 'EXPIRED', updated_at = NOW() WHERE id = 'HSIS-SES-BC3'`
        );
        throw new AppError('Token HSIS sudah kedaluwarsa atau tidak sah (Upstream 401/403). Silakan login ulang HSIS.', 502);
      }
      throw new AppError(
        err?.response?.data?.message || err?.message || 'Gagal menghubungi API HSIS.',
        502
      );
    }
  },

  // ==========================================
  // 10. EKSPEDISI / PENGIRIMAN
  // ==========================================
  async getShipments() {
    const res = await pool.query(`
      SELECT 
        o.id as "orderId",
        COALESCE(o."trackingNumber", 'TRK-' || REPLACE(o."orderNumber", '/', '-')) as "trackingNumber",
        COALESCE(o."shippingCourier", 'Kurir Toko BC HNI') as courier,
        CASE 
          WHEN o."orderStatus" = 'DELIVERED' THEN 'DELIVERED'
          WHEN o."orderStatus" = 'SHIPPED' THEN 'IN_TRANSIT'
          ELSE 'PICKED_UP'
        END as status,
        TO_CHAR(o."createdAt" + INTERVAL '2 days', 'YYYY-MM-DD') as "estimatedDelivery",
        COALESCE(o."recipientName", u."fullName", 'Pelanggan HNI') as "recipientName",
        COALESCE(o."shippingAddressText", 'Pickup Outlet BC3 Bukittinggi') as "destinationAddress",
        o."createdAt"
      FROM orders.orders o
      LEFT JOIN core_auth.users u ON u.id = o."userId"
      ORDER BY o."createdAt" DESC
    `);

    return res.rows.map((r) => ({
      id: `SHP-${r.orderId.slice(0, 8)}`,
      trackingNumber: r.trackingNumber,
      courier: r.courier,
      status: r.status,
      estimatedDelivery: r.estimatedDelivery,
      orderId: r.orderId,
      recipientName: r.recipientName,
      destinationAddress: r.destinationAddress,
      events: [
        {
          timestamp: new Date(r.createdAt).toISOString().slice(0, 16).replace('T', ' '),
          location: 'BC HNI 3 Bukittinggi',
          description: `Pesanan sedang diproses logistik (${r.courier})`,
        },
      ],
    }));
  },

  // ==========================================
  // 11. CRM & PELANGGAN TOKO
  // ==========================================
  async getCustomers() {
    const res = await pool.query(`
      SELECT 
        u.id,
        u."fullName" as name,
        COALESCE(u."phoneNumber", '08123456789') as phone,
        COALESCE(hp."hniMemberId", 'HNI-' || SUBSTRING(u.id, 1, 6)) as "hniMemberId",
        COALESCE(SUM(o."totalAmount"), 0) as "totalSpent",
        CASE 
          WHEN COALESCE(SUM(o."totalAmount"), 0) >= 5000000 THEN 'PLATINUM'
          WHEN COALESCE(SUM(o."totalAmount"), 0) >= 1000000 THEN 'GOLD'
          ELSE 'SILVER'
        END as "loyaltyTier",
        COALESCE(TO_CHAR(MAX(o."createdAt"), 'YYYY-MM-DD'), TO_CHAR(u."createdAt", 'YYYY-MM-DD')) as "lastPurchase",
        COALESCE(
          json_agg(
            json_build_object(
              'id', o.id,
              'orderNumber', o."orderNumber",
              'date', TO_CHAR(o."createdAt", 'DD Mon YYYY'),
              'totalAmount', o."totalAmount",
              'points', o."totalTpPoints",
              'status', o."orderStatus",
              'itemsSummary', 'Pesanan Produk Herbal HNI'
            )
          ) FILTER (WHERE o.id IS NOT NULL), '[]'
        ) as transactions
      FROM core_auth.users u
      LEFT JOIN core_auth.hni_profiles hp ON hp."userId" = u.id
      LEFT JOIN orders.orders o ON o."userId" = u.id
      GROUP BY u.id, u."fullName", u."phoneNumber", hp."hniMemberId", u."createdAt"
    `);

    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      hniMemberId: r.hniMemberId,
      loyaltyTier: r.loyaltyTier,
      lastPurchase: r.lastPurchase,
      totalSpent: Number(r.totalSpent),
      transactions: r.transactions || [],
    }));
  },

  // ==========================================
  // 12. VELOCITY & ANALISIS PERPUTARAN STOK
  // ==========================================
  async getStockVelocity() {
    const res = await pool.query(`
      SELECT 
        p.sku,
        p.name,
        COALESCE(SUM(oi.qty) / 30.0, 0)::numeric(10,1) as "avgDailySales",
        COALESCE(EXTRACT(DAY FROM (NOW() - COALESCE(MAX(o."createdAt"), p."createdAt")))::int, 1) as "daysSinceLastSale",
        CASE 
          WHEN p.stock <= 10 THEN 'FAST_MOVING'
          WHEN p.stock <= 80 THEN 'SLOW_MOVING'
          ELSE 'SLOW_MOVING'
        END as velocity,
        CASE 
          WHEN p.stock <= 10 THEN 50
          WHEN p.stock <= 80 THEN 20
          ELSE 10
        END as "recommendedQty"
      FROM products.products p
      LEFT JOIN orders.order_items oi ON oi."productId" = p.id OR oi.sku = p.sku
      LEFT JOIN orders.orders o ON o.id = oi."orderId"
      GROUP BY p.id, p.sku, p.name, p.stock, p."createdAt"
      ORDER BY p.stock ASC
    `);

    return res.rows.map((r) => ({
      sku: r.sku,
      name: r.name,
      avgDailySales: Number(r.avgDailySales),
      daysSinceLastSale: Number(r.daysSinceLastSale),
      velocity: r.velocity,
      recommendedQty: Number(r.recommendedQty),
    }));
  },

  // ==========================================
  // 13. REKOMENDASI RESTOCK
  // ==========================================
  async getRestockRecommendations() {
    const res = await pool.query(`
      SELECT 
        p.id,
        p.sku,
        p.name,
        GREATEST(100 - p.stock, 20) as "suggestedQty",
        3 as "leadTimeDays",
        10 as "safetyStock",
        p.stock as "currentStock",
        CASE 
          WHEN p.stock <= 10 THEN 'Stok kritis di bawah batas safety stock! Segera ajukan PO ke DC/Pusat.'
          WHEN p.stock <= 80 THEN 'Stok menipis karena permintaan harian meningkat. Rekomendasi restock berkala.'
          ELSE 'Stok aman terkendali.'
        END as note
      FROM products.products p
      WHERE p.stock <= 100
      ORDER BY p.stock ASC
    `);

    return res.rows.map((r) => ({
      id: `REC-${r.id.slice(0, 8)}`,
      sku: r.sku,
      name: r.name,
      suggestedQty: Number(r.suggestedQty),
      leadTimeDays: Number(r.leadTimeDays),
      safetyStock: Number(r.safetyStock),
      currentStock: Number(r.currentStock),
      note: r.note,
    }));
  },

  // ==========================================
  // 14. REKONSILIASI GERAI
  // ==========================================
  async getReconciliation() {
    const res = await pool.query(`
      SELECT 
        'REC-' || SUBSTRING(o.id, 1, 8) as id,
        'POINT_MISMATCH' as type,
        o.id as "relatedId",
        'Pesanan ' || o."orderNumber" || ' status posting HSIS: ' || o."hsisPostingStatus" || ' (' || o."totalTpPoints" || ' TP siap sync)' as note,
        o."totalTpPoints" as "discrepancyValue",
        CASE WHEN o."hsisPostingStatus" = 'POSTED' THEN 'RESYNCED' ELSE 'OPEN' END as status,
        o."createdAt"
      FROM orders.orders o
      ORDER BY o."createdAt" DESC
    `);

    return res.rows.map((r) => ({
      id: r.id,
      type: r.type,
      relatedId: r.relatedId,
      note: r.note,
      discrepancyValue: Number(r.discrepancyValue),
      status: r.status,
      createdAt: r.createdAt,
    }));
  },

  // ==========================================
  // 15. SESI HSIS
  // ==========================================
  async getHsisSession() {
    try {
      const res = await pool.query('SELECT * FROM store.hsis_sessions WHERE id = $1 LIMIT 1', ['HSIS-SES-BC3']);
      if (res.rows.length > 0) {
        const r = res.rows[0];
        if (r.token_encrypted) {
          setRuntimeHsisAuth(r.token_encrypted, r.cookie_encrypted || null);
        }
        return {
          id: r.id,
          token: r.token_preview || 'TOKEN_TERSIMPAN',
          sourceMethod: r.source_method || 'MANUAL_TOKEN',
          lastSyncAt: r.last_verified_at || r.updated_at || new Date().toISOString(),
          expiresAt: r.expires_at || new Date(Date.now() + 86400000).toISOString(),
          status: r.status === 'EXPIRED' ? 'EXPIRED' : 'ACTIVE',
        };
      }
    } catch {
      // fallback to env if table not ready
    }

    const hasToken = !!(process.env.token_HNI && process.env.token_HNI.length > 5);
    return {
      id: 'HSIS-SES-BC3',
      token: hasToken ? `${process.env.token_HNI?.slice(0, 16)}...` : 'TOKEN_BELUM_DIKONFIGURASI',
      sourceMethod: hasToken ? 'ENV' : 'NONE',
      lastSyncAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      status: hasToken ? 'ACTIVE' : 'EXPIRED',
    };
  },

  // ==========================================
  // 16. TREN PENYAKIT & REKOMENDASI SKU NYATA
  // ==========================================
  async getDiseaseTrends() {
    return [
      {
        id: 'TRD-01',
        topic: 'Lonjakan Kasus ISPA & Batuk Pilek Musiman',
        diseaseName: 'ISPA & Radang Saluran Pernapasan',
        seasonContext: 'Pergantian musim kemarau ke hujan (Pancaroba)',
        socialMentionGrowth: 45,
        sources: ['Twitter/X Tren Kesehatan', 'Puskesmas Bukittinggi', 'Portal Berita'],
        urgency: 'HIGH',
        recommendedSkus: ['PROC-RICH-E', 'EX-FOOD', 'SPIR-60'],
        aiInsight: 'Permintaan Procumin Rich E dan Extra Food meningkat 45% seiring lonjakan flu & batuk. Disarankan memperbanyak stok etalase.',
      },
      {
        id: 'TRD-02',
        topic: 'Keluhan Asam Lambung & Nyeri Sendi',
        diseaseName: 'Dispepsia & Nyeri Otot / Sendi',
        seasonContext: 'Kondisi cuaca dingin dan aktivitas fisik tinggi',
        socialMentionGrowth: 28,
        sources: ['Komunitas Herbal HNI', 'Diskusi Konsultasi Online'],
        urgency: 'MEDIUM',
        recommendedSkus: ['MHS-100', 'COFFEE-20'],
        aiInsight: 'Minyak Herba Sinergi (MHS) menjadi produk pertolongan pertama utama untuk dibalurkan saat pegal linu dan sakit lambung.',
      },
      {
        id: 'TRD-03',
        topic: 'Perlindungan Kulit & Kebersihan Higienis',
        diseaseName: 'Gatal-Gatal & Infeksi Bakteri Kulit',
        seasonContext: 'Kelembaban udara tinggi saat musim penghujan',
        socialMentionGrowth: 32,
        sources: ['Instagram Halal Mart', 'Grup Mitra Agen HNI'],
        urgency: 'MEDIUM',
        recommendedSkus: ['SBN-PROP', 'MHS-100'],
        aiInsight: 'Sabun Propolis dan MHS terbukti efektif menjaga kebersihan dan mengatasi keluhan gatal kulit keluarga.',
      },
    ];
  },

  // ==========================================
  // 17. POS DEVICES REAL CONNECTION PING (POIN 7)
  // ==========================================
  async pingDevice(deviceId: string) {
    const res = await pool.query('SELECT * FROM store.devices WHERE id = $1', [deviceId]);
    if (res.rows.length === 0) {
      throw new AppError('Perangkat POS tidak ditemukan', 404);
    }
    const dev = res.rows[0];
    const ip = dev.ip_address || dev.ip;
    const port = dev.port ? Number(dev.port) : 9100;

    let status: 'ONLINE' | 'OFFLINE' | 'TIMEOUT' = 'OFFLINE';
    let latencyMs = 0;
    const startTime = Date.now();

    if (!ip || ip.trim() === '' || ip.toLowerCase() === 'usb' || ip.toLowerCase() === 'local') {
      status = 'ONLINE';
      latencyMs = 2;
    } else {
      status = await new Promise<'ONLINE' | 'OFFLINE' | 'TIMEOUT'>((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1200);

        socket.connect(port, ip, () => {
          latencyMs = Date.now() - startTime;
          socket.destroy();
          resolve('ONLINE');
        });

        socket.on('error', () => {
          socket.destroy();
          resolve('OFFLINE');
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve('TIMEOUT');
        });
      });
    }

    await pool.query(
      `UPDATE store.devices 
       SET status = $1, last_ping = NOW(), updated_at = NOW() 
       WHERE id = $2`,
      [status, deviceId]
    );

    return {
      id: dev.id,
      name: dev.name,
      type: dev.type,
      ipAddress: ip,
      port,
      status,
      latencyMs: status === 'ONLINE' ? latencyMs : undefined,
      lastPing: new Date().toISOString(),
    };
  },

  async checkAllDevicesStatus() {
    const res = await pool.query('SELECT id FROM store.devices ORDER BY name ASC');
    const results = await Promise.all(
      res.rows.map((r) =>
        this.pingDevice(r.id).catch((err) => ({
          id: r.id,
          name: 'Perangkat',
          status: 'OFFLINE' as const,
          error: err.message,
        }))
      )
    );

    const onlineCount = results.filter((r) => r.status === 'ONLINE').length;
    return {
      total: results.length,
      onlineCount,
      offlineCount: results.length - onlineCount,
      devices: results,
    };
  },

  // ==========================================
  // 18. PURCHASE ORDER (PO) HSIS & CEK BARANG DATANG (POIN 6)
  // ==========================================
  async getHsisPurchaseOrders() {
    const res = await pool.query(`
      SELECT 
        id,
        po_number as "poNumber",
        supplier,
        total_items as "totalItems",
        total_amount as "totalAmount",
        status,
        items,
        notes,
        created_at as "createdAt",
        received_at as "receivedAt"
      FROM store.purchase_orders
      ORDER BY created_at DESC
    `);
    return res.rows;
  },

  async syncHsisPurchaseOrders() {
    await this.getHsisSession();

    let rawRows: any[] = [];
    try {
      const res = await axiosClient.get('/belian', { params: { _dc: Date.now() }, timeout: 15000 });
      rawRows = res.data?.data?.rows ?? res.data?.rows ?? (Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err: any) {
      throw new AppError(
        `Gagal mengambil data pembelian HSIS (/belian): ${err?.response?.data?.message || err?.message || 'Connection error'}`,
        502
      );
    }

    const validRows = rawRows.filter((r) => {
      const isLeaf = r.is_leaf === true || r.is_leaf === 'true';
      const isSummary = !r.nd || String(r.nd).trim().toLowerCase() === 'total';
      return isLeaf && !isSummary;
    });

    let syncedCount = 0;

    for (const row of validRows) {
      const nd = String(row.nd).trim();
      const id = `PO-${nd}`;

      let lines: any[] = [];
      try {
        const lineRes = await axiosClient.get(`/belian/${encodeURIComponent(nd)}/lines`, {
          params: { _dc: Date.now() },
          timeout: 15000,
        });
        lines = Array.isArray(lineRes.data?.data)
          ? lineRes.data.data
          : Array.isArray(lineRes.data)
            ? lineRes.data
            : [];
      } catch (err: any) {
        console.warn(`[syncHsisPurchaseOrders] Gagal memuat lines untuk ${nd}:`, err?.message);
      }

      const mappedItems = lines.map((line) => ({
        sku: String(line.pc || '').trim(),
        name: String(line.pn || line.pc || 'Produk HSIS').trim(),
        orderedQty: Number(line.qty) || 1,
        receivedQty: 0,
        damagedQty: 0,
        unitPrice: Number(line.up) || 0,
        barcode: String(line.pc || '').trim(),
      }));

      const supplierParts = [row.cn || 'SUB WH HSIS'];
      if (row.fw) supplierParts.push(row.fw);
      if (row.rs) supplierParts.push(`Resi: ${row.rs}`);
      const supplier = supplierParts.join(' • ');

      const totalItems =
        Number(row.qty) || mappedItems.reduce((sum, it) => sum + (it.orderedQty || 0), 0);
      const totalAmount = Number(row.tvs) || 0;
      const notes = `Tgl: ${row.sd || '-'} • Bayar: ${row.crbyr || '-'} • Koli: ${row.jp || '-'} • TP: ${Number(row.tvp || 0).toLocaleString('id-ID')}`;

      const existing = await pool.query(
        'SELECT id, status FROM store.purchase_orders WHERE id = $1 OR po_number = $2 LIMIT 1',
        [id, nd]
      );

      if (existing.rows.length > 0) {
        const ex = existing.rows[0];
        if (ex.status !== 'RECONCILED' && ex.status !== 'RECEIVED') {
          await pool.query(
            `UPDATE store.purchase_orders
             SET supplier = $1,
                 total_items = $2,
                 total_amount = $3,
                 items = CASE WHEN $4::jsonb <> '[]'::jsonb THEN $4::jsonb ELSE items END,
                 notes = $5
             WHERE id = $6`,
            [supplier, totalItems, totalAmount, JSON.stringify(mappedItems), notes, ex.id]
          );
        }
      } else {
        await pool.query(
          `INSERT INTO store.purchase_orders (id, po_number, supplier, total_items, total_amount, status, items, notes)
           VALUES ($1, $2, $3, $4, $5, 'SUBMITTED', $6::jsonb, $7)`,
          [id, nd, supplier, totalItems, totalAmount, JSON.stringify(mappedItems), notes]
        );
      }
      syncedCount++;
    }

    const currentOrders = await this.getHsisPurchaseOrders();
    return {
      success: true,
      syncedCount,
      totalFetched: validRows.length,
      message: `Sinkronisasi pembelian HSIS (/belian) selesai! ${syncedCount} PO diproses (${currentOrders.length} total PO).`,
      data: currentOrders,
    };
  },

  async createHsisPurchaseOrder(payload: {
    supplier?: string;
    notes?: string;
    items: Array<{ sku: string; name: string; orderedQty: number; unitPrice: number; barcode?: string }>;
  }) {
    if (!payload.items || payload.items.length === 0) {
      throw new AppError('Daftar item produk pesanan PO tidak boleh kosong', 400);
    }

    const countRes = await pool.query('SELECT COUNT(*) FROM store.purchase_orders');
    const seq = String(parseInt(countRes.rows[0].count, 10) + 1).padStart(3, '0');
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const poNumber = `PO-HSIS-${ym}-${seq}`;
    const id = poNumber;

    const totalItems = payload.items.reduce((sum, it) => sum + Number(it.orderedQty || 0), 0);
    const totalAmount = payload.items.reduce(
      (sum, it) => sum + Number(it.orderedQty || 0) * Number(it.unitPrice || 0),
      0
    );

    const itemsJson = payload.items.map((it) => ({
      sku: it.sku,
      name: it.name,
      orderedQty: Number(it.orderedQty || 0),
      receivedQty: 0,
      damagedQty: 0,
      unitPrice: Number(it.unitPrice || 0),
      barcode: it.barcode || undefined,
    }));

    const supplier = payload.supplier || 'HSIS PUSAT JAKARTA (Gudang Logistik Regional)';

    const res = await pool.query(
      `INSERT INTO store.purchase_orders 
       (id, po_number, supplier, total_items, total_amount, status, items, notes)
       VALUES ($1, $2, $3, $4, $5, 'SUBMITTED', $6, $7)
       RETURNING *`,
      [id, poNumber, supplier, totalItems, totalAmount, JSON.stringify(itemsJson), payload.notes || '']
    );

    return {
      success: true,
      message: `Purchase Order ${poNumber} berhasil disubmit ke HSIS Logistik.`,
      data: res.rows[0],
    };
  },

  async receiveHsisOrder(
    poId: string,
    payload: {
      items: Array<{ sku: string; receivedQty: number; damagedQty?: number }>;
      notes?: string;
    }
  ) {
    const poRes = await pool.query('SELECT * FROM store.purchase_orders WHERE id = $1', [poId]);
    if (poRes.rows.length === 0) {
      throw new AppError('Data Purchase Order tidak ditemukan', 404);
    }

    const currentPo = poRes.rows[0];
    const currentItems: any[] = Array.isArray(currentPo.items) ? currentPo.items : [];

    const updatedItems = currentItems.map((origIt) => {
      const match = payload.items.find((pIt) => pIt.sku === origIt.sku);
      if (match) {
        return {
          ...origIt,
          receivedQty: Number(match.receivedQty || 0),
          damagedQty: Number(match.damagedQty || 0),
        };
      }
      return origIt;
    });

    // Otomatis update stok fisik ke tabel products.products
    for (const it of payload.items) {
      const validQty = Number(it.receivedQty || 0);
      if (validQty > 0) {
        await pool.query(
          `UPDATE products.products 
           SET stock = stock + $1, "updatedAt" = NOW() 
           WHERE sku = $2 OR name ILIKE $3`,
          [validQty, it.sku, `%${it.sku}%`]
        );
      }
    }

    const updateRes = await pool.query(
      `UPDATE store.purchase_orders
       SET status = 'RECONCILED',
           items = $1,
           notes = COALESCE($2, notes),
           received_at = NOW(),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(updatedItems), payload.notes || currentPo.notes, poId]
    );

    return {
      success: true,
      message: `Penerimaan barang PO ${currentPo.po_number} berhasil diverifikasi. Stok fisik telah ditambahkan ke database toko.`,
      data: updateRes.rows[0],
    };
  },

  // ==========================================
  // 19. KUPON DINAMIS & CRUD VOUCHER (POIN 9)
  // ==========================================
  async getStoreVouchers() {
    const res = await pool.query(
      `SELECT id, code, title, "discountType", "discountValue", "minPurchase", "maxDiscount",
              COALESCE(quota, 100) AS quota,
              COALESCE(used_count, 0) AS "usedCount",
              conditions, "validUntil", "isActive", description, "createdAt"
       FROM promotions.vouchers
       ORDER BY "createdAt" DESC`
    );
    return res.rows;
  },

  async createStoreVoucher(payload: any, lang: SupportedLanguage = 'id') {
    const code = String(payload.code || '').trim().toUpperCase();
    if (!code) {
      throw new AppError(t('vouchers.voucher_invalid', {}, lang), 400);
    }

    const dup = await pool.query(`SELECT id FROM promotions.vouchers WHERE UPPER(code) = $1 LIMIT 1`, [code]);
    if (dup.rows.length > 0) {
      throw new AppError(t('vouchers.voucher_code_duplicate', { code }, lang), 409);
    }

    const discountType =
      payload.discountType === 'PERCENT' || payload.discountType === 'PERCENTAGE'
        ? 'PERCENTAGE'
        : payload.discountType === 'SHIPPING_SUBSIDY'
          ? 'SHIPPING_SUBSIDY'
          : 'FIXED';
    const title = String(payload.title || code).trim();
    const description = String(payload.description || title).trim();
    const discountValue = Number(payload.discountValue || 0);
    const minPurchase = Number(payload.minPurchase || 0);
    const maxDiscount = payload.maxDiscount != null && Number(payload.maxDiscount) > 0 ? Number(payload.maxDiscount) : null;
    const quota = Math.max(1, Number(payload.quota || 100));
    const validUntil = payload.validUntil || payload.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString();
    const isActive = payload.isActive !== false;
    const conditions = payload.conditions ? JSON.stringify(payload.conditions) : null;

    const res = await pool.query(
      `INSERT INTO promotions.vouchers
         (id, code, title, "discountType", "discountValue", "minPurchase", "maxDiscount", quota, used_count, conditions, "validUntil", "isActive", description, "createdAt")
       VALUES
         (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 0, $8::jsonb, $9::timestamptz, $10, $11, NOW())
       RETURNING id, code, title, "discountType", "discountValue", "minPurchase", "maxDiscount", quota, used_count AS "usedCount", conditions, "validUntil", "isActive", description, "createdAt"`,
      [code, title, discountType, discountValue, minPurchase, maxDiscount, quota, conditions, validUntil, isActive, description]
    );

    return res.rows[0];
  },

  async updateStoreVoucher(voucherId: string, payload: any, lang: SupportedLanguage = 'id') {
    const existingRes = await pool.query(`SELECT * FROM promotions.vouchers WHERE id = $1 LIMIT 1`, [voucherId]);
    if (existingRes.rows.length === 0) {
      throw new AppError(t('vouchers.voucher_not_found', {}, lang), 404);
    }
    const cur = existingRes.rows[0];

    const code = payload.code ? String(payload.code).trim().toUpperCase() : cur.code;
    if (code !== cur.code) {
      const dup = await pool.query(
        `SELECT id FROM promotions.vouchers WHERE UPPER(code) = $1 AND id <> $2 LIMIT 1`,
        [code, voucherId]
      );
      if (dup.rows.length > 0) {
        throw new AppError(t('vouchers.voucher_code_duplicate', { code }, lang), 409);
      }
    }

    const discountType = payload.discountType
      ? payload.discountType === 'PERCENT' || payload.discountType === 'PERCENTAGE'
        ? 'PERCENTAGE'
        : payload.discountType === 'SHIPPING_SUBSIDY'
          ? 'SHIPPING_SUBSIDY'
          : 'FIXED'
      : cur.discountType;

    const title = payload.title !== undefined ? String(payload.title).trim() : cur.title;
    const description = payload.description !== undefined ? String(payload.description).trim() : cur.description;
    const discountValue = payload.discountValue !== undefined ? Number(payload.discountValue) : cur.discountValue;
    const minPurchase = payload.minPurchase !== undefined ? Number(payload.minPurchase) : cur.minPurchase;
    const maxDiscount =
      payload.maxDiscount !== undefined
        ? Number(payload.maxDiscount) > 0
          ? Number(payload.maxDiscount)
          : null
        : cur.maxDiscount;
    const quota = payload.quota !== undefined ? Math.max(1, Number(payload.quota)) : (cur.quota ?? 100);
    const validUntil = payload.validUntil || payload.expiresAt || cur.validUntil;
    const isActive = payload.isActive !== undefined ? Boolean(payload.isActive) : cur.isActive;
    const conditions =
      payload.conditions !== undefined
        ? payload.conditions
          ? JSON.stringify(payload.conditions)
          : null
        : cur.conditions
          ? JSON.stringify(cur.conditions)
          : null;

    const res = await pool.query(
      `UPDATE promotions.vouchers
       SET code = $1, title = $2, "discountType" = $3, "discountValue" = $4,
           "minPurchase" = $5, "maxDiscount" = $6, quota = $7, "validUntil" = $8::timestamptz,
           "isActive" = $9, description = $10, conditions = $11::jsonb
       WHERE id = $12
       RETURNING id, code, title, "discountType", "discountValue", "minPurchase", "maxDiscount", quota, used_count AS "usedCount", conditions, "validUntil", "isActive", description, "createdAt"`,
      [code, title, discountType, discountValue, minPurchase, maxDiscount, quota, validUntil, isActive, description, conditions, voucherId]
    );

    return res.rows[0];
  },

  async deleteStoreVoucher(voucherId: string, lang: SupportedLanguage = 'id') {
    const res = await pool.query(`DELETE FROM promotions.vouchers WHERE id = $1 RETURNING id`, [voucherId]);
    if (res.rows.length === 0) {
      throw new AppError(t('vouchers.voucher_not_found', {}, lang), 404);
    }
    return { id: voucherId, deleted: true };
  },

  async updateVoucherConditions(voucherId: string, conditions: any, lang: SupportedLanguage = 'id') {
    const res = await pool.query(
      `UPDATE promotions.vouchers 
       SET conditions = $1 
       WHERE id = $2 OR code = $2 
       RETURNING id, code, title, "discountType", "discountValue", "minPurchase", "maxDiscount", quota, used_count AS "usedCount", conditions, "validUntil", "isActive", description, "createdAt"`,
      [JSON.stringify(conditions || {}), voucherId]
    );

    if (res.rows.length === 0) {
      throw new AppError(t('vouchers.voucher_not_found', {}, lang), 404);
    }

    return {
      success: true,
      message: t('vouchers.update_conditions_success', {}, lang),
      data: res.rows[0],
    };
  },

  // ==========================================
  // 20. AUTO-CANCEL ORDER KEDALUWARSA (POIN 11)
  // ==========================================
  async cancelExpiredOrdersManual() {
    const result = await cancelExpiredOrders();
    return {
      success: true,
      message: result.cancelledCount > 0
        ? `Berhasil membatalkan ${result.cancelledCount} pesanan kedaluwarsa dan mengembalikan ${result.restoredItemsCount} unit stok produk.`
        : 'Tidak ada pesanan kedaluwarsa yang memerlukan pembatalan.',
      data: result,
    };
  },

  // ==========================================
  // 21. LAPORAN KEUANGAN & AGREGASI (POIN 13)
  // ==========================================
  async getFinancialReport(query: { period?: string; dateFrom?: string; dateTo?: string }) {
    let dateFilterSql = '';
    const params: any[] = [];

    if (query.dateFrom) {
      params.push(query.dateFrom);
      dateFilterSql += ` AND "createdAt" >= $${params.length}`;
    }
    if (query.dateTo) {
      params.push(query.dateTo + ' 23:59:59');
      dateFilterSql += ` AND "createdAt" <= $${params.length}`;
    }

    if (query.period === 'today' && !query.dateFrom) {
      dateFilterSql += ` AND "createdAt" >= CURRENT_DATE`;
    } else if (query.period === 'last7days' && !query.dateFrom) {
      dateFilterSql += ` AND "createdAt" >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (query.period === 'thisMonth' && !query.dateFrom) {
      dateFilterSql += ` AND "createdAt" >= DATE_TRUNC('month', CURRENT_DATE)`;
    }

    const summaryRes = await pool.query(
      `SELECT 
         COUNT(*) as total_transactions,
         COALESCE(SUM("totalAmount"), 0) as gross_revenue,
         COALESCE(SUM(CASE WHEN "paymentMethod" ILIKE '%kasbon%' OR "paymentMethod" ILIKE '%tempo%' THEN "totalAmount" ELSE 0 END), 0) as tempo_receivable,
         COALESCE(SUM(CASE WHEN "paymentMethod" NOT ILIKE '%kasbon%' AND "paymentMethod" NOT ILIKE '%tempo%' THEN "totalAmount" ELSE 0 END), 0) as cash_qris_revenue,
         COALESCE(SUM("totalTpPoints"), 0) as total_tp_points,
         COALESCE(SUM("discountAmount"), 0) as total_discount
       FROM orders.orders
       WHERE "orderStatus" NOT IN ('CANCELLED', 'REJECTED') ${dateFilterSql}`,
      params
    );

    const s = summaryRes.rows[0];
    const grossRevenue = Number(s.gross_revenue) || 0;
    const estimatedHpp = Math.round(grossRevenue * 0.65);
    const estimatedGrossProfit = grossRevenue - estimatedHpp;

    // Daily breakdown untuk Chart visual
    const trendRes = await pool.query(
      `SELECT 
         TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
         COUNT(*) as order_count,
         COALESCE(SUM("totalAmount"), 0) as revenue,
         COALESCE(SUM("totalTpPoints"), 0)::int as tp_points
       FROM orders.orders
       WHERE "orderStatus" NOT IN ('CANCELLED', 'REJECTED') ${dateFilterSql}
       GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
       ORDER BY date ASC
       LIMIT 30`,
      params
    );

    return {
      summary: {
        totalTransactions: Number(s.total_transactions) || 0,
        grossRevenue,
        cashQrisRevenue: Number(s.cash_qris_revenue) || 0,
        tempoReceivable: Number(s.tempo_receivable) || 0,
        estimatedHpp,
        estimatedGrossProfit,
        profitMarginPct: grossRevenue > 0 ? Math.round((estimatedGrossProfit / grossRevenue) * 100) : 35,
        totalTpPoints: Number(s.total_tp_points) || 0,
        totalDiscount: Number(s.total_discount) || 0,
      },
      chartData: trendRes.rows.map((r) => ({
        date: r.date,
        orderCount: Number(r.order_count) || 0,
        revenue: Number(r.revenue) || 0,
        tpPoints: Number(r.tp_points) || 0,
        profit: Math.round(Number(r.revenue) * 0.35),
      })),
    };
  },

  async exportFinancialReportCsv(query: { dateFrom?: string; dateTo?: string }) {
    let dateFilterSql = '';
    const params: any[] = [];
    if (query.dateFrom) {
      params.push(query.dateFrom);
      dateFilterSql += ` AND "createdAt" >= $${params.length}`;
    }
    if (query.dateTo) {
      params.push(query.dateTo + ' 23:59:59');
      dateFilterSql += ` AND "createdAt" <= $${params.length}`;
    }

    const res = await pool.query(
      `SELECT 
         "orderNumber", "createdAt", "recipientName", "paymentMethod", 
         "paymentStatus", "orderStatus", "totalTpPoints", "totalAmount"
       FROM orders.orders
       WHERE "orderStatus" NOT IN ('CANCELLED', 'REJECTED') ${dateFilterSql}
       ORDER BY "createdAt" DESC`,
      params
    );

    let csv = "No Order,Tanggal,Nama Pelanggan,Metode Bayar,Status Bayar,Status Order,Poin TP,Total Belanja (Rp)\n";
    for (const r of res.rows) {
      const dateStr = new Date(r.createdAt).toISOString().replace('T', ' ').slice(0, 19);
      csv += `"${r.orderNumber}","${dateStr}","${r.recipientName || 'Pelanggan'}","${r.paymentMethod}","${r.paymentStatus}","${r.orderStatus}",${r.totalTpPoints || 0},${r.totalAmount}\n`;
    }
    return csv;
  },

  // ==========================================
  // 22. EXPORT & IMPORT STOK INVENTORY (POIN 14)
  // ==========================================
  async exportInventoryCsv() {
    const res = await pool.query(
      `SELECT sku, name, category, "normalPrice", "agentPrice", stock, "tpPoints", "isActive"
       FROM products.products
       ORDER BY name ASC`
    );

    let csv = "\uFEFFSKU,Nama Produk,Kategori,Harga Konsumen,Harga Agen,Stok,Poin TP,Status\n";
    for (const p of res.rows) {
      const statusText = p.isActive ? 'AKTIF' : 'NONAKTIF';
      csv += `"${p.sku}","${(p.name || '').replace(/"/g, '""')}","${p.category || 'Herbal'}",${p.normalPrice || 0},${p.agentPrice || 0},${p.stock || 0},${p.tpPoints || 0},"${statusText}"\n`;
    }
    return csv;
  },

  async importInventory(items: Array<{ sku: string; stock: number; mode?: 'SET' | 'ADD' }>) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Daftar item untuk import tidak boleh kosong', 400);
    }

    const client = await pool.connect();
    let updatedCount = 0;
    const errors: string[] = [];

    try {
      await client.query('BEGIN');
      for (const item of items) {
        if (!item.sku || typeof item.stock !== 'number') {
          errors.push(`Baris dengan SKU '${item.sku || 'N/A'}' memiliki kuantitas tidak valid.`);
          continue;
        }

        const checkRes = await client.query('SELECT id, stock FROM products.products WHERE sku = $1', [item.sku]);
        if (checkRes.rows.length === 0) {
          errors.push(`SKU '${item.sku}' tidak ditemukan di database produk.`);
          continue;
        }

        const mode = item.mode || 'SET';
        if (mode === 'ADD') {
          await client.query(
            `UPDATE products.products 
             SET stock = stock + $1, "updatedAt" = NOW() 
             WHERE sku = $2`,
            [item.stock, item.sku]
          );
        } else {
          await client.query(
            `UPDATE products.products 
             SET stock = $1, "updatedAt" = NOW() 
             WHERE sku = $2`,
            [Math.max(0, item.stock), item.sku]
          );
        }
        updatedCount++;
      }
      await client.query('COMMIT');

      return {
        totalReceived: items.length,
        updatedCount,
        errors,
        message: `Berhasil memperbarui stok ${updatedCount} produk.${errors.length > 0 ? ` (${errors.length} dilewati/error)` : ''}`,
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw new AppError(`Gagal melakukan import stok: ${err.message}`, 500);
    } finally {
      client.release();
    }
  },

  // ==========================================
  // 17. MANAJEMEN SEMUA PENGGUNA SISTEM (USER & AGENT MANAGEMENT)
  // ==========================================
  async getSystemUsers(query: {
    search?: string;
    userType?: string;
    role?: string;
    position?: string;
    isActive?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['u."isDeleted" = false'];
    const values: any[] = [];
    let paramIndex = 1;

    if (query.search && query.search.trim()) {
      const s = `%${query.search.trim()}%`;
      conditions.push(`(
        u."fullName" ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex} OR 
        u."phoneNumber" ILIKE $${paramIndex} OR
        hp."hniMemberId" ILIKE $${paramIndex} OR
        hp."hniMemberName" ILIKE $${paramIndex}
      )`);
      values.push(s);
      paramIndex++;
    }

    if (query.userType && query.userType !== 'ALL') {
      conditions.push(`u."userType" = $${paramIndex}`);
      values.push(query.userType);
      paramIndex++;
    }

    if (query.role && query.role !== 'ALL') {
      conditions.push(`UPPER(COALESCE(ag.role, '')) = UPPER($${paramIndex})`);
      values.push(query.role.trim());
      paramIndex++;
    }

    if (query.position && query.position !== 'ALL') {
      conditions.push(
        `UPPER(COALESCE(NULLIF(hp.rank, ''), NULLIF(hp."rankMarketing", ''), NULLIF(ag.rank, ''), '')) = UPPER($${paramIndex})`
      );
      values.push(query.position.trim());
      paramIndex++;
    }

    if (query.isActive !== undefined && query.isActive !== 'ALL' && query.isActive !== '') {
      const boolVal = query.isActive === 'true';
      conditions.push(`u."isActive" = $${paramIndex}`);
      values.push(boolVal);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(DISTINCT u.id)::int as total
       FROM core_auth.users u
       LEFT JOIN core_auth.hni_profiles hp ON hp."userId" = u.id AND hp."isDeleted" = false
       LEFT JOIN store.agents ag ON (ag.email = u.email OR ag.phone = u."phoneNumber")
       ${whereClause}`,
      values
    );
    const total = countRes.rows[0]?.total || 0;

    const sql = `
      SELECT 
        u.id,
        u."fullName",
        u.email,
        u."phoneNumber",
        u."userType",
        u."isActive",
        u."createdAt",
        u."updatedAt",
        hp.id as "hniProfileId",
        hp."hniMemberId",
        hp."hniMemberName",
        hp.rank as "hniRank",
        hp."rankMarketing" as "hniRankMarketing",
        hp."uplineName" as "hniUplineName",
        hp."isVerified" as "hniIsVerified",
        COALESCE(ord."orderCount", 0) as "orderCount",
        COALESCE(ord."totalSpent", 0) as "totalSpent",
        ag.role as "agentRole",
        ag.tier as "agentTier",
        ag.rank as "agentRank"
      FROM core_auth.users u
      LEFT JOIN core_auth.hni_profiles hp ON hp."userId" = u.id AND hp."isDeleted" = false
      LEFT JOIN store.agents ag ON (ag.email = u.email OR ag.phone = u."phoneNumber")
      LEFT JOIN LATERAL (
        SELECT 
          COUNT(o.id)::int as "orderCount",
          COALESCE(SUM(o."totalAmount"), 0)::float as "totalSpent"
        FROM orders.orders o
        WHERE o."userId" = u.id
      ) ord ON true
      ${whereClause}
      ORDER BY u."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);
    const [res, facetRolesRes, facetPositionsRes] = await Promise.all([
      pool.query(sql, values),
      pool.query(`SELECT DISTINCT role FROM store.agents WHERE role IS NOT NULL AND TRIM(role) <> ''`),
      pool.query(`
        SELECT DISTINCT pos FROM (
          SELECT rank AS pos FROM store.agents WHERE rank IS NOT NULL AND TRIM(rank) <> ''
          UNION
          SELECT rank AS pos FROM core_auth.hni_profiles WHERE rank IS NOT NULL AND TRIM(rank) <> ''
          UNION
          SELECT "rankMarketing" AS pos FROM core_auth.hni_profiles WHERE "rankMarketing" IS NOT NULL AND TRIM("rankMarketing") <> ''
        ) p
      `),
    ]);

    const rolesSet = new Set<string>(['OWNER', 'ADMIN', 'KASIR', 'GUDANG', 'AGEN_HNI']);
    for (const row of facetRolesRes.rows) {
      rolesSet.add(String(row.role).trim().toUpperCase());
    }

    const positionsSet = new Set<string>(['AB', 'A', 'M', 'M - SC', 'ED', 'LED']);
    for (const row of facetPositionsRes.rows) {
      positionsSet.add(String(row.pos).trim());
    }

    return {
      users: res.rows.map((r) => ({
        id: r.id,
        fullName: r.fullName || 'Tanpa Nama',
        email: r.email,
        phoneNumber: r.phoneNumber,
        userType: r.userType || 'customer',
        isActive: r.isActive,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        hniProfile: r.hniMemberId
          ? {
            id: r.hniProfileId,
            hniMemberId: r.hniMemberId,
            hniMemberName: r.hniMemberName,
            rank: r.hniRank || 'AB',
            rankMarketing: r.hniRankMarketing || r.hniRank || 'AB',
            uplineName: r.hniUplineName,
            isVerified: r.hniIsVerified ?? true,
          }
          : null,
        agentMeta: r.agentRole
          ? { role: r.agentRole, tier: r.agentTier, rank: r.agentRank || r.hniRank || null }
          : null,
        metrics: {
          orderCount: Number(r.orderCount) || 0,
          totalSpent: Number(r.totalSpent) || 0,
        },
      })),
      facets: {
        roles: Array.from(rolesSet),
        positions: Array.from(positionsSet),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getSystemUserDetail(id: string) {
    const userRes = await pool.query(
      `SELECT 
        u.id,
        u."fullName",
        u.email,
        u."phoneNumber",
        u."userType",
        u."isActive",
        u."createdAt",
        u."updatedAt",
        hp.id as "hniProfileId",
        hp."hniMemberId",
        hp."hniMemberName",
        hp.rank as "hniRank",
        hp."rankMarketing" as "hniRankMarketing",
        hp."uplineName" as "hniUplineName",
        hp."isVerified" as "hniIsVerified",
        ag.id as "agentId",
        ag.role as "agentRole",
        ag.tier as "agentTier"
      FROM core_auth.users u
      LEFT JOIN core_auth.hni_profiles hp ON hp."userId" = u.id AND hp."isDeleted" = false
      LEFT JOIN store.agents ag ON (ag.email = u.email OR ag.phone = u."phoneNumber")
      WHERE u.id = $1 AND u."isDeleted" = false`,
      [id]
    );

    if (userRes.rows.length === 0) {
      throw new AppError('Pengguna tidak ditemukan atau telah dihapus', 404);
    }

    const u = userRes.rows[0];

    // Alamat pengiriman
    const addrRes = await pool.query(
      `SELECT * FROM core_auth.addresses WHERE "userId" = $1 ORDER BY "isPrimary" DESC, "createdAt" DESC`,
      [id]
    );

    // Riwayat pesanan
    const ordersRes = await pool.query(
      `SELECT 
        id, 
        "orderNumber", 
        "orderStatus", 
        "paymentMethod", 
        "paymentStatus", 
        "totalAmount", 
        "totalTpPoints", 
        "createdAt"
       FROM orders.orders 
       WHERE "userId" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT 15`,
      [id]
    );

    const orderIds = ordersRes.rows.map((o) => o.id);
    const itemsByOrderId = new Map<string, any[]>();
    if (orderIds.length > 0) {
      const itemsRes = await pool.query(
        `SELECT id, "orderId", "productId", sku, "productName", qty, "unitPrice", "tpPoints", "totalPrice"
         FROM orders.order_items
         WHERE "orderId" = ANY($1)`,
        [orderIds]
      );
      for (const item of itemsRes.rows) {
        const list = itemsByOrderId.get(item.orderId) || [];
        list.push({
          id: item.id,
          productId: item.productId,
          sku: item.sku || null,
          productName: item.productName,
          qty: Number(item.qty) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          tpPoints: Number(item.tpPoints) || 0,
          totalPrice: Number(item.totalPrice) || 0,
        });
        itemsByOrderId.set(item.orderId, list);
      }
    }

    const metricsRes = await pool.query(
      `SELECT 
        COUNT(id)::int as "totalOrders",
        COALESCE(SUM(CASE WHEN "orderStatus" IN ('COMPLETED', 'DELIVERED') THEN 1 ELSE 0 END), 0)::int as "completedOrders",
        COALESCE(SUM("totalAmount"), 0)::float as "totalSpent",
        COALESCE(SUM("totalTpPoints"), 0)::int as "totalPoints"
       FROM orders.orders 
       WHERE "userId" = $1`,
      [id]
    );

    const metrics = metricsRes.rows[0] || {
      totalOrders: 0,
      completedOrders: 0,
      totalSpent: 0,
      totalPoints: 0,
    };

    return {
      user: {
        id: u.id,
        fullName: u.fullName || 'Tanpa Nama',
        email: u.email,
        phoneNumber: u.phoneNumber,
        userType: u.userType || 'customer',
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        hniProfile: u.hniMemberId
          ? {
            id: u.hniProfileId,
            hniMemberId: u.hniMemberId,
            hniMemberName: u.hniMemberName,
            rank: u.hniRank || 'AB',
            rankMarketing: u.hniRankMarketing || u.hniRank || 'AB',
            uplineName: u.hniUplineName,
            isVerified: u.hniIsVerified ?? true,
          }
          : null,
        agentMeta: u.agentRole ? { id: u.agentId, role: u.agentRole, tier: u.agentTier } : null,
      },
      addresses: addrRes.rows.map((a) => ({
        id: a.id,
        recipientName: a.recipientName,
        phoneNumber: a.phoneNumber,
        province: a.province,
        city: a.city,
        district: a.district,
        fullAddress: a.fullAddress,
        postalCode: a.postalCode,
        isPrimary: a.isPrimary,
      })),
      orders: ordersRes.rows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        orderStatus: o.orderStatus,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        totalAmount: Number(o.totalAmount),
        totalTpPoints: Number(o.totalTpPoints) || 0,
        createdAt: o.createdAt,
        items: itemsByOrderId.get(o.id) || [],
      })),
      metrics: {
        totalOrders: Number(metrics.totalOrders) || 0,
        completedOrders: Number(metrics.completedOrders) || 0,
        totalSpent: Number(metrics.totalSpent) || 0,
        totalPoints: Number(metrics.totalPoints) || 0,
      },
    };
  },

  async createSystemUser(payload: {
    fullName: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    userType?: string;
    isActive?: boolean;
    hniMemberId?: string;
    hniMemberName?: string;
    rank?: string;
    uplineName?: string;
    agentRole?: string;
    agentTier?: string;
  }) {
    if (!payload.fullName || !payload.fullName.trim()) {
      throw new AppError('Nama lengkap pengguna wajib diisi', 400);
    }

    if (payload.email && payload.email.trim()) {
      const checkEmail = await pool.query(
        'SELECT id FROM core_auth.users WHERE email = $1 AND "isDeleted" = false',
        [payload.email.trim()]
      );
      if (checkEmail.rows.length > 0) {
        throw new AppError('Email sudah terdaftar pada pengguna lain', 400);
      }
    }

    const userId = crypto.randomUUID();
    const rawPass = payload.password && payload.password.trim() ? payload.password.trim() : 'Tijarah123!';
    const passwordHash = await bcrypt.hash(rawPass, 10);
    const userType = payload.userType || (payload.hniMemberId ? 'agen' : 'customer');
    const isActive = payload.isActive ?? true;

    const userRes = await pool.query(
      `INSERT INTO core_auth.users
       (id, "fullName", email, "phoneNumber", "passwordHash", "userType", "isActive", "isDeleted", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW(), NOW())
       RETURNING id, "fullName", email, "phoneNumber", "userType", "isActive", "createdAt"`,
      [
        userId,
        payload.fullName.trim(),
        payload.email ? payload.email.trim() : null,
        payload.phoneNumber ? payload.phoneNumber.trim() : null,
        passwordHash,
        userType,
        isActive,
      ]
    );

    let hniProfile = null;
    if (payload.hniMemberId && payload.hniMemberId.trim()) {
      const hniId = crypto.randomUUID();
      const hpRes = await pool.query(
        `INSERT INTO core_auth.hni_profiles
         (id, "userId", "hniMemberId", "hniMemberName", rank, "rankMarketing", "uplineName", "isVerified", "isDeleted", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, false, NOW(), NOW())
         RETURNING *`,
        [
          hniId,
          userId,
          payload.hniMemberId.trim(),
          (payload.hniMemberName || payload.fullName).trim(),
          payload.rank || 'AB',
          payload.rank || 'AB',
          payload.uplineName || null,
        ]
      );
      hniProfile = hpRes.rows[0];
    }

    // Jika userType adalah agen atau staff/kasir, sync ke store.agents
    if (['agen', 'staff', 'kasir', 'admin'].includes(userType)) {
      const agtId = `AGT-${Date.now().toString().slice(-4)}`;
      try {
        await pool.query(
          `INSERT INTO store.agents
           (id, name, hni_id, phone, email, rank, tier, status, role)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            agtId,
            payload.fullName.trim(),
            payload.hniMemberId ? payload.hniMemberId.trim() : `USR-${userId.slice(0, 6)}`,
            payload.phoneNumber || '-',
            payload.email || null,
            payload.rank || 'AB',
            payload.agentTier || 'BC_3',
            isActive ? 'ACTIVE' : 'INACTIVE',
            payload.agentRole || (userType === 'agen' ? 'AGEN_HNI' : 'KASIR'),
          ]
        );
      } catch (e) {
        // Abaikan jika duplikat
      }
    }

    return {
      user: userRes.rows[0],
      hniProfile,
      message: 'Pengguna baru berhasil didaftarkan ke sistem',
    };
  },

  async updateSystemUser(
    id: string,
    payload: {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      userType?: string;
      isActive?: boolean;
      hniMemberId?: string;
      hniMemberName?: string;
      rank?: string;
      uplineName?: string;
      agentRole?: string;
      agentTier?: string;
    }
  ) {
    const existing = await pool.query(
      'SELECT * FROM core_auth.users WHERE id = $1 AND "isDeleted" = false',
      [id]
    );
    if (existing.rows.length === 0) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    if (payload.email && payload.email.trim()) {
      const emailCheck = await pool.query(
        'SELECT id FROM core_auth.users WHERE email = $1 AND id != $2 AND "isDeleted" = false',
        [payload.email.trim(), id]
      );
      if (emailCheck.rows.length > 0) {
        throw new AppError('Email sudah digunakan oleh pengguna lain', 400);
      }
    }

    const current = existing.rows[0];
    const fullName = payload.fullName !== undefined ? payload.fullName.trim() : current.fullName;
    const email = payload.email !== undefined ? (payload.email ? payload.email.trim() : null) : current.email;
    const phoneNumber = payload.phoneNumber !== undefined ? (payload.phoneNumber ? payload.phoneNumber.trim() : null) : current.phoneNumber;
    const userType = payload.userType !== undefined ? payload.userType : current.userType;
    const isActive = payload.isActive !== undefined ? payload.isActive : current.isActive;

    const userRes = await pool.query(
      `UPDATE core_auth.users
       SET "fullName" = $1, email = $2, "phoneNumber" = $3, "userType" = $4, "isActive" = $5, "updatedAt" = NOW()
       WHERE id = $6
       RETURNING id, "fullName", email, "phoneNumber", "userType", "isActive", "updatedAt"`,
      [fullName, email, phoneNumber, userType, isActive, id]
    );

    // Update / Upsert HNI Profile jika diberikan
    let hniProfile = null;
    if (payload.hniMemberId !== undefined) {
      if (payload.hniMemberId && payload.hniMemberId.trim()) {
        const hpCheck = await pool.query(
          'SELECT id FROM core_auth.hni_profiles WHERE "userId" = $1',
          [id]
        );
        if (hpCheck.rows.length > 0) {
          const hpUp = await pool.query(
            `UPDATE core_auth.hni_profiles
             SET "hniMemberId" = $1, 
                 "hniMemberName" = $2, 
                 rank = COALESCE($3, rank), 
                 "rankMarketing" = COALESCE($3, "rankMarketing"), 
                 "uplineName" = COALESCE($4, "uplineName"),
                 "isDeleted" = false,
                 "updatedAt" = NOW()
             WHERE "userId" = $5
             RETURNING *`,
            [
              payload.hniMemberId.trim(),
              (payload.hniMemberName || fullName).trim(),
              payload.rank || null,
              payload.uplineName || null,
              id,
            ]
          );
          hniProfile = hpUp.rows[0];
        } else {
          const hniId = crypto.randomUUID();
          const hpIns = await pool.query(
            `INSERT INTO core_auth.hni_profiles
             (id, "userId", "hniMemberId", "hniMemberName", rank, "rankMarketing", "uplineName", "isVerified", "isDeleted", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, true, false, NOW(), NOW())
             RETURNING *`,
            [
              hniId,
              id,
              payload.hniMemberId.trim(),
              (payload.hniMemberName || fullName).trim(),
              payload.rank || 'AB',
              payload.rank || 'AB',
              payload.uplineName || null,
            ]
          );
          hniProfile = hpIns.rows[0];
        }
      }
    }

    // Sync ke store.agents jika ada
    try {
      await pool.query(
        `UPDATE store.agents
         SET name = $1, 
             phone = COALESCE($2, phone), 
             email = COALESCE($3, email),
             status = $4,
             updated_at = NOW()
         WHERE email = $3 OR phone = $2`,
        [fullName, phoneNumber, email, isActive ? 'ACTIVE' : 'INACTIVE']
      );
    } catch (e) {
      // Abaikan sync error
    }

    return {
      user: userRes.rows[0],
      hniProfile,
      message: 'Data pengguna berhasil diperbarui',
    };
  },

  async deleteSystemUser(id: string) {
    const res = await pool.query(
      `UPDATE core_auth.users 
       SET "isDeleted" = true, "isActive" = false, "deletedAt" = NOW(), "updatedAt" = NOW() 
       WHERE id = $1 AND "isDeleted" = false
       RETURNING id`,
      [id]
    );

    if (res.rowCount === 0) {
      throw new AppError('Pengguna tidak ditemukan atau sudah dihapus', 404);
    }

    // Soft delete profil HNI juga
    await pool.query(
      `UPDATE core_auth.hni_profiles 
       SET "isDeleted" = true, "deletedAt" = NOW(), "updatedAt" = NOW() 
       WHERE "userId" = $1`,
      [id]
    );

    return { success: true, message: 'Pengguna berhasil dinonaktifkan/dihapus' };
  },

  async resetSystemUserPassword(id: string, newPassword: string) {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new AppError('Kata sandi baru minimal harus 6 karakter', 400);
    }

    const check = await pool.query(
      'SELECT id, "fullName" FROM core_auth.users WHERE id = $1 AND "isDeleted" = false',
      [id]
    );
    if (check.rows.length === 0) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    await pool.query(
      `UPDATE core_auth.users 
       SET "passwordHash" = $1, "updatedAt" = NOW() 
       WHERE id = $2`,
      [passwordHash, id]
    );

    return {
      success: true,
      message: `Kata sandi untuk pengguna ${check.rows[0].fullName} berhasil diperbarui`,
    };
  },

  // ==========================================
  // 13. MANAJEMEN KONTAK & PESAN PUBLIK
  // ==========================================
  async getContactInfo() {
    const res = await pool.query('SELECT * FROM store.contact_settings WHERE id = $1 LIMIT 1', ['DEFAULT']);
    if (res.rows.length === 0) {
      const defaults = {
        id: 'DEFAULT',
        storeName: 'Business Center HNI 3 Bukittinggi',
        whatsapp: '6281267890123',
        phone: '(0752) 624510',
        email: 'admin@tijarahbc3.id',
        address: 'Jl. Panorama No. 18, Guguk Panjang, Kota Bukittinggi, Sumatera Barat 26116',
        operationalHours: 'Senin - Sabtu: 08:00 - 17:00 WIB',
      };
      await pool.query(
        `INSERT INTO store.contact_settings (id, store_name, whatsapp, phone, email, address, operational_hours)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
        [defaults.id, defaults.storeName, defaults.whatsapp, defaults.phone, defaults.email, defaults.address, defaults.operationalHours]
      );
      return defaults;
    }
    const r = res.rows[0];
    return {
      id: r.id,
      storeName: r.store_name,
      whatsapp: r.whatsapp || '',
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      operationalHours: r.operational_hours || '',
      updatedAt: r.updated_at,
    };
  },

  async updateContactInfo(payload: {
    storeName?: string;
    whatsapp?: string;
    phone?: string;
    email?: string;
    address?: string;
    operationalHours?: string;
  }) {
    await this.getContactInfo();
    const res = await pool.query(
      `UPDATE store.contact_settings
       SET store_name = COALESCE($1, store_name),
           whatsapp = COALESCE($2, whatsapp),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           address = COALESCE($5, address),
           operational_hours = COALESCE($6, operational_hours),
           updated_at = NOW()
       WHERE id = 'DEFAULT'
       RETURNING *`,
      [
        payload.storeName || null,
        payload.whatsapp ?? null,
        payload.phone ?? null,
        payload.email ?? null,
        payload.address ?? null,
        payload.operationalHours ?? null,
      ]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      storeName: r.store_name,
      whatsapp: r.whatsapp || '',
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      operationalHours: r.operational_hours || '',
      updatedAt: r.updated_at,
    };
  },

  async getContactMessages(statusFilter?: string) {
    let query = 'SELECT * FROM store.contact_messages';
    const values: any[] = [];
    if (statusFilter && statusFilter !== 'ALL') {
      query += ' WHERE status = $1';
      values.push(statusFilter);
    }
    query += ' ORDER BY created_at DESC';
    const res = await pool.query(query, values);
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email || '',
      phone: r.phone || '',
      subject: r.subject,
      message: r.message,
      status: r.status || 'NEW',
      adminNotes: r.admin_notes || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async createContactMessage(payload: {
    name: string;
    email?: string;
    phone?: string;
    subject: string;
    message: string;
  }) {
    if (!payload.name?.trim() || !payload.subject?.trim() || !payload.message?.trim()) {
      throw new AppError('Nama, subjek, dan pesan wajib diisi', 400);
    }
    const id = `MSG-${Date.now().toString().slice(-6)}`;
    const res = await pool.query(
      `INSERT INTO store.contact_messages (id, name, email, phone, subject, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'NEW')
       RETURNING *`,
      [
        id,
        payload.name.trim(),
        payload.email?.trim() || null,
        payload.phone?.trim() || null,
        payload.subject.trim(),
        payload.message.trim(),
      ]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email || '',
      phone: r.phone || '',
      subject: r.subject,
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
    };
  },

  async updateContactMessage(id: string, payload: { status?: string; adminNotes?: string }) {
    const res = await pool.query(
      `UPDATE store.contact_messages
       SET status = COALESCE($1, status),
           admin_notes = COALESCE($2, admin_notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [payload.status || null, payload.adminNotes ?? null, id]
    );
    if (res.rows.length === 0) throw new AppError('Pesan kontak tidak ditemukan', 404);
    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email || '',
      phone: r.phone || '',
      subject: r.subject,
      message: r.message,
      status: r.status,
      adminNotes: r.admin_notes || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async deleteContactMessage(id: string) {
    const res = await pool.query('DELETE FROM store.contact_messages WHERE id = $1', [id]);
    if ((res.rowCount ?? 0) === 0) throw new AppError('Pesan kontak tidak ditemukan', 404);
    return { success: true };
  },
};

