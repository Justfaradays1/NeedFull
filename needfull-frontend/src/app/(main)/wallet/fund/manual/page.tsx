// WHAT: Manual bank transfer funding page (route: /wallet/fund/manual)
// WHY: Users send money to NeedFull's bank account, then submit the transfer reference for admin verification
// FUTURE: Add auto-verification via bank webhooks, add instant confirmation for known reference patterns

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, ChevronDown, Upload, CheckCircle, Clock, Banknote, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useIsAuthenticated, useAuthUser, useAuthInit } from '@/store';
import { post } from '@/lib/apiClient';

// WHAT: Common Nigerian banks for the sender bank select dropdown
// WHY: Students in Nigeria use these banks most frequently
const NIGERIAN_BANKS = [
  'GTBank',
  'First Bank',
  'Access Bank',
  'UBA',
  'Opay',
  'Palmpay',
  'Kuda',
  'Moniepoint',
  'Wema Bank',
  'Fidelity Bank',
  'Polaris Bank',
  'Union Bank',
  'Sterling Bank',
  'FCMB',
  'Stanbic IBTC',
  'Ecobank',
  'Providus Bank',
  'Suntrust Bank',
  'Zenith Bank',
  'Keystone Bank',
  'Unity Bank',
  'Heritage Bank',
  'Taj Bank',
  'Globus Bank',
  'Other',
];

// WHAT: NeedFull bank account details from environment variables
// WHY: Bank details are public info set at build time by platform admins
const BANK_NAME = process.env.NEXT_PUBLIC_NEEDFULL_BANK_NAME || 'Wema Bank';
const ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_NEEDFULL_ACCOUNT_NUMBER || '1234567890';
const ACCOUNT_NAME = process.env.NEXT_PUBLIC_NEEDFULL_ACCOUNT_NAME || 'NeedFull Platform Ltd';

// WHAT: Status of the manual transfer flow
type PageState = 'form' | 'submitting' | 'success';

