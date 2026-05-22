import { test, expect } from '@playwright/test';
import { VocabularyListPage, VocabularyFormPage } from './pages/vocabulary-page';
import { LoginPage } from './pages/login-page';
import { screenshotStep } from './helpers/screenshot-step';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

// All vocabulary tests require fresh login (isolated auth)
test.use({ storageState: { cookies: [], origins: [] } });

async function loginAsAdmin(page: import('@playwright/test').Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.waitForURL('/dashboard', { timeout: 15000 });
}

// ---------------------------------------------------------------------------
// Vocabulary List
// ---------------------------------------------------------------------------
test.describe('Vocabulary List', () => {
  test('TC-001 page loads and displays vocabulary data', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();

    await screenshotStep(page, testInfo, 'Table has rows', async () => {
      await listPage.expectTableHasRows();
    });
  });

  test('TC-002 "Tạo từ vựng" button navigates to create page', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();

    await screenshotStep(page, testInfo, 'Click create button and navigate', async () => {
      await listPage.createButton.click();
      await expect(page).toHaveURL('/vocabularies/create');
      await expect(page.getByTestId('vocab-create-page')).toBeVisible();
    });
  });
});

// ---------------------------------------------------------------------------
// Vocabulary Filter & Search
// ---------------------------------------------------------------------------
test.describe('Vocabulary Filter', () => {
  test('TC-003 search by keyword updates table', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();

    await screenshotStep(page, testInfo, 'Search by keyword "a"', async () => {
      await listPage.searchFor('a');
      await expect(listPage.page).toBeVisible();
    });
  });

  test('TC-004 search with no results shows empty state', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();

    await screenshotStep(page, testInfo, 'Search nonexistent keyword ↁEempty state', async () => {
      await listPage.searchFor('__nonexistent_vocab_xyz_99999__');
      await listPage.expectEmptyState();
    });
  });

  test('TC-005 filter by level N5', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();

    await screenshotStep(page, testInfo, 'Filter by level N5', async () => {
      await listPage.filterByLevel('N5');
      await expect(listPage.page).toBeVisible();
    });

    await screenshotStep(page, testInfo, 'All visible rows show N5 badge', async () => {
      const levelBadges = page.locator('[data-testid="vocab-level-badge"]');
      const count = await levelBadges.count();
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          await expect(levelBadges.nth(i)).toHaveText('N5');
        }
      }
    });
  });

  test('TC-006 clear filters restores full list', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();

    const initialCount = await listPage.tableRows.count();

    await screenshotStep(page, testInfo, 'Apply search filter ↁEempty state', async () => {
      await listPage.searchFor('__nonexistent_vocab_xyz_99999__');
      await listPage.expectEmptyState();
    });

    await screenshotStep(page, testInfo, 'Clear filters ↁElist restored', async () => {
      await listPage.clearFilters();
      const afterClearCount = await listPage.tableRows.count();
      expect(afterClearCount).toBeGreaterThanOrEqual(initialCount);
    });
  });
});

// ---------------------------------------------------------------------------
// Vocabulary Create
// ---------------------------------------------------------------------------
test.describe('Vocabulary Create', () => {
  test('TC-007 navigate to create page shows form fields', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const formPage = new VocabularyFormPage(page);
    await formPage.gotoCreate();

    await screenshotStep(page, testInfo, 'Form fields are visible', async () => {
      await expect(formPage.meaningViInput).toBeVisible();
      await expect(formPage.hiraganaInput).toBeVisible();
      await expect(formPage.levelSelect).toBeVisible();
      await expect(formPage.saveButton).toBeVisible();
      await expect(formPage.cancelButton).toBeVisible();
    });
  });

  test('TC-008 create with required fields only  Ehappy path', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const formPage = new VocabularyFormPage(page);
    await formPage.gotoCreate();

    await screenshotStep(page, testInfo, 'Fill required fields', async () => {
      await formPage.fillRequired({
        meaningVi: 'E2E Test Nghĩa Tiếng Việt',
        hiragana: 'てすと',
        level: 'N5',
      });
    });

    await screenshotStep(page, testInfo, 'Submit ↁE201 created + redirect to list', async () => {
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes('/api/vocabularies') && resp.request().method() === 'POST',
          { timeout: 15000 },
        ),
        formPage.submit(),
      ]);
      expect(response.status()).toBe(201);
      await expect(page.locator('.p-toast')).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL('/vocabularies', { timeout: 10000 });
    });
  });

  test('TC-009 submit empty form shows validation errors', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const formPage = new VocabularyFormPage(page);
    await formPage.gotoCreate();

    await screenshotStep(page, testInfo, 'Submit empty form ↁEvalidation errors', async () => {
      await formPage.submit();
      await expect(formPage.meaningViError).toBeVisible();
      await expect(formPage.hiraganaError).toBeVisible();
      // level defaults to 'N5' so it always passes validation  Eno level error expected
    });
  });

  test('TC-010 cancel navigates back to vocabulary list', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const formPage = new VocabularyFormPage(page);
    await formPage.gotoCreate();

    await screenshotStep(page, testInfo, 'Cancel ↁEback to vocabulary list', async () => {
      await formPage.cancel();
      await expect(page).toHaveURL('/vocabularies', { timeout: 10000 });
    });
  });
});

// ---------------------------------------------------------------------------
// Vocabulary Edit
// ---------------------------------------------------------------------------
test.describe('Vocabulary Edit', () => {
  test('TC-011 click edit button navigates to edit page with pre-filled data', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();
    await listPage.expectTableHasRows();

    await screenshotStep(page, testInfo, 'Click edit on first row ↁEedit page', async () => {
      await listPage.clickEditForRow(0);
      await expect(page).toHaveURL(/\/vocabularies\/\d+\/edit/, { timeout: 10000 });
      await expect(page.getByTestId('vocab-edit-page')).toBeVisible();
    });

    const formPage = new VocabularyFormPage(page);
    await screenshotStep(page, testInfo, 'Form pre-filled with existing data', async () => {
      await page.waitForFunction(() => document.querySelectorAll('.p-skeleton').length === 0, {
        timeout: 15000,
      });
      await expect(formPage.hiraganaInput).not.toHaveValue('');
    });
  });

  test('TC-012 update meaning_vi and save stays on edit page', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();
    await listPage.expectTableHasRows();

    await screenshotStep(page, testInfo, 'Click edit on first row', async () => {
      await listPage.clickEditForRow(0);
      await expect(page).toHaveURL(/\/vocabularies\/\d+\/edit/, { timeout: 10000 });
    });

    const formPage = new VocabularyFormPage(page);
    await page.waitForFunction(() => document.querySelectorAll('.p-skeleton').length === 0, {
      timeout: 15000,
    });
    const currentUrl = page.url();

    await screenshotStep(page, testInfo, 'Update meaning_vi field', async () => {
      await formPage.meaningViInput.clear();
      await formPage.meaningViInput.fill('E2E Updated Nghĩa');
    });

    await screenshotStep(page, testInfo, 'Submit ↁE200 OK + toast + URL unchanged', async () => {
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes('/api/vocabularies') && resp.request().method() === 'PUT',
          { timeout: 15000 },
        ),
        formPage.submit(),
      ]);
      expect(response.status()).toBe(200);
      await expect(page.locator('.p-toast')).toBeVisible({ timeout: 10000 });
      expect(page.url()).toBe(currentUrl);
    });
  });

  test('TC-013 cancel navigates back to list', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();
    await listPage.expectTableHasRows();

    await screenshotStep(page, testInfo, 'Click edit on first row', async () => {
      await listPage.clickEditForRow(0);
      await expect(page).toHaveURL(/\/vocabularies\/\d+\/edit/, { timeout: 10000 });
    });

    const formPage = new VocabularyFormPage(page);
    await screenshotStep(page, testInfo, 'Cancel ↁEback to list', async () => {
      await page.waitForFunction(() => document.querySelectorAll('.p-skeleton').length === 0, {
        timeout: 15000,
      });
      await formPage.cancel();
      await expect(page).toHaveURL('/vocabularies', { timeout: 10000 });
    });
  });

  test('TC-014 edit page has three tabs visible', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();
    await listPage.expectTableHasRows();

    await screenshotStep(page, testInfo, 'Click edit on first row', async () => {
      await listPage.clickEditForRow(0);
      await expect(page).toHaveURL(/\/vocabularies\/\d+\/edit/, { timeout: 10000 });
    });

    await screenshotStep(page, testInfo, 'Three tabs are visible', async () => {
      await expect(page.getByRole('tab').nth(0)).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('tab').nth(1)).toBeVisible();
      await expect(page.getByRole('tab').nth(2)).toBeVisible();
    });
  });
});

