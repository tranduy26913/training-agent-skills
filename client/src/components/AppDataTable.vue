<script setup lang="ts" generic="T extends object">
import { computed } from 'vue';
import { useWindowSize } from '@vueuse/core';
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable';
import Column from 'primevue/column';
import Skeleton from 'primevue/skeleton';
import type { AppTableColumn } from '@/types/table.types';

// Props / プロパティ定義
const props = withDefaults(
  defineProps<{
    columns: AppTableColumn<T>[];
    value: T[];
    loading?: boolean;
    /** Pagination state. Omit for non-paginated tables. */
    pagination?: { page: number; limit: number; total: number };
    sortField?: string;
    sortOrder?: 1 | -1;
    skeletonRows?: number;
    stripedRows?: boolean;
    /** Minimum total table width, e.g. '900px'. Enables inner horizontal scroll when content exceeds container. */
    tableWidth?: string;
  }>()
  ,
  {
    loading: false,
    skeletonRows: 5,
    stripedRows: true,
  },
);

// Emits / イベント定義
const emit = defineEmits<{
  pageChange: [page: number];
  sortChange: [field: string, order: 1 | -1];
}>();

const { width: windowWidth } = useWindowSize();

// 表示列フィルタリング / Filter columns by viewport width (frozen columns always shown)
const visibleColumns = computed<AppTableColumn<T>[]>(() =>
  props.columns.filter(
    (col) => col.frozen || !col.hideBelow || windowWidth.value >= col.hideBelow,
  ),
);

// スケルトン or 実データ / Skeleton rows during loading or actual data
const displayValue = computed<T[]>(() =>
  props.loading ? (Array(props.skeletonRows).fill({}) as T[]) : props.value,
);

// セルテキスト取得 / Get display text from formatter or raw field value
function getCellText(col: AppTableColumn<T>, data: T): string {
  if (col.formatter) return col.formatter(data);
  const val = (data as Record<string, unknown>)[col.field];
  return val != null ? String(val) : '';
}

// ヘッダーアライン → justify-content 変換 / Map align string to CSS justify-content value
function toJustify(align: 'left' | 'center' | 'right' | undefined): string {
  if (align === 'center') return 'center';
  if (align === 'right') return 'flex-end';
  return 'flex-start';
}

// ページ変更 / Page change handler
function onPageChange(event: DataTablePageEvent): void {
  emit('pageChange', event.page + 1);
}

// ソート変更 / Sort change handler
function onSort(event: DataTableSortEvent): void {
  if (event.sortField) {
    emit('sortChange', String(event.sortField), event.sortOrder as 1 | -1);
  }
}
</script>

<template>
  <!-- テーブルコンテナ / Scroll container — prevents page-level horizontal scroll -->
  <div class="w-full overflow-x-auto">
  <DataTable
    :value="displayValue"
    :lazy="!!pagination"
    :paginator="!!pagination"
    :rows="pagination?.limit"
    :totalRecords="pagination?.total"
    :first="pagination ? (pagination.page - 1) * pagination.limit : 0"
    :sortField="sortField"
    :sortOrder="sortOrder"
    :stripedRows="stripedRows"
    :tableStyle="tableWidth ? `min-width:${tableWidth}` : undefined"
    scrollable
    removableSort
    showGridlines
    dataKey="id"
    @page="onPageChange"
    @sort="onSort"
    class="w-full"
    :pt="{
      bodyRow: { class: 'transition-colors duration-150 hover:!bg-primary-50 dark:hover:!bg-primary-950/30 cursor-default' },
    }"
  >
    <!-- 空状態スロット / Empty state -->
    <template #empty>
      <slot name="empty">
        <div class="text-center py-8 text-surface-500">No records found.</div>
      </slot>
    </template>

    <!--
      列レンダリング / Column rendering
      - frozen columns are always visible (right-sticky by default)
      - truncate columns: clip text + show full value via PrimeVue tooltip
      - custom slot #cell-{field}: override cell rendering entirely
    -->
    <Column
      v-for="col in visibleColumns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
      :sortable="col.sortable"
      :frozen="col.frozen"
      :align-frozen="col.alignFrozen ?? 'right'"
      :style="{ width: col.width, minWidth: col.width }"
      :body-style="{ textAlign: col.columnAlign ?? 'left' }"
      :pt="{ headerContent: { style: { justifyContent: toJustify(col.headerAlign ?? 'center') } } }"
    >
      <template #body="{ data }">
        <!-- ローディングスケルトン / Loading skeleton -->
        <Skeleton v-if="loading" height="1.5rem" />

        <!-- カスタムスロット / Custom slot #cell-{field} takes precedence -->
        <slot
          v-else-if="$slots[`cell-${col.field}`]"
          :name="`cell-${col.field}`"
          :data="(data as T)"
          :col="col"
        />

        <!-- 省略 + ツールチップ / Truncated text with tooltip on hover -->
        <div
          v-else-if="col.truncate"
          class="overflow-hidden text-ellipsis whitespace-nowrap"
          v-tooltip.top="getCellText(col, data as T) || undefined"
        >
          {{ getCellText(col, data as T) }}
        </div>

        <!-- プレーンテキスト / Plain text -->
        <span v-else>{{ getCellText(col, data as T) }}</span>
      </template>
    </Column>
  </DataTable>
  </div>
</template>
