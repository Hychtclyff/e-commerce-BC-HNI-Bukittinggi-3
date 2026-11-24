import { FastifyRequest, FastifyReply } from 'fastify';
import { devQaService } from './devQa.service';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';

export const devQaController = {
  getSchemas: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await devQaService.getSchemas();
      return responseUtil.success({ reply, message: 'Daftar skema pengujian dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  createSchema: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await devQaService.createSchema(req.body as any);
      return responseUtil.created({ reply, message: 'Skema pengujian ditambahkan.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  updateSchema: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = await devQaService.updateSchema(req.params.id, req.body as any);
      return responseUtil.success({ reply, message: 'Skema pengujian diperbarui.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  deleteSchema: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = await devQaService.deleteSchema(req.params.id);
      return responseUtil.success({ reply, message: 'Skema pengujian dihapus.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  getBugs: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await devQaService.getBugs();
      return responseUtil.success({ reply, message: 'Daftar catatan bug dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  createBug: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await devQaService.createBug(req.body as any);
      return responseUtil.created({ reply, message: 'Catatan bug berhasil disimpan.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  updateBug: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = await devQaService.updateBug(req.params.id, req.body as any);
      return responseUtil.success({ reply, message: 'Catatan bug diperbarui.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  batchUpdateBugs: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = req.body as { updates?: any[] };
      const data = await devQaService.batchUpdateBugs(body?.updates || []);
      return responseUtil.success({ reply, message: 'Batch catatan bug diperbarui.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  deleteBug: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = await devQaService.deleteBug(req.params.id);
      return responseUtil.success({ reply, message: 'Catatan bug dihapus.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  getRecordings: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await devQaService.getRecordings();
      return responseUtil.success({ reply, message: 'Daftar rekaman Playwright dimuat.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  createRecording: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await devQaService.createRecording(req.body as any);
      return responseUtil.created({ reply, message: 'Rekaman flow Playwright disimpan.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  deleteRecording: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = await devQaService.deleteRecording(req.params.id);
      return responseUtil.success({ reply, message: 'Rekaman dihapus.', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },
};
