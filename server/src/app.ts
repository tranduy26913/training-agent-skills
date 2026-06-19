import express from 'express';
import cors from 'cors';
import { corsConfig, appConfig } from './config';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/admin/users/users.routes';
import { employeesRoutes } from './modules/admin/employees/employees.routes';
import { vocabularyRoutes } from './modules/admin/vocabulary/vocabulary.routes';
import { notebookLmRoutes } from './modules/admin/notebooklm/notebooklm.routes';
import { notebookLmOperationsRoutes } from './modules/admin/notebooklm/operations.routes';
import { chatRoutes } from './modules/admin/notebooklm/chat.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './utils/logger.util';

const app = express();

// Global middleware
app.use(cors(corsConfig));
app.use(express.json({ limit: appConfig.bodySizeLimit }));
app.use(express.urlencoded({ extended: true, limit: appConfig.bodySizeLimit }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes / ルート設定
app.use(`${appConfig.apiPrefix}/auth`, authRoutes);
app.use(`${appConfig.apiPrefix}/admin/users`, usersRoutes);
app.use(`${appConfig.apiPrefix}/admin/employees`, employeesRoutes);
app.use(`${appConfig.apiPrefix}/admin/vocabularies`, vocabularyRoutes);
app.use(`${appConfig.apiPrefix}/user/notebooklm`, notebookLmRoutes);
app.use(`${appConfig.apiPrefix}/admin/notebooklm`, notebookLmOperationsRoutes);
app.use(`${appConfig.apiPrefix}/user/notebooklm`, chatRoutes);

// Health check
app.get(`${appConfig.apiPrefix}/health`, (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorMiddleware);

export default app;
