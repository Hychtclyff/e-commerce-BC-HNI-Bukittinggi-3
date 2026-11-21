import { db } from './db';

async function main() {
  console.log('Seeding roles and permissions...');
  
  const roles = [
    { name: 'admin', displayName: 'Administrator', description: 'Akses penuh ke seluruh sistem', isSystem: true },
    { name: 'kasir', displayName: 'Kasir', description: 'Akses ke kasir dan transaksi penjualan', isSystem: true },
    { name: 'stokis', displayName: 'Stokis', description: 'Akses ke manajemen stok dan inventaris', isSystem: true },
    { name: 'member', displayName: 'Member HNI', description: 'Pelanggan dengan nomor ID member HNI', isSystem: true },
    { name: 'umum', displayName: 'Customer Umum', description: 'Pelanggan umum tanpa ID HNI', isSystem: true },
  ];
  
  for (const r of roles) {
    const existing = await db.orm.core_auth.Role.where({ name: r.name }).first();
    if (!existing) {
      await db.orm.core_auth.Role.create(r);
      console.log(`Created role: ${r.name}`);
    } else {
      console.log(`Role already exists: ${r.name}`);
    }
  }

  const permissions = [
    { code: 'sales:create', group: 'sales', description: 'Membuat transaksi penjualan baru' },
    { code: 'inventory:update', group: 'inventory', description: 'Memperbarui stok inventaris' },
    { code: 'finance:read-ledger', group: 'finance', description: 'Melihat laporan dan buku besar keuangan' },
  ];

  for (const p of permissions) {
    const existing = await db.orm.core_auth.Permission.where({ code: p.code }).first();
    if (!existing) {
      await db.orm.core_auth.Permission.create(p);
      console.log(`Created permission: ${p.code}`);
    } else {
      console.log(`Permission already exists: ${p.code}`);
    }
  }
  
  console.log('Seeding complete.');
  await db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
