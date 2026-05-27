<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Timeline from 'primevue/timeline';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import type { VocabularyChangeLog, VocabularyReport, ReportStatus } from '@/types/vocabularies.types';

const { t } = useI18n();

// Props - audit data passed from parent / 親コンポーネントから渡された監査データ
const props = defineProps<{
  vocabulary: {
    id: number;
    created_by_name: string;
    updated_by_name: string | null;
    version: number;
    created_at: string;
    updated_at: string;
  };
  changeLogs: VocabularyChangeLog[];
  reports: VocabularyReport[];
}>();

const emit = defineEmits<{
  updateReportStatus: [reportId: number, status: ReportStatus];
}>();

// レポートステータスバッジ / Report status severity mapping
const reportStatusSeverity: Record<ReportStatus, 'success' | 'warn'> = {
  resolved: 'success',
  pending: 'warn',
};

// 日付フォーマット / Format date string to locale string
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 作成・更新情報 / Created / updated by info -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <span class="text-sm text-surface-500">{{ t('vocabularies.audit.createdBy') }}: </span>
        <span class="font-medium" data-testid="audit-created-by">{{ vocabulary.created_by_name }}</span>
      </div>
      <div>
        <span class="text-sm text-surface-500">{{ t('vocabularies.audit.updatedBy') }}: </span>
        <span class="font-medium" data-testid="audit-updated-by">{{ vocabulary.updated_by_name || '-' }}</span>
      </div>
      <div>
        <span class="text-sm text-surface-500">{{ t('vocabularies.audit.version') }}: </span>
        <span class="font-medium" data-testid="audit-version">{{ vocabulary.version }}</span>
      </div>
    </div>

    <!-- 変更履歴タイムライン / Change log timeline -->
    <div>
      <h4 class="text-base font-semibold mb-2">{{ t('vocabularies.audit.changeLog') }}</h4>
      <Timeline
        :value="changeLogs"
        data-testid="audit-timeline"
      >
        <template #content="{ item }">
          <div class="text-sm">
            <span class="font-medium">{{ item.changed_by_name }}</span> — {{ formatDate(item.created_at) }}
            <div class="text-surface-500 text-xs">
              {{ item.field }}: {{ item.old_value }} → {{ item.new_value }}
            </div>
          </div>
        </template>
      </Timeline>
      <p v-if="changeLogs.length === 0" class="text-surface-400 text-sm" data-testid="audit-no-logs">
        -
      </p>
    </div>

    <!-- ユーザーレポート / User reports table -->
    <div>
      <h4 class="text-base font-semibold mb-2">{{ t('vocabularies.audit.reports') }}</h4>
      <DataTable
        :value="reports"
        data-testid="audit-reports-table"
        stripedRows
        showGridlines
        size="small"
      >
        <Column field="id" header="ID" style="width: 60px" />
        <Column field="content" header="Content" />
        <Column field="status" header="Status">
          <template #body="{ data }">
            <Tag :value="data.status" :severity="reportStatusSeverity[data.status as ReportStatus]" />
          </template>
        </Column>
        <Column header="Actions">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                v-if="data.status === 'pending'"
                :label="t('vocabularies.audit.resolve')"
                size="small"
                severity="success"
                :data-testid="`report-resolve-btn-${data.id}`"
                @click="emit('updateReportStatus', data.id, 'resolved')"
              />
              <Button
                v-if="data.status === 'resolved'"
                :label="t('vocabularies.audit.pending')"
                size="small"
                severity="warn"
                :data-testid="`report-pending-btn-${data.id}`"
                @click="emit('updateReportStatus', data.id, 'pending')"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
