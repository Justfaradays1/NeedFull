// WHAT: Admin manual transfer review page — confirm/reject deposits
// WHY: Core admin operation — verifying bank transfers before crediting wallets
// FUTURE: Add bank statement API integration to auto-match transfers
// FUTURE: Add duplicate reference detection warning

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote, CheckCircle2, XCircle, Search, ExternalLink,
  Shield, X, Loader2, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { useIsAuthenticated, useAuthInit, useIsAdmin } from '@/store';
import { get, post } from '@/lib/apiClient';
import toast from 'react-hot-toast';

type Tab = 'pending' | 'confirmed' | 'rejected';

interface DepositUser {
  id: string; fullName: string; email: string;
}

interface Deposit {
  id: string; user_id: string; amount_kobo: number; amount_naira: number;
  bank_reference: string; sender_bank: string; sender_name: string;
  receipt_url: string | null; status: string;
  wallet_tx_id: string | null; reviewed_by: string | null;
  reviewed_at: string | null; rejection_reason: string | null;
  created_at: string; updated_at: string;
  user: DepositUser;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export default function AdminDepositsPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  useAuthInit();

  const [tab, setTab] = useState<Tab>('pending');
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enlargeUrl, setEnlargeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isAdmin) { router.push('/feed'); return; }
  }, [isAuthenticated, isAdmin, router]);

  const fetchDeposits = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await get<{ success: boolean; data: Deposit[] }>(`/admin/deposits?status=${status}`);
      if (res.success) setDeposits(res.data);
    } catch { toast.error('Failed to load deposits'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    fetchDeposits(tab);
  }, [tab, isAuthenticated, isAdmin, fetchDeposits]);

  const handleConfirm = async () => {
    if (!confirmId) return;
    setSubmitting(true);
    try {
      await post(`/admin/deposits/${confirmId}/confirm`);
      setDeposits((prev) => prev.filter((d) => d.id !== confirmId));
      setConfirmId(null);
      toast.success('Transfer confirmed and wallet credited');
    } catch { toast.error('Failed to confirm transfer'); }
    finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setSubmitting(true);
    try {
      await post(`/admin/deposits/${rejectId}/reject`, { reason: rejectReason.trim() });
      setDeposits((prev) => prev.filter((d) => d.id !== rejectId));
      setRejectId(null);
      setRejectReason('');
      toast.success('Transfer rejected');
    } catch { toast.error('Failed to reject transfer'); }
    finally { setSubmitting(false); }
  };

  if (!isAuthenticated || !isAdmin) return null;

  const userRow = (deposit: Deposit) => (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand">
        {deposit.user.fullName?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">{deposit.user.fullName}</p>
        <p className="truncate text-[11px] text-gray-500">{deposit.user.email}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white px-4 pb-3 pt-3 shadow-sm">
        <h1 className="font-display text-lg font-bold text-gray-900">Manual Deposits</h1>
      </div>

      {/* Important notice banner */}
      <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-xs text-amber-800">
            <p className="font-bold">Always verify the transfer on your GTBank/Opay dashboard before confirming.</p>
            <p className="mt-0.5">Confirming a transfer adds real money to the user&apos;s wallet.</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mx-4 mt-3 flex gap-1 rounded-xl bg-gray-100 p-1">
        {(['pending', 'confirmed', 'rejected'] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`tap-target flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              tab === t ? 'bg-white text-brand shadow-sm' : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Deposits list */}
      <div className="mx-4 mt-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : deposits.length === 0 ? (
          <div className="py-12 text-center">
            <Banknote className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-500">No {tab} deposits</p>
          </div>
        ) : (
          deposits.map((d) => (
            <div key={d.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                {userRow(d)}
                <div className="text-right shrink-0">
                  <p className="font-display text-lg font-black text-brand">₦{d.amount_naira.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">{timeAgo(d.created_at)}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Bank Reference</span>
                  <p className="font-mono font-semibold text-gray-900">{d.bank_reference}</p>
                </div>
                <div>
                  <span className="text-gray-500">Sender Bank</span>
                  <p className="font-semibold text-gray-900">{d.sender_bank}</p>
                </div>
                <div>
                  <span className="text-gray-500">Sender Name</span>
                  <p className="font-semibold text-gray-900">{d.sender_name}</p>
                </div>
                {d.receipt_url && (
                  <div>
                    <span className="text-gray-500">Receipt</span>
                    <button type="button" onClick={() => setEnlargeUrl(d.receipt_url!)}
                      className="tap-target mt-0.5 inline-flex items-center gap-1 rounded-lg bg-brand-light px-2 py-1 text-[10px] font-bold text-brand"
                    >
                      <ExternalLink className="h-3 w-3" /> View Receipt
                    </button>
                  </div>
                )}
              </div>

              {/* Action buttons for pending */}
              {d.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setConfirmId(d.id)}
                    className="tap-target flex-1 rounded-xl bg-green-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> Confirm
                  </button>
                  <button type="button" onClick={() => { setRejectId(d.id); setRejectReason(''); }}
                    className="tap-target flex-1 rounded-xl border border-red-300 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="mr-1 inline h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              )}

              {/* Status for confirmed/rejected */}
              {d.status === 'confirmed' && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
                </div>
              )}
              {d.status === 'rejected' && (
                <div className="mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                    <XCircle className="h-3.5 w-3.5" /> Rejected
                  </div>
                  {d.rejection_reason && <p className="mt-0.5 text-[11px] text-gray-500">Reason: {d.rejection_reason}</p>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Confirm Modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center">
          <div className="w-full rounded-t-2xl bg-white p-5 sm:max-w-md sm:rounded-2xl sm:mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-gray-900">Confirm Transfer</h3>
              <button type="button" onClick={() => setConfirmId(null)} className="tap-target"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            {(() => {
              const d = deposits.find((x) => x.id === confirmId);
              if (!d) return null;
              return (
                <>
                  <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>This will add <strong>₦{d.amount_naira.toLocaleString()}</strong> to <strong>{d.user.fullName}</strong>&apos;s wallet. Have you verified this transfer on your bank dashboard?</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <p><strong>User:</strong> {d.user.fullName} ({d.user.email})</p>
                    <p><strong>Reference:</strong> {d.bank_reference}</p>
                    <p><strong>Bank:</strong> {d.sender_bank}</p>
                    <p><strong>Amount:</strong> ₦{d.amount_naira.toLocaleString()}</p>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button type="button" onClick={() => setConfirmId(null)} className="tap-target flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600">Cancel</button>
                    <button type="button" onClick={handleConfirm} disabled={submitting}
                      className="tap-target flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Yes, Confirm'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center">
          <div className="w-full rounded-t-2xl bg-white p-5 sm:max-w-md sm:rounded-2xl sm:mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-gray-900">Reject Transfer</h3>
              <button type="button" onClick={() => setRejectId(null)} className="tap-target"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-500">Provide a reason for rejection — this will be shown to the user.</p>
            <textarea
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Transfer reference not found in bank statement"
              rows={3}
              className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400"
            />
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setRejectId(null)} className="tap-target flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600">Cancel</button>
              <button type="button" onClick={handleReject} disabled={!rejectReason.trim() || submitting}
                className="tap-target flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {submitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Enlarge Modal */}
      {enlargeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setEnlargeUrl(null)}>
          <div className="relative max-h-[80vh] max-w-full">
            <button type="button" onClick={() => setEnlargeUrl(null)} className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg">
              <X className="h-4 w-4 text-gray-700" />
            </button>
            <img src={enlargeUrl} alt="Receipt" className="max-h-[80vh] rounded-xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
