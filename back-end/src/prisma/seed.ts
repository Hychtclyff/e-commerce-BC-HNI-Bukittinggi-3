import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db, pool } from './db';
import { env } from '../config/env';
import { supabase } from '../plugins/supabase';
import { ensureSchemaColumns } from '../utils/schemaGuard';
import { ensureRbacSeeded } from '../utils/rbacSeeder';

export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'owner@tijarah.co',
  password: 'OwnerTijarah123!',
  fullName: 'Owner Tijarah (Super Admin)',
  phoneNumber: '08116600001',
};

async function resetAllTables() {
  console.log('⚠️  Resetting database tables...');
  const tablesToTruncate = [
    'orders.order_returns',
    'orders.order_items',
    'orders.orders',
    'b2b_credit.credit_ledger_entries',
    'b2b_credit.credit_applications',
    'b2b_credit.b2b_credit_profiles',
    'notifications.notifications',
    'promotions.user_vouchers',
    'promotions.vouchers',
    'products.reviews',
    'products.products',
    'store.wishlists',
    'store.cashier_shifts',
    'store.purchase_orders',
    'store.suppliers',
    'store.audit_logs',
    'store.contact_messages',
    'store.news',
    'store.devices',
    'store.delivery_methods',
    'store.agents',
    'store.store_settings',
    'store.contact_settings',
    'core_auth.password_resets',
    'core_auth.user_roles',
    'core_auth.role_permissions',
    'core_auth.permissions',
    'core_auth.roles',
    'core_auth.addresses',
    'core_auth.hni_profiles',
    'core_auth.users',
  ];

  for (const table of tablesToTruncate) {
    try {
      await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
    } catch {
      // Skip if table does not exist yet
    }
  }
  console.log('✅ Database tables truncated.');
}

