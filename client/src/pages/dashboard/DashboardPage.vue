<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="page-stack">
    <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 px-6 py-10 text-white shadow-xl shadow-primary-900/15 sm:px-10 sm:py-12">
      <div class="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[2.5rem] border-white/10"></div>
      <div class="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      <div class="relative max-w-2xl">
        <span class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-white/20">
          <i class="pi pi-sparkles"></i>
          Workspace
        </span>
        <h2 class="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{{ t('dashboard.title') }}</h2>
        <p class="mt-3 max-w-xl leading-7 text-primary-50/90">{{ t('dashboard.overview') }}</p>
      </div>
    </section>

    <div class="grid gap-5 md:grid-cols-3">
      <router-link to="/users" class="surface-card group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg dark:hover:border-primary-900">
        <span class="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300"><i class="pi pi-users text-lg"></i></span>
        <h3 class="mt-5 font-bold text-surface-900 dark:text-surface-50">{{ t('sidebar.users') }}</h3>
        <p class="mt-1 text-sm text-surface-500">{{ t('common.overview') }}</p>
      </router-link>
      <router-link to="/projects" class="surface-card group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg dark:hover:border-primary-900">
        <span class="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300"><i class="pi pi-folder text-lg"></i></span>
        <h3 class="mt-5 font-bold text-surface-900 dark:text-surface-50">{{ t('sidebar.projects') }}</h3>
        <p class="mt-1 text-sm text-surface-500">{{ t('common.overview') }}</p>
      </router-link>
      <router-link to="/settings" class="surface-card group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg dark:hover:border-primary-900">
        <span class="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"><i class="pi pi-cog text-lg"></i></span>
        <h3 class="mt-5 font-bold text-surface-900 dark:text-surface-50">{{ t('sidebar.settings') }}</h3>
        <p class="mt-1 text-sm text-surface-500">{{ t('common.overview') }}</p>
      </router-link>
    </div>
  </div>
</template>
