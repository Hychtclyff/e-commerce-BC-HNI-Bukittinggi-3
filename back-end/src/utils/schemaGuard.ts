import { pool } from "@/prisma/db";
import { ensureRbacSeeded } from "./rbacSeeder";

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

    const ddlStatements = [
      `CREATE TABLE IF NOT EXISTS store.contact_messages (
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
      )`,
      `CREATE TABLE IF NOT EXISTS store.contact_settings (
        id VARCHAR(32) PRIMARY KEY,
        store_name VARCHAR(200) NOT NULL,
        whatsapp VARCHAR(50),
        phone VARCHAR(50),
        email VARCHAR(150),
        address TEXT,
        operational_hours VARCHAR(200),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS store.hsis_sessions (
        id VARCHAR(64) PRIMARY KEY,
        token_encrypted TEXT NOT NULL,
        cookie_encrypted TEXT,
        token_preview VARCHAR(64),
        source_method VARCHAR(30) DEFAULT 'MANUAL_TOKEN',
        status VARCHAR(20) DEFAULT 'ACTIVE',
        expires_at TIMESTAMP,
        last_verified_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS store.media_assets (
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
      )`,
      `ALTER TABLE store.news ADD COLUMN IF NOT EXISTS slug VARCHAR(255)`,
      `ALTER TABLE store.news ADD COLUMN IF NOT EXISTS title_en VARCHAR(255)`,
      `ALTER TABLE store.news ADD COLUMN IF NOT EXISTS summary_en TEXT`,
      `ALTER TABLE store.news ADD COLUMN IF NOT EXISTS content_en TEXT`,
      `ALTER TABLE orders.orders
        ADD COLUMN IF NOT EXISTS cash_received DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS refund_bank_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS refund_account_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS refund_account_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS refund_proof_url TEXT`,
      `ALTER TABLE products.products ADD COLUMN IF NOT EXISTS unit VARCHAR(40) DEFAULT 'Pcs'`,
      `CREATE TABLE IF NOT EXISTS products.categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(120) UNIQUE NOT NULL,
        slug VARCHAR(120) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS products.units (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(40) UNIQUE NOT NULL,
        name VARCHAR(80) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `INSERT INTO products.categories (id, name, slug) VALUES
        ('CAT-HERBAL', 'Perawatan & Herba', 'perawatan-herba'),
        ('CAT-NUTRISI', 'Nutrisi & Madu', 'nutrisi-madu'),
        ('CAT-MINUMAN', 'Minuman Sehat', 'minuman-sehat'),
        ('CAT-SUPLEMEN', 'Nutrisi & Suplemen', 'nutrisi-suplemen'),
        ('CAT-KAPSUL', 'Herbal Kapsul', 'herbal-kapsul'),
        ('CAT-TUBUH', 'Perawatan Tubuh', 'perawatan-tubuh')
       ON CONFLICT (name) DO NOTHING`,
      `INSERT INTO products.units (id, code, name) VALUES
        ('UNT-PCS', 'Pcs', 'Pcs / Buah'),
        ('UNT-BTL', 'Botol', 'Botol'),
        ('UNT-BOX', 'Box', 'Box / Kotak'),
        ('UNT-PCK', 'Pack', 'Pack / Bungkus'),
        ('UNT-SCH', 'Sachet', 'Sachet'),
        ('UNT-TUB', 'Tube', 'Tube')
       ON CONFLICT (code) DO NOTHING`,
      `CREATE UNIQUE INDEX IF NOT EXISTS news_slug_key ON store.news (slug) WHERE slug IS NOT NULL`,
      `UPDATE store.news
       SET slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(id FROM 6)
       WHERE slug IS NULL OR slug = ''`,
      `ALTER TABLE core_auth.users ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT`,
      `CREATE TABLE IF NOT EXISTS core_auth.password_resets (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS store.wishlists (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        product_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, product_id)
      )`,
      `CREATE TABLE IF NOT EXISTS products.reviews (
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
      )`,
      `CREATE TABLE IF NOT EXISTS orders.order_returns (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL,
        order_number VARCHAR(120) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        reason VARCHAR(120) NOT NULL,
        description TEXT NOT NULL,
        evidence_url TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        admin_notes TEXT,
        refund_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        processed_by VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS store.cashier_shifts (
        id VARCHAR(64) PRIMARY KEY,
        cashier_id VARCHAR(255) NOT NULL,
        cashier_name VARCHAR(255) NOT NULL,
        device_id VARCHAR(120),
        opening_cash DOUBLE PRECISION NOT NULL DEFAULT 0,
        closing_cash DOUBLE PRECISION,
        expected_cash DOUBLE PRECISION NOT NULL DEFAULT 0,
        cash_difference DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_cash_sales DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_non_cash_sales DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_transactions INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        notes TEXT,
        opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        closed_at TIMESTAMPTZ
      )`,
      `CREATE TABLE IF NOT EXISTS store.suppliers (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(60) NOT NULL,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(150),
        phone VARCHAR(60),
        email VARCHAR(150),
        address TEXT,
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS store.purchase_orders (
        id VARCHAR(64) PRIMARY KEY,
        po_number VARCHAR(120) NOT NULL,
        supplier_id VARCHAR(64) NOT NULL,
        supplier_name VARCHAR(255) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ORDERED',
        payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
        subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
        tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        paid_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        due_date TIMESTAMPTZ,
        items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        notes TEXT,
        created_by VARCHAR(255),
        received_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `ALTER TABLE store.purchase_orders
        ADD COLUMN IF NOT EXISTS po_number VARCHAR(120),
        ADD COLUMN IF NOT EXISTS supplier_id VARCHAR(64),
        ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'ORDERED',
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
        ADD COLUMN IF NOT EXISTS subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS paid_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
        ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
      `CREATE TABLE IF NOT EXISTS store.audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        actor_id VARCHAR(255),
        actor_email VARCHAR(255),
        actor_role VARCHAR(60),
        action VARCHAR(80) NOT NULL,
        module VARCHAR(60) NOT NULL,
        entity_id VARCHAR(255),
        summary TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS store.store_settings (
        id VARCHAR(32) PRIMARY KEY,
        store_name VARCHAR(255) NOT NULL DEFAULT 'BC HNI Bukittinggi 3',
        store_tagline VARCHAR(255),
        is_open BOOLEAN NOT NULL DEFAULT true,
        tax_rate_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
        service_fee DOUBLE PRECISION NOT NULL DEFAULT 0,
        min_order_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        auto_cancel_minutes INTEGER NOT NULL DEFAULT 1440,
        manual_bank_accounts JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_by VARCHAR(255),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `INSERT INTO store.store_settings (id, store_name, store_tagline, is_open, tax_rate_percent, service_fee, min_order_amount, auto_cancel_minutes)
       VALUES ('default', 'BC HNI Bukittinggi 3', 'Pusat Produk Halal & Herbal Terpercaya', true, 0, 0, 0, 1440)
       ON CONFLICT (id) DO NOTHING`,
      `CREATE TABLE IF NOT EXISTS store.dev_test_schemas (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(40) NOT NULL,
        module VARCHAR(80) NOT NULL,
        title VARCHAR(255) NOT NULL,
        endpoint VARCHAR(255),
        expected_result TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'UNTESTED',
        is_new_request BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS store.dev_bug_notes (
        id VARCHAR(64) PRIMARY KEY,
        schema_id VARCHAR(64),
        schema_code VARCHAR(40),
        schema_title VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        note_type VARCHAR(30) NOT NULL DEFAULT 'BUG',
        current_url TEXT,
        steps_or_note TEXT NOT NULL,
        expected_behavior TEXT,
        actual_behavior TEXT,
        logs_json JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `ALTER TABLE store.dev_bug_notes
        ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_TEST',
        ADD COLUMN IF NOT EXISTS verification_note TEXT,
        ADD COLUMN IF NOT EXISTS root_cause TEXT,
        ADD COLUMN IF NOT EXISTS solution TEXT,
        ADD COLUMN IF NOT EXISTS parent_bug_id VARCHAR(64),
        ADD COLUMN IF NOT EXISTS error_flow TEXT`,
      `UPDATE store.news
       SET title_en = COALESCE(title_en, 'Daily Herbal Synergy Guide for Family Immunity'),
           summary_en = COALESCE(summary_en, 'A combination of Multiflora Honey, Extra Food, and Black Seed (Habbatussauda) to support daily immunity.'),
           content_en = COALESCE(content_en, 'Maintaining family health begins with balanced natural nutrition. HNI herbal products such as Multiflora Honey and Extra Food are formulated from wholesome halal ingredients to support daily vitality and immunity.')
       WHERE slug = 'panduan-sinergi-herbal-harian-imunitas' AND (title_en IS NULL OR title_en = '')`,
      `UPDATE store.news
       SET title_en = COALESCE(title_en, 'Seamless Agent Shopping & Automatic TP Points at Tijarah BC 3'),
           summary_en = COALESCE(summary_en, 'HNI agent partners can now enjoy automatic agent pricing, real-time QRIS/VA payments, and digital receipt history.'),
           content_en = COALESCE(content_en, 'The Tijarah BC HNI 3 Bukittinggi platform is built to simplify transactions for both agent partners and general customers. Simply link your HNI Agent ID in the Profile menu to unlock special agent pricing and automatic TP point calculation.')
       WHERE slug = 'kemudahan-belanja-agen-poin-tp-tijarah' AND (title_en IS NULL OR title_en = '')`,
      `CREATE TABLE IF NOT EXISTS store.dev_playwright_recordings (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        schema_id VARCHAR(64),
        start_url TEXT,
        steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        api_hits_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        playwright_spec TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `ALTER TABLE store.news
        ADD COLUMN IF NOT EXISTS tagged_product_ids JSONB NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE store.product_knowledge
        ADD COLUMN IF NOT EXISTS product_id VARCHAR(64)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_pk_product_id ON store.product_knowledge(product_id) WHERE product_id IS NOT NULL`,
      `ALTER TABLE orders.orders
        ADD COLUMN IF NOT EXISTS print_status VARCHAR(20) NOT NULL DEFAULT 'NOT_PRINTED'`,
      `ALTER TABLE orders.orders
        ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ`,
      `ALTER TABLE orders.orders
        ADD COLUMN IF NOT EXISTS refund_confirmed_by_user BOOLEAN NOT NULL DEFAULT FALSE`,
      `ALTER TABLE orders.orders
        ADD COLUMN IF NOT EXISTS refund_confirmed_at TIMESTAMPTZ`,
    ];

    for (const stmt of ddlStatements) {
      try {
        await pool.query(stmt);
      } catch (stmtErr: any) {
        console.warn("[schemaGuard] Statement warning:", stmtErr?.message);
      }
    }

    await ensureRbacSeeded();
  } catch (err: any) {
    console.warn("[schemaGuard] Skipped schema guard:", err?.message);
  }
}
