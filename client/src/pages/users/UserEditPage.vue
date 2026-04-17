<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useUsersStore } from '@/stores/users.store';
import UserForm from './components/UserForm.vue';
import AuditLogViewer from './components/AuditLogViewer.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const usersStore = useUsersStore();

// メールエラー / Email conflict error
const emailError = shallowRef<string | null>(null);
// 送信中フラグ / Submitting loading flag
const submitting = shallowRef(false);

// ユーザーID取得 / Get user ID from route params
const userId = Number(route.params.id);

// 初期データ読み込み / Load user and activity on mount
onMounted(async () => {
  await usersStore.fetchUser(userId);
  await usersStore.fetchUserActivity(userId);
});

// クリーンアップ / Clear current user on unmount
onUnmounted(() => {
  usersStore.clearCurrentUser();
});

// フォーム送信ハンドラ / Handle form submission
async function handleSubmit(formData: { name: string; email: string; role: string; status: string }): Promise<void> {
  emailError.value = null;
  submitting.value = true;
  try {
    await usersStore.updateUser(userId, formData);
    toast.add({ severity: 'success', summary: 'Success', detail: 'User updated successfully', life: 3000 });
    router.push({ name: 'UserList' });
  } catch (error: any) {
    if (error.response?.status === 409) {
      emailError.value = 'This email is already in use';
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update user', life: 3000 });
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
    <h2 data-testid="users-edit-heading" class="text-2xl font-semibold text-surface-800 dark:text-surface-100 mb-6">Edit User</h2>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左: フォーム / Left: User form -->
      <div class="lg:col-span-2">
        <UserForm
          mode="edit"
          :initial-data="usersStore.currentUser"
          :email-error="emailError"
          :loading="submitting"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </div>

      <!-- 右: 監査ログ / Right: Audit log sidebar -->
      <div>
        <AuditLogViewer
          :logs="usersStore.auditLogs"
          :loading="usersStore.loadingActivity"
        />
      </div>
    </div>
  </div>
</template>
