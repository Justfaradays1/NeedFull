'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuthHooks';
import { loginSchema, type LoginFormData } from '@/lib/schemas/loginSchema';

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await login(data.email, data.password);
      router.push('/feed');
      toast.success('Welcome back to NeedFull!');
    } catch (err: unknown) {
      if (error) {
        toast.error(error);
      } else {
        toast.error('Login failed. Please try again.');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          disabled={isLoading}
          className="tap-target w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base placeholder-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50 disabled:text-gray-500"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-danger">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            disabled={isLoading}
            className="tap-target w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-base placeholder-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50 disabled:text-gray-500"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="tap-target absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-danger">{errors.password.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-brand hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="tap-target w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white transition-all hover:bg-brand-dark focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:bg-brand-dark disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </button>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-brand hover:text-brand-mid"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