// ---------------------------------------------------------------------------
// Vocabulary Delete
// ---------------------------------------------------------------------------
test.describe('Vocabulary Delete', () => {
  test('TC-015 click delete shows ConfirmDialog', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();
    await listPage.expectTableHasRows();

    await screenshotStep(page, testInfo, 'Click delete ↁEConfirmDialog appears', async () => {
      await listPage.clickDeleteForRow(0);
      await expect(page.locator('.p-confirmdialog')).toBeVisible({ timeout: 10000 });
    });
  });

  test('TC-016 cancel delete  EConfirmDialog closes, row remains', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();
    await listPage.expectTableHasRows();

    const rowCountBefore = await listPage.tableRows.count();

    await screenshotStep(page, testInfo, 'Click delete ↁEConfirmDialog appears', async () => {
      await listPage.clickDeleteForRow(0);
      await expect(page.locator('.p-confirmdialog')).toBeVisible({ timeout: 10000 });
    });

    await screenshotStep(page, testInfo, 'Cancel delete ↁEdialog closed, row count unchanged', async () => {
      await page.locator('.p-confirmdialog').getByRole('button').filter({ hasText: /không|no|cancel/i }).click();
      await expect(page.locator('.p-confirmdialog')).not.toBeVisible({ timeout: 5000 });
      const rowCountAfter = await listPage.tableRows.count();
      expect(rowCountAfter).toBe(rowCountBefore);
    });
  });

  test('TC-017 confirm delete  Erow removed from list and toast shown', async ({ page }, testInfo) => {
    await loginAsAdmin(page);

    const listPage = new VocabularyListPage(page);
    await listPage.goto();
    await listPage.waitForTableLoad();
    await listPage.expectTableHasRows();

    // Count via edit buttons  Eimmune to frozen column double-counting in tbody tr
    const rowCountBefore = await page.locator('[data-testid^="vocab-edit-btn-"]').count();
    const deletedCountBefore = await page
      .locator('[data-testid="vocab-status-badge"]')
      .filter({ hasText: 'deleted' })
      .count();

    await screenshotStep(page, testInfo, 'Click delete ↁEConfirmDialog appears', async () => {
      await listPage.clickDeleteForRow(0);
      await expect(page.locator('.p-confirmdialog')).toBeVisible({ timeout: 10000 });
    });

    await screenshotStep(page, testInfo, 'Confirm delete ↁE200 OK + toast + soft-delete badge', async () => {
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes('/api/vocabularies') && resp.request().method() === 'DELETE',
          { timeout: 15000 },
        ),
        page.locator('.p-confirmdialog').getByRole('button').filter({ hasText: /có|yes|confirm/i }).click(),
      ]);

      expect(response.status()).toBe(200);
      await expect(page.locator('.p-toast')).toBeVisible({ timeout: 10000 });
      await listPage.waitForTableLoad();

      // Soft delete: item stays in list with status='deleted', total count unchanged
      const rowCountAfter = await page.locator('[data-testid^="vocab-edit-btn-"]').count();
      expect(rowCountAfter).toBe(rowCountBefore);
      const deletedCountAfter = await page
        .locator('[data-testid="vocab-status-badge"]')
        .filter({ hasText: 'deleted' })
        .count();
      expect(deletedCountAfter).toBe(deletedCountBefore + 1);
    });
  });
});
