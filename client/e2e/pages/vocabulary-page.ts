import { type Page, type Locator, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// VocabularyListPage
// ---------------------------------------------------------------------------
export class VocabularyListPage {
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly levelSelect: Locator;
  readonly statusSelect: Locator;
  readonly clearButton: Locator;
  readonly tableRows: Locator;
  readonly emptyState: Locator;
  readonly emptyFilterState: Locator;

  constructor(private readonly pw: Page) {
    this.createButton = pw.getByTestId('vocab-create-btn');
    this.searchInput = pw.getByTestId('vocab-filter-search');
    this.levelSelect = pw.getByTestId('vocab-filter-level');
    this.statusSelect = pw.getByTestId('vocab-filter-status');
    this.clearButton = pw.getByTestId('vocab-filter-clear');
    this.tableRows = pw.locator('tbody tr');
    this.emptyState = pw.getByTestId('vocab-empty');
    this.emptyFilterState = pw.getByTestId('vocab-empty-filter');
  }

  async goto(): Promise<void> {
    // Set up waitForResponse BEFORE navigating to capture the initial onMounted fetch
    const initialLoad = this.pw.waitForResponse(
      (resp) => resp.url().includes('/api/vocabularies') && resp.status() === 200,
      { timeout: 15000 },
    );
    await this.pw.goto('/vocabularies');
    await this.pw.waitForURL('/vocabularies');
    await initialLoad;
  }

  async waitForTableLoad(): Promise<void> {
    await this.pw.waitForFunction(() => document.querySelectorAll('.p-skeleton').length === 0, {
      timeout: 15000,
    });
  }

  async searchFor(query: string): Promise<void> {
    // Wait specifically for a response that includes the search param in the URL,
    // so we don't accidentally capture the initial/unfiltered load response
    const responsePromise = this.pw.waitForResponse(
      async (resp) => {
        if (
          !resp.url().includes('/api/vocabularies') ||
          !resp.url().includes('search=') ||
          resp.status() !== 200
        ) {
          return false;
        }
        // Verify the response body actually reflects the filtered data
        try {
          const body = await resp.json();
          return Array.isArray(body?.data);
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );
    await this.searchInput.fill(query);
    await responsePromise;
    // Wait for Vue to re-render with the filtered results (skeletons gone + DOM stable)
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
    await row.locator('[data-testid="vocab-edit-btn"]').click();
  }

  async clickDeleteForRow(rowIndex: number): Promise<void> {
    const row = this.tableRows.nth(rowIndex);
    await row.locator('[data-testid="vocab-delete-btn"]').click();
  }

  async expectTableHasRows(): Promise<void> {
    await expect(this.tableRows.first()).toBeVisible({ timeout: 15000 });
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible({ timeout: 10000 });
  }

  async expectEmptyFilterState(): Promise<void> {
    await expect(this.emptyFilterState).toBeVisible({ timeout: 10000 });
  }
}

// ---------------------------------------------------------------------------
// VocabularyFormPage (Create & Edit)
// ---------------------------------------------------------------------------
export class VocabularyFormPage {
  readonly meaningViInput: Locator;
  readonly hiraganaInput: Locator;
  readonly levelSelect: Locator;
  readonly statusSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly meaningViError: Locator;
  readonly levelError: Locator;
  readonly statusError: Locator;

  constructor(private readonly pw: Page) {
    this.meaningViInput = pw.getByTestId('field-meaning-vi');
    this.hiraganaInput = pw.getByTestId('field-hiragana');
    this.levelSelect = pw.getByTestId('field-level');
    this.statusSelect = pw.getByTestId('field-status');
    this.saveButton = pw.getByTestId('vocab-submit-btn');
    this.cancelButton = pw.getByTestId('vocab-cancel-btn');
    this.meaningViError = pw.getByTestId('error-meaning-vi');
    this.levelError = pw.getByTestId('error-level');
    this.statusError = pw.getByTestId('error-status');
  }

  async gotoCreate(): Promise<void> {
    await this.pw.goto('/vocabularies/create');
    await this.pw.waitForURL('/vocabularies/create');
    await expect(this.saveButton).toBeVisible({ timeout: 30000 });
  }

  async gotoEdit(id: number): Promise<void> {
    await this.pw.goto(`/vocabularies/${id}/edit`);
    await this.pw.waitForURL(`/vocabularies/${id}/edit`);
    await expect(this.saveButton).toBeVisible({ timeout: 30000 });
    // Wait for form to be pre-filled (API response)
    await this.pw.waitForResponse(
      (resp) => resp.url().includes(`/api/vocabularies/${id}`) && resp.status() === 200,
      { timeout: 15000 },
    ).catch(() => {});
    await expect(this.meaningViInput).not.toHaveValue('', { timeout: 10000 });
  }

  async fillMeaningVi(value: string): Promise<void> {
    await this.meaningViInput.fill(value);
  }

  async selectLevel(level: string): Promise<void> {
    await this.levelSelect.selectOption(level);
  }

  async selectStatus(status: string): Promise<void> {
    await this.statusSelect.selectOption(status);
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
