import { config } from './config.js';
import { logger } from './utils/logger.js';
import { runMigrations } from './db/migrate.js';
import { startServer } from './server/index.js';
import { startBot } from './bot/client.js';

async function main() {
  logger.info('Starting BugSnitch...');

  await runMigrations();
  await startServer();
  await startBot();

  logger.info('BugSnitch is ready');
}

main().catch((err) => {
  logger.fatal({ err }, 'Fatal startup error');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'Unhandled rejection');
  process.exit(1);
});
