// WHAT: Withdrawal request page (route: /wallet/withdraw)
// WHY: Users withdraw wallet funds to their Nigerian bank account — ₦50 flat fee per withdrawal
// FUTURE: Save bank details for repeat withdrawals, add scheduled withdrawals, add minimum balance alerts

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet, Banknote, Search, ChevronDown, Check, Loader2, Clock, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useIsAuthenticated, useAuthUser, useAuthInit } from '@/store';
import { get, post } from '@/lib/apiClient';

const WITHDRAWAL_FEE_NAIRA = 50;

// WHAT: Nigerian banks for the searchable select
const NIGERIAN_BANKS = [
  { code: '058', name: 'GTBank' },
  { code: '011', name: 'First Bank' },
  { code: '044', name: 'Access Bank' },
  { code: '033', name: 'UBA' },
  { code: '057', name: 'Zenith Bank' },
  { code: '999', name: 'Opay' },
  { code: '999', name: 'Palmpay' },
  { code: '999', name: 'Kuda' },
  { code: '999', name: 'Moniepoint' },
  { code: '232', name: 'Sterling Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '221', name: 'Stanbic IBTC' },
  { code: '082', name: 'Keystone Bank' },
  { code: '214', name: 'Union Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '084', name: 'Ecobank' },
  { code: '068', name: 'Heritage Bank' },
  { code: '070', name: 'FCMB' },
];

// WHAT: Format naira
function fmt(amount: number): string {
  return amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// WHAT: Format date
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// WHAT: Mask account number for display
function maskAccount(acc: string): string {
  if (!acc || acc.length < 4) return acc;
  return `****${acc.slice(-4)}`;
}

// WHAT: Status badge component for withdrawal history
function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700"><CheckCircle className="h-3 w-3" /> Completed</span>;
  }
  if (status === 'failed') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700"><XCircle className="h-3 w-3" /> Failed</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700"><Clock className="h-3 w-3" /> Pending</span>;
}

type PageState = 'form' | 'review' | 'submitting' | 'success';

// WHAT: Withdrawal history entry
interface Withdrawal {
  id: string;
  amount: { kobo: number; naira: number };
  fee: { kobo: number; naira: number };
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: string;
  failureReason: string | null;
  createdAt: string;
}

export default function WithdrawPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  useAuthInit();

  // WHAT: Form state
  const [pageState, setPageState] = useState<PageState>('form');
  const [amount, setAmount] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<{ code: string; name: string } | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNameLoading, setAccountNameLoading] = useState(false);
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [withdrawalResult, setWithdrawalResult] = useState<{
    amount: number;
    bankName: string;
    accountNumber: string;
  } | null>(null);

  // WHAT: Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // WHAT: Withdrawal history
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // WHAT: Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // WHAT: Fetch withdrawal history
  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setHistoryLoading(true);
      const res = await get<{ success: boolean; data: Withdrawal[] }>('/wallet/withdraw?perPage=20');
      setWithdrawals(res.data || []);
    } catch {
      // Silently fail — history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // WHAT: Close bank dropdown on outside click
  useEffect(() => {
    function handleClick() { setBankDropdownOpen(false); }
    if (bankDropdownOpen) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [bankDropdownOpen]);

  if (!isAuthenticated) {
    return null;
  }

  const balanceKobo = user?.wallet?.balanceKobo ?? 0;
  const balanceNaira = balanceKobo / 100;
  const amountNum = parseFloat(amount) || 0;
  const totalDeduction = amountNum + WITHDRAWAL_FEE_NAIRA;
  const netReceived = amountNum;

  const filteredBanks = NIGERIAN_BANKS.filter(
    (b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()),
  );

  // WHAT: Resolve account name via Paystack
  async function handleAccountNumberChange(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(cleaned);
    setAccountName('');
    setErrors((prev) => ({ ...prev, accountNumber: '' }));

    if (cleaned.length === 10 && selectedBank) {
      setAccountNameLoading(true);
      try {
        const res = await get<{ success: boolean; data: { accountName: string } }>(
          `/bank/resolve?accountNumber=${cleaned}&bankCode=${selectedBank.code}`,
        );
        if (res.success && res.data.accountName) {
          setAccountName(res.data.accountName);
          setErrors((prev) => ({ ...prev, accountName: '' }));
        }
      } catch {
        setErrors((prev) => ({
          ...prev,
          accountNumber: 'Could not verify account. Please check and try again.',
        }));
      } finally {
        setAccountNameLoading(false);
      }
    }
  }

  // WHAT: Select bank from dropdown
  function selectBank(bank: { code: string; name: string }) {
    setSelectedBank(bank);
    setBankSearch(bank.name);
    setBankDropdownOpen(false);
    setAccountName('');
    setErrors((prev) => ({ ...prev, bank: '' }));
    // Re-trigger account resolution if account number already entered
    if (accountNumber.length === 10) {
      handleAccountNumberChange(accountNumber);
    }
  }

  // WHAT: Validate form before review
  function validateForm(): boolean {
    const e: Record<string, string> = {};
    if (!amountNum || amountNum < 100) e.amount = 'Minimum withdrawal is ₦100';
    if (totalDeduction > balanceNaira) e.amount = `Insufficient balance. You need ₦${fmt(totalDeduction)}`;
    if (!selectedBank) e.bank = 'Select your bank';
    if (accountNumber.length !== 10) e.accountNumber = 'Enter a valid 10-digit account number';
    if (!accountName.trim()) e.accountName = 'Account name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // WHAT: Proceed to review step
  function handleReview() {
    if (validateForm()) {
      setPageState('review');
    }
  }

  // WHAT: Submit withdrawal
  async function handleSubmit() {
    if (!selectedBank) return;
    setPageState('submitting');
    try {
      const res = await post<{
        success: boolean;
        message: string;
        data: {
          amount: { naira: number };
          fee: { naira: number };
          accountNumber: string;
        };
      }>('/wallet/withdraw', {
        amountNaira: amountNum,
        bankCode: selectedBank.code,
        accountNumber,
        accountName: accountName.trim(),
      });

      if (res.success) {
        setWithdrawalResult({
          amount: res.data.amount.naira,
          bankName: selectedBank.name,
          accountNumber: res.data.accountNumber,
        });
        setPageState('success');
        toast.success('Withdrawal request submitted!');
        // Refresh history
        fetchHistory();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Withdrawal failed';
      toast.error(msg);
      setPageState('review');
    }
  }

  // WHAT: ——— SUCCESS STATE ———
  if (pageState === 'success' && withdrawalResult) {
    return (
      <div className="min-h-screen bg-gray-50 safe-all">
        <div className="bg-brand px-4 pb-6 pt-4 sm:px-6">
          <div className="mb-4 flex items-center gap-3">
            <Link href="/wallet/fund" className="tap-target -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-lg font-bold text-white">Withdrawal Sent</h1>
          </div>
        </div>

        <div className="mx-4 -mt-4 sm:mx-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <p className="font-display text-xl font-bold text-gray-900">Withdrawal Request Submitted</p>
            <p className="mt-4 text-lg font-bold text-gray-900">₦{fmt(withdrawalResult.amount)}</p>
            <p className="mt-1 text-sm text-gray-600">
              will be sent to <strong>{withdrawalResult.bankName}</strong> {maskAccount(withdrawalResult.accountNumber)}
            </p>
            <p className="mt-1 text-sm text-gray-500">within 24 hours</p>

            <Link
              href="/wallet"
              className="tap-target mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
            >
              <Wallet className="h-5 w-5" />
              Return to Wallet
            </Link>
          </div>
        </div>

        <div className="h-safe-bottom" />
      </div>
    );
  }

  // WHAT: ——— REVIEW STATE ———
  if (pageState === 'review' || pageState === 'submitting') {
    return (
      <div className="min-h-screen bg-gray-50 safe-all">
        <div className="bg-brand px-4 pb-6 pt-4 sm:px-6">
          <div className="mb-4 flex items-center gap-3">
            <button type="button" onClick={() => setPageState('form')} className="tap-target -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-bold text-white">Confirm Withdrawal</h1>
          </div>
        </div>

        <div className="mx-4 -mt-4 space-y-4 pb-8 sm:mx-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
            <h2 className="font-display text-sm font-bold text-gray-900">Review Details</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="text-sm font-bold text-gray-900">₦{fmt(amountNum)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-600">Fee</span>
                <span className="text-sm font-bold text-gray-900">₦{fmt(WITHDRAWAL_FEE_NAIRA)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3">
                <span className="text-sm font-medium text-amber-700">Total Deducted</span>
                <span className="text-sm font-bold text-amber-700">₦{fmt(totalDeduction)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
                <span className="text-sm font-medium text-green-700">You&apos;ll Receive</span>
                <span className="text-sm font-bold text-green-700">₦{fmt(netReceived)}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Bank</p>
                <p className="text-sm font-semibold text-gray-900">{selectedBank?.name}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Account Number</p>
                <p className="text-sm font-semibold text-gray-900">{accountNumber}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Account Name</p>
                <p className="text-sm font-semibold text-gray-900">{accountName}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={pageState === 'submitting'}
            className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-4 font-bold text-white shadow-sm transition-all hover:bg-brand-dark disabled:opacity-50"
          >
            {pageState === 'submitting' ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
            ) : (
              <><ArrowUpRight className="h-5 w-5" /> Request Withdrawal</>
            )}
          </button>
        </div>

        <div className="h-safe-bottom" />
      </div>
    );
  }

  // WHAT: ——— FORM STATE ———
  return (
    <div className="min-h-screen bg-gray-50 safe-all">
      {/* WHAT: Header with mini balance card */}
      <div className="bg-gradient-to-b from-brand-dark to-brand px-4 pb-6 pt-4 sm:px-6">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/wallet"
            className="tap-target -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-lg font-bold text-white">
            Withdraw
          </h1>
        </div>

        <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/70">Available Balance</p>
            <span className="font-display text-xl font-bold text-white">
              ₦{fmt(balanceNaira)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-8 sm:px-6 -mt-2">
        {/* WHAT: Amount input */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
          <h2 className="font-display text-sm font-bold text-gray-900">Amount to withdraw</h2>

          <div className="mt-4 space-y-1">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-500">₦</span>
              <input
                id="amount"
                type="number"
                min="100"
                step="100"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrors((prev) => ({ ...prev, amount: '' })); }}
                className={`tap-target w-full rounded-xl border bg-white px-4 py-4 pl-10 text-2xl font-bold focus:ring-2 focus:ring-brand/20 ${
                   errors.amount ? 'border-danger' : 'border-gray-300 focus:border-brand'
                }`}
              />
            </div>
            {errors.amount && <p className="text-xs text-danger">{errors.amount}</p>}

            {/* Balance hint */}
            {amountNum > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                Available: <span className="font-medium text-gray-700">₦{fmt(balanceNaira)}</span>
                {totalDeduction <= balanceNaira ? (
                  <span className="ml-2 text-green-600">✓ Sufficient</span>
                ) : (
                  <span className="ml-2 text-danger">Insufficient — you need ₦{fmt(totalDeduction)}</span>
                )}
              </div>
            )}
          </div>

          {/* Fee breakdown */}
          {amountNum >= 100 && totalDeduction <= balanceNaira && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Fee (₦50 flat)</span>
                <span className="font-medium text-gray-900">₦{fmt(WITHDRAWAL_FEE_NAIRA)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-gray-600">You&apos;ll receive</span>
                <span className="font-semibold text-green-700">₦{fmt(netReceived)}</span>
              </div>
            </div>
          )}
        </div>

        {/* WHAT: Bank selection — searchable dropdown */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
          <h2 className="font-display text-sm font-bold text-gray-900">Bank account details</h2>

          <div className="mt-4 space-y-4">
            {/* Bank select */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Your bank</label>
              <div className="relative">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setBankDropdownOpen(!bankDropdownOpen); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') setBankDropdownOpen(!bankDropdownOpen); }}
                  className={`tap-target flex w-full items-center gap-2 rounded-lg border bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-brand/20 ${
                    errors.bank ? 'border-danger' : 'border-gray-300'
                  }`}
                >
                  <Search className="h-4 w-4 shrink-0 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search your bank..."
                    value={bankSearch}
                    onChange={(e) => { setBankSearch(e.target.value); setBankDropdownOpen(true); }}
                    onFocus={() => setBankDropdownOpen(true)}
                    className="min-w-0 flex-1 bg-transparent outline-none"
                  />
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>

                {bankDropdownOpen && (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {filteredBanks.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500">No banks found</p>
                    ) : (
                      filteredBanks.map((bank) => (
                        <button
                          key={bank.code + bank.name}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); selectBank(bank); }}
                          className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-brand-light ${
                            selectedBank?.name === bank.name ? 'bg-brand-light font-semibold text-brand' : 'text-gray-700'
                          }`}
                        >
                          {selectedBank?.name === bank.name && <Check className="h-4 w-4 shrink-0 text-brand" />}
                          {bank.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {errors.bank && <p className="text-xs text-danger">{errors.bank}</p>}
            </div>

            {/* Account number */}
            <div className="space-y-1.5">
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                Account number
              </label>
              <input
                id="accountNumber"
                type="text"
                inputMode="numeric"
                placeholder="0123456789"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                className={`tap-target w-full rounded-lg border bg-white px-4 py-3 text-lg font-bold tracking-widest focus:ring-2 focus:ring-brand/20 ${
                   errors.accountNumber ? 'border-danger' : 'border-gray-300 focus:border-brand'
                }`}
              />
              {errors.accountNumber && <p className="text-xs text-danger">{errors.accountNumber}</p>}
            </div>

            {/* Account name (auto-filled) */}
            <div className="space-y-1.5">
              <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                Account name
              </label>
              <div className="relative">
                <input
                  id="accountName"
                  type="text"
                  placeholder={accountNameLoading ? 'Verifying...' : 'Auto-fills from account number'}
                  value={accountName}
                  onChange={(e) => { setAccountName(e.target.value); setErrors((prev) => ({ ...prev, accountName: '' })); }}
                  className={`tap-target w-full rounded-lg border bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-brand/20 ${
                     errors.accountName ? 'border-danger' : 'border-gray-300 focus:border-brand'
                  }`}
                />
                {accountNameLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand" />
                )}
                {!accountNameLoading && accountName && (
                  <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
                )}
              </div>
              {errors.accountName && <p className="text-xs text-danger">{errors.accountName}</p>}
              {accountName && !errors.accountName && (
                <p className="text-xs text-green-600">Account verified ✓</p>
              )}
            </div>
          </div>
        </div>

        {/* Review button */}
        <button
          type="button"
          onClick={handleReview}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-4 font-bold text-white shadow-sm transition-all hover:bg-brand-dark"
        >
          Continue to Review
        </button>

        {/* Fee note */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3">
          <p className="text-xs font-medium text-amber-700">
            ₦50 flat withdrawal fee applies. You&apos;ll receive the full amount after fee deduction.
            Withdrawals are processed and sent to your bank within 24 hours.
          </p>
        </div>

        {/* WHAT: Withdrawal history */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-display text-sm font-bold text-gray-900">Withdrawal History</h2>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="py-8 text-center">
              <Banknote className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No withdrawals yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    w.status === 'completed' ? 'bg-green-100' : w.status === 'failed' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    {w.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600" />
                      : w.status === 'failed' ? <XCircle className="h-4 w-4 text-red-600" />
                      : <Clock className="h-4 w-4 text-amber-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">₦{fmt(w.amount.naira)}</p>
                      <StatusBadge status={w.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {w.bankName || 'Bank'} {maskAccount(w.accountNumber)} &middot; {fmtDate(w.createdAt)}
                    </p>
                    {w.failureReason && <p className="text-xs text-danger mt-0.5">{w.failureReason}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-safe-bottom" />
    </div>
  );
}
