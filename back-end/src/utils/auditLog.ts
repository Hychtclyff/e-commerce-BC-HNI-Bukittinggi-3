import crypto from 'crypto';
import { pool } from '@/prisma/db';

export interface AuditLogInput {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  module: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, any> | null;
}

/**
 * Records an ERP or security-sensitive action into store.audit_logs.
 * Never throws so business transactions are not aborted by logging failures.
 */
export async function logStoreActivity(input: AuditLogInput): Promise<void> {
  try {
    const id = `AUD-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    await pool.query(
      `INSERT INTO store.audit_logs
         (id, actor_id, actor_email, actor_role, action, module, entity_id, summary, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      [
        id,
        input.actorId || null,
        input.actorEmail || null,
        input.actorRole || null,
        input.action,
        input.module,
        input.entityId || null,
        input.summary,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ]
    );
  } catch (err: any) {
    console.warn('[auditLog] Failed to write audit log:', err?.message);
  }
}
