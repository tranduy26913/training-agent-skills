<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { useNotebooklmOperationsStore } from '@/stores/notebooklm-operations.store';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const operationsStore = useNotebooklmOperationsStore();

const note = ref('');
const dlqId = computed(() => Number(route.params.id));

onMounted(async () => {
  if (Number.isFinite(dlqId.value)) {
    await operationsStore.fetchDlqItem(dlqId.value);
  }
});

watch(
  () => operationsStore.currentDlqItem,
  (item) => {
    note.value = item?.note ?? '';
  },
  { immediate: true },
);

const payloadJson = computed(() => {
  if (!operationsStore.currentDlqItem?.payload) return '{}';
  return JSON.stringify(operationsStore.currentDlqItem.payload, null, 2);
});

async function submit(): Promise<void> {
  await operationsStore.updateItem(dlqId.value, { note: note.value.trim() });
  toast.add({ severity: 'success', summary: 'Success', detail: 'DLQ note updated', life: 2500 });
  router.push({ name: 'NotebooklmJobMonitor' });
}

function cancel(): void {
  router.push({ name: 'NotebooklmJobMonitor' });
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-4">
    <h2 class="text-2xl font-semibold">Edit DLQ Item</h2>

    <Card>
      <template #content>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-surface-500">DLQ Item</p>
            <p class="font-semibold">#{{ dlqId }}</p>
            <p class="text-xs text-surface-500">Job ID: {{ operationsStore.currentDlqItem?.jobId ?? '-' }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">Payload (read only)</label>
            <Textarea :model-value="payloadJson" rows="8" fluid readonly auto-resize />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">Operational note</label>
            <Textarea
              v-model="note"
              data-testid="dlq-note"
              rows="4"
              fluid
              auto-resize
              placeholder="Capture incident handling notes"
            />
          </div>

          <div class="flex justify-end gap-2">
            <Button label="Cancel" severity="secondary" outlined @click="cancel" />
            <Button label="Save" icon="pi pi-save" data-testid="dlq-save" @click="submit" />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
