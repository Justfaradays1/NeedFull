// WHAT: Own profile page — full user profile with stats, tabs, and settings
// WHY: Central hub for viewing and managing personal account

'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Settings, LogOut, ChevronRight, Pencil, Star, Shield,
  MapPin, Award, Clock, CheckCircle2, X, Upload, BadgeCheck,
  Phone, Mail, GraduationCap, Volume2, Wifi, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useAuthUser, useAuthStore } from '@/store';
import { get, patch, post } from '@/lib/apiClient';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/avatar';

type TabKey = 'overview' | 'reviews' | 'activity' | 'settings';

interface UserProfile {
  id: string; fullName: string; email: string; phone: string | null;
  school: string | null; bio: string | null; department: string | null; level: string | null;
  hostel: string | null; skills: string[] | null;
  locationLabel: string | null; profilePictureUrl: string | null;
  trustScore: number; tasksCompleted: number;
  isAvailable: boolean; isRunner: boolean;
  emailVerified: boolean; isVerifiedStudent: boolean;
  createdAt: string;
  wallet?: { id: string; balanceKobo: number; escrowKobo: number };
  virtualAccount?: { accountNumber: string; bankName: string; accountName: string } | null;
}

interface ReviewItem {
  id: string; rating: number; comment: string | null;
  createdAt: string; reviewer: { id: string; fullName: string };
}

