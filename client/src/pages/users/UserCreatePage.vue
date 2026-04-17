<script setup lang="ts">
import { shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useUsersStore } from '@/stores/users.store';
import UserForm from './components/UserForm.vue';

const router = useRouter();
const toast = useToast();
const usersStore = useUsersStore();

// メールエラー / Email conflict error
const emailError = shallowRef<string | null>(null);
// 送信中フラグ / Submitting loading flag
const submitting = shallowRef(false);

// フォーム送信ハンドラ / Handle form submission
async function handleSubmit(formData: { name: string; email: string; role: string; status: string }): Promise<void> {
  emailError.value = null;
  submitting.value = true;
  try {
    await usersStore.createUser(formData);
    toast.add({ severity: 'success', summary: 'Success', detail: 'User created successfully', life: 3000 });
    router.push({ name: 'UserList' });
  } catch (error: any) {
    if (error.response?.status === 409) {
      emailError.value = 'This email is already in use';
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create user', life: 3000 });
    }
  } finally {
    submitting.value = false;
  }
}

// キャンセルハンドラ / Navigate back to user list
function handleCancel(): void {
  router.push({ name: 'UserList' });
}
</script>

<template>
  <div>
    <h2 data-testid="users-create-heading" class="text-2xl font-semibold text-surface-800 dark:text-surface-100 mb-6">Create User</h2>
    <UserForm
      mode="create"
      :email-error="emailError"
      :loading="submitting"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
