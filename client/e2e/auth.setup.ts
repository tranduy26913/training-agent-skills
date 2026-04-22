import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('Enter your email').fill(
    process.env.TEST_USER_EMAIL ?? 'admin@app.com',
  );
  await page.getByPlaceholder('Enter your password').fill(
    process.env.TEST_USER_PASSWORD ?? 'admin123',
  );
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL('/dashboard');
  await expect(page.getByRole('main')).toBeVisible();

  await page.context().storageState({ path: authFile });
});
