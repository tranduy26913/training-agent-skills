<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-50 px-4 py-10 dark:bg-surface-950 sm:px-6">
    <div class="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary-300/25 blur-3xl dark:bg-primary-900/20"></div>
    <div class="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-primary-200/30 blur-3xl dark:bg-primary-950/40"></div>
    <div class="relative w-full max-w-md">
      <router-view />
    </div>
  </div>
</template>
