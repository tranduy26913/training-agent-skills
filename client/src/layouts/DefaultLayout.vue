<template>
  <div class="min-h-screen flex bg-surface-50 dark:bg-surface-950">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-h-screen transition-all duration-300"
         :class="sidebarCollapsed ? 'ml-16' : 'ml-64'">
      <!-- Topbar -->
      <AppTopbar />

      <!-- Page content -->
      <main class="flex-1 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUiStore } from '@/stores/ui.store';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';

const uiStore = useUiStore();
const { sidebarCollapsed } = storeToRefs(uiStore);
</script>
