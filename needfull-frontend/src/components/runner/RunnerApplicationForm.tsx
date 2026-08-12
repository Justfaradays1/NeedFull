'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressSteps, type Step } from '@/components/ui/progress-steps';
import { post } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { useAuthUser } from '@/store';
import {
  ChevronLeft, ArrowRight, Upload, Loader2, Check,
  User, Mail, Phone, GraduationCap, Building, Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const STEPS: Step[] = [
  { id: 'about', label: 'About You' },
  { id: 'identity', label: 'Identity' },
  { id: 'bank', label: 'Bank & Payout' },
  { id: 'review', label: 'Review & Submit' },
];

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  school: string;
  idCardFile: File | null;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export function RunnerApplicationForm() {
  const router = useRouter();
  const user = useAuthUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: '',
    school: '',
    idCardFile: null,
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  const idCardUploaded = form.idCardFile !== null;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); o.disconnect(); } },
      { threshold: 0.1 },
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);

  const goTo = (step: number) => {
    setFadeKey((k) => k + 1);
    setCurrentStep(step);
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: return form.fullName.trim().length > 0 && form.phone.trim().length >= 5;
      case 1: return idCardUploaded;
      case 2: return form.bankName.trim().length > 0 && form.accountNumber.trim().length >= 10 && form.accountName.trim().length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (form.idCardFile) {
        const fd = new FormData();
        fd.append('idCard', form.idCardFile);
        await post('/users/me/verify-student', fd).catch(() => {});
      }
      const res = await post<any>('/users/me/apply-runner');
      if (res.success === false) throw new Error(res.message || 'Unknown error');
      toast.success('Application submitted! We\u2019ll review it shortly.');
      router.push('/profile');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Something went wrong';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div ref={sectionRef} className="relative px-4 py-14 md:py-20 md:px-6">
      <style>{`
        @keyframes fadeStep { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-step { animation: fadeStep 0.35s ease-out both; }
      `}</style>

      <div className="mx-auto max-w-2xl">
        {/* Section heading */}
        <div
          className={`mb-8 text-center transition-all duration-700 ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="font-display text-2xl font-extrabold text-gray-900 md:text-3xl">
            Apply to Become a Runner
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Complete all four steps to submit your application
          </p>
        </div>

        {/* Progress */}
        <div
          className={`transition-all duration-700 delay-100 ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <ProgressSteps steps={STEPS} currentStep={currentStep} />
        </div>

        <div className="mt-10 space-y-5 animate-fade-step" key={fadeKey}>
          {/* ─── Step 1: About You ─── */}
          {currentStep === 0 && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-amber-100">About You</h3>
              <p className="text-sm text-gray-500 -mt-3 dark:text-amber-400/60">We&apos;ll use this to verify your identity.</p>

              <Field
                label="Full Name"
                icon={User}
                value={form.fullName}
                onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
                placeholder="Your full name"
              />
              <Field
                label="Email Address"
                icon={Mail}
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder="your@email.com"
                disabled
              />
              <Field
                label="Phone Number"
                icon={Phone}
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="080 1234 5678"
                type="tel"
              />
              <Field
                label="School / University"
                icon={GraduationCap}
                value={form.school}
                onChange={(v) => setForm((f) => ({ ...f, school: v }))}
                placeholder="e.g. FUOYE"
              />
            </>
          )}

          {/* ─── Step 2: Identity Verification ─── */}
          {currentStep === 1 && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-amber-100">Identity Verification</h3>
              <p className="text-sm text-gray-500 -mt-3 dark:text-amber-400/60">
                Upload a valid student ID card so we can verify you&apos;re a student.
              </p>

              <button
                type="button"
                onClick={() => idInputRef.current?.click()}
                className={cn(
                  'tap-target flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-all',
                  idCardUploaded
                    ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30'
                    : 'border-gray-300 bg-gray-50 hover:border-brand/40 hover:bg-brand-light/20 dark:border-gray-700 dark:bg-amber-950/20 dark:hover:border-amber-600/40 dark:hover:bg-amber-950/40',
                )}
              >
                {idCardUploaded ? (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-7 w-7 text-green-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-700">ID Card uploaded</p>
                      <p className="text-xs text-green-600 mt-0.5">{form.idCardFile!.name}</p>
                    </div>
                    <span className="text-xs text-gray-500 underline">Tap to change file</span>
                  </>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light">
                      <Upload className="h-7 w-7 text-brand-text" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900 dark:text-amber-100">Upload Student ID</p>
                      <p className="text-xs text-gray-500 mt-0.5 dark:text-amber-400/60">JPG or PNG, max 5MB</p>
                    </div>
                  </>
                )}
              </button>
              <input
                ref={idInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setForm((f) => ({ ...f, idCardFile: file }));
                }}
              />
            </>
          )}

          {/* ─── Step 3: Bank & Payout ─── */}
          {currentStep === 2 && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-amber-100">Bank &amp; Payout</h3>
              <p className="text-sm text-gray-500 -mt-3 dark:text-amber-400/60">
                Where should we send your earnings?
              </p>

              <Field
                label="Bank Name"
                icon={Building}
                value={form.bankName}
                onChange={(v) => setForm((f) => ({ ...f, bankName: v }))}
                placeholder="e.g. GTBank, Access Bank"
              />
              <Field
                label="Account Number"
                icon={Banknote}
                value={form.accountNumber}
                onChange={(v) => setForm((f) => ({ ...f, accountNumber: v }))}
                placeholder="0123456789"
                type="tel"
                maxLength={10}
              />
              <Field
                label="Account Name"
                icon={User}
                value={form.accountName}
                onChange={(v) => setForm((f) => ({ ...f, accountName: v }))}
                placeholder="Name on bank account"
              />
            </>
          )}

          {/* ─── Step 4: Review & Submit ─── */}
          {currentStep === 3 && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-amber-100">Review &amp; Submit</h3>
              <p className="text-sm text-gray-500 -mt-3 dark:text-amber-400/60">
                Please confirm everything is correct before submitting.
              </p>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-amber-950/20">
                <ReviewRow label="Full Name" value={form.fullName} />
                <ReviewRow label="Email" value={form.email} />
                <ReviewRow label="Phone" value={form.phone || 'Not provided'} />
                <ReviewRow label="School" value={form.school || 'Not provided'} />
                <ReviewRow label="Student ID" value={idCardUploaded ? 'Uploaded' : 'Not uploaded'} />
                <ReviewRow label="Bank" value={form.bankName || 'Not provided'} />
                <ReviewRow label="Account" value={form.accountNumber ? `****${form.accountNumber.slice(-4)}` : 'Not provided'} />
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs leading-relaxed text-amber-800">
                  By submitting, you confirm that all information is accurate. False information may result in
                  permanent disqualification from the NeedFull network.
                </p>
              </div>
            </>
          )}
        </div>

        {/* ─── Navigation ─── */}
        <div
          className={`mt-8 flex items-center justify-between transition-all duration-700 delay-200 ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={() => goTo(currentStep - 1)}
              disabled={submitting}
              className="tap-target inline-flex items-center gap-1.5 rounded-xl border-2 border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-100 active:scale-[0.97] disabled:opacity-50 dark:border-gray-700 dark:text-amber-300 dark:hover:border-amber-600 dark:hover:bg-amber-950/30"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => goTo(currentStep + 1)}
              disabled={!canProceed()}
              className="tap-target inline-flex items-center gap-1.5 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30 disabled:grayscale-[0.4]"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="tap-target inline-flex items-center gap-2 rounded-xl bg-gold px-8 py-3 text-sm font-bold text-white shadow-lg shadow-gold/30 transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function Field({
  label, icon: Icon, value, onChange, placeholder, disabled, type, maxLength,
}: {
  label: string;
  icon: React.FC<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-amber-300/70">
        <Icon className="h-3.5 w-3.5 text-gray-400 dark:text-amber-400/50" />
        {label}
      </label>
      <input
        type={type || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-amber-950/20 dark:text-amber-50 dark:placeholder-amber-400/50 dark:focus:border-amber-500 dark:focus:ring-amber-500/20 dark:disabled:bg-amber-950/40 dark:disabled:text-amber-400/50"
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 pb-2 last:border-0 last:pb-0 dark:border-gray-700">
      <span className="text-xs font-medium text-gray-500 dark:text-amber-400/70">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-amber-100">{value}</span>
    </div>
  );
}
