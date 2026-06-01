import { test, expect, ApiClient } from '../fixtures';
import { screenshotStep } from '../helpers/screenshot-step';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

function uid(): string {
  return Date.now().toString(36);
}

// Seed one vocabulary in beforeAll, reuse for TC-012 and TC-013
// TC-013 mutates meaning_vi, so we seed per describe to isolate mutations
test.describe('Vocabulary Edit', () => {
  let seededId: number;
  const tag = uid();
  const seededMeaning = `E2E Edit ${tag}`;

  test.beforeAll(async ({ baseURL }) => {
    const client = new ApiClient(baseURL ?? 'http://localhost:5173');
    await client.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
    const vocab = await client.createVocabulary({
      meaning_vi: seededMeaning,
      level: 'N5',
      status: 'publish',
    });
    seededId = vocab.id;
  });

  test.afterAll(async ({ baseURL }) => {
    const client = new ApiClient(baseURL ?? 'http://localhost:5173');
    await client.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
    await client.deleteVocabulary(seededId).catch(() => {});
  });

  // -------------------------------------------------------------------------
  // TC-012: Vocabulary Edit — edit page pre-fills existing vocabulary data
  // -------------------------------------------------------------------------
  test('TC-012: edit page pre-fills existing vocabulary data', async ({ vocabFormPage, page }, testInfo) => {
    await vocabFormPage.gotoEdit(seededId);

    await screenshotStep(page, testInfo, 'Edit page loaded with pre-filled data', async () => {
      await expect(vocabFormPage.meaningViInput).toHaveValue(seededMeaning);
      await expect(vocabFormPage.levelSelect).toHaveValue('N5');
    });
  });

  // -------------------------------------------------------------------------
  // TC-013: Vocabulary Edit — update vocabulary happy path and redirect to list
  // -------------------------------------------------------------------------
  test('TC-013: update vocabulary happy path and redirect to list', async ({ vocabFormPage, page }, testInfo) => {
    const updatedMeaning = `E2E Updated ${uid()}`;
    await vocabFormPage.gotoEdit(seededId);

    await screenshotStep(page, testInfo, 'Meaning-vi updated', async () => {
      await vocabFormPage.meaningViInput.clear();
      await vocabFormPage.fillMeaningVi(updatedMeaning);
    });

    await screenshotStep(page, testInfo, '⚠ Save → success toast', async () => {
      await vocabFormPage.submit();
      await expect(page.locator('.p-toast')).toBeVisible({ timeout: 5000 });
    }, { captureImmediately: true });

    await screenshotStep(page, testInfo, 'Redirected to list', async () => {
      await expect(page).toHaveURL('/vocabularies');
    });
  });

  // -------------------------------------------------------------------------
  // TC-014: Vocabulary Edit — submit without meaning_vi shows validation error
  // -------------------------------------------------------------------------
  test('TC-014: submit without meaning_vi shows validation error', async ({ vocabFormPage, page }, testInfo) => {
    await vocabFormPage.gotoEdit(seededId);

    await screenshotStep(page, testInfo, 'Meaning-vi cleared', async () => {
      await vocabFormPage.meaningViInput.clear();
    });

    await screenshotStep(page, testInfo, 'Submit → meaning-vi required error', async () => {
      await vocabFormPage.submit();
      await expect(vocabFormPage.meaningViError).toBeVisible({ timeout: 5000 });
    });
  });
});
