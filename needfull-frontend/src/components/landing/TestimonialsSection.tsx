export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-brand-dark px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <span className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1 text-[13px] font-semibold tracking-wide text-white/80 backdrop-blur-sm">What students say</span>
        <h2 className="mt-4 font-display text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold tracking-tight">
          Trusted by FUOYE students
        </h2>
        <p className="mt-3 text-[15px] text-white/60">
          Real experiences from real users on campus.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-3">
        {[
          { quote: 'I made over ₦35,000 last semester just running errands between lectures. NeedFull replaced my need for a part-time job off campus.', name: 'Chioma A.', role: '300 Level, Mass Comm' },
          { quote: 'Posting my research transcription task, I had three applications in under an hour. The escrow system meant I only paid when it was perfect.', name: 'David O.', role: '400 Level, Engineering' },
          { quote: 'As a fresher, I didn\'t know where to find campus work. NeedFull made it easy to start earning without any experience or connections.', name: 'Esther O.', role: '100 Level, Sciences' },
        ].map((t) => (
          <div key={t.name} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-3 flex gap-1" aria-hidden="true">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-white/80"><span aria-hidden="true">&ldquo;</span>{t.quote}<span aria-hidden="true">&rdquo;</span></p>
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="text-sm font-bold text-white">{t.name}</div>
              <div className="text-[13px] text-white/50">{t.role}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
