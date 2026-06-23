// WHAT: Explore page — marketplace hub with runner discovery, coming-soon services, trust & credits
// WHY: Central discovery hub for all platform features

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass, MapPin, Shield, Lock, Award, Star, Users, ShoppingBag,
  CircleDollarSign, Loader2, ChevronRight, BadgeCheck, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { get, patch } from '@/lib/apiClient';
import { useAuthUser, useAuthStore } from '@/store';

interface Runner {
  id: string; fullName: string; bio: string | null;
  profilePictureUrl: string | null;
  trustScore: number; tasksCompleted: number;
  department: string | null; level: string | null; hostel: string | null;
  skills: string[] | null; distanceMeters: number;
}

interface RunnerCardProps {
  runner: Runner;
  onTap: () => void;
}

function RunnerCard({ runner, onTap }: RunnerCardProps) {
  const topSkill = runner.skills?.[0] || null;
  return (
    <button type="button" onClick={onTap}
      className="tap-target flex w-[140px] shrink-0 flex-col items-center rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-card transition-shadow duration-200 active:scale-[0.99] hover:border-brand/20"
    >
      <div className="relative">
        {runner.profilePictureUrl ? (
          <img src={runner.profilePictureUrl} alt="" className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand">
            {runner.fullName.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
      </div>
      <p className="mt-2 w-full truncate text-sm font-bold text-gray-900">{runner.fullName}</p>
      {topSkill && <p className="w-full truncate text-[10px] text-gray-500">{topSkill}</p>}
      <div className="mt-1.5 flex items-center gap-2 text-[10px]">
        <span className="rounded-full bg-brand-light px-1.5 py-[1px] font-bold text-brand">{runner.trustScore}</span>
        <span className="inline-flex items-center gap-0.5 text-gray-500">
          <MapPin className="h-2.5 w-2.5" />
          {runner.distanceMeters < 1000
            ? `${Math.round(runner.distanceMeters)}m`
            : `${(runner.distanceMeters / 1000).toFixed(1)}km`}
        </span>
      </div>
    </button>
  );
}

function TrustScoreSection({ score }: { score: number }) {
  const seg = Math.min(Math.round((score / 100) * 100), 100);
  const color = score >= 70 ? 'text-brand' : score >= 40 ? 'text-gold' : 'text-danger';
  const tips = [
    'Complete tasks on time to earn positive reviews',
    'Respond to messages within 2 hours',
    'Keep your availability status up to date',
    'Refer friends to grow the community',
    'Verify your student ID for a trust bonus',
  ];
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${seg}, 100`} strokeLinecap="round" className={color} />
          </svg>
          <Shield className={`absolute h-6 w-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Your Trust Score</p>
          <p className={`text-xl font-black ${color}`}>{score}/100</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Increase your score</p>
        {tips.map((t, i) => (
          <p key={i} className="flex items-start gap-2 text-[11px] text-gray-600">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-light" />
            {t}
          </p>
        ))}
      </div>
      <Link href="/profile" className="tap-target mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand">
        View full profile <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function CreditsSection({ balanceKobo }: { balanceKobo: number }) {
  const credits = Math.floor(balanceKobo / 100); // proxy: ₦1 = 1 credit
  const progress = Math.min((credits / 500) * 100, 100);
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
          <Award className="h-5 w-5 text-gold-dark" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">NeedFull Credits</p>
          <p className="text-lg font-black text-gold-dark">{credits} credits</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Progress to ₦250 reward</span>
          <span>{credits}/500</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-gray-100">
          <div className="h-2 rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
        </div>
        {credits >= 500 && (
          <p className="mt-1 text-xs font-bold text-green-600">You&apos;ve reached 500 credits! 🎉</p>
        )}
      </div>
      <div className="mt-3 space-y-1 text-[11px] text-gray-600">
        <p className="flex items-center gap-1.5"><Star className="h-3 w-3 text-gold" /> Complete tasks — earn credits per task</p>
        <p className="flex items-center gap-1.5"><Users className="h-3 w-3 text-brand" /> Refer friends — earn bonus credits</p>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const user = useAuthUser();
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loadingRunners, setLoadingRunners] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not available');
      setLoadingRunners(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await get<{ success: boolean; data: Runner[] }>(
            `/users/nearby-runners?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radiusMeters=5000`,
          );
          if (res.success) setRunners(res.data);
        } catch { /* */ }
        finally { setLoadingRunners(false); }
      },
      () => {
        setGeoError('Could not get your location');
        setLoadingRunners(false);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  const balanceKobo = user?.wallet?.balanceKobo ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white px-4 pb-4 pt-3 shadow-sm">
        <h1 className="font-display text-lg font-bold text-gray-900">Explore</h1>
        <p className="mt-0.5 text-xs text-gray-500">Discover tasks, runners, and more</p>
      </div>

      <div className="px-4 space-y-5 mt-4">
        {/* Section 1: Available Runners Nearby */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
              <MapPin className="h-4 w-4 text-brand" />
              Available Runners Nearby
            </h2>
            <Link href="/feed" className="text-xs font-bold text-brand">Browse tasks</Link>
          </div>

          {loadingRunners ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>
          ) : geoError ? (
            <div className="rounded-xl bg-amber-50 p-4 text-center text-xs text-amber-700">
              Turn on location to find runners near you
            </div>
          ) : runners.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-6 text-center">
              <Compass className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-600">No runners available near you right now</p>
              <p className="text-xs text-gray-400">Check back soon</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {runners.map((r) => (
                <RunnerCard key={r.id} runner={r} onTap={() => router.push(`/profile/${r.id}`)} />
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Services Coming Soon */}
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-900">
            <Award className="h-4 w-4 text-gold" />
            Services
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { title: 'Digital Services', desc: 'Design, typing, editing', icon: <ShoppingBag className="h-6 w-6 text-white/60" /> },
              { title: 'Student Marketplace', desc: 'Buy & sell items', icon: <ShoppingBag className="h-6 w-6 text-white/60" /> },
              { title: 'Lending Circle', desc: 'Peer micro-loans for verified students', icon: <CircleDollarSign className="h-6 w-6 text-white/60" /> },
            ].map((s) => (
              <div key={s.title} className="relative flex flex-col items-center rounded-xl bg-brand p-5 text-center shadow-sm">
                <div className="absolute right-2 top-2 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/80">
                  Coming soon
                </div>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <Lock className="h-5 w-5 text-white/50" />
                </div>
                <h3 className="text-sm font-bold text-white">{s.title}</h3>
                <p className="mt-0.5 text-[11px] text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Trust Score */}
        <section>
          <TrustScoreSection score={user?.trustScore ?? 0} />
        </section>

        {/* Section 4: NeedFull Credits */}
        <section>
          <CreditsSection balanceKobo={balanceKobo} />
        </section>
      </div>
    </div>
  );
}
