<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import LoginForm from './components/LoginForm.vue';

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col items-center">
    <div class="mb-7 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-xl shadow-primary-500/25">
      <i class="pi pi-sparkles text-2xl"></i>
    </div>
    <div class="mb-8 text-center">
      <h1 class="mb-2 text-3xl font-extrabold tracking-tight text-surface-950 dark:text-surface-50 sm:text-4xl">{{ t('auth.welcomeBack') }}</h1>
      <p class="text-sm leading-6 text-surface-500 dark:text-surface-400">{{ t('auth.signInDescription') }}</p>
    </div>

    <div class="surface-card w-full p-6 shadow-2xl shadow-surface-900/10 dark:shadow-black/30 sm:p-8">
      <LoginForm />
    </div>
  </div>
</template>
