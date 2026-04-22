/**
 * Profile API service — HTTP calls to /auth/me endpoints
 * プロフィールAPIサービス — /auth/meエンドポイントへのHTTPコール
 */
import apiClient from './api.service';
import type { UpdateProfileDto, ChangePasswordDto } from '@/types/profile.types';
import type { AuthUser } from '@/types/auth.types';

export const profileService = {
  /**
   * Update the authenticated user's own profile.
   * 認証済みユーザー自身のプロフィールを更新する。
   */
  async updateProfile(data: UpdateProfileDto): Promise<AuthUser> {
    const { data: res } = await apiClient.put<AuthUser>('/auth/me', data);
    return res;
  },

  /**
   * Change the authenticated user's own password.
   * 認証済みユーザー自身のパスワードを変更する。
   */
  async changePassword(data: ChangePasswordDto): Promise<void> {
    await apiClient.put('/auth/me/password', data);
  },
};
