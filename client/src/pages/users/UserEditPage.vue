<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useUsersStore } from '@stores/users.store';
import UserForm from './components/UserForm.vue';
import AuditLogViewer from './components/AuditLogViewer.vue';
import type { UserRole, UserStatus } from '@apptypes/api.types';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const usersStore = useUsersStore();

// Submitting loading flag.
const submitting = shallowRef(false);

// Get user ID from route params.
const userId = Number(route.params.id);

// Load user and activity on mount.
onMounted(async () => {
  await usersStore.fetchUser(userId);
  await usersStore.fetchUserActivity(userId);
});

// Clear current user on unmount.
onUnmounted(() => {
  usersStore.clearCurrentUser();
});

// Extract HTTP status from an unknown error, or null.
function getErrorStatus(err: unknown): number | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { status?: number } }).response;
    return response?.status ?? null;
  }
  return null;
}

// Handle form submission.
async function handleSubmit(formData: { name: string; email: string; role: string; status: string; note: string; birthday: string }): Promise<void> {
  submitting.value = true;
  try {
    await usersStore.updateUser(userId, {
      name: formData.name,
      email: formData.email,
      role: formData.role as UserRole,
      status: formData.status as UserStatus,
      note: formData.note || undefined,
      birthday: formData.birthday || undefined,
    });
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('users.updatedSuccess'), life: 3000 });
    router.push({ name: 'UserList' });
  } catch (err: unknown) {
    const detail = getErrorStatus(err) === 409
      ? t('users.emailInUse')
      : t('users.updatedError');
    toast.add({ severity: 'error', summary: t('common.error'), detail, life: 3000 });
  } finally {
    submitting.value = false;
  }
}

// Navigate back to the user list.
function handleCancel(): void {
  router.push({ name: 'UserList' });
}
</script>

<template>
  <div>
    <h2 data-testid="users-edit-heading" class="text-2xl font-semibold text-surface-800 dark:text-surface-100 mb-6">{{ t('users.editUser') }}</h2>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: User form -->
      <div class="lg:col-span-2">
        <UserForm
          mode="edit"
          :initial-data="usersStore.currentUser"
          :loading="submitting"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </div>

      <!-- Right: Audit log sidebar -->
      <div>
        <AuditLogViewer
          :logs="usersStore.auditLogs"
          :loading="usersStore.loadingActivity"
        />
      </div>
    </div>
  </div>
</template>