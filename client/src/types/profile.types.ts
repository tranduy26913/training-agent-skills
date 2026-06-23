// Profile feature type definitions.

// Update profile request payload.
export interface UpdateProfileDto {
  name: string;
  birthday?: string;
  note?: string;
  avatar?: string;
}

// Change password request payload.
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}