'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Search, MessageCircle, Briefcase, User, Star, Clock,
  Award, TrendingUp, Zap, DollarSign, Users, CheckCircle,
  ChevronRight, LogOut, Settings, Wallet as WalletIcon, Shield,
  BookOpen, PenTool, Palette, Code, Truck,
} from 'lucide-react';
import { useAuthUser, useAuthStore } from '@/store';
import { get } from '@/lib/apiClient';
import { Callout } from '@/components/ui/callout';

/* ─── Types ─── */

interface TaskItem {
  id: string;
  title: string;
  budget: { kobo: number; naira: number };
  status: string;
  isUrgent: boolean;
  createdAt: string;
  applicationCount: number;
  category: { id: string; name: string; icon: string } | null;
  poster: { id: string; fullName: string };
}

/* ─── Helpers ─── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

/* ─── Skeletons ─── */

function TaskSkeleton() {
  return (
    <div className="w-[200px] shrink-0 animate-pulse space-y-2 rounded-xl bg-white p-3 shadow-sm">
      <div className="h-2.5 w-12 rounded bg-gray-100" />
      <div className="h-3.5 w-full rounded bg-gray-100" />
      <div className="h-3 w-2/3 rounded bg-gray-100" />
      <div className="flex gap-2">
        <div className="h-2.5 w-10 rounded bg-gray-100" />
        <div className="h-2.5 w-10 rounded bg-gray-100" />
      </div>
    </div>
  );
}

/* ─── Profile Dropdown ─── */

function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const user = useAuthUser();
  const logout = useAuthStore((s) => s.logout);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const initials = user?.fullName?.charAt(0)?.toUpperCase() || '?';

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">{user?.fullName}</p>
            <p className="truncate text-[11px] text-gray-600">{user?.email}</p>
          </div>
        </div>
        <button type="button" onClick={() => { onClose(); router.push('/profile'); }}
          className="tap-target flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <User className="h-4 w-4 text-gray-400" /> Profile
        </button>
        <button type="button" onClick={() => { onClose(); router.push('/wallet'); }}
          className="tap-target flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <WalletIcon className="h-4 w-4 text-gray-400" /> Wallet
        </button>
        <button type="button" onClick={() => { onClose(); router.push('/settings'); }}
          className="tap-target flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Settings className="h-4 w-4 text-gray-400" /> Settings
        </button>
        <div className="border-t border-gray-100" />
        <button type="button" onClick={() => { onClose(); logout(); router.push('/login'); }}
          className="tap-target flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
          <LogOut className="h-4 w-4" /> Log Out
        </button>
      </div>
    </>
  );
}

/* ─── Task Card (solid — no glass on dense content) ─── */

function TaskCard({ task }: { task: TaskItem }) {
  return (
    <Link
      href={`/feed/${task.id}`}
      className="tap-target block w-[200px] shrink-0 rounded-xl border border-gray-100 glass-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        {task.isUrgent && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">URGENT</span>
        )}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-700">
          {task.category?.name || 'General'}
        </span>
      </div>
      <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{task.title}</p>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <DollarSign className="h-3 w-3 text-brand" />
        <span className="font-bold text-gray-900">₦{task.budget.naira.toLocaleString()}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500">
        <span>{timeAgo(task.createdAt)}</span>
        <span>{task.applicationCount} applicant{task.applicationCount !== 1 ? 's' : ''}</span>
      </div>
    </Link>
  );
}

/* ─── Popular Category Card ─── */

const POPULAR_CATEGORIES = [
  { id: 'assignment', name: 'Assignment Help', icon: BookOpen, desc: 'Research, writing, editing' },
  { id: 'delivery', name: 'Delivery', icon: Truck, desc: 'Food, packages, documents' },
  { id: 'design', name: 'Graphic Design', icon: Palette, desc: 'Flyers, logos, banners' },
  { id: 'tutoring', name: 'Tutoring', icon: PenTool, desc: 'One-on-one academic help' },
  { id: 'tech', name: 'Tech Support', icon: Code, desc: 'IT, software, hardware' },
];

function PopularCategoryCard({ cat }: { cat: typeof POPULAR_CATEGORIES[number] }) {
  const Icon = cat.icon;
  return (
    <button
      type="button"
      className="tap-target flex shrink-0 flex-col items-center gap-1.5 rounded-xl border border-gray-100 glass-card px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-md active:scale-[0.97]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light">
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <span className="text-[11px] font-bold text-gray-900 text-center leading-tight">{cat.name}</span>
              <span className="text-[9px] text-gray-700 text-center leading-tight">{cat.desc}</span>
    </button>
  );
}

/* ─── Main Page ─── */

export default function FeedPage() {
  const router = useRouter();
  const user = useAuthUser();
  const [profileOpen, setProfileOpen] = useState(false);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [postedCount, setPostedCount] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const initials = user?.fullName?.charAt(0)?.toUpperCase() || '?';
  const balanceKobo = user?.wallet?.balanceKobo ?? 0;
  const balanceNaira = (balanceKobo / 100).toLocaleString();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tasksRes, postedRes, convRes] = await Promise.all([
          get<{ success: boolean; data: TaskItem[] }>('/tasks?sortBy=newest&status=open&perPage=6'),
          get<{ success: boolean; data: TaskItem[] }>('/tasks/me/posted').catch(() => null),
          get<{ success: boolean; data: { unreadCount: number }[] }>('/chat/conversations').catch(() => null),
        ]);
        if (tasksRes.success) setTasks(tasksRes.data);
        if (postedRes?.success) setPostedCount(postedRes.data.length);
        if (convRes?.success) {
          setUnreadCount((convRes.data as any).reduce?.((s: number, c: any) => s + (c.unreadCount || 0), 0) ?? 0);
        }
      } catch { /* silent */ }
      finally { setTasksLoading(false); }
    };
    fetchAll();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 safe-all">
      {/* ─── Top Nav ─── */}
      <div className="glass-dark sticky top-0 z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-gold">
              <svg viewBox="0 3 36 30" fill="none" className="w-[20px] h-[20px]">
                <rect x="12" y="24" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.18"/>
                <rect x="2" y="27.5" width="26" height="3" rx="1.5" fill="currentColor" opacity="0.28"/>
                <circle cx="23" cy="9" r="4" fill="currentColor"/>
                <path d="M23 13v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M23 19.5l-2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M23 19.5l2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M23 15.5l-7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="14" r="4" fill="white" fillOpacity="0.9"/>
                <path d="M8 18v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9"/>
                <path d="M8 24.5l-2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
                <path d="M8 24.5l2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
                <path d="M8 20l7.5-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
                <circle cx="16" cy="21" r="2.5" fill="currentColor"/>
                <circle cx="16" cy="21" r="1.5" fill="#1A6B4A"/>
              </svg>
            </div>
            <span className="font-display text-lg font-bold text-white">NeedFull</span>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((p) => !p)}
              className="tap-target flex items-center gap-2 rounded-full bg-white/10 px-2 py-1.5 pr-3 transition-colors hover:bg-white/20"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                {initials}
              </div>
              <ChevronRight className="h-3 w-3 text-white/60" />
            </button>
            {profileOpen && <ProfileDropdown onClose={() => setProfileOpen(false)} />}
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="px-4 pb-6 space-y-4 mt-4">

        {/* 1. Greeting + Wallet — combined for easy access */}
        <div className="glass-card rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">
                {greeting()}, {user?.fullName?.split(' ')[0] || 'there'}
              </h2>
              <p className="text-sm text-gray-700">Ready to earn or get things done today?</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light">
              <Award className="h-5 w-5 text-brand" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-light/40 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-brand" />
              <span className="text-xs font-semibold text-gray-700">Wallet</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base font-black text-brand">₦{balanceNaira}</span>
              <Link href="/wallet"
                className="tap-target rounded-lg bg-brand px-3.5 py-1.5 text-xs font-bold text-white"
              >
                Fund Wallet
              </Link>
            </div>
          </div>
        </div>

        {/* 1.5 Tip — onboarding guidance */}
        <Callout variant="tip">
          Complete your profile with a bio and photo to build trust and get more task opportunities.
        </Callout>

        {/* 2. Quick Actions — compact 2x2 grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { href: '/tasks/create', icon: Plus, label: 'Post a Task', color: 'text-brand', bg: 'bg-brand-light' },
            { href: '/tasks', icon: Search, label: 'Find Work', color: 'text-brand', bg: 'bg-brand-light' },
            { href: '/explore', icon: Users, label: 'Services', color: 'text-brand', bg: 'bg-brand-light' },
            { href: '/chat', icon: MessageCircle, label: unreadCount > 0 ? `${unreadCount}` : 'Chat', color: 'text-brand', bg: 'bg-brand-light', badge: unreadCount > 0 },
          ].map(({ href, icon: Icon, label, color, bg, badge }) => (
            <Link
              key={href}
              href={href}
              className="tap-target flex flex-col items-center gap-1 glass-card rounded-xl px-2 py-3 transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            >
              <div className={`relative flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
                {badge && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[8px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-gray-900 text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>

        {/* 3. Trending Tasks */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-1 text-sm font-bold text-gray-900">
              <TrendingUp className="h-4 w-4 text-brand" />
              Trending Tasks
            </h3>
            <Link href="/tasks" className="flex items-center gap-0.5 text-[11px] font-bold text-brand">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {tasksLoading ? (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {Array.from({ length: 4 }).map((_, i) => <TaskSkeleton key={i} />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="glass-card rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center">
              <Briefcase className="mx-auto h-6 w-6 text-gray-300" />
              <p className="mt-1.5 text-sm font-bold text-gray-900">No tasks posted yet</p>
              <p className="text-xs text-gray-700">Be the first to post a task on campus.</p>
              <Link href="/tasks/create"
                className="tap-target mt-2 inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white">
                <Plus className="h-3.5 w-3.5" /> Post a Task
              </Link>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          )}
        </section>

        {/* 4. Popular Categories — hardcoded, no API call */}
        <section>
          <div className="mb-2 flex items-center gap-1 text-sm font-bold text-gray-900">
            <Star className="h-4 w-4 text-gold" />
            Popular Categories
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {POPULAR_CATEGORIES.map((cat) => <PopularCategoryCard key={cat.id} cat={cat} />)}
          </div>
        </section>

        {/* 5. Campus Activity — skeleton until real data exists */}
        <section>
          <div className="mb-2 flex items-center gap-1 text-sm font-bold text-gray-900">
            <Zap className="h-4 w-4 text-gold" />
            Campus Activity
          </div>
          <div className="space-y-2 glass-card rounded-xl p-4">
            <div className="flex items-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 rounded bg-gray-200" />
                <div className="h-2 w-1/3 rounded bg-gray-200" />
              </div>
            </div>
            <div className="flex items-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-gray-200" />
                <div className="h-2 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
            <div className="flex items-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-4/5 rounded bg-gray-200" />
                <div className="h-2 w-2/5 rounded bg-gray-200" />
              </div>
            </div>
            <p className="text-center text-[10px] text-gray-600 pt-1">
              Live activity shows when tasks are posted, completed, and paid out.
            </p>
          </div>
        </section>

        {/* 6. Stats — compact, at bottom where it doesn't dominate */}
        <section>
          <div className="mb-2 flex items-center gap-1 text-sm font-bold text-gray-900">
            <Shield className="h-4 w-4 text-brand" />
            Your Stats
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Briefcase, bg: 'bg-brand-light', color: 'text-brand', label: 'Posted', value: postedCount ?? '—' },
              { icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600', label: 'Done', value: '—' },
              { icon: DollarSign, bg: 'bg-amber-50', color: 'text-gold-dark', label: 'Earned', value: `₦${balanceNaira}` },
              { icon: MessageCircle, bg: 'bg-blue-100', color: 'text-blue-600', label: 'Messages', value: unreadCount },
            ].map(({ icon: Icon, bg, color, label, value }) => (
              <div key={label} className="glass-card rounded-xl px-2 py-3 text-center">
                <div className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full ${bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </div>
                <p className="text-sm font-black text-gray-900">{value}</p>
                <p className="text-[9px] font-medium text-gray-700">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Nothing here — wallet moved into greeting card */}
      </div>
    </div>
  );
}
