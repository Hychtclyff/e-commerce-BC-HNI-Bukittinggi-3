import { FastifyRequest, FastifyReply } from 'fastify';
import { storeService } from './store.service';
import { hsisDispatcher } from './hsis/hsis.dispatcher';
import { hsisSyncService } from './hsisSync.service';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';
import { dispatchVerificationFlow } from '../orders/verificationFlows';
import { getLanguageFromRequest, t } from '@/i18n';
import { shippingRatesService } from '../checkout/shippingRates.service';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { supabase } from '@/plugins/supabase';

async function extractActorFromRequest(req: FastifyRequest): Promise<{ userId?: string; fullName?: string }> {
  const reqUser = (req as any).user;
  if (reqUser?.id || reqUser?.userId) {
    return {
      userId: String(reqUser.id || reqUser.userId),
      fullName: reqUser.fullName || reqUser.name,
    };
  }

  const authHeader = req.headers.authorization;
  const cookieToken = (req as any).cookies?.access_token || (req as any).cookies?.token;
  const rawToken =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.replace(/^Bearer\s+/i, '').trim()
      : cookieToken
        ? String(cookieToken).trim()
        : '';

  if (rawToken) {
    try {
      const decoded = jwt.verify(rawToken, env.JWT_SECRET) as any;
      const userId = decoded?.userId || decoded?.sub || decoded?.id;
      if (userId) {
        return {
          userId: String(userId),
          fullName: decoded?.fullName || decoded?.name,
        };
      }
    } catch {
      try {
        const { data: supaUser } = await supabase.auth.getUser(rawToken);
        if (supaUser?.user?.id) {
          return {
            userId: supaUser.user.id,
            fullName:
              supaUser.user.user_metadata?.full_name ||
              supaUser.user.user_metadata?.name,
          };
        }
      } catch {
        // ignore invalid token
      }
    }

    // Fallback: decode JWT payload (e.g. Supabase JWT when auth.getUser is unreachable)
    try {
      const decoded = jwt.decode(rawToken) as any;
      const decodedId = decoded?.userId || decoded?.sub || decoded?.id;
      if (decodedId) {
        return {
          userId: String(decodedId),
          fullName:
            decoded?.fullName ||
            decoded?.name ||
            decoded?.user_metadata?.full_name ||
            decoded?.user_metadata?.name,
        };
      }
    } catch {
      // ignore decode error
    }
  }

  const body = (req.body as any) || {};
  return {
    userId: body.actorUserId || (req.headers['x-user-id'] as string | undefined),
    fullName: body.actorName || (req.headers['x-user-name'] as string | undefined),
  };
}

