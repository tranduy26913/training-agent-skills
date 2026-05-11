<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Card from 'primevue/card';
import Button from 'primevue/button';
import WorkspaceForm from './components/WorkspaceForm.vue';
import DocumentIngestionViewer from './components/DocumentIngestionViewer.vue';
import WorkspaceMemberManager from './components/WorkspaceMemberManager.vue';
import { useNotebooklmWorkspaceStore } from '@/stores/notebooklm-workspace.store';
import type { CreateWorkspaceDto } from '@/types/notebooklm.types';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const workspaceStore = useNotebooklmWorkspaceStore();

const workspaceId = computed(() => Number(route.params.id));

onMounted(async () => {
  if (!Number.isFinite(workspaceId.value)) return;
  await workspaceStore.fetchItem(workspaceId.value);
  await workspaceStore.fetchDocuments(workspaceId.value);
  await workspaceStore.fetchMembers(workspaceId.value);
});

const canUpload = computed(() => workspaceStore.canEditCurrentWorkspace);
const canDelete = computed(() => workspaceStore.currentItem?.role === 'owner' || workspaceStore.currentItem?.role === 'editor');
const canManageMembers = computed(() => workspaceStore.canManageCurrentWorkspaceMembers);

const runCandidateSearch = useDebounceFn(async (query: string) => {
  await workspaceStore.searchCandidateUsers(workspaceId.value, query);
}, 300);

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

function handleSearchMembers(query: string): void {
  void runCandidateSearch(query);
}

async function handleAddOrUpdateMember(payload: { userId: number; role: 'owner' | 'editor' | 'viewer' }): Promise<void> {
  await workspaceStore.addOrUpdateMember(workspaceId.value, payload.userId, payload.role);
}

/** チャットセッション一覧ページへ遷移する / Navigate to chat sessions for this workspace */
function handleOpenChat(): void {
  router.push({ name: 'NotebooklmChatSessionList', params: { workspaceId: workspaceId.value } });
}
</script>

<template>
  <div class="space-y-6">
    <Card>
      <template #content>
        <div class="flex items-center justify-between">
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
              <h2 class="text-2xl font-semibold">Edit Workspace</h2>
              <p class="text-sm text-surface-500">Update workspace details and manage document ingestion jobs.</p>
            </div>
          </div>
          <!-- チャットボタン / Button to open chat sessions for this workspace -->
          <Button
            :label="t('notebooklmWorkspace.openChat')"
            icon="pi pi-comments"
            class="p-button-secondary"
            @click="handleOpenChat"
          />
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

    <WorkspaceMemberManager
      :members="workspaceStore.members"
      :candidates="workspaceStore.memberCandidates"
      :can-manage="canManageMembers"
      :loading="workspaceStore.loadingMembers"
      :searching="workspaceStore.searchingMembers"
      @search="handleSearchMembers"
      @add="handleAddOrUpdateMember"
    />
  </div>
</template>
