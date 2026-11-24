import crypto from 'crypto';
import { pool } from '@/prisma/db';
import { AppError } from '@/utils/AppError';

const DEFAULT_DEV_SCHEMAS = [
  { code: 'PUB-01', module: 'Storefront Publik', title: 'Landing, About, Contact tanpa 401', endpoint: '/api/v1/store/contact-info', expectedResult: 'Halaman terbuka bersih tanpa redirect 401' },
  { code: 'PUB-04', module: 'Berita & Artikel', title: 'Detail Berita menggunakan UUID', endpoint: '/api/v1/news/:id', expectedResult: 'URL memakai UUID dan detail artikel tampil saat refresh' },
  { code: 'AUTH-01', module: 'Autentikasi', title: 'Login, Refresh Token & Expired Redirect', endpoint: '/api/v1/auth/login, /auth/refresh', expectedResult: 'Silent refresh berjalan; sesi expired mengarah ke /login?expired=1' },
  { code: 'AUTH-04', module: 'Autentikasi', title: 'Lupa Password & Reset Password', endpoint: '/api/v1/auth/forgot-password', expectedResult: 'Email reset terkirim dan password baru dapat disimpan' },
  { code: 'CAT-03', module: 'Katalog Produk', title: 'Wishlist Toggle & Sinkron Profil', endpoint: '/api/v1/profile/wishlist/toggle', expectedResult: 'Produk tersimpan ke wishlist dan tampil di Profil Overview' },
  { code: 'CAT-04', module: 'Katalog Produk', title: 'Ulasan & Rating Pembeli', endpoint: '/api/v1/products/:id/reviews', expectedResult: 'Rating dan ulasan tersimpan serta rata-rata terupdate' },
  { code: 'CHK-03', module: 'Checkout & Order', title: 'Pembayaran Xendit Real-Time (SSE + Polling)', endpoint: '/api/v1/payments/sync-status/:id', expectedResult: 'Status pembayaran otomatis berubah ke PAID tanpa reload' },
  { code: 'CHK-04', module: 'Checkout & Order', title: 'Timeline Tracking & Pengajuan Retur', endpoint: '/api/v1/orders/:id/return', expectedResult: 'Pengajuan retur tersimpan dan tampil di ERP Retur' },
  { code: 'ERP-02', module: 'ERP Kasir POS', title: 'Buka/Tutup Shift Kasir & Rekonsiliasi', endpoint: '/api/v1/store/shifts/open, /close', expectedResult: 'Modal awal, total penjualan kas, & selisih kas akurat' },
  { code: 'ERP-03', module: 'ERP Inventory', title: 'CRUD Stok, Breakdown & Export/Import', endpoint: '/api/v1/store/inventory', expectedResult: 'Stok akurat dan tidak bisa minus' },
  { code: 'ERP-04', module: 'ERP Orders', title: 'Approve, Ship (Resi), Complete & Reject', endpoint: '/api/v1/store/orders', expectedResult: 'Status order & pemulihan stok saat reject berjalan benar' },
  { code: 'ERP-19', module: 'ERP Purchasing', title: 'Supplier, PO, Terima Barang & Pelunasan', endpoint: '/api/v1/store/purchase-orders', expectedResult: 'Terima PO menambah stok dan pelunasan mengubah status PAID' },
  { code: 'ERP-20', module: 'ERP Retur', title: 'Setujui / Tolak / Refund Pengajuan Retur', endpoint: '/api/v1/store/returns', expectedResult: 'Status retur dan order terupdate serta tercatat di Audit Log' },
  { code: 'ERP-22', module: 'ERP Settings & RBAC', title: 'Pengaturan Toko & Matriks Role Permission', endpoint: '/api/v1/store/rbac/roles', expectedResult: 'Toggle permission role tersimpan ke DB dan mengontrol akses' },
];

