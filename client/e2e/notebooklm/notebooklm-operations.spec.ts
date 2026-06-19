import { test, expect } from '../fixtures';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

class OperationsApiClient {
  private token: string | null = null;

  constructor(private readonly baseURL: string) {}

  async authenticate(): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    if (!response.ok) {
      throw new Error(`Unable to authenticate admin user: ${response.status}`);
    }

    const body = (await response.json()) as { token: string };
    this.token = body.token;
  }

  async listFailedJobs(): Promise<Array<{ id: number; status: string }>> {
    const response = await fetch(`${this.baseURL}/api/v1/admin/notebooklm/jobs?status=failed&limit=5`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Operations jobs endpoint unavailable: ${response.status}`);
    }

    const body = (await response.json()) as { data?: Array<{ id: number; status: string }> };
    return body.data ?? [];
  }
}

test.describe('NotebookLM Operations', () => {
  test('displays monitor page for admin and allows opening detail drawer', async ({ page }) => {
    await page.goto('/notebooklm/jobs');

    await expect(page.getByText('NotebookLM Job Monitor')).toBeVisible();

    const viewButtons = page.locator('[data-testid="job-view-btn"]');
    if ((await viewButtons.count()) > 0) {
      await viewButtons.first().click();
      await expect(page.getByTestId('job-step-viewer')).toBeVisible();
    }
  });

  test('retries a failed/dead-letter job when available', async ({ page, baseURL }) => {
    const api = new OperationsApiClient(baseURL ?? 'http://localhost:5174');
    await api.authenticate();

    const failedJobs = await api.listFailedJobs();
    test.skip(failedJobs.length === 0, 'No failed jobs available for retry scenario');

    await page.goto(`/notebooklm/jobs/${failedJobs[0].id}/retry`);
    await page.getByTestId('retry-reason').fill('E2E retry validation');
    await page.getByTestId('retry-submit').click();

    await expect(page).toHaveURL('/notebooklm/jobs');
  });

  test('purges a dead-letter item from monitor list when available', async ({ page }) => {
    await page.goto('/notebooklm/jobs');

    const purgeButtons = page.locator('[data-testid="job-purge-btn"]');
    test.skip((await purgeButtons.count()) === 0, 'No dead-letter rows available for purge scenario');

    await purgeButtons.first().click();
    await page.getByRole('button', { name: 'Accept' }).click();
  });
});
