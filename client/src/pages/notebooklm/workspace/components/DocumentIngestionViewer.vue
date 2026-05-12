<script setup lang="ts">
import { ref } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import {
  NOTEBOOKLM_ALLOWED_MIME_TYPES,
  NOTEBOOKLM_MAX_FILE_SIZE_BYTES,
} from '@/types/notebooklm.types';
import type { WorkspaceDocument, WorkspaceJobProgress } from '@/types/notebooklm.types';

const props = defineProps<{
  documents: WorkspaceDocument[];
  jobProgressById: Record<number, WorkspaceJobProgress>;
  canUpload: boolean;
  canDelete?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  upload: [file: File];
  delete: [documentId: number];
  refreshProgress: [jobId: number];
  download: [documentId: number, filename: string];
}>();

const uploadError = ref<string>('');
const fileInputRef = ref<HTMLInputElement | null>(null);

function openFilePicker(): void {
  fileInputRef.value?.click();
}

function onFileChange(event: Event): void {
  uploadError.value = '';
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!NOTEBOOKLM_ALLOWED_MIME_TYPES.includes(file.type as (typeof NOTEBOOKLM_ALLOWED_MIME_TYPES)[number])) {
    uploadError.value = 'Unsupported file type';
    return;
  }

  if (file.size > NOTEBOOKLM_MAX_FILE_SIZE_BYTES) {
    uploadError.value = 'File size must be 100MB or less';
    return;
  }

  emit('upload', file);
  input.value = '';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * ジョブが完了済みかどうかを返す / Returns true when job is fully settled (done or failed)
 */
function isJobSettled(progress: WorkspaceJobProgress | undefined): boolean {
  return progress?.status === 'done' || progress?.status === 'failed' || progress?.status === 'dead_letter';
}
</script>

<template>
  <Card>
    <template #title>Documents</template>
    <template #content>
      <section class="space-y-3">
        <div class="flex items-center justify-end" v-if="canUpload">
          <input
            ref="fileInputRef"
            data-testid="document-upload-input"
            type="file"
            class="hidden"
            @change="onFileChange"
          />
          <Button class="w-full sm:w-auto" label="Upload document" icon="pi pi-upload" @click="openFilePicker" />
        </div>

        <Message v-if="uploadError" severity="error" size="small" variant="simple">{{ uploadError }}</Message>
        <p v-if="loading" class="text-sm text-surface-500">Loading documents...</p>

        <div v-if="documents.length === 0 && !loading" class="text-sm text-surface-500">
          No documents uploaded yet.
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="doc in documents"
            :key="doc.id"
            class="rounded border border-surface-200 p-3"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="min-w-0">
                <p class="font-medium">{{ doc.filename }}</p>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-surface-500">
                  <!-- ステータスが完了でない場合のみタグ表示 / Show status tag only when not done -->
                  <Tag v-if="doc.status !== 'done'" :value="doc.status" severity="info" />
                  <span>{{ formatSize(doc.size) }}</span>
                </div>
              </div>

              <div class="flex w-full flex-wrap justify-end gap-1 sm:w-auto">
                <!-- ダウンロードボタン / Download button -->
                <Button
                  type="button"
                  icon="pi pi-download"
                  title="Download"
                  text
                  size="small"
                  data-testid="document-download-btn"
                  @click="emit('download', doc.id, doc.filename)"
                />
                <Button
                  v-if="doc.latestJobId && !isJobSettled(jobProgressById[doc.latestJobId])"
                  type="button"
                  label="Refresh"
                  icon="pi pi-refresh"
                  text
                  size="small"
                  @click="emit('refreshProgress', doc.latestJobId)"
                />
                <Button
                  v-if="canDelete"
                  type="button"
                  label="Delete"
                  icon="pi pi-trash"
                  text
                  size="small"
                  severity="danger"
                  @click="emit('delete', doc.id)"
                />
              </div>
            </div>

            <!-- 処理中のステップのみ表示 / Show job steps only when still processing -->
            <div
              v-if="doc.latestJobId && jobProgressById[doc.latestJobId] && !isJobSettled(jobProgressById[doc.latestJobId])"
              class="mt-2 rounded bg-surface-50 p-2 text-xs"
            >
              <p class="font-medium uppercase">
                {{ jobProgressById[doc.latestJobId].status }}
              </p>
              <ul class="mt-1 space-y-1">
                <li
                  v-for="step in jobProgressById[doc.latestJobId].steps"
                  :key="step.name"
                >
                  {{ step.name }}: {{ step.status }}
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </Card>
</template>