interface TaskRow {
  id: string; title: string; budget: { kobo: number; naira: number };
  status: string; isUrgent: boolean; createdAt: string; deadline: string | null;
  category: { id: string; name: string; icon: string } | null;
}

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${s <= rating ? 'text-gold fill-gold' : 'text-gray-200'}`} style={{ width: size, height: size }} />
      ))}
    </span>
  );
}

function TrustScoreCard({ score }: { score: number }) {
  const seg = Math.round((score / 100) * 100);
  const color = score >= 70 ? 'text-brand' : score >= 40 ? 'text-gold' : 'text-danger';
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-card-border bg-surface p-4 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${seg}, 100`} strokeLinecap="round" className={color} />
        </svg>
        <Shield className={`absolute h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">Trust Score</p>
        <p className={`text-lg font-black ${color}`}>{score}/100</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const storeUser = useAuthUser();
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activity, setActivity] = useState<TaskRow[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Edit profile modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', bio: '', department: '', level: '', hostel: '', phone: '' });

  // Verification upload state
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    setFetchError(null);
    try {
      const [meRes, pubRes, postedRes] = await Promise.all([
        get<{ success: boolean; data: UserProfile }>('/users/me'),
        get<{ success: boolean; data: { recentReviews?: ReviewItem[] } }>(`/users/${storeUser?.id}`).catch(() => ({ success: false, data: {} })),
        get<{ success: boolean; data: TaskRow[] }>('/tasks/me/posted').catch(() => ({ success: false, data: [] })),
      ]);
      if (meRes.success) {
        setProfile(meRes.data);
        setEditForm({
          fullName: meRes.data.fullName,
          bio: meRes.data.bio || '',
          department: meRes.data.department || '',
          level: meRes.data.level || '',
          hostel: meRes.data.hostel || '',
          phone: meRes.data.phone || '',
        });
      } else {
        setFetchError('Failed to load profile data');
      }
      if ((pubRes as any).success && (pubRes as any).data?.recentReviews) {
        setReviews((pubRes as any).data.recentReviews);
      }
      if (postedRes.success) {
        setActivity(postedRes.data.filter((t) => t.status === 'completed').slice(0, 10));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load profile';
      setFetchError(msg);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, [storeUser?.id]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const balanceNaira = profile?.wallet ? (profile.wallet.balanceKobo / 100).toLocaleString() : '0';

  const handleToggle = async (field: 'isAvailable' | 'isRunner') => {
    const endpoint = field === 'isAvailable' ? '/users/me/available' : '/users/me/runner';
    const body = field === 'isRunner' ? { isRunner: !profile?.isRunner } : undefined;
    try {
      const res = await (field === 'isAvailable'
        ? patch<{ success: boolean; data: { isAvailable: boolean } }>(endpoint)
        : patch<{ success: boolean; data: { isRunner: boolean } }>(endpoint, body));
      if (res.success) {
        setProfile((p) => p ? { ...p, [field]: field === 'isAvailable' ? (res as any).data.isAvailable : (res as any).data.isRunner } : null);
      }
    } catch { toast.error('Failed to update'); }
  };

  const handleEditSave = async () => {
    try {
      const res = await patch<{ success: boolean; data: any }>('/users/me', editForm);
      if (res.success) {
        setProfile((p) => p ? { ...p, ...res.data } : null);
        setUser(storeUser ? { ...storeUser, fullName: editForm.fullName } : null);
        toast.success('Profile updated');
        setEditOpen(false);
      }
    } catch { toast.error('Failed to update profile'); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await apiClient.post<{ success: boolean; data: { profilePictureUrl: string } }>('/users/me/avatar', fd);
      if (res.data.success) {
        setProfile((p) => p ? { ...p, profilePictureUrl: res.data.data.profilePictureUrl } : null);
        toast.success('Avatar updated');
      }
    } catch { toast.error('Upload failed'); }
  };

  const handleVerificationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('idCard', file);
    try {
      await apiClient.post('/users/me/verify-student', fd);
      toast.success('ID card submitted for verification');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (fetchError || !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        </div>
        <p className="text-sm font-semibold text-gray-900">Could not load profile</p>
        <p className="text-xs text-gray-500 text-center max-w-xs">{fetchError || 'An unexpected error occurred'}</p>
        <button type="button" onClick={fetchProfile} className="mt-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="glass-dark px-4 pb-8 pt-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button type="button" onClick={() => fileRef.current?.click()} className="tap-target block">
                {profile.profilePictureUrl ? (
                  <img src={profile.profilePictureUrl} alt="" className="h-[72px] w-[72px] rounded-full border-2 border-white/30 object-cover" />
                ) : (
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-white/30 bg-white/20 text-2xl font-bold">
                    {profile.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-white text-brand shadow-sm">
                  <Pencil className="h-3 w-3" />
                </span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold truncate sm:text-xl">{profile.fullName}</h2>
                {profile.isVerifiedStudent && <BadgeCheck className="h-5 w-5 shrink-0 text-gold" />}
              </div>
              <p className="text-sm text-white/80">{profile.school || 'Your campus'}</p>
              {profile.department && <p className="text-xs text-white/60">{profile.department}</p>}
            </div>
          </div>
          <button type="button" onClick={() => setEditOpen(true)} className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 mt-3 grid grid-cols-4 gap-2">
        {[
          { label: 'Tasks', value: profile.tasksCompleted, Icon: CheckCircle2 },
          { label: 'Rating', value: avgRating, Icon: Star },
          { label: 'Trust', value: profile.trustScore, Icon: Shield },
          { label: 'Credits', value: `₦${balanceNaira}`, Icon: Award },
        ].map(({ label, value, Icon: StatIcon }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-xl bg-surface p-2.5 shadow-sm">
            <StatIcon className="h-4 w-4 text-brand" />
            <span className="text-xs font-black text-gray-900">{value}</span>
            <span className="text-[9px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Trust Score Card */}
      <div className="mx-4 mt-3">
        <TrustScoreCard score={profile.trustScore} />
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-10 mx-4 mt-4 flex gap-1 rounded-xl bg-gray-100 p-1">
        {(['overview', 'reviews', 'activity', 'settings'] as TabKey[]).map((t) => (
          <button key={t} type="button" onClick={() => setActiveTab(t)}
            className={`tap-target flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === t ? 'bg-surface text-brand shadow-sm' : 'text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mx-4 mt-4">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {profile.bio && (
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">Bio</h4>
                <p className="text-sm leading-relaxed text-gray-700">{profile.bio}</p>
              </div>
            )}
            {profile.skills && profile.skills.length > 0 && (
              <div>
                <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <span key={s} className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              <ToggleRow label="Available for tasks" enabled={profile.isAvailable} onToggle={() => handleToggle('isAvailable')} />
              <ToggleRow label="Runner mode" enabled={profile.isRunner} onToggle={() => handleToggle('isRunner')}
                disabled={profile.trustScore < 30 && !profile.isRunner}
                disabledHint={profile.trustScore < 30 ? 'Need trust score ≥ 30' : undefined}
              />
            </div>
            {profile.locationLabel && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                {profile.locationLabel}
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div>
            {reviews.length === 0 ? (
              <div className="py-12 text-center">
                <Star className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-card-border bg-surface p-4 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.reviewer.fullName} size="sm" />
                        <span className="text-sm font-semibold text-gray-900">{r.reviewer.fullName}</span>
                      </div>
                      <StarRating rating={r.rating} />
                    </div>
                    {r.comment && <p className="mt-1.5 text-sm text-gray-600">{r.comment}</p>}
                    <p className="mt-1 text-[10px] text-gray-500">{new Date(r.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity */}
        {activeTab === 'activity' && (
          <div>
            {activity.length === 0 ? (
              <div className="py-12 text-center">
                <Clock className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No completed tasks yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activity.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-2xl border border-card-border bg-surface p-4 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
                      <p className="text-[11px] text-gray-500">{t.category?.name || 'General'} · {new Date(t.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Done</span>
                      <span className="text-xs font-bold text-brand">₦{t.budget.naira.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Verification Section */}
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                <Shield className="h-3.5 w-3.5" /> Verification
              </h4>
              <div className="space-y-2">
                <VerificationRow icon={<Mail className="h-4 w-4" />} label="Email" verified={profile.emailVerified} />
                <VerificationRow icon={<Phone className="h-4 w-4" />} label="Phone" verified={!!profile.phone} detail={profile.phone || undefined} />
                <VerificationRow icon={<GraduationCap className="h-4 w-4" />} label="Student ID"
                  verified={profile.isVerifiedStudent}
                  onVerify={() => fileRef.current?.click()}
                  uploading={uploading}
                />
              </div>
            </div>

            {/* Account */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Account</h4>
              <Link href="/wallet" className="tap-target flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                <span className="flex items-center gap-3"><Award className="h-5 w-5 text-gray-400" /> Wallet</span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </Link>
              <Link href="/settings/verification" className="tap-target flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                <span className="flex items-center gap-3"><Settings className="h-5 w-5 text-gray-400" /> Settings</span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </Link>
              <button type="button" onClick={() => setEditOpen(true)} className="tap-target flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                <span className="flex items-center gap-3"><Pencil className="h-5 w-5 text-gray-400" /> Edit Profile</span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            </div>

            {/* Logout */}
            <button type="button" onClick={handleLogout}
              className="tap-target flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" /> Log Out
            </button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="glass-overlay fixed inset-0 z-50 flex items-end sm:items-center" onClick={() => setEditOpen(false)}>
          <div className="glass-white w-full rounded-t-3xl px-4 pb-safe pb-8 pt-1 sm:max-w-md sm:mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 mt-2 h-1 w-10 rounded-full bg-gray-300" />
            <div className="px-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-gray-900">Edit Profile</h3>
              <button type="button" onClick={() => setEditOpen(false)} className="tap-target"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              {(['fullName', 'phone', 'department', 'level', 'hostel', 'bio'] as const).map((f) => (
                <div key={f}>
                  <label className="mb-0.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider">{f === 'fullName' ? 'Full Name' : f.charAt(0).toUpperCase() + f.slice(1)}</label>
                  {f === 'bio' ? (
                    <textarea rows={3} value={editForm[f]} onChange={(e) => setEditForm((p) => ({ ...p, [f]: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                  ) : (
                    <input type={f === 'phone' ? 'tel' : 'text'} value={editForm[f]} onChange={(e) => setEditForm((p) => ({ ...p, [f]: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setEditOpen(false)} className="tap-target flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600">Cancel</button>
              <button type="button" onClick={handleEditSave} className="tap-target flex-1 rounded-xl bg-brand py-3 text-sm font-bold text-white">Save</button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for student ID verification */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleVerificationUpload} />
    </div>
  );
}

function ToggleRow({ label, enabled, onToggle, disabled, disabledHint }: {
  label: string; enabled: boolean; onToggle: () => void; disabled?: boolean; disabledHint?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-card-border bg-surface p-4 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
      <div>
        <span className={`text-sm font-semibold ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>{label}</span>
        {disabled && disabledHint && <p className="text-[10px] text-gray-500">{disabledHint}</p>}
      </div>
      <button type="button" onClick={onToggle} disabled={disabled} className="tap-target text-brand disabled:text-gray-300">
        {enabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
      </button>
    </div>
  );
}

function VerificationRow({ icon, label, verified, detail, onVerify, uploading }: {
  icon: React.ReactNode; label: string; verified: boolean; detail?: string; onVerify?: () => void; uploading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-card-border bg-surface p-4 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${verified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">{label}</p>
          {detail && <p className="text-[11px] text-gray-500">{detail}</p>}
        </div>
      </div>
      {verified ? (
        <span className="flex items-center gap-1 text-xs font-bold text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
        </span>
      ) : onVerify ? (
        <button type="button" onClick={onVerify} disabled={uploading} className="tap-target rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
          {uploading ? 'Uploading...' : 'Verify'}
        </button>
      ) : (
        <span className="text-xs text-gray-500">—</span>
      )}
    </div>
  );
}
