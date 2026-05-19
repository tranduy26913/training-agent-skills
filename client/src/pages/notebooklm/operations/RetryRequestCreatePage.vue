<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useNotebooklmOperationsStore } from '@/stores/notebooklm-operations.store';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const operationsStore = useNotebooklmOperationsStore();

const reason = ref('');
const force = ref(false);

const jobId = computed(() => Number(route.params.id));
const canRetry = computed(() => {
  const status = operationsStore.currentItem?.status;
  return status === 'failed' || status === 'dead_letter';
});

onMounted(async () => {
  if (Number.isFinite(jobId.value)) {
    await operationsStore.fetchItem(jobId.value);
  }
});

async function submit(): Promise<void> {
  if (!reason.value.trim()) return;
  await operationsStore.createItem(jobId.value, {
    reason: reason.value.trim(),
    force: force.value,
  });
  toast.add({ severity: 'success', summary: 'Success', detail: 'Retry request submitted', life: 2500 });
  router.push({ name: 'NotebooklmJobMonitor' });
}

function cancel(): void {
  router.push({ name: 'NotebooklmJobMonitor' });
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-4">
    <h2 class="text-2xl font-semibold">Create Retry Request</h2>

    <Card>
      <template #content>
        <div class="space-y-4">
          <div class="rounded-md border border-surface-200 p-3 dark:border-surface-700">
            <p class="text-sm text-surface-500">Job ID</p>
            <p class="font-semibold">#{{ jobId }}</p>
            <p v-if="operationsStore.currentItem" class="text-sm text-surface-500">
              Current status: <strong>{{ operationsStore.currentItem.status }}</strong>
            </p>
          </div>

          <Message v-if="operationsStore.currentItem && !canRetry" severity="warn">
            Retry is only allowed for failed or dead_letter jobs.
          </Message>

          <div class="space-y-2">
            <label class="text-sm font-medium">Reason <span class="text-red-500">*</span></label>
            <Textarea
              v-model="reason"
              data-testid="retry-reason"
              rows="5"
              fluid
              placeholder="Describe why this job should be retried"
            />
          </div>

          <div class="flex items-center gap-2">
            <Checkbox v-model="force" binary input-id="force-retry" />
            <label for="force-retry" class="text-sm">Force retry (override safety checks if backend permits)</label>
          </div>

          <div class="flex justify-end gap-2">
            <Button label="Cancel" severity="secondary" outlined @click="cancel" />
            <Button
              label="Save"
              icon="pi pi-save"
              data-testid="retry-submit"
              :disabled="!reason.trim() || !canRetry"
              @click="submit"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
