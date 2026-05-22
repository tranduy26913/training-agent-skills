import { type Page, type TestInfo } from '@playwright/test';

/**
 * Wraps a test action, waits briefly for the UI to settle, then captures a
 * full-page screenshot and attaches it to the Playwright HTML report.
 *
 * Use only for meaningful business steps — skip auxiliary steps such as
 * login or page navigation by calling them directly without this wrapper.
 *
 * Usage:
 *   await screenshotStep(page, testInfo, 'Submit form and verify toast', async () => {
 *     await page.getByRole('button', { name: 'Save' }).click();
 *     await expect(page.locator('.p-toast')).toBeVisible();
 *   });
 */
export async function screenshotStep(
  page: Page,
  testInfo: TestInfo,
  stepName: string,
  action: () => Promise<void>,
): Promise<void> {
  try {
    await action();
    // Small delay so animations/transitions finish before capturing
    await page.waitForTimeout(300);
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach(stepName, { body: screenshot, contentType: 'image/png' });
  } catch (error) {
    await page.waitForTimeout(300);
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach(`❌ ${stepName}`, { body: screenshot, contentType: 'image/png' });
    throw error;
  }
}