let seededDefaults = false;
async function ensureDevSchemasInitialized() {
  if (seededDefaults) return;
  try {
    const countRes = await pool.query(`SELECT COUNT(*)::int AS cnt FROM store.dev_test_schemas`);
    if (Number(countRes.rows[0]?.cnt || 0) === 0) {
      for (const s of DEFAULT_DEV_SCHEMAS) {
        await pool.query(
          `INSERT INTO store.dev_test_schemas (id, code, module, title, endpoint, expected_result, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'UNTESTED')`,
          [`SCH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, s.code, s.module, s.title, s.endpoint, s.expectedResult]
        );
      }
    }
    seededDefaults = true;
  } catch (err: any) {
    console.warn('[devQa] Init warning:', err?.message);
  }
}

export const devQaService = {
  async getSchemas() {
    await ensureDevSchemasInitialized();
    const res = await pool.query(
      `SELECT id, code, module, title, endpoint, expected_result AS "expectedResult",
              status, is_new_request AS "isNewRequest",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM store.dev_test_schemas
       ORDER BY is_new_request DESC, code ASC, created_at DESC`
    );
    return res.rows;
  },

  async createSchema(payload: {
    code?: string;
    module: string;
    title: string;
    endpoint?: string;
    expectedResult?: string;
    isNewRequest?: boolean;
  }) {
    await ensureDevSchemasInitialized();
    if (!payload.title?.trim() || !payload.module?.trim()) {
      throw new AppError('Modul dan judul skema wajib diisi.', 400);
    }
    const id = `SCH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const code = payload.code?.trim() || (payload.isNewRequest ? `REQ-${Date.now().toString().slice(-4)}` : `QA-${Date.now().toString().slice(-4)}`);
    const res = await pool.query(
      `INSERT INTO store.dev_test_schemas
         (id, code, module, title, endpoint, expected_result, status, is_new_request)
       VALUES ($1, $2, $3, $4, $5, $6, 'UNTESTED', $7)
       RETURNING id, code, module, title, endpoint, expected_result AS "expectedResult",
                 status, is_new_request AS "isNewRequest", created_at AS "createdAt"`,
      [
        id,
        code,
        payload.module.trim(),
        payload.title.trim(),
        payload.endpoint?.trim() || null,
        payload.expectedResult?.trim() || null,
        Boolean(payload.isNewRequest),
      ]
    );
    return res.rows[0];
  },

  async updateSchema(
    id: string,
    payload: {
      code?: string;
      module?: string;
      title?: string;
      endpoint?: string;
      expectedResult?: string;
      status?: 'UNTESTED' | 'PASS' | 'FAIL';
      isNewRequest?: boolean;
    }
  ) {
    const existingRes = await pool.query(`SELECT * FROM store.dev_test_schemas WHERE id = $1 LIMIT 1`, [id]);
    if (existingRes.rows.length === 0) throw new AppError('Skema tidak ditemukan.', 404);
    const cur = existingRes.rows[0];

    const res = await pool.query(
      `UPDATE store.dev_test_schemas
       SET code = $1, module = $2, title = $3, endpoint = $4, expected_result = $5,
           status = $6, is_new_request = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING id, code, module, title, endpoint, expected_result AS "expectedResult",
                 status, is_new_request AS "isNewRequest", updated_at AS "updatedAt"`,
      [
        payload.code ?? cur.code,
        payload.module ?? cur.module,
        payload.title ?? cur.title,
        payload.endpoint ?? cur.endpoint,
        payload.expectedResult ?? cur.expected_result,
        payload.status ?? cur.status,
        payload.isNewRequest ?? cur.is_new_request,
        id,
      ]
    );
    return res.rows[0];
  },

  async deleteSchema(id: string) {
    await pool.query(`DELETE FROM store.dev_test_schemas WHERE id = $1`, [id]);
    return { id, deleted: true };
  },

  async getBugs() {
    await ensureDevSchemasInitialized();
    const res = await pool.query(
      `SELECT id, schema_id AS "schemaId", schema_code AS "schemaCode", schema_title AS "schemaTitle",
              title, severity, status, note_type AS "noteType", current_url AS "currentUrl",
              steps_or_note AS "stepsOrNote", expected_behavior AS "expectedBehavior",
              actual_behavior AS "actualBehavior", logs_json AS logs,
              COALESCE(verification_status, 'PENDING_TEST') AS "verificationStatus",
              verification_note AS "verificationNote",
              root_cause AS "rootCause",
              solution,
              parent_bug_id AS "parentBugId",
              error_flow AS "errorFlow",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM store.dev_bug_notes
       ORDER BY CASE status WHEN 'OPEN' THEN 0 WHEN 'IN_PROGRESS' THEN 1 WHEN 'HAS_EXTRA_ERROR' THEN 2 WHEN 'NEED_RETEST' THEN 3 ELSE 4 END, created_at DESC`
    );
    return res.rows;
  },

  async createBug(payload: {
    schemaId?: string;
    schemaCode?: string;
    schemaTitle?: string;
    title: string;
    severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    noteType?: 'BUG' | 'SCHEMA_REQUEST';
    currentUrl?: string;
    stepsOrNote: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    parentBugId?: string;
    errorFlow?: string;
    logs?: any;
  }) {
    if (!payload.title?.trim() || !payload.stepsOrNote?.trim()) {
      throw new AppError('Judul dan catatan bug wajib diisi.', 400);
    }

    let resolvedSchemaCode = payload.schemaCode || null;
    let resolvedSchemaTitle = payload.schemaTitle || null;

    if (payload.schemaId) {
      const sRes = await pool.query(
        `SELECT id, code, title FROM store.dev_test_schemas WHERE id = $1 LIMIT 1`,
        [payload.schemaId]
      );
      if (sRes.rows[0]) {
        resolvedSchemaCode = sRes.rows[0].code;
        resolvedSchemaTitle = sRes.rows[0].title;
        if ((payload.noteType || 'BUG') === 'BUG') {
          await pool.query(
            `UPDATE store.dev_test_schemas SET status = 'FAIL', updated_at = NOW() WHERE id = $1`,
            [payload.schemaId]
          );
        }
      }
    }

    const id = `BUG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const res = await pool.query(
      `INSERT INTO store.dev_bug_notes
         (id, schema_id, schema_code, schema_title, title, severity, status, note_type, current_url, steps_or_note, expected_behavior, actual_behavior, parent_bug_id, error_flow, logs_json)
       VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
       RETURNING id, schema_id AS "schemaId", schema_code AS "schemaCode", schema_title AS "schemaTitle",
                 title, severity, status, note_type AS "noteType", current_url AS "currentUrl",
                 steps_or_note AS "stepsOrNote", expected_behavior AS "expectedBehavior",
                 actual_behavior AS "actualBehavior", parent_bug_id AS "parentBugId", error_flow AS "errorFlow",
                 root_cause AS "rootCause", solution, logs_json AS logs, created_at AS "createdAt"`,
      [
        id,
        payload.schemaId || null,
        resolvedSchemaCode,
        resolvedSchemaTitle,
        payload.title.trim(),
        payload.severity || 'MEDIUM',
        payload.noteType || 'BUG',
        payload.currentUrl || null,
        payload.stepsOrNote.trim(),
        payload.expectedBehavior?.trim() || null,
        payload.actualBehavior?.trim() || null,
        payload.parentBugId?.trim() || null,
        payload.errorFlow?.trim() || null,
        payload.logs ? JSON.stringify(payload.logs) : null,
      ]
    );
    return res.rows[0];
  },

  async updateBug(
    id: string,
    payload: {
      status?: 'OPEN' | 'IN_PROGRESS' | 'NEED_RETEST' | 'FIXED' | 'HAS_EXTRA_ERROR';
      severity?: string;
      stepsOrNote?: string;
      verificationStatus?: 'PENDING_TEST' | 'PASSED' | 'HAS_EXTRA_ERROR';
      verificationNote?: string;
      rootCause?: string;
      solution?: string;
      errorFlow?: string;
      parentBugId?: string;
    }
  ) {
    const existing = await pool.query(`SELECT * FROM store.dev_bug_notes WHERE id = $1 LIMIT 1`, [id]);
    if (existing.rows.length === 0) throw new AppError('Catatan bug tidak ditemukan.', 404);
    const cur = existing.rows[0];

    const nextStatus = payload.status || cur.status;
    const nextVerStatus =
      payload.verificationStatus ||
      (nextStatus === 'FIXED' ? 'PASSED' : nextStatus === 'HAS_EXTRA_ERROR' ? 'HAS_EXTRA_ERROR' : cur.verification_status || 'PENDING_TEST');
    const res = await pool.query(
      `UPDATE store.dev_bug_notes
       SET status = $1,
           severity = $2,
           steps_or_note = $3,
           verification_status = $4,
           verification_note = COALESCE($5, verification_note),
           root_cause = COALESCE($6, root_cause),
           solution = COALESCE($7, solution),
           error_flow = COALESCE($8, error_flow),
           parent_bug_id = COALESCE($9, parent_bug_id),
           updated_at = NOW()
       WHERE id = $10
       RETURNING id, schema_id AS "schemaId", schema_code AS "schemaCode", schema_title AS "schemaTitle",
                 title, severity, status, note_type AS "noteType", current_url AS "currentUrl",
                 steps_or_note AS "stepsOrNote", expected_behavior AS "expectedBehavior",
                 actual_behavior AS "actualBehavior", logs_json AS logs,
                 verification_status AS "verificationStatus", verification_note AS "verificationNote",
                 root_cause AS "rootCause", solution, parent_bug_id AS "parentBugId", error_flow AS "errorFlow",
                 updated_at AS "updatedAt"`,
      [
        nextStatus,
        payload.severity || cur.severity,
        payload.stepsOrNote || cur.steps_or_note,
        nextVerStatus,
        payload.verificationNote ?? null,
        payload.rootCause ?? null,
        payload.solution ?? null,
        payload.errorFlow ?? null,
        payload.parentBugId ?? null,
        id,
      ]
    );

    if (nextStatus === 'FIXED' && cur.schema_id) {
      await pool.query(
        `UPDATE store.dev_test_schemas SET status = 'PASS', updated_at = NOW() WHERE id = $1`,
        [cur.schema_id]
      );
    }

    return res.rows[0];
  },

  async batchUpdateBugs(
    updates: Array<{
      id: string;
      status?: 'OPEN' | 'IN_PROGRESS' | 'NEED_RETEST' | 'FIXED' | 'HAS_EXTRA_ERROR';
      rootCause?: string;
      solution?: string;
      verificationNote?: string;
      errorFlow?: string;
    }>
  ) {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new AppError('Daftar pembaruan bug tidak boleh kosong.', 400);
    }
    const client = await pool.connect();
    const results: any[] = [];
    const fixedSchemaIds = new Set<string>();
    try {
      await client.query('BEGIN');
      for (const item of updates) {
        if (!item?.id) continue;
        const nextStatus = item.status;
        const nextVerStatus =
          nextStatus === 'FIXED' ? 'PASSED' : nextStatus === 'HAS_EXTRA_ERROR' ? 'HAS_EXTRA_ERROR' : undefined;
        const res = await client.query(
          `UPDATE store.dev_bug_notes
           SET status = COALESCE($1, status),
               verification_status = COALESCE($2, verification_status),
               verification_note = COALESCE($3, verification_note),
               root_cause = COALESCE($4, root_cause),
               solution = COALESCE($5, solution),
               error_flow = COALESCE($6, error_flow),
               updated_at = NOW()
           WHERE id = $7
           RETURNING id, schema_id AS "schemaId", status, root_cause AS "rootCause", solution, updated_at AS "updatedAt"`,
          [
            nextStatus ?? null,
            nextVerStatus ?? null,
            item.verificationNote ?? null,
            item.rootCause ?? null,
            item.solution ?? null,
            item.errorFlow ?? null,
            item.id,
          ]
        );
        if (res.rows[0]) {
          results.push(res.rows[0]);
          if (res.rows[0].status === 'FIXED' && res.rows[0].schemaId) {
            fixedSchemaIds.add(res.rows[0].schemaId);
          }
        }
      }
      if (fixedSchemaIds.size > 0) {
        await client.query(
          `UPDATE store.dev_test_schemas SET status = 'PASS', updated_at = NOW() WHERE id = ANY($1::text[])`,
          [Array.from(fixedSchemaIds)]
        );
      }
      await client.query('COMMIT');
      return { updatedCount: results.length, items: results };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async deleteBug(id: string) {
    await pool.query(`DELETE FROM store.dev_bug_notes WHERE id = $1`, [id]);
    return { id, deleted: true };
  },

  async getRecordings() {
    const res = await pool.query(
      `SELECT id, name, schema_id AS "schemaId", start_url AS "startUrl",
              steps_json AS steps, api_hits_json AS "apiHits",
              playwright_spec AS "playwrightSpec", created_at AS "createdAt"
       FROM store.dev_playwright_recordings
       ORDER BY created_at DESC`
    );
    return res.rows;
  },

  async createRecording(payload: {
    name: string;
    schemaId?: string;
    startUrl?: string;
    steps: any[];
    apiHits: any[];
    playwrightSpec: string;
  }) {
    if (!payload.name?.trim() || !payload.playwrightSpec?.trim()) {
      throw new AppError('Nama rekaman dan script Playwright wajib diisi.', 400);
    }
    const id = `REC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const res = await pool.query(
      `INSERT INTO store.dev_playwright_recordings
         (id, name, schema_id, start_url, steps_json, api_hits_json, playwright_spec)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
       RETURNING id, name, schema_id AS "schemaId", start_url AS "startUrl",
                 steps_json AS steps, api_hits_json AS "apiHits",
                 playwright_spec AS "playwrightSpec", created_at AS "createdAt"`,
      [
        id,
        payload.name.trim(),
        payload.schemaId || null,
        payload.startUrl || null,
        JSON.stringify(payload.steps || []),
        JSON.stringify(payload.apiHits || []),
        payload.playwrightSpec,
      ]
    );
    return res.rows[0];
  },

  async deleteRecording(id: string) {
    await pool.query(`DELETE FROM store.dev_playwright_recordings WHERE id = $1`, [id]);
    return { id, deleted: true };
  },
};
