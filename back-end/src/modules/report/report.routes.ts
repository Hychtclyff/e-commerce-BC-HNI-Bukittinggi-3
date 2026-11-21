import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';

export const reportController = {
  async financial(req: FastifyRequest, reply: FastifyReply) {
    try {
      return responseUtil.success({ reply, message: 'Laporan keuangan', data: { income: 0, expense: 0 } });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },
  async export(req: FastifyRequest, reply: FastifyReply) {
    try {
      return responseUtil.success({ reply, message: 'Export berhasil', data: { url: '/reports/export/financial.csv' } });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },
};

export const reportRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/financial', reportController.financial);
  fastify.get('/financial/export', reportController.export);
};