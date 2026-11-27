import crypto from 'crypto';
import { pool } from '@/prisma/db';

export const SYSTEM_ROLES = [
  {
    name: 'owner',
    displayName: 'Owner / Pemilik Toko',
    description: 'Pemilik toko dengan akses penuh ke seluruh modul ERP, keuangan, RBAC, dan pengaturan.',
    isSystem: true,
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Administrator sistem dengan akses penuh operasional ERP dan manajemen pengguna.',
    isSystem: true,
  },
  {
    name: 'manager',
    displayName: 'Manager Toko',
    description: 'Pengelola operasional harian, stok, purchasing, laporan keuangan, dan persetujuan.',
    isSystem: true,
  },
  {
    name: 'kasir',
    displayName: 'Kasir POS',
    description: 'Mengoperasikan kasir POS, shift kasir, verifikasi pickup, dan memantau pesanan.',
    isSystem: true,
  },
  {
    name: 'gudang',
    displayName: 'Staf Gudang / Stokis',
    description: 'Mengelola inventori stok, pemecahan produk, purchasing PO, pengiriman, dan retur.',
    isSystem: true,
  },
  {
    name: 'staff',
    displayName: 'Staf Toko',
    description: 'Staf operasional toko untuk pesanan, stok, konten produk, dan pesan pelanggan.',
    isSystem: true,
  },
  {
    name: 'member',
    displayName: 'Member / Agen HNI',
    description: 'Pelanggan terverifikasi HNI yang berhak atas harga agen & poin TP.',
    isSystem: true,
  },
  {
    name: 'customer',
    displayName: 'Pelanggan Umum',
    description: 'Pelanggan storefront umum tanpa akses ERP.',
    isSystem: true,
  },
] as const;

export const SYSTEM_PERMISSIONS = [
  { code: 'erp:access', group: 'erp', description: 'Mengakses portal ERP Toko (/store)' },
  { code: 'erp:overview', group: 'erp', description: 'Melihat ringkasan dashboard & metrik toko' },
  { code: 'pos:operate', group: 'pos', description: 'Mengoperasikan kasir POS & buka/tutup shift kasir' },
  { code: 'orders:read', group: 'orders', description: 'Melihat daftar & detail pesanan pelanggan' },
  { code: 'orders:manage', group: 'orders', description: 'Approve, kirim, selesaikan, atau tolak pesanan' },
  { code: 'inventory:read', group: 'inventory', description: 'Melihat daftar stok & inventori produk' },
  { code: 'inventory:write', group: 'inventory', description: 'Tambah, ubah, hapus, breakdown, & import/export stok' },
  { code: 'purchasing:manage', group: 'purchasing', description: 'Kelola supplier, Purchase Order, & hutang dagang' },
  { code: 'returns:manage', group: 'returns', description: 'Tinjau & proses pengajuan retur atau refund' },
  { code: 'kasbon:manage', group: 'finance', description: 'Kelola limit & pelunasan kasbon B2B' },
  { code: 'reports:read', group: 'finance', description: 'Melihat & mengekspor laporan keuangan' },
  { code: 'vouchers:manage', group: 'marketing', description: 'Kelola kupon & voucher promo' },
  { code: 'agents:manage', group: 'users', description: 'Kelola staf toko, agen, user & role RBAC' },
  { code: 'hsis:sync', group: 'integration', description: 'Sinkronisasi saldo, PO, & penjualan HSIS' },
  { code: 'content:manage', group: 'content', description: 'Kelola product knowledge, berita, media & pesan kontak' },
  { code: 'audit:read', group: 'security', description: 'Melihat audit trail aktivitas staf ERP' },
  { code: 'settings:manage', group: 'settings', description: 'Kelola pengaturan toko, kurir, perangkat POS, & e-signature' },
  { code: 'shop:purchase', group: 'storefront', description: 'Belanja, checkout, ulasan, wishlist, & retur pelanggan' },
] as const;

const ALL_PERMS = SYSTEM_PERMISSIONS.map((p) => p.code);

export const ROLE_PERMISSION_MATRIX: Record<string, string[]> = {
  owner: ALL_PERMS,
  admin: ALL_PERMS,
  manager: [
    'erp:access',
    'erp:overview',
    'pos:operate',
    'orders:read',
    'orders:manage',
    'inventory:read',
    'inventory:write',
    'purchasing:manage',
    'returns:manage',
    'kasbon:manage',
    'reports:read',
    'vouchers:manage',
    'agents:manage',
    'hsis:sync',
    'content:manage',
    'audit:read',
    'settings:manage',
    'shop:purchase',
  ],
  kasir: [
    'erp:access',
    'erp:overview',
    'pos:operate',
    'orders:read',
    'orders:manage',
    'inventory:read',
    'kasbon:manage',
    'shop:purchase',
  ],
  gudang: [
    'erp:access',
    'erp:overview',
    'orders:read',
    'orders:manage',
    'inventory:read',
    'inventory:write',
    'purchasing:manage',
    'returns:manage',
    'hsis:sync',
    'shop:purchase',
  ],
  staff: [
    'erp:access',
    'erp:overview',
    'pos:operate',
    'orders:read',
    'orders:manage',
    'inventory:read',
    'content:manage',
    'returns:manage',
    'shop:purchase',
  ],
  member: ['shop:purchase'],
  customer: ['shop:purchase'],
};

function mapUserTypeToRoleName(userType?: string | null, staffRole?: string | null): string {
  const candidate = String(staffRole || userType || 'CUSTOMER').trim().toUpperCase();
  switch (candidate) {
    case 'OWNER':
      return 'owner';
    case 'ADMIN':
      return 'admin';
    case 'MANAGER':
      return 'manager';
    case 'KASIR':
      return 'kasir';
    case 'GUDANG':
    case 'STOKIS':
      return 'gudang';
    case 'STAFF':
      return 'staff';
    case 'AGENT':
    case 'AGEN':
    case 'MEMBER':
    case 'DISTRIBUTOR':
      return 'member';
    default:
      return 'customer';
  }
}

export async function ensureRbacSeeded(): Promise<void> {
  try {
    // 1. Seed roles (bulk fetch to avoid N+1 round-trips over cloud latency)
    const roleIdByName = new Map<string, string>();
    const existingRolesRes = await pool.query(`SELECT id, name FROM core_auth.roles`);
    for (const row of existingRolesRes.rows) {
      roleIdByName.set(String(row.name).toLowerCase(), row.id);
    }

    for (const r of SYSTEM_ROLES) {
      const key = r.name.toLowerCase();
      if (!roleIdByName.has(key)) {
        const id = crypto.randomUUID();
        await pool.query(
          `INSERT INTO core_auth.roles (id, name, "displayName", description, "isSystem", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (name) DO NOTHING`,
          [id, r.name, r.displayName, r.description, r.isSystem]
        );
        const created = await pool.query(
          `SELECT id FROM core_auth.roles WHERE LOWER(name) = LOWER($1) LIMIT 1`,
          [r.name]
        );
        if (created.rows[0]?.id) {
          roleIdByName.set(key, created.rows[0].id);
        }
      }
    }

    // 2. Seed permissions (bulk fetch to avoid 50+ sequential queries on startup)
    const permIdByCode = new Map<string, string>();
    const existingPermsRes = await pool.query(`SELECT id, code FROM core_auth.permissions`);
    for (const row of existingPermsRes.rows) {
      permIdByCode.set(row.code, row.id);
    }

    for (const p of SYSTEM_PERMISSIONS) {
      if (!permIdByCode.has(p.code)) {
        const id = crypto.randomUUID();
        await pool.query(
          `INSERT INTO core_auth.permissions (id, code, "group", description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code) DO NOTHING`,
          [id, p.code, p.group, p.description]
        );
        const created = await pool.query(
          `SELECT id FROM core_auth.permissions WHERE code = $1 LIMIT 1`,
          [p.code]
        );
        if (created.rows[0]?.id) {
          permIdByCode.set(p.code, created.rows[0].id);
        }
      }
    }

    // 3. Seed role_permissions ONLY for roles that currently have 0 permissions (preserves custom admin edits)
    const rolePermCountsRes = await pool.query(
      `SELECT "roleId", COUNT(*)::int AS cnt FROM core_auth.role_permissions GROUP BY "roleId"`
    );
    const countByRoleId = new Map<string, number>();
    for (const row of rolePermCountsRes.rows) {
      countByRoleId.set(row.roleId, Number(row.cnt || 0));
    }

    for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSION_MATRIX)) {
      const roleId = roleIdByName.get(roleName.toLowerCase());
      if (!roleId) continue;
      if ((countByRoleId.get(roleId) || 0) > 0) continue;

      for (const code of permCodes) {
        const permId = permIdByCode.get(code);
        if (!permId) continue;
        await pool.query(
          `INSERT INTO core_auth.role_permissions ("roleId", "permissionId")
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [roleId, permId]
        );
      }
    }

    // 4. Sync user_roles for users who do not yet have any role assigned
    const usersWithoutRole = await pool.query(
      `SELECT u.id, u.email, u."userType",
              (SELECT a.role FROM store.agents a
               WHERE (a.linked_user_id = u.id OR LOWER(a.email) = LOWER(u.email))
                 AND a.status = 'ACTIVE'
                 AND COALESCE(a.source_channel, 'TIJARAH') <> 'HSIS_SYNC'
               LIMIT 1) AS "staffRole"
       FROM core_auth.users u
       WHERE NOT EXISTS (
         SELECT 1 FROM core_auth.user_roles ur WHERE ur."userId" = u.id
       )`
    );

    for (const u of usersWithoutRole.rows) {
      const roleName = mapUserTypeToRoleName(u.userType, u.staffRole);
      const roleId = roleIdByName.get(roleName.toLowerCase());
      if (!roleId) continue;
      await pool.query(
        `INSERT INTO core_auth.user_roles ("userId", "roleId")
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [u.id, roleId]
      );
    }
  } catch (err: any) {
    console.warn('[rbacSeeder] Skipped RBAC seed:', err?.message);
  }
}

export async function getUserRbacAccess(userId: string): Promise<{
  roles: string[];
  permissions: string[];
}> {
  try {
    const res = await pool.query(
      `SELECT DISTINCT r.name AS role_name, p.code AS perm_code
       FROM core_auth.user_roles ur
       JOIN core_auth.roles r ON r.id = ur."roleId"
       LEFT JOIN core_auth.role_permissions rp ON rp."roleId" = r.id
       LEFT JOIN core_auth.permissions p ON p.id = rp."permissionId"
       WHERE ur."userId" = $1`,
      [userId]
    );
    const roles = Array.from(new Set(res.rows.map((r) => String(r.role_name)).filter(Boolean)));
    const permissions = Array.from(new Set(res.rows.map((r) => String(r.perm_code)).filter(Boolean)));
    return { roles, permissions };
  } catch {
    return { roles: [], permissions: [] };
  }
}
