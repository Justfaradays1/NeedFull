// WHAT: Multi-step registration form with progress tracking
// WHY: Guides users through registration, breaks down into manageable steps
// FUTURE: Add save-draft functionality, add step validation before proceeding, add analytics tracking

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/store';
import { post } from '@/lib/apiClient';
import { OTPInput } from './OTPInput';
import {
  registerDetailsSchema,
  registerVerifySchema,
  registerProfileSchema,
  type RegisterDetailsData,
  type RegisterVerifyData,
  type RegisterProfileData,
  type RegistrationPayload,
} from '@/lib/schemas/registerSchema';

type RegistrationStep = 'details' | 'verify' | 'profile';

interface RegistrationState {
  details: RegisterDetailsData | null;
  email: string;
  otp: string;
  profile: RegisterProfileData | null;
}

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('details');
  const [state, setState] = useState<RegistrationState>({
    details: null,
    email: '',
    otp: '',
    profile: null,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  // WHAT: Step 1 - Details form
  const detailsForm = useForm<RegisterDetailsData>({
    resolver: zodResolver(registerDetailsSchema),
    mode: 'onBlur',
  });

  // WHAT: Step 2 - OTP form
  const verifyForm = useForm<RegisterVerifyData>({
    resolver: zodResolver(registerVerifySchema),
    mode: 'onChange',
  });

  // WHAT: Step 3 - Profile form
  const profileForm = useForm<RegisterProfileData>({
    resolver: zodResolver(registerProfileSchema),
    mode: 'onBlur',
  });

  // WHAT: Handle Step 1 submission
  // WHY: Store details and move to verification step
  async function onDetailsSubmit(data: RegisterDetailsData) {
    setSubmitError(null);
    try {
      setState({
        ...state,
        details: data,
        email: data.email,
      });
      setCurrentStep('verify');
    } catch (error) {
      setSubmitError('Failed to proceed. Please try again.');
    }
  }

  // WHAT: Handle Step 2 submission (OTP verification)
  // WHY: Verify email by submitting OTP, move to profile step
  async function onVerifySubmit(data: RegisterVerifyData) {
    setSubmitError(null);
    try {
      setState({
        ...state,
        otp: data.otp,
      });
      setCurrentStep('profile');
    } catch (error) {
      setSubmitError('Failed to verify OTP. Please try again.');
    }
  }

  // WHAT: Handle Step 3 submission (Profile)
  // WHY: Complete registration with all data
  async function onProfileSubmit(data: RegisterProfileData) {
    setSubmitError(null);
    try {
      if (!state.details) {
        setSubmitError('Missing registration details. Please start over.');
        return;
      }

      // WHAT: Combine all form data into registration payload
      const payload: RegistrationPayload = {
        ...state.details,
        ...data,
      };

      // WHAT: Call register endpoint
      await registerUser(payload.fullName, payload.email, payload.password, payload.phone);

      // WHAT: Call verify-email endpoint with OTP
      await post('/auth/verify-email', {
        email: payload.email,
        otp: state.otp,
      });

      // WHAT: Registration complete
      toast.success('Welcome to NeedFull! Account created successfully.');
      router.push('/feed');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    }
  }

  // WHAT: Calculate progress percentage
  const progressPercentage = {
    details: 33,
    verify: 66,
    profile: 100,
  }[currentStep];

  return (
    <div className="space-y-6">
      {/* WHAT: Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Step {['details', 'verify', 'profile'].indexOf(currentStep) + 1} of 3</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* WHAT: Error message display */}
      {submitError && (
        <div className="rounded-lg bg-danger/10 p-4 text-sm text-danger">
          {submitError}
        </div>
      )}

      {/* WHAT: Step 1 - Details */}
      {currentStep === 'details' && (
        <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)} className="space-y-4">
          <h2 className="font-display text-xl font-bold">Create your account</h2>

          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="John Doe"
              disabled={isLoading}
              className="tap-target w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base placeholder-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50"
              {...detailsForm.register('fullName')}
            />
            {detailsForm.formState.errors.fullName && (
              <p className="text-sm text-danger">
                {detailsForm.formState.errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@fuoye.edu.ng"
              disabled={isLoading}
              className="tap-target w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base placeholder-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50"
              {...detailsForm.register('email')}
            />
            {detailsForm.formState.errors.email && (
              <p className="text-sm text-danger">
                {detailsForm.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+234 (0) 123 4567"
              disabled={isLoading}
              className="tap-target w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base placeholder-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50"
              {...detailsForm.register('phone')}
            />
            {detailsForm.formState.errors.phone && (
              <p className="text-sm text-danger">
                {detailsForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter a strong password"
              disabled={isLoading}
              className="tap-target w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base placeholder-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50"
              {...detailsForm.register('password')}
            />
            {detailsForm.formState.errors.password && (
              <p className="text-sm text-danger">
                {detailsForm.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              disabled={isLoading}
              className="tap-target w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base placeholder-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50"
              {...detailsForm.register('confirmPassword')}
            />
            {detailsForm.formState.errors.confirmPassword && (
              <p className="text-sm text-danger">
                {detailsForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="tap-target w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-dark focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:bg-brand-dark disabled:opacity-50"
          >
            Next: Verify Email
          </button>
        </form>
      )}

      {/* WHAT: Step 2 - OTP Verification */}
      {currentStep === 'verify' && (
        <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-bold">Verify your email</h2>
            <p className="mt-1 text-sm text-gray-600">
              We sent a 6-digit code to {state.email}
            </p>
          </div>

          {/* OTP Input */}
          <OTPInput
            value={verifyForm.watch('otp') || ''}
            onChange={(value) => verifyForm.setValue('otp', value)}
            onComplete={() => verifyForm.handleSubmit(onVerifySubmit)()}
            disabled={isLoading}
          />

          {verifyForm.formState.errors.otp && (
            <p className="text-center text-sm text-danger">
              {verifyForm.formState.errors.otp.message}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep('details')}
              disabled={isLoading}
              className="tap-target flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="inline h-4 w-4" /> Back
            </button>
            <button
              type="submit"
              disabled={isLoading || verifyForm.watch('otp')?.length !== 6}
              className="tap-target flex-1 rounded-lg bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-dark focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:bg-brand-dark disabled:opacity-50"
            >
              Next: Profile
            </button>
          </div>
        </form>
      )}

      {/* WHAT: Step 3 - Profile */}
      {currentStep === 'profile' && (
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <h2 className="font-display text-xl font-bold">Complete your profile</h2>

          {/* School */}
          <div className="space-y-2">
            <label htmlFor="school" className="block text-sm font-medium">
              School
            </label>
            <input
              id="school"
              type="text"
              placeholder="Federal University Oye-Ekiti"
              disabled={isLoading}
              className="tap-target w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base placeholder-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50"
              {...profileForm.register('school')}
            />
            {profileForm.formState.errors.school && (
              <p className="text-sm text-danger">
                {profileForm.formState.errors.school.message}
              </p>
            )}
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label htmlFor="department" className="block text-sm font-medium">
              Department
            </label>
            <input
              id="department"
              type="text"
              placeholder="Computer Science"
              disabled={isLoading}
              className="tap-target w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base placeholder-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50"
              {...profileForm.register('department')}
            />
            {profileForm.formState.errors.department && (
              <p className="text-sm text-danger">
                {profileForm.formState.errors.department.message}
              </p>
            )}
          </div>

          {/* Level */}
          <div className="space-y-2">
            <label htmlFor="level" className="block text-sm font-medium">
              Academic level
            </label>
            <select
              id="level"
              disabled={isLoading}
              className="tap-target w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50"
              {...profileForm.register('level')}
            >
              <option value="">Select your level</option>
              <option value="100">100 Level</option>
              <option value="200">200 Level</option>
              <option value="300">300 Level</option>
              <option value="400">400 Level</option>
              <option value="500">500 Level</option>
            </select>
            {profileForm.formState.errors.level && (
              <p className="text-sm text-danger">
                {profileForm.formState.errors.level.message}
              </p>
            )}
          </div>

          {/* Hostel */}
          <div className="space-y-2">
            <label htmlFor="hostel" className="block text-sm font-medium">
              Hostel name
            </label>
            <input
              id="hostel"
              type="text"
              placeholder="e.g., Hostel A, Off-campus"
              disabled={isLoading}
              className="tap-target w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base placeholder-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50"
              {...profileForm.register('hostel')}
            />
            {profileForm.formState.errors.hostel && (
              <p className="text-sm text-danger">
                {profileForm.formState.errors.hostel.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep('verify')}
              disabled={isLoading}
              className="tap-target flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="inline h-4 w-4" /> Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="tap-target flex-1 rounded-lg bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-dark focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:bg-brand-dark disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
