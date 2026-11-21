import { buildApp } from './app';
import { env } from './config/env';
import { startExpiredOrdersCron } from './modules/orders/expireOrders';

const app = buildApp();

async function start() {
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Server is running at http://${env.HOST}:${env.PORT}`);

    // Poin 11: Background worker auto-cancel order kedaluwarsa & pengembalian stok
    startExpiredOrdersCron(600000); // Tiap 10 menit
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}. Shutting down gracefully...`);
  try {
    await app.close();
    process.exit(0);
  } catch (err) {
    app.log.error(err, 'Error closing application');
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
