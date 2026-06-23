export function CtaSection() {
  return (
    <section id="cta" className="px-4 py-20 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
          Ready to start earning?
        </h2>
        <p className="mt-3 text-[15px]" style={{ color: 'var(--color-muted)' }}>
          Join hundreds of FUOYE students already using NeedFull. Sign up takes less than a minute.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="/register" className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-brand px-8 py-3.5 text-[15px] font-bold text-white shadow-card transition-all duration-150 hover:bg-brand-mid active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
            Create free account
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </a>
          <a href="/login" className="rounded-[10px] border px-8 py-3.5 text-[15px] font-semibold transition-all duration-150 hover:bg-white/10 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-brand/50" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
            I already have an account
          </a>
        </div>
      </div>
    </section>
  );
}
