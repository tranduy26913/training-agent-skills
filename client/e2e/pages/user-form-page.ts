import { type Page, type Locator, expect } from '@playwright/test';

export class UserFormPage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(
    private readonly page: Page,
    private readonly mode: 'create' | 'edit' = 'create',
  ) {
    this.heading = mode === 'create'
      ? page.getByTestId('users-create-heading')
      : page.getByTestId('users-edit-heading');
    this.nameInput = page.getByPlaceholder('Enter name');
    this.emailInput = page.getByPlaceholder('Enter email');
    this.submitButton = page.getByRole('button', {
      name: mode === 'create' ? 'Create User' : 'Update User',
    });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
  }

  async gotoCreate(): Promise<void> {
    await this.page.goto('/users/create');
    await this.heading.waitFor({ state: 'visible', timeout: 30000 });
  }

  async gotoEdit(id: number): Promise<void> {
    await this.page.goto(`/users/${id}/edit`);
    await this.heading.waitFor({ state: 'visible' });
  }

  async fillName(value: string): Promise<void> {
    await this.nameInput.fill(value);
  }

  async fillEmail(value: string): Promise<void> {
    await this.emailInput.fill(value);
  }

  async selectRole(label: string): Promise<void> {
    // PrimeVue Select: click trigger then click option in overlay
    const roleLabel = this.page.locator('label', { hasText: 'Role' });
    const roleSelect = roleLabel.locator('+ *').or(
      this.page.locator('.flex-col').filter({ has: this.page.locator('label', { hasText: 'Role' }) }).locator('[role="combobox"]')
    );
    await this.page.locator('[role="combobox"]').filter({ hasText: /Admin|User|Moderator/ }).first().click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async expectFieldError(text: string): Promise<void> {
    await expect(this.page.locator('small.text-red-500').filter({ hasText: text })).toBeVisible();
  }

  async expectEmailError(text: string): Promise<void> {
    await expect(this.page.locator('small.text-red-500').filter({ hasText: text })).toBeVisible();
  }

  async waitForFormReady(): Promise<void> {
    await this.heading.waitFor({ state: 'visible' });
    await this.nameInput.waitFor({ state: 'visible' });
  }
}
