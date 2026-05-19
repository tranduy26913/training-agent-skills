<script setup lang="ts">
/**
 * ProfilePage component
 * プロフィールページコンポーネント
 * Allows all authenticated users (admin/moderator/user) to view and edit their profile.
 */
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import { useAuthStore } from '@/stores/auth.store';
import { useProfile } from '@/composables/useProfile';
import ProfileForm from './components/ProfileForm.vue';
import ChangePasswordModal from './components/ChangePasswordModal.vue';
import type { UpdateProfileDto } from '@/types/profile.types';

const { t } = useI18n();
const toast = useToast();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const { updateProfile, loading } = useProfile();

// パスワード変更モーダル表示フラグ / Change password modal visibility
const showPasswordModal = ref(false);

// プロフィール更新ハンドラ / Profile update handler
async function handleSubmit(data: UpdateProfileDto): Promise<void> {
  try {
    const updatedUser = await updateProfile(data);
    authStore.updateUser(updatedUser);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('profile.savedSuccess'),
      life: 3000,
    });
  } catch {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('common.error'),
      life: 3000,
    });
  }
}

// パスワード変更成功ハンドラ / Password changed success handler
function handlePasswordChanged(): void {
  toast.add({
    severity: 'success',
    summary: t('common.success'),
    detail: t('profile.passwordChanged'),
    life: 3000,
  });
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- ページヘッダー / Page header -->
    <div class="flex items-center justify-between mb-6">
      <h2
        class="text-2xl font-semibold text-surface-800 dark:text-surface-100"
        data-testid="profile-heading"
      >
        {{ t('profile.editProfile') }}
      </h2>
      <Button
        :label="t('profile.changePassword')"
        severity="secondary"
        icon="pi pi-lock"
        data-testid="change-password-btn"
        @click="showPasswordModal = true"
      />
    </div>

    <!-- プロフィールフォーム / Profile form -->
    <ProfileForm
      v-if="user"
      :user="user"
      :loading="loading"
      @submit="handleSubmit"
    />

    <!-- パスワード変更モーダル / Change password modal -->
    <ChangePasswordModal
      v-model:visible="showPasswordModal"
      @changed="handlePasswordChanged"
    />
  </div>
</template>
