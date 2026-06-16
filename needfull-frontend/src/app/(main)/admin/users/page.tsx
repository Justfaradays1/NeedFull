// WHAT: Admin user management page — search, filter, expand, ban/unban, credit
// WHY: Core user moderation interface

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Shield, Ban, CheckCircle2, X, Loader2,
  DollarSign, ChevronDown, ChevronUp, BadgeCheck, Star,
  Wallet, Calendar, Mail, Phone, ChevronLeft, ChevronRight,
  ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useIsAuthenticated, useAuthInit, useIsAdmin } from '@/store';
import { get, post } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface UserWallet {
  balanceKobo: number; escrowKobo: number;
}

interface AdminUser {
  id: string; fullName: string; email: string; role: string;
  phone?: string; trustScore: number; tasksCompleted: number;
  isVerifiedStudent: boolean; isRunner: boolean; isAvailable: boolean;
  isBanned: boolean; wallet: UserWallet; createdAt: string;
}

type FilterKey = 'all' | 'runners' | 'banned' | 'unverified';

export default function AdminUsersPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  useAuthInit();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [banConfirmId, setBanConfirmId] = useState<string | null>(null);
  const [creditId, setCreditId] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const perPage = 20;

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isAdmin) { router.push('/feed'); return; }
  }, [isAuthenticated, isAdmin, router]);

  const buildFilter = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('perPage', perPage.toString());
    if (search) params.set('search', search);
    if (filter === 'runners') params.set('isRunner', 'true');
    if (filter === 'banned') params.set('isBanned', 'true');
    if (filter === 'unverified') params.set('isVerifiedStudent', 'false');
    return params.toString();
  }, [search, filter, page]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<any>(`/admin/users?${buildFilter()}`);
      if (res.success) { setUsers(res.data); setTotal(res.pagination?.total ?? 0); }
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [buildFilter]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    fetchUsers();
  }, [isAuthenticated, isAdmin, fetchUsers]);

  // Reset to page 1 when search or filter changes
  useEffect(() => { setPage(1); }, [search, filter]);

  const totalPages = Math.ceil(total / perPage);

  const handleBan = async (userId: string) => {
    setSubmitting(true);
    try {
      await post(`/admin/users/${userId}/ban`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isBanned: true } : u));
      setBanConfirmId(null);
      toast.success('User banned');
    } catch { toast.error('Failed to ban user'); }
    finally { setSubmitting(false); }
  };

  const handleUnban = async (userId: string) => {
    setSubmitting(true);
    try {
      await post(`/admin/users/${userId}/unban`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isBanned: false } : u));
      toast.success('User unbanned');
    } catch { toast.error('Failed to unban'); }
    finally { setSubmitting(false); }
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'runners', label: 'Runners' },
    { key: 'banned', label: 'Banned' },
    { key: 'unverified', label: 'Unverified' },
  ];

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white px-4 pb-3 pt-3 shadow-sm">
        <h1 className="font-display text-lg font-bold text-gray-900">User Management</h1>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white" />
        </div>

        {/* Filter chips */}
        <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className={`tap-target shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* User cards */}
      <div className="mx-4 mt-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-500">No users found</p>
          </div>
        ) : (
          users.map((u) => {
            const isExpanded = expandedId === u.id;
            const trustSeg = Math.min(Math.round((u.trustScore / 100) * 100), 100);
            const trustColor = u.trustScore >= 70 ? 'bg-green-500' : u.trustScore >= 40 ? 'bg-amber-500' : 'bg-red-500';

            return (
              <div key={u.id} className="rounded-xl border border-gray-100 bg-white shadow-sm">
                {/* Card header — always visible */}
                <button type="button" onClick={() => setExpandedId(isExpanded ? null : u.id)}
                  className="tap-target flex w-full items-center gap-3 p-3 text-left"
                >
                  <div className="relative shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand">
                      {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    {u.isBanned && (
                      <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                        <Ban className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-gray-900">{u.fullName}</p>
                      {u.isVerifiedStudent && <BadgeCheck className="h-4 w-4 shrink-0 text-gold" />}
                    </div>
                    <p className="truncate text-[11px] text-gray-500">{u.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-brand">₦{(u.wallet.balanceKobo / 100).toLocaleString()}</p>
                      <span className={`rounded-full px-2 py-[1px] text-[9px] font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.isBanned ? 'bg-red-100 text-red-600' :
                        'bg-brand-light text-brand'
                      }`}>
                        {u.isBanned ? 'Banned' : u.role === 'admin' ? 'Admin' : 'Student'}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-300" /> : <ChevronDown className="h-4 w-4 text-gray-300" />}
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-3 pb-3 pt-2">
                    {/* Trust bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3" /> Trust Score</span>
                        <span className="font-bold">{u.trustScore}/100</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-gray-100">
                        <div className={`h-2 rounded-full transition-all ${trustColor}`} style={{ width: `${trustSeg}%` }} />
                      </div>
                    </div>

                    {/* Detail rows */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div><span className="text-gray-500">Phone</span><p className="font-semibold text-gray-900">{u.phone || '—'}</p></div>
                      <div><span className="text-gray-500">Tasks</span><p className="font-semibold text-gray-900">{u.tasksCompleted} completed</p></div>
                      <div><span className="text-gray-500">Runner</span><p className="font-semibold text-gray-900">{u.isRunner ? 'Yes' : 'No'}</p></div>
                      <div><span className="text-gray-500">Available</span><p className="font-semibold text-gray-900">{u.isAvailable ? 'Yes' : 'No'}</p></div>
                      <div><span className="text-gray-500">Verified</span><p className="font-semibold text-gray-900">{u.isVerifiedStudent ? 'Yes' : 'No'}</p></div>
                      <div><span className="text-gray-500">Wallet</span><p className="font-semibold text-brand">₦{(u.wallet.balanceKobo / 100).toLocaleString()}</p></div>
                      <div className="col-span-2"><span className="text-gray-500">Joined</span><p className="font-semibold text-gray-900">{new Date(u.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {u.isBanned ? (
                        <button type="button" onClick={() => handleUnban(u.id)} disabled={submitting}
                          className="tap-target inline-flex items-center gap-1.5 rounded-xl border border-green-300 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-50"
                        >
                          <ToggleRight className="h-3.5 w-3.5" /> Unban
                        </button>
                      ) : (
                        <button type="button" onClick={() => setBanConfirmId(u.id)}
                          className="tap-target inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                          <Ban className="h-3.5 w-3.5" /> Ban User
                        </button>
                      )}
                      {!u.isVerifiedStudent && (
                        <button type="button" onClick={() => router.push('/admin/verifications')}
                          className="tap-target inline-flex items-center gap-1.5 rounded-xl border border-green-200 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-50"
                        >
                          <BadgeCheck className="h-3.5 w-3.5" /> Verify Student
                        </button>
                      )}
                      <button type="button" onClick={() => { setCreditId(u.id); setCreditAmount(''); }}
                        className="tap-target inline-flex items-center gap-1.5 rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50"
                      >
                        <DollarSign className="h-3.5 w-3.5" /> Add Credit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mx-4 mt-3 flex items-center justify-between text-xs text-gray-600">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="tap-target inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 font-bold disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="tap-target inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 font-bold disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Ban Confirmation Modal */}
      {banConfirmId && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center">
          <div className="w-full rounded-t-2xl bg-white p-5 sm:max-w-md sm:rounded-2xl sm:mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"><Ban className="h-5 w-5 text-red-600" /></div>
              <div>
                <h3 className="font-display text-base font-bold text-gray-900">Ban User</h3>
                <p className="text-xs text-gray-500">This will suspend their account immediately.</p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setBanConfirmId(null)} className="tap-target flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600">Cancel</button>
              <button type="button" onClick={() => handleBan(banConfirmId)} disabled={submitting}
                className="tap-target flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {submitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Credit Modal */}
      {creditId && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center">
          <div className="w-full rounded-t-2xl bg-white p-5 sm:max-w-md sm:rounded-2xl sm:mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-gray-900">Add Admin Credit</h3>
              <button type="button" onClick={() => setCreditId(null)} className="tap-target"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-500">Enter amount in Naira to credit {users.find((u) => u.id === creditId)?.fullName}&apos;s wallet.</p>
            <div className="relative mt-3">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₦</span>
              <input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="0" min="1"
                className="w-full rounded-xl border border-gray-200 py-3 pl-7 pr-3 text-sm outline-none focus:border-amber-400"
              />
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setCreditId(null)} className="tap-target flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600">Cancel</button>
              <button type="button" disabled={!creditAmount || parseInt(creditAmount) <= 0}
                className="tap-target flex-1 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                Add Credit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
