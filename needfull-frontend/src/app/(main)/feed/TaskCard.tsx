// WHAT: Feed task card — category/urgent/emergency badges, budget, poster row, application count
// WHY: Reusable card for feed, search results, and user task lists
// FUTURE: Add swipe actions, add image thumbnail, add bookmark icon

'use client';

import {
  Flame,
  ShieldCheck,
  MapPin,
  Clock,
  Users,
  AlertCircle,
} from 'lucide-react';

// WHAT: Shape of a single feed task
export interface FeedTask {
  id: string;
  title: string;
  budget: { kobo: number; naira: number };
  deadline: string | null;
  isUrgent: boolean;
  isEmergency?: boolean;
  locationLabel: string | null;
  distance: number | null;
  poster: {
    id: string;
    fullName: string;
    trustScore: number;
    verified?: boolean;
    avatarUrl?: string | null;
  };
  category: { id: string; name: string; icon: string };
  applicationCount?: number;
}

// WHAT: Props for TaskCard
interface TaskCardProps {
  task: FeedTask;
  onPress?: (task: FeedTask) => void;
}

// WHAT: Format naira for display
function fmt(amount: number): string {
  return amount.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// WHAT: Format deadline to readable string
function formatDeadline(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = Date.now();
  const diff = d.getTime() - now;
  const days = Math.ceil(diff / 86_400_000);

  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  if (days <= 7) return `${days} days left`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

// WHAT: Format distance
function formatDistance(meters: number | null): string | null {
  if (meters === null || meters === undefined) return null;
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function TaskCard({ task, onPress }: TaskCardProps) {
  const distance = formatDistance(task.distance);
  const deadline = formatDeadline(task.deadline);
  const budget = task.budget.naira;

  // WHAT: Determine left border accent
  let borderAccent = '';
  if (task.isEmergency) {
    borderAccent = 'border-l-red-500';
  } else if (task.isUrgent) {
    borderAccent = 'border-l-amber-500';
  } else {
    borderAccent = 'border-l-transparent';
  }

  function handleClick() {
    if (onPress) {
      onPress(task);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ' ') && onPress) {
      e.preventDefault();
      onPress(task);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        cursor-pointer select-none rounded-2xl border border-gray-100 bg-white
        border-l-[3px] px-4 pb-3 pt-3.5 shadow-card transition-shadow duration-200
        active:scale-[0.99]
        hover:border-brand/30 hover:shadow-lifted
        ${borderAccent}
      `}
    >
      {/* Top row: category badge, urgent badge, budget */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Category badge */}
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand">
            {task.category.icon} {task.category.name}
          </span>

          {/* Urgent / Emergency badge */}
          {task.isEmergency && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600">
              <AlertCircle className="h-3 w-3" />
              EMERGENCY
            </span>
          )}
          {task.isUrgent && !task.isEmergency && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              <Flame className="h-3 w-3" />
              URGENT
            </span>
          )}
        </div>

        {/* Budget */}
        <span className="shrink-0 font-display text-lg font-bold leading-none text-brand">
          ₦{fmt(budget)}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-sm font-semibold leading-snug text-gray-900 line-clamp-2">
        {task.title}
      </h3>

      {/* Meta row: location + distance, deadline */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
        {task.locationLabel && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {task.locationLabel}
            {distance && <span className="text-gray-500">({distance})</span>}
          </span>
        )}

        {deadline && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {deadline}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="mb-3 border-t border-gray-100" />

      {/* Bottom row: poster avatar + name + rating + verified, application count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-light text-[11px] font-bold text-brand">
            {task.poster.fullName.charAt(0).toUpperCase()}
          </div>

          {/* Name + rating + verified */}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="truncate text-xs font-medium text-gray-700">
                {task.poster.fullName}
              </span>
              {task.poster.verified && (
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-500">
                {task.poster.trustScore}% rating
              </span>
            </div>
          </div>
        </div>

        {/* Application count */}
        <div className="flex shrink-0 items-center gap-1 rounded-md bg-gray-50 px-2 py-1">
          <Users className="h-3 w-3 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">
            {task.applicationCount ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}
