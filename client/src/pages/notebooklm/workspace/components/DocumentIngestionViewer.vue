<script setup lang="ts">
import { ref } from 'vue';
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
}>();

const uploadError = ref<string>('');

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
</script>

<template>
  <section class="space-y-3 rounded border border-surface-200 p-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold">Documents</h3>
      <input
        v-if="canUpload"
        data-testid="document-upload-input"
        type="file"
        class="text-sm"
        @change="onFileChange"
      />
    </div>

    <p v-if="uploadError" class="text-sm text-red-600">{{ uploadError }}</p>
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
        <div class="flex items-center justify-between gap-2">
          <div>
            <p class="font-medium">{{ doc.filename }}</p>
            <p class="text-xs text-surface-500">
              {{ doc.status }} • {{ formatSize(doc.size) }}
            </p>
          </div>

          <div class="flex gap-2">
            <button
              v-if="doc.latestJobId"
              type="button"
              class="rounded border border-surface-300 px-2 py-1 text-xs"
              @click="emit('refreshProgress', doc.latestJobId)"
            >
              Refresh
            </button>
            <button
              v-if="canDelete"
              type="button"
              class="rounded border border-red-400 px-2 py-1 text-xs text-red-600"
              @click="emit('delete', doc.id)"
            >
              Delete
            </button>
          </div>
        </div>

        <div v-if="doc.latestJobId && jobProgressById[doc.latestJobId]" class="mt-2 rounded bg-surface-50 p-2 text-xs">
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
