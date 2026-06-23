const FEATURES = [
  {
    title: 'Posted in minutes',
    desc: 'Describe your task, set a budget, and publish. Runners start applying within minutes \u2014 no lengthy approval process.',
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    title: 'Escrow-protected',
    desc: 'Your payment sits in escrow until you confirm the task is complete. No risk of paying for unfinished work.',
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  },
  {
    title: 'Verified student runners',
    desc: 'Every runner is FUOYE-verified with a trust score and completion history. Pick the best match for your task.',
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  },
  {
    title: 'Tasks for every need',
    desc: "From library book pickup to research editing to event photography. If a student can do it, you can post it.",
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
  },
];

export function PosterSection() {
  return (
    <section id="safety" className="px-4 py-20 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-brand-light px-3.5 py-1 text-[13px] font-semibold text-brand">For task posters</span>
          <h2 className="mt-4 font-display text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
            Get campus tasks done <span className="text-brand">faster</span>
          </h2>
          <p className="mt-3 text-[15px]" style={{ color: 'var(--color-muted)' }}>
            Post what you need, get matched with verified students, and only pay when it&apos;s done right.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4 rounded-2xl border p-5 shadow-card transition-all duration-200 hover:shadow-lifted" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                {f.icon}
              </div>
              <div>
                <h3 className="font-display text-base font-bold" style={{ color: 'var(--color-foreground)' }}>{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
