<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import type { VocabularyDetail, VocabularyAuditLog, VocabularyReport } from '../composables/useVocabularies';

const { t } = useI18n();

// Props / プロパティ定義
const props = defineProps<{
  vocabulary?: VocabularyDetail | null;
  auditLogs: VocabularyAuditLog[];
  reports?: VocabularyReport[];
  loadingLogs?: boolean;
  loadingReports?: boolean;
}>();

// Emits / イベント定義
const emit = defineEmits<{
  resolveReport: [reportId: number];
  rejectReport: [reportId: number];
}>();

// レポートステータスバッジカラー / Report status severity mapping
const reportSeverityMap: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
  pending: 'warn',
  resolved: 'success',
  rejected: 'danger',
};

// 日付フォーマット / Format datetime
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return dateStr;
  }
}
</script>

<template>
  <div class="space-y-6" data-testid="vocab-audit-tab">
    <!-- メタデータ / Vocabulary metadata -->
    <div class="grid grid-cols-2 gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
      <div>
        <span class="text-sm font-medium text-surface-600 dark:text-surface-400">{{ t('vocab.createdBy') }}:</span>
        <span class="ml-2 text-sm">{{ vocabulary?.created_by_name ?? '—' }}</span>
      </div>
      <div>
        <span class="text-sm font-medium text-surface-600 dark:text-surface-400">{{ t('vocab.updatedBy') }}:</span>
        <span class="ml-2 text-sm">{{ vocabulary?.updated_by_name ?? '—' }}</span>
      </div>
      <div>
        <span class="text-sm font-medium text-surface-600 dark:text-surface-400">{{ t('vocab.version') }}:</span>
        <span class="ml-2 text-sm">{{ vocabulary?.version ?? '—' }}</span>
      </div>
      <div>
        <span class="text-sm font-medium text-surface-600 dark:text-surface-400">{{ t('vocab.createdAt') }}:</span>
        <span class="ml-2 text-sm">{{ formatDate(vocabulary?.created_at) }}</span>
      </div>
      <div>
        <span class="text-sm font-medium text-surface-600 dark:text-surface-400">{{ t('vocab.updatedAt') }}:</span>
        <span class="ml-2 text-sm">{{ formatDate(vocabulary?.updated_at) }}</span>
      </div>
    </div>

    <!-- 変更ログ / Audit log list -->
    <div>
      <h3 class="text-lg font-semibold mb-3">{{ t('vocab.changeLog') }}</h3>
      <div v-if="loadingLogs" class="text-sm text-surface-500">
        Loading...
      </div>
      <div v-else-if="!auditLogs.length" class="text-sm text-surface-500">
        {{ t('common.noData') }}
      </div>
      <ul v-else class="space-y-2">
        <li
          v-for="log in auditLogs"
          :key="log.id"
          class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg text-sm"
          data-testid="vocab-audit-log-item"
        >
          <div class="flex items-center justify-between">
            <span class="font-medium">{{ log.action }}</span>
            <span class="text-surface-500">{{ formatDate(log.created_at) }}</span>
          </div>
          <div v-if="log.changed_fields" class="mt-1 text-surface-600 dark:text-surface-400 text-xs font-mono">
            {{ JSON.stringify(log.changed_fields) }}
          </div>
        </li>
      </ul>
    </div>

    <!-- レポート / Reports table -->
    <div>
      <h3 class="text-lg font-semibold mb-3">{{ t('vocab.reports') }}</h3>
      <div v-if="loadingReports" class="text-sm text-surface-500">
        Loading...
      </div>
      <div v-else-if="!reports?.length" class="text-sm text-surface-500">
        {{ t('common.noData') }}
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="report in reports"
          :key="report.id"
          class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg flex items-center justify-between"
          data-testid="vocab-report-item"
        >
          <div class="flex items-center gap-3">
            <Tag
              :value="report.status"
              :severity="reportSeverityMap[report.status] ?? 'secondary'"
              data-testid="vocab-report-status-badge"
            />
            <span class="text-sm">{{ report.reason }}</span>
          </div>
          <div v-if="report.status === 'pending'" class="flex gap-2">
            <Button
              :label="t('vocab.resolve')"
              size="small"
              severity="success"
              outlined
              :data-testid="`vocab-resolve-report-btn-${report.id}`"
              @click="emit('resolveReport', report.id)"
            />
            <Button
              :label="t('vocab.reject')"
              size="small"
              severity="danger"
              outlined
              :data-testid="`vocab-reject-report-btn-${report.id}`"
              @click="emit('rejectReport', report.id)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
