// WHAT: Shared types for the poster-side "Available Helpers" experience
// WHY:  Dashboard card, /helpers discovery page, and task-creation suggestions
//       all render the same runner-offer shape from GET /api/availability

export interface HelperOffer {
  id: string;
  runnerId: string;
  category: { id: string; name: string; icon: string };
  note: string | null;
  availableUntil: string | null;
  maxTravelKm: number;
  isOnlineToday: boolean;
  distance: number | null;
  createdAt: string;
  runner: {
    id: string;
    fullName: string;
    trustScore?: number;
    avatarUrl?: string | null;
    isVerifiedStudent?: boolean;
    averageRating?: number | null;
    tasksCompleted?: number | null;
  };
}

export function formatDistance(meters: number | null): string | null {
  if (meters === null || meters === undefined) return null;
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}