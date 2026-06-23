<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectsStore } from '@stores/projects.store';

const route = useRoute();
const router = useRouter();
const store = useProjectsStore();

onMounted(async () => {
  const id = Number(route.params.id);
  if (!id) {
    router.push({ name: 'ProjectList' });
    return;
  }
  await store.fetchProject(id);
  if (store.error) {
    router.push({ name: 'ProjectList' });
  }
});

function handleBackClick() {
  router.push({ name: 'ProjectList' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <div class="p-6">
    <!-- Back button -->
    <div class="mb-4">
      <Button
        label="Quay lại"
        icon="pi pi-arrow-left"
        class="p-button-text"
        @click="handleBackClick"
      />
    </div>

    <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">
      Chi tiết Project
    </h1>

    <!-- Loading -->
    <div v-if="store.loading" class="space-y-4">
      <Skeleton height="24px" width="40%" />
      <Skeleton height="16px" width="80%" />
      <Skeleton height="80px" width="100%" />
      <Skeleton height="80px" width="100%" />
    </div>

    <!-- Detail -->
    <div
      v-else-if="store.currentProject"
      class="max-w-2xl space-y-6"
    >
      <!-- Name -->
      <div>
        <label class="block text-sm font-semibold text-surface-500 dark:text-surface-400 mb-1">
          Tên Project
        </label>
        <p class="text-surface-900 dark:text-surface-100">
          {{ store.currentProject.name }}
        </p>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-semibold text-surface-500 dark:text-surface-400 mb-1">
          Mô tả
        </label>
        <p class="text-surface-900 dark:text-surface-100 whitespace-pre-wrap">
          {{ store.currentProject.description || '—' }}
        </p>
      </div>

      <!-- Project Prompt -->
      <div>
        <label class="block text-sm font-semibold text-surface-500 dark:text-surface-400 mb-1">
          Project Prompt
        </label>
        <p class="text-surface-900 dark:text-surface-100 whitespace-pre-wrap text-sm">
          {{ store.currentProject.projectPrompt || '—' }}
        </p>
      </div>

      <!-- Owner -->
      <div>
        <label class="block text-sm font-semibold text-surface-500 dark:text-surface-400 mb-1">
          Người tạo
        </label>
        <p class="text-surface-900 dark:text-surface-100">
          {{ store.currentProject.ownerName }}
        </p>
      </div>

      <!-- Created At -->
      <div>
        <label class="block text-sm font-semibold text-surface-500 dark:text-surface-400 mb-1">
          Ngày tạo
        </label>
        <p class="text-surface-900 dark:text-surface-100">
          {{ formatDate(store.currentProject.createdAt) }}
        </p>
      </div>

      <!-- Updated At -->
      <div>
        <label class="block text-sm font-semibold text-surface-500 dark:text-surface-400 mb-1">
          Cập nhật lần cuối
        </label>
        <p class="text-surface-900 dark:text-surface-100">
          {{ formatDate(store.currentProject.updatedAt) }}
        </p>
      </div>
    </div>
  </div>
</template>
