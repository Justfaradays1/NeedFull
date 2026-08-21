// WHAT: Student stories — a static, readable selection of testimonials
// WHY: An infinite auto-scrolling marquee is hard to read, duplicates
//      content, and breaks reduced-motion expectations. A clean grid
//      keeps the social proof without the motion.

const TESTIMONIALS = [
  {
    quote: "I made over ₦35,000 last semester just running errands between lectures. NeedFull replaced my need for a part-time job off campus.",
    name: "Chioma A.",
    role: "300 Level, Mass Comm",
  },
  {
    quote: "Posting my research transcription task, I had three applications in under an hour. The escrow system meant I only paid when it was perfect.",
    name: "David O.",
    role: "400 Level, Engineering",
  },
  {
    quote: "I needed someone to deliver a textbook from the library while I was stuck in a practical session. Found a runner on NeedFull in under 5 minutes.",
    name: "Akanbi Ayomide O.",
    role: "300 Level, Computer Science",
  },
  {
    quote: "The escrow system is everything. Before NeedFull, getting paid for helping classmates meant chasing people for weeks. Now the money locks in before I even start working.",
    name: "Olowooba God'sPromise D.",
    role: "200 Level, Economics",
  },
  {
    quote: "I was sceptical at first — handing money to a stranger feels risky. But with escrow, the money stays locked until the task is done. I've used it five times now, zero issues.",
    name: "Samuel K.",
    role: "300 Level, Political Science",
  },
  {
    quote: "As someone with a tight schedule, I outsource my laundry and delivery tasks. It costs less than I thought, and I get my time back for what actually matters.",
    name: "Ruth A.",
    role: "500 Level, Medicine",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="border-b border-border-subtle bg-surface-primary">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Students on campus use it every day
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
          What posters and Runners say about getting tasks done on campus.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <li
              key={t.name}
              className="flex flex-col rounded-xl border border-border-default bg-surface p-5 shadow-sm"
            >
              <p className="flex-1 text-sm leading-relaxed text-foreground-secondary">
                “{t.quote}”
              </p>
              <footer className="mt-4 border-t border-border-subtle pt-3.5">
                <p className="text-sm font-bold text-foreground">{t.name}</p>
                <p className="text-[13px] text-foreground-muted">{t.role}</p>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}