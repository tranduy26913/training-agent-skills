import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import app from '@app';
import { appConfig } from '@config';
import { prisma } from '@database/prisma';
import { logger } from '@utils/logger.util';

let server: ReturnType<typeof app.listen> | null = null;

// Bootstrap the server: connect to the database, then start listening.
async function bootstrap(): Promise<void> {
  await prisma.$connect();
  server = app.listen(appConfig.port, () => {
    logger.info(`Server running on port ${appConfig.port} in ${appConfig.env} mode`);
  });
}

// Graceful shutdown on SIGTERM.
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

// Graceful shutdown on SIGINT (Ctrl+C).
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

// Nodemon reload signal.
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
