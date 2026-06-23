export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-brand-light px-3.5 py-1 text-[13px] font-semibold text-brand">How it works</span>
          <h2 className="mt-4 font-display text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
            Three steps to your first campus gig
          </h2>
          <p className="mt-3 text-[15px]" style={{ color: 'var(--color-muted)' }}>
            Whether you&apos;re earning or hiring, the process is simple and secure.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              step: '01', title: 'Sign up & verify',
              desc: 'Create your account with your FUOYE email. Student verification takes under a minute and unlocks the full marketplace.',
              icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
            },
            {
              step: '02', title: 'Browse or post',
              desc: 'Find tasks near you that match your skills and schedule, or post what you need done and let runners apply.',
              icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
            },
            {
              step: '03', title: 'Complete & get paid',
              desc: 'Task done? Payment is released from escrow instantly. Your money is always protected until both sides are satisfied.',
              icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            },
          ].map((item) => (
            <div key={item.step} className="group rounded-2xl border p-6 shadow-card transition-all duration-200 hover:shadow-lifted active:scale-[0.99]" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                {item.icon}
              </div>
              <span className="text-[13px] font-bold tracking-widest text-brand/60">{item.step}</span>
              <h3 className="mt-1.5 font-display text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
