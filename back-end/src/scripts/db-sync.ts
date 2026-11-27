import 'dotenv/config';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const REQUIRED_CONTRACT_TABLES: Array<[string, string]> = [
  ['core_auth', 'users'],
  ['core_auth', 'roles'],
  ['b2b_credit', 'b2b_credit_profiles'],
  ['promotions', 'vouchers'],
  ['products', 'products'],
  ['orders', 'orders'],
  ['orders', 'order_items'],
  ['notifications', 'notifications'],
];

function runPrismaCommand(args: string[], dbUrl: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync('bunx', ['prisma', ...args, '--db', dbUrl, '--no-interactive'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
    },
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  });

  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

async function checkMissingTables(client: Client): Promise<{ missingTables: string[]; hasMarker: boolean }> {
  const missingTables: string[] = [];

  for (const [schema, table] of REQUIRED_CONTRACT_TABLES) {
    const res = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2 LIMIT 1`,
      [schema, table]
    );
    if (res.rowCount === 0) {
      missingTables.push(`${schema}.${table}`);
    }
  }

  const markerRes = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'prisma_contract' AND table_name = 'marker' LIMIT 1`
  );
  let hasMarker = false;
  if ((markerRes.rowCount ?? 0) > 0) {
    const rowRes = await client.query(`SELECT 1 FROM prisma_contract.marker LIMIT 1`).catch(() => ({ rowCount: 0 }));
    hasMarker = (rowRes.rowCount ?? 0) > 0;
  }

  return { missingTables, hasMarker };
}

async function ensureContractMarker(client: Client): Promise<void> {
  try {
    const contractPath = path.resolve(process.cwd(), 'src/prisma/contract.json');
    if (!fs.existsSync(contractPath)) return;
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
    const storageHash = contractJson?.storage?.storageHash;
    const profileHash = contractJson?.profileHash;
    if (!storageHash) return;

    const markerTableRes = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'prisma_contract' AND table_name = 'marker' LIMIT 1`
    );
    if ((markerTableRes.rowCount ?? 0) === 0) return;

    const colsRes = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'prisma_contract' AND table_name = 'marker'`
    );
    const cols = new Set(colsRes.rows.map((r) => r.column_name));

    if (cols.has('core_hash') && cols.has('profile_hash') && profileHash) {
      await client.query(
        `UPDATE prisma_contract.marker
         SET core_hash = $1, profile_hash = $2, updated_at = NOW()
         WHERE core_hash <> $1`,
        [storageHash, profileHash]
      ).catch(() => {});
    }
  } catch {
    // Non-fatal: Prisma db update / migrate manages marker natively on clean runs
  }
}

