import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { supabase } from '@/plugins/supabase';
import { pool } from '@/prisma/db';
import { AppError } from '@/utils/AppError';
import { responseUtil } from '@/utils/response';
import { getUserRbacAccess } from '@/utils/rbacSeeder';

const ALLOWED_ERP_USER_TYPES = new Set([
  'ADMIN',
  'STAFF',
  'KASIR',
  'OWNER',
  'MANAGER',
  'GUDANG',
]);

const ALLOWED_ERP_STAFF_ROLES = new Set([
  'OWNER',
  'MANAGER',
  'ADMIN',
  'KASIR',
  'GUDANG',
]);

export interface AuthenticatedStoreUser {
  id: string;
  email: string;
  userType: string;
  staffRole: string | null;
  roles: string[];
  permissions: string[];
}

interface AuthIdentity {
  userId?: string;
  email?: string;
}

async function resolveAuthIdentity(req: FastifyRequest): Promise<AuthIdentity | null> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      // 1. Coba verifikasi sebagai internal app JWT
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as {
          userId?: string;
          sub?: string;
          email?: string;
        };
        if (decoded?.userId || decoded?.sub || decoded?.email) {
          return {
            userId: decoded.userId || decoded.sub ? String(decoded.userId || decoded.sub) : undefined,
            email: decoded.email ? String(decoded.email) : undefined,
          };
        }
      } catch {
        // lanjut verifikasi sebagai Supabase JWT
      }

      // 2. Verifikasi sebagai Supabase Access Token
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          return {
            userId: data.user.id,
            email: data.user.email || undefined,
          };
        }
      } catch {
        // token tidak valid
      }
    }
  }

  return null;
}

async function loadAuthenticatedUser(
  req: FastifyRequest,
  reply: FastifyReply,
  unauthMessage: string
) {
  const identity = await resolveAuthIdentity(req);
  if (!identity || (!identity.userId && !identity.email)) {
    responseUtil.appError(reply, new AppError(unauthMessage, 401));
    return null;
  }

  const userRes = await pool.query(
    `SELECT id, email, "userType", "isActive", "isDeleted"
     FROM core_auth.users
     WHERE ($1::text IS NOT NULL AND id = $1)
        OR ($2::text IS NOT NULL AND LOWER(email) = LOWER($2))
     LIMIT 1`,
    [identity.userId || null, identity.email || null]
  );

  if (userRes.rows.length === 0) {
    responseUtil.appError(reply, new AppError('Akun pengguna tidak ditemukan.', 401));
    return null;
  }

  const user = userRes.rows[0];
  if (user.isDeleted || user.isActive === false) {
    responseUtil.appError(reply, new AppError('Akun Anda tidak aktif atau dinonaktifkan.', 403));
    return null;
  }

  return user;
}

export async function requireAuth(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = await loadAuthenticatedUser(req, reply, 'Autentikasi diperlukan.');
  if (!user) return;

  const rbac = await getUserRbacAccess(user.id);
  (req as any).user = {
    id: user.id,
    email: user.email,
    userType: String(user.userType || 'CUSTOMER').toUpperCase(),
    roles: rbac.roles,
    permissions: rbac.permissions,
  };
}

export async function requireNonProduction(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (env.NODE_ENV === 'production') {
    return responseUtil.appError(
      reply,
      new AppError('Endpoint simulasi tidak tersedia di environment production.', 403)
    );
  }
}

export async function requireStoreStaff(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = await loadAuthenticatedUser(
    req,
    reply,
    'Autentikasi diperlukan untuk mengakses modul ERP Toko.'
  );
  if (!user) return;

  const userType = String(user.userType || 'CUSTOMER').toUpperCase();

  // Cek apakah pengguna juga tercatat sebagai staf toko aktif di store.agents
  const staffRes = await pool.query(
    `SELECT role
     FROM store.agents
     WHERE (linked_user_id = $1 OR LOWER(email) = LOWER($2))
       AND status = 'ACTIVE'
       AND COALESCE(source_channel, 'TIJARAH') <> 'HSIS_SYNC'
     LIMIT 1`,
    [user.id, user.email || '']
  );

  const staffRole = staffRes.rows[0]?.role
    ? String(staffRes.rows[0].role).toUpperCase()
    : null;

  const rbac = await getUserRbacAccess(user.id);

  const isAllowed =
    ALLOWED_ERP_USER_TYPES.has(userType) ||
    (staffRole !== null && ALLOWED_ERP_STAFF_ROLES.has(staffRole)) ||
    rbac.permissions.includes('erp:access');

  if (!isAllowed) {
    return responseUtil.appError(
      reply,
      new AppError(
        'Akses ditolak: hanya staf, kasir, admin, atau owner toko yang dapat mengakses modul ERP.',
        403
      )
    );
  }

  (req as any).storeUser = {
    id: user.id,
    email: user.email,
    userType,
    staffRole,
    roles: rbac.roles,
    permissions: rbac.permissions,
  } satisfies AuthenticatedStoreUser;
}
