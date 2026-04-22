import { type Page, type Locator } from '@playwright/test';

// プロフィールページのPage Object Model / Profile page Page Object Model
export class ProfilePage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly roleBadge: Locator;
  readonly noteInput: Locator;
  readonly saveButton: Locator;
  readonly changePasswordButton: Locator;
  readonly avatarPreview: Locator;
  readonly avatarInput: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByTestId('profile-heading');
    this.nameInput = page.getByTestId('profile-name');
    this.emailInput = page.getByTestId('profile-email');
    this.roleBadge = page.getByTestId('profile-role');
    this.noteInput = page.getByTestId('profile-note');
    this.saveButton = page.getByTestId('profile-save-btn');
    this.changePasswordButton = page.getByTestId('change-password-btn');
    this.avatarPreview = page.getByTestId('avatar-preview');
    this.avatarInput = page.getByTestId('avatar-input');
  }

  async goto(): Promise<void> {
    await this.page.goto('/profile');
    await this.heading.waitFor({ state: 'visible', timeout: 30000 });
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async fillNote(note: string): Promise<void> {
    await this.noteInput.fill(note);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async clickChangePassword(): Promise<void> {
    await this.changePasswordButton.click();
  }

  // パスワード変更モーダルのロケーター / Change password modal locators
  get passwordModal() {
    const dialog = this.page.locator('.p-dialog');
    return {
      currentPassword: dialog.getByPlaceholder('Current Password').first(),
      newPassword: dialog.getByPlaceholder('New Password').first(),
      confirmPassword: dialog.getByPlaceholder('Confirm New Password').first(),
      submit: dialog.getByRole('button', { name: 'Change Password' }),
    };
  }
}
