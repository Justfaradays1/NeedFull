// WHAT: Card payment funding page (route: /wallet/fund/card)
// WHY: Users fund their wallet instantly via Paystack card payment — fee is 1.5% + ₦100 per transaction
// FUTURE: Add saved cards, add Apple Pay/Google Pay, add payment method management

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Lock, Wallet, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useIsAuthenticated, useAuthUser, useAuthInit } from '@/store';
import { post } from '@/lib/apiClient';

// WHAT: Fee calculation for card payments
// WHY: Paystack charges 1.5% + ₦100 per transaction, capped at ₦2000 maximum fee
function calculateFee(amountNaira: number): number {
  if (amountNaira <= 0) return 0;
  const fee = Math.ceil(amountNaira * 0.015) + 100;
  return Math.min(fee, 2000);
}

// WHAT: Format naira for display
function fmt(amount: number): string {
  return amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// WHAT: Convert kobo to naira string
function fmtKobo(kobo: number): string {
  return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// WHAT: Inner component that uses useSearchParams — wrapped in Suspense below
function CardPaymentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  useAuthInit();

  const [amount, setAmount] = useState('');
  const [isInitiating, setIsInitiating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedAmount, setVerifiedAmount] = useState<number | null>(null);

  // WHAT: Handle return from Paystack redirect — check for ?reference= in URL
  useEffect(() => {
    if (!isAuthenticated) return;

    const ref = searchParams.get('reference');
    const trxref = searchParams.get('trxref');

    const reference = ref || trxref;

    if (reference && !isVerifying && verifiedAmount === null) {
      verifyPayment(reference);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isAuthenticated]);

  // WHAT: Verify payment after returning from Paystack
  async function verifyPayment(reference: string) {
    setIsVerifying(true);
    try {
      const res = await post<{
        success: boolean;
        message: string;
        data?: { balance?: { naira: number } };
      }>(`/wallet/fund/card/verify/${reference}`);

      // WHAT: Check if verification succeeded
      if (res.success) {
        // WHAT: Extract amount from the message: "₦X added to your wallet"
        const match = res.message.match(/₦([\d,]+)/);
        if (match) {
          setVerifiedAmount(parseFloat(match[1].replace(/,/g, '')));
        } else {
          setVerifiedAmount(0);
        }

        toast.success(res.message || 'Payment successful!');

        // WHAT: Redirect to wallet after 2 seconds
        setTimeout(() => {
          router.push('/wallet');
        }, 2000);
      } else {
        toast.error(res.message || 'Payment verification failed');
        setIsVerifying(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      toast.error(msg);
      setIsVerifying(false);
    }
  }

  // WHAT: Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const amountNum = parseFloat(amount) || 0;
  const fee = calculateFee(amountNum);
  const total = amountNum + fee;

  function handleAmountChange(value: string) {
    // WHAT: Only allow digits and decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    // WHAT: Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    // WHAT: Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) return;
    setAmount(cleaned);
  }

  async function handlePay() {
    if (amountNum < 500) {
      toast.error('Minimum amount is ₦500');
      return;
    }

    setIsInitiating(true);
    try {
      // WHAT: Build callback URL — current page URL without query params
      const baseUrl = window.location.origin;
      const callbackUrl = `${baseUrl}/wallet/fund/card`;

      // WHAT: Initiate Paystack payment with the total amount
      const res = await post<{
        success: boolean;
        data: {
          authorizationUrl: string;
          reference: string;
        };
      }>('/wallet/fund/card/initiate', {
        amountNaira: total,
        callbackUrl,
      });

      if (res.success && res.data.authorizationUrl) {
        // WHAT: Redirect to Paystack payment page
        window.location.href = res.data.authorizationUrl;
      } else {
        toast.error('Failed to initiate payment. Please try again.');
        setIsInitiating(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate payment';
      toast.error(msg);
      setIsInitiating(false);
    }
  }

  // WHAT: ——— VERIFYING STATE ———
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 safe-all flex items-center justify-center">
        <div className="text-center px-6">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand" />
          <p className="mt-4 font-display text-lg font-bold text-gray-900">
            Verifying your payment...
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Please wait while we confirm your transaction
          </p>
        </div>
      </div>
    );
  }

  // WHAT: ——— SUCCESS STATE ———
  if (verifiedAmount !== null) {
    return (
      <div className="min-h-screen bg-gray-50 safe-all flex items-center justify-center">
        <div className="text-center px-6">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <p className="font-display text-2xl font-bold text-gray-900">
            Payment Successful!
          </p>
          <p className="mt-2 text-lg font-semibold text-green-600">
            ₦{fmt(verifiedAmount)} added to your wallet
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Redirecting to wallet...
          </p>
          <Link
            href="/wallet"
            className="tap-target mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            <Wallet className="h-5 w-5" />
            Go to Wallet
          </Link>
        </div>
      </div>
    );
  }

  // WHAT: ——— FORM STATE ———
  return (
    <div className="min-h-screen bg-gray-50 safe-all">
      {/* WHAT: Header */}
      <div className="bg-brand px-4 pb-6 pt-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/wallet/fund"
            className="tap-target -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-lg font-bold text-white">
            Pay with Card
          </h1>
        </div>
      </div>

      <div className="-mt-2 space-y-4 px-4 pb-8 sm:px-6">
        {/* WHAT: Warning banner about fees */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-800">
                Fees apply: 1.5% + ₦100 per transaction
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                For zero-fee funding,{' '}
                <Link
                  href="/wallet/fund"
                  className="font-semibold text-amber-800 underline hover:text-amber-900"
                >
                  use Bank Transfer instead
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* WHAT: Amount input card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
          <h2 className="font-display text-sm font-bold text-gray-900">
            Enter amount
          </h2>

          <div className="mt-4 space-y-1">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount to fund
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-500">
                ₦
              </span>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={isInitiating}
                className={`tap-target w-full rounded-xl border bg-white px-4 py-4 pl-10 text-2xl font-bold tracking-wider focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50 ${
                  amountNum > 0 && amountNum < 500
                    ? 'border-danger'
                    : 'border-gray-300 focus:border-brand'
                }`}
              />
            </div>
            {amountNum > 0 && amountNum < 500 && (
              <p className="text-xs text-danger">Minimum amount is ₦500</p>
            )}
          </div>

          {/* WHAT: Fee breakdown — updates in real-time */}
          {amountNum >= 500 && (
            <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Fee (1.5% + ₦100)</span>
                <span className="font-medium text-gray-900">₦{fmt(fee)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700">Total charged</span>
                  <span className="font-bold text-gray-900">₦{fmt(total)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">You&apos;ll receive</span>
                <span className="font-semibold text-green-700">₦{fmt(amountNum)}</span>
              </div>
            </div>
          )}
        </div>

        {/* WHAT: Pay button */}
        <button
          type="button"
          onClick={handlePay}
          disabled={amountNum < 500 || isInitiating}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-4 font-bold text-white shadow-sm transition-all hover:bg-gold-dark focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 disabled:opacity-50"
        >
          {isInitiating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Redirecting to Paystack...
            </>
          ) : (
            <>
              <ExternalLink className="h-5 w-5" />
              Pay ₦{fmt(amountNum >= 500 ? total : 0)}
            </>
          )}
        </button>

        {/* WHAT: Security note */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Lock className="h-3.5 w-3.5" />
          <span>
            Powered by <strong>Paystack</strong> &middot; PCI DSS compliant
          </span>
        </div>
      </div>

      <div className="h-safe-bottom" />
    </div>
  );
}

// WHAT: Wrapper with Suspense boundary for useSearchParams
// WHY: Next.js requires Suspense when using useSearchParams in client components
export default function CardPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 safe-all flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand" />
        </div>
      }
    >
      <CardPaymentInner />
    </Suspense>
  );
}
