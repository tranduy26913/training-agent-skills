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
      '@config': path.resolve(__dirname, './src/config/index.ts'),
      '@models': path.resolve(__dirname, './src/models'),
      '@middleware': path.resolve(__dirname, './src/middleware'),
      '@database': path.resolve(__dirname, './src/database'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@types-express': path.resolve(__dirname, './src/types/express.d.ts'),
      '@app': path.resolve(__dirname, './src/app.ts'),
    },
  },
});
