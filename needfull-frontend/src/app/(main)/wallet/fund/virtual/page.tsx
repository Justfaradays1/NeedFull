// WHAT: Virtual account funding page (route: /wallet/fund/virtual)
// WHY: Users get a dedicated NUBAN account number to transfer funds — deposits credit automatically via Monnify webhooks
// FUTURE: Add multiple bank options, add QR code, add saved beneficiary shortcut

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Wallet, Banknote, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useIsAuthenticated, useAuthUser, useAuthInit } from '@/store';
import { get } from '@/lib/apiClient';

// WHAT: Virtual account data from API
interface VirtualAccount {
  accountNumber: string;
  bankName: string;
  accountName: string;
  description: string;
}

// WHAT: Single transaction in history
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

// WHAT: Convert kobo to naira string for display
function formatNaira(kobo: number): string {
  return (kobo / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// WHAT: Format a date string to a readable format
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VirtualFundPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  useAuthInit();

  // WHAT: Virtual account state
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WHAT: Transaction history state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // WHAT: Copy state
  const [copied, setCopied] = useState(false);

  // WHAT: Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // WHAT: Fetch virtual account and transaction history on mount
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);

      // WHAT: Get or create virtual account
      // WHY: API creates one if it doesn't exist yet
      const res = await get<{
        success: boolean;
        data: {
          virtualAccount: VirtualAccount;
        };
      }>('/wallet/fund/virtual');

      setVirtualAccount(res.data.virtualAccount);

      // WHAT: Fetch wallet transactions
      // WHY: Show virtual deposit history
      try {
        setTransactionsLoading(true);
        const txRes = await get<{
          success: boolean;
          data: Transaction[];
        }>('/wallet/transactions?perPage=50');

        // WHAT: Filter to only virtual/monnify deposits
        const virtualTx = (txRes.data || []).filter(
          (tx) => tx.type === 'monnify_deposit',
        );
        setTransactions(virtualTx);
      } catch {
        // Transactions are non-critical — silently fail
        console.warn('Failed to load transaction history');
      } finally {
        setTransactionsLoading(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load virtual account. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WHAT: Refresh data (pull-to-refresh style)
  async function handleRefresh() {
    toast.success('Refreshing...');
    await fetchData();
  }

  if (!isAuthenticated) {
    return null;
  }

  // WHAT: Copy account number to clipboard with toast feedback
  async function copyAccountNumber() {
    if (!virtualAccount) return;
    try {
      await navigator.clipboard.writeText(virtualAccount.accountNumber);
      setCopied(true);
      toast.success('Account number copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  }

  const balanceKobo = user?.wallet?.balanceKobo ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 safe-all">
      {/* WHAT: Brand green header with balance */}
      <div className="bg-brand px-4 pb-6 pt-4 sm:px-6">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/wallet/fund"
            className="tap-target -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-lg font-bold text-white">
            Your Personal Account
          </h1>
          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="tap-target ml-auto flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="rounded-xl bg-white/10 px-5 py-4 backdrop-blur-sm">
          <p className="text-sm font-medium text-white/70">Current Balance</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <Wallet className="h-5 w-5 text-gold" />
            <span className="font-display text-3xl font-bold text-white">
              ₦{formatNaira(balanceKobo)}
            </span>
          </div>
        </div>
      </div>

      {/* WHAT: Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-brand" />
          <p className="mt-4 text-sm font-medium text-gray-600">
            Setting up your personal account...
          </p>
          <p className="mt-1 text-xs text-gray-400">
            This should take just a moment
          </p>
        </div>
      )}

      {/* WHAT: Error state */}
      {!isLoading && error && (
        <div className="px-4 py-8 sm:px-6">
          <div className="rounded-xl border border-danger/20 bg-danger-light p-6 text-center">
            <p className="text-sm font-medium text-danger">{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="tap-target mt-4 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* WHAT: Virtual account loaded */}
      {!isLoading && !error && virtualAccount && (
        <>
          {/* Virtual account card */}
          <div className="mx-4 -mt-4 sm:mx-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-gray-900">
                  Your dedicated account
                </h2>
                <span className="inline-flex items-center rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-bold text-brand">
                  AUTO-CONFIRM
                </span>
              </div>

              {/* Bank name */}
              <div className="mt-3 flex items-center gap-3 rounded-lg bg-brand-light px-4 py-3">
                <Banknote className="h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-brand-dark">Bank</p>
                  <p className="text-sm font-bold text-brand">{virtualAccount.bankName}</p>
                </div>
              </div>

              {/* Account number with copy */}
              <div className="mt-2 flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500">Account Number</p>
                  <p className="font-display text-2xl font-bold tracking-widest text-gray-900">
                    {virtualAccount.accountNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyAccountNumber}
                  className="tap-target flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm transition-colors hover:bg-gray-100"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>

              {/* Account name */}
              <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium text-gray-500">Account Name</p>
                <p className="text-sm font-semibold text-gray-900">{virtualAccount.accountName}</p>
              </div>

              {/* Transfer info */}
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-700">
                  Transfer any amount to this number from any bank.
                </p>
                <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                  <Check className="h-4 w-4" />
                  Credited automatically within 5 minutes
                </p>
              </div>

              {/* Fee note */}
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-xs font-medium text-amber-700">
                  ~₦30 flat fee charged by your bank for transfers
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 px-4 sm:px-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
              <h2 className="font-display text-sm font-bold text-gray-900">
                How to fund your wallet
              </h2>
              <ol className="mt-4 space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                    1
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      Open your bank app or USSD
                    </p>
                    <p className="text-xs text-gray-500">
                      Use GTBank, Opay, Palmpay, Kuda, or any Nigerian bank
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                    2
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      Transfer to the account number above
                    </p>
                    <p className="text-xs text-gray-500">
                      Send any amount — there&apos;s no minimum or maximum
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                    3
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      Your NeedFull wallet credits automatically
                    </p>
                    <p className="text-xs text-gray-500">
                      Funds appear in your wallet within 5 minutes — no manual confirmation needed
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Transaction history */}
          <div className="mt-4 px-4 pb-8 sm:px-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
              <h2 className="font-display text-sm font-bold text-gray-900">
                Deposit History
              </h2>

              {transactionsLoading ? (
                <div className="mt-4 flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="mt-4 rounded-lg bg-gray-50 py-8 text-center">
                  <Wallet className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">
                    No virtual deposits yet
                  </p>
                  <p className="text-xs text-gray-400">
                    Transfer to your account above and it will appear here
                  </p>
                </div>
              ) : (
                <div className="mt-3 divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Transfer received
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(tx.createdAt)}
                        </p>
                        {tx.note && (
                          <p className="mt-0.5 text-xs text-gray-400 truncate max-w-[200px]">
                            {tx.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-bold text-green-600">
                          +₦{formatNaira(tx.amount.kobo)}
                        </p>
                        {tx.balanceAfter && (
                          <p className="text-xs text-gray-400">
                            Bal: ₦{formatNaira(tx.balanceAfter.kobo)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="h-safe-bottom" />
    </div>
  );
}
