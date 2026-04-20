<script setup lang="ts">
/**
 * Language switcher dropdown / 言語切替ドロップダウン
 * Supports: English, Vietnamese, Japanese
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Select from 'primevue/select';

interface LanguageOption {
  code: string;
  label: string;
  abbr: string;
  flag: string;
}

const LOCALE_STORAGE_KEY = 'app-locale';

const { locale } = useI18n();

const languages: LanguageOption[] = [
  { code: 'en', label: 'English', abbr: 'EN', flag: '🇺🇸' },
  { code: 'vi', label: 'Tiếng Việt', abbr: 'VI', flag: '🇻🇳' },
  { code: 'ja', label: '日本語', abbr: 'JA', flag: '🇯🇵' },
];

const selectedLanguage = computed({
  get: () => languages.find((l) => l.code === locale.value) ?? languages[0],
  set: (lang: LanguageOption) => {
    locale.value = lang.code;
    localStorage.setItem(LOCALE_STORAGE_KEY, lang.code);
  },
});
</script>

<template>
  <Select
    v-model="selectedLanguage"
    :options="languages"
    optionLabel="label"
    dataKey="code"
    class="w-24"
    :pt="{ root: { class: '!py-1 !px-2' } }"
  >
    <template #value="{ value }">
      <div v-if="value" class="flex items-center gap-1.5">
        <span class="text-sm">{{ value.flag }}</span>
        <span class="text-xs font-medium">{{ value.abbr }}</span>
      </div>
    </template>
    <template #option="{ option }">
      <div class="flex items-center gap-2">
        <span>{{ option.flag }}</span>
        <span class="text-sm">{{ option.label }}</span>
      </div>
    </template>
  </Select>
</template>
