<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import type { NotebooklmWorkspaceRole, WorkspaceMember, WorkspaceMemberCandidate } from '@/types/notebooklm.types';

const props = defineProps<{
  members: WorkspaceMember[];
  candidates: WorkspaceMemberCandidate[];
  canManage: boolean;
  loading?: boolean;
  searching?: boolean;
  adding?: boolean;
}>();

const emit = defineEmits<{
  search: [query: string];
  add: [payload: { userId: number; role: NotebooklmWorkspaceRole }];
}>();

const { t } = useI18n();

const searchKeyword = shallowRef('');
const selectedCandidateId = shallowRef<number | null>(null);
const selectedRole = shallowRef<NotebooklmWorkspaceRole | ''>('');
const roleError = shallowRef('');

const roleOptions = computed(() => [
  { label: t('notebooklmWorkspace.memberManager.roles.owner'), value: 'owner' },
  { label: t('notebooklmWorkspace.memberManager.roles.editor'), value: 'editor' },
  { label: t('notebooklmWorkspace.memberManager.roles.viewer'), value: 'viewer' },
]);

const selectedCandidate = computed(() =>
  props.candidates.find((candidate) => candidate.id === selectedCandidateId.value) ?? null,
);

function handleSearchInput(value: string): void {
  searchKeyword.value = value;
  emit('search', value);
}

function selectCandidate(userId: number): void {
  selectedCandidateId.value = userId;
}

function submitAdd(): void {
  roleError.value = '';
  if (!selectedCandidate.value) {
    return;
  }

  if (!selectedRole.value) {
    roleError.value = t('notebooklmWorkspace.memberManager.roleRequired');
    return;
  }

  emit('add', {
    userId: selectedCandidate.value.id,
    role: selectedRole.value,
  });
}

function roleSeverity(role: NotebooklmWorkspaceRole): 'success' | 'info' | 'warn' {
  if (role === 'owner') return 'success';
  if (role === 'editor') return 'info';
  return 'warn';
}
</script>

<template>
  <Card>
    <template #title>{{ t('notebooklmWorkspace.memberManager.title') }}</template>
    <template #content>
      <section class="space-y-4">
        <div v-if="canManage" class="space-y-3">
          <InputText
            data-testid="workspace-member-search"
            :model-value="searchKeyword"
            :placeholder="t('notebooklmWorkspace.memberManager.searchPlaceholder')"
            fluid
            @update:model-value="(value) => handleSearchInput(String(value))"
          />

          <div class="rounded border border-surface-200 p-3">
            <p class="text-xs font-medium text-surface-500">{{ t('notebooklmWorkspace.memberManager.searchResultTitle') }}</p>

            <p v-if="searching" class="mt-2 text-sm text-surface-500">{{ t('common.loading') }}</p>

            <p
              v-else-if="searchKeyword.trim().length > 0 && candidates.length === 0"
              class="mt-2 text-sm text-surface-500"
            >
              {{ t('notebooklmWorkspace.memberManager.noCandidates') }}
            </p>

            <ul v-else class="mt-2 space-y-2">
              <li v-for="candidate in candidates" :key="candidate.id" class="flex items-center justify-between gap-2">
                <button
                  type="button"
                  class="w-full rounded border px-2 py-1 text-left text-sm"
                  :class="candidate.id === selectedCandidateId ? 'border-primary bg-primary-50' : 'border-surface-200'"
                  :data-testid="`candidate-select-${candidate.id}`"
                  @click="selectCandidate(candidate.id)"
                >
                  <span class="font-medium">{{ candidate.name }}</span>
                  <span class="ml-2 text-xs text-surface-500">{{ candidate.email }}</span>
                </button>
              </li>
            </ul>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div class="w-full sm:max-w-56">
              <Select
                v-model="selectedRole"
                :options="roleOptions"
                option-label="label"
                option-value="value"
                data-testid="workspace-member-role"
                :placeholder="t('notebooklmWorkspace.memberManager.selectRole')"
                fluid
              />
            </div>

            <Button
              data-testid="workspace-member-add"
              type="button"
              icon="pi pi-user-plus"
              :label="t('notebooklmWorkspace.memberManager.addOrUpdate')"
              :disabled="!selectedCandidate"
              :loading="adding"
              @click="submitAdd"
            />
          </div>

          <Message v-if="roleError" severity="error" size="small" variant="simple">{{ roleError }}</Message>
        </div>

        <div v-else class="rounded border border-surface-200 bg-surface-50 p-3 text-sm text-surface-600">
          {{ t('notebooklmWorkspace.memberManager.readonlyHint') }}
        </div>

        <p v-if="loading" class="text-sm text-surface-500">{{ t('common.loading') }}</p>

        <div v-if="members.length === 0 && !loading" class="text-sm text-surface-500">
          {{ t('notebooklmWorkspace.memberManager.noMembers') }}
        </div>

        <ul v-else class="space-y-2">
          <li
            v-for="member in members"
            :key="member.id"
            class="flex items-center justify-between rounded border border-surface-200 px-3 py-2"
          >
            <div class="min-w-0">
              <p class="truncate font-medium">{{ member.name || member.email || `#${member.userId}` }}</p>
              <p class="truncate text-xs text-surface-500">{{ member.email }}</p>
            </div>
            <Tag :value="member.role" :severity="roleSeverity(member.role)" />
          </li>
        </ul>
      </section>
    </template>
  </Card>
</template>
