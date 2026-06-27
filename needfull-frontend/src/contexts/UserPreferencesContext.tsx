'use client';

import {
  createContext, useContext, useReducer, useCallback,
  useEffect, useRef, ReactNode,
} from 'react';
import {
  UserPreferences, DEFAULT_PREFERENCES,
  PREFS_STORAGE_KEY, preferencesToDb, dbToPreferences,
} from '@/types/preferences';
import { useAuthStore } from '@/store';
import { get, patch } from '@/lib/apiClient';

type Action =
  | { type: 'SET_PREFERENCE'; key: keyof UserPreferences; value: unknown }
  | { type: 'SET_ALL'; preferences: UserPreferences }
  | { type: 'RESET' };

function preferencesReducer(state: UserPreferences, action: Action): UserPreferences {
  switch (action.type) {
    case 'SET_PREFERENCE':
      return { ...state, [action.key]: action.value };
    case 'SET_ALL':
      return { ...action.preferences };
    case 'RESET':
      return { ...DEFAULT_PREFERENCES };
    default:
      return state;
  }
}

interface UserPreferencesContextValue {
  preferences: UserPreferences;
  resolvedTheme: 'light' | 'dark';
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const getInitialPreferences = (): UserPreferences => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const stored = localStorage.getItem(PREFS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserPreferences>;
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_PREFERENCES;
  };

  const [preferences, dispatch] = useReducer(
    preferencesReducer,
    DEFAULT_PREFERENCES,
    getInitialPreferences,
  );

  const resolvedTheme: 'light' | 'dark' = (() => {
    if (preferences.theme !== 'system') return preferences.theme;
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  })();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (preferences.theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const newTheme = media.matches ? 'dark' : 'light';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [preferences.theme]);

  // Fetch preferences from API on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    get<{ success: boolean; data: Record<string, unknown> }>('/user/preferences')
      .then((res) => {
        if (res.success && res.data) {
          const serverPrefs = dbToPreferences(res.data);
          dispatch({ type: 'SET_ALL', preferences: serverPrefs });
          localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(serverPrefs));
        }
      })
      .catch(() => {
        // Server prefs not available yet — use localStorage
      });
  }, [isAuthenticated]);

  const syncToApi = useCallback(async (prefs: UserPreferences) => {
    if (!isAuthenticated) return;
    try {
      await patch('/user/preferences', preferencesToDb(prefs));
    } catch {
      // silent — will retry on next change
    }
  }, [isAuthenticated]);

  const setPreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => {
    dispatch({ type: 'SET_PREFERENCE', key, value });

    const currentStored = (() => {
      try {
        const s = localStorage.getItem(PREFS_STORAGE_KEY);
        return s ? (JSON.parse(s) as Partial<UserPreferences>) : {};
      } catch {
        return {};
      }
    })();
    const updated = { ...DEFAULT_PREFERENCES, ...currentStored, [key]: value };
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncToApi(updated as UserPreferences);
    }, 500);
  }, [syncToApi]);

  const resetPreferences = useCallback(() => {
    dispatch({ type: 'RESET' });
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    syncToApi(DEFAULT_PREFERENCES);
  }, [syncToApi]);

  return (
    <UserPreferencesContext.Provider value={{ preferences, resolvedTheme, setPreference, resetPreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside UserPreferencesProvider');
  return ctx;
}

export function useTheme() {
  const { preferences, resolvedTheme, setPreference } = usePreferences();
  return {
    theme: preferences.theme,
    resolvedTheme,
    setTheme: (theme: 'light' | 'dark' | 'system') => setPreference('theme', theme),
  };
}

export function useTaskPreferences() {
  const { preferences, setPreference } = usePreferences();
  return {
    taskRadiusKm: preferences.taskRadiusKm,
    defaultSort: preferences.defaultSort,
    setTaskRadiusKm: (km: number) => setPreference('taskRadiusKm', km),
    setDefaultSort: (sort: UserPreferences['defaultSort']) => setPreference('defaultSort', sort),
  };
}
