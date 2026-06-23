// useProfile composable  Eprofile update and password change logic.
import { ref } from 'vue';
import { profileService } from '@services/profile.service';
import type { UpdateProfileDto, ChangePasswordDto } from '@apptypes/profile.types';
import type { AuthUser } from '@apptypes/auth.types';

export function useProfile() {
  // Loading state.
  const loading = ref(false);
  // Error message.
  const error = ref<string | null>(null);

  // Update the user profile.
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

  // Change the user password.
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