import { create } from "zustand";

interface LoadingState {
  activeRequests: number;
  isNavigating: boolean;
  startRequest: () => void;
  endRequest: () => void;
  startNavigation: () => void;
  endNavigation: () => void;
}

const isClient = typeof window !== 'undefined';

export const useLoadingStore = create<LoadingState>((set, get) => ({
  activeRequests: 0,
  isNavigating: false,

  startRequest: () => {
    set({ activeRequests: get().activeRequests + 1 });
  },

  endRequest: () => {
    set({ activeRequests: Math.max(0, get().activeRequests - 1) });
  },

  startNavigation: () => {
    set({ isNavigating: true });
  },

  endNavigation: () => {
    set({ isNavigating: false });
  },
}));

export function useLoadingBarVisible(): boolean {
  const activeRequests = useLoadingStore((s) => s.activeRequests);
  const isNavigating = useLoadingStore((s) => s.isNavigating);
  return activeRequests > 0 || isNavigating;
}