async function seedSuperAdmin() {
  const { email, password, fullName, phoneNumber } = DEFAULT_ADMIN_CREDENTIALS;
  const passwordHash = await bcrypt.hash(password, 10);

  let supaUserId: string | null = null;
  try {
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingSupa = listData?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (existingSupa) {
      supaUserId = existingSupa.id;
      await supabase.auth.admin.updateUserById(existingSupa.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, is_verified: true },
      });
    } else {
      const { data: created } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, is_verified: true },
      });
      supaUserId = created?.user?.id || null;
    }
  } catch (err: any) {
    console.warn('[seed] Supabase admin sync skipped:', err?.message);
  }

  const existingDbUser = await pool.query(
    `SELECT id FROM core_auth.users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email]
  );

  const userId = existingDbUser.rows[0]?.id || supaUserId || crypto.randomUUID();

  if (existingDbUser.rows.length === 0) {
    await pool.query(
      `INSERT INTO core_auth.users
         (id, "fullName", "phoneNumber", email, "passwordHash", "userType", "isActive", "isDeleted", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'OWNER', true, false, NOW())`,
      [userId, fullName, phoneNumber, email, passwordHash]
    );
  } else {
    await pool.query(
      `UPDATE core_auth.users
       SET "passwordHash" = $1, "userType" = 'OWNER', "isActive" = true, "isDeleted" = false, "updatedAt" = NOW()
       WHERE id = $2`,
      [passwordHash, userId]
    );
  }

  // Assign 'owner' role in core_auth.user_roles
  const ownerRoleRes = await pool.query(
    `SELECT id FROM core_auth.roles WHERE name = 'owner' LIMIT 1`
  );
  if (ownerRoleRes.rows[0]?.id) {
    await pool.query(
      `DELETE FROM core_auth.user_roles WHERE "userId" = $1`,
      [userId]
    );
    await pool.query(
      `INSERT INTO core_auth.user_roles ("userId", "roleId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, ownerRoleRes.rows[0].id]
    );
  }

  // Ensure active OWNER entry in store.agents
  const existingAgent = await pool.query(
    `SELECT id FROM store.agents WHERE linked_user_id = $1 OR LOWER(email) = LOWER($2) LIMIT 1`,
    [userId, email]
  );
  if (existingAgent.rows.length === 0) {
    await pool.query(
      `INSERT INTO store.agents
         (id, name, email, phone, hni_id, role, tier, status, source_channel, is_registered_user, linked_user_id)
       VALUES ($1, $2, $3, $4, '00000001', 'OWNER', 'OWNER', 'ACTIVE', 'TIJARAH', true, $5)`,
      [`STF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, fullName, email, phoneNumber, userId]
    );
  }

  console.log(`✅ Super Admin seeded: ${email} / ${password} (ID: ${userId})`);
}

async function seedConstantMasterData() {
  // 1. Store & Contact Settings
  await pool.query(
    `INSERT INTO store.store_settings
       (id, store_name, store_tagline, is_open, tax_rate_percent, service_fee, min_order_amount, auto_cancel_minutes)
     VALUES ('default', 'BC HNI Bukittinggi 3', 'Pusat Produk Halal & Herbal Terpercaya', true, 0, 0, 0, 1440)
     ON CONFLICT (id) DO NOTHING`
  );

  await pool.query(
    `INSERT INTO store.contact_settings
       (id, store_name, whatsapp, phone, email, address, operational_hours)
     VALUES (
       'default',
       'BC HNI Bukittinggi 3',
       '628116600001',
       '08116600001',
       'admin@tijarah.co',
       'Jl. Raya Bukittinggi - Payakumbuh, Sumatera Barat',
       'Senin - Sabtu, 08:00 - 17:00 WIB'
     )
     ON CONFLICT (id) DO NOTHING`
  );

  // 2. Delivery Methods
  const deliveryMethods = [
    {
      id: 'DM-PICKUP',
      code: 'PICKUP',
      name: 'Ambil di Toko (BC HNI 3)',
      description: 'Ambil langsung pesanan Anda di outlet resmi BC HNI Bukittinggi 3 tanpa ongkos kirim.',
      cost: 0,
      eta: 'Siap dalam 1 jam',
      pricingMode: 'FLAT',
    },
    {
      id: 'DM-L300',
      code: 'L300-REGIONAL',
      name: 'Travel L300 Regional',
      description: 'Pengiriman cepat antar kota wilayah Sumatera Barat (Padang, Payakumbuh, Pasaman, Solok).',
      cost: 15000,
      eta: '1 hari sampai',
      pricingMode: 'FLAT',
    },
    {
      id: 'DM-JNT',
      code: 'JNT-REG',
      name: 'J&T Express Reguler',
      description: 'Pengiriman ekspedisi nasional ke seluruh Indonesia dengan nomor resi pelacakan.',
      cost: 22000,
      eta: '2-4 hari kerja',
      pricingMode: 'FLAT',
    },
  ];

  for (const dm of deliveryMethods) {
    await pool.query(
      `INSERT INTO store.delivery_methods (id, code, name, description, base_fee, estimated_days, is_active, pricing_mode)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7)
       ON CONFLICT (id) DO NOTHING`,
      [dm.id, dm.code, dm.name, dm.description, dm.cost, dm.eta, dm.pricingMode]
    ).catch(async () => {
      // Fallback if schema uses camelCase columns
      await pool.query(
        `INSERT INTO store.delivery_methods (id, code, name, description, cost, "estimatedDays", "isActive")
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (id) DO NOTHING`,
        [dm.id, dm.code, dm.name, dm.description, dm.cost, dm.eta]
      ).catch(() => {});
    });
  }

  // 3. POS Device
  await pool.query(
    `INSERT INTO store.devices (id, name, device_type, status, location)
     VALUES ('DEV-POS-01', 'Kasir Utama Outlet', 'POS_TERMINAL', 'ONLINE', 'Meja Kasir Depan')
     ON CONFLICT (id) DO NOTHING`
  ).catch(() => {});

  // 4. Default Supplier
  await pool.query(
    `INSERT INTO store.suppliers (id, code, name, contact_person, phone, email, address)
     VALUES ('SUP-HNI-PUSAT', 'HNI-PUSAT', 'PT Herba Penawar Alwahida Indonesia (HNI Pusat)', 'Tim Distribusi Pusat', '021-86909600', 'distribusi@hni.net', 'Jakarta Timur, Indonesia')
     ON CONFLICT (id) DO NOTHING`
  );

  // 5. Initial Product Catalog
  const products = [
    {
      sku: 'HNI-MHS-100',
      name: 'Minyak Herba Sinergi (MHS) 100ml',
      category: 'Perawatan & Herba',
      normalPrice: 45000,
      agentPrice: 30000,
      tpPoints: 10,
      stock: 50,
      description: 'Minyak serbaguna alami dari aneka herba pilihan untuk pijat, urut, luka ringan, dan kesehatan keluarga.',
    },
    {
      sku: 'HNI-MADU-250',
      name: 'Madu Multiflora HNI 250g',
      category: 'Nutrisi & Madu',
      normalPrice: 100000,
      agentPrice: 80000,
      tpPoints: 25,
      stock: 35,
      description: 'Madu murni alami berkualitas tinggi untuk menjaga imunitas dan stamina harian.',
    },
    {
      sku: 'HNI-SEVEL-20',
      name: 'Kopi 7 Elemen (Sevel Coffee) 20 Sachet',
      category: 'Minuman Sehat',
      normalPrice: 110000,
      agentPrice: 90000,
      tpPoints: 25,
      stock: 60,
      description: 'Kopi herba sinergi 7 elemen tanaman alami dengan gula aren asli untuk energi sehat.',
    },
    {
      sku: 'HNI-EXF-250',
      name: 'Extra Food Hania 250g',
      category: 'Nutrisi & Suplemen',
      normalPrice: 80000,
      agentPrice: 60000,
      tpPoints: 20,
      stock: 40,
      description: 'Suplemen makanan sehat kaya antioksidan dari ekstrak 23 buah dan sayuran pilihan.',
    },
    {
      sku: 'HNI-HABB-50',
      name: 'Habbatussauda Kapsul 50 Kapsul',
      category: 'Herbal Kapsul',
      normalPrice: 60000,
      agentPrice: 45000,
      tpPoints: 15,
      stock: 45,
      description: 'Ekstrak jintan hitam murni membantu memelihara daya tahan tubuh dan metabolisme.',
    },
    {
      sku: 'HNI-PGH-120',
      name: 'Pasta Gigi Herbal (PGH) 120g',
      category: 'Perawatan Tubuh',
      normalPrice: 20000,
      agentPrice: 16000,
      tpPoints: 4,
      stock: 100,
      description: 'Pasta gigi herbal dengan siwak, sirih, dan mint alami tanpa kandungan flouride berlebih.',
    },
  ];

  for (const p of products) {
    await pool.query(
      `INSERT INTO products.products
         (id, sku, name, category, "normalPrice", "agentPrice", "tpPoints", stock, physical_stock, point_stock, description, "isActive", allow_agent_price, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $8, $9, true, true, NOW())
       ON CONFLICT (sku) DO NOTHING`,
      [crypto.randomUUID(), p.sku, p.name, p.category, p.normalPrice, p.agentPrice, p.tpPoints, p.stock, p.description]
    );
  }

  // 6. Default Active Voucher
  await pool.query(
    `INSERT INTO promotions.vouchers
       (id, code, title, "discountType", "discountValue", "minPurchase", "maxDiscount", quota, used_count, "validUntil", "isActive", description)
     VALUES ($1, 'WELCOME10', 'Diskon Selamat Datang 10%', 'PERCENTAGE', 10, 50000, 25000, 500, 0, NOW() + INTERVAL '365 days', true, 'Potongan 10% untuk pembelanjaan minimal Rp 50.000')
     ON CONFLICT (code) DO NOTHING`,
    [crypto.randomUUID()]
  );

  // 7. Initial News Articles (UUID)
  const newsCountRes = await pool.query(`SELECT COUNT(*)::int AS cnt FROM store.news`);
  if (Number(newsCountRes.rows[0]?.cnt || 0) === 0) {
    const articles = [
      {
        title: 'Panduan Sinergi Herbal Harian untuk Imunitas Keluarga',
        titleEn: 'Daily Herbal Synergy Guide for Family Immunity',
        slug: 'panduan-sinergi-herbal-harian-imunitas',
        summary: 'Kombinasi Madu Multiflora, Extra Food, dan Habbatussauda untuk menjaga daya tahan tubuh setiap hari.',
        summaryEn: 'A combination of Multiflora Honey, Extra Food, and Black Seed (Habbatussauda) to support daily immunity.',
        content: 'Menjaga kesehatan keluarga dimulai dari asupan alami yang seimbang. Produk herbal HNI seperti Madu Multiflora dan Extra Food diformulasikan dari bahan thoyyib untuk mendukung vitalitas dan imunitas sepanjang hari.',
        contentEn: 'Maintaining family health begins with balanced natural nutrition. HNI herbal products such as Multiflora Honey and Extra Food are formulated from wholesome halal ingredients to support daily vitality and immunity.',
        category: 'EDUKASI_HERBAL',
      },
      {
        title: 'Kemudahan Belanja Agen & Poin TP Otomatis di Tijarah BC 3',
        titleEn: 'Seamless Agent Shopping & Automatic TP Points at Tijarah BC 3',
        slug: 'kemudahan-belanja-agen-poin-tp-tijarah',
        summary: 'Mitra agen HNI kini dapat menikmati harga agen otomatis, pembayaran QRIS/VA real-time, serta riwayat resi digital.',
        summaryEn: 'HNI agent partners can now enjoy automatic agent pricing, real-time QRIS/VA payments, and digital receipt history.',
        content: 'Platform Tijarah BC HNI 3 Bukittinggi hadir untuk memudahkan transaksi mitra agen maupun pelanggan umum. Cukup tautkan ID Agen HNI pada menu Profil untuk mendapatkan harga khusus agen dan perhitungan TP otomatis.',
        contentEn: 'The Tijarah BC HNI 3 Bukittinggi platform is built to simplify transactions for both agent partners and general customers. Simply link your HNI Agent ID in the Profile menu to unlock special agent pricing and automatic TP point calculation.',
        category: 'INFO_GERAI',
      },
    ];
    for (const art of articles) {
      await pool.query(
        `INSERT INTO store.news (id, title, title_en, slug, summary, summary_en, content, content_en, category, status, author_name, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PUBLISHED', 'Admin BC HNI 3', NOW())`,
        [crypto.randomUUID(), art.title, art.titleEn, art.slug, art.summary, art.summaryEn, art.content, art.contentEn, art.category]
      );
    }
  }

  console.log('✅ Constant & initial master data seeded.');
}

export async function runDatabaseSeed(options: { reset?: boolean; closeDb?: boolean } = {}) {
  const isReset = Boolean(options.reset);
  console.log(`🚀 Starting Tijarah Seeder (${env.NODE_ENV})...`);

  if (isReset) {
    await resetAllTables();
  }

  await ensureSchemaColumns();
  await ensureRbacSeeded();
  await seedSuperAdmin();
  await seedConstantMasterData();

  console.log('🎉 Seeding complete.');
  if (options.closeDb) {
    await db.close();
  }
}

const scriptArg = (process.argv[1] || '').replace(/\\/g, '/');
const isMainModule =
  scriptArg.endsWith('prisma/seed.ts') ||
  scriptArg.endsWith('prisma/seed.js') ||
  (typeof require !== 'undefined' && require.main === module);

if (isMainModule) {
  runDatabaseSeed({ reset: process.argv.includes('--reset'), closeDb: true }).catch((err) => {
    console.error('❌ Seeder error:', err);
    process.exit(1);
  });
}
