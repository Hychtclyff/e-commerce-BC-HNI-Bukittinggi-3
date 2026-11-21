import { FastifyRequest, FastifyReply } from 'fastify';
import { mediaService, type MediaCategory } from './media.service';
import { responseUtil } from '@/utils/response';
import { AppError } from '@/utils/AppError';

export const mediaController = {
  async upload(request: FastifyRequest, reply: FastifyReply) {
    const data = await request.file();
    if (!data) {
      throw new AppError('File tidak ditemukan pada request multipart.', 400);
    }

    const buffer = await data.toBuffer();
    const query = (request.query || {}) as { category?: string; entityId?: string };
    const fields = data.fields as Record<string, any> | undefined;

    const categoryRaw =
      (fields?.category?.value as string | undefined) ||
      query.category ||
      undefined;
    const entityId =
      (fields?.entityId?.value as string | undefined) ||
      query.entityId ||
      undefined;
    const uploadedBy =
      (request.headers['x-user-id'] as string | undefined) || undefined;

    const asset = await mediaService.uploadAsset({
      buffer,
      originalName: data.filename,
      mimeType: data.mimetype,
      category: categoryRaw ? (categoryRaw.toUpperCase() as MediaCategory) : undefined,
      entityId,
      uploadedBy,
    });

    return responseUtil.success({
      reply,
      message: 'File berhasil diunggah ke Supabase Storage.',
      data: asset,
    });
  },

  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = (request.query || {}) as {
      category?: string;
      type?: 'IMAGE' | 'PDF' | 'ALL';
      search?: string;
    };
    const assets = await mediaService.listAssets(query);
    return responseUtil.success({
      reply,
      message: 'Daftar aset media berhasil dimuat.',
      data: assets,
    });
  },

  async getUrl(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const query = (request.query || {}) as { expiresIn?: string };
    const expiresIn = Math.min(Math.max(Number(query.expiresIn || 3600), 60), 86400);
    const result = await mediaService.getAccessUrl(id, expiresIn);
    return responseUtil.success({
      reply,
      message: 'URL akses media berhasil dibuat.',
      data: result,
    });
  },

  async remove(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await mediaService.deleteAsset(id);
    return responseUtil.success({
      reply,
      message: 'Aset media berhasil dihapus.',
      data: result,
    });
  },
};
