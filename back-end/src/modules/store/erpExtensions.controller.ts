import { FastifyRequest, FastifyReply } from 'fastify';
import { erpExtensionsService } from './erpExtensions.service';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';

function getActor(req: FastifyRequest) {
  const storeUser = (req as any).storeUser || (req as any).user || {};
  return {
    id: storeUser.id || 'SYSTEM',
    email: storeUser.email || undefined,
    staffRole: storeUser.staffRole || storeUser.userType || undefined,
  };
}

export const erpExtensionsController = {
  getCurrentShift: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const actor = getActor(req);
      const data = await erpExtensionsService.getCurrentShift(actor.id);
      return responseUtil.success({ reply, message: 'Shift kasir saat ini dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  getShifts: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.getShifts();
      return responseUtil.success({ reply, message: 'Riwayat shift kasir dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  openShift: async (
    req: FastifyRequest<{ Body: { openingCash: number; deviceId?: string; cashierName?: string; notes?: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const data = await erpExtensionsService.openShift(getActor(req), req.body);
      return responseUtil.created({ reply, message: 'Shift kasir berhasil dibuka.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  closeShift: async (
    req: FastifyRequest<{ Params: { id: string }; Body: { closingCash: number; notes?: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const data = await erpExtensionsService.closeShift(req.params.id, getActor(req), req.body);
      return responseUtil.success({ reply, message: 'Shift kasir berhasil ditutup.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  getSuppliers: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.getSuppliers();
      return responseUtil.success({ reply, message: 'Daftar supplier dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  createSupplier: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.createSupplier(getActor(req), req.body as any);
      return responseUtil.created({ reply, message: 'Supplier berhasil ditambahkan.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  deleteSupplier: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.deleteSupplier(req.params.id, getActor(req));
      return responseUtil.success({ reply, message: 'Supplier dihapus.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  getPurchaseOrders: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.getPurchaseOrders();
      return responseUtil.success({ reply, message: 'Daftar Purchase Order dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  createPurchaseOrder: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.createPurchaseOrder(getActor(req), req.body as any);
      return responseUtil.created({ reply, message: 'Purchase Order berhasil dibuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  receivePurchaseOrder: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.receivePurchaseOrder(req.params.id, getActor(req));
      return responseUtil.success({ reply, message: 'Barang Purchase Order diterima & stok diperbarui.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  payPurchaseOrder: async (
    req: FastifyRequest<{ Params: { id: string }; Body: { amount: number } }>,
    reply: FastifyReply
  ) => {
    try {
      const data = await erpExtensionsService.payPurchaseOrder(req.params.id, getActor(req), req.body);
      return responseUtil.success({ reply, message: 'Pembayaran Purchase Order dicatat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  getOrderReturns: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.getOrderReturns();
      return responseUtil.success({ reply, message: 'Daftar retur pesanan dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  processOrderReturn: async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const data = await erpExtensionsService.processOrderReturn(req.params.id, getActor(req), req.body as any);
      return responseUtil.success({ reply, message: 'Pengajuan retur berhasil diproses.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  getAuditLogs: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const q = (req.query || {}) as { module?: string; action?: string; search?: string; limit?: number };
      const data = await erpExtensionsService.getAuditLogs(q);
      return responseUtil.success({ reply, message: 'Log aktivitas ERP dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  getProductCategories: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.getProductCategories();
      return responseUtil.success({ reply, message: 'Kategori produk dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  createProductCategory: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.createProductCategory(getActor(req), req.body as any);
      return responseUtil.created({ reply, message: 'Kategori produk ditambahkan.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  getProductUnits: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.getProductUnits();
      return responseUtil.success({ reply, message: 'Satuan produk dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  createProductUnit: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.createProductUnit(getActor(req), req.body as any);
      return responseUtil.created({ reply, message: 'Satuan produk ditambahkan.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  getStoreSettings: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.getStoreSettings();
      return responseUtil.success({ reply, message: 'Pengaturan toko dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  updateStoreSettings: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.updateStoreSettings(getActor(req), req.body as any);
      return responseUtil.success({ reply, message: 'Pengaturan toko diperbarui.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  getRbacRoles: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.getRbacRoles();
      return responseUtil.success({ reply, message: 'Daftar role & permission dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  getRbacPermissions: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await erpExtensionsService.getRbacPermissions();
      return responseUtil.success({ reply, message: 'Daftar permission sistem dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  updateRolePermissions: async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const body = req.body as { permissions: string[] };
      const data = await erpExtensionsService.updateRolePermissions(
        req.params.id,
        getActor(req),
        body?.permissions || []
      );
      return responseUtil.success({ reply, message: 'Permission role diperbarui.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  assignUserRole: async (
    req: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const body = req.body as { roleName: string };
      const data = await erpExtensionsService.assignUserRole(
        req.params.userId,
        getActor(req),
        body?.roleName
      );
      return responseUtil.success({ reply, message: 'Role pengguna berhasil ditetapkan.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },
};
