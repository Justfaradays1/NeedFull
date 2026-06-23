export default function ForgotPasswordPage() {
  return (
    <div className="auth-page flex min-h-screen flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
        <a href="/" className="inline-flex items-center gap-2.5" aria-label="NeedFull home">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-gold">
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
          <span className="font-bold text-lg font-display text-gray-900">NeedFull</span>
        </a>
        <p className="mt-1 text-sm text-gray-500">Student task marketplace at FUOYE</p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-sm">
          <h2 className="mb-2 text-xl font-bold text-gray-900">Reset your password</h2>
          <p className="mb-6 text-sm text-gray-500">Enter your email and we&apos;ll send you a reset link.</p>
          <form action="/api/auth/forgot-password" method="POST" className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</label>
              <input id="email" name="email" type="email" required className="block w-full rounded-[10px] border border-gray-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" placeholder="you@example.com" />
            </div>
            <button type="submit" className="w-full rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-all duration-150 hover:bg-brand-mid active:scale-[0.97]">Send reset link</button>
          </form>
          <p className="mt-6 text-center text-xs text-gray-500">
            <a href="/login" className="font-semibold text-brand hover:underline">Back to sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
