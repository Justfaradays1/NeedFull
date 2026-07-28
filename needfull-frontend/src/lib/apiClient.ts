// WHAT: Shared axios API client with automatic token refresh, retry logic, and loading bar
// WHY: Centralised API configuration, automatic auth token injection, 401 handling with refresh, prevents manual error handling
// FUTURE: Add request/response logging, add request deduplication, add timeout configuration per endpoint

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useLoadingStore } from '@/store/loadingStore';
import { handleSessionExpired } from '@/lib/session';

// WHAT: Auth endpoints that should NOT trigger session-expiry handling on 401
// WHY: A failed login returns 401 — that's "wrong password", not "session expired"
const SESSION_EXEMPT_PATHS = ['/auth/login', '/auth/register', '/auth/verify-email'];

// WHAT: Track if refresh is in progress to prevent multiple simultaneous refresh attempts
// WHY: Prevents race condition when multiple 401s happen at same time
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}> = [];

// WHAT: Helper to process queued requests after token refresh
// WHY: Retry all failed requests with new token once refresh completes
const processQueue = (
  error: AxiosError | null,
  token?: string
): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

// WHAT: Create axios instance pointing to NeedFull API
// WHY: Single point of configuration for all API requests
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://needfull.onrender.com/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// WHAT: Request interceptor to attach Authorization Bearer token
// WHY: All authenticated requests automatically include token without manual setup
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('nf_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// WHAT: Response interceptor with automatic token refresh on 401
// WHY: Silently refresh token and retry original request, only logout on refresh failure
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // WHAT: Handle 401 (Unauthorized — token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // WHAT: Skip session-expiry handling on auth endpoints (e.g. wrong password on login)
      // WHY: Those return 401 naturally and should show their own error messages
      if (originalRequest.url && SESSION_EXEMPT_PATHS.some((p) => originalRequest.url?.includes(p))) {
        return Promise.reject(error);
      }

      // WHAT: Prevent infinite retry loop
      originalRequest._retry = true;

      if (isRefreshing) {
        // WHAT: Refresh already in progress — queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('nf_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // WHAT: Call refresh endpoint to get new access token
        const response = await axios.post<{
          tokens: { accessToken: string; refreshToken: string };
        }>(
          `https://needfull.onrender.com/api/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.tokens;

        // WHAT: Store new tokens in localStorage
        localStorage.setItem('nf_access_token', accessToken);
        localStorage.setItem('nf_refresh_token', newRefreshToken);

        // WHAT: Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // WHAT: Process queued requests with new token
        processQueue(null, accessToken);

        // WHAT: Retry original request with new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        // WHAT: Session expired — show message, clear state, redirect
        if (typeof window !== 'undefined') {
          handleSessionExpired();
        } else {
          useAuthStore.getState().logout();
        }

        processQueue(refreshError as AxiosError, undefined);
        return Promise.reject(refreshError);
      }
    }

    // WHAT: For non-401 errors, reject as-is
    return Promise.reject(error);
  }
);

// WHAT: Typed generic helper functions for common HTTP methods
// WHY: Type-safe API calls with full TypeScript support

/**
 * WHAT: Typed GET request with loading bar tracking
 * WHY: Simplifies read operations with type inference
 * USAGE: const user = await get<User>('/users/me')
 */
export async function get<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  useLoadingStore.getState().startRequest();
  try {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  } finally {
    useLoadingStore.getState().endRequest();
  }
}

/**
 * WHAT: Typed POST request with loading bar tracking
 * WHY: Simplifies create/mutation operations
 * USAGE: const newUser = await post<User>('/auth/register', { email, password })
 */
export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  useLoadingStore.getState().startRequest();
  try {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  } finally {
    useLoadingStore.getState().endRequest();
  }
}

/**
 * WHAT: Typed PATCH request with loading bar tracking
 * WHY: Simplifies partial updates
 * USAGE: const updated = await patch<Task>('/tasks/123', { status: 'completed' })
 */
export async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  useLoadingStore.getState().startRequest();
  try {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  } finally {
    useLoadingStore.getState().endRequest();
  }
}

/**
 * WHAT: Typed DELETE request with loading bar tracking
 * WHY: Simplifies delete operations
 * USAGE: await del<void>('/tasks/123')
 */
export async function del<T = void>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  useLoadingStore.getState().startRequest();
  try {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  } finally {
    useLoadingStore.getState().endRequest();
  }
}

export default apiClient;
