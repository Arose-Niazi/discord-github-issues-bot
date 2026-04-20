import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index.js';
import { logger } from '../utils/logger.js';

export async function runMigrations() {
  logger.info('Running database migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  logger.info('Migrations complete');
}
