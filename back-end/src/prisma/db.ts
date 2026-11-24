import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';

const contractJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'contract.json'), 'utf-8')
);

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});

export interface PrismaQueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

async function runDriverQuery<T = any>(
  target: { query: (request: { sql: string; params?: readonly unknown[] }) => AsyncIterable<any> },
  sql: string,
  params: readonly unknown[] = []
): Promise<PrismaQueryResult<T>> {
  const rows: T[] = [];
  for await (const row of target.query({ sql, params })) {
    rows.push(row as T);
  }
  return { rows, rowCount: rows.length };
}

/**
 * Prisma-backed query & connection adapter so all backend modules share
 * Prisma's single underlying connection pool instead of separate pg.Pool instances.
 */
export const pool = {
  query<T = any>(
    sql: string,
    params: readonly unknown[] = []
  ): Promise<PrismaQueryResult<T>> {
    const runtime = db.runtime() as any;
    return runDriverQuery<T>(runtime.driver, sql, params);
  },

  async connect() {
    const runtime = db.runtime() as any;
    const conn = await runtime.driver.acquireConnection();
    return {
      query<T = any>(
        sql: string,
        params: readonly unknown[] = []
      ): Promise<PrismaQueryResult<T>> {
        return runDriverQuery<T>(conn, sql, params);
      },
      async release() {
        if (typeof conn?.release === 'function') {
          await conn.release();
        }
      },
    };
  },
};
