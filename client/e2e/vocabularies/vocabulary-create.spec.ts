import { expect } from '@playwright/test';
import { test, ApiClient } from '../fixtures';
import { screenshotStep } from '../helpers/screenshot-step';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

function uid(): string {
  return Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// TC-007: Create form is accessible and shows required fields
// ---------------------------------------------------------------------------
test('TC-007: create form is accessible and shows required fields', async ({ vocabularyFormPage, page }, testInfo) => {
  await vocabularyFormPage.gotoCreate();

  await screenshotStep(page, testInfo, 'Create form loaded with all required fields', async () => {
    await expect(vocabularyFormPage.createPage).toBeVisible();
    await expect(vocabularyFormPage.meaningViInput).toBeVisible();
    await expect(vocabularyFormPage.hiraganaInput).toBeVisible();
    await expect(vocabularyFormPage.saveButton).toBeVisible();
    await expect(vocabularyFormPage.cancelButton).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-008: Create form — validation errors for missing required fields
// ---------------------------------------------------------------------------
test('TC-008: create form shows validation errors for missing required fields', async ({ vocabularyFormPage, page }, testInfo) => {
  await vocabularyFormPage.gotoCreate();

  await screenshotStep(page, testInfo, 'Submit empty form → required field errors visible', async () => {
    await vocabularyFormPage.submit();
    await expect(vocabularyFormPage.meaningViError).toBeVisible({ timeout: 5000 });
    await expect(vocabularyFormPage.hiraganaError).toBeVisible();
    // Note: level defaults to 'N5' so no level error is shown
  });
});

// ---------------------------------------------------------------------------
// TC-009: Create vocabulary — happy path
// ---------------------------------------------------------------------------
test('TC-009: create vocabulary — happy path', async ({ vocabularyFormPage, api, page }, testInfo) => {
  const tag = uid();
  const meaningVi = `E2E テスト ${tag}`;
  let createdId: number | null = null;

  await vocabularyFormPage.gotoCreate();

  await screenshotStep(page, testInfo, 'Fill Meaning VI', async () => {
    await vocabularyFormPage.meaningViInput.fill(meaningVi);
  });

  await screenshotStep(page, testInfo, 'Fill Hiragana', async () => {
    await vocabularyFormPage.hiraganaInput.fill('てすと');
  });

  await screenshotStep(page, testInfo, 'Select Level N5', async () => {
    await vocabularyFormPage.levelSelect.click();
    await page.getByRole('option', { name: 'N5', exact: true }).click();
  });

  // Intercept the create response to capture the ID for cleanup
  const responsePromise = page.waitForResponse(
    (resp) => resp.url().includes('/api/vocabularies') && resp.request().method() === 'POST',
    { timeout: 10000 },
  );

  await screenshotStep(page, testInfo, 'Save → success toast', async () => {
    await vocabularyFormPage.submit();
    await expect(page.locator('.p-toast')).toBeVisible({ timeout: 8000 });
  }, { captureImmediately: true });

  const createResponse = await responsePromise;
  if (createResponse.ok()) {
    const body: { id?: number } = await createResponse.json().catch(() => ({}));
    createdId = body?.id ?? null;
  }

  await screenshotStep(page, testInfo, 'Redirected to vocabulary list', async () => {
    await expect(page).toHaveURL('/vocabularies', { timeout: 10000 });
  });

  // Cleanup: delete the created vocabulary via API
  if (createdId !== null) {
    await api.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
    await api.deleteVocabulary(createdId).catch(() => {});
  }
});

// ---------------------------------------------------------------------------
// TC-010: Create form — cancel navigates back to list
// ---------------------------------------------------------------------------
test('TC-010: cancel on create form navigates back to list', async ({ vocabularyFormPage, page }, testInfo) => {
  await vocabularyFormPage.gotoCreate();

  await screenshotStep(page, testInfo, 'Click Cancel', async () => {
    await vocabularyFormPage.cancel();
  });

  await screenshotStep(page, testInfo, 'Redirected back to vocabulary list', async () => {
    await expect(page).toHaveURL('/vocabularies');
  });
});
