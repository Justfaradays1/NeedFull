// WHAT: Tiny cross-column store for recent activity
// WHY: The feed page fetches/derives activities once; the desktop right panel
//      renders the same list without a second fetch.

import { create } from "zustand";

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

interface DashboardStore {
  recentActivities: DashboardActivity[];
  setRecentActivities: (activities: DashboardActivity[]) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  recentActivities: [],
  setRecentActivities: (activities) => set({ recentActivities: activities }),
}));