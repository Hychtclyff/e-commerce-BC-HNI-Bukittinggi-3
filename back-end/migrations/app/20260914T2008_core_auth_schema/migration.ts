#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4be0b83580f7a17e9bc4158bdf01319bb7891ff0ffdcc0519ac02f7b5dadf6b1/contract';
import endContract from '../../snapshots/4be0b83580f7a17e9bc4158bdf01319bb7891ff0ffdcc0519ac02f7b5dadf6b1/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'core_auth' }),
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'core_auth',
        table: 'addresses',
        columns: [
          col('city', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('district', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('fullAddress', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isPrimary', 'bool', { default: lit(false), codecRef: { codecId: 'pg/bool@1' } }),
          col('phoneNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('postalCode', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('province', 'text', {
            default: lit('Sumatera Barat'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('recipientName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'core_auth',
        table: 'permissions',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('group', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'core_auth',
        table: 'role_permissions',
        columns: [
          col('assignedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('permissionId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('roleId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['roleId', 'permissionId'])],
      }),
      this.createTable({
        schema: 'core_auth',
        table: 'roles',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('displayName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isSystem', 'bool', { default: lit(false), codecRef: { codecId: 'pg/bool@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'core_auth',
        table: 'user_roles',
        columns: [
          col('assignedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('roleId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['userId', 'roleId'])],
      }),
      this.createTable({
        schema: 'core_auth',
        table: 'users',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('fullName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('hniMemberId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('hniMemberName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', { default: lit(true), codecRef: { codecId: 'pg/bool@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phoneNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userType', 'text', {
            notNull: true,
            default: lit('CUSTOMER'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'post',
        columns: [
          col('authorId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('content', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('username', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'core_auth',
        table: 'permissions',
        constraint: 'permissions_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'core_auth',
        table: 'roles',
        constraint: 'roles_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'core_auth',
        table: 'users',
        constraint: 'users_phoneNumber_key',
        columns: ['phoneNumber'],
      }),
      this.addUnique({
        schema: 'core_auth',
        table: 'users',
        constraint: 'users_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'core_auth',
        table: 'users',
        constraint: 'users_hniMemberId_key',
        columns: ['hniMemberId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'core_auth',
        table: 'addresses',
        index: 'addresses_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'core_auth',
        table: 'permissions',
        index: 'permissions_group_idx_c7ec2205',
        columns: ['group'],
      }),
      this.createIndex({
        schema: 'core_auth',
        table: 'role_permissions',
        index: 'role_permissions_permissionId_idx_f46fcdf5',
        columns: ['permissionId'],
      }),
      this.createIndex({
        schema: 'core_auth',
        table: 'role_permissions',
        index: 'role_permissions_roleId_idx_ffccc9a4',
        columns: ['roleId'],
      }),
      this.createIndex({
        schema: 'core_auth',
        table: 'user_roles',
        index: 'user_roles_roleId_idx_ffccc9a4',
        columns: ['roleId'],
      }),
      this.createIndex({
        schema: 'core_auth',
        table: 'user_roles',
        index: 'user_roles_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'core_auth',
        table: 'users',
        index: 'users_hniMemberId_idx_d516a637',
        columns: ['hniMemberId'],
      }),
      this.createIndex({
        schema: 'core_auth',
        table: 'users',
        index: 'users_phoneNumber_idx_18928270',
        columns: ['phoneNumber'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'post',
        index: 'post_authorId_idx_e47547ed',
        columns: ['authorId'],
      }),
      this.addForeignKey({
        schema: 'core_auth',
        table: 'addresses',
        foreignKey: {
          name: 'addresses_userId_fkey',
          columns: ['userId'],
          references: { schema: 'core_auth', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'core_auth',
        table: 'role_permissions',
        foreignKey: {
          name: 'role_permissions_roleId_fkey',
          columns: ['roleId'],
          references: { schema: 'core_auth', table: 'roles', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'core_auth',
        table: 'role_permissions',
        foreignKey: {
          name: 'role_permissions_permissionId_fkey',
          columns: ['permissionId'],
          references: { schema: 'core_auth', table: 'permissions', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'core_auth',
        table: 'user_roles',
        foreignKey: {
          name: 'user_roles_userId_fkey',
          columns: ['userId'],
          references: { schema: 'core_auth', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'core_auth',
        table: 'user_roles',
        foreignKey: {
          name: 'user_roles_roleId_fkey',
          columns: ['roleId'],
          references: { schema: 'core_auth', table: 'roles', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'post',
        foreignKey: {
          name: 'post_authorId_fkey',
          columns: ['authorId'],
          references: { schema: 'core_auth', table: 'users', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
