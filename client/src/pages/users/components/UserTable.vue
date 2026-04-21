<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import type { User, PaginationInfo } from '../composables/useUsers';
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue/datatable';

const { t } = useI18n();

// Props / プロパティ定義
const props = defineProps<{
  users: User[];
  loading: boolean;
  pagination: PaginationInfo;
  sortField?: string;
  sortOrder?: 1 | -1;
}>();

// Emits / イベント定義
const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
  pageChange: [page: number];
  sortChange: [field: string, order: 1 | -1];
}>();

// ステータスタグの色マッピング / Status severity mapping
const statusSeverityMap: Record<string, 'success' | 'warn' | 'danger'> = {
  active: 'success',
  inactive: 'warn',
  suspended: 'danger',
};

// スケルトン行数 / Number of skeleton rows shown while loading
const SKELETON_ROWS = 5;

// 日付フォーマット / Format date to DD/MM/YYYY HH:mm (null-safe)
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

// ページ変更ハンドラ / Handle page change event
function onPageChange(event: DataTablePageEvent): void {
  emit('pageChange', event.page + 1);
}

// ソート変更ハンドラ / Handle sort change event (lazy mode)
function onSort(event: DataTableSortEvent): void {
  if (event.sortField) {
    emit('sortChange', String(event.sortField), event.sortOrder as 1 | -1);
  }
}
</script>

<template>
  <DataTable
    :value="loading ? Array(SKELETON_ROWS).fill({}) : users"
    :lazy="true"
    :paginator="true"
    :rows="pagination.limit"
    :totalRecords="pagination.total"
    :first="(pagination.page - 1) * pagination.limit"
    :sortField="sortField"
    :sortOrder="sortOrder"
    @page="onPageChange"
    @sort="onSort"
    dataKey="id"
    stripedRows
    removableSort
    class="w-full"
  >
    <!-- 空メッセージ / Empty state -->
    <template #empty>
      <div class="text-center py-8 text-surface-500">
        {{ t('users.noUsersFound') }}
      </div>
    </template>

    <Column field="id" :header="t('common.id')" sortable style="width: 80px">
      <template #body="{ data }">
        <Skeleton v-if="loading" />
        <span v-else>{{ data.id }}</span>
      </template>
    </Column>
    <Column field="name" :header="t('users.name')" sortable>
      <template #body="{ data }">
        <Skeleton v-if="loading" />
        <span v-else>{{ data.name }}</span>
      </template>
    </Column>
    <Column field="email" :header="t('users.email')" sortable>
      <template #body="{ data }">
        <Skeleton v-if="loading" />
        <span v-else>{{ data.email }}</span>
      </template>
    </Column>
    <Column field="role" :header="t('users.role')" sortable>
      <template #body="{ data }">
        <Skeleton v-if="loading" />
        <span v-else class="capitalize">{{ data.role }}</span>
      </template>
    </Column>
    <Column field="status" :header="t('users.status')" sortable>
      <template #body="{ data }">
        <Skeleton v-if="loading" />
        <Tag v-else :value="data.status" :severity="statusSeverityMap[data.status]" />
      </template>
    </Column>
    <Column field="created_at" :header="t('users.createdAt')" sortable>
      <template #body="{ data }">
        <Skeleton v-if="loading" />
        <span v-else>{{ formatDate(data.created_at) }}</span>
      </template>
    </Column>
    <Column field="updated_at" :header="t('users.updatedAt')" sortable>
      <template #body="{ data }">
        <Skeleton v-if="loading" />
        <span v-else>{{ formatDate(data.updated_at) }}</span>
      </template>
    </Column>
    <!-- [NEW] Last Login column -->
    <Column field="last_login_at" :header="t('users.lastLogin')" sortable>
      <template #body="{ data }">
        <Skeleton v-if="loading" />
        <span v-else>{{ formatDate(data.last_login_at) }}</span>
      </template>
    </Column>
    <!-- [NEW] Points column -->
    <Column field="points" :header="t('users.points')" sortable>
      <template #body="{ data }">
        <Skeleton v-if="loading" />
        <span v-else>{{ data.points }}</span>
      </template>
    </Column>
    <Column :header="t('common.actions')" style="width: 150px">
      <template #body="{ data }">
        <Skeleton v-if="loading" />
        <div v-else class="flex gap-2">
          <Button icon="pi pi-pencil" severity="info" text rounded @click="emit('edit', data.id)" />
          <Button icon="pi pi-trash" severity="danger" text rounded @click="emit('delete', data.id)" />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
