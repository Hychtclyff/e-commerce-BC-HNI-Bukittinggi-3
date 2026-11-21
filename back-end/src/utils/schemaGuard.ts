import { pool } from "@/prisma/db";

/**
 * Ensures database columns required by Prisma contract exist idempotently.
 * Prevents runtime errors when local/staging DBs lag behind contract.prisma.
 */
export async function ensureSchemaColumns(): Promise<void> {
  try {
    await pool.query(`
      ALTER TABLE products.products
        ADD COLUMN IF NOT EXISTS is_separable BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS default_breakdown_qty INTEGER,
        ADD COLUMN IF NOT EXISTS is_fraction BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS parent_product_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS allow_agent_price BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS reward_points INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS physical_stock INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS point_stock INTEGER NOT NULL DEFAULT 0;
    `);

    await pool.query(`
      ALTER TABLE orders.orders
        ADD COLUMN IF NOT EXISTS slug VARCHAR(120),
        ADD COLUMN IF NOT EXISTS invoice_id VARCHAR(120),
        ADD COLUMN IF NOT EXISTS source_channel VARCHAR(40) NOT NULL DEFAULT 'ONLINE',
        ADD COLUMN IF NOT EXISTS hsis_member_id VARCHAR(80),
        ADD COLUMN IF NOT EXISTS hsis_customer_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS hsis_sale_type VARCHAR(50);
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS orders_slug_key ON orders.orders (slug) WHERE slug IS NOT NULL;
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS orders_invoice_id_key ON orders.orders (invoice_id) WHERE invoice_id IS NOT NULL;
    `);

    await pool.query(`
      UPDATE orders.orders
      SET slug = LOWER(REGEXP_REPLACE("orderNumber", '[^a-zA-Z0-9]+', '-', 'g'))
      WHERE slug IS NULL AND "orderNumber" IS NOT NULL;
    `);

    await pool.query(`
      ALTER TABLE promotions.vouchers
        ADD COLUMN IF NOT EXISTS quota INTEGER NOT NULL DEFAULT 100,
        ADD COLUMN IF NOT EXISTS used_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS conditions JSONB;
    `);

    await pool.query(`
      ALTER TABLE promotions.user_vouchers
        ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0;
    `);

    await pool.query(`
      ALTER TABLE store.agents
        ADD COLUMN IF NOT EXISTS source_channel VARCHAR(30) NOT NULL DEFAULT 'TIJARAH',
        ADD COLUMN IF NOT EXISTS is_registered_user BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS linked_user_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS total_orders INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_spent DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_tp_points INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_transaction_at TIMESTAMPTZ;
    `);

    await pool.query(`
      ALTER TABLE store.delivery_methods
        ADD COLUMN IF NOT EXISTS pricing_mode VARCHAR(30) NOT NULL DEFAULT 'FLAT',
        ADD COLUMN IF NOT EXISTS zone_rates JSONB NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS provider_code VARCHAR(40);
    `);

    await pool.query(`
      ALTER TABLE store.esignatures
        ADD COLUMN IF NOT EXISTS user_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS staff_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS signature_image TEXT;
    `);

    await pool.query(`
      ALTER TABLE orders.orders
        ADD COLUMN IF NOT EXISTS acted_by_user_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS acted_by_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS acted_by_signature_code VARCHAR(120);
    `);

    await pool.query(`
      ALTER TABLE store.devices
        ADD COLUMN IF NOT EXISTS location VARCHAR(150);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS store.contact_messages (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150),
        phone VARCHAR(50),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'NEW',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS store.contact_settings (
        id VARCHAR(32) PRIMARY KEY,
        store_name VARCHAR(200) NOT NULL,
        whatsapp VARCHAR(50),
        phone VARCHAR(50),
        email VARCHAR(150),
        address TEXT,
        operational_hours VARCHAR(200),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS store.hsis_sessions (
        id VARCHAR(64) PRIMARY KEY,
        token_encrypted TEXT NOT NULL,
        cookie_encrypted TEXT,
        token_preview VARCHAR(64),
        source_method VARCHAR(30) DEFAULT 'MANUAL_TOKEN',
        status VARCHAR(20) DEFAULT 'ACTIVE',
        expires_at TIMESTAMP,
        last_verified_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS store.media_assets (
        id VARCHAR(64) PRIMARY KEY,
        "fileName" VARCHAR(255) NOT NULL,
        "mimeType" VARCHAR(120) NOT NULL,
        "sizeBytes" INTEGER NOT NULL,
        category VARCHAR(40) NOT NULL DEFAULT 'GENERAL',
        bucket VARCHAR(80) NOT NULL,
        "storagePath" TEXT NOT NULL,
        "publicUrl" TEXT,
        "isPrivate" BOOLEAN NOT NULL DEFAULT false,
        "entityId" VARCHAR(120),
        "uploadedBy" VARCHAR(120),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      ALTER TABLE core_auth.users
        ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
    `);
  } catch (err: any) {
    console.warn("[schemaGuard] Skipped schema guard:", err?.message);
  }
}
