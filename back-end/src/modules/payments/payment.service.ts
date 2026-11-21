import { db } from "@/prisma/db";
import { AppError } from "@/utils/AppError";
import { SupportedLanguage, t } from "@/i18n";
import { xenditService } from "@/config/xendit";
import { EmailService } from '@/services/email.service';
import { notificationsService } from "../notifications/notifications.service";
import { paymentEvents } from "./paymentEvents";
import ejs from 'ejs';
import path from 'path';

const paymentsOrm = (db.orm as any).payments;

export const paymentService = {
  async handleXenditWebhook(payload: any, signatureHeader?: string, lang: SupportedLanguage = 'id') {
    try {
      const externalId = payload.external_id; // order number atau order id
      const status = payload.status || payload.event;
      const xenditPaymentId = payload.id;

      if (!externalId) {
        throw new AppError('Invalid webhook payload: missing external_id', 400);
      }

      // Cari order berdasarkan orderNumber atau id
      let order = await db.orm.orders.Order.where({ orderNumber: externalId }).first();
      if (!order) {
        order = await db.orm.orders.Order.where({ id: externalId }).first();
      }

      if (!order) {
        throw new AppError(`Order not found for external_id: ${externalId}`, 404);
      }

      // Cegah duplikasi webhook (Idempotency check pada PaymentLog)
      const existingLog = await paymentsOrm?.PaymentLog.where({
        orderId: order.id,
        eventType: `xendit.${status.toLowerCase()}`,
      }).first();

      if (existingLog) {
        return { success: true, message: 'Webhook already processed (Idempotent)' };
      }

      let newPaymentStatus = order.paymentStatus;
      let newOrderStatus = order.orderStatus;

      if (status === 'PAID' || status === 'COMPLETED' || status === 'invoice.paid' || status === 'SETTLED') {
        newPaymentStatus = 'PAID';
        newOrderStatus = 'PROCESSING';

        // Update Order
        await db.orm.orders.Order
          .where({ id: order.id })
          .update({
            paymentStatus: newPaymentStatus,
            orderStatus: newOrderStatus,
          });

        paymentEvents.emitOrderUpdated({
          orderId: order.id,
          slug: order.slug,
          orderNumber: order.orderNumber,
          paymentStatus: newPaymentStatus,
          orderStatus: newOrderStatus,
          updatedAt: new Date().toISOString(),
        });

        // Catat Payment Log
        await paymentsOrm?.PaymentLog.create({
          orderId: order.id,
          eventType: 'xendit.paid',
          payload: JSON.stringify(payload),
        });

        // Generate Resi Otomatis
        await paymentService.generateReceipt(order.id, lang);

        // Kirim Notifikasi
        await notificationsService.createNotification({
          userId: order.userId,
          title: "Pembayaran Berhasil",
          message: `Pembayaran untuk pesanan ${order.orderNumber} telah diterima via Xendit. Pesanan sedang dipersiapkan toko.`,
          category: "ORDER_STATUS",
          referenceId: order.id,
        });
      } else if (status === 'EXPIRED' || status === 'invoice.expired') {
        newPaymentStatus = 'EXPIRED';
        newOrderStatus = 'CANCELLED';

        await db.orm.orders.Order
          .where({ id: order.id })
          .update({
            paymentStatus: newPaymentStatus,
            orderStatus: newOrderStatus,
          });

        paymentEvents.emitOrderUpdated({
          orderId: order.id,
          slug: order.slug,
          orderNumber: order.orderNumber,
          paymentStatus: newPaymentStatus,
          orderStatus: newOrderStatus,
          updatedAt: new Date().toISOString(),
        });

        await paymentsOrm?.PaymentLog.create({
          orderId: order.id,
          eventType: 'xendit.expired',
          payload: JSON.stringify(payload),
        });

        await notificationsService.createNotification({
          userId: order.userId,
          title: "Pembayaran Kedaluwarsa",
          message: `Masa berlaku pembayaran untuk pesanan ${order.orderNumber} telah habis. Pesanan dibatalkan otomatis.`,
          category: "ORDER_STATUS",
          referenceId: order.id,
        });
      }

      return { success: true, orderId: order.id, paymentStatus: newPaymentStatus };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(t('checkout.payment_failed', { message: error.message }, lang), 500);
    }
  },

  async confirmManualTransfer(orderId: string, adminUserId: string, bankName: string, lang: SupportedLanguage = 'id') {
    try {
      const order = await db.orm.orders.Order.where({ id: orderId }).first();
      if (!order) {
        throw new AppError(t('checkout.order_not_found', {}, lang), 404);
      }

      if (order.paymentStatus === 'PAID') {
        throw new AppError('Pesanan ini sudah berstatus LUNAS.', 400);
      }

      await db.orm.orders.Order
        .where({ id: order.id })
        .update({
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          transferBankName: bankName,
          transferConfirmedAt: new Date().toISOString(),
          transferConfirmedBy: adminUserId,
        } as any);

      paymentEvents.emitOrderUpdated({
        orderId: order.id,
        slug: order.slug,
        orderNumber: order.orderNumber,
        paymentStatus: 'PAID',
        orderStatus: 'PROCESSING',
        updatedAt: new Date().toISOString(),
      });

      await paymentsOrm?.PaymentLog.create({
        orderId: order.id,
        eventType: 'manual.transfer_confirmed',
        payload: JSON.stringify({ adminUserId, bankName }),
      });

      // Generate Receipt
      await paymentService.generateReceipt(order.id, lang);

      await notificationsService.createNotification({
        userId: order.userId,
        title: "Transfer Manual Dikonfirmasi",
        message: `Pembayaran transfer manual via ${bankName} untuk pesanan ${order.orderNumber} telah dikonfirmasi oleh Admin.`,
        category: "ORDER_STATUS",
        referenceId: order.id,
      });

      return { success: true, orderId: order.id };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(t('checkout.approve_failed', { message: error.message }, lang), 500);
    }
  },

  async confirmCod(orderId: string, courierUserId: string, signature: string, lang: SupportedLanguage = 'id') {
    try {
      const order = await db.orm.orders.Order.where({ id: orderId }).first();
      if (!order) {
        throw new AppError(t('checkout.order_not_found', {}, lang), 404);
      }

      await db.orm.orders.Order
        .where({ id: order.id })
        .update({
          paymentStatus: 'PAID',
          orderStatus: 'COMPLETED',
          codConfirmedAt: new Date().toISOString(),
          codConfirmedBy: courierUserId,
          codReceivedSignature: signature,
        } as any);

      paymentEvents.emitOrderUpdated({
        orderId: order.id,
        slug: order.slug,
        orderNumber: order.orderNumber,
        paymentStatus: 'PAID',
        orderStatus: 'COMPLETED',
        updatedAt: new Date().toISOString(),
      });

      await paymentsOrm?.PaymentLog.create({
        orderId: order.id,
        eventType: 'cod.confirmed',
        payload: JSON.stringify({ courierUserId }),
      });

      await paymentService.generateReceipt(order.id, lang);

      await notificationsService.createNotification({
        userId: order.userId,
        title: "Pesanan COD Diterima",
        message: `Pembayaran COD untuk pesanan ${order.orderNumber} telah diterima oleh kurir. Pesanan selesai.`,
        category: "ORDER_STATUS",
        referenceId: order.id,
      });

      return { success: true, orderId: order.id };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(t('checkout.approve_failed', { message: error.message }, lang), 500);
    }
  },

  async generateReceipt(orderId: string, lang: SupportedLanguage = 'id') {
    try {
      const order = await db.orm.orders.Order.where({ id: orderId }).first();
      if (!order) {
        throw new AppError(t('checkout.order_not_found', {}, lang), 404);
      }

      const user = await db.orm.core_auth.User.where({ id: order.userId }).first();
      const items = await db.orm.orders.OrderItem.where({ orderId: order.id }).all();

      const receiptNumber = `RCP/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/BC3-${Math.floor(1000 + Math.random() * 9000)}`;

      // Render HTML template for receipt
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Resi Pesanan #${order.orderNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 20px; background: #f8faf7; }
            .receipt-box { max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { border-bottom: 2px solid #6B8E6F; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 22px; font-weight: bold; color: #6B8E6F; }
            .receipt-info { font-size: 14px; color: #64748b; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .items-table th { background: #f1f5f9; color: #334155; font-weight: 600; }
            .total-section { margin-top: 20px; text-align: right; font-size: 15px; }
            .total-section .total { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 5px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div class="logo">🌿 Tijarah - BC HNI 3 Bukittinggi</div>
              <div class="receipt-info">Resi: <strong>${receiptNumber}</strong></div>
            </div>

            <div>
              <h3>Detail Pesanan</h3>
              <p><strong>No. Pesanan:</strong> ${order.orderNumber}</p>
              <p><strong>Nama Pelanggan:</strong> ${user?.fullName || 'Pelanggan'}</p>
              <p><strong>Tanggal:</strong> ${new Date(order.createdAt).toLocaleString('id-ID')}</p>
              <p><strong>Metode Pembayaran:</strong> ${order.paymentMethod}</p>
              <p><strong>Status Pembayaran:</strong> <span style="color: #16a34a; font-weight: bold;">${order.paymentStatus}</span></p>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Qty</th>
                  <th>Harga Satuan</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.qty}</td>
                    <td>Rp ${item.unitPrice.toLocaleString('id-ID')}</td>
                    <td>Rp ${item.totalPrice.toLocaleString('id-ID')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-section">
              <p>Subtotal: Rp ${order.subtotal.toLocaleString('id-ID')}</p>
              <p>Ongkir: Rp ${order.shippingCost.toLocaleString('id-ID')}</p>
              ${order.discountAmount > 0 ? `<p>Diskon: -Rp ${order.discountAmount.toLocaleString('id-ID')}</p>` : ''}
              <div class="total">Total Akhir: Rp ${order.totalAmount.toLocaleString('id-ID')}</div>
            </div>

            <div class="footer">
              <p>Terima kasih telah berbelanja di Tijarah Store Bukittinggi.</p>
              <p>Simpan resi ini sebagai bukti transaksi yang sah.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Simpan ke database payment_receipts
      const existingReceipt = await paymentsOrm?.PaymentReceipt.where({ orderId: order.id }).first();
      let receipt;

      if (!existingReceipt) {
        receipt = await paymentsOrm?.PaymentReceipt.create({
          orderId: order.id,
          receiptNumber,
          receiptHtml: htmlContent,
          recipientEmail: user?.email || '',
          recipientPhone: user?.phoneNumber || '',
        });
      } else {
        receipt = await paymentsOrm?.PaymentReceipt
          .where({ id: existingReceipt.id })
          .update({
            receiptHtml: htmlContent,
          });
      }

      // Update Order receipt URL reference jika didukung
      try {
        await db.orm.orders.Order
          .where({ id: order.id })
          .update({
            receiptUrl: `/api/v1/payments/receipt/${order.id}`,
            receiptGeneratedAt: new Date().toISOString(),
          } as any);
      } catch (e) {
        // Abaikan jika kolom receiptUrl belum ada di schema orders
      }

      // Kirim email resi resmi ke email asli user
      if (user?.email) {
        try {
          await EmailService.sendReceiptEmail(user.email, order.orderNumber, htmlContent);
        } catch (mailErr: any) {
          console.error("❌ Gagal mengirim email resi ke user:", mailErr.message);
        }
      }

      return receipt;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Gagal membuat resi: ${error.message}`, 500);
    }
  },

  async syncOrderPaymentWithXendit(orderId: string, lang: SupportedLanguage = 'id') {
    try {
      let order = await db.orm.orders.Order.where({ id: orderId }).first();
      if (!order) {
        order = await db.orm.orders.Order.where({ slug: orderId }).first();
      }
      if (!order) {
        order = await db.orm.orders.Order.where({ orderNumber: orderId }).first();
      }

      if (!order) {
        throw new AppError(t('checkout.order_not_found', {}, lang), 404);
      }

      let invoiceId: string | undefined;
      if (order.notes && order.notes.startsWith('{') && order.notes.includes('xenditInvoiceId')) {
        try {
          const parsed = JSON.parse(order.notes);
          invoiceId = parsed.xenditInvoiceId;
        } catch (e) {
          // parse error
        }
      }

      if (!invoiceId) {
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          isSynced: false,
        };
      }

      const xenditInvoice = await xenditService.getInvoice(invoiceId);

      if (xenditInvoice.status === 'PAID' || xenditInvoice.status === 'SETTLED') {
        if (order.paymentStatus !== 'PAID') {
          await db.orm.orders.Order
            .where({ id: order.id })
            .update({
              paymentStatus: 'PAID',
              orderStatus: 'PROCESSING',
            });

          paymentEvents.emitOrderUpdated({
            orderId: order.id,
            slug: order.slug,
            orderNumber: order.orderNumber,
            paymentStatus: 'PAID',
            orderStatus: 'PROCESSING',
            updatedAt: new Date().toISOString(),
          });

          try {
            await paymentService.generateReceipt(order.id, lang);
          } catch (e) {
            console.error('Receipt generation error:', e);
          }

          await notificationsService.createNotification({
            userId: order.userId,
            title: 'Pembayaran Dikonfirmasi via Xendit',
            message: `Pembayaran untuk pesanan ${order.orderNumber} telah terverifikasi via Xendit. Pesanan sedang menunggu persetujuan toko.`,
            category: 'ORDER_STATUS',
            referenceId: order.id,
          });
        }

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          isSynced: true,
        };
      } else if (xenditInvoice.status === 'EXPIRED') {
        if (order.paymentStatus !== 'EXPIRED') {
          await db.orm.orders.Order
            .where({ id: order.id })
            .update({
              paymentStatus: 'EXPIRED',
              orderStatus: 'CANCELLED',
            });
        }

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: 'EXPIRED',
          orderStatus: 'CANCELLED',
          isSynced: true,
        };
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        isSynced: false,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Gagal sync status Xendit: ${error.message}`, 500);
    }
  },
};
