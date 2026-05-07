<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { CreateWorkspaceDto, Workspace } from '@/types/notebooklm.types';

const props = defineProps<{
  mode: 'create' | 'edit';
  initialData?: Workspace | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: CreateWorkspaceDto];
  cancel: [];
}>();

const form = reactive({
  name: '',
  description: '',
});

const errors = reactive({
  name: '',
});

watch(
  () => props.initialData,
  (value) => {
    if (!value) return;
    form.name = value.name;
    form.description = value.description ?? '';
  },
  { immediate: true },
);

function validate(): boolean {
  errors.name = '';
  const normalizedName = form.name.trim();

  if (!normalizedName) {
    errors.name = 'Name is required';
    return false;
  }

  if (normalizedName.length < 3) {
    errors.name = 'Name must be at least 3 characters';
    return false;
  }

  if (normalizedName.length > 255) {
    errors.name = 'Name must be 255 characters or less';
    return false;
  }

  return true;
}

function handleSubmit(): void {
  if (!validate()) return;

  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
  });
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="space-y-1">
      <label class="block text-sm font-medium text-surface-700">Workspace name</label>
      <input
        data-testid="workspace-name"
        v-model="form.name"
        type="text"
        class="w-full rounded border border-surface-300 px-3 py-2"
        placeholder="Project A Knowledge"
      />
      <p v-if="errors.name" class="text-sm text-red-600">{{ errors.name }}</p>
    </div>

    <div class="space-y-1">
      <label class="block text-sm font-medium text-surface-700">Description</label>
      <textarea
        data-testid="workspace-description"
        v-model="form.description"
        rows="4"
        class="w-full rounded border border-surface-300 px-3 py-2"
        placeholder="Optional context for this workspace"
      />
    </div>

    <div class="flex gap-2">
      <button
        type="submit"
        class="rounded bg-primary px-4 py-2 text-white"
        :disabled="loading"
      >
        {{ mode === 'create' ? 'Create workspace' : 'Save changes' }}
      </button>
      <button
        type="button"
        class="rounded border border-surface-300 px-4 py-2"
        @click="emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </form>
</template>
