import { useEffect } from 'react';
import { create } from 'zustand';
import apiClient, { post, get as apiGet } from '@/lib/apiClient';

interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'student' | 'admin';
  phone?: string | null;
  profilePictureUrl?: string | null;
  trustScore?: number;
  wallet?: {
    id: string;
    balanceKobo: number;
    escrowKobo: number;
  };
  emailVerified?: boolean;
  isVerifiedStudent?: boolean;
  isRunner?: boolean;
  isAvailable?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await post<{ user: User; tokens: { accessToken: string; refreshToken: string } }>('/auth/login', { email, password });
      localStorage.setItem('nf_access_token', res.tokens.accessToken);
      localStorage.setItem('nf_refresh_token', res.tokens.refreshToken);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await post<{ user: User; tokens: { accessToken: string; refreshToken: string } }>('/auth/register', data);
      localStorage.setItem('nf_access_token', res.tokens.accessToken);
      localStorage.setItem('nf_refresh_token', res.tokens.refreshToken);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Registration failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('nf_access_token');
    localStorage.removeItem('nf_refresh_token');
    set({ user: null, isAuthenticated: false, error: null });
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const res = await apiGet('/auth/me') as { user: User };
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export function useAuthInit(): void {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const token = localStorage.getItem('nf_access_token');
    if (token && !isAuthenticated && !user) {
      fetchUser();
    }
  }, [fetchUser, isAuthenticated, user]);
}

export const useIsAuthenticated = (): boolean => useAuthStore((s) => s.isAuthenticated);
export const useAuthUser = (): User | null => useAuthStore((s) => s.user);
export const useIsAdmin = (): boolean => useAuthStore((s) => s.user?.role === 'admin');
export const useLogout = (): (() => void) => useAuthStore((s) => s.logout);

export function useAuth(): { login: AuthState['login']; register: AuthState['register']; logout: AuthState['logout']; user: User | null; isLoading: boolean; error: string | null } {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  return { login, register, logout, user, isLoading, error };
}
