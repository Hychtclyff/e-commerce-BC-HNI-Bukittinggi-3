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
      slug: r.slug,
      summary: r.summary,
      content: r.content,
      category: r.category,
      tags: r.tags || [],
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
      slug: r.slug,
      summary: r.summary,
      content: r.content,
      category: r.category,
      tags: r.tags || [],
      thumbnailUrl: r.thumbnail_url,
      status: r.status,
      authorName: r.author_name,
      publishedAt: r.published_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async createNews(payload: any) {
    const id = `NEWS-${Date.now().toString().slice(-6)}`;
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
       (id, title, slug, summary, content, category, tags, thumbnail_url, status, author_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        payload.title,
        slug,
        payload.summary || '',
        payload.content || '',
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
           summary = COALESCE($2, summary),
           content = COALESCE($3, content),
           category = COALESCE($4, category),
           tags = COALESCE($5, tags),
           thumbnail_url = COALESCE($6, thumbnail_url),
           status = COALESCE($7, status),
           author_name = COALESCE($8, author_name),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        payload.title,
        payload.summary,
        payload.content,
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
