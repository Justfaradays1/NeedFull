// WHAT: Notifications list page — grouped by date, actionable items
// WHY: Central notification centre with navigation to relevant screens

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, BellRing, CheckCheck, Trash2, X, MessageCircle, Wallet,
  Shield, Briefcase, AlertTriangle, Banknote, Clock, Loader2,
} from 'lucide-react';
import { get, post, del } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface Notification {
  id: string; type: string; title: string; body: string | null;
  taskId: string | null; conversationId: string | null;
  actorId: string | null; isRead: boolean; createdAt: string; readAt: string | null;
}

type GroupLabel = 'Today' | 'Yesterday' | 'Older';

function groupNotifications(list: Notification[]): Map<GroupLabel, Notification[]> {
  const groups = new Map<GroupLabel, Notification[]>();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const n of list) {
    const d = new Date(n.createdAt);
    let label: GroupLabel;
    if (d >= today) label = 'Today';
    else if (d >= yesterday) label = 'Yesterday';
    else label = 'Older';
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(n);
  }
  return groups;
}

function timeAgo(dateStr: string): string {
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

// WHAT: Map notification type to icon + colour
function notifMeta(type: string): { icon: React.ReactNode; bg: string } {
  const size = 18;
  if (type.startsWith('task_') || type.startsWith('application_') || type.startsWith('counter_') || type.startsWith('escrow_') || type === 'new_nearby_task' || type === 'task_cancelled' || type === 'review_prompt') {
    return { icon: <Briefcase size={size} />, bg: 'bg-brand-light text-brand' };
  }
  if (type.startsWith('payment_') || type.startsWith('transfer_') || type.startsWith('manual_transfer_') || type === 'nuban') {
    return { icon: <Banknote size={size} />, bg: 'bg-amber-50 text-gold-dark' };
  }
  if (type.startsWith('verification_')) {
    return { icon: <Shield size={size} />, bg: 'bg-blue-50 text-info' };
  }
  if (type === 'new_report') {
    return { icon: <AlertTriangle size={size} />, bg: 'bg-red-50 text-danger' };
  }
  return { icon: <Bell size={size} />, bg: 'bg-gray-100 text-gray-500' };
}

function notifNavigate(n: Notification, router: ReturnType<typeof useRouter>) {
  if (n.taskId) { router.push(`/feed/${n.taskId}`); return; }
  if (n.conversationId) { router.push(`/chat/${n.conversationId}`); return; }
  if (n.type.startsWith('payment_') || n.type.startsWith('manual_transfer_') || n.type.startsWith('transfer_') || n.type === 'nuban') {
    router.push('/wallet'); return;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [list, setList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const res = await get<{ data: Notification[]; total: number }>('/notifications');
      setList(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleMarkAllRead = async () => {
    try {
      await post('/notifications/read-all');
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await post(`/notifications/${id}/read`);
      setList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setMenuId(null);
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await del(`/notifications/${id}`);
      setList((prev) => prev.filter((n) => n.id !== id));
      setMenuId(null);
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const unreadCount = list.filter((n) => !n.isRead).length;
  const groups = groupNotifications(list);

  // WHAT: Long press handlers
  const handleTouchStart = (id: string) => {
    longPressTimer.current = setTimeout(() => setMenuId(id), 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="glass-dark sticky top-0 z-30 flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Notifications</h1>
          <p className="text-xs text-white/70">Stay updated on your tasks and activity</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={handleMarkAllRead}
            className="tap-target flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white/90 hover:bg-white/25"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-8 pt-4">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center pt-16 text-center">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                <CheckCheck className="h-10 w-10 text-green-400" />
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
                <Bell className="h-5 w-5 text-brand" />
              </div>
            </div>
            <p className="font-display text-xl font-bold text-gray-900">You&apos;re all caught up</p>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-gray-500">
              Notifications about task applications, messages, and platform updates will show up here.
            </p>
          </div>
        ) : (
          Array.from(groups.entries()).map(([label, items]) => (
            <div key={label} className="mb-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{label}</h3>
              <div className="space-y-1">
                {items.map((n) => {
                  const meta = notifMeta(n.type);
                  const showUnread = !n.isRead;
                  return (
                    <div key={n.id} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          if (!n.isRead) handleMarkRead(n.id);
                          notifNavigate(n, router);
                        }}
                        onContextMenu={(e) => { e.preventDefault(); setMenuId(n.id); }}
                        onTouchStart={() => handleTouchStart(n.id)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        className={`tap-target w-full rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${showUnread ? 'border-brand/10 bg-surface shadow-sm' : 'border-transparent bg-gray-50/50'}`}
                      >
                        <div className="flex gap-3">
                          <div className={`relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                            {meta.icon}
                            {showUnread && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${showUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-500'}`}>
                                {n.title}
                              </p>
                              <span className="shrink-0 text-[10px] text-gray-500">{timeAgo(n.createdAt)}</span>
                            </div>
                            {n.body && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.body}</p>}
                          </div>
                        </div>
                      </button>

                      {/* Context menu (long press / right click) */}
                      {menuId === n.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                          <div className="absolute right-2 top-2 z-50 min-w-[140px] rounded-xl border border-card-border bg-surface py-1 shadow-lg">
                            {showUnread && (
                              <button type="button" onClick={() => handleMarkRead(n.id)}
                                className="tap-target flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                              >
                                <CheckCheck className="h-3.5 w-3.5 text-brand" /> Mark as read
                              </button>
                            )}
                            <button type="button" onClick={() => handleDelete(n.id)}
                              className="tap-target flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                            <button type="button" onClick={() => setMenuId(null)}
                              className="tap-target flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                            >
                              <X className="h-3.5 w-3.5" /> Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
