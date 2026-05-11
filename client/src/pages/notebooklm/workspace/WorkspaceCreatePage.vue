<script setup lang="ts">
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import WorkspaceForm from './components/WorkspaceForm.vue';
import type { CreateWorkspaceDto } from '@/types/notebooklm.types';
import { useNotebooklmWorkspaceStore } from '@/stores/notebooklm-workspace.store';

const router = useRouter();
const workspaceStore = useNotebooklmWorkspaceStore();

async function handleSubmit(payload: CreateWorkspaceDto): Promise<void> {
  await workspaceStore.createItem(payload);
  router.push({ name: 'NotebooklmWorkspaceList' });
}

function handleCancel(): void {
  router.push({ name: 'NotebooklmWorkspaceList' });
}
</script>

<template>
  <div class="space-y-4">
    <Card>
      <template #content>
        <div>
          <h2 class="text-2xl font-semibold">Create Workspace</h2>
          <p class="text-sm text-surface-500">Create a new NotebookLM workspace and invite collaborators later.</p>
        </div>
      </template>
    </Card>
    <WorkspaceForm
      mode="create"
      :loading="workspaceStore.loading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
