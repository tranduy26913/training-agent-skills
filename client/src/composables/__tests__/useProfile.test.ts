/**
 * useProfile composable unit tests
 * useProfileコンポーザブルのユニットテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProfile } from '@/composables/useProfile';

// プロフィールサービスのモック / Mock profile service
vi.mock('@/services/profile.service', () => ({
  profileService: {
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

import { profileService } from '@/services/profile.service';

const mockUpdateProfile = vi.mocked(profileService.updateProfile);
const mockChangePassword = vi.mocked(profileService.changePassword);

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'user' as const,
  status: 'active',
  avatar: null,
  birthday: undefined,
  note: undefined,
};

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== updateProfile =====
  describe('updateProfile', () => {
    it('returns updated user on success', async () => {
      // 成功時に更新されたユーザーを返す
      const updatedUser = { ...mockUser, name: 'New Name' };
      mockUpdateProfile.mockResolvedValueOnce(updatedUser);

      const { updateProfile } = useProfile();
      const result = await updateProfile({ name: 'New Name' });

      expect(result).toEqual(updatedUser);
      expect(mockUpdateProfile).toHaveBeenCalledWith({ name: 'New Name' });
    });

    it('sets loading true during call, false after success', async () => {
      // 呼び出し中はloadingがtrue、完了後はfalse
      let loadingDuringCall = false;
      mockUpdateProfile.mockImplementation(async () => {
        loadingDuringCall = loading.value;
        return mockUser;
      });

      const { updateProfile, loading } = useProfile();
      expect(loading.value).toBe(false);

      await updateProfile({ name: 'Test' });

      expect(loadingDuringCall).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('sets loading false after error', async () => {
      // エラー後もloadingがfalseになる
      mockUpdateProfile.mockRejectedValueOnce(new Error('Network error'));

      const { updateProfile, loading } = useProfile();

      await expect(updateProfile({ name: 'Test' })).rejects.toThrow('Network error');
      expect(loading.value).toBe(false);
    });

    it('sets error and rethrows on failure', async () => {
      // エラーをセットし、再スローする
      const error = new Error('Server error');
      mockUpdateProfile.mockRejectedValueOnce(error);

      const { updateProfile, error: errorRef } = useProfile();

      await expect(updateProfile({ name: 'Test' })).rejects.toThrow('Server error');
      expect(errorRef.value).toBe('Server error');
    });
  });

  // ===== changePassword =====
  describe('changePassword', () => {
    it('resolves without value on success', async () => {
      // 成功時にundefinedで解決する
      mockChangePassword.mockResolvedValueOnce(undefined);

      const { changePassword } = useProfile();

      await expect(
        changePassword({
          currentPassword: 'old',
          newPassword: 'newpass123',
          confirmPassword: 'newpass123',
        }),
      ).resolves.toBeUndefined();
    });

    it('sets loading true during call, false after success', async () => {
      // 呼び出し中はloadingがtrue、完了後はfalse
      let loadingDuringCall = false;
      mockChangePassword.mockImplementation(async () => {
        loadingDuringCall = loading.value;
      });

      const { changePassword, loading } = useProfile();

      await changePassword({ currentPassword: 'old', newPassword: 'new123456', confirmPassword: 'new123456' });

      expect(loadingDuringCall).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('rethrows error with 401 status for wrong current password', async () => {
      // 現在のパスワードが間違っている場合、401エラーを再スローする
      const authError = Object.assign(new Error('Unauthorized'), {
        response: { status: 401 },
      });
      mockChangePassword.mockRejectedValueOnce(authError);

      const { changePassword } = useProfile();

      await expect(
        changePassword({ currentPassword: 'wrong', newPassword: 'new123456', confirmPassword: 'new123456' }),
      ).rejects.toMatchObject({ response: { status: 401 } });
    });
  });
});