export const storeController = {
  // Metrics
  async getMetrics(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getMetrics();
      return responseUtil.success({ reply, message: 'Berhasil memuat metrik toko', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Orders
  async getOrders(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getOrders();
      return responseUtil.success({ reply, message: 'Berhasil memuat daftar pesanan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createPosOrder(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await storeService.createPosOrder(req.body as any);
      return responseUtil.created({ reply, message: 'Transaksi kasir POS berhasil dicatat', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async approveOrder(req: FastifyRequest<{ Params: { id: string }; Body: { notes?: string } }>, reply: FastifyReply) {
    try {
      const lang = getLanguageFromRequest(req);
      const actor = await extractActorFromRequest(req);
      const data = await storeService.approveOrder(req.params.id, req.body?.notes, actor, lang);
      return responseUtil.success({ reply, message: 'Pesanan berhasil disetujui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async shipOrder(req: FastifyRequest<{ Params: { id: string }; Body: { courierName: string; trackingNumber: string; notes?: string } }>, reply: FastifyReply) {
    try {
      const lang = getLanguageFromRequest(req);
      const actor = await extractActorFromRequest(req);
      const data = await storeService.shipOrder(req.params.id, req.body, actor, lang);
      return responseUtil.success({ reply, message: 'Pesanan berhasil dikirimkan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async confirmDelivered(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.confirmDelivered(req.params.id);
      return responseUtil.success({ reply, message: 'Pesanan dikonfirmasi diterima', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async completeOrder(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const lang = getLanguageFromRequest(req);
      const actor = await extractActorFromRequest(req);
      const data = await storeService.completeOrder(req.params.id, actor, lang);
      return responseUtil.success({ reply, message: 'Pesanan berhasil diselesaikan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async setReadyForPickup(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const lang = getLanguageFromRequest(req);
      const actor = await extractActorFromRequest(req);
      const data = await storeService.setReadyForPickup(req.params.id, actor, lang);
      return responseUtil.success({ reply, message: 'Pesanan siap diambil oleh pembeli', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async rejectOrder(req: FastifyRequest<{ Params: { id: string }; Body: { reason: string } }>, reply: FastifyReply) {
    try {
      const lang = getLanguageFromRequest(req);
      const actor = await extractActorFromRequest(req);
      const data = await storeService.rejectOrder(req.params.id, req.body?.reason || 'Stok tidak mencukupi', actor, lang);
      return responseUtil.success({ reply, message: 'Pesanan ditolak', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async executeVerificationFlow(
    req: FastifyRequest<{ Params: { id: string }; Body: { flowType: string; [key: string]: any } }>,
    reply: FastifyReply
  ) {
    try {
      const { flowType, ...payload } = req.body || {};
      const data = await dispatchVerificationFlow(flowType as any, req.params.id, payload);
      return responseUtil.success({ reply, message: data.message, data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Inventory
  async getInventory(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getInventory();
      return responseUtil.success({ reply, message: 'Berhasil memuat inventori', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createInventory(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.createInventory(req.body);
      return responseUtil.created({ reply, message: 'SKU inventori baru berhasil ditambahkan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateInventory(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.updateInventory(req.params.id, req.body);
      return responseUtil.success({ reply, message: 'Inventori berhasil diperbarui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteInventory(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await storeService.deleteInventory(req.params.id);
      return responseUtil.success({ reply, message: 'Inventori berhasil dihapus' });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async breakdownProduct(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await storeService.breakdownProduct(req.body as any);
      return responseUtil.success({ reply, message: data.message, data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async reconcileProductPoints(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await storeService.reconcileProductPoints(req.body as any);
      return responseUtil.success({ reply, message: data.message, data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Devices
  async getDevices(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getDevices();
      return responseUtil.success({ reply, message: 'Berhasil memuat perangkat POS', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createDevice(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.createDevice(req.body);
      return responseUtil.created({ reply, message: 'Perangkat berhasil ditambahkan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateDevice(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.updateDevice(req.params.id, req.body);
      return responseUtil.success({ reply, message: 'Perangkat berhasil diperbarui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteDevice(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await storeService.deleteDevice(req.params.id);
      return responseUtil.success({ reply, message: 'Perangkat berhasil dihapus' });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Delivery Methods
  async getDeliveryMethods(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getDeliveryMethods();
      return responseUtil.success({ reply, message: 'Berhasil memuat daftar metode pengiriman', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async getDeliveryMethodById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.getDeliveryMethodById(req.params.id);
      return responseUtil.success({ reply, message: 'Berhasil memuat detail metode pengiriman', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createDeliveryMethod(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.createDeliveryMethod(req.body);
      return responseUtil.created({ reply, message: 'Metode pengiriman berhasil ditambahkan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateDeliveryMethod(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.updateDeliveryMethod(req.params.id, req.body);
      return responseUtil.success({ reply, message: 'Metode pengiriman berhasil diperbarui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteDeliveryMethod(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await storeService.deleteDeliveryMethod(req.params.id);
      return responseUtil.success({ reply, message: 'Metode pengiriman berhasil dihapus' });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async resetDeliveryMethods(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.resetDeliveryMethods();
      return responseUtil.success({ reply, message: 'Metode pengiriman berhasil direset ke standar 2-flow', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async calculateShippingRates(req: FastifyRequest, reply: FastifyReply) {
    try {
      const methods = await storeService.getDeliveryMethods();
      const quotes = await shippingRatesService.calculateDynamicRates(methods, (req.body as any) || {});
      return responseUtil.success({
        reply,
        message: 'Dynamic shipping rates calculated',
        data: quotes,
      });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Agents
  async getAgents(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getAgents();
      return responseUtil.success({ reply, message: 'Berhasil memuat daftar staf & agen', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createAgent(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.createAgent(req.body);
      return responseUtil.created({ reply, message: 'Staf agen berhasil ditambahkan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateAgent(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.updateAgent(req.params.id, req.body);
      return responseUtil.success({ reply, message: 'Data agen berhasil diperbarui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteAgent(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await storeService.deleteAgent(req.params.id);
      return responseUtil.success({ reply, message: 'Agen berhasil dihapus' });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async setAgentPassword(req: FastifyRequest<{ Params: { id: string }; Body: { newPassword: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.setAgentPassword(req.params.id, req.body.newPassword);
      return responseUtil.success({ reply, message: 'Kata sandi agen berhasil diperbarui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async syncSelfAgent(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req.body as any)?.userId || (req.query as any)?.userId || (req as any).user?.id;
      const data = await storeService.syncSelfAgent(userId);
      return responseUtil.success({ reply, message: data.message, data: data.data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async getAgentNetwork(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req.query as any)?.userId || (req as any).user?.id;
      const data = await storeService.getAgentNetwork(userId);
      return responseUtil.success({ reply, message: 'Berhasil memuat jaringan agen', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async importAgentsCsv(req: FastifyRequest<{ Body: { items: any[] } }>, reply: FastifyReply) {
    try {
      const items = (req.body as any)?.items || req.body;
      const data = await storeService.importAgentsCsv(items);
      return responseUtil.success({ reply, message: data.message, data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // System Users Management (All Registered Users)
  async getSystemUsers(req: FastifyRequest, reply: FastifyReply) {
    try {
      const query = req.query as any;
      const data = await storeService.getSystemUsers(query || {});
      return responseUtil.success({ reply, message: 'Berhasil memuat daftar seluruh pengguna sistem', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async getSystemUserDetail(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.getSystemUserDetail(req.params.id);
      return responseUtil.success({ reply, message: 'Berhasil memuat detail pengguna', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createSystemUser(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.createSystemUser(req.body as any);
      return responseUtil.created({ reply, message: data.message, data: data.user });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateSystemUser(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.updateSystemUser(req.params.id, req.body as any);
      return responseUtil.success({ reply, message: data.message, data: data.user });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteSystemUser(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.deleteSystemUser(req.params.id);
      return responseUtil.success({ reply, message: data.message });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async resetSystemUserPassword(
    req: FastifyRequest<{ Params: { id: string }; Body: { newPassword: string } }>,
    reply: FastifyReply
  ) {
    try {
      const data = await storeService.resetSystemUserPassword(req.params.id, req.body.newPassword);
      return responseUtil.success({ reply, message: data.message });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Merchants & Non-HNI
  async getMerchants(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getMerchants();
      return responseUtil.success({ reply, message: 'Berhasil memuat daftar gerai merchant', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createMerchant(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.createMerchant(req.body);
      return responseUtil.created({ reply, message: 'Gerai mitra berhasil ditambahkan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateMerchant(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.updateMerchant(req.params.id, req.body);
      return responseUtil.success({ reply, message: 'Data gerai berhasil diperbarui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteMerchant(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await storeService.deleteMerchant(req.params.id);
      return responseUtil.success({ reply, message: 'Gerai berhasil dihapus' });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async getNonHniProducts(req: FastifyRequest, reply: FastifyReply) {
    const lang = getLanguageFromRequest(req);
    try {
      const data = await storeService.getNonHniProducts();
      return responseUtil.success({ reply, message: t('products.non_hni_fetched', {}, lang), data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createNonHniProduct(req: FastifyRequest, reply: FastifyReply) {
    const lang = getLanguageFromRequest(req);
    try {
      const data = await storeService.createNonHniProduct(req.body);
      return responseUtil.created({
        reply,
        message: t('products.non_hni_created', { name: data?.name || '' }, lang),
        data,
      });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateNonHniProduct(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const lang = getLanguageFromRequest(req);
    try {
      const data = await storeService.updateNonHniProduct(req.params.id, req.body);
      return responseUtil.success({
        reply,
        message: t('products.non_hni_updated', { name: data?.name || '' }, lang),
        data,
      });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteNonHniProduct(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const lang = getLanguageFromRequest(req);
    try {
      await storeService.deleteNonHniProduct(req.params.id);
      return responseUtil.success({ reply, message: t('products.non_hni_deleted', {}, lang) });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // E-Signatures
  async getEsignatures(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getEsignatures();
      return responseUtil.success({ reply, message: 'Berhasil memuat tanda tangan digital', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createEsignature(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.createEsignature(req.body);
      return responseUtil.created({ reply, message: 'Tanda tangan barcode berhasil dibuat', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteEsignature(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await storeService.deleteEsignature(req.params.id);
      return responseUtil.success({ reply, message: 'Tanda tangan berhasil dicabut' });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Product Knowledge & Testimonials
  async getProductKnowledge(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getProductKnowledge();
      return responseUtil.success({ reply, message: 'Berhasil memuat katalog khasiat produk', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createProductKnowledge(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.createProductKnowledge(req.body);
      return responseUtil.created({ reply, message: 'Katalog khasiat berhasil didaftarkan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateProductKnowledge(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.updateProductKnowledge(req.params.id, req.body);
      return responseUtil.success({ reply, message: 'Katalog khasiat berhasil diperbarui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteProductKnowledge(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await storeService.deleteProductKnowledge(req.params.id);
      return responseUtil.success({ reply, message: 'Katalog khasiat berhasil dihapus' });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async batchUpdateProductKnowledge(req: FastifyRequest, reply: FastifyReply) {
    try {
      const items = Array.isArray(req.body) ? req.body : (req.body as any)?.items || [];
      const data = await storeService.batchUpdateProductKnowledge(items);
      return responseUtil.success({ reply, message: 'Batch update katalog khasiat berhasil', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createTestimonial(req: FastifyRequest<{ Params: { productId: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.createTestimonial(req.params.productId, req.body);
      return responseUtil.created({ reply, message: 'Testimoni konsumen berhasil disimpan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteTestimonial(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await storeService.deleteTestimonial(req.params.id);
      return responseUtil.success({ reply, message: 'Testimoni berhasil dihapus' });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // HSIS Dynamic Endpoints (Poin 8)
  async getHsisEndpoints(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await hsisDispatcher.listEndpoints();
      return responseUtil.success({ reply, message: 'Berhasil memuat endpoint dinamis HSIS', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createHsisEndpoint(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await hsisDispatcher.createEndpoint(req.body as any);
      return responseUtil.created({ reply, message: 'Endpoint dinamis HSIS berhasil didaftarkan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateHsisEndpoint(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await hsisDispatcher.updateEndpoint(req.params.id, req.body as any);
      return responseUtil.success({ reply, message: 'Endpoint dinamis HSIS berhasil diperbarui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteHsisEndpoint(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await hsisDispatcher.deleteEndpoint(req.params.id);
      return responseUtil.success({ reply, message: 'Endpoint dinamis HSIS berhasil dihapus' });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async dispatchHsisEndpoint(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const result = await hsisDispatcher.dispatchById(req.params.id, req.body);
      return responseUtil.success({ reply, message: 'Eksekusi controller HSIS berhasil', data: result });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async getHsisControllers(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = hsisDispatcher.getAvailableControllers();
      return responseUtil.success({ reply, message: 'Daftar controller HSIS yang terdaftar di back-end', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Otomasi Python HSIS (Poin 7)
  async triggerHsisAutoLogin(req: FastifyRequest<{ Body: { username?: string; password?: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.runHsisAutoLogin(req.body?.username, req.body?.password);
      return responseUtil.success({ reply, message: data.message, data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async saveHsisToken(req: FastifyRequest<{ Body: { token: string; cookie?: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.saveHsisToken(req.body?.token, 'MANUAL_TOKEN', req.body?.cookie);
      return responseUtil.success({ reply, message: 'Token HSIS berhasil disimpan dan diaktifkan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async testHsisConnection(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.testHsisConnection();
      return responseUtil.success({ reply, message: data.message, data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Ekspedisi & Shipments
  async getShipments(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getShipments();
      return responseUtil.success({ reply, message: 'Berhasil memuat daftar pengiriman ekspedisi', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // CRM & Pelanggan
  async getCustomers(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getCustomers();
      return responseUtil.success({ reply, message: 'Berhasil memuat data pelanggan toko', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Stock Velocity
  async getStockVelocity(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getStockVelocity();
      return responseUtil.success({ reply, message: 'Berhasil memuat analisis perputaran stok', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Restock Recommendations
  async getRestockRecommendations(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getRestockRecommendations();
      return responseUtil.success({ reply, message: 'Berhasil memuat rekomendasi restock', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Rekonsiliasi
  async getReconciliation(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getReconciliation();
      return responseUtil.success({ reply, message: 'Berhasil memuat data rekonsiliasi gerai', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Sesi HSIS
  async getHsisSession(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getHsisSession();
      return responseUtil.success({ reply, message: 'Berhasil memuat status sesi gateway HSIS', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Tren Penyakit
  async getDiseaseTrends(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getDiseaseTrends();
      return responseUtil.success({ reply, message: 'Berhasil memuat tren keluhan penyakit & rekomendasi herbal', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // POS Devices Ping (Poin 7)
  async pingDevice(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.pingDevice(req.params.id);
      return responseUtil.success({ reply, message: 'Ping perangkat POS berhasil', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async checkDevicesStatus(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.checkAllDevicesStatus();
      return responseUtil.success({ reply, message: 'Pengecekan status realtime seluruh perangkat POS selesai', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Purchase Order (PO) HSIS & Cek Barang Datang (Poin 6)
  async getHsisPurchaseOrders(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getHsisPurchaseOrders();
      return responseUtil.success({ reply, message: 'Berhasil memuat daftar Purchase Order HSIS', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async syncHsisPurchaseOrders(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.syncHsisPurchaseOrders();
      return responseUtil.success({ reply, message: data.message, data: data.data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createHsisPurchaseOrder(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.createHsisPurchaseOrder(req.body as any);
      return responseUtil.created({ reply, message: 'Purchase Order HSIS berhasil dibuat', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async receiveHsisOrder(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.receiveHsisOrder(req.params.id, req.body as any);
      return responseUtil.success({ reply, message: 'Verifikasi barang datang PO berhasil diproses', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async syncHsisSaldo(req: FastifyRequest, reply: FastifyReply) {
    try {
      await storeService.getHsisSession();
      const data = await hsisSyncService.syncHsisSaldoOnly();
      return responseUtil.success({
        reply,
        message: 'Sinkronisasi saldo HSIS dan rekonsiliasi selesai',
        data,
      });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async syncHsisSales(req: FastifyRequest, reply: FastifyReply) {
    try {
      await storeService.getHsisSession();
      const data = await hsisSyncService.syncHsisSales();
      return responseUtil.success({
        reply,
        message: 'Sinkronisasi penjualan dan rekonsiliasi saldo HSIS selesai',
        data,
      });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async getHsisReconciliationReport(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await hsisSyncService.runStockSaldoReconciliation();
      return responseUtil.success({
        reply,
        message: 'Laporan rekonsiliasi HSIS berhasil dimuat',
        data,
      });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async linkHsisInvoice(
    req: FastifyRequest<{ Params: { orderId: string }; Body: { invoiceId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const data = await hsisSyncService.linkOrderToHsisInvoice(
        req.params.orderId,
        req.body?.invoiceId
      );
      return responseUtil.success({
        reply,
        message: 'Order berhasil ditautkan dengan Invoice ID HSIS',
        data,
      });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Kupon Dinamis & CRUD Voucher (Poin 9)
  async getStoreVouchers(req: FastifyRequest, reply: FastifyReply) {
    const lang = getLanguageFromRequest(req);
    try {
      const data = await storeService.getStoreVouchers();
      return responseUtil.success({ reply, message: t('vouchers.get_vouchers_success', {}, lang), data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createStoreVoucher(req: FastifyRequest, reply: FastifyReply) {
    const lang = getLanguageFromRequest(req);
    try {
      const data = await storeService.createStoreVoucher(req.body as any, lang);
      return responseUtil.success({
        reply,
        message: t('vouchers.create_voucher_success', { code: data.code }, lang),
        data,
      });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateStoreVoucher(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const lang = getLanguageFromRequest(req);
    try {
      const data = await storeService.updateStoreVoucher(req.params.id, req.body as any, lang);
      return responseUtil.success({
        reply,
        message: t('vouchers.update_voucher_success', { code: data.code }, lang),
        data,
      });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteStoreVoucher(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const lang = getLanguageFromRequest(req);
    try {
      const data = await storeService.deleteStoreVoucher(req.params.id, lang);
      return responseUtil.success({
        reply,
        message: t('vouchers.delete_voucher_success', {}, lang),
        data,
      });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateVoucherConditions(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const lang = getLanguageFromRequest(req);
    try {
      const data = await storeService.updateVoucherConditions(req.params.id, req.body as any, lang);
      return responseUtil.success({ reply, message: t('vouchers.update_conditions_success', {}, lang), data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Auto-Cancel Order Kedaluwarsa (Poin 11)
  async cancelExpiredOrders(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.cancelExpiredOrdersManual();
      return responseUtil.success({ reply, message: data.message, data: data.data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Laporan Keuangan (Poin 13)
  async getFinancialReport(req: FastifyRequest<{ Querystring: { period?: string; dateFrom?: string; dateTo?: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.getFinancialReport(req.query);
      return responseUtil.success({ reply, message: 'Laporan keuangan berhasil dimuat', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async exportFinancialReportCsv(req: FastifyRequest<{ Querystring: { dateFrom?: string; dateTo?: string } }>, reply: FastifyReply) {
    try {
      const csv = await storeService.exportFinancialReportCsv(req.query);
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="Laporan-Keuangan-BC3-${new Date().toISOString().slice(0, 10)}.csv"`);
      return reply.send(csv);
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Export & Import Stok Inventory (Poin 14)
  async exportInventoryCsv(req: FastifyRequest, reply: FastifyReply) {
    try {
      const csv = await storeService.exportInventoryCsv();
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="Stok-Inventory-BC3-${new Date().toISOString().slice(0, 10)}.csv"`);
      return reply.send(csv);
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async importInventory(req: FastifyRequest<{ Body: { items: Array<{ sku: string; stock: number; mode?: 'SET' | 'ADD' }> } }>, reply: FastifyReply) {
    try {
      const items = (req.body as any)?.items || req.body;
      const data = await storeService.importInventory(items);
      return responseUtil.success({ reply, message: data.message, data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  // Manajemen Kontak & Pesan Publik
  async getContactInfo(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getContactInfo();
      return responseUtil.success({ reply, message: 'Info kontak berhasil dimuat', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateContactInfo(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await storeService.updateContactInfo(req.body || {});
      return responseUtil.success({ reply, message: 'Info kontak toko berhasil diperbarui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async getContactMessages(req: FastifyRequest<{ Querystring: { status?: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.getContactMessages(req.query?.status);
      return responseUtil.success({ reply, message: 'Daftar pesan kontak berhasil dimuat', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async createContactMessage(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await storeService.createContactMessage((req.body || {}) as any);
      return responseUtil.success({ reply, message: 'Pesan Anda telah terkirim ke tim kami', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async updateContactMessage(req: FastifyRequest<{ Params: { id: string }; Body: { status?: string; adminNotes?: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.updateContactMessage(req.params.id, req.body || {});
      return responseUtil.success({ reply, message: 'Status pesan kontak diperbarui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async deleteContactMessage(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.deleteContactMessage(req.params.id);
      return responseUtil.success({ reply, message: 'Pesan kontak berhasil dihapus', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },
};
