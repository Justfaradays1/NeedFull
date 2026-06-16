// WHAT: My Tasks page — Posted and Accepted tabs showing user's task activity
// WHY: Single view for both sides (poster and runner) of the user's task lifecycle
// FUTURE: Add review prompt integration, add Socket.io real-time status updates

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, MessageCircle, Star, Users, MapPin, Clock,
  CheckCircle2, XCircle, AlertTriangle, Loader2, Search,
} from 'lucide-react';
import { useIsAuthenticated, useAuthInit, useAuthUser } from '@/store';
import { get } from '@/lib/apiClient';

// WHAT: Task row from API
interface TaskRow {
  id: string;
  title: string;
  budget: { kobo: number; naira: number };
  status: string;
  isUrgent: boolean;
  createdAt: string;
  deadline: string | null;
  category: { id: string; name: string; icon: string } | null;
  applicationCount?: number;
  poster?: { id: string; fullName: string };
}

type TabType = 'posted' | 'accepted';
type PostedFilter = 'all' | 'active' | 'completed' | 'cancelled';

// WHAT: Status badge config
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  open: { label: 'Open', bg: 'bg-green-100', text: 'text-green-700', icon: null },
  in_progress: { label: 'In Progress', bg: 'bg-amber-100', text: 'text-amber-700', icon: null },
  completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-500', icon: XCircle },
  disputed: { label: 'Disputed', bg: 'bg-red-100', text: 'text-red-600', icon: AlertTriangle },
};

function fmt(amount: number): string {
  return amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-gray-100', text: 'text-gray-500', icon: null };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {cfg.label}
    </span>
  );
}

function PostedRow({ task, onTap }: { task: TaskRow; onTap: () => void }) {
  return (
    <button type="button" onClick={onTap} className="tap-target w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.98] hover:border-brand/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{task.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {task.applicationCount ?? 0} application{(task.applicationCount ?? 0) !== 1 ? 's' : ''}
            </span>
            {task.deadline && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(task.deadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={task.status} />
          <span className="font-display text-base font-bold text-brand">₦{fmt(task.budget.naira)}</span>
        </div>
      </div>
    </button>
  );
}

function AcceptedRow({ task, onTap }: { task: TaskRow; onTap: () => void }) {
  const isInProgress = task.status === 'in_progress';
  return (
    <button type="button" onClick={onTap} className={`tap-target w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-all active:scale-[0.98] hover:border-brand/30 ${isInProgress ? 'border-brand/20 ring-1 ring-brand/10' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{task.title}</h3>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-[9px] font-bold text-brand">
              {task.poster?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span>{task.poster?.fullName || 'Unknown'}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={task.status} />
          <span className="font-display text-sm font-bold text-brand">₦{fmt(task.budget.naira)}</span>
        </div>
      </div>
      {isInProgress && (
        <div className="mt-3 flex justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">
            <MessageCircle className="h-3.5 w-3.5" />
            Continue
          </span>
        </div>
      )}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 skeleton rounded" />
          <div className="h-3 w-1/3 skeleton rounded" />
        </div>
        <div className="space-y-1.5">
          <div className="h-5 w-20 skeleton rounded-full" />
          <div className="h-5 w-16 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

export default function MyTasksPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  useAuthInit();

  const [tab, setTab] = useState<TabType>('posted');
  const [postedFilter, setPostedFilter] = useState<PostedFilter>('all');
  const [posted, setPosted] = useState<TaskRow[]>([]);
  const [accepted, setAccepted] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); }
  }, [isAuthenticated, router]);

  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [postedRes, acceptedRes] = await Promise.all([
        get<{ success: boolean; data: TaskRow[] }>('/tasks/me/posted'),
        get<{ success: boolean; data: TaskRow[] }>('/tasks/me/assigned'),
      ]);
      if (postedRes.success) setPosted(postedRes.data);
      if (acceptedRes.success) setAccepted(acceptedRes.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // WHAT: Filter posted tasks
  const filteredPosted = posted.filter((t) => {
    if (postedFilter === 'all') return true;
    if (postedFilter === 'active') return ['open', 'in_progress'].includes(t.status);
    if (postedFilter === 'completed') return t.status === 'completed';
    if (postedFilter === 'cancelled') return ['cancelled', 'disputed'].includes(t.status);
    return true;
  });

  // WHAT: Sort accepted — in_progress first, then by created_at desc
  const sortedAccepted = [...accepted].sort((a, b) => {
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (!isAuthenticated || !user) return null;

  const postedFilters: { key: PostedFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-display text-lg font-bold text-gray-900">My Tasks</h1>
          <Link
            href="/tasks/create"
            className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-sm"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {(['posted', 'accepted'] as TabType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`tap-target relative px-5 pb-3 pt-1 text-sm font-bold transition-colors ${
                tab === t ? 'text-brand' : 'text-gray-500'
              }`}
            >
              {t === 'posted' ? 'Posted' : 'Accepted'}
              {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-8 pt-4">
        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <button type="button" onClick={fetchTasks} className="tap-target mt-2 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white">
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* Posted Tab */}
        {!loading && tab === 'posted' && (
          <>
            {/* Filter chips */}
            <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {postedFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setPostedFilter(f.key)}
                  className={`tap-target shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    postedFilter === f.key
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredPosted.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-4 font-display text-base font-bold text-gray-900">
                  {posted.length === 0
                    ? "You haven't posted any tasks yet"
                    : 'No tasks match this filter'}
                </p>
                {posted.length === 0 && (
                  <Link
                    href="/tasks/create"
                    className="tap-target mt-4 inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-gold-dark"
                  >
                    <Plus className="h-4 w-4" />
                    Post a Task
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPosted.map((task) => (
                  <PostedRow key={task.id} task={task} onTap={() => router.push(`/feed/${task.id}`)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Accepted Tab */}
        {!loading && tab === 'accepted' && (
          <>
            {sortedAccepted.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-4 font-display text-base font-bold text-gray-900">
                  No accepted tasks yet
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Apply to tasks in the feed to get started
                </p>
                <Link
                  href="/feed"
                  className="tap-target mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-dark"
                >
                  Browse Feed
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedAccepted.map((task) => (
                  <AcceptedRow
                    key={task.id}
                    task={task}
                    onTap={() => {
                      if (task.status === 'in_progress') {
                        // WHAT: Navigate to chat — TODO: create the chat route
                        router.push(`/feed/${task.id}`);
                      } else {
                        router.push(`/feed/${task.id}`);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Review prompt — show on completed tasks */}
        {!loading && [...filteredPosted, ...sortedAccepted].filter((t) => t.status === 'completed').length > 0 && (
          <div className="mt-6 rounded-xl border border-brand-light/50 bg-brand-light/20 p-4">
            <div className="flex items-start gap-3">
              <Star className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <p className="text-sm font-bold text-gray-900">Rate your completed tasks</p>
                <p className="mt-0.5 text-xs text-gray-600">
                  Your feedback helps build a trusted community.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
