// WHAT: Chat thread page — real-time messaging with WhatsApp-style bubbles
// WHY: Direct messaging between task participants with escrow status

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Send, Shield, MoreVertical, Flag, CheckCheck,
  Loader2, X,
} from 'lucide-react';
import { get, post } from '@/lib/apiClient';
import { useSocket } from '@/hooks/useSocket';
import { useAuthUser } from '@/store';

interface Message {
  id: string; senderId: string; content: string; isRead: boolean; createdAt: string;
}

interface OtherUser {
  id: string; fullName: string; profilePictureUrl: string | null;
}

interface Conversation {
  id: string; taskId: string; otherUser: OtherUser; lastMessage: string | null;
  lastMessageAt: string | null; unreadCount: number; createdAt: string;
}

interface TaskInfo {
  id: string; posterId: string; title: string; status: string;
  budget: { kobo: number; naira: number }; isUrgent: boolean;
  poster?: { id: string; fullName: string };
  runnerId?: string | null;
}

function Bubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  const time = new Date(msg.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-4`}>
      <div className={`relative max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
        isMine ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-gray-100 text-gray-900'
      }`}>
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        <div className={`mt-0.5 flex items-center justify-end gap-1 ${
          isMine ? 'text-white/70' : 'text-gray-500'
        }`}>
          <span className="text-[10px]">{time}</span>
          {isMine && (
            <CheckCheck className={`h-3 w-3 ${msg.isRead ? 'text-blue-300' : ''}`} />
          )}
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start px-4 py-1">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export default function ChatThreadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const convId = params.id;
  const user = useAuthUser();

  const [conv, setConv] = useState<Conversation | null>(null);
  const [task, setTask] = useState<TaskInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Socket
  const { emit, on, off } = useSocket(user?.id);

  // Fetch conversation + task + messages
  useEffect(() => {
    if (!convId) return;
    (async () => {
      try {
        const [convRes, msgRes] = await Promise.all([
          get<{ success: boolean; data: Conversation[] }>('/chat/conversations'),
          get<{ success: boolean; data: Message[] }>(`/chat/conversations/${convId}/messages`),
        ]);

        const found = convRes.data.find((c: Conversation) => c.id === convId);
        if (found) {
          setConv(found);
          const taskRes = await get<{ success: boolean; data: TaskInfo }>(`/tasks/${found.taskId}`).catch(() => null);
          if (taskRes?.success) setTask(taskRes.data);
        }
        if (msgRes.success) setMessages(msgRes.data);
      } catch { /* */ }
      finally { setLoading(false); }
    })();
  }, [convId]);

  // Socket events
  useEffect(() => {
    if (!convId) return;

    emit('join:conv', convId);

    const cleanupMsg = on('new:message', (data: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      scrollDown();
    });

    const cleanupTyping = on('partner:typing', () => {
      setPartnerTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setPartnerTyping(false), 3000);
    });

    const cleanupStopTyping = on('partner:stop:typing', () => {
      setPartnerTyping(false);
      if (typingTimer.current) { clearTimeout(typingTimer.current); typingTimer.current = null; }
    });

    scrollDown();

    return () => {
      emit('leave:conv', convId);
      cleanupMsg?.();
      cleanupTyping?.();
      cleanupStopTyping?.();
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [convId, emit, on, off]);

  useEffect(() => { scrollDown(); }, [messages]);

  // Typing emission
  useEffect(() => {
    if (!convId || !user) return;
    const handle = setTimeout(() => emit('stop:typing', { conversationId: convId, userId: user.id }), 2000);
    return () => clearTimeout(handle);
  }, [input, convId, user, emit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (convId && user) {
      emit('typing', { conversationId: convId, userId: user.id });
    }
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !convId) return;
    setSending(true);
    try {
      const res = await post<{ success: boolean; data: { id: string; senderId: string; content: string; createdAt: string } }>(
        `/chat/conversations/${convId}/messages`,
        { content: text },
      );
      if (res.success) {
        const msg = res.data;
        setMessages((prev) => [...prev, { ...msg, isRead: false }]);
        emit('send:message', { ...msg, conversationId: convId });
        setInput('');
        scrollDown();
      }
    } catch { /* */ }
    finally { setSending(false); }
  }, [input, sending, convId, emit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const partnerName = conv?.otherUser.fullName || 'Chat';
  const isInProgress = task?.status === 'in_progress';
  const isPoster = user?.id === task?.posterId;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-2 py-2 shadow-sm">
        <button type="button" onClick={() => router.back()} className="tap-target">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>

        {conv?.otherUser.profilePictureUrl ? (
          <img src={conv.otherUser.profilePictureUrl} alt="" className="h-9 w-9 rounded-full border border-gray-200 object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand">
            {partnerName.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">{partnerName}</p>
          {task && (
            <p className="flex items-center gap-1.5 truncate text-[11px] text-gray-500">
              {task.title}
              <span className={`rounded-full px-1.5 py-[1px] text-[9px] font-bold ${
                task.status === 'open' ? 'bg-green-100 text-green-700' :
                task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                task.status === 'completed' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {task.status.replace('_', ' ')}
              </span>
            </p>
          )}
        </div>

        {/* Overflow menu */}
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen((p) => !p)} className="tap-target">
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                <button type="button" onClick={() => { setMenuOpen(false); router.push(`/feed/${task?.id}`); }}
                  className="tap-target flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Flag className="h-3.5 w-3.5" /> View Task
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); /* TODO: open dispute modal */ }}
                  className="tap-target flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5" /> Dispute
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Escrow status bar */}
      {isInProgress && task && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
          <Shield className="h-3.5 w-3.5" />
          ₦{task.budget.naira.toLocaleString()} in escrow • Safe until confirmed
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2">
        {messages.length === 0 && !loading && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg) => (
          <Bubble key={msg.id} msg={msg} isMine={msg.senderId === user?.id} />
        ))}
        {partnerTyping && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-200 bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            type="text" value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:bg-white"
            maxLength={2000}
          />
          <button
            type="button" onClick={sendMessage} disabled={!input.trim() || sending}
            className="tap-target flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-all disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
