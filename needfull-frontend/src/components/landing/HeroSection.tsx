export function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-brand-dark via-brand to-brand-mid px-4 pb-28 pt-20 sm:pb-32 sm:pt-24 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(234,163,37,0.15)_0%,_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.05)_0%,_transparent_50%)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="mb-4 inline-flex items-center rounded-full bg-white/10 px-3.5 py-1 text-[13px] font-semibold tracking-wide text-white/90 backdrop-blur-sm">
              For FUOYE students
            </span>
            <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] font-extrabold leading-[1.08] tracking-tight">
              Turn your campus hours into{' '}
              <span className="text-gold">real income</span>
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/75">
              NeedFull connects FUOYE students who need tasks done with students who want to earn.
              Post an errand, find a gig, earn money — all within your campus community, with escrow protection.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-gold px-7 py-3.5 text-[15px] font-bold text-white shadow-xl shadow-gold/30 transition-all duration-150 hover:brightness-105 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
              >
                Start earning today
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </a>
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border-2 border-white/50 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur-sm transition-all duration-150 hover:bg-white/20 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                I need help with a task
              </a>
            </div>
            <p className="text-white/40 text-sm mt-6">Free to join &middot; No hidden charges</p>

            <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { value: '500+', label: 'Active Students', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
                { value: '1,200+', label: 'Tasks Completed', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" /></svg> },
                { value: '<2hrs', label: 'Average Payout', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { value: '4.8/5', label: 'Trust Score', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> },
              ].map((s) => (
                <div key={s.label} className="group relative rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lifted sm:px-4 sm:py-5">
                  <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold transition-all duration-200 group-hover:bg-gold/25 group-hover:scale-105 sm:h-10 sm:w-10">
                    {s.icon}
                  </div>
                  <div className="font-display text-xl font-extrabold leading-none tracking-tight text-white md:text-2xl">{s.value}</div>
                  <div className="mt-1 text-[11px] font-medium text-white/60 sm:text-xs">{s.label}</div>
                  <div className="mx-auto mt-3 h-[3px] w-0 rounded-full bg-gold/30 transition-all duration-300 group-hover:w-6 sm:group-hover:w-8" />
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-16 lg:mt-0">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-5">
                <span className="bg-brand-light text-brand text-xs font-medium px-3 py-1 rounded-full">Laundry</span>
                <span className="text-gold font-bold text-2xl">₦1,500</span>
              </div>
              <h3 className="font-semibold mb-3 font-display text-lg" style={{ color: '#171717' }}>
                Wash and iron 5 clothes before 6pm
              </h3>
              <p className="text-sm mb-6" style={{ color: '#6b7280' }}>📍 Female Hostel Block B · Due in 2 hours</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">TF</div>
                <span className="text-sm" style={{ color: '#4b5563' }}>Temi F. · ⭐ 4.9</span>
                <div className="ml-auto bg-gold text-white text-sm font-semibold px-6 py-2.5 rounded-full">Apply →</div>
              </div>
            </div>
            <div className="absolute -top-5 -right-5 bg-white rounded-xl shadow-lg px-5 py-3 flex items-center gap-3">
              <span className="text-green-500 text-xl">✓</span>
              <div>
                <p className="text-xs" style={{ color: '#6b7280' }}>Just earned</p>
                <p className="font-bold text-sm" style={{ color: '#171717' }}>₦1,350</p>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 bg-brand text-white rounded-xl shadow-lg px-5 py-3">
              <p className="text-xs font-medium">2 students applied</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
