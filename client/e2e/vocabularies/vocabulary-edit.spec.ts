import { expect } from '@playwright/test';
import { test, ApiClient } from '../fixtures';
import { screenshotStep } from '../helpers/screenshot-step';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

function uid(): string {
  return Date.now().toString(36);
}

// Seeded once for TC-011, TC-012, TC-013 — only TC-012 mutates meaning_vi
let seededId: number;
const tag = uid();
const originalMeaningVi = `E2E Edit ${tag}`;

test.beforeAll(async ({ baseURL }) => {
  const client = new ApiClient(baseURL ?? 'http://localhost:5173');
  await client.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
  const vocab = await client.createVocabulary({
    meaning_vi: originalMeaningVi,
    hiragana: 'えでぃとてすと',
    level: 'N4',
    status: 'publish',
  });
  seededId = vocab.id;
});

test.afterAll(async ({ baseURL }) => {
  const client = new ApiClient(baseURL ?? 'http://localhost:5173');
  await client.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
  await client.deleteVocabulary(seededId).catch(() => {});
});

// ---------------------------------------------------------------------------
// TC-011: Edit form pre-fills with existing vocabulary data
// ---------------------------------------------------------------------------
test('TC-011: edit form pre-fills with existing vocabulary data', async ({ vocabularyFormPage, page }, testInfo) => {
  await vocabularyFormPage.gotoEdit(seededId);

  await screenshotStep(page, testInfo, 'Edit page loaded — form pre-filled with existing data', async () => {
    await expect(vocabularyFormPage.meaningViInput).toHaveValue(originalMeaningVi);
    await expect(vocabularyFormPage.hiraganaInput).toHaveValue('えでぃとてすと');
  });
});

// ---------------------------------------------------------------------------
// TC-012: Update vocabulary — happy path (stay on edit page)
// ---------------------------------------------------------------------------
test('TC-012: update vocabulary — success stays on edit page', async ({ vocabularyFormPage, page }, testInfo) => {
  const updatedTag = uid();
  const updatedMeaningVi = `E2E Updated ${updatedTag}`;

  await vocabularyFormPage.gotoEdit(seededId);

  await screenshotStep(page, testInfo, 'Update Meaning VI field', async () => {
    await vocabularyFormPage.meaningViInput.clear();
    await vocabularyFormPage.meaningViInput.fill(updatedMeaningVi);
  });

  await screenshotStep(page, testInfo, 'Save → success toast', async () => {
    await vocabularyFormPage.submit();
    await expect(page.locator('.p-toast')).toBeVisible({ timeout: 8000 });
  }, { captureImmediately: true });

  await screenshotStep(page, testInfo, 'Stay on edit page after update', async () => {
    await expect(page).toHaveURL(`/vocabularies/${seededId}/edit`);
  });
});

// ---------------------------------------------------------------------------
// TC-013: Edit form — cancel navigates back to list
// ---------------------------------------------------------------------------
test('TC-013: cancel on edit form navigates back to list', async ({ vocabularyFormPage, page }, testInfo) => {
  await vocabularyFormPage.gotoEdit(seededId);

  await screenshotStep(page, testInfo, 'Click Cancel on edit page', async () => {
    await vocabularyFormPage.cancel();
  });

  await screenshotStep(page, testInfo, 'Redirected to vocabulary list', async () => {
    await expect(page).toHaveURL('/vocabularies');
  });
});
