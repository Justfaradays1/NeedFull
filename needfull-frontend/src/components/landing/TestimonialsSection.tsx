'use client';

const TESTIMONIALS = [
  {
    quote: "I made over \u20A635,000 last semester just running errands between lectures. NeedFull replaced my need for a part-time job off campus.",
    name: "Chioma A.",
    role: "300 Level, Mass Comm",
  },
  {
    quote: "Posting my research transcription task, I had three applications in under an hour. The escrow system meant I only paid when it was perfect.",
    name: "David O.",
    role: "400 Level, Engineering",
  },
  {
    quote: "As a fresher, I didn\u2019t know where to find campus work. NeedFull made it easy to start earning without any experience or connections.",
    name: "Esther O.",
    role: "100 Level, Sciences",
  },
  {
    quote: "I needed someone to deliver a textbook from the library while I was stuck in a practical session. Found a runner on NeedFull in under 5 minutes. Honestly saved my grade.",
    name: "Akanbi Ayomide O.",
    role: "300 Level, Computer Science",
  },
  {
    quote: "The escrow system is everything. Before NeedFull, getting paid for helping classmates meant chasing people for weeks. Now the money locks in before I even start working.",
    name: "Olowooba God'sPromise D.",
    role: "200 Level, Economics",
  },
  {
    quote: "I use NeedFull to offer graphic design services to students who need flyers and banners for events. The trust score system makes clients confident to hire me even if we\u2019ve never met.",
    name: "Tobiloba F.",
    role: "400 Level, Fine Arts",
  },
  {
    quote: "I was sceptical at first \u2014 handing money to a stranger feels risky. But with escrow, the money stays locked until the task is done. I\u2019ve used it five times now, zero issues.",
    name: "Samuel K.",
    role: "300 Level, Political Science",
  },
  {
    quote: "As someone with a tight schedule, I outsource my laundry and delivery tasks. It costs less than I thought, and I get my time back for what actually matters.",
    name: "Ruth A.",
    role: "500 Level, Medicine",
  },
];

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[number] }) {
  return (
    <div className="flex w-[320px] shrink-0 flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10">
      <div className="mb-3 flex gap-1" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-white/80">
        <span aria-hidden="true">&ldquo;</span>{t.quote}<span aria-hidden="true">&rdquo;</span>
      </p>
      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="text-sm font-bold text-white">{t.name}</div>
        <div className="text-[13px] text-white/50">{t.role}</div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="overflow-hidden bg-brand-dark py-20 text-white">
      <div className="px-4 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <span className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1 text-[13px] font-semibold tracking-wide text-white/80 backdrop-blur-sm">
            What students say
          </span>
          <h2 className="mt-4 font-display text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold tracking-tight">
            Trusted by campus students
          </h2>
          <p className="mt-3 text-[15px] text-white/60">
            Real experiences from real users on campus.
          </p>
        </div>
      </div>

      <div
        className="group/scroller mt-14 [mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)]"
        onMouseEnter={(e) => {
          (e.currentTarget.querySelector('.testimonial-track') as HTMLElement)?.style.setProperty('animation-play-state', 'paused');
        }}
        onMouseLeave={(e) => {
          (e.currentTarget.querySelector('.testimonial-track') as HTMLElement)?.style.setProperty('animation-play-state', 'running');
        }}
      >
        <div
          className="testimonial-track flex w-max gap-6 pe-6"
          style={{
            animation: 'scroll-left 50s linear infinite',
          }}
        >
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <TestimonialCard key={`${t.name}-${i}`} t={t} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .testimonial-track {
          will-change: transform;
        }
      `}</style>
    </section>
  );
}
