const FEATURES = [
  { title: 'Set your own hours', desc: 'Work when it fits your class schedule. Accept tasks between lectures, not the other way around.' },
  { title: 'Get paid fast', desc: 'Once the task poster confirms completion, escrow releases your payment instantly to your wallet.' },
  { title: 'Build your reputation', desc: 'Every completed task grows your trust score. Higher trust = access to better-paying tasks.' },
  { title: 'No interview needed', desc: 'No CVs, no cover letters. Your trust score and task history speak for themselves.' },
  { title: 'Campus only', desc: 'All tasks are on your campus. No commuting, no travel costs \u2014 just walk across campus.' },
  { title: 'Wide variety of tasks', desc: "Research assistance, delivery, tutoring, graphic design, event help \u2014 find what you're good at." },
];

export function EarnSection() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-section-alt)' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-section-label inline-flex items-center rounded-full bg-gold-light px-3.5 py-1" style={{ color: '#B45309' }}>For students who earn</span>
          <h2 className="mt-4 font-display text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
            Turn free hours into <span className="text-brand">flexible income</span>
          </h2>
          <p className="text-section-desc mt-3" style={{ color: 'var(--color-muted)' }}>
            No CV required. No fixed schedule. Just real tasks from real students, paid fast.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border p-5 shadow-card transition-all duration-200 hover:shadow-lifted" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <h3 className="font-display text-base font-bold sm:text-lg" style={{ color: 'var(--color-foreground)' }}>{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--color-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
