import { type Page, type Locator, expect } from '@playwright/test';

export class UserListPage {
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly table: Locator;
  readonly tableRows: Locator;
  readonly emptyState: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByTestId('users-list-heading');
    this.createButton = page.getByRole('button', { name: 'Create User' });
    this.searchInput = page.getByPlaceholder('Search by name or email...');
    this.table = page.locator('table');
    this.tableRows = page.locator('tbody tr');
    this.emptyState = page.getByText('No users found.');
  }

  async goto(): Promise<void> {
    await this.page.goto('/users');
    await this.heading.waitFor({ state: 'visible', timeout: 30000 });
  }

  async waitForTableLoad(): Promise<void> {
    // Wait for skeletons to disappear (real rows appear)
    await this.page.waitForFunction(() => {
      const skeletons = document.querySelectorAll('.p-skeleton');
      return skeletons.length === 0;
    });
  }

  async clickCreateUser(): Promise<void> {
    await this.createButton.click();
  }

  async searchFor(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Wait for debounced API call to complete
    await this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/admin/users') && resp.status() === 200,
    );
    await this.waitForTableLoad();
  }

  async clickEditForRow(rowIndex: number): Promise<void> {
    const row = this.tableRows.nth(rowIndex);
    await row.getByRole('button').filter({ has: this.page.locator('.pi-pencil') }).click();
  }

  async clickDeleteForRow(rowIndex: number): Promise<void> {
    const row = this.tableRows.nth(rowIndex);
    await row.getByRole('button').filter({ has: this.page.locator('.pi-trash') }).click();
  }

  async expectRowCount(count: number): Promise<void> {
    await expect(this.tableRows).toHaveCount(count);
  }

  async expectUserInTable(name: string): Promise<void> {
    await expect(this.table.getByText(name)).toBeVisible();
  }

  async expectUserNotInTable(name: string): Promise<void> {
    await expect(this.table.getByText(name)).not.toBeVisible();
  }
}
