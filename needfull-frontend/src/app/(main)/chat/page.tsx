// WHAT: Chat inbox — list of conversations sorted by last message
// WHY: Central messaging hub for task communication

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Search, Loader2, ChevronRight } from 'lucide-react';
import { get } from '@/lib/apiClient';

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

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    get<{ success: boolean; data: Conversation[] }>('/chat/conversations')
      .then((res) => { if (res.success) setConversations(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = conversations.filter((c) =>
    c.otherUser.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white px-4 pb-2 pt-3 shadow-sm">
        <h1 className="font-display text-lg font-bold text-gray-900">Messages</h1>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-8 pt-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-info-light">
              <MessageCircle className="h-8 w-8 text-info" />
            </div>
            <p className="mt-4 font-display text-lg font-bold text-gray-900">No conversations yet</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">Apply to a task to start chatting</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/chat/${c.id}`)}
                className="tap-target flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-white active:scale-[0.98]"
              >
                {/* Avatar */}
                {c.otherUser.profilePictureUrl ? (
                  <img src={c.otherUser.profilePictureUrl} alt="" className="h-12 w-12 shrink-0 rounded-full border border-gray-200 object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand">
                    {c.otherUser.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`truncate text-sm ${c.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                      {c.otherUser.fullName}
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-400">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {c.lastMessage ? (
                      <p className="truncate text-xs text-gray-500">{c.lastMessage}</p>
                    ) : (
                      <p className="text-xs italic text-gray-400">No messages yet</p>
                    )}
                  </div>
                </div>

                {/* Unread badge + chevron */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {c.unreadCount > 0 && (
                    <span className="flex min-w-[18px] items-center justify-center rounded-full bg-danger px-1.5 py-[2px] text-[10px] font-bold leading-none text-white">
                      {c.unreadCount > 99 ? '99+' : c.unreadCount}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
