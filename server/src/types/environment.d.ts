declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    API_PREFIX: string;
    APP_BODY_SIZE_LIMIT: string;
    CORS_ORIGIN: string;
    DATABASE_URL: string;
    DATABASE_URL_TEST: string;
    DIRECT_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    SEED_ADMIN_NAME: string;
    SEED_ADMIN_EMAIL: string;
    SEED_ADMIN_PASSWORD: string;
  }
}