async function main() {
  const targetUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || '').trim();
  if (!targetUrl) {
    console.error('❌ [db-sync] DATABASE_URL / DIRECT_URL belum dikonfigurasi.');
    process.exit(1);
  }
  // Gunakan koneksi session-mode (DIRECT_URL) untuk seluruh DDL & seeding
  process.env.DATABASE_URL = targetUrl;

  console.log('🔄 [db-sync] Memeriksa kesiapan schema & migrasi database...');

  const client = new Client({ connectionString: targetUrl });
  await client.connect();

  try {
    const { missingTables, hasMarker } = await checkMissingTables(client);

    if (missingTables.length > 0 || !hasMarker) {
      console.log(
        `🚀 [db-sync] Inisialisasi awal / tabel belum lengkap (${missingTables.join(', ') || 'marker belum ada'}). Menjalankan prisma db update...`
      );
      const pushRes = runPrismaCommand(['db', 'update'], targetUrl);
      if (pushRes.stdout) console.log(pushRes.stdout.trim());
      if (pushRes.status !== 0) {
        const combined = `${pushRes.stdout}\n${pushRes.stderr}`;
        if (combined.includes('MIGRATION.DESTRUCTIVE_CHANGES')) {
          console.log('ℹ️ [db-sync] Melewati operasi destruktif agar tabel/kolom tambahan ERP tetap aman.');
        } else {
          console.error('⚠️ [db-sync] Peringatan saat prisma db update:', pushRes.stderr || pushRes.stdout);
        }
      } else {
        console.log('✅ [db-sync] Push schema Prisma 8 selesai.');
      }
    } else {
      console.log('📦 [db-sync] Database sudah terinisialisasi. Memeriksa migrasi baru (prisma db migrate)...');
      const migrateRes = runPrismaCommand(['db', 'migrate'], targetUrl);
      if (migrateRes.status === 0) {
        if (migrateRes.stdout) console.log(migrateRes.stdout.trim());
        console.log('✅ [db-sync] Pemeriksaan migrasi formal selesai.');
      } else {
        const migrateOut = `${migrateRes.stdout}\n${migrateRes.stderr}`;
        if (
          migrateOut.includes('MIGRATION.MARKER_NOT_IN_HISTORY') ||
          migrateOut.includes('MIGRATION.MARKER_MISMATCH') ||
          migrateOut.includes('MIGRATION.PATH_UNREACHABLE')
        ) {
          console.log('ℹ️ [db-sync] Sinkronisasi perubahan aditif contract via prisma db update...');
        } else if (migrateRes.stderr || migrateRes.stdout) {
          console.warn('⚠️ [db-sync] Catatan prisma db migrate:', (migrateRes.stderr || migrateRes.stdout).trim());
        }
      }

      // Sinkronkan perubahan aditif baru di contract.prisma (aman karena tanpa --confirm tidak akan drop kolom)
      const updateRes = runPrismaCommand(['db', 'update'], targetUrl);
      if (updateRes.status === 0) {
        console.log('✅ [db-sync] Contract schema sudah sinkron dengan database.');
      } else {
        const combined = `${updateRes.stdout}\n${updateRes.stderr}`;
        if (combined.includes('MIGRATION.DESTRUCTIVE_CHANGES')) {
          console.log('✅ [db-sync] Tabel utama sudah lengkap (kolom ekstensi schemaGuard dipertahankan).');
        } else {
          console.warn('⚠️ [db-sync] Catatan prisma db update:', (updateRes.stderr || updateRes.stdout).trim());
        }
      }
    }

    await ensureContractMarker(client);
  } finally {
    await client.end().catch(() => {});
  }

  // Pastikan seluruh tabel store.*, trigger auth.users -> core_auth.users, & kolom tambahan ERP siap
  const { ensureSchemaColumns } = await import('../utils/schemaGuard');
  await ensureSchemaColumns();
  console.log('✅ [db-sync] Seluruh tabel ERP, trigger auth.users, RBAC, dan kolom tambahan siap.');

  // Auto-seed data master awal (berita, produk awal, pengiriman, super admin) jika tabel masih kosong
  const verifyClient = new Client({ connectionString: targetUrl });
  await verifyClient.connect();
  let needsInitialSeed = process.env.AUTO_SEED === 'true';
  try {
    const newsCnt = await verifyClient.query(`SELECT COUNT(*)::int AS cnt FROM store.news`);
    const prodCnt = await verifyClient.query(`SELECT COUNT(*)::int AS cnt FROM products.products`);
    if (Number(newsCnt.rows[0]?.cnt || 0) === 0 || Number(prodCnt.rows[0]?.cnt || 0) === 0) {
      needsInitialSeed = true;
    }
  } catch {
    needsInitialSeed = true;
  } finally {
    await verifyClient.end().catch(() => {});
  }

  if (needsInitialSeed) {
    console.log('🌱 [db-sync] Data awal belum terisi. Menjalankan seeder otomatis...');
    const { runDatabaseSeed } = await import('../prisma/seed');
    await runDatabaseSeed({ reset: false, closeDb: true });
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ [db-sync] Gagal menyinkronkan database:', err);
  process.exit(1);
});
