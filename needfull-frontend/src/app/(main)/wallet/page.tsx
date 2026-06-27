// WHAT: Main wallet dashboard page (route: /wallet)
// WHY: Users see their balance, escrow, quick stats, and transaction history in one place
// FUTURE: Add charts for spending trends, add quick-action shortcuts, add real-time balance updates via Socket.io

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Wallet, Lock, ArrowDownLeft, ArrowUpRight, RefreshCw, Loader2, Banknote, TrendingUp, CheckCircle } from 'lucide-react';
import { useIsAuthenticated, useAuthUser, useAuthInit } from '@/store';
import { get } from '@/lib/apiClient';

// WHAT: Wallet data from API
interface WalletData {
  balance: { kobo: number; naira: number };
  escrow: { kobo: number; naira: number };
}

// WHAT: Single transaction from API
interface Transaction {
  id: string;
  type: string;
  amount: { kobo: number; naira: number };
  balanceBefore: { kobo: number; naira: number };
  balanceAfter: { kobo: number; naira: number };
  reference: string | null;
  taskId: string | null;
  taskTitle: string | null;
  note: string | null;
  createdAt: string;
}

// WHAT: Pagination info
interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// WHAT: Map transaction type to human-readable label
const TX_LABELS: Record<string, string> = {
  card_deposit: 'Card Deposit',
  monnify_deposit: 'Virtual Account Deposit',
  manual_deposit_confirmed: 'Bank Transfer',
  withdrawal: 'Withdrawal',
  escrow_lock: 'Escrow Hold',
  escrow_release: 'Escrow Released',
  earnings: 'Task Earnings',
  fee: 'Platform Fee',
  refund: 'Refund',
  deposit: 'Deposit',
};

// WHAT: Categorise transaction type for colour coding
type TxCategory = 'credit' | 'debit' | 'escrow' | 'fee';
function getTxCategory(type: string): TxCategory {
  if (type === 'escrow_lock') return 'escrow';
  if (type === 'fee' || type === 'withdrawal') return 'debit';
  return 'credit';
}

// WHAT: Determine if amount should show as positive or negative
function isPositive(type: string): boolean {
  const credits = ['card_deposit', 'monnify_deposit', 'manual_deposit_confirmed', 'earnings', 'refund', 'deposit', 'escrow_release'];
  return credits.includes(type);
}

// WHAT: Get icon component for transaction type
function TxIcon({ type }: { type: string }) {
  const cat = getTxCategory(type);
  if (type === 'escrow_lock' || type === 'escrow_release') {
    return <Lock className="h-4 w-4 text-amber-600" />;
  }
  if (cat === 'credit') {
    return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
  }
  return <ArrowUpRight className="h-4 w-4 text-red-600" />;
}

// WHAT: Background colour for the icon circle
function TxIconBg({ type }: { type: string }) {
  const cat = getTxCategory(type);
  if (type === 'escrow_lock' || type === 'escrow_release') return 'bg-amber-100';
  if (cat === 'credit') return 'bg-green-100';
  return 'bg-red-100';
}

