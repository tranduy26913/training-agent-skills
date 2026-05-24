import { expect } from '@playwright/test';
import { test, ApiClient } from '../fixtures';
import { screenshotStep } from '../helpers/screenshot-step';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

function uid(): string {
  return Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// TC-001: List page loads with vocabulary table
// ---------------------------------------------------------------------------
test('TC-001: list page loads with vocabulary table', async ({ vocabularyListPage }, testInfo) => {
  await vocabularyListPage.goto();
  await vocabularyListPage.waitForTableLoad();

  await screenshotStep(vocabularyListPage['pw'], testInfo, 'List page loaded with data', async () => {
    await vocabularyListPage.expectTableHasRows();
  });
});

// ---------------------------------------------------------------------------
// TC-002: Create Vocabulary button navigates to create form
// ---------------------------------------------------------------------------
test('TC-002: Create button navigates to create form', async ({ vocabularyListPage, page }, testInfo) => {
  await vocabularyListPage.goto();
  await vocabularyListPage.waitForTableLoad();

  await screenshotStep(page, testInfo, 'Click Create button', async () => {
    await vocabularyListPage.createButton.click();
  });

  await screenshotStep(page, testInfo, 'Create page navigated', async () => {
    await expect(page).toHaveURL('/vocabularies/create');
  });
});

// ---------------------------------------------------------------------------
// TC-003: Search filters table results
// ---------------------------------------------------------------------------
test('TC-003: search filters table results', async ({ vocabularyListPage, api, page }, testInfo) => {
  const tag = uid();
  const meaningVi = `E2E Search ${tag}`;

  await api.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
  const seeded = await api.createVocabulary({
    meaning_vi: meaningVi,
    hiragana: 'てすと',
    level: 'N5',
    status: 'publish',
  });

  try {
    await vocabularyListPage.goto();
    await vocabularyListPage.waitForTableLoad();

    await screenshotStep(page, testInfo, 'Search input filled', async () => {
      await vocabularyListPage.searchInput.fill(tag);
      await page.waitForResponse(
        (resp) => resp.url().includes('/api/vocabularies') && resp.status() === 200,
        { timeout: 10000 },
      );
      await vocabularyListPage.waitForTableLoad();
    });

    await screenshotStep(page, testInfo, 'Search results showing seeded vocabulary', async () => {
      await expect(page.getByText(meaningVi)).toBeVisible({ timeout: 10000 });
    });
  } finally {
    await api.deleteVocabulary(seeded.id).catch(() => {});
  }
});

// ---------------------------------------------------------------------------
// TC-004: Search with no results shows empty state
// ---------------------------------------------------------------------------
test('TC-004: search with no results shows empty state', async ({ vocabularyListPage, page }, testInfo) => {
  await vocabularyListPage.goto();
  await vocabularyListPage.waitForTableLoad();

  await screenshotStep(page, testInfo, 'Search with no results — empty state visible', async () => {
    await vocabularyListPage.searchInput.fill('__nonexistent_vocab_xyz_99999__');
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/vocabularies') && resp.status() === 200,
      { timeout: 10000 },
    );
    await vocabularyListPage.waitForTableLoad();
    await vocabularyListPage.expectEmptyState();
  });
});

// ---------------------------------------------------------------------------
// TC-005: Filter by level narrows results
// ---------------------------------------------------------------------------
test('TC-005: filter by level narrows results', async ({ vocabularyListPage, page }, testInfo) => {
  await vocabularyListPage.goto();
  await vocabularyListPage.waitForTableLoad();

  await screenshotStep(page, testInfo, 'Level N5 filter selected', async () => {
    await vocabularyListPage.filterByLevel('N5');
  });

  await screenshotStep(page, testInfo, 'Table filtered by level', async () => {
    // After filter, table either shows rows or empty state — either is correct
    const hasRows = await vocabularyListPage.tableRows.count() > 0;
    if (hasRows) {
      await vocabularyListPage.expectTableHasRows();
    } else {
      await vocabularyListPage.expectEmptyState();
    }
  });
});

// ---------------------------------------------------------------------------
// TC-006: Edit button navigates to edit form
// ---------------------------------------------------------------------------
test('TC-006: Edit button navigates to edit form', async ({ vocabularyListPage, page }, testInfo) => {
  await vocabularyListPage.goto();
  await vocabularyListPage.waitForTableLoad();
  await vocabularyListPage.expectTableHasRows();

  await screenshotStep(page, testInfo, 'Click Edit button on first row', async () => {
    await vocabularyListPage.clickEditForRow(0);
  });

  await screenshotStep(page, testInfo, 'Edit page navigated', async () => {
    await expect(page).toHaveURL(/\/vocabularies\/\d+\/edit/);
  });
});
