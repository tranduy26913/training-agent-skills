<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import type { VocabularyDetail, VocabReportStatus } from '@/types/vocabularies.types';

const { t } = useI18n();

// Props
defineProps<{
  vocabulary: VocabularyDetail | null;
  isAdmin?: boolean;
}>();

// Emits
const emit = defineEmits<{
  resolveReport: [vocabId: number, reportId: number, status: 'resolved' | 'dismissed'];
}>();

// Report status severity map
const reportStatusSeverityMap: Record<VocabReportStatus, 'warn' | 'success' | 'danger'> = {
  pending: 'warn',
  resolved: 'success',
  dismissed: 'danger',
};

// Format date
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Handle report resolution
function handleResolveReport(reportId: number, status: 'resolved' | 'dismissed'): void {
  if (props.vocabulary) {
    emit('resolveReport', props.vocabulary.id, reportId, status);
  }
}
</script>

<template>
  <div v-if="vocabulary" class="space-y-6">
    <!-- Audit Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface-50 dark:bg-surface-900 rounded-lg">
      <div>
        <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.created_by') }}
        </label>
        <p class="text-surface-900 dark:text-surface-100">{{ vocabulary.created_by }}</p>
      </div>
      <div>
        <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.updated_by') }}
        </label>
        <p class="text-surface-900 dark:text-surface-100">{{ vocabulary.updated_by }}</p>
      </div>
      <div>
        <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.version') }}
        </label>
        <p class="text-surface-900 dark:text-surface-100">{{ vocabulary.version }}</p>
      </div>
      <div>
        <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.created_at') }}
        </label>
        <p class="text-surface-900 dark:text-surface-100">{{ formatDate(vocabulary.created_at) }}</p>
      </div>
      <div>
        <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.updated_at') }}
        </label>
        <p class="text-surface-900 dark:text-surface-100">{{ formatDate(vocabulary.updated_at) }}</p>
      </div>
    </div>

    <!-- Change Log Table -->
    <div v-if="vocabulary.change_logs && vocabulary.change_logs.length > 0">
      <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-3">
        {{ t('vocab.label.change_log') }}
      </h3>
      <DataTable :value="vocabulary.change_logs" table-class="w-full">
        <Column field="field_name" :header="t('vocab.col.field_name')" />
        <Column field="old_value" :header="t('vocab.col.old_value')">
          <template #body="{ data }">
            <span class="text-surface-500">{{ data.old_value || '-' }}</span>
          </template>
        </Column>
        <Column field="new_value" :header="t('vocab.col.new_value')">
          <template #body="{ data }">
            <span class="text-surface-900 dark:text-surface-100">{{ data.new_value || '-' }}</span>
          </template>
        </Column>
        <Column field="changed_by" :header="t('vocab.col.changed_by')" />
        <Column field="change_reason" :header="t('vocab.col.change_reason')">
          <template #body="{ data }">
            <span class="text-surface-500">{{ data.change_reason || '-' }}</span>
          </template>
        </Column>
        <Column field="created_at" :header="t('vocab.col.changed_at')">
          <template #body="{ data }">
            {{ formatDate(data.created_at) }}
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Report Table -->
    <div v-if="vocabulary.reports && vocabulary.reports.length > 0">
      <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-3">
        {{ t('vocab.label.reports') }}
      </h3>
      <DataTable :value="vocabulary.reports" table-class="w-full">
        <Column field="id" :header="t('common.id')" />
        <Column field="report_text" :header="t('vocab.col.report_text')" />
        <Column field="status" :header="t('vocab.col.status')">
          <template #body="{ data }">
            <Tag :value="data.status" :severity="reportStatusSeverityMap[data.status]" />
          </template>
        </Column>
        <Column field="reported_by" :header="t('vocab.col.reported_by')" />
        <Column field="created_at" :header="t('vocab.col.reported_at')">
          <template #body="{ data }">
            {{ formatDate(data.created_at) }}
          </template>
        </Column>
        <Column v-if="isAdmin" :header="t('common.actions')">
          <template #body="{ data }">
            <Button
              v-if="data.status === 'pending'"
              icon="pi pi-check"
              severity="success"
              text
              rounded
              size="small"
              @click="handleResolveReport(data.id, 'resolved')"
            />
            <Button
              v-if="data.status === 'pending'"
              icon="pi pi-times"
              severity="danger"
              text
              rounded
              size="small"
              class="ml-2"
              @click="handleResolveReport(data.id, 'dismissed')"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
  <div v-else class="text-center py-8 text-surface-500">
    {{ t('vocab.noAuditData') }}
  </div>
</template>
