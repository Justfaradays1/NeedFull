import { z } from 'zod';

const nameRegex = /^[a-zA-ZÀ-ÿ\s'\-.]{2,100}$/;

export const registerDetailsSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must be less than 100 characters')
      .regex(nameRegex, 'Full name contains invalid characters')
      .transform((v) => v.replace(/\s+/g, ' ').trim()),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .transform((v) => v.trim().toLowerCase()),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^[\d\s\-\+\(\)]{7,20}$/, 'Enter a valid phone number (e.g. +234 801 234 5678)'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterDetailsData = z.infer<typeof registerDetailsSchema>;

export const registerVerifySchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

export type RegisterVerifyData = z.infer<typeof registerVerifySchema>;

export const registerProfileSchema = z.object({
  school: z
    .string()
    .min(1, 'School is required')
    .max(200, 'School name must be less than 200 characters')
    .transform((v) => v.trim()),
  department: z
    .string()
    .min(1, 'Department is required')
    .max(200, 'Department must be less than 200 characters')
    .transform((v) => v.trim()),
  level: z.enum(['100', '200', '300', '400', '500'], {
    errorMap: () => ({ message: 'Please select a valid level' }),
  }),
  hostel: z
    .string()
    .min(1, 'Hostel name is required')
    .max(100, 'Hostel name must be less than 100 characters')
    .transform((v) => v.trim()),
});

export type RegisterProfileData = z.infer<typeof registerProfileSchema>;

export type RegistrationPayload = RegisterDetailsData & RegisterProfileData;
