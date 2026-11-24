import crypto from 'crypto';
import { pool } from '@/prisma/db';
import { AppError } from '@/utils/AppError';

export interface NewsFilterParams {
  category?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const newsService = {
  async getNewsList(params: NewsFilterParams = {}) {
    let query = 'SELECT * FROM store.news WHERE 1=1';
    const values: any[] = [];
    let idx = 1;

    if (params.category && params.category !== 'ALL') {
      query += ` AND category = $${idx++}`;
      values.push(params.category);
    }

    if (params.status && params.status !== 'ALL') {
      query += ` AND status = $${idx++}`;
      values.push(params.status);
    }

    if (params.search) {
      query += ` AND (title ILIKE $${idx} OR summary ILIKE $${idx} OR content ILIKE $${idx})`;
      values.push(`%${params.search}%`);
      idx++;
    }

    query += ' ORDER BY published_at DESC';

    if (params.limit) {
      query += ` LIMIT $${idx++}`;
      values.push(params.limit);
    }

    const res = await pool.query(query, values);
    return res.rows.map((r) => ({
      id: r.id,
      title: r.title,
      titleEn: r.title_en || null,
      slug: r.slug,
      summary: r.summary,
      summaryEn: r.summary_en || null,
      content: r.content,
      contentEn: r.content_en || null,
      category: r.category,
      tags: r.tags || [],
      taggedProductIds: Array.isArray(r.tagged_product_ids) ? r.tagged_product_ids : [],
      thumbnailUrl: r.thumbnail_url,
      status: r.status,
      authorName: r.author_name,
      publishedAt: r.published_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async getNewsByIdOrSlug(idOrSlug: string) {
    const res = await pool.query(
      'SELECT * FROM store.news WHERE id = $1 OR slug = $1 LIMIT 1',
      [idOrSlug]
    );

    if (res.rows.length === 0) {
      throw new AppError('Berita / artikel tidak ditemukan', 404);
    }

    const r = res.rows[0];
    return {
      id: r.id,
      title: r.title,
      titleEn: r.title_en || null,
      slug: r.slug,
      summary: r.summary,
      summaryEn: r.summary_en || null,
      content: r.content,
      contentEn: r.content_en || null,
      category: r.category,
      tags: r.tags || [],
      taggedProductIds: Array.isArray(r.tagged_product_ids) ? r.tagged_product_ids : [],
      thumbnailUrl: r.thumbnail_url,
      status: r.status,
      authorName: r.author_name,
      publishedAt: r.published_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async createNews(payload: any) {
    const id = crypto.randomUUID();
    const baseSlug = (payload.slug || payload.title || `berita-${id}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const tagsArray = Array.isArray(payload.tags)
      ? payload.tags
      : typeof payload.tags === 'string'
      ? payload.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const res = await pool.query(
      `INSERT INTO store.news
       (id, title, title_en, slug, summary, summary_en, content, content_en, category, tags, thumbnail_url, status, author_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        id,
        payload.title,
        payload.titleEn || null,
        slug,
        payload.summary || '',
        payload.summaryEn || null,
        payload.content || '',
        payload.contentEn || null,
        payload.category || 'EDUKASI_HERBAL',
        tagsArray,
        payload.thumbnailUrl || null,
        payload.status || 'PUBLISHED',
        payload.authorName || 'Admin Toko BC HNI 3',
      ]
    );

    return res.rows[0];
  },

  async updateNews(id: string, payload: any) {
    const tagsArray = Array.isArray(payload.tags)
      ? payload.tags
      : typeof payload.tags === 'string'
      ? payload.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
      : undefined;

    const res = await pool.query(
      `UPDATE store.news
       SET title = COALESCE($1, title),
           title_en = COALESCE($2, title_en),
           summary = COALESCE($3, summary),
           summary_en = COALESCE($4, summary_en),
           content = COALESCE($5, content),
           content_en = COALESCE($6, content_en),
           category = COALESCE($7, category),
           tags = COALESCE($8, tags),
           thumbnail_url = COALESCE($9, thumbnail_url),
           status = COALESCE($10, status),
           author_name = COALESCE($11, author_name),
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        payload.title,
        payload.titleEn ?? null,
        payload.summary,
        payload.summaryEn ?? null,
        payload.content,
        payload.contentEn ?? null,
        payload.category,
        tagsArray,
        payload.thumbnailUrl,
        payload.status,
        payload.authorName,
        id,
      ]
    );

    if (res.rows.length === 0) {
      throw new AppError('Berita / artikel tidak ditemukan untuk diperbarui', 404);
    }

    return res.rows[0];
  },

  async deleteNews(id: string) {
    const res = await pool.query('DELETE FROM store.news WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
