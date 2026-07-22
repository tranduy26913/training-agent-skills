import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

const src = resolve(__dirname, 'src');

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': src,
      '@app': resolve(src, 'app'),
      '@assets': resolve(src, 'assets'),
      '@components': resolve(src, 'components'),
      '@composables': resolve(src, 'composables'),
      '@layouts': resolve(src, 'layouts'),
      '@locales': resolve(src, 'locales'),
      '@pages': resolve(src, 'pages'),
      '@plugins': resolve(src, 'plugins'),
      '@router': resolve(src, 'router'),
      '@services': resolve(src, 'services'),
      '@stores': resolve(src, 'stores'),
      '@apptypes': resolve(src, 'types'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    alias: {
      '@': src,
      '@app': resolve(src, 'app'),
      '@assets': resolve(src, 'assets'),
      '@components': resolve(src, 'components'),
      '@composables': resolve(src, 'composables'),
      '@layouts': resolve(src, 'layouts'),
      '@locales': resolve(src, 'locales'),
      '@pages': resolve(src, 'pages'),
      '@plugins': resolve(src, 'plugins'),
      '@router': resolve(src, 'router'),
      '@services': resolve(src, 'services'),
      '@stores': resolve(src, 'stores'),
      '@apptypes': resolve(src, 'types'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
