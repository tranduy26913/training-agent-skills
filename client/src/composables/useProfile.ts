/**
 * useProfile composable
 * プロフィール更新・パスワード変更のロジックを提供するコンポーザブル
 */
import { ref } from 'vue';
import { profileService } from '@/services/profile.service';
import type { UpdateProfileDto, ChangePasswordDto } from '@/types/profile.types';
import type { AuthUser } from '@/types/auth.types';

export function useProfile() {
  // ローディング状態 / Loading state
  const loading = ref(false);
  // エラーメッセージ / Error message
  const error = ref<string | null>(null);

  /**
   * プロフィールを更新する / Update user profile
   */
  async function updateProfile(data: UpdateProfileDto): Promise<AuthUser> {
    loading.value = true;
    error.value = null;
    try {
      const updatedUser = await profileService.updateProfile(data);
      return updatedUser;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * パスワードを変更する / Change user password
   */
  async function changePassword(data: ChangePasswordDto): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await profileService.changePassword(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    updateProfile,
    changePassword,
  };
}
