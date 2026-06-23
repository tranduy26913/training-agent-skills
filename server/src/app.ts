import express from 'express';
import cors from 'cors';
import { corsConfig, appConfig } from '@config';
import { authRoutes } from '@modules/auth/auth.routes';
import { usersRoutes } from '@modules/admin/users/users.routes';
import { errorMiddleware } from '@middleware/error.middleware';
import { logger } from '@utils/logger.util';

const app = express();

// Global middleware.
app.use(cors(corsConfig));
app.use(express.json({ limit: appConfig.bodySizeLimit }));
app.use(express.urlencoded({ extended: true, limit: appConfig.bodySizeLimit }));

// Request logging.
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes.
app.use(`${appConfig.apiPrefix}/auth`, authRoutes);
app.use(`${appConfig.apiPrefix}/admin/users`, usersRoutes);

// Health check.
app.get(`${appConfig.apiPrefix}/health`, (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler (must be registered last).
app.use(errorMiddleware);

export default app;
