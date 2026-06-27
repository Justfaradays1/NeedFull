// WHAT: Zustand auth store with persistent login state
// WHY: Centralised authentication state management across the app, persists across page reloads
// FUTURE: Add biometric login, add session timeout, add multi-device logout

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios, { AxiosError } from "axios";

// WHAT: Type definitions for authenticated user
// WHY: TypeScript support for user data throughout the app
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: "student" | "admin";
  emailVerified: boolean;
  trustScore: number;
  profilePictureUrl?: string | null;
  wallet?: {
    id: string;
    balanceKobo: number;
    escrowKobo: number;
  };
}

// WHAT: API response types
interface LoginResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface RegisterResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface MeResponse {
  user: AuthUser;
  wallet: {
    id: string;
    balanceKobo: number;
    escrowKobo: number;
  };
}

// WHAT: Auth store state and actions
interface AuthStore {
  // State
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (
    fullName: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  clearError: () => void;
}

// WHAT: Helper to get authorization header
// WHY: Centralised token retrieval logic
function getAuthHeader(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("nf_access_token");
  return token ? `Bearer ${token}` : null;
}

// WHAT: Configure axios instance with auth header
// WHY: Automatically includes token in all API requests
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// WHAT: Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = getAuthHeader();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// WHAT: Create Zustand store with persist middleware
// WHY: persist() saves user state to localStorage, restores on page reload
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // WHAT: Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // WHAT: Login action with API call
      // WHY: Authenticates user, stores tokens, sets user state
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<LoginResponse>("/auth/login", {
            email,
            password,
          });

          const { user, tokens } = response.data;

          // WHAT: Store tokens in localStorage for persistence and cookies for middleware
          localStorage.setItem("nf_access_token", tokens.accessToken);
          localStorage.setItem("nf_refresh_token", tokens.refreshToken);
          document.cookie = `nf_access_token=${tokens.accessToken}; path=/; max-age=86400; SameSite=Lax`;

          // WHAT: Set user and auth state
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          const axiosError = err as AxiosError<{ message?: string }>;
          const errorMessage =
            axiosError.response?.data?.message ||
            "Login failed. Please try again.";
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          throw err;
        }
      },

      // WHAT: Register action with API call
      // WHY: Creates new account, stores tokens, sets user state
      register: async (
        fullName: string,
        email: string,
        password: string,
        phone?: string,
      ) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<RegisterResponse>(
            "/auth/register",
            {
              fullName,
              email,
              password,
              phone,
            },
          );

          const { user, tokens } = response.data;

          // WHAT: Store tokens in localStorage and cookies
          localStorage.setItem("nf_access_token", tokens.accessToken);
          localStorage.setItem("nf_refresh_token", tokens.refreshToken);
          document.cookie = `nf_access_token=${tokens.accessToken}; path=/; max-age=86400; SameSite=Lax`;

          // WHAT: Set user and auth state
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          const axiosError = err as AxiosError<{ message?: string }>;
          const errorMessage =
            axiosError.response?.data?.message ||
            "Registration failed. Please try again.";
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          throw err;
        }
      },

      // WHAT: Logout action
      // WHY: Clears all auth state and tokens
      logout: () => {
        // WHAT: Remove tokens from localStorage and cookies
        localStorage.removeItem("nf_access_token");
        localStorage.removeItem("nf_refresh_token");
        document.cookie = "nf_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        // WHAT: Clear auth state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // WHAT: Refresh user profile from API
      // WHY: Silently fetches /auth/me to update user data and wallet balance
      // Handles 401 by clearing state (token expired or invalid)
      refreshUser: async () => {
        const { isAuthenticated } = get();

        // WHAT: Skip if not authenticated
        if (!isAuthenticated) return;

        try {
          const response = await apiClient.get<MeResponse>("/auth/me");
          const { user, wallet } = response.data;

          // WHAT: Update user with wallet data
          set({
            user: {
              ...user,
              wallet: {
                id: wallet.id,
                balanceKobo: wallet.balanceKobo,
                escrowKobo: wallet.escrowKobo,
              },
            },
          });
        } catch (err) {
          const axiosError = err as AxiosError;

          // WHAT: On 401, user session expired — clear auth state
          // WHY: Prevents stale sessions, forces re-login
          if (axiosError.response?.status === 401) {
            console.warn("Auth token expired, clearing session");
            get().logout();
          } else {
            // WHAT: Log other errors but don't fail silently
            console.error("Failed to refresh user:", err);
          }
        }
      },

      // WHAT: Manually set user (used for updates from other sources)
      // WHY: Allows sync with user data from other API calls
      setUser: (user: AuthUser | null) => {
        set({
          user,
          isAuthenticated: user !== null,
        });
      },

      // WHAT: Clear error message
      // WHY: Allows UI to dismiss error notifications
      clearError: () => {
        set({ error: null });
      },
    }),

    // WHAT: Persist middleware configuration
    // WHY: Saves auth state to localStorage, restores on app reload
    {
      name: "nf-auth", // localStorage key
      // WHAT: Only persist user and isAuthenticated (not loading/error)
      // WHY: Tokens are stored separately in localStorage, errors are transient
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
