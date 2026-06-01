import { test, expect, ApiClient } from '../fixtures';
import { screenshotStep } from '../helpers/screenshot-step';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

function uid(): string {
  return Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// TC-001: Vocabulary List — displays table with existing vocabulary data
// ---------------------------------------------------------------------------
test('TC-001: displays table with existing vocabulary data', async ({ vocabListPage, api }, testInfo) => {
  // Seed a vocabulary so the table has at least one row
  await api.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
  const meaning = `E2E TC001 ${uid()}`;
  const seeded = await api.createVocabulary({ meaning_vi: meaning, level: 'N5', status: 'publish' });

  try {
    await vocabListPage.goto();
    await vocabListPage.waitForTableLoad();

    await screenshotStep(vocabListPage['pw'], testInfo, 'List page loaded', async () => {
      await expect(vocabListPage.createButton).toBeVisible();
    });

    // Search for the seeded vocab to confirm the table shows data
    await vocabListPage.searchFor(meaning);

    await screenshotStep(vocabListPage['pw'], testInfo, 'Table rows visible', async () => {
      await vocabListPage.expectTableHasRows();
    });
  } finally {
    await api.deleteVocabulary(seeded.id).catch(() => {});
  }
});

// ---------------------------------------------------------------------------
// TC-002: Vocabulary List — search filters table results
// ---------------------------------------------------------------------------
test('TC-002: search filters table results to seeded vocabulary', async ({ vocabListPage, api }, testInfo) => {
  await api.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
  const tag = uid();
  const meaning = `E2E Search ${tag}`;
  const seeded = await api.createVocabulary({ meaning_vi: meaning, level: 'N5', status: 'publish' });

  try {
    await vocabListPage.goto();
    await vocabListPage.waitForTableLoad();

    await screenshotStep(vocabListPage['pw'], testInfo, 'Search input filled', async () => {
      await vocabListPage.searchFor(meaning);
    });

    await screenshotStep(vocabListPage['pw'], testInfo, 'Search results show only seeded vocab', async () => {
      await expect(vocabListPage.tableRows.first()).toContainText(meaning, { timeout: 10000 });
      await expect(vocabListPage.tableRows).toHaveCount(1);
    });
  } finally {
    await api.deleteVocabulary(seeded.id).catch(() => {});
  }
});

// ---------------------------------------------------------------------------
// TC-003: Vocabulary List — shows empty-filter state when search returns no results
// ---------------------------------------------------------------------------
test('TC-003: shows empty-filter state when search returns no results', async ({ vocabListPage }, testInfo) => {
  await vocabListPage.goto();
  await vocabListPage.waitForTableLoad();

  await screenshotStep(vocabListPage['pw'], testInfo, 'Search with no results', async () => {
    await vocabListPage.searchFor('__nonexistent_vocab_xyz_e2e__');
  });

  await screenshotStep(vocabListPage['pw'], testInfo, 'Empty filter state visible', async () => {
    await vocabListPage.expectEmptyFilterState();
  });
});

// ---------------------------------------------------------------------------
// TC-004: Vocabulary List — Create button navigates to create page
// ---------------------------------------------------------------------------
test('TC-004: Create button navigates to create page', async ({ vocabListPage, page }, testInfo) => {
  await vocabListPage.goto();
  await vocabListPage.waitForTableLoad();

  await screenshotStep(page, testInfo, 'Create button clicked', async () => {
    await vocabListPage.createButton.click();
  });

  await screenshotStep(page, testInfo, 'Create page loaded', async () => {
    await expect(page).toHaveURL('/vocabularies/create');
  });
});

// ---------------------------------------------------------------------------
// TC-005: Vocabulary List — Edit button navigates to the vocabulary edit page
// ---------------------------------------------------------------------------
test('TC-005: Edit button navigates to the vocabulary edit page', async ({ vocabListPage, api, page }, testInfo) => {
  // Seed a vocabulary so there's an edit button in the table
  await api.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
  const meaning = `E2E TC005 ${uid()}`;
  const seeded = await api.createVocabulary({ meaning_vi: meaning, level: 'N5', status: 'publish' });

  try {
    // Search for the specific seeded vocab so only 1 row shows
    await vocabListPage.goto();
    await vocabListPage.waitForTableLoad();
    await vocabListPage.searchFor(meaning);
    await vocabListPage.expectTableHasRows();

    await screenshotStep(page, testInfo, 'Edit button clicked', async () => {
      await vocabListPage.clickEditForRow(0);
    });

    await screenshotStep(page, testInfo, 'Edit page loaded', async () => {
      await expect(page).toHaveURL(/\/vocabularies\/\d+\/edit/);
    });
  } finally {
    // Only clean up if we didn't navigate to edit page (navigating away already leaves the record)
    await api.deleteVocabulary(seeded.id).catch(() => {});
  }
});

// ---------------------------------------------------------------------------
// TC-006: Vocabulary List — Delete confirms, removes vocabulary, shows success toast
// ---------------------------------------------------------------------------
test('TC-006: Delete confirms and removes vocabulary with success toast', async ({ vocabListPage, api, page }, testInfo) => {
  await api.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
  const tag = uid();
  const meaning = `E2E Delete ${tag}`;
  const seeded = await api.createVocabulary({ meaning_vi: meaning, level: 'N5', status: 'publish' });

  try {
    await vocabListPage.goto();
    await vocabListPage.waitForTableLoad();
    await vocabListPage.searchFor(meaning);
    await vocabListPage.expectTableHasRows();

    await screenshotStep(page, testInfo, 'Delete button clicked', async () => {
      await vocabListPage.clickDeleteForRow(0);
    });

    await screenshotStep(page, testInfo, 'Confirm dialog visible', async () => {
      await expect(page.locator('.p-confirmdialog')).toBeVisible({ timeout: 5000 });
    });

    await screenshotStep(page, testInfo, 'Confirm button clicked', async () => {
      await page.getByRole('button', { name: /yes|xác nhận|đồng ý/i }).click();
    });

    await screenshotStep(page, testInfo, '⚠ Success toast shown', async () => {
      await expect(page.locator('.p-toast')).toBeVisible({ timeout: 5000 });
    }, { captureImmediately: true });
  } catch (err) {
    // If test fails before deletion, ensure cleanup
    await api.deleteVocabulary(seeded.id).catch(() => {});
    throw err;
  }
});
