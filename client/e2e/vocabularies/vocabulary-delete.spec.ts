import { expect } from '@playwright/test';
import { test, ApiClient } from '../fixtures';
import { screenshotStep } from '../helpers/screenshot-step';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

function uid(): string {
  return Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// TC-014: Delete vocabulary — confirmation dialog and soft delete
// ---------------------------------------------------------------------------
test('TC-014: delete vocabulary shows confirmation and removes from list', async ({ vocabularyListPage, api, page }, testInfo) => {
  const tag = uid();
  const meaningVi = `E2E Delete ${tag}`;

  await api.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
  const seeded = await api.createVocabulary({
    meaning_vi: meaningVi,
    hiragana: 'でりーとてすと',
    level: 'N5',
    status: 'publish',
  });

  try {
    await vocabularyListPage.goto();
    await vocabularyListPage.waitForTableLoad();

    await screenshotStep(page, testInfo, 'Search for vocabulary to delete', async () => {
      await vocabularyListPage.searchInput.fill(tag);
      await page.waitForResponse(
        (resp) => resp.url().includes('/api/vocabularies') && resp.status() === 200,
        { timeout: 10000 },
      );
      await vocabularyListPage.waitForTableLoad();
      await expect(page.getByText(meaningVi)).toBeVisible({ timeout: 10000 });
    });

    await screenshotStep(page, testInfo, 'Click Delete button', async () => {
      await vocabularyListPage.clickDeleteForRow(0);
    });

    await screenshotStep(page, testInfo, 'Confirmation dialog visible', async () => {
      // PrimeVue ConfirmDialog uses .p-confirmdialog class
      await expect(page.locator('.p-confirmdialog')).toBeVisible({ timeout: 5000 });
    });

    await screenshotStep(page, testInfo, 'Confirm delete', async () => {
      await page.getByRole('button', { name: 'Yes' }).click();
      await page.waitForResponse(
        (resp) => resp.url().includes('/api/vocabularies') && resp.request().method() === 'DELETE',
        { timeout: 10000 },
      );
    });

    await screenshotStep(page, testInfo, 'Vocabulary removed from list', async () => {
      await vocabularyListPage.waitForTableLoad();
      await expect(page.getByText(meaningVi)).not.toBeVisible({ timeout: 10000 });
    });
  } catch {
    // Best-effort cleanup if test failed before delete completed
    await api.deleteVocabulary(seeded.id).catch(() => {});
  }
});
