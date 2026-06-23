// Profile API service  EHTTP calls to /auth/me endpoints.
import apiClient from './api.service';
import type { UpdateProfileDto, ChangePasswordDto } from '@apptypes/profile.types';
import type { AuthUser } from '@apptypes/auth.types';

export const profileService = {
  // Update the authenticated user's own profile.
  async updateProfile(data: UpdateProfileDto): Promise<AuthUser> {
    const { data: res } = await apiClient.put<AuthUser>('/auth/me', data);
    return res;
  },

  // Change the authenticated user's own password.
  async changePassword(data: ChangePasswordDto): Promise<void> {
    await apiClient.put('/auth/me/password', data);
  },
};