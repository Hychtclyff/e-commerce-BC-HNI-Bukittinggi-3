import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';

export const hsisController = {
  async syncOrder(req: FastifyRequest<{ Params: { orderId: string } }>, reply: FastifyReply) {
    const { orderId } = req.params;
    try {
      const data = { success: true, orderId };
      return responseUtil.success({ reply, message: 'HSIS sync berhasil', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },
};

export const hsisRoutes = (fastify: FastifyInstance) => {
  fastify.post('/hsis/orders/:orderId/sync', hsisController.syncOrder);
};