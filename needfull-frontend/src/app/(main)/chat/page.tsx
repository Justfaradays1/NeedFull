'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MessageCircle, Search, Loader2, ChevronRight, TrendingUp,
  BookOpen, Truck, Palette, PenTool, Code, Plus, Briefcase,
  Shield, SendHorizontal,
} from 'lucide-react';
import { get } from '@/lib/apiClient';
import { Avatar } from '@/components/ui/avatar';

interface OtherUser {
  id: string; fullName: string; profilePictureUrl: string | null;
}

interface Conversation {
  id: string; taskId: string;
  otherUser: OtherUser;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

interface TaskItem {
  id: string;
  title: string;
  budget: { kobo: number; naira: number };
  status: string;
  isUrgent: boolean;
  createdAt: string;
  category: { id: string; name: string; icon: string } | null;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function formatLastSeen(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TaskSkeleton() {
  return (
    <div className="w-[180px] shrink-0 animate-pulse space-y-2 rounded-xl bg-white p-3 shadow-sm">
      <div className="h-2 w-10 rounded bg-gray-100" />
      <div className="h-3 w-full rounded bg-gray-100" />
      <div className="h-3 w-2/3 rounded bg-gray-100" />
      <div className="flex gap-1.5">
        <div className="h-2 w-8 rounded bg-gray-100" />
        <div className="h-2 w-8 rounded bg-gray-100" />
      </div>
    </div>
  );
}

const CATEGORIES = [
  { id: 'assignment', name: 'Assignment Help', icon: BookOpen, desc: 'Research, writing, editing', color: 'bg-violet-100', iconColor: 'text-violet-600' },
  { id: 'delivery', name: 'Delivery', icon: Truck, desc: 'Food, packages, documents', color: 'bg-orange-100', iconColor: 'text-orange-600' },
  { id: 'design', name: 'Graphic Design', icon: Palette, desc: 'Flyers, logos, banners', color: 'bg-pink-100', iconColor: 'text-pink-600' },
  { id: 'tutoring', name: 'Tutoring', icon: PenTool, desc: 'One-on-one academic help', color: 'bg-blue-100', iconColor: 'text-blue-600' },
  { id: 'tech', name: 'Tech Support', icon: Code, desc: 'IT, software, hardware', color: 'bg-cyan-100', iconColor: 'text-cyan-600' },
];

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" className="w-28 h-24 mx-auto">
      <circle cx="60" cy="50" r="38" stroke="currentColor" strokeWidth="1.5" className="text-gray-200" />
      <circle cx="60" cy="50" r="28" stroke="currentColor" strokeWidth="1" className="text-gray-200" />
      <circle cx="43" cy="40" r="6" className="fill-brand/10 stroke-brand/30" strokeWidth="1.5" />
      <circle cx="60" cy="36" r="5" className="fill-brand/10 stroke-brand/30" strokeWidth="1.5" />
      <circle cx="77" cy="40" r="6" className="fill-brand/10 stroke-brand/30" strokeWidth="1.5" />
      <path d="M43 40l10 8" stroke="currentColor" strokeWidth="1.5" className="text-gray-300" />
      <path d="M60 36l10 8" stroke="currentColor" strokeWidth="1.5" className="text-gray-300" />
      <path d="M53 48l7 6 7-6" stroke="currentColor" strokeWidth="1.5" className="text-gray-300" />
      <path d="M36 68a24 24 0 0148 0" stroke="currentColor" strokeWidth="1.5" className="text-gray-300" strokeDasharray="3 3" />
      <circle cx="60" cy="76" r="20" className="fill-brand/5" />
      <path d="M51 78l6 3 4-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand/50" />
    </svg>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [recommendedTasks, setRecommendedTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [convRes, tasksRes] = await Promise.all([
          get<{ success: boolean; data: Conversation[] }>('/chat/conversations'),
          get<{ success: boolean; data: TaskItem[] }>('/tasks?sortBy=newest&status=open&perPage=6').catch(() => null),
        ]);
        if (convRes.success) setConversations(convRes.data);
        if (tasksRes?.success) setRecommendedTasks(tasksRes.data);
      } catch { /* silent */ }
      finally { setLoading(false); setTasksLoading(false); }
    };
    fetchAll();
  }, []);

  const filtered = conversations.filter((c) =>
    c.otherUser.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  const hasConversations = conversations.length > 0;
  const showSmartContent = !hasConversations && !loading && !search;

  return (
    <div className="min-h-screen bg-gray-50 safe-all">
      {/* ─── Header ─── */}
      <div className="glass-dark sticky top-0 z-30 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Messages</h1>
            <p className="mt-0.5 text-sm text-white/75">
              Stay connected with clients, service providers, and opportunities.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-2xl bg-white/12 py-3.5 pl-11 pr-4 text-sm text-white outline-none backdrop-blur-md placeholder:text-white/45 border border-white/15 transition-all duration-200 focus:bg-white/18 focus:border-white/30 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
          />
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="px-4 pb-8 pt-4">
        {loading ? (
          /* Loading state */
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="mt-3 text-sm font-medium text-gray-500">Loading conversations...</p>
          </div>
        ) : filtered.length === 0 && search ? (
          /* No search results */
          <div className="flex flex-col items-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mt-4 font-display text-lg font-bold text-gray-900">No results found</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">Try a different name or check your spelling</p>
          </div>
        ) : showSmartContent ? (
          /* ─── Smart Empty State ─── */
          <div className="space-y-6">

            {/* Empty message */}
            <div className="flex flex-col items-center pt-4 text-center">
              <EmptyIllustration />
              <h2 className="mt-4 font-display text-xl font-bold text-gray-900 sm:text-2xl">No conversations yet</h2>
              <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-gray-500">
                When you apply for tasks or receive applications, your conversations will appear here.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Link
                  href="/feed"
                  className="tap-target inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.97]"
                >
                  <Briefcase className="h-4 w-4" />
                  Explore Tasks
                </Link>
                <Link
                  href="/explore"
                  className="tap-target inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-surface px-5 py-3 text-sm font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.97]"
                >
                  <SendHorizontal className="h-4 w-4" />
                  Browse Services
                </Link>
              </div>
            </div>

            {/* Recommended Tasks */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                  <TrendingUp className="h-4 w-4 text-brand" />
                  Recommended Tasks
                </h3>
                <Link href="/tasks" className="flex items-center gap-0.5 text-[11px] font-bold text-brand">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {tasksLoading ? (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {Array.from({ length: 4 }).map((_, i) => <TaskSkeleton key={i} />)}
                </div>
              ) : recommendedTasks.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white/60 px-4 py-6 text-center">
                  <Briefcase className="mx-auto h-6 w-6 text-gray-300" />
                  <p className="mt-1.5 text-sm font-bold text-gray-900">No tasks available</p>
                  <p className="text-xs text-gray-500">Check back later for new opportunities.</p>
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {recommendedTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="tap-target block w-[180px] shrink-0 rounded-xl border border-card-border bg-surface p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="mb-1.5 flex items-center gap-1.5">
                        {task.isUrgent && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">URGENT</span>
                        )}
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-600">
                          {task.category?.name || 'General'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{task.title}</p>
                      <div className="mt-2 flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-brand">₦{task.budget.naira.toLocaleString()}</span>
                      </div>
                      <div className="mt-1.5 text-[10px] text-gray-500">
                        {timeAgo(task.createdAt)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Popular Categories */}
            <section>
              <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <Shield className="h-4 w-4 text-gold" />
                Popular Categories
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={cat.id}
                      href={`/tasks?category=${cat.id}`}
                      className="tap-target flex shrink-0 flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-md active:scale-[0.97]"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${cat.color}`}>
                        <Icon className={`h-4 w-4 ${cat.iconColor}`} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-900 text-center leading-tight">{cat.name}</span>
                      <span className="text-[9px] text-gray-500 text-center leading-tight">{cat.desc}</span>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Trust info card */}
            <section>
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light">
                  <Shield className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Protected by escrow</p>
                  <p className="text-xs text-gray-500">
                    Every task payment is held securely until both parties confirm completion.
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* ─── Conversation List ─── */
          <div className="space-y-1">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/chat/${c.id}`)}
                className="tap-target flex w-full items-center gap-3 rounded-xl border border-transparent bg-surface px-3 py-3 text-left shadow-sm transition-all hover:border-card-border hover:shadow-md active:scale-[0.98]"
              >
                {/* Avatar + online status */}
                <div className="relative shrink-0">
                  <Avatar src={c.otherUser.profilePictureUrl} name={c.otherUser.fullName} size="lg" />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                      <span className={`truncate text-sm ${c.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'}`}>
                      {c.otherUser.fullName}
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-400">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {c.lastMessage ? (
                      <p className={`truncate text-xs ${c.unreadCount > 0 ? 'font-medium text-gray-700' : 'text-gray-500'}`}>{c.lastMessage}</p>
                    ) : (
                      <p className="truncate text-xs italic text-gray-400">No messages yet</p>
                    )}
                  </div>
                </div>

                {/* Unread badge */}
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {c.unreadCount > 0 && (
                    <span className="flex min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 py-[3px] text-[10px] font-bold leading-none text-white shadow-sm">
                      {c.unreadCount > 99 ? '99+' : c.unreadCount}
                    </span>
                  )}
                  <ChevronRight className={`h-4 w-4 ${c.unreadCount > 0 ? 'text-gray-400' : 'text-gray-300'}`} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
