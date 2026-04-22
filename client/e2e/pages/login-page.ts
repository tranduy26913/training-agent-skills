import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByPlaceholder('Enter your email');
    this.passwordInput = page.getByPlaceholder('Enter your password');
    this.submitButton = page.getByRole('button', { name: 'Sign In' });
    this.errorMessage = page.locator('form .text-red-500, form [class*="text-red"]').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(text: string): Promise<void> {
    // Wait for the error message div inside the form (v-if="errorMessage" div)
    await expect(this.page.locator('form').getByText(text, { exact: false })).toBeVisible({ timeout: 8000 });
  }
}
