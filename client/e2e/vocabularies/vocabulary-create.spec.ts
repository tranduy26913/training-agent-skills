import { test, expect, ApiClient } from '../fixtures';
import { screenshotStep } from '../helpers/screenshot-step';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

function uid(): string {
  return Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// TC-007: Vocabulary Create — happy path
// ---------------------------------------------------------------------------
test('TC-007: create vocabulary happy path and redirect to list', async ({ vocabFormPage, api, page }, testInfo) => {
  const tag = uid();
  const meaning = `E2E Create ${tag}`;

  await vocabFormPage.gotoCreate();

  await screenshotStep(page, testInfo, 'Create page loaded', async () => {
    await expect(vocabFormPage.saveButton).toBeVisible();
  });

  await screenshotStep(page, testInfo, 'Required fields filled', async () => {
    await vocabFormPage.fillMeaningVi(meaning);
    await vocabFormPage.selectLevel('N5');
    await vocabFormPage.selectStatus('publish');
  });

  await screenshotStep(page, testInfo, '⚠ Save → success toast', async () => {
    await vocabFormPage.submit();
    await expect(page.locator('.p-toast')).toBeVisible({ timeout: 5000 });
  }, { captureImmediately: true });

  await screenshotStep(page, testInfo, 'Redirected to list — new item visible', async () => {
    await expect(page).toHaveURL('/vocabularies');
  });

  // Cleanup: delete the created vocabulary via API
  await api.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
  // Best-effort cleanup — list the vocabs and delete the one matching our meaning
  const resp = await fetch(
    `${page.url().replace('/vocabularies', '')}/api/vocabularies?search=${encodeURIComponent(meaning)}`,
    { headers: { Authorization: `Bearer ${(api as any).token}` } },
  ).catch(() => null);
  if (resp?.ok) {
    const body: { data?: Array<{ id: number }> } = await resp.json().catch(() => ({}));
    for (const item of body?.data ?? []) {
      await api.deleteVocabulary(item.id).catch(() => {});
    }
  }
});

// ---------------------------------------------------------------------------
// TC-008: Vocabulary Create — submitting empty form shows required field errors
// ---------------------------------------------------------------------------
test('TC-008: submitting empty form shows required field validation errors', async ({ vocabFormPage, page }, testInfo) => {
  await vocabFormPage.gotoCreate();

  await screenshotStep(page, testInfo, 'Submit empty form → required field errors', async () => {
    await vocabFormPage.submit();
    await expect(vocabFormPage.meaningViError).toBeVisible({ timeout: 5000 });
    await expect(vocabFormPage.levelError).toBeVisible({ timeout: 5000 });
    await expect(vocabFormPage.statusError).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// TC-009: Vocabulary Create — cancel with clean form navigates back without dialog
// ---------------------------------------------------------------------------
test('TC-009: cancel with clean form navigates back without confirm dialog', async ({ vocabFormPage, page }, testInfo) => {
  await vocabFormPage.gotoCreate();

  await screenshotStep(page, testInfo, 'Cancel button clicked', async () => {
    await vocabFormPage.cancel();
  });

  await screenshotStep(page, testInfo, 'Navigated back to list', async () => {
    await expect(page).toHaveURL('/vocabularies');
    await expect(page.locator('.p-confirmdialog')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-010: Vocabulary Create — cancel with dirty form shows confirm dialog
// ---------------------------------------------------------------------------
test('TC-010: cancel with dirty form shows confirm dialog', async ({ vocabFormPage, page }, testInfo) => {
  await vocabFormPage.gotoCreate();

  await screenshotStep(page, testInfo, 'Meaning-vi filled', async () => {
    await vocabFormPage.fillMeaningVi('dirty value');
  });

  await screenshotStep(page, testInfo, 'Cancel clicked → confirm dialog visible', async () => {
    await vocabFormPage.cancel();
    await expect(page.locator('.p-confirmdialog')).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// TC-011: Vocabulary Create — discard changes from confirm dialog navigates to list
// ---------------------------------------------------------------------------
test('TC-011: discard changes from confirm dialog navigates to list', async ({ vocabFormPage, page }, testInfo) => {
  await vocabFormPage.gotoCreate();

  await screenshotStep(page, testInfo, 'Meaning-vi filled', async () => {
    await vocabFormPage.fillMeaningVi('dirty value');
  });

  await screenshotStep(page, testInfo, 'Cancel clicked → confirm dialog visible', async () => {
    await vocabFormPage.cancel();
    await expect(page.locator('.p-confirmdialog')).toBeVisible({ timeout: 5000 });
  });

  await screenshotStep(page, testInfo, 'Discard button clicked → navigated to list', async () => {
    await page.getByRole('button', { name: /bỏ thay đổi|discard/i }).click();
    await expect(page).toHaveURL('/vocabularies');
  });
});