// WHAT: Convert kobo to naira string
function formatNaira(kobo: number): string {
  return (kobo / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// WHAT: Format ISO date to readable
function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return `Today, ${d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export default function WalletPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  useAuthInit();

  // WHAT: Wallet + transactions state
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [isLoadingTx, setIsLoadingTx] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WHAT: Expanded transaction rows
  const [expandedTx, setExpandedTx] = useState<Set<string>>(new Set());

  // WHAT: Quick stats computed from transactions
  const [earnedThisMonth, setEarnedThisMonth] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);

  // WHAT: Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // WHAT: Fetch wallet data
  const fetchWallet = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingWallet(true);
      const res = await get<{ success: boolean; data: WalletData }>('/wallet');
      setWallet(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load wallet';
      setError(msg);
    } finally {
      setIsLoadingWallet(false);
    }
  }, [isAuthenticated]);

  // WHAT: Fetch transactions with pagination
  const fetchTransactions = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingTx(true);
      const res = await get<{
        success: boolean;
        data: Transaction[];
        pagination: Pagination;
      }>(`/wallet/transactions?page=${page}&perPage=20`);

      const tx = res.data || [];
      const pag = res.pagination;

      if (append) {
        setTransactions((prev) => [...prev, ...tx]);
      } else {
        setTransactions(tx);

        // WHAT: Compute quick stats from first page
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        let earned = 0;
        let completed = 0;

        for (const t of tx) {
          const d = new Date(t.createdAt);
          if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
            if (t.type === 'earnings') {
              earned += t.amount.kobo;
              completed++;
            }
          }
        }
        setEarnedThisMonth(earned);
        setTasksCompleted(completed);
      }

      setPagination(pag);
    } catch {
      console.warn('Failed to load transactions');
    } finally {
      setIsLoadingTx(false);
    }
  }, [isAuthenticated]);

  // WHAT: Load initial data
  useEffect(() => {
    fetchWallet();
    fetchTransactions(1, false);
  }, [fetchWallet, fetchTransactions]);

  // WHAT: Load more transactions
  function loadMore() {
    if (!pagination || pagination.page >= pagination.totalPages || isLoadingTx) return;
    fetchTransactions(pagination.page + 1, true);
  }

  // WHAT: Toggle expanded transaction row
  function toggleExpand(id: string) {
    setExpandedTx((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // WHAT: Refresh all data
  async function handleRefresh() {
    setError(null);
    await Promise.all([
      fetchWallet(),
      fetchTransactions(1, false),
    ]);
  }

  if (!isAuthenticated) {
    return null;
  }

  const balanceKobo = wallet?.balance?.kobo ?? user?.wallet?.balanceKobo ?? 0;
  const escrowKobo = wallet?.escrow?.kobo ?? user?.wallet?.escrowKobo ?? 0;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <div className="min-h-screen bg-gray-50 safe-all">
      {/* WHAT: Gradient brand header */}
      <div className="bg-gradient-to-b from-brand-dark to-brand px-4 pb-8 pt-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-white">
            Wallet
          </h1>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoadingWallet}
            className="tap-target flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingWallet ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Balance display */}
        {isLoadingWallet ? (
          <div className="space-y-3 py-4">
            <div className="h-3 w-24 skeleton rounded" />
            <div className="h-10 w-48 skeleton rounded" />
            <div className="h-3 w-36 skeleton rounded" />
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/70">Total Balance</p>
            <p className="font-display text-4xl font-bold text-white">
              ₦{formatNaira(balanceKobo)}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <Lock className="h-3.5 w-3.5 text-gold" />
              <p className="text-sm text-white/70">
                ₦{formatNaira(escrowKobo)} in escrow
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 flex gap-3">
          <Link
            href="/wallet/fund"
            className="tap-target flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 font-bold text-white shadow-sm transition-colors hover:bg-gold-dark"
          >
            <Wallet className="h-5 w-5" />
            Fund Wallet
          </Link>
          <Link
            href="/wallet/withdraw"
            className="tap-target flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-white/40 px-4 py-3 font-semibold text-white transition-colors hover:bg-white/10"
          >
            <ArrowUpRight className="h-5 w-5" />
            Withdraw
          </Link>
        </div>
      </div>

      {/* WHAT: Error banner */}
      {error && (
        <div className="mx-4 mt-4 sm:mx-6">
          <div className="rounded-lg bg-danger-light px-4 py-3 text-sm text-danger">
            {error}
            <button
              type="button"
              onClick={handleRefresh}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* WHAT: Quick stats */}
      <div className="mx-4 mt-4 sm:mx-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light">
                <TrendingUp className="h-4 w-4 text-brand" />
              </div>
              <p className="text-xs font-medium text-gray-500">Earned This Month</p>
            </div>
            <p className="mt-2 font-display text-xl font-bold text-gray-900">
              ₦{formatNaira(earnedThisMonth)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-light">
                <CheckCircle className="h-4 w-4 text-gold-dark" />
              </div>
              <p className="text-xs font-medium text-gray-500">Tasks Completed</p>
            </div>
            <p className="mt-2 font-display text-xl font-bold text-gray-900">
              {tasksCompleted}
            </p>
          </div>
        </div>
      </div>

      {/* WHAT: Transaction history */}
      <div className="mx-4 mt-4 pb-8 sm:mx-6">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-display text-sm font-bold text-gray-900">
              Transaction History
            </h2>
            {pagination && (
              <span className="text-xs text-gray-500">{pagination.total} total</span>
            )}
          </div>

          {transactions.length === 0 && !isLoadingTx ? (
            <div className="py-12 text-center">
              <Banknote className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">No transactions yet</p>
              <p className="mt-1 text-xs text-gray-500">
                Fund your wallet or complete a task to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => {
                const positive = isPositive(tx.type);
                const cat = getTxCategory(tx.type);
                const expanded = expandedTx.has(tx.id);

                let amountColor = 'text-green-600';
                let prefix = '+';
                if (cat === 'debit') { amountColor = 'text-red-600'; prefix = '-'; }
                else if (cat === 'escrow') { amountColor = 'text-amber-600'; prefix = ''; }

                return (
                  <div key={tx.id}>
                    {/* Main row — tappable to expand */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(tx.id)}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50"
                    >
                      {/* Icon */}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TxIconBg({ type: tx.type })}`}>
                        <TxIcon type={tx.type} />
                      </div>

                      {/* Label + date */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {TX_LABELS[tx.type] || tx.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                      </div>

                      {/* Amount + expand indicator */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-bold ${amountColor}`}>
                          {prefix}₦{formatNaira(tx.amount.kobo)}
                        </span>
                        {expanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded detail panel */}
                    {expanded && (
                      <div className="border-t border-gray-50 bg-gray-50/50 px-5 py-4">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                          {tx.reference && (
                            <>
                              <p className="text-xs font-medium text-gray-500">Reference</p>
                              <p className="text-xs font-mono text-gray-700 text-right break-all">{tx.reference}</p>
                            </>
                          )}
                          {tx.taskTitle && (
                            <>
                              <p className="text-xs font-medium text-gray-500">Task</p>
                              <p className="text-xs text-gray-700 text-right">{tx.taskTitle}</p>
                            </>
                          )}
                          {tx.note && (
                            <>
                              <p className="text-xs font-medium text-gray-500">Note</p>
                              <p className="text-xs text-gray-700 text-right">{tx.note}</p>
                            </>
                          )}
                          {tx.balanceBefore && (
                            <>
                              <p className="text-xs font-medium text-gray-500">Balance Before</p>
                              <p className="text-xs text-gray-700 text-right">₦{formatNaira(tx.balanceBefore.kobo)}</p>
                            </>
                          )}
                          {tx.balanceAfter && (
                            <>
                              <p className="text-xs font-medium text-gray-500">Balance After</p>
                              <p className="text-xs text-gray-700 text-right">₦{formatNaira(tx.balanceAfter.kobo)}</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingTx}
                className="tap-target flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
              >
                {isLoadingTx ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isLoadingTx ? 'Loading...' : `Load more (${pagination!.total - transactions.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-safe-bottom" />
    </div>
  );
}
