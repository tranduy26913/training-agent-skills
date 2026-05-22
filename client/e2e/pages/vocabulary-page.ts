import { type Page, type Locator, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// VocabularyListPage
// ---------------------------------------------------------------------------
export class VocabularyListPage {
  readonly page: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly levelSelect: Locator;
  readonly statusSelect: Locator;
  readonly clearButton: Locator;
  readonly tableRows: Locator;

  constructor(private readonly pw: Page) {
    this.page = pw.getByTestId('vocab-list-page');
    this.createButton = pw.getByTestId('vocab-create-btn');
    this.searchInput = pw.getByTestId('vocab-search-input');
    this.levelSelect = pw.getByTestId('vocab-level-select');
    this.statusSelect = pw.getByTestId('vocab-status-select');
    this.clearButton = pw.getByTestId('vocab-clear-btn');
    this.tableRows = pw.locator('tbody tr');
  }

  async goto(): Promise<void> {
    await this.pw.goto('/vocabularies');
    await this.page.waitFor({ state: 'visible', timeout: 30000 });
  }

  async waitForTableLoad(): Promise<void> {
    await this.pw.waitForFunction(() => document.querySelectorAll('.p-skeleton').length === 0, {
      timeout: 15000,
    });
  }

  async searchFor(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.pw.waitForResponse(
      (resp) => resp.url().includes('/api/vocabularies') && resp.status() === 200,
      { timeout: 10000 },
    );
    await this.waitForTableLoad();
  }

  async filterByLevel(level: string): Promise<void> {
    await this.levelSelect.click();
    await Promise.all([
      this.pw.waitForResponse(
        (resp) => resp.url().includes('/api/vocabularies') && resp.status() === 200,
        { timeout: 10000 },
      ),
      this.pw.getByRole('option', { name: level, exact: true }).click(),
    ]);
    await this.waitForTableLoad();
  }

  async clearFilters(): Promise<void> {
    await this.clearButton.click();
    await this.pw.waitForResponse(
      (resp) => resp.url().includes('/api/vocabularies') && resp.status() === 200,
      { timeout: 10000 },
    );
    await this.waitForTableLoad();
  }

  async clickEditForRow(rowIndex: number): Promise<void> {
    const row = this.tableRows.nth(rowIndex);
    await row.locator('[data-testid^="vocab-edit-btn-"]').click();
  }

  async clickDeleteForRow(rowIndex: number): Promise<void> {
    const row = this.tableRows.nth(rowIndex);
    await row.locator('[data-testid^="vocab-delete-btn-"]').click();
  }

  async expectTableHasRows(): Promise<void> {
    await expect(this.tableRows.first()).toBeVisible({ timeout: 15000 });
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.pw.getByText('No records found.')).toBeVisible({
      timeout: 10000,
    });
  }
}

// ---------------------------------------------------------------------------
// VocabularyFormPage (Create & Edit)
// ---------------------------------------------------------------------------
export class VocabularyFormPage {
  readonly createPage: Locator;
  readonly editPage: Locator;
  readonly meaningViInput: Locator;
  readonly hiraganaInput: Locator;
  readonly levelSelect: Locator;
  readonly statusSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly meaningViError: Locator;
  readonly hiraganaError: Locator;
  readonly levelError: Locator;

  constructor(private readonly pw: Page) {
    this.createPage = pw.getByTestId('vocab-create-page');
    this.editPage = pw.getByTestId('vocab-edit-page');
    this.meaningViInput = pw.getByTestId('vocab-meaning-vi-input');
    this.hiraganaInput = pw.getByTestId('vocab-hiragana-input');
    this.levelSelect = pw.getByTestId('vocab-level-select-form');
    this.statusSelect = pw.getByTestId('vocab-status-select-form');
    this.saveButton = pw.getByTestId('vocab-save-btn');
    this.cancelButton = pw.getByTestId('vocab-cancel-btn');
    this.meaningViError = pw.getByTestId('vocab-meaning-vi-error');
    this.hiraganaError = pw.getByTestId('vocab-hiragana-error');
    this.levelError = pw.getByTestId('vocab-level-error');
  }

  async gotoCreate(): Promise<void> {
    await this.pw.goto('/vocabularies/create');
    await this.createPage.waitFor({ state: 'visible', timeout: 30000 });
  }

  async gotoEdit(id: number): Promise<void> {
    await this.pw.goto(`/vocabularies/${id}/edit`);
    await this.editPage.waitFor({ state: 'visible', timeout: 30000 });
  }

  async fillRequired(data: { meaningVi: string; hiragana: string; level: string }): Promise<void> {
    await this.meaningViInput.fill(data.meaningVi);
    await this.hiraganaInput.fill(data.hiragana);
    await this.levelSelect.click();
    await this.pw.getByRole('option', { name: data.level, exact: true }).click();
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async clickTab(tabName: string): Promise<void> {
    await this.pw.getByRole('tab', { name: tabName }).click();
  }
}
