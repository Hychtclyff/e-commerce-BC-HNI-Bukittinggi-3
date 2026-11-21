#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4be0b83580f7a17e9bc4158bdf01319bb7891ff0ffdcc0519ac02f7b5dadf6b1/contract';
import startContract from '../../snapshots/4be0b83580f7a17e9bc4158bdf01319bb7891ff0ffdcc0519ac02f7b5dadf6b1/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8a4de03ef44af9cfa67c0abcf721fcbbf7779eed2efa035a991c3a85d5ecc2d6/contract';
import endContract from '../../snapshots/8a4de03ef44af9cfa67c0abcf721fcbbf7779eed2efa035a991c3a85d5ecc2d6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'core_auth', table: 'users', column: 'hniMemberName' }),
      this.dropIndex({
        schema: 'core_auth',
        table: 'users',
        index: 'users_hniMemberId_idx_d516a637',
      }),
      this.dropConstraint({
        schema: 'core_auth',
        table: 'users',
        constraint: 'users_hniMemberId_key',
      }),
      this.dropColumn({ schema: 'core_auth', table: 'users', column: 'hniMemberId' }),
      this.createTable({
        schema: 'core_auth',
        table: 'hni_profiles',
        columns: [
          col('address', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('agencyId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('agencyName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('agencyType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('bkit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('combinedStatus', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('directStatus', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('hniMemberId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('hniMemberName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('idCardNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('isVerified', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('mobilePhone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('titleStatus', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('uplineId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('uplineName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'core_auth',
        table: 'users',
        column: col('deletedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'core_auth',
        table: 'users',
        column: col('isDeleted', 'bool', {
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addUnique({
        schema: 'core_auth',
        table: 'hni_profiles',
        constraint: 'hni_profiles_userId_key',
        columns: ['userId'],
      }),
      this.addUnique({
        schema: 'core_auth',
        table: 'hni_profiles',
        constraint: 'hni_profiles_hniMemberId_key',
        columns: ['hniMemberId'],
      }),
      this.createIndex({
        schema: 'core_auth',
        table: 'hni_profiles',
        index: 'hni_profiles_hniMemberId_idx_d516a637',
        columns: ['hniMemberId'],
      }),
      this.createIndex({
        schema: 'core_auth',
        table: 'users',
        index: 'users_isDeleted_idx_5eb11edf',
        columns: ['isDeleted'],
      }),
      this.addForeignKey({
        schema: 'core_auth',
        table: 'hni_profiles',
        foreignKey: {
          name: 'hni_profiles_userId_fkey',
          columns: ['userId'],
          references: { schema: 'core_auth', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
