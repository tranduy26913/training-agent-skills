<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Project } from '@apptypes/projects.types';
import Button from 'primevue/button';
import OverlayPanel from 'primevue/overlaypanel';

const props = defineProps<{
  project: Project;
}>();

const emit = defineEmits<{
  click: [id: number];
  edit: [id: number];
  delete: [id: number];
}>();

const actionMenu = ref();

// Random accent color based on project id
const accentColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
];
const accentColor = computed(() => accentColors[props.project.id % accentColors.length]);

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

function toggleMenu(event: MouseEvent) {
  actionMenu.value?.toggle(event);
}
</script>

<template>
  <div
    class="bg-surface-50 dark:bg-surface-700 rounded-lg shadow-sm border border-surface-200 dark:border-surface-600 hover:shadow-md hover:bg-surface-100 dark:hover:bg-surface-600 hover:border-surface-200 dark:hover:border-surface-600 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden"
    @click="handleCardClick"
  >
    <!-- Top accent bar (random color) -->
    <div :class="['h-1', accentColor]"></div>

    <!-- Header: Icon + Name -->
    <div class="p-4 pb-2 flex items-start gap-3">
      <i class="pi pi-folder-open text-primary text-xl mt-0.5"></i>
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
    <div class="px-4 py-3 border-t border-surface-200 dark:border-surface-600 flex items-center justify-between">
      <span class="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-1">
        <i class="pi pi-pencil text-xs"></i>
        {{ formatDate(project.updatedAt) }}
      </span>
      <div>
        <Button
          icon="pi pi-ellipsis-v"
          class="p-button-rounded p-button-text p-button-sm"
          :pt="{ root: { class: '!w-8 !h-8' } }"
          @click.stop="toggleMenu"
        />
        <OverlayPanel ref="actionMenu" :dismissable="true" :showCloseIcon="false">
          <div class="flex flex-col gap-1">
            <Button
              :label="$t('common.edit')"
              icon="pi pi-pencil"
              class="p-button-text p-button-sm w-full justify-start"
              @click="handleEdit"
            />
            <Button
              :label="$t('common.delete')"
              icon="pi pi-trash"
              class="p-button-text p-button-sm p-button-danger w-full justify-start"
              @click="handleDelete"
            />
          </div>
        </OverlayPanel>
      </div>
    </div>
  </div>
</template>
