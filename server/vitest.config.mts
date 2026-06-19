import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: ['node_modules', 'dist'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@models': path.resolve(__dirname, './src/models'),
      '@middleware': path.resolve(__dirname, './src/middleware'),
      '@database': path.resolve(__dirname, './src/database'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types-express': path.resolve(__dirname, './src/types/express.d.ts'),
      '@app': path.resolve(__dirname, './src/app.ts'),
    },
  },
});
