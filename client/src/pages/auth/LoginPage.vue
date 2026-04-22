<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import LoginForm from './components/LoginForm.vue';

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col items-center">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-surface-800 dark:text-surface-100 mb-2">{{ t('auth.welcomeBack') }}</h1>
      <p class="text-surface-500">{{ t('auth.signInDescription') }}</p>
    </div>

    <div class="w-full bg-surface-0 dark:bg-surface-900 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 p-8">
      <LoginForm />
    </div>
  </div>
</template>
