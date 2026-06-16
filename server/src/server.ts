import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import app from './app';
import { appConfig } from './config';
import { prisma } from './database/prisma';
import { logger } from './utils/logger.util';

let server: ReturnType<typeof app.listen> | null = null;

async function bootstrap(): Promise<void> {
  // Verify the database is reachable before accepting requests.
  await prisma.$connect();
  server = app.listen(appConfig.port, () => {
    logger.info(`Server running on port ${appConfig.port} in ${appConfig.env} mode`);
  });
}


// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
process.once('SIGUSR2', () => {
  if (server) {
    server.close(() => {
      process.kill(process.pid, 'SIGUSR2');
    });
  } else {
    process.kill(process.pid, 'SIGUSR2');
  }
});
bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
