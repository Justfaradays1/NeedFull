export function AboutSection() {
  return (
    <section id="about" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <span
              className="mb-4 inline-flex items-center rounded-full px-3.5 py-1 text-[13px] font-semibold tracking-wide sm:text-sm"
              style={{
                backgroundColor: "var(--color-accent-light)",
                color: "var(--color-accent)",
              }}
            >
              Our mission
            </span>
            <h2
              className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-[1.12] tracking-tight"
              style={{ color: "var(--color-foreground)" }}
            >
              Local commerce, reimagined for African{" "}
              <span style={{ color: "var(--color-brand)" }}>trust</span>.
            </h2>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed sm:text-base">
              <p style={{ color: "var(--color-muted)" }}>
                Every day, people need help with everyday tasks&mdash;laundry
                done, notes shared, groceries delivered, documents proofread.
                And right beside them are people ready to work. The problem? No
                one trusts a stranger with their money.
              </p>
              <p style={{ color: "var(--color-muted)" }}>
                NeedFull solves that. We are the trusted middleman that holds
                payment in escrow until the task is completed to your
                satisfaction. Money only moves when both sides are happy.
              </p>
              <p style={{ color: "var(--color-muted)" }}>
                Built for communities across Nigeria, we are building a local
                economy that lets everyone earn real money, build a reputation,
                and access the services they need&mdash;no bank account required,
                no complicated setup, just you and the people around you.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div
              className="rounded-2xl border p-6 sm:p-8"
              style={{
                backgroundColor: "var(--color-card-bg)",
                borderColor: "var(--color-card-border)",
              }}
            >
              <h3
                className="font-display text-lg font-bold"
                style={{ color: "var(--color-foreground)" }}
              >
                The problem we exist to solve
              </h3>
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "var(--color-muted)" }}
              >
                &ldquo;Someone needs help with a task right now. Someone else
                wants to earn money. Neither trusts the other enough to hand
                over cash.&rdquo;
              </p>
              <div
                className="mt-5 flex items-center gap-4 rounded-xl p-4"
                style={{
                  backgroundColor: "var(--color-accent-light)",
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: "var(--color-brand)" }}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p
                  className="text-sm font-semibold leading-snug"
                  style={{ color: "var(--color-accent)" }}
                >
                  NeedFull is the trusted middleman. Every payment is
                  escrow-protected. Always.
                </p>
              </div>
            </div>
            <div
              className="rounded-2xl border p-6 sm:p-8"
              style={{
                backgroundColor: "var(--color-card-bg)",
                borderColor: "var(--color-card-border)",
              }}
            >
              <h3
                className="font-display text-lg font-bold"
                style={{ color: "var(--color-foreground)" }}
              >
                Our vision
              </h3>
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "var(--color-muted)" }}
              >
                Today one community. Tomorrow every community in Nigeria.
                We&rsquo;re building the infrastructure for a generation of
                people who earn, learn, and thrive&mdash;on their own terms.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {["One community", "Nigeria", "Africa"].map((phase) => (
                  <span
                    key={phase}
                    className="rounded-full px-3.5 py-1.5 text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--color-accent-light)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {phase}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
