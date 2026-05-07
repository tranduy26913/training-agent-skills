<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import WorkspaceTable from './components/WorkspaceTable.vue';
import { useNotebooklmWorkspaceStore } from '@/stores/notebooklm-workspace.store';

const router = useRouter();
const workspaceStore = useNotebooklmWorkspaceStore();

onMounted(() => {
  workspaceStore.fetchItems();
});

function handleOpen(id: number): void {
  router.push({ name: 'NotebooklmWorkspaceEdit', params: { id } });
}

function handleEdit(id: number): void {
  router.push({ name: 'NotebooklmWorkspaceEdit', params: { id } });
}

async function handleDelete(id: number): Promise<void> {
  await workspaceStore.deleteItem(id);
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold">NotebookLM Workspaces</h2>
      <button
        type="button"
        class="rounded bg-primary px-4 py-2 text-white"
        @click="router.push({ name: 'NotebooklmWorkspaceCreate' })"
      >
        New Workspace
      </button>
    </div>

    <WorkspaceTable
      :workspaces="workspaceStore.items"
      :loading="workspaceStore.loading"
      @open="handleOpen"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
