import { test, expect } from './fixtures';

// プロフィールE2Eテスト / Profile E2E tests
// Note: These tests run with admin auth (from auth.setup.ts storage state)

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

test.describe('Profile Page', () => {
  // プロフィールページが表示されること / Profile page renders
  test('displays the profile page heading', async ({ profilePage }) => {
    await profilePage.goto();
    await expect(profilePage.heading).toBeVisible();
  });

  // メールが読み取り専用であること / Email is read-only
  test('email field is read-only', async ({ profilePage }) => {
    await profilePage.goto();
    await expect(profilePage.emailInput).toBeDisabled();
  });

  // ロールバッジが表示されること / Role badge is visible
  test('role badge is visible', async ({ profilePage }) => {
    await profilePage.goto();
    await expect(profilePage.roleBadge).toBeVisible();
  });

  // 保存ボタンが表示されること / Save button is visible
  test('save button is visible', async ({ profilePage }) => {
    await profilePage.goto();
    await expect(profilePage.saveButton).toBeVisible();
  });

  // パスワード変更ボタンが表示されること / Change password button is visible
  test('change password button is visible', async ({ profilePage }) => {
    await profilePage.goto();
    await expect(profilePage.changePasswordButton).toBeVisible();
  });

  // アバタードロップダウンからプロフィールページに移動できること / Navigate to profile via avatar dropdown
  test('navigates to profile from avatar dropdown', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('/dashboard');

    // Click avatar dropdown trigger (button containing avatar or user initials)
    const avatarBtn = page.locator('button').filter({ has: page.locator('.rounded-full') }).first();
    await avatarBtn.click();

    // Click "My Profile" menu item
    const myProfileItem = page.getByText('My Profile');
    await myProfileItem.waitFor({ state: 'visible', timeout: 5000 });
    await myProfileItem.click();

    await expect(page).toHaveURL('/profile');
  });

  // プロフィールが正常に更新されること / Profile updates successfully
  test('updates profile name successfully', async ({ profilePage, page }) => {
    await profilePage.goto();

    const newName = `Test Admin ${Date.now()}`;
    await profilePage.nameInput.fill(newName);
    await profilePage.save();

    // Success toast should appear
    await expect(page.getByText('Profile updated successfully')).toBeVisible({ timeout: 5000 });
  });

  // 名前が短すぎる場合にバリデーションエラーが表示されること / Validation error when name too short
  test('shows validation error when name is too short', async ({ profilePage, page }) => {
    await profilePage.goto();

    await profilePage.nameInput.fill('A');
    await profilePage.save();

    await expect(page.getByText('Name must be at least 2 characters')).toBeVisible({ timeout: 5000 });
  });

  // メモが更新できること / Note can be updated
  test('updates note field successfully', async ({ profilePage, page }) => {
    await profilePage.goto();

    await profilePage.noteInput.fill('Updated note text');
    await profilePage.save();

    await expect(page.getByText('Profile updated successfully')).toBeVisible({ timeout: 5000 });
  });

  // パスワード変更モーダルが開けること / Change password modal opens
  test('opens change password modal', async ({ profilePage, page }) => {
    await profilePage.goto();
    await profilePage.clickChangePassword();

    await expect(page.getByText('Change Password').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Current Password')).toBeVisible({ timeout: 5000 });
  });

  // 現在のパスワードが間違っている場合にエラーが表示されること / Error shown for wrong current password
  test('shows error for wrong current password', async ({ profilePage, page }) => {
    await profilePage.goto();
    await profilePage.clickChangePassword();

    const modal = profilePage.passwordModal;
    await modal.currentPassword.fill('wrongpassword123');
    await modal.newPassword.fill('newpassword123');
    await modal.confirmPassword.fill('newpassword123');
    await modal.submit.click();

    await expect(page.getByText('Current password is incorrect')).toBeVisible({ timeout: 5000 });
  });

  // /profile は未認証ユーザーをリダイレクトすること / Unauthenticated user is redirected
  test('redirects unauthenticated user from /profile', async ({ page }) => {
    // Clear storage and visit profile directly
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto('/profile');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
