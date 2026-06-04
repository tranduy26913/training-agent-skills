import { type Page, type TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';
/**
 * Wraps a test action, then captures a full-page screenshot and attaches it
 * to the Playwright HTML report.
 *
 * Use for every meaningful user action (fill, click, assert result, assert
 * error, assert toast). Skip auxiliary steps such as login or page navigation.
 *
 * @param captureImmediately - Set true when the step asserts a transient
 *   element (toast notification, temporary banner). Captures the screenshot
 *   right after the action resolves — before any settle delay — so the
 *   element is still visible in the screenshot.
 *
 * Usage — standard step:
 *   await screenshotStep(page, testInfo, 'Fill required fields', async () => {
 *     await page.getByTestId('name-input').fill('My Resource');
 *   });
 *
 * Usage — toast step (capture before auto-dismiss):
 *   await screenshotStep(page, testInfo, 'Save → success toast', async () => {
 *     await page.getByTestId('save-btn').click();
 *     await expect(page.locator('.p-toast')).toBeVisible({ timeout: 5000 });
 *   }, { captureImmediately: true });
 *
 * Usage — field error step (error must be visible in screenshot):
 *   await screenshotStep(page, testInfo, 'Submit → validation errors', async () => {
 *     await page.getByTestId('save-btn').click();
 *     await expect(page.getByTestId('name-error')).toBeVisible({ timeout: 5000 });
 *   });
 */

// Track per-test step counter so filenames are ordered (01-step-name.png, 02-..., etc.)
const stepCounters = new WeakMap<TestInfo, number>();

function nextStepIndex(testInfo: TestInfo): number {
  const current = stepCounters.get(testInfo) ?? 0;
  const next = current + 1;
  stepCounters.set(testInfo, next);
  return next;
}

export async function screenshotStep(
  page: Page,
  testInfo: TestInfo,
  stepName: string,
  action: () => Promise<void>,
  options?: { captureImmediately?: boolean },
): Promise<void> {
  const index = nextStepIndex(testInfo);
  const slug = stepName.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().substring(0, 50);
  const filename = `${String(index).padStart(2, '0')}-${slug}.png`;

  try {
    await action();
    // For toasts and other transient elements, capture immediately before they disappear.
    // For normal steps, wait briefly so animations/transitions finish.
    if (!options?.captureImmediately) {
      await page.waitForTimeout(300);
    }
    fs.mkdirSync(testInfo.outputDir, { recursive: true });
    const filePath = path.join(testInfo.outputDir, filename);
    await page.screenshot({ fullPage: true, path: filePath });
    await testInfo.attach(stepName, { path: filePath, contentType: 'image/png' });
  } catch (error) {
    fs.mkdirSync(testInfo.outputDir, { recursive: true });
    const filePath = path.join(testInfo.outputDir, `❌-${filename}`);
    await page.screenshot({ fullPage: true, path: filePath });
    await testInfo.attach(`❌ ${stepName}`, { path: filePath, contentType: 'image/png' });
    throw error;
  }
}


