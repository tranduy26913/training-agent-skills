<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import AppDataTable from '@/components/AppDataTable.vue';
import type { AppTableColumn } from '@/types/table.types';
import type { User, PaginationInfo } from '../composables/useUsers';

const { t } = useI18n();

// Props / 繝励Ο繝代ユ繧｣螳夂ｾｩ
const props = defineProps<{
  users: User[];
  loading: boolean;
  pagination: PaginationInfo;
  sortField?: string;
  sortOrder?: 1 | -1;
}>();

// Emits / 繧､繝吶Φ繝亥ｮ夂ｾｩ
const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
  pageChange: [page: number];
  sortChange: [field: string, order: 1 | -1];
}>();

// 繧ｹ繝・・繧ｿ繧ｹ繧ｿ繧ｰ縺ｮ濶ｲ繝槭ャ繝斐Φ繧ｰ / Status 竊・PrimeVue severity
const statusSeverityMap: Record<string, 'success' | 'warn' | 'danger'> = {
  active: 'success',
  inactive: 'warn',
  suspended: 'danger',
};

// 譌･莉倥ヵ繧ｩ繝ｼ繝槭ャ繝・/ Format date string to DD/MM/YYYY HH:mm (null-safe)
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

/*
 * 蛻怜ｮ夂ｾｩ / Column definitions
 *
 * hideBelow breakpoints (hide columns on smaller screens):
 *   1280px (xl) 窶・Points, Last Login, Updated At
 *   1024px (lg) 窶・Created At
 *    900px      窶・Role
 *    768px (md) 窶・ID
 *
 * Frozen action column always visible on the right.
 */
const columns = computed<AppTableColumn<User>[]>(() => [
  {
    field: 'id',
    header: t('common.id'),
    width: '72px',
    sortable: true,
    hideBelow: 768,
    frozen: true,
    alignFrozen: 'left',
    columnAlign: 'center',
  },
  {
    field: 'name',
    header: t('users.name'),
    width: '160px',
    sortable: true,
    truncate: true,
    columnAlign: 'left',
  },
  {
    field: 'email',
    header: t('users.email'),
    width: '220px',
    sortable: true,
    truncate: true,
    columnAlign: 'left',
  },
  {
    field: 'role',
    header: t('users.role'),
    width: '120px',
    sortable: true,
    hideBelow: 900,
    columnAlign: 'center',
  },
  {
    field: 'status',
    header: t('users.status'),
    width: '140px',
    sortable: true,
    columnAlign: 'center',
  },
  {
    field: 'created_at',
    header: t('users.createdAt'),
    width: '160px',
    sortable: true,
    truncate: true,
    hideBelow: 1024,
    columnAlign: 'center',
    formatter: (row) => formatDate(row.created_at),
  },
  {
    field: 'updated_at',
    header: t('users.updatedAt'),
    width: '160px',
    sortable: true,
    truncate: true,
    hideBelow: 1280,
    columnAlign: 'center',
    formatter: (row) => formatDate(row.updated_at),
  },
  {
    field: 'last_login_at',
    header: t('users.lastLogin'),
    width: '160px',
    sortable: true,
    truncate: true,
    hideBelow: 1280,
    columnAlign: 'center',
    formatter: (row) => formatDate(row.last_login_at),
  },
  {
    field: 'points',
    header: t('users.points'),
    width: '120px',
    sortable: true,
    hideBelow: 1280,
    columnAlign: 'right',
  },
  {
    field: 'actions',
    header: t('common.actions'),
    width: '120px',
    frozen: true,
    alignFrozen: 'right',
    headerAlign: 'right',
    columnAlign: 'center',
  },
]);
</script>

<template>
  <AppDataTable
    :columns="columns"
    :value="users"
    :loading="loading"
    :pagination="pagination"
    :sort-field="sortField"
    :sort-order="sortOrder"
    table-width="1200px"
    @page-change="(p) => emit('pageChange', p)"
    @sort-change="(f, o) => emit('sortChange', f, o)"
  >
    <!-- 遨ｺ繝｡繝・そ繝ｼ繧ｸ / Empty state -->
    <template #empty>
      <div class="text-center py-8 text-surface-500">
        {{ t('users.noUsersFound') }}
      </div>
    </template>

    <!-- 繧ｹ繝・・繧ｿ繧ｹ繝舌ャ繧ｸ / Status badge -->
    <template #cell-status="{ data }">
      <Tag :value="data.status" :severity="statusSeverityMap[data.status as string]" />
    </template>

    <!-- 繧｢繧ｯ繧ｷ繝ｧ繝ｳ繝懊ち繝ｳ / Action buttons -->
    <template #cell-actions="{ data }">
      <div class="flex gap-2">
        <Button
          icon="pi pi-pencil"
          severity="info"
          text
          rounded
          @click="emit('edit', data.id as number)"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          @click="emit('delete', data.id as number)"
        />
      </div>
    </template>
  </AppDataTable>
</template>
