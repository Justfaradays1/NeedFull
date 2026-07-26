'use client';

import { useRef } from 'react';
import { BecomeRunnerHero } from '@/components/runner/BecomeRunnerHero';
import { RunnerApplicationForm } from '@/components/runner/RunnerApplicationForm';
import { useAuthUser } from '@/store';
import { redirect } from 'next/navigation';

export default function BecomeRunnerPage() {
  const user = useAuthUser();
  const formRef = useRef<HTMLDivElement>(null);

  if (!user) { redirect('/login'); return null; }
  if (user.roles?.includes('runner')) { redirect('/profile'); return null; }
  if (user.role === 'admin') { redirect('/profile'); return null; }

  const handleStart = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main>
      <BecomeRunnerHero onStart={handleStart} />
      <div ref={formRef}>
        <RunnerApplicationForm />
      </div>
      {/* Spacer for bottom padding */}
      <div className="h-12 md:h-20" />
    </main>
  );
}
