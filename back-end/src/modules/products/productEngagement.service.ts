import crypto from 'crypto';
import { pool } from '@/prisma/db';
import { AppError } from '@/utils/AppError';

let engagementTablesEnsured = false;
async function ensureEngagementTables() {
  if (engagementTablesEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store.wishlists (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        product_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, product_id)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products.reviews (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        order_id VARCHAR(255),
        user_name VARCHAR(255) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    engagementTablesEnsured = true;
  } catch (err: any) {
    console.warn('[productEngagement] Table ensure warning:', err?.message);
  }
}

export const productEngagementService = {
  async getReviews(productId: string) {
    await ensureEngagementTables();
    const res = await pool.query(
      `SELECT id, product_id AS "productId", user_id AS "userId", user_name AS "userName",
              rating, comment, is_verified_purchase AS "isVerifiedPurchase",
              created_at AS "createdAt"
       FROM products.reviews
       WHERE product_id = $1
       ORDER BY created_at DESC`,
      [productId]
    );

    const reviews = res.rows;
    const total = reviews.length;
    const averageRating =
      total > 0
        ? Number((reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / total).toFixed(1))
        : 0;

    return {
      averageRating,
      totalReviews: total,
      reviews,
    };
  },

  async createReview(
    productId: string,
    userId: string,
    payload: { rating: number; comment?: string }
  ) {
    await ensureEngagementTables();
    const rating = Math.min(5, Math.max(1, Math.round(Number(payload.rating))));
    if (!Number.isFinite(rating)) {
      throw new AppError('Rating harus antara 1 sampai 5.', 400);
    }

    const userRes = await pool.query(
      `SELECT "fullName", email FROM core_auth.users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const userName =
      userRes.rows[0]?.fullName ||
      userRes.rows[0]?.email?.split('@')[0] ||
      'Pelanggan Tijarah';

    // Check if user has purchased this product
    const purchaseRes = await pool.query(
      `SELECT o.id
       FROM orders.orders o
       JOIN orders.order_items oi ON oi."orderId" = o.id
       WHERE o."userId" = $1
         AND oi."productId" = $2
         AND o."orderStatus" IN ('COMPLETED', 'DELIVERED', 'SHIPPED', 'PROCESSING', 'PAID')
       LIMIT 1`,
      [userId, productId]
    );

    const orderId = purchaseRes.rows[0]?.id || null;
    const isVerifiedPurchase = Boolean(orderId);

    const existingRes = await pool.query(
      `SELECT id FROM products.reviews WHERE product_id = $1 AND user_id = $2 LIMIT 1`,
      [productId, userId]
    );

    if (existingRes.rows.length > 0) {
      const updated = await pool.query(
        `UPDATE products.reviews
         SET rating = $1, comment = $2, user_name = $3, is_verified_purchase = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING id, product_id AS "productId", user_id AS "userId", user_name AS "userName",
                   rating, comment, is_verified_purchase AS "isVerifiedPurchase", created_at AS "createdAt"`,
        [rating, payload.comment?.trim() || '', userName, isVerifiedPurchase, existingRes.rows[0].id]
      );
      return updated.rows[0];
    }

    const id = `REV-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    const inserted = await pool.query(
      `INSERT INTO products.reviews
         (id, product_id, user_id, order_id, user_name, rating, comment, is_verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, product_id AS "productId", user_id AS "userId", user_name AS "userName",
                 rating, comment, is_verified_purchase AS "isVerifiedPurchase", created_at AS "createdAt"`,
      [id, productId, userId, orderId, userName, rating, payload.comment?.trim() || '', isVerifiedPurchase]
    );

    return inserted.rows[0];
  },

  async getRelatedProducts(productId: string, limit = 6) {
    const productRes = await pool.query(
      `SELECT category FROM products.products WHERE id = $1 LIMIT 1`,
      [productId]
    );
    const category = productRes.rows[0]?.category || null;

    const relatedRes = await pool.query(
      `SELECT id, sku, name, category,
              "normalPrice", "normalPrice" AS "regularPrice",
              "agentPrice", "tpPoints" AS points,
              COALESCE(reward_points, 0) AS "rewardPoints",
              "imageUrl", stock,
              COALESCE(allow_agent_price, true) AS "allowAgentPrice",
              description
       FROM products.products
       WHERE id <> $1
         AND COALESCE("isActive", true) = true
         AND ($2::text IS NULL OR category = $2)
       ORDER BY stock DESC, "updatedAt" DESC
       LIMIT $3`,
      [productId, category, limit]
    );

    return relatedRes.rows;
  },

  async getWishlist(userId: string) {
    await ensureEngagementTables();
    const res = await pool.query(
      `SELECT w.id AS "wishlistId", w.created_at AS "addedAt",
              p.id, p.sku, p.name, p.category,
              p."normalPrice", p."normalPrice" AS "regularPrice",
              p."agentPrice", p."tpPoints" AS points,
              COALESCE(p.reward_points, 0) AS "rewardPoints",
              p."imageUrl", p.stock,
              COALESCE(p.allow_agent_price, true) AS "allowAgentPrice"
       FROM store.wishlists w
       JOIN products.products p ON p.id = w.product_id
       WHERE w.user_id = $1 AND COALESCE(p."isActive", true) = true
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return res.rows;
  },

  async toggleWishlist(userId: string, productId: string) {
    await ensureEngagementTables();
    const existing = await pool.query(
      `SELECT id FROM store.wishlists WHERE user_id = $1 AND product_id = $2 LIMIT 1`,
      [userId, productId]
    );

    if (existing.rows.length > 0) {
      await pool.query(`DELETE FROM store.wishlists WHERE id = $1`, [existing.rows[0].id]);
      return { productId, wishlisted: false };
    }

    const id = `WSH-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    await pool.query(
      `INSERT INTO store.wishlists (id, user_id, product_id) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [id, userId, productId]
    );
    return { productId, wishlisted: true };
  },
};
