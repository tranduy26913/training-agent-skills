import type { App } from 'vue';
import { createI18n } from 'vue-i18n';
import { en, vi, ja } from '@locales';

// Locale storage key and default locale.
const LOCALE_STORAGE_KEY = 'app-locale';
const DEFAULT_LOCALE = 'en';

// Create and configure the vue-i18n instance.
export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem(LOCALE_STORAGE_KEY) || DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en, vi, ja },
});

// Register the vue-i18n plugin with the app.
export function setupI18n(app: App): void {
  app.use(i18n);
}