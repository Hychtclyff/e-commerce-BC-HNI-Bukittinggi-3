import nodemailer from 'nodemailer';
import { env } from '@/config/env';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(env.SMTP_PORT) || 587,
    secure: Number(env.SMTP_PORT) === 465,
    auth: env.SMTP_USER && env.SMTP_PASS ? {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    } : undefined,
  });

  static async sendReceiptEmail(toEmail: string, orderNumber: string, htmlContent: string) {
    if (!toEmail) {
      console.warn("⚠️ Email penerima kosong, pengiriman email dibatalkan.");
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: env.SMTP_FROM || '"BC HNI 3 Bukittinggi" <noreply@tijarah.co>',
        to: toEmail,
        subject: `[Resi Resmi] Konfirmasi Pembayaran Pesanan #${orderNumber}`,
        html: htmlContent,
      });
      console.log(`✅ Email resi berhasil dikirim ke ${toEmail}: ${info.messageId}`);
      return info;
    } catch (error: any) {
      console.error(`❌ Gagal mengirim email ke ${toEmail}:`, error.message);
      // Jangan lempar error agar proses pembayaran utama tidak terganggu jika SMTP belum dikonfigurasi penuh
    }
  }
}