// WHAT: Convert kobo to naira string for display
function formatNaira(kobo: number): string {
  return (kobo / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ManualFundPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  useAuthInit();

  // WHAT: Form state
  const [pageState, setPageState] = useState<PageState>('form');
  const [amount, setAmount] = useState<string>('');
  const [bankReference, setBankReference] = useState<string>('');
  const [senderBank, setSenderBank] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submittedTransfer, setSubmittedTransfer] = useState<{
    transferId: string;
    amountNaira: number;
    bankReference: string;
    createdAt: string;
  } | null>(null);

  // WHAT: Error and validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // WHAT: Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // WHAT: Clean up receipt preview on unmount
  useEffect(() => {
    return () => {
      if (receiptPreview) {
        URL.revokeObjectURL(receiptPreview);
      }
    };
  }, [receiptPreview]);

  if (!isAuthenticated) {
    return null;
  }

  // WHAT: Copy account number to clipboard with toast feedback
  async function copyAccountNumber() {
    try {
      await navigator.clipboard.writeText(ACCOUNT_NUMBER);
      setCopied(true);
      toast.success('Account number copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  }

  // WHAT: Handle receipt file selection with preview
  function handleReceiptFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // WHAT: Validate file type and size
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB');
      return;
    }

    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  // WHAT: Remove selected receipt
  function removeReceipt() {
    setReceiptFile(null);
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
  }

  // WHAT: Validate form fields before submission
  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum < 100) {
      newErrors.amount = 'Enter an amount of at least ₦100';
    }
    if (!bankReference.trim()) {
      newErrors.bankReference = 'Enter the bank reference or description';
    }
    if (!senderBank) {
      newErrors.senderBank = 'Select your bank';
    }
    if (!senderName.trim()) {
      newErrors.senderName = 'Enter the name on your bank account';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // WHAT: Submit manual transfer — upload receipt, then POST to backend
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setPageState('submitting');

    try {
      let receiptUrl: string | undefined;

      // WHAT: Upload receipt to Cloudinary via backend if file selected
      if (receiptFile) {
        try {
          const formData = new FormData();
          formData.append('receipt', receiptFile);

          const uploadRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/upload/receipt`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${localStorage.getItem('nf_access_token')}`,
              },
              body: formData,
            },
          );

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            receiptUrl = uploadData.data?.url;
          } else {
            console.warn('Receipt upload failed, submitting without receipt');
          }
        } catch (uploadErr) {
          console.warn('Receipt upload error, submitting without receipt:', uploadErr);
        }
      }

      // WHAT: Submit manual transfer to API
      const amountNaira = parseFloat(amount);
      const result = await post<{
        success: boolean;
        message: string;
        data: {
          transferId: string;
          status: string;
          amount: { naira: number };
          bankReference: string;
          createdAt: string;
        };
      }>('/wallet/fund/manual', {
        amountNaira,
        bankReference: bankReference.trim(),
        senderBank,
        senderName: senderName.trim(),
        ...(receiptUrl ? { receiptUrl } : {}),
      });

      // WHAT: Store submission details for success screen
      setSubmittedTransfer({
        transferId: result.data.transferId,
        amountNaira: result.data.amount.naira,
        bankReference: result.data.bankReference,
        createdAt: result.data.createdAt,
      });

      setPageState('success');
      toast.success('Transfer submitted successfully!');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to submit transfer. Please try again.';
      toast.error(message);
      setPageState('form');
    }
  }

  // WHAT: ——— SUCCESS STATE ———
  if (pageState === 'success' && submittedTransfer) {
    const createdAtDate = new Date(submittedTransfer.createdAt);
    const formattedDate = createdAtDate.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = createdAtDate.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className="min-h-screen bg-gray-50 safe-all">
        {/* WHAT: Header */}
        <div className="bg-brand px-4 pb-6 pt-4 sm:px-6">
          <div className="mb-4 flex items-center gap-3">
            <Link
              href="/wallet/fund"
              className="tap-target -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-lg font-bold text-white">
              Transfer Submitted
            </h1>
          </div>
        </div>

        {/* WHAT: Success content */}
        <div className="px-4 py-8 sm:px-6">
          {/* Checkmark animation */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          {/* Amount highlight */}
          <div className="mb-6 text-center">
            <p className="text-sm font-medium text-gray-500">Amount Sent</p>
            <p className="font-display text-3xl font-bold text-gray-900">
              ₦{submittedTransfer.amountNaira.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Info card */}
          <div className="mb-6 space-y-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-center text-sm font-medium text-gray-900">
              Transfer submitted successfully!
            </p>
            <p className="text-center text-sm text-gray-600">
              We&apos;ll credit your wallet within 1–2 hours on business days.
            </p>
            <p className="text-center text-sm text-gray-600">
              We&apos;ll notify you immediately when it&apos;s confirmed.
            </p>
          </div>

          {/* Status tracking card */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-display text-sm font-bold text-gray-900">
              Tracking Details
            </h3>

            <div className="space-y-3">
              {/* Status step: Submitted */}
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Submitted</p>
                  <p className="text-xs text-gray-500">{formattedDate} at {formattedTime}</p>
                </div>
              </div>

              {/* Status step: Pending */}
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Pending Verification</p>
                  <p className="text-xs text-gray-500">Awaiting admin confirmation</p>
                </div>
              </div>

              {/* Status step: Credit (upcoming) */}
              <div className="flex items-start gap-3 opacity-40">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200">
                  <Wallet className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-500">Wallet Credited</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
              </div>
            </div>

            {/* Reference */}
            <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">Reference</p>
              <p className="text-sm font-medium text-gray-900">{submittedTransfer.bankReference}</p>
            </div>
          </div>

          {/* Return to wallet button */}
          <Link
            href="/wallet"
            className="tap-target flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            <Wallet className="h-5 w-5" />
            Return to Wallet
          </Link>
        </div>

        <div className="h-safe-bottom" />
      </div>
    );
  }

  // WHAT: ——— FORM STATE ———
  const amountNum = parseFloat(amount) || 0;

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
            Bank Transfer
          </h1>
        </div>

        <div className="rounded-xl bg-white/10 px-5 py-4 backdrop-blur-sm">
          <p className="text-sm font-medium text-white/70">Current Balance</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <Wallet className="h-5 w-5 text-gold" />
            <span className="font-display text-3xl font-bold text-white">
              ₦{formatNaira(user?.wallet?.balanceKobo ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* WHAT: Step 1 — Bank details */}
      <div className="mx-4 -mt-4 sm:mx-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-gray-900">
              Transfer to this account
            </h2>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-700">
              FREE
            </span>
          </div>

          {/* Bank name */}
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-brand-light px-4 py-3">
            <Banknote className="h-5 w-5 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-brand-dark">Bank</p>
              <p className="text-sm font-bold text-brand">{BANK_NAME}</p>
            </div>
          </div>

          {/* Account number with copy */}
          <div className="mt-2 flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500">Account Number</p>
              <p className="font-display text-xl font-bold tracking-widest text-gray-900">
                {ACCOUNT_NUMBER}
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
            <p className="text-sm font-semibold text-gray-900">{ACCOUNT_NAME}</p>
          </div>

          {/* Callout: no charges */}
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-center text-sm font-semibold text-green-800">
              No charges &mdash; 100% of your transfer goes to your wallet
            </p>
          </div>

          {/* Instruction */}
          <p className="mt-3 text-center text-xs text-gray-500">
            Transfer any amount from your bank app now, then fill in the details below
          </p>
        </div>
      </div>

      {/* WHAT: Step 2 — Submission form */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4 px-4 pb-8 sm:px-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-sm font-bold text-gray-900">
            Confirm your transfer
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Fill in the details of the transfer you just made
          </p>

          <div className="mt-4 space-y-4">
            {/* Amount sent */}
            <div className="space-y-1.5">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount sent <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-500">
                  ₦
                </span>
                <input
                  id="amount"
                  type="number"
                  min="100"
                  step="100"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={pageState === 'submitting'}
                  className={`tap-target w-full rounded-lg border bg-white px-8 py-3 pl-10 text-lg font-bold focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50 ${
                    errors.amount ? 'border-danger' : 'border-gray-300 focus:border-brand'
                  }`}
                />
              </div>
              {errors.amount && <p className="text-xs text-danger">{errors.amount}</p>}
            </div>

            {/* Bank reference */}
            <div className="space-y-1.5">
              <label htmlFor="bankReference" className="block text-sm font-medium text-gray-700">
                Bank reference / description <span className="text-danger">*</span>
              </label>
              <input
                id="bankReference"
                type="text"
                placeholder="e.g., NEFT to NeedFull or transaction ID"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                disabled={pageState === 'submitting'}
                className={`tap-target w-full rounded-lg border bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50 ${
                  errors.bankReference ? 'border-danger' : 'border-gray-300 focus:border-brand'
                }`}
              />
              {errors.bankReference && <p className="text-xs text-danger">{errors.bankReference}</p>}
            </div>

            {/* Your bank name */}
            <div className="space-y-1.5">
              <label htmlFor="senderBank" className="block text-sm font-medium text-gray-700">
                Your bank <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <select
                  id="senderBank"
                  value={senderBank}
                  onChange={(e) => setSenderBank(e.target.value)}
                  disabled={pageState === 'submitting'}
                  className={`tap-target w-full appearance-none rounded-lg border bg-white px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50 ${
                    errors.senderBank ? 'border-danger' : 'border-gray-300 focus:border-brand'
                  }`}
                >
                  <option value="">Select your bank</option>
                  {NIGERIAN_BANKS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {errors.senderBank && <p className="text-xs text-danger">{errors.senderBank}</p>}
            </div>

            {/* Sender name */}
            <div className="space-y-1.5">
              <label htmlFor="senderName" className="block text-sm font-medium text-gray-700">
                Name on account <span className="text-danger">*</span>
              </label>
              <input
                id="senderName"
                type="text"
                placeholder="e.g., John Doe"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                disabled={pageState === 'submitting'}
                className={`tap-target w-full rounded-lg border bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50 ${
                  errors.senderName ? 'border-danger' : 'border-gray-300 focus:border-brand'
                }`}
              />
              {errors.senderName && <p className="text-xs text-danger">{errors.senderName}</p>}
            </div>

            {/* Receipt upload */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Receipt image <span className="text-gray-400">(optional)</span>
              </label>

              {receiptPreview ? (
                <div className="relative overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="max-h-48 w-full object-contain bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={removeReceipt}
                    disabled={pageState === 'submitting'}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow transition-colors hover:bg-danger hover:text-white"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <label
                  className={`tap-target flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 transition-colors ${
                    pageState === 'submitting'
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-300 bg-white hover:border-brand hover:bg-brand-light'
                  }`}
                >
                  <Upload className="h-6 w-6 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600">
                    Tap to upload receipt screenshot
                  </p>
                  <p className="text-xs text-gray-400">
                    JPEG, PNG, or WebP (max 10MB)
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleReceiptFile}
                    disabled={pageState === 'submitting'}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Fee info */}
        <div className="rounded-xl bg-brand-light px-5 py-4">
          <div className="flex items-start gap-3">
            <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-semibold text-brand-dark">No fees &middot; No charges</p>
              <p className="text-xs text-gray-600">
                100% of your transfer is credited to your wallet.
                {amountNum >= 100 && (
                  <span className="block mt-0.5">
                    You&apos;ll receive <strong>₦{amountNum.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong> in your wallet.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={pageState === 'submitting'}
          className="tap-target w-full rounded-lg bg-gold px-4 py-3 font-bold text-white shadow-sm transition-all hover:bg-gold-dark focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 disabled:opacity-50"
        >
          {pageState === 'submitting' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Transfer Confirmation'
          )}
        </button>
      </form>

      <div className="h-safe-bottom" />
    </div>
  );
}
