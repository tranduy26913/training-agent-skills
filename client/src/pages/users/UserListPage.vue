<script setup lang="ts">
import { onMounted, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import { useUsersStore } from '@/stores/users.store';
import UserTable from './components/UserTable.vue';
import UserFilters from './components/UserFilters.vue';
import type { UserFilters as UserFiltersType } from './composables/useUsers';

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const usersStore = useUsersStore();

// 初期読み込み / Load users on mount
onMounted(() => {
  usersStore.fetchUsers();
});

// フィルター変更ハンドラ / Handle filter changes
function handleFilterChange(filters: UserFiltersType): void {
  usersStore.fetchUsers({ ...filters, page: 1 });
}

// ページ変更ハンドラ / Handle page changes
function handlePageChange(page: number): void {
  usersStore.fetchUsers({ ...usersStore.filters, page });
}

// 編集ハンドラ / Navigate to edit page
function handleEdit(id: number): void {
  router.push({ name: 'UserEdit', params: { id } });
}

// ソートフィールドとオーダー / Active sort state
const sortField = shallowRef<string>('created_at');
const sortOrder = shallowRef<1 | -1>(-1);

// ソート変更ハンドラ / Handle sort change from table
function handleSortChange(field: string, order: 1 | -1): void {
  sortField.value = field;
  sortOrder.value = order;
  usersStore.fetchUsers({ ...usersStore.filters, page: 1, sortBy: field, sortOrder: order === 1 ? 'asc' : 'desc' });
}

// 削除ハンドラ / Delete user with confirmation
function handleDelete(id: number): void {
  confirm.require({
    message: t('users.deleteConfirm'),
    header: t('users.deleteHeader'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await usersStore.deleteUser(id);
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('users.deletedSuccess'), life: 3000 });
      } catch {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('users.deletedError'), life: 3000 });
      }
    },
  });
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 data-testid="users-list-heading" class="text-2xl font-semibold text-surface-800 dark:text-surface-100">{{ t('users.title') }}</h2>
      <Button
        :label="t('users.createUser')"
        icon="pi pi-plus"
        @click="router.push({ name: 'UserCreate' })"
      />
    </div>

    <UserFilters @filter-change="handleFilterChange" />

    <UserTable
      :users="usersStore.users"
      :loading="usersStore.loading"
      :pagination="usersStore.pagination"
      :sortField="sortField"
      :sortOrder="sortOrder"
      @edit="handleEdit"
      @delete="handleDelete"
      @page-change="handlePageChange"
      @sort-change="handleSortChange"
    />

    <ConfirmDialog />
  </div>
</template>
