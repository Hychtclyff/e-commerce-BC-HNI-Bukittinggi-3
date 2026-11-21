import { FastifyRequest, FastifyReply } from 'fastify';
import { newsService } from './news.service';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';

export const newsController = {
  async list(req: FastifyRequest<{ Querystring: { category?: string; status?: string; search?: string; limit?: number } }>, reply: FastifyReply) {
    try {
      const data = await newsService.getNewsList(req.query);
      return responseUtil.success({ reply, message: 'Daftar berita & artikel edukasi berhasil dimuat', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await newsService.getNewsByIdOrSlug(req.params.id);
      return responseUtil.success({ reply, message: 'Detail berita berhasil dimuat', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await newsService.createNews(req.body);
      return responseUtil.created({ reply, message: 'Berita / artikel baru berhasil diterbitkan', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await newsService.updateNews(req.params.id, req.body);
      return responseUtil.success({ reply, message: 'Berita / artikel berhasil diperbarui', data });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },

  async remove(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await newsService.deleteNews(req.params.id);
      return responseUtil.success({ reply, message: 'Berita berhasil dihapus' });
    } catch (error: any) {
      if (error instanceof AppError) return responseUtil.appError(reply, error);
      throw error;
    }
  },
};
