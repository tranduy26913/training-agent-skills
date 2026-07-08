<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useScriptsStore } from '@stores/scripts.store';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import Skeleton from 'primevue/skeleton';
import Tag from 'primevue/tag';
import type { Script } from '@apptypes/scripts.types';

const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const store = useScriptsStore();

const projectId = Number(route.params.projectId);

onMounted(async () => {
  if (!projectId) {
    router.push({ name: 'ProjectList' });
    return;
  }
  await store.fetchScripts(projectId);
});

function goBack() {
  router.push({ name: 'ProjectDetail', params: { id: projectId } });
}

function goCreate() {
  router.push({ name: 'ScriptCreate', params: { projectId } });
}

function goEdit(scriptId: number) {
  router.push({ name: 'ScriptEdit', params: { projectId, scriptId } });
}

function deleteScript(script: Script) {
  confirm.require({
    message: `Delete script "${script.title}"?`,
    header: 'Delete script',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        await store.deleteScript(script.id);
        await store.fetchScripts(projectId);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Script deleted', life: 3000 });
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: store.error || 'Delete failed', life: 3000 });
      }
    },
  });
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('vi-VN');
}
</script>

<template>
  <div class="page-stack">
    <div class="page-header">
      <div>
        <Button label="Back" icon="pi pi-arrow-left" class="p-button-text mb-3" @click="goBack" />
        <h1 class="page-title">Scripts</h1>
        <p class="page-subtitle">Manage project scripts</p>
      </div>
      <Button label="Create script" icon="pi pi-plus" @click="goCreate" />
    </div>

    <div v-if="store.loading" class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 3" :key="i" class="surface-card p-5">
        <Skeleton class="mb-4" height="1.25rem" width="70%" />
        <Skeleton class="mb-2" height="0.875rem" width="90%" />
        <Skeleton class="mb-2" height="0.875rem" width="60%" />
      </div>
    </div>

    <div
      v-else-if="store.scripts.length === 0"
      class="surface-card flex flex-col items-center justify-center px-6 py-20 text-surface-400"
    >
      <i class="pi pi-file-edit text-6xl mb-4"></i>
      <p class="text-lg mb-4">No scripts yet</p>
      <Button label="Create script" icon="pi pi-plus" @click="goCreate" />
    </div>

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="script in store.scripts"
        :key="script.id"
        class="surface-card cursor-pointer p-5 transition hover:shadow-md"
        @click="goEdit(script.id)"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <h2 class="line-clamp-2 text-lg font-semibold text-surface-900 dark:text-surface-100">
            {{ script.title }}
          </h2>
          <Tag
            :value="script.status"
            :severity="script.status === 'generated' ? 'success' : 'secondary'"
          />
        </div>
        <p class="mb-4 line-clamp-3 text-sm text-surface-600 dark:text-surface-300">
          {{ script.idea }}
        </p>
        <div class="mb-4 flex flex-wrap gap-2">
          <span
            v-for="tag in script.vibe.slice(0, 3)"
            :key="tag"
            class="rounded bg-surface-100 px-2 py-1 text-xs text-surface-600 dark:bg-surface-800 dark:text-surface-300"
          >
            {{ tag }}
          </span>
          <span v-if="script.vibe.length > 3" class="text-xs text-surface-500">
            +{{ script.vibe.length - 3 }}
          </span>
        </div>
        <div class="flex items-center justify-between text-xs text-surface-500">
          <span>Updated {{ formatDate(script.updatedAt) }}</span>
          <div class="flex gap-2" @click.stop>
            <Button icon="pi pi-pencil" rounded text aria-label="Edit" @click="goEdit(script.id)" />
            <Button icon="pi pi-trash" rounded text severity="danger" aria-label="Delete" @click="deleteScript(script)" />
          </div>
        </div>
      </article>
    </div>

    <ConfirmDialog />
  </div>
</template>
