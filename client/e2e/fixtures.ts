import { test as base } from '@playwright/test';
import { LoginPage } from './pages/login-page';
import { UserListPage } from './pages/user-list-page';
import { UserFormPage } from './pages/user-form-page';
import { ProfilePage } from './pages/profile-page';
import { VocabularyListPage, VocabularyFormPage } from './pages/vocabulary-page';

export class ApiClient {
  private token: string | null = null;

  constructor(private readonly baseURL: string) {}

  async authenticate(email: string, password: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error(`Auth failed: ${response.status}`);
    const body: { token: string } = await response.json();
    this.token = body.token;
  }

  async createUser(data: Record<string, unknown>): Promise<{ id: number }> {
    const response = await fetch(`${this.baseURL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Create user failed: ${response.status}`);
    const body: { id: number } = await response.json();
    return body;
  }

  async updateUser(id: number, data: Record<string, unknown>): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Update user failed: ${response.status}`);
  }

  async deleteUser(id: number): Promise<void> {
    await fetch(`${this.baseURL}/api/users/${id}`, {
      method: 'DELETE',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
  }

  async createVocabulary(data: Record<string, unknown>): Promise<{ id: number }> {
    const response = await fetch(`${this.baseURL}/api/vocabularies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Create vocabulary failed: ${response.status}`);
    const body: { id: number } = await response.json();
    return body;
  }

  async deleteVocabulary(id: number): Promise<void> {
    await fetch(`${this.baseURL}/api/vocabularies/${id}`, {
      method: 'DELETE',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
  }
}

type Fixtures = {
  loginPage: LoginPage;
  userListPage: UserListPage;
  userFormPage: UserFormPage;
  profilePage: ProfilePage;
  vocabularyListPage: VocabularyListPage;
  vocabularyFormPage: VocabularyFormPage;
  api: ApiClient;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  userListPage: async ({ page }, use) => {
    await use(new UserListPage(page));
  },

  userFormPage: async ({ page }, use) => {
    await use(new UserFormPage(page, 'create'));
  },

  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },

  vocabularyListPage: async ({ page }, use) => {
    await use(new VocabularyListPage(page));
  },

  vocabularyFormPage: async ({ page }, use) => {
    await use(new VocabularyFormPage(page));
  },

  api: async ({ baseURL }, use) => {
    const client = new ApiClient(baseURL ?? 'http://localhost:5173');
    await use(client);
  },
});

export { expect } from '@playwright/test';
