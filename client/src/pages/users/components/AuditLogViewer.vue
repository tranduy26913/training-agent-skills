<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Skeleton from 'primevue/skeleton';
import type { AuditLog } from '../composables/useUsers';

const { t } = useI18n();

// Props
const props = defineProps<{
  logs: AuditLog[];
  loading: boolean;
}>();

// Format a single audit log entry.
function formatLogEntry(log: AuditLog): string {
  const timestamp = new Date(log.timestamp).toLocaleString();
  const adminName = log.admin_name;

  if (log.action === 'CREATE') {
    return `${adminName} created this user on ${timestamp}`;
  }

  if (log.action === 'DELETE') {
    return `${adminName} deleted this user on ${timestamp}`;
  }

  // UPDATE: detail changed fields.
  if (log.changed_fields) {
    const changes = Object.entries(log.changed_fields)
      .map(([field, { old: oldVal, new: newVal }]) => `changed ${field} from '${oldVal}' to '${newVal}'`)
      .join(', ');
    return `${adminName} ${changes} on ${timestamp}`;
  }

  return `${adminName} updated this user on ${timestamp}`;
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-100">{{ t('users.activityLog') }}</h3>

    <!-- Loading skeleton -->
    <div v-if="loading" class="flex flex-col gap-3">
      <Skeleton v-for="i in 3" :key="i" height="3rem" />
    </div>

    <!-- Empty state -->
    <div v-else-if="logs.length === 0" class="text-surface-500 text-sm py-4">
      {{ t('users.noActivity') }}
    </div>

    <!-- Log entries list -->
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="log in logs"
        :key="log.id"
        class="flex items-start gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800"
      >
        <!-- Action icon -->
        <i
          :class="[
            'pi text-lg mt-0.5',
            log.action === 'CREATE' ? 'pi-plus-circle text-green-500' :
            log.action === 'UPDATE' ? 'pi-pencil text-blue-500' :
            'pi-trash text-red-500'
          ]"
        />
        <span class="text-sm text-surface-700 dark:text-surface-300">
          {{ formatLogEntry(log) }}
        </span>
      </div>
    </div>
  </div>
</template>