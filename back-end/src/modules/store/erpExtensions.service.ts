import crypto from 'crypto';
import { pool } from '@/prisma/db';
import { AppError } from '@/utils/AppError';
import { logStoreActivity } from '@/utils/auditLog';

export const erpExtensionsService = {
  // ── 1. CASHIER SHIFT MANAGEMENT ─────────────────────────────────────────
  async getCurrentShift(cashierId?: string) {
    const res = await pool.query(
      `SELECT id, cashier_id AS "cashierId", cashier_name AS "cashierName",
              device_id AS "deviceId", opening_cash AS "openingCash",
              closing_cash AS "closingCash", expected_cash AS "expectedCash",
              cash_difference AS "cashDifference", total_cash_sales AS "totalCashSales",
              total_non_cash_sales AS "totalNonCashSales", total_transactions AS "totalTransactions",
              status, notes, opened_at AS "openedAt", closed_at AS "closedAt"
       FROM store.cashier_shifts
       WHERE status = 'OPEN'
         ${cashierId ? 'AND cashier_id = $1' : ''}
       ORDER BY opened_at DESC
       LIMIT 1`,
      cashierId ? [cashierId] : []
    );
    return res.rows[0] || null;
  },

  async getShifts(limit = 30) {
    const res = await pool.query(
      `SELECT id, cashier_id AS "cashierId", cashier_name AS "cashierName",
              device_id AS "deviceId", opening_cash AS "openingCash",
              closing_cash AS "closingCash", expected_cash AS "expectedCash",
              cash_difference AS "cashDifference", total_cash_sales AS "totalCashSales",
              total_non_cash_sales AS "totalNonCashSales", total_transactions AS "totalTransactions",
              status, notes, opened_at AS "openedAt", closed_at AS "closedAt"
       FROM store.cashier_shifts
       ORDER BY opened_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  },

  async openShift(
    actor: { id: string; email?: string; staffRole?: string | null },
    payload: { openingCash: number; deviceId?: string; cashierName?: string; notes?: string }
  ) {
    const existing = await this.getCurrentShift(actor.id);
    if (existing) {
      throw new AppError('Shift kasir Anda masih terbuka. Tutup shift sebelumnya terlebih dahulu.', 400);
    }

    const userRes = await pool.query(
      `SELECT "fullName", email FROM core_auth.users WHERE id = $1 LIMIT 1`,
      [actor.id]
    );
    const cashierName =
      payload.cashierName?.trim() ||
      userRes.rows[0]?.fullName ||
      actor.email ||
      'Kasir Toko';

    const openingCash = Math.max(0, Number(payload.openingCash || 0));
    const id = `SHF-${crypto.randomUUID().slice(0, 10).toUpperCase()}`;

    const res = await pool.query(
      `INSERT INTO store.cashier_shifts
         (id, cashier_id, cashier_name, device_id, opening_cash, expected_cash, status, notes)
       VALUES ($1, $2, $3, $4, $5, $5, 'OPEN', $6)
       RETURNING id, cashier_id AS "cashierId", cashier_name AS "cashierName",
                 device_id AS "deviceId", opening_cash AS "openingCash",
                 expected_cash AS "expectedCash", status, notes, opened_at AS "openedAt"`,
      [id, actor.id, cashierName, payload.deviceId || null, openingCash, payload.notes || null]
    );

    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: 'OPEN_SHIFT',
      module: 'CASHIER',
      entityId: id,
      summary: `Membuka shift kasir ${cashierName} dengan modal awal Rp ${openingCash.toLocaleString('id-ID')}`,
      metadata: { openingCash, deviceId: payload.deviceId || null },
    });

    return res.rows[0];
  },

  async closeShift(
    shiftId: string,
    actor: { id: string; email?: string; staffRole?: string | null },
    payload: { closingCash: number; notes?: string }
  ) {
    const shiftRes = await pool.query(
      `SELECT * FROM store.cashier_shifts WHERE id = $1 LIMIT 1`,
      [shiftId]
    );
    if (shiftRes.rows.length === 0) {
      throw new AppError('Shift kasir tidak ditemukan.', 404);
    }
    const shift = shiftRes.rows[0];
    if (shift.status === 'CLOSED') {
      throw new AppError('Shift kasir ini sudah ditutup.', 400);
    }

    // Aggregate POS sales created during this shift window
    const salesRes = await pool.query(
      `SELECT
         COUNT(*)::int AS total_tx,
         COALESCE(SUM(CASE WHEN "paymentMethod" IN ('CASH_STORE', 'CASH', 'COD') THEN "totalAmount" ELSE 0 END), 0) AS cash_sales,
         COALESCE(SUM(CASE WHEN "paymentMethod" NOT IN ('CASH_STORE', 'CASH', 'COD') THEN "totalAmount" ELSE 0 END), 0) AS non_cash_sales
       FROM orders.orders
       WHERE "createdAt" >= $1
         AND "paymentStatus" = 'PAID'
         AND COALESCE(source_channel, 'ONLINE') IN ('POS', 'OFFLINE', 'KASIR')`,
      [shift.opened_at]
    );

    const totalCashSales = Number(salesRes.rows[0]?.cash_sales || 0);
    const totalNonCashSales = Number(salesRes.rows[0]?.non_cash_sales || 0);
    const totalTransactions = Number(salesRes.rows[0]?.total_tx || 0);
    const expectedCash = Number(shift.opening_cash || 0) + totalCashSales;
    const closingCash = Math.max(0, Number(payload.closingCash || 0));
    const cashDifference = closingCash - expectedCash;

    const updated = await pool.query(
      `UPDATE store.cashier_shifts
       SET closing_cash = $1,
           expected_cash = $2,
           cash_difference = $3,
           total_cash_sales = $4,
           total_non_cash_sales = $5,
           total_transactions = $6,
           status = 'CLOSED',
           notes = COALESCE($7, notes),
           closed_at = NOW()
       WHERE id = $8
       RETURNING id, cashier_id AS "cashierId", cashier_name AS "cashierName",
                 opening_cash AS "openingCash", closing_cash AS "closingCash",
                 expected_cash AS "expectedCash", cash_difference AS "cashDifference",
                 total_cash_sales AS "totalCashSales", total_non_cash_sales AS "totalNonCashSales",
                 total_transactions AS "totalTransactions", status, notes,
                 opened_at AS "openedAt", closed_at AS "closedAt"`,
      [
        closingCash,
        expectedCash,
        cashDifference,
        totalCashSales,
        totalNonCashSales,
        totalTransactions,
        payload.notes || null,
        shiftId,
      ]
    );

    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: 'CLOSE_SHIFT',
      module: 'CASHIER',
      entityId: shiftId,
      summary: `Menutup shift kasir ${shift.cashier_name} (Selisih kas: Rp ${cashDifference.toLocaleString('id-ID')})`,
      metadata: { expectedCash, closingCash, cashDifference, totalTransactions },
    });

    return updated.rows[0];
  },

  // ── 2. SUPPLIERS & PURCHASING (ACCOUNTS PAYABLE) ────────────────────────
  async getSuppliers() {
    const res = await pool.query(
      `SELECT id, code, name, contact_person AS "contactPerson", phone, email, address,
              notes, is_active AS "isActive", created_at AS "createdAt"
       FROM store.suppliers
       ORDER BY created_at DESC`
    );
    return res.rows;
  },

  async createSupplier(
    actor: { id: string; email?: string; staffRole?: string | null },
    payload: {
      code?: string;
      name: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      address?: string;
      notes?: string;
    }
  ) {
    if (!payload.name?.trim()) {
      throw new AppError('Nama supplier wajib diisi.', 400);
    }
    const id = `SUP-${crypto.randomUUID().slice(0, 10).toUpperCase()}`;
    const code = payload.code?.trim() || `SUP-${Date.now().toString().slice(-4)}`;
    const res = await pool.query(
      `INSERT INTO store.suppliers (id, code, name, contact_person, phone, email, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, code, name, contact_person AS "contactPerson", phone, email, address,
                 notes, is_active AS "isActive", created_at AS "createdAt"`,
      [
        id,
        code,
        payload.name.trim(),
        payload.contactPerson?.trim() || null,
        payload.phone?.trim() || null,
        payload.email?.trim() || null,
        payload.address?.trim() || null,
        payload.notes?.trim() || null,
      ]
    );

    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: 'CREATE_SUPPLIER',
      module: 'PURCHASING',
      entityId: id,
      summary: `Menambahkan supplier baru: ${payload.name.trim()}`,
    });

    return res.rows[0];
  },

  async deleteSupplier(
    supplierId: string,
    actor: { id: string; email?: string; staffRole?: string | null }
  ) {
    await pool.query(`DELETE FROM store.suppliers WHERE id = $1`, [supplierId]);
    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: 'DELETE_SUPPLIER',
      module: 'PURCHASING',
      entityId: supplierId,
      summary: `Menghapus supplier ${supplierId}`,
    });
    return { id: supplierId, deleted: true };
  },

  async getPurchaseOrders() {
    const res = await pool.query(
      `SELECT id, po_number AS "poNumber", supplier_id AS "supplierId", supplier_name AS "supplierName",
              status, payment_status AS "paymentStatus", subtotal, tax_amount AS "taxAmount",
              total_amount AS "totalAmount", paid_amount AS "paidAmount", due_date AS "dueDate",
              items_json AS items, notes, created_by AS "createdBy", received_at AS "receivedAt",
              created_at AS "createdAt"
       FROM store.purchase_orders
       ORDER BY created_at DESC`
    );
    return res.rows;
  },

  async createPurchaseOrder(
    actor: { id: string; email?: string; staffRole?: string | null },
    payload: {
      supplierId: string;
      dueDate?: string;
      notes?: string;
      taxAmount?: number;
      items: Array<{ productId?: string; sku?: string; name: string; qty: number; unitCost: number }>;
    }
  ) {
    if (!payload.items || payload.items.length === 0) {
      throw new AppError('Daftar barang Purchase Order tidak boleh kosong.', 400);
    }

    const supRes = await pool.query(
      `SELECT id, name FROM store.suppliers WHERE id = $1 LIMIT 1`,
      [payload.supplierId]
    );
    if (supRes.rows.length === 0) {
      throw new AppError('Supplier tidak ditemukan.', 404);
    }

    const subtotal = payload.items.reduce(
      (sum, item) => sum + Number(item.qty || 0) * Number(item.unitCost || 0),
      0
    );
    const taxAmount = Math.max(0, Number(payload.taxAmount || 0));
    const totalAmount = subtotal + taxAmount;
    const id = `PO-${crypto.randomUUID().slice(0, 10).toUpperCase()}`;
    const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await pool.query(
      `INSERT INTO store.purchase_orders
         (id, po_number, supplier_id, supplier_name, status, payment_status, subtotal, tax_amount, total_amount, paid_amount, due_date, items_json, notes, created_by)
       VALUES ($1, $2, $3, $4, 'ORDERED', 'UNPAID', $5, $6, $7, 0, $8, $9::jsonb, $10, $11)
       RETURNING id, po_number AS "poNumber", supplier_id AS "supplierId", supplier_name AS "supplierName",
                 status, payment_status AS "paymentStatus", subtotal, tax_amount AS "taxAmount",
                 total_amount AS "totalAmount", paid_amount AS "paidAmount", due_date AS "dueDate",
                 items_json AS items, notes, created_at AS "createdAt"`,
      [
        id,
        poNumber,
        supRes.rows[0].id,
        supRes.rows[0].name,
        subtotal,
        taxAmount,
        totalAmount,
        payload.dueDate ? new Date(payload.dueDate) : null,
        JSON.stringify(payload.items),
        payload.notes || null,
        actor.email || actor.id,
      ]
    );

    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: 'CREATE_PO',
      module: 'PURCHASING',
      entityId: id,
      summary: `Membuat Purchase Order ${poNumber} ke ${supRes.rows[0].name} (Rp ${totalAmount.toLocaleString('id-ID')})`,
    });

    return res.rows[0];
  },

  async receivePurchaseOrder(
    poId: string,
    actor: { id: string; email?: string; staffRole?: string | null }
  ) {
    const poRes = await pool.query(
      `SELECT * FROM store.purchase_orders WHERE id = $1 LIMIT 1`,
      [poId]
    );
    if (poRes.rows.length === 0) {
      throw new AppError('Purchase Order tidak ditemukan.', 404);
    }
    const po = poRes.rows[0];
    if (po.status === 'RECEIVED') {
      throw new AppError('Purchase Order ini sudah diterima sebelumnya.', 400);
    }

    const items: Array<{ productId?: string; sku?: string; qty: number }> = Array.isArray(po.items_json)
      ? po.items_json
      : [];

    for (const item of items) {
      const qty = Number(item.qty || 0);
      if (qty <= 0) continue;
      if (item.productId) {
        await pool.query(
          `UPDATE products.products
           SET stock = stock + $1,
               physical_stock = COALESCE(physical_stock, 0) + $1,
               "updatedAt" = NOW()
           WHERE id = $2`,
          [qty, item.productId]
        );
      } else if (item.sku) {
        await pool.query(
          `UPDATE products.products
           SET stock = stock + $1,
               physical_stock = COALESCE(physical_stock, 0) + $1,
               "updatedAt" = NOW()
           WHERE sku = $2`,
          [qty, item.sku]
        );
      }
    }

    const updated = await pool.query(
      `UPDATE store.purchase_orders
       SET status = 'RECEIVED', received_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING id, po_number AS "poNumber", status, payment_status AS "paymentStatus", received_at AS "receivedAt"`,
      [poId]
    );

    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: 'RECEIVE_PO',
      module: 'PURCHASING',
      entityId: poId,
      summary: `Menerima barang PO ${po.po_number} dan menambahkan stok ke inventori`,
    });

    return updated.rows[0];
  },

  async payPurchaseOrder(
    poId: string,
    actor: { id: string; email?: string; staffRole?: string | null },
    payload: { amount: number }
  ) {
    const poRes = await pool.query(
      `SELECT * FROM store.purchase_orders WHERE id = $1 LIMIT 1`,
      [poId]
    );
    if (poRes.rows.length === 0) {
      throw new AppError('Purchase Order tidak ditemukan.', 404);
    }
    const po = poRes.rows[0];
    const payAmount = Math.max(0, Number(payload.amount || 0));
    const newPaid = Math.min(Number(po.total_amount), Number(po.paid_amount || 0) + payAmount);
    const paymentStatus = newPaid >= Number(po.total_amount) ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID';

    const updated = await pool.query(
      `UPDATE store.purchase_orders
       SET paid_amount = $1, payment_status = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, po_number AS "poNumber", total_amount AS "totalAmount",
                 paid_amount AS "paidAmount", payment_status AS "paymentStatus"`,
      [newPaid, paymentStatus, poId]
    );

    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: 'PAY_PO',
      module: 'PURCHASING',
      entityId: poId,
      summary: `Membayar hutang PO ${po.po_number} sebesar Rp ${payAmount.toLocaleString('id-ID')} (${paymentStatus})`,
    });

    return updated.rows[0];
  },

  // ── 3. ORDER RETURNS / REFUNDS (ADMIN) ──────────────────────────────────
  async getOrderReturns() {
    const res = await pool.query(
      `SELECT r.id, r.order_id AS "orderId", r.order_number AS "orderNumber",
              r.user_id AS "userId", u."fullName" AS "customerName", u.email AS "customerEmail",
              r.reason, r.description, r.evidence_url AS "evidenceUrl", r.status,
              r.admin_notes AS "adminNotes", r.refund_amount AS "refundAmount",
              r.processed_by AS "processedBy", r.created_at AS "createdAt"
       FROM orders.order_returns r
       LEFT JOIN core_auth.users u ON u.id = r.user_id
       ORDER BY r.created_at DESC`
    );
    return res.rows;
  },

  async processOrderReturn(
    returnId: string,
    actor: { id: string; email?: string; staffRole?: string | null },
    payload: { status: 'APPROVED' | 'REJECTED' | 'REFUNDED'; adminNotes?: string; refundAmount?: number }
  ) {
    const retRes = await pool.query(
      `SELECT * FROM orders.order_returns WHERE id = $1 LIMIT 1`,
      [returnId]
    );
    if (retRes.rows.length === 0) {
      throw new AppError('Pengajuan retur tidak ditemukan.', 404);
    }
    const ret = retRes.rows[0];

    const updated = await pool.query(
      `UPDATE orders.order_returns
       SET status = $1,
           admin_notes = $2,
           refund_amount = COALESCE($3, refund_amount),
           processed_by = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, order_id AS "orderId", order_number AS "orderNumber", status,
                 admin_notes AS "adminNotes", refund_amount AS "refundAmount"`,
      [payload.status, payload.adminNotes || null, payload.refundAmount ?? null, actor.email || actor.id, returnId]
    );

    if (payload.status === 'APPROVED') {
      await pool.query(
        `UPDATE orders.orders
         SET "orderStatus" = 'RETURN_APPROVED', "updatedAt" = NOW()
         WHERE id = $1`,
        [ret.order_id]
      );
    } else if (payload.status === 'REJECTED') {
      await pool.query(
        `UPDATE orders.orders
         SET "orderStatus" = 'COMPLETED', "updatedAt" = NOW()
         WHERE id = $1 AND "orderStatus" = 'RETURN_REQUESTED'`,
        [ret.order_id]
      );
    } else if (payload.status === 'REFUNDED') {
      await pool.query(
        `UPDATE orders.orders
         SET "paymentStatus" = 'REFUNDED', "orderStatus" = 'REFUNDED', "updatedAt" = NOW()
         WHERE id = $1`,
        [ret.order_id]
      );
    }

    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: `RETURN_${payload.status}`,
      module: 'RETURNS',
      entityId: returnId,
      summary: `Memproses retur pesanan ${ret.order_number} menjadi ${payload.status}`,
    });

    return updated.rows[0];
  },

  // ── 4. AUDIT LOGS ───────────────────────────────────────────────────────
  async getAuditLogs(filters?: { module?: string; action?: string; search?: string; limit?: number }) {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let idx = 1;

    if (filters?.module && filters.module !== 'ALL') {
      conditions.push(`UPPER(module) = UPPER($${idx++})`);
      params.push(filters.module);
    }
    if (filters?.action && filters.action !== 'ALL') {
      conditions.push(`UPPER(action) ILIKE $${idx++}`);
      params.push(`%${filters.action}%`);
    }
    if (filters?.search?.trim()) {
      conditions.push(`(summary ILIKE $${idx} OR actor_email ILIKE $${idx} OR entity_id ILIKE $${idx})`);
      params.push(`%${filters.search.trim()}%`);
      idx++;
    }

    const limit = Math.min(Math.max(Number(filters?.limit || 150), 1), 500);
    params.push(limit);

    const res = await pool.query(
      `SELECT id, actor_id AS "actorId", actor_email AS "actorEmail", actor_role AS "actorRole",
              action, module, entity_id AS "entityId", summary, metadata, created_at AS "createdAt"
       FROM store.audit_logs
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${idx}`,
      params
    );
    return res.rows;
  },

  // ── 4b. PRODUCT CATEGORIES & UNITS (MASTER DATA) ────────────────────────
  async getProductCategories() {
    const res = await pool.query(
      `SELECT id, name, slug, description, is_active AS "isActive"
       FROM products.categories
       WHERE COALESCE(is_active, true) = true
       ORDER BY name ASC`
    );
    return res.rows;
  },

  async createProductCategory(
    actor: { id: string; email?: string; staffRole?: string | null },
    payload: { name: string; description?: string }
  ) {
    if (!payload.name?.trim()) throw new AppError('Nama kategori wajib diisi.', 400);
    const name = payload.name.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const id = `CAT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const res = await pool.query(
      `INSERT INTO products.categories (id, name, slug, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO UPDATE SET is_active = true
       RETURNING id, name, slug, description, is_active AS "isActive"`,
      [id, name, slug, payload.description || null]
    );
    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: 'CREATE_CATEGORY',
      module: 'INVENTORY',
      entityId: res.rows[0]?.id || id,
      summary: `Menambahkan kategori produk: ${name}`,
    });
    return res.rows[0];
  },

  async getProductUnits() {
    const res = await pool.query(
      `SELECT id, code, name, is_active AS "isActive"
       FROM products.units
       WHERE COALESCE(is_active, true) = true
       ORDER BY code ASC`
    );
    return res.rows;
  },

  async createProductUnit(
    actor: { id: string; email?: string; staffRole?: string | null },
    payload: { code: string; name?: string }
  ) {
    if (!payload.code?.trim()) throw new AppError('Kode satuan barang wajib diisi.', 400);
    const code = payload.code.trim();
    const name = payload.name?.trim() || code;
    const id = `UNT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const res = await pool.query(
      `INSERT INTO products.units (id, code, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET is_active = true
       RETURNING id, code, name, is_active AS "isActive"`,
      [id, code, name]
    );
    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: 'CREATE_UNIT',
      module: 'INVENTORY',
      entityId: res.rows[0]?.id || id,
      summary: `Menambahkan satuan produk: ${code}`,
    });
    return res.rows[0];
  },

  // ── 5. STORE SETTINGS ───────────────────────────────────────────────────
  async getStoreSettings() {
    const res = await pool.query(
      `SELECT id, store_name AS "storeName", store_tagline AS "storeTagline",
              is_open AS "isOpen", tax_rate_percent AS "taxRatePercent",
              service_fee AS "serviceFee", min_order_amount AS "minOrderAmount",
              auto_cancel_minutes AS "autoCancelMinutes",
              manual_bank_accounts AS "manualBankAccounts",
              updated_by AS "updatedBy", updated_at AS "updatedAt"
       FROM store.store_settings
       WHERE id = 'default'
       LIMIT 1`
    );
    return res.rows[0] || {
      id: 'default',
      storeName: 'BC HNI Bukittinggi 3',
      storeTagline: 'Pusat Produk Halal & Herbal Terpercaya',
      isOpen: true,
      taxRatePercent: 0,
      serviceFee: 0,
      minOrderAmount: 0,
      autoCancelMinutes: 1440,
      manualBankAccounts: [],
    };
  },

  async updateStoreSettings(
    actor: { id: string; email?: string; staffRole?: string | null },
    payload: {
      storeName?: string;
      storeTagline?: string;
      isOpen?: boolean;
      taxRatePercent?: number;
      serviceFee?: number;
      minOrderAmount?: number;
      autoCancelMinutes?: number;
      manualBankAccounts?: any[];
    }
  ) {
    const current = await this.getStoreSettings();
    const res = await pool.query(
      `INSERT INTO store.store_settings
         (id, store_name, store_tagline, is_open, tax_rate_percent, service_fee, min_order_amount, auto_cancel_minutes, manual_bank_accounts, updated_by, updated_at)
       VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, NOW())
       ON CONFLICT (id) DO UPDATE SET
         store_name = EXCLUDED.store_name,
         store_tagline = EXCLUDED.store_tagline,
         is_open = EXCLUDED.is_open,
         tax_rate_percent = EXCLUDED.tax_rate_percent,
         service_fee = EXCLUDED.service_fee,
         min_order_amount = EXCLUDED.min_order_amount,
         auto_cancel_minutes = EXCLUDED.auto_cancel_minutes,
         manual_bank_accounts = EXCLUDED.manual_bank_accounts,
         updated_by = EXCLUDED.updated_by,
         updated_at = NOW()
       RETURNING id, store_name AS "storeName", store_tagline AS "storeTagline",
                 is_open AS "isOpen", tax_rate_percent AS "taxRatePercent",
                 service_fee AS "serviceFee", min_order_amount AS "minOrderAmount",
                 auto_cancel_minutes AS "autoCancelMinutes",
                 manual_bank_accounts AS "manualBankAccounts",
                 updated_by AS "updatedBy", updated_at AS "updatedAt"`,
      [
        payload.storeName ?? current.storeName,
        payload.storeTagline ?? current.storeTagline,
        payload.isOpen ?? current.isOpen,
        Number(payload.taxRatePercent ?? current.taxRatePercent ?? 0),
        Number(payload.serviceFee ?? current.serviceFee ?? 0),
        Number(payload.minOrderAmount ?? current.minOrderAmount ?? 0),
        Number(payload.autoCancelMinutes ?? current.autoCancelMinutes ?? 1440),
        JSON.stringify(payload.manualBankAccounts ?? current.manualBankAccounts ?? []),
        actor.email || actor.id,
      ]
    );

    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: 'UPDATE_STORE_SETTINGS',
      module: 'SETTINGS',
      entityId: 'default',
      summary: 'Memperbarui konfigurasi pengaturan toko terpusat',
    });

    return res.rows[0];
  },

  // ── 6. RBAC ROLES & PERMISSIONS ─────────────────────────────────────────
  async getRbacRoles() {
    const rolesRes = await pool.query(
      `SELECT r.id, r.name, r."displayName", r.description, r."isSystem",
              COALESCE(
                (SELECT json_agg(p.code ORDER BY p.code)
                 FROM core_auth.role_permissions rp
                 JOIN core_auth.permissions p ON p.id = rp."permissionId"
                 WHERE rp."roleId" = r.id),
                '[]'::json
              ) AS permissions,
              (SELECT COUNT(*)::int FROM core_auth.user_roles ur WHERE ur."roleId" = r.id) AS "userCount"
       FROM core_auth.roles r
       ORDER BY r."isSystem" DESC, r.name ASC`
    );
    return rolesRes.rows;
  },

  async getRbacPermissions() {
    const res = await pool.query(
      `SELECT id, code, "group", description
       FROM core_auth.permissions
       ORDER BY "group" ASC, code ASC`
    );
    return res.rows;
  },

  async updateRolePermissions(
    roleId: string,
    actor: { id: string; email?: string; staffRole?: string | null },
    permissionCodes: string[]
  ) {
    const roleRes = await pool.query(
      `SELECT id, name FROM core_auth.roles WHERE id = $1 LIMIT 1`,
      [roleId]
    );
    if (roleRes.rows.length === 0) {
      throw new AppError('Role tidak ditemukan.', 404);
    }

    await pool.query(`DELETE FROM core_auth.role_permissions WHERE "roleId" = $1`, [roleId]);

    if (Array.isArray(permissionCodes) && permissionCodes.length > 0) {
      const permsRes = await pool.query(
        `SELECT id, code FROM core_auth.permissions WHERE code = ANY($1::text[])`,
        [permissionCodes]
      );
      for (const p of permsRes.rows) {
        await pool.query(
          `INSERT INTO core_auth.role_permissions ("roleId", "permissionId")
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [roleId, p.id]
        );
      }
    }

    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: 'UPDATE_ROLE_PERMISSIONS',
      module: 'RBAC',
      entityId: roleId,
      summary: `Memperbarui ${permissionCodes.length} permission untuk role ${roleRes.rows[0].name}`,
    });

    return { roleId, permissions: permissionCodes };
  },

  async assignUserRole(
    userId: string,
    actor: { id: string; email?: string; staffRole?: string | null },
    roleName: string
  ) {
    const roleRes = await pool.query(
      `SELECT id, name FROM core_auth.roles WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [roleName]
    );
    if (roleRes.rows.length === 0) {
      throw new AppError('Role tidak ditemukan.', 404);
    }
    const role = roleRes.rows[0];

    await pool.query(`DELETE FROM core_auth.user_roles WHERE "userId" = $1`, [userId]);
    await pool.query(
      `INSERT INTO core_auth.user_roles ("userId", "roleId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, role.id]
    );
    await pool.query(
      `UPDATE core_auth.users SET "userType" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [role.name.toUpperCase(), userId]
    );

    await logStoreActivity({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.staffRole,
      action: 'ASSIGN_USER_ROLE',
      module: 'RBAC',
      entityId: userId,
      summary: `Menetapkan role ${role.name} untuk user ${userId}`,
    });

    return { userId, role: role.name };
  },
};
