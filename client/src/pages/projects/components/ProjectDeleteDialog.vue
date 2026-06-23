<script setup lang="ts">
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
  >
    <p class="text-surface-700 dark:text-surface-300">
      {{ $t('projects.delete.confirm', { name: projectName }) }}
    </p>

    <template #footer>
      <Button
        :label="$t('common.no')"
        icon="pi pi-times"
        class="p-button-text"
        @click="handleCancel"
      />
      <Button
        :label="$t('common.yes')"
        icon="pi pi-trash"
        severity="danger"
        @click="handleConfirm"
      />
    </template>
  </Dialog>
</template>
