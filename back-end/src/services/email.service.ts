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

    // In development without configured SMTP, log & preview cleanly without hitting external SMTP rate limits
    if (env.NODE_ENV !== 'production' && (!env.SMTP_USER || !env.SMTP_PASS)) {
      console.info(
        `📧 [DEV EMAIL PREVIEW] Order #${orderNumber} -> ${toEmail} (SMTP belum dikonfigurasi, resi HTML ${htmlContent.length} bytes siap dikirim)`
      );
      return { messageId: `dev-preview-${orderNumber}`, preview: true };
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

  static async sendPasswordResetEmail(toEmail: string, resetUrl: string, fullName?: string | null) {
    if (!toEmail) return;
    try {
      const info = await this.transporter.sendMail({
        from: env.SMTP_FROM || '"BC HNI 3 Bukittinggi" <noreply@tijarah.co>',
        to: toEmail,
        subject: '[Tijarah] Permintaan Reset Password Akun Anda',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4d6b53; margin-top: 0;">Reset Password Tijarah</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              Halo ${fullName || 'Sahabat Tijarah'}, kami menerima permintaan untuk mengatur ulang password akun Anda.
            </p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #4d6b53; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Atur Ulang Password
              </a>
            </p>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
              Tautan ini berlaku selama 1 jam. Jika Anda tidak merasa meminta reset password, abaikan email ini.
            </p>
          </div>
        `,
      });
      return info;
    } catch (error: any) {
      console.error(`❌ Gagal mengirim email reset password ke ${toEmail}:`, error.message);
    }
  }
}
