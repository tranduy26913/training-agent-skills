import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import app from './app';
import { appConfig } from './config';
import { prisma } from './database/prisma';
import { logger } from './utils/logger.util';

async function bootstrap(): Promise<void> {
  // Verify the database is reachable before accepting requests.
  await prisma.$connect();
  app.listen(appConfig.port, () => {
    logger.info(`Server running on port ${appConfig.port} in ${appConfig.env} mode`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
