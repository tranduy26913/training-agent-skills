import type { App } from 'vue';
import { createI18n } from 'vue-i18n';
import { en, vi, ja } from '@/locales';

/** Default locale key / デフォルトロケールキー */
const LOCALE_STORAGE_KEY = 'app-locale';
const DEFAULT_LOCALE = 'en';

/**
 * Create and configure vue-i18n instance
 * vue-i18nインスタンスの作成と設定
 */
export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem(LOCALE_STORAGE_KEY) || DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en, vi, ja },
});

/**
 * Register vue-i18n plugin with the app
 * vue-i18nプラグインをアプリに登録する
 */
export function setupI18n(app: App): void {
  app.use(i18n);
}
