import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api',
  bodySizeLimit: process.env.APP_BODY_SIZE_LIMIT || '20mb',
};
