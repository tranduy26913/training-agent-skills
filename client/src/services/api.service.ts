import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useUiStore } from '@stores/ui.store';

type TrackedRequestConfig = InternalAxiosRequestConfig & {
  _globalLoading?: boolean;
};

function finishLoading(config?: TrackedRequestConfig): void {
  if (!config?._globalLoading) return;
  config._globalLoading = false;
  useUiStore().stopLoading();
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  useUiStore().startLoading();
  (config as TrackedRequestConfig)._globalLoading = true;

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    finishLoading(response.config as TrackedRequestConfig);
    return response;
  },
  (error) => {
    finishLoading(error.config as TrackedRequestConfig | undefined);
    if (error.response?.status === 401) {
      // Do not redirect when the auth endpoint itself returns 401 (wrong credentials).
      // Only redirect when a protected endpoint returns 401 (expired/missing token).
      const isAuthEndpoint = (error.config?.url as string | undefined)?.includes('/auth/');
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
