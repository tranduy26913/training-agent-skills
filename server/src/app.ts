import express from 'express';
import cors from 'cors';
import { corsConfig, appConfig } from './config';
import { authRoutes } from './modules/auth/auth.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './utils/logger.util';

const app = express();

// Global middleware
app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use(`${appConfig.apiPrefix}/auth`, authRoutes);

// Health check
app.get(`${appConfig.apiPrefix}/health`, (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorMiddleware);

export default app;
