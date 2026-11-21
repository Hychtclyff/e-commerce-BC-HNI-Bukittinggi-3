import { buildApp } from '../app';

async function listAllRoutes() {
    const app = buildApp();
    await app.ready();

    console.log('\n========================================================');
    console.log('🚀 TIJARAH API - DAFTAR ROUTE YANG TERDAFTAR (FASTIFY)');
    console.log('========================================================\n');

    // Fastify printRoutes() memberikan pohon rute yang indah
    console.log(app.printRoutes());

    await app.close();
    process.exit(0);
}

listAllRoutes().catch((err) => {
    console.error('Gagal mencetak routes:', err);
    process.exit(1);
});
