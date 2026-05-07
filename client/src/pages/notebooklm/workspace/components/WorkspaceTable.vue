<script setup lang="ts">
import type { Workspace } from '@/types/notebooklm.types';

defineProps<{
  workspaces: Workspace[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  open: [id: number];
  edit: [id: number];
  delete: [id: number];
}>();

function canMutate(row: Workspace): boolean {
  return row.role === 'owner' || row.role === 'editor';
}
</script>

<template>
  <div class="overflow-x-auto rounded border border-surface-200">
    <table class="w-full text-left text-sm">
      <thead class="bg-surface-50">
        <tr>
          <th class="px-3 py-2">Workspace</th>
          <th class="px-3 py-2">Role</th>
          <th class="px-3 py-2">Documents</th>
          <th class="px-3 py-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="4" class="px-3 py-4 text-surface-500">Loading workspaces...</td>
        </tr>
        <tr v-else-if="workspaces.length === 0">
          <td colspan="4" class="px-3 py-4 text-surface-500">No workspaces found</td>
        </tr>
        <tr
          v-for="row in workspaces"
          :key="row.id"
          class="border-t border-surface-200"
        >
          <td class="px-3 py-2">
            <p class="font-medium">{{ row.name }}</p>
            <p class="text-xs text-surface-500">{{ row.description || 'No description' }}</p>
          </td>
          <td class="px-3 py-2 uppercase">{{ row.role }}</td>
          <td class="px-3 py-2">{{ row.documentCount }}</td>
          <td class="px-3 py-2 text-right">
            <div class="flex justify-end gap-2">
              <button
                type="button"
                :data-testid="`workspace-open-${row.id}`"
                class="rounded border border-surface-300 px-2 py-1"
                @click="emit('open', row.id)"
              >
                Open
              </button>
              <button
                v-if="canMutate(row)"
                data-testid="workspace-edit"
                type="button"
                class="rounded border border-surface-300 px-2 py-1"
                @click="emit('edit', row.id)"
              >
                Edit
              </button>
              <button
                v-if="row.role === 'owner'"
                data-testid="workspace-delete"
                type="button"
                class="rounded border border-red-400 px-2 py-1 text-red-600"
                @click="emit('delete', row.id)"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
