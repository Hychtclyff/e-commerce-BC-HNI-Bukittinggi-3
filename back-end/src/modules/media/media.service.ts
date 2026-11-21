import path from 'path';
import crypto from 'crypto';
import { pool } from '@/prisma/db';
import { supabase } from '@/plugins/supabase';
import { AppError } from '@/utils/AppError';

export const PUBLIC_MEDIA_BUCKET = 'tijarah-media';
export const PRIVATE_DOCS_BUCKET = 'tijarah-docs';

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_PDF_MIMES = new Set(['application/pdf']);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export type MediaCategory =
  | 'PRODUCT'
  | 'NEWS'
  | 'PROFILE'
  | 'RECEIPT'
  | 'DOCUMENT'
  | 'GENERAL';

export interface UploadMediaInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  category?: MediaCategory;
  entityId?: string;
  uploadedBy?: string;
}

export interface MediaAssetRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: MediaCategory;
  bucket: string;
  storagePath: string;
  publicUrl: string | null;
  isPrivate: boolean;
  entityId: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

let bucketsEnsured = false;

async function ensureBucketsExist(): Promise<void> {
  if (bucketsEnsured) return;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const existing = new Set((buckets || []).map((b) => b.name));

    if (!existing.has(PUBLIC_MEDIA_BUCKET)) {
      await supabase.storage.createBucket(PUBLIC_MEDIA_BUCKET, {
        public: true,
        fileSizeLimit: MAX_IMAGE_BYTES,
      });
    }

    if (!existing.has(PRIVATE_DOCS_BUCKET)) {
      await supabase.storage.createBucket(PRIVATE_DOCS_BUCKET, {
        public: false,
        fileSizeLimit: MAX_PDF_BYTES,
      });
    }

    bucketsEnsured = true;
  } catch (err: any) {
    console.warn('[mediaService] Gagal memastikan bucket Supabase:', err?.message);
  }
}

function sanitizeFileName(name: string): string {
  const ext = path.extname(name || '').toLowerCase();
  const base = path
    .basename(name || 'file', ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'asset'}${ext || ''}`;
}

export const mediaService = {
  async uploadAsset(input: UploadMediaInput): Promise<MediaAssetRecord> {
    const mime = String(input.mimeType || '').toLowerCase();
    const isImage = ALLOWED_IMAGE_MIMES.has(mime);
    const isPdf = ALLOWED_PDF_MIMES.has(mime);

    if (!isImage && !isPdf) {
      throw new AppError(
        `Format file tidak didukung (${mime || 'unknown'}). Gunakan JPG, PNG, WEBP, GIF, atau PDF.`,
        400
      );
    }

    const sizeBytes = input.buffer.length;
    if (isImage && sizeBytes > MAX_IMAGE_BYTES) {
      throw new AppError('Ukuran gambar maksimal 5 MB.', 400);
    }
    if (isPdf && sizeBytes > MAX_PDF_BYTES) {
      throw new AppError('Ukuran dokumen PDF maksimal 10 MB.', 400);
    }

    await ensureBucketsExist();

    const category: MediaCategory = input.category || (isPdf ? 'DOCUMENT' : 'GENERAL');
    const isPrivate = isPdf || category === 'RECEIPT' || category === 'DOCUMENT';
    const bucket = isPrivate ? PRIVATE_DOCS_BUCKET : PUBLIC_MEDIA_BUCKET;

    const id = `MED-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const safeName = sanitizeFileName(input.originalName);
    const folder = category.toLowerCase();
    const storagePath = `${folder}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, input.buffer, {
        contentType: mime,
        upsert: false,
      });

    if (uploadError) {
      throw new AppError(
        `Gagal mengunggah file ke Supabase Storage: ${uploadError.message}`,
        502
      );
    }

    let publicUrl: string | null = null;
    if (!isPrivate) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      publicUrl = data?.publicUrl || null;
    }

    const res = await pool.query(
      `INSERT INTO store.media_assets
       (id, "fileName", "mimeType", "sizeBytes", category, bucket, "storagePath", "publicUrl", "isPrivate", "entityId", "uploadedBy")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        input.originalName || safeName,
        mime,
        sizeBytes,
        category,
        bucket,
        storagePath,
        publicUrl,
        isPrivate,
        input.entityId || null,
        input.uploadedBy || null,
      ]
    );

    return res.rows[0];
  },

  async listAssets(params?: {
    category?: string;
    type?: 'IMAGE' | 'PDF' | 'ALL';
    search?: string;
  }): Promise<MediaAssetRecord[]> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (params?.category && params.category !== 'ALL') {
      values.push(params.category.toUpperCase());
      conditions.push(`category = $${values.length}`);
    }

    if (params?.type === 'IMAGE') {
      conditions.push(`"mimeType" LIKE 'image/%'`);
    } else if (params?.type === 'PDF') {
      conditions.push(`"mimeType" = 'application/pdf'`);
    }

    if (params?.search && params.search.trim()) {
      values.push(`%${params.search.trim()}%`);
      conditions.push(`"fileName" ILIKE $${values.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await pool.query(
      `SELECT * FROM store.media_assets ${where} ORDER BY "createdAt" DESC LIMIT 200`,
      values
    );
    return res.rows;
  },

  async getAccessUrl(id: string, expiresInSeconds = 3600): Promise<{ url: string; isPrivate: boolean }> {
    const res = await pool.query(`SELECT * FROM store.media_assets WHERE id = $1 LIMIT 1`, [id]);
    if (res.rows.length === 0) {
      throw new AppError('Aset media tidak ditemukan.', 404);
    }

    const asset: MediaAssetRecord = res.rows[0];
    if (!asset.isPrivate && asset.publicUrl) {
      return { url: asset.publicUrl, isPrivate: false };
    }

    const { data, error } = await supabase.storage
      .from(asset.bucket)
      .createSignedUrl(asset.storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new AppError(
        `Gagal membuat Signed URL dari Supabase Storage: ${error?.message || 'Unknown error'}`,
        502
      );
    }

    return { url: data.signedUrl, isPrivate: asset.isPrivate };
  },

  async deleteAsset(id: string): Promise<{ deleted: boolean; id: string }> {
    const res = await pool.query(`SELECT * FROM store.media_assets WHERE id = $1 LIMIT 1`, [id]);
    if (res.rows.length === 0) {
      throw new AppError('Aset media tidak ditemukan.', 404);
    }

    const asset: MediaAssetRecord = res.rows[0];
    const { error } = await supabase.storage.from(asset.bucket).remove([asset.storagePath]);
    if (error) {
      console.warn('[mediaService] Gagal hapus objek dari Supabase Storage:', error.message);
    }

    await pool.query(`DELETE FROM store.media_assets WHERE id = $1`, [id]);
    return { deleted: true, id };
  },
};
