export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-linear-to-b from-brand-dark via-brand to-brand-mid px-4 pb-28 pt-20 sm:pb-32 sm:pt-24 lg:px-8"
    >
      {/* Faint grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(234,163,37,0.15)_0%,_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.05)_0%,_transparent_50%)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* ─── Left: the product pitch ─── */}
          <div>
            <span className="mb-4 inline-flex items-center rounded-full bg-on-brand/10 px-3.5 py-1 text-[13px] font-semibold tracking-wide text-on-brand/90 backdrop-blur-sm sm:text-sm">
              Trusted local marketplace
            </span>
            <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] font-extrabold leading-[1.08] tracking-tight text-on-brand">
              Find trusted help.{" "}
              <span className="text-gold">Earn</span> by helping others.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-on-brand/75 sm:text-lg">
              Need something done? Someone nearby is ready to help. Post any
              task or offer your skills — your payment stays safe in escrow
              until the job is done.
            </p>

            {/* CTAs — primary action dominates */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-gold px-8 py-3.5 text-[15px] font-bold text-white shadow-xl shadow-gold/30 transition-all duration-150 hover:brightness-105 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
              >
                Get Started
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border-2 border-on-brand/50 bg-on-brand/10 px-8 py-3.5 text-[15px] font-semibold text-on-brand backdrop-blur-sm transition-all duration-150 hover:bg-on-brand/20 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-on-brand/50"
              >
                See How It Works
              </a>
            </div>

            {/* Trust indicators — instant confidence */}
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {[
                "Secure payments",
                "Verified users",
                "Escrow protection",
                "Earn on your schedule",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-1.5 text-sm font-medium text-on-brand/80"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/25 text-gold">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Right: the product in motion ─── */}
          <div className="relative mt-16 lg:mt-0">
            <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Live on NeedFull
              </p>

              {/* Step 1 — posted */}
              <div className="mt-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </span>
                    <span className="mt-1 w-px flex-1 bg-gray-200" />
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-bold text-gray-900">
                      Task posted — Laundry &amp; Washing
                    </p>
                    <p className="text-xs text-gray-500">
                      Ada needs 5 items washed and ironed · ₦2,500
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 — accepted */}
              <div>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
                        />
                      </svg>
                    </span>
                    <span className="mt-1 w-px flex-1 bg-gray-200" />
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-bold text-gray-900">
                      Runner accepted — Tamara B. ⭐ 4.9
                    </p>
                    <p className="text-xs text-gray-500">
                      Escrow locked · your money can&apos;t be touched
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 — released */}
              <div>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                        />
                      </svg>
                    </span>
                    <span className="mt-1 w-px flex-1 bg-gray-200" />
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-bold text-gray-900">
                      Task completed — ₦2,500 released
                    </p>
                    <p className="text-xs text-gray-500">
                      Tamara earned ₦2,500. Ada left a 5-star review.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live activity chips */}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                <span className="rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand">
                  Escrow Active
                </span>
                <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold text-gold">
                  Payment Protected
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
                  213 tasks completed this week
                </span>
              </div>
            </div>

            {/* Floating chips */}
            <div className="absolute -top-5 -right-2 rounded-xl bg-white px-4 py-2.5 shadow-lg sm:-right-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-xs text-gray-500">Task completed</p>
                  <p className="text-sm font-bold text-gray-900">
                    ₦2,500 released
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-2 rounded-xl bg-brand px-4 py-3 text-on-brand shadow-lg sm:-left-5">
              <p className="text-xs font-semibold text-on-brand/80">
                Verified helper · Trust score 4.9
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}