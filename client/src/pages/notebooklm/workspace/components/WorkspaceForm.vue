<script setup lang="ts">
import { reactive, watch } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Message from 'primevue/message';
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
  <Card>
    <template #content>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-1">
          <label for="workspace-name" class="block text-sm font-medium">Workspace name</label>
          <InputText
            id="workspace-name"
            data-testid="workspace-name"
            v-model="form.name"
            fluid
            placeholder="Project A Knowledge"
          />
          <Message v-if="errors.name" severity="error" size="small" variant="simple">{{ errors.name }}</Message>
        </div>

        <div class="space-y-1">
          <label for="workspace-description" class="block text-sm font-medium">Description</label>
          <Textarea
            id="workspace-description"
            data-testid="workspace-description"
            v-model="form.description"
            rows="4"
            fluid
            auto-resize
            placeholder="Optional context for this workspace"
          />
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            :label="mode === 'create' ? 'Create workspace' : 'Save changes'"
            icon="pi pi-save"
            :loading="loading"
            class="w-full sm:w-auto"
          />
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            outlined
            class="w-full sm:w-auto"
            @click="emit('cancel')"
          />
        </div>
      </form>
    </template>
  </Card>
</template>
