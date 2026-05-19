/**
 * Profile feature type definitions
 * プロフィール機能の型定義
 */

/** Update profile request payload / プロフィール更新リクエスト */
export interface UpdateProfileDto {
  name: string;
  birthday?: string;
  note?: string;
  avatar?: string;
}

/** Change password request payload / パスワード変更リクエスト */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
