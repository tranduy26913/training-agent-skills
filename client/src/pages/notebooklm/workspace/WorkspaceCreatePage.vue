<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Card from 'primevue/card';
import Button from 'primevue/button';
import WorkspaceForm from './components/WorkspaceForm.vue';
import type { CreateWorkspaceDto } from '@/types/notebooklm.types';
import { useNotebooklmWorkspaceStore } from '@/stores/notebooklm-workspace.store';

const router = useRouter();
const { t } = useI18n();
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
        <div class="flex items-center gap-3">
          <Button
            type="button"
            :label="t('common.back')"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            data-testid="workspace-back-btn"
            @click="handleCancel"
          />
          <div>
            <h2 class="text-2xl font-semibold">Create Workspace</h2>
            <p class="text-sm text-surface-500">Create a new NotebookLM workspace and invite collaborators later.</p>
          </div>
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
