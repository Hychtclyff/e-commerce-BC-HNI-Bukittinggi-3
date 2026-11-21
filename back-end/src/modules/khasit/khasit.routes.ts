import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';
import { storeService } from '../store/store.service';

export const khasitController = {
  async list(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.getProductKnowledge();
      return responseUtil.success({ reply, message: 'Daftar katalog khasiat & herba berhasil dimuat', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await storeService.createProductKnowledge(req.body);
      return responseUtil.created({ reply, message: 'Khasiat herba berhasil didaftarkan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await storeService.updateProductKnowledge(req.params.id, req.body);
      return responseUtil.success({ reply, message: 'Khasiat herba berhasil diperbarui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async batchUpdate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const items = Array.isArray(req.body) ? req.body : (req.body as any)?.items || [];
      const data = await storeService.batchUpdateProductKnowledge(items);
      return responseUtil.success({ reply, message: 'Batch update tabel khasiat berhasil disimpan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async remove(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await storeService.deleteProductKnowledge(req.params.id);
      return responseUtil.success({ reply, message: 'Khasiat herba berhasil dihapus' });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },
};

export const khasitRoutes = (fastify: FastifyInstance) => {
  fastify.get('/khasit', khasitController.list);
  fastify.post('/khasit', khasitController.create);
  fastify.put('/khasit/batch', khasitController.batchUpdate);
  fastify.put('/khasit/:id', khasitController.update);
  fastify.delete('/khasit/:id', khasitController.remove);
};