<script setup lang="ts">
import { shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useUsersStore } from '@stores/users.store';
import UserForm from './components/UserForm.vue';
import type { UserRole, UserStatus } from '@apptypes/api.types';

const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const usersStore = useUsersStore();

// Submitting loading flag.
const submitting = shallowRef(false);

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
    await usersStore.createUser({
      name: formData.name,
      email: formData.email,
      role: formData.role as UserRole,
      status: formData.status as UserStatus,
      note: formData.note || undefined,
      birthday: formData.birthday || undefined,
    });
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('users.createdSuccess'), life: 3000 });
    router.push({ name: 'UserList' });
  } catch (err: unknown) {
    const detail = getErrorStatus(err) === 409
      ? t('users.emailInUse')
      : t('users.createdError');
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
    <h2 data-testid="users-create-heading" class="text-2xl font-semibold text-surface-800 dark:text-surface-100 mb-6">{{ t('users.createUser') }}</h2>
    <UserForm
      mode="create"
      :loading="submitting"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>