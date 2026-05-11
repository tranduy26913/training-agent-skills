<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import WorkspaceForm from './components/WorkspaceForm.vue';
import DocumentIngestionViewer from './components/DocumentIngestionViewer.vue';
import { useNotebooklmWorkspaceStore } from '@/stores/notebooklm-workspace.store';
import type { CreateWorkspaceDto } from '@/types/notebooklm.types';

const route = useRoute();
const router = useRouter();
const workspaceStore = useNotebooklmWorkspaceStore();

const workspaceId = computed(() => Number(route.params.id));

onMounted(async () => {
  if (!Number.isFinite(workspaceId.value)) return;
  await workspaceStore.fetchItem(workspaceId.value);
  await workspaceStore.fetchDocuments(workspaceId.value);
});

const canUpload = computed(() => workspaceStore.canEditCurrentWorkspace);
const canDelete = computed(() => workspaceStore.currentItem?.role === 'owner' || workspaceStore.currentItem?.role === 'editor');

async function handleSubmit(payload: CreateWorkspaceDto): Promise<void> {
  await workspaceStore.updateItem(workspaceId.value, payload);
  router.push({ name: 'NotebooklmWorkspaceList' });
}

function handleCancel(): void {
  router.push({ name: 'NotebooklmWorkspaceList' });
}

async function handleUpload(file: File): Promise<void> {
  const result = await workspaceStore.uploadDocument(workspaceId.value, file);
  await workspaceStore.pollJobUntilSettled(result.jobId, { intervalMs: 1000, maxAttempts: 60 });
  await workspaceStore.fetchDocuments(workspaceId.value);
}

async function handleDeleteDocument(documentId: number): Promise<void> {
  const result = await workspaceStore.deleteDocument(workspaceId.value, documentId);
  await workspaceStore.pollJobUntilSettled(result.jobId, { intervalMs: 1000, maxAttempts: 60 });
  await workspaceStore.fetchDocuments(workspaceId.value);
}

async function handleRefreshProgress(jobId: number): Promise<void> {
  await workspaceStore.pollJobUntilSettled(jobId, { intervalMs: 1000, maxAttempts: 5 });
}
</script>

<template>
  <div class="space-y-6">
    <Card>
      <template #content>
        <div>
          <h2 class="text-2xl font-semibold">Edit Workspace</h2>
          <p class="text-sm text-surface-500">Update workspace details and manage document ingestion jobs.</p>
        </div>
      </template>
    </Card>

    <WorkspaceForm
      mode="edit"
      :initial-data="workspaceStore.currentItem"
      :loading="workspaceStore.loadingCurrent"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DocumentIngestionViewer
      :documents="workspaceStore.documents"
      :job-progress-by-id="workspaceStore.jobProgressById"
      :can-upload="canUpload"
      :can-delete="canDelete"
      :loading="workspaceStore.loadingDocuments"
      @upload="handleUpload"
      @delete="handleDeleteDocument"
      @refresh-progress="handleRefreshProgress"
    />
  </div>
</template>
