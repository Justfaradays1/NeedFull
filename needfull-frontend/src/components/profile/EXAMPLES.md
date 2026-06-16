// USAGE EXAMPLES for TrustScoreCard and TrustBadge

// ============================================================
// EXAMPLE 1: Full Trust Score Card (Profile Page)
// ============================================================

import { TrustScoreCard } from '@/components/profile';

export function UserProfilePage() {
const userScore = 78;
const breakdown = {
ratingPoints: 35,
completionPoints: 18,
verificationPoints: 12,
reportPenalty: 0,
tenurePoints: 8,
};

return (
<div className="max-w-2xl mx-auto p-6">
<h1>Your Profile</h1>
<TrustScoreCard
        score={userScore}
        breakdown={breakdown}
        showHowItWorks={true}
        className="mb-8"
      />
</div>
);
}

// ============================================================
// EXAMPLE 2: Simple Trust Score (No Breakdown)
// ============================================================

export function SettingsPage() {
const userScore = 78;

return (
<div>
<TrustScoreCard score={userScore} showHowItWorks={false} className="mb-6" />
{/_ Rest of settings... _/}
</div>
);
}

// ============================================================
// EXAMPLE 3: Inline Trust Badge (Task Card)
// ============================================================

import { TrustBadge } from '@/components/profile';

interface TaskCardProps {
taskTitle: string;
runnerName: string;
runnerScore: number;
}

export function TaskCard({ taskTitle, runnerName, runnerScore }: TaskCardProps) {
return (
<div className="rounded-lg border p-4">
<h3 className="font-semibold mb-3">{taskTitle}</h3>
<div className="flex items-center justify-between">
<div>
<p className="text-sm text-gray-600">{runnerName}</p>
</div>
<TrustBadge score={runnerScore} size="md" showLabel={true} />
</div>
</div>
);
}

// ============================================================
// EXAMPLE 4: Small Badge (Avatar Hover Tooltip)
// ============================================================

export function UserAvatarWithTrust() {
const userScore = 82;

return (
<div className="flex items-center gap-2">
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-dark" />
<TrustBadge score={userScore} size="sm" showLabel={false} />
</div>
);
}

// ============================================================
// EXAMPLE 5: Chat Header
// ============================================================

export function ChatHeader() {
const otherUserScore = 72;

return (
<div className="flex items-center justify-between px-4 py-3 border-b">
<div>
<h2 className="font-semibold">Alice Smith</h2>
</div>
<TrustBadge score={otherUserScore} size="md" showLabel={true} />
</div>
);
}

// ============================================================
// EXAMPLE 6: Styling with Custom Classes
// ============================================================

export function ProfileSection() {
const userScore = 45; // Building

return (
<div className="w-full">
<TrustScoreCard
        score={userScore}
        showHowItWorks={true}
        className="shadow-lg border-2 border-amber-200"
      />
</div>
);
}
