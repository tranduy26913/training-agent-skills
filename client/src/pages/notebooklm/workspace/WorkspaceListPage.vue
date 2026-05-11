<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import WorkspaceTable from './components/WorkspaceTable.vue';
import { useNotebooklmWorkspaceStore } from '@/stores/notebooklm-workspace.store';
import type { NotebooklmWorkspaceRole } from '@/types/notebooklm.types';

const router = useRouter();
const workspaceStore = useNotebooklmWorkspaceStore();
const confirm = useConfirm();
const toast = useToast();
const { t } = useI18n();

const search = ref('');
const role = ref<NotebooklmWorkspaceRole | ''>('');
const limit = ref(10);

const roleOptions = [
  { label: t('notebooklmWorkspace.allRoles'), value: '' },
  { label: 'owner', value: 'owner' },
  { label: 'editor', value: 'editor' },
  { label: 'viewer', value: 'viewer' },
];

async function loadWorkspaces(page = 1): Promise<void> {
  await workspaceStore.fetchItems({
    page,
    limit: limit.value,
    search: search.value.trim() || undefined,
    role: (role.value || undefined) as NotebooklmWorkspaceRole | undefined,
  });
}

onMounted(() => {
  void loadWorkspaces();
});

watchDebounced(
  search,
  () => {
    void loadWorkspaces(1);
  },
  { debounce: 350, maxWait: 800 },
);

function handleOpen(id: number): void {
  router.push({ name: 'NotebooklmWorkspaceEdit', params: { id } });
}

function handleEdit(id: number): void {
  router.push({ name: 'NotebooklmWorkspaceEdit', params: { id } });
}

async function handleDelete(id: number): Promise<void> {
  confirm.require({
    message: t('notebooklmWorkspace.deleteConfirm'),
    header: t('notebooklmWorkspace.deleteHeader'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await workspaceStore.deleteItem(id);
        toast.add({
          severity: 'success',
          summary: t('common.success'),
          detail: t('notebooklmWorkspace.deletedSuccess'),
          life: 3000,
        });
      } catch {
        toast.add({
          severity: 'error',
          summary: t('common.error'),
          detail: t('notebooklmWorkspace.deletedError'),
          life: 3000,
        });
      }
    },
  });
}

function handleRoleChange(): void {
  void loadWorkspaces(1);
}

function handlePageChange(page: number): void {
  void loadWorkspaces(page);
}

function handleLimitChange(): void {
  void loadWorkspaces(1);
}

function clearFilters(): void {
  search.value = '';
  role.value = '';
  void loadWorkspaces(1);
}
</script>

<template>
  <div class="space-y-4">
    <Card>
      <template #content>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-2xl font-semibold">NotebookLM Workspaces</h2>
            <p class="text-sm text-surface-500">Manage your workspace knowledge bases and ingestion access.</p>
          </div>
          <Button
            type="button"
            label="New Workspace"
            icon="pi pi-plus"
            class="w-full sm:w-auto"
            @click="router.push({ name: 'NotebooklmWorkspaceCreate' })"
          />
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="space-y-1 xl:col-span-2">
            <label class="text-xs font-medium text-surface-600 dark:text-surface-300">
              {{ t('common.search') }}
            </label>
            <InputText
              v-model="search"
              data-testid="workspace-filter-search"
              :placeholder="t('notebooklmWorkspace.searchPlaceholder')"
              fluid
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-surface-600 dark:text-surface-300">
              {{ t('notebooklmWorkspace.role') }}
            </label>
            <Select
              v-model="role"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              data-testid="workspace-filter-role"
              fluid
              @change="handleRoleChange"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-surface-600 dark:text-surface-300">
              {{ t('notebooklmWorkspace.rowsPerPage') }}
            </label>
            <Select
              v-model="limit"
              :options="[10, 25, 50]"
              data-testid="workspace-filter-limit"
              fluid
              @change="handleLimitChange"
            />
          </div>
        </div>

        <div class="mt-3 flex justify-end">
          <Button
            type="button"
            data-testid="workspace-filter-clear"
            severity="secondary"
            outlined
            icon="pi pi-filter-slash"
            :label="t('notebooklmWorkspace.clearFilters')"
            @click="clearFilters"
          />
        </div>
      </template>
    </Card>

    <WorkspaceTable
      :workspaces="workspaceStore.items"
      :loading="workspaceStore.loading"
      :pagination="workspaceStore.pagination"
      @open="handleOpen"
      @edit="handleEdit"
      @delete="handleDelete"
      @page-change="handlePageChange"
    />

    <ConfirmDialog />
  </div>
</template>
