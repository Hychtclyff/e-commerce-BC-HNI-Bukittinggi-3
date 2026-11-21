import { env } from './env';
import axios from 'axios';

const XENDIT_BASE_URL = 'https://api.xendit.co';

export const xenditClient = axios.create({
  baseURL: XENDIT_BASE_URL,
  auth: {
    username: env.XENDIT_SECRET_KEY || 'xnd_development_placeholder',
    password: '',
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

export const xenditService = {
  async createInvoice(payload: {
    externalId: string;
    amount: number;
    description: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    items: Array<{ name: string; price: number; quantity: number }>;
    successUrl?: string;
    failureUrl?: string;
    paymentMethods?: string[];
  }) {
    try {
      const invoicePayload: Record<string, any> = {
        external_id: payload.externalId,
        amount: payload.amount,
        description: payload.description,
        invoice_duration: 86400, // 24 jam
        customer: {
          given_names: payload.customerName,
          email: payload.customerEmail,
          mobile_number: payload.customerPhone,
        },
        items: payload.items,
        success_redirect_url: payload.successUrl || `${env.FRONTEND_URL}/id/checkout?status=paid&externalId=${payload.externalId}`,
        failure_redirect_url: payload.failureUrl || `${env.FRONTEND_URL}/id/checkout?status=failed&externalId=${payload.externalId}`,
      };

      if (payload.paymentMethods && payload.paymentMethods.length > 0) {
        invoicePayload.payment_methods = payload.paymentMethods;
      }

      const response = await xenditClient.post('/v2/invoices', invoicePayload);

      return {
        invoiceId: response.data.id,
        invoiceUrl: response.data.invoice_url,
        expiryDate: response.data.expiry_date,
        status: response.data.status,
      };
    } catch (error: any) {
      console.error('❌ Xendit Create Invoice Error:', error?.response?.data || error.message);
      throw new Error(error?.response?.data?.message || 'Gagal membuat invoice pembayaran Xendit');
    }
  },

  async getInvoice(invoiceId: string) {
    try {
      const response = await xenditClient.get(`/v2/invoices/${invoiceId}`);
      return {
        invoiceId: response.data.id,
        externalId: response.data.external_id,
        status: response.data.status, // PENDING, PAID, SETTLED, EXPIRED
        amount: response.data.amount,
        paymentMethod: response.data.payment_method,
        paymentChannel: response.data.payment_channel,
        paidAt: response.data.paid_at,
        invoiceUrl: response.data.invoice_url,
        expiryDate: response.data.expiry_date,
      };
    } catch (error: any) {
      console.error('❌ Xendit Get Invoice Error:', error?.response?.data || error.message);
      throw new Error(error?.response?.data?.message || 'Gagal memeriksa invoice Xendit');
    }
  },

  async createQRIS(payload: { externalId: string; amount: number }) {
    try {
      const isLocal = env.BACKEND_URL.includes('localhost') || env.BACKEND_URL.includes('127.0.0.1');
      const callbackUrl = isLocal ? 'https://api.tijarah.co/api/v1/payments/webhook' : `${env.BACKEND_URL}/api/v1/payments/webhook`;

      const response = await xenditClient.post('/qr_codes', {
        external_id: payload.externalId,
        type: 'DYNAMIC',
        amount: payload.amount,
        currency: 'IDR',
        callback_url: callbackUrl,
      });

      return {
        qrId: response.data.id,
        qrString: response.data.qr_string,
        status: response.data.status,
      };
    } catch (error: any) {
      console.error('❌ Xendit Create QRIS Error:', error?.response?.data || error.message);
      throw new Error(error?.response?.data?.message || 'Gagal membuat QRIS Xendit');
    }
  },

  async createFixedVA(payload: {
    externalId: string;
    bankCode: string;
    name: string;
    amount: number;
    expirationDate?: string;
  }) {
    try {
      const response = await xenditClient.post('/callback_virtual_accounts', {
        external_id: payload.externalId,
        bank_code: payload.bankCode,
        name: payload.name.slice(0, 30),
        is_closed: true,
        expected_amount: payload.amount,
        expiration_date: payload.expirationDate || new Date(Date.now() + 86400000).toISOString(),
      });

      return {
        id: response.data.id,
        accountNumber: response.data.account_number,
        bankCode: response.data.bank_code,
        merchantCode: response.data.merchant_code,
        name: response.data.name,
        expectedAmount: response.data.expected_amount,
        expirationDate: response.data.expiration_date,
        status: response.data.status,
      };
    } catch (error: any) {
      console.error('❌ Xendit Create Fixed VA Error:', error?.response?.data || error.message);
      throw new Error(error?.response?.data?.message || 'Gagal membuat Virtual Account Xendit');
    }
  },
};

