<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
defineProps<{
  visible: boolean;
  projectName: string;
}>();

const emit = defineEmits<{
  confirmed: [];
  cancelled: [];
}>();

function handleConfirm() {
  emit('confirmed');
}

function handleCancel() {
  emit('cancelled');
}
</script>

<template>
  <Dialog
    :visible="visible"
    :header="$t('projects.delete.header')"
    :modal="true"
    :closable="true"
    :draggable="false"
    :style="{ width: '420px' }"
    @hide="handleCancel"
    @update:visible="(val) => { if (!val) handleCancel() }"
  >
    <p class="text-surface-700 dark:text-surface-300">
      {{ $t('projects.delete.confirm', { name: projectName }) }}
    </p>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <Button
          :label="$t('common.no')"
          icon="pi pi-times"
          severity="danger"
          @click="handleCancel"
        />
        <Button
          :label="$t('common.yes')"
          icon="pi pi-trash"
          severity="danger"
          @click="handleConfirm"
        />
      </div>
    </template>
  </Dialog>
</template>
