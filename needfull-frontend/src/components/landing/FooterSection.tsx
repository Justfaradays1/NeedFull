export function FooterSection() {
  return (
    <footer className="border-t px-4 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-footer-bg)', borderColor: 'var(--color-footer-border)' }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <a href="/" className="flex items-center gap-2" aria-label="NeedFull home">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-gold" style={{ boxShadow: 'inset 0 1px 0 rgba(234,163,37,0.3)' }}>
                <svg viewBox="0 0 36 36" fill="none" className="w-[19px] h-[19px]">
                  <rect x="12" y="24" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.18"/>
                  <rect x="2" y="27.5" width="26" height="3" rx="1.5" fill="currentColor" opacity="0.28"/>
                  <circle cx="23" cy="9" r="4" fill="currentColor"/>
                  <path d="M23 13v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M23 19.5l-2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M23 19.5l2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M23 15.5l-7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="14" r="4" fill="white" fillOpacity="0.9"/>
                  <path d="M8 18v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9"/>
                  <path d="M8 24.5l-2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
                  <path d="M8 24.5l2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
                  <path d="M8 20l7.5-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
                  <circle cx="16" cy="21" r="2.5" fill="currentColor"/>
                  <circle cx="16" cy="21" r="1.5" fill="#1A6B4A"/>
                </svg>
              </div>
              <span className="font-bold text-lg font-display" style={{ color: 'var(--color-foreground)' }}>NeedFull</span>
            </a>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              FUOYE&apos;s trusted student task marketplace. Earn money, get help, build your reputation.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold" style={{ color: 'var(--color-foreground)' }}>For students</h4>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--color-muted)' }}>
              <li><a href="/register" className="transition-colors hover:text-brand">Browse tasks</a></li>
              <li><a href="/register" className="transition-colors hover:text-brand">Start earning</a></li>
              <li><a href="/register" className="transition-colors hover:text-brand">Trust scores</a></li>
              <li><a href="#how-it-works" className="transition-colors hover:text-brand">How it works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold" style={{ color: 'var(--color-foreground)' }}>For task posters</h4>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--color-muted)' }}>
              <li><a href="/register" className="transition-colors hover:text-brand">Post a task</a></li>
              <li><a href="#safety" className="transition-colors hover:text-brand">How escrow works</a></li>
              <li><a href="/register" className="transition-colors hover:text-brand">Pricing</a></li>
              <li><a href="#features" className="transition-colors hover:text-brand">Student benefits</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold" style={{ color: 'var(--color-foreground)' }}>Company</h4>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--color-muted)' }}>
              <li><a href="#hero" className="transition-colors hover:text-brand">About NeedFull</a></li>
              <li><a href="mailto:support@needfull.ng" className="transition-colors hover:text-brand">Contact us</a></li>
              <li><a href="#how-it-works" className="transition-colors hover:text-brand">How it works</a></li>
              <li><a href="#safety" className="transition-colors hover:text-brand">Safety &amp; escrow</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-sm" style={{ borderColor: 'var(--color-footer-border)', color: 'var(--color-muted)' }}>
          &copy; 2026 NeedFull. All rights reserved. Federal University Oye Ekiti.
        </div>
      </div>
    </footer>
  );
}
