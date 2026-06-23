<script setup lang="ts">
import type { Project } from '@apptypes/projects.types';

const props = defineProps<{
  project: Project;
}>();

const emit = defineEmits<{
  click: [id: number];
  edit: [id: number];
  delete: [id: number];
}>();

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function handleCardClick() {
  emit('click', props.project.id);
}

function handleEdit(event: MouseEvent) {
  event.stopPropagation();
  emit('edit', props.project.id);
}

function handleDelete(event: MouseEvent) {
  event.stopPropagation();
  emit('delete', props.project.id);
}
</script>

<template>
  <div
    class="bg-surface-0 dark:bg-surface-800 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col"
    @click="handleCardClick"
  >
    <!-- Header: Name -->
    <div class="p-4 pb-2">
      <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100 line-clamp-2">
        {{ project.name }}
      </h3>
    </div>

    <!-- Body: Description + Prompt preview -->
    <div class="px-4 pb-2 flex-1 space-y-1">
      <p
        v-if="project.description"
        class="text-sm text-surface-600 dark:text-surface-400 line-clamp-3"
      >
        {{ project.description }}
      </p>
      <p
        v-if="project.projectPrompt"
        class="text-xs italic text-surface-400 dark:text-surface-500 line-clamp-2"
      >
        {{ project.projectPrompt }}
      </p>
    </div>

    <!-- Footer: UpdatedAt + Actions -->
    <div class="px-4 py-3 border-t border-surface-100 dark:border-surface-700 flex items-center justify-between">
      <span class="text-xs text-surface-400 dark:text-surface-500">
        Cập nhật: {{ formatDate(project.updatedAt) }}
      </span>
      <div class="flex gap-1">
        <Button
          icon="pi pi-pencil"
          class="p-button-rounded p-button-text p-button-sm"
          :pt="{
            root: { class: '!w-8 !h-8' },
          }"
          @click="handleEdit"
          v-tooltip.top="$t('common.edit')"
        />
        <Button
          icon="pi pi-trash"
          class="p-button-rounded p-button-text p-button-sm p-button-danger"
          :pt="{
            root: { class: '!w-8 !h-8' },
          }"
          @click="handleDelete"
          v-tooltip.top="$t('common.delete')"
        />
      </div>
    </div>
  </div>
</template>
