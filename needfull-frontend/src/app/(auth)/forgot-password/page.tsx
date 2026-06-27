'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const emailError = email && !emailRegex.test(email) ? 'Please enter a valid email address' : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (emailError) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to send reset link. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page flex min-h-screen flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
        <a href="/" className="inline-flex items-center gap-2.5" aria-label="NeedFull home">
          <div className="w-11 h-11 bg-brand rounded-[12px] flex items-center justify-center text-gold" style={{ boxShadow: 'inset 0 1px 0 rgba(234,163,37,0.3)' }}>
            <svg viewBox="0 3 36 30" fill="none" className="w-[28px] h-[28px]">
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
          <span className="font-bold text-xl font-display text-gray-900">NeedFull</span>
        </a>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-sm">
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-7 w-7 text-green-600" aria-hidden="true" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">Check your email</h2>
              <p className="mb-6 text-sm text-gray-500">
                We sent a password reset link to <strong className="text-gray-700">{email}</strong>
              </p>
              <a href="/login" className="text-sm font-semibold text-brand hover:underline">Back to sign in</a>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-xl font-bold text-gray-900">Reset your password</h2>
              <p className="mb-6 text-sm text-gray-500">Enter your email and we&apos;ll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className={`block w-full rounded-[10px] border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                      emailError ? 'border-danger focus:border-danger' : 'border-gray-300 focus:border-brand'
                    }`}
                    placeholder="you@example.com"
                  />
                  {emailError && (
                    <p className="flex items-center gap-1 text-sm text-danger" role="alert">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {emailError}
                    </p>
                  )}
                </div>
                {error && (
                  <p className="flex items-center gap-1 text-sm text-danger" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting || !!emailError || !email}
                  className="w-full rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-all hover:bg-brand-mid disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </span>
                  ) : 'Send reset link'}
                </button>
              </form>
              <p className="mt-6 text-center text-xs text-gray-500">
                <a href="/login" className="font-semibold text-brand hover:underline">Back to sign in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
