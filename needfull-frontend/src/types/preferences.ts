export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  preferredRole: 'poster' | 'runner' | 'both';
  sidebarCollapsed: boolean;
  preferredLanguage: string;
  notificationsEnabled: boolean;
  notificationSound: boolean;
  emailNotifications: boolean;
  taskRadiusKm: number;
  defaultSort: 'nearest' | 'newest' | 'budget' | 'urgent';
  availableOnLogin: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  preferredRole: 'both',
  sidebarCollapsed: false,
  preferredLanguage: 'en',
  notificationsEnabled: true,
  notificationSound: true,
  emailNotifications: true,
  taskRadiusKm: 5,
  defaultSort: 'nearest',
  availableOnLogin: false,
};

export const PREFS_STORAGE_KEY = 'nf_prefs';

export function dbToPreferences(row: Record<string, unknown>): UserPreferences {
  return {
    theme: (row.theme as UserPreferences['theme']) ?? 'system',
    preferredRole: (row.preferred_role as UserPreferences['preferredRole']) ?? 'both',
    sidebarCollapsed: Boolean(row.sidebar_collapsed),
    preferredLanguage: (row.preferred_language as string) ?? 'en',
    notificationsEnabled: Boolean(row.notifications_enabled ?? true),
    notificationSound: Boolean(row.notification_sound ?? true),
    emailNotifications: Boolean(row.email_notifications ?? true),
    taskRadiusKm: Number(row.task_radius_km ?? 5),
    defaultSort: (row.default_sort as UserPreferences['defaultSort']) ?? 'nearest',
    availableOnLogin: Boolean(row.available_on_login),
  };
}

export function preferencesToDb(prefs: UserPreferences): Record<string, unknown> {
  return {
    theme: prefs.theme,
    preferred_role: prefs.preferredRole,
    sidebar_collapsed: prefs.sidebarCollapsed,
    preferred_language: prefs.preferredLanguage,
    notifications_enabled: prefs.notificationsEnabled,
    notification_sound: prefs.notificationSound,
    email_notifications: prefs.emailNotifications,
    task_radius_km: prefs.taskRadiusKm,
    default_sort: prefs.defaultSort,
    available_on_login: prefs.availableOnLogin,
  };
}
