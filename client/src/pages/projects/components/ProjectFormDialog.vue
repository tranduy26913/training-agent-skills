<script setup lang="ts">
import { ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import type { Project, CreateProjectDto, UpdateProjectDto } from '@apptypes/projects.types';

const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit';
  project: Project | null;
}>();

const emit = defineEmits<{
  saved: [data: CreateProjectDto | UpdateProjectDto];
  closed: [];
}>();

// Zod validation schema
const validationSchema = toTypedSchema(
  z.object({
    name: z
      .string()
      .min(2, 'Tên phải từ 2 ký tự')
      .max(200, 'Tên không quá 200 ký tự'),
    description: z
      .string()
      .max(2000, 'Mô tả không quá 2000 ký tự')
      .optional()
      .default(''),
    projectPrompt: z
      .string()
      .max(10000, 'Prompt không quá 10000 ký tự')
      .optional()
      .default(''),
  }),
);

const { defineField, handleSubmit, resetForm, errors } = useForm({
  validationSchema,
});

const [nameField] = defineField('name');
const [descriptionField] = defineField('description');
const [projectPromptField] = defineField('projectPrompt');

const loading = ref(false);

// Populate form in edit mode
watch(
  () => props.project,
  (project) => {
    if (project && props.mode === 'edit') {
      resetForm({
        values: {
          name: project.name,
          description: project.description ?? '',
          projectPrompt: project.projectPrompt ?? '',
        },
      });
    }
  },
  { immediate: true },
);

// Reset form when dialog opens in create mode
watch(
  () => props.visible,
  (visible) => {
    if (visible && props.mode === 'create') {
      resetForm({ values: { name: '', description: '', projectPrompt: '' } });
    }
  },
);

const onSave = handleSubmit(async (values) => {
  loading.value = true;
  try {
    const payload: CreateProjectDto = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      projectPrompt: values.projectPrompt?.trim() || undefined,
    };
    emit('saved', payload);
  } finally {
    loading.value = false;
  }
});

function handleCancel() {
  emit('closed');
}

function handleOverlayClose() {
  emit('closed');
}
</script>

<template>
  <Dialog
    :visible="visible"
    :header="mode === 'create' ? $t('projects.form.createTitle') : $t('projects.form.editTitle')"
    :modal="true"
    :closable="true"
    :draggable="false"
    :style="{ width: '520px' }"
    @hide="handleOverlayClose"
    @update:visible="(val) => { if (!val) handleOverlayClose() }"
  >
    <div class="flex flex-col gap-4">
      <!-- Name -->
      <div>
        <label class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">
          {{ $t('projects.form.name') }} <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="nameField"
          :placeholder="$t('projects.form.namePlaceholder')"
          :class="{ 'p-invalid': errors.name }"
          class="w-full"
        />
        <small v-if="errors.name" class="text-red-500 block mt-1">
          {{ errors.name }}
        </small>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">
          {{ $t('projects.form.description') }}
        </label>
        <Textarea
          v-model="descriptionField"
          :placeholder="$t('projects.form.descriptionPlaceholder')"
          :class="{ 'p-invalid': errors.description }"
          class="w-full"
          :autoResize="true"
          rows="3"
        />
        <div class="flex justify-between mt-1">
          <small v-if="errors.description" class="text-red-500">
            {{ errors.description }}
          </small>
          <small class="text-surface-400 ml-auto">
            {{ (descriptionField ?? '').length }}/2000
          </small>
        </div>
      </div>

      <!-- Project Prompt -->
      <div>
        <label class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">
          {{ $t('projects.form.projectPrompt') }}
        </label>
        <Textarea
          v-model="projectPromptField"
          :placeholder="$t('projects.form.promptPlaceholder')"
          :class="{ 'p-invalid': errors.projectPrompt }"
          class="w-full"
          :autoResize="true"
          rows="4"
        />
        <div class="flex justify-between mt-1">
          <small v-if="errors.projectPrompt" class="text-red-500">
            {{ errors.projectPrompt }}
          </small>
          <small class="text-surface-400 ml-auto">
            {{ (projectPromptField ?? '').length }}/10000
          </small>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <Button
          :label="$t('common.cancel')"
          icon="pi pi-times"
          class="p-button-text"
          @click="handleCancel"
        />
        <Button
          :label="$t('common.save')"
          icon="pi pi-check"
          :loading="loading"
          :disabled="loading"
          @click="onSave"
        />
      </div>
    </template>
  </Dialog>
</template>
