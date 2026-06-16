// WHAT: Zod schemas for multi-step registration form
// WHY: Validates each step independently, ensures data integrity
// FUTURE: Add server-side validation schemas, add real-time email uniqueness check

import { z } from 'zod';

// WHAT: Step 1 - User details validation
export const registerDetailsSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must be less than 100 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterDetailsData = z.infer<typeof registerDetailsSchema>;

// WHAT: Step 2 - Email verification OTP
export const registerVerifySchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

export type RegisterVerifyData = z.infer<typeof registerVerifySchema>;

// WHAT: Step 3 - User profile information
export const registerProfileSchema = z.object({
  school: z.string().min(1, 'School is required'),
  department: z.string().min(1, 'Department is required'),
  level: z.enum(['100', '200', '300', '400', '500'], {
    errorMap: () => ({ message: 'Please select a valid level' }),
  }),
  hostel: z
    .string()
    .min(1, 'Hostel name is required')
    .max(100, 'Hostel name must be less than 100 characters'),
});

export type RegisterProfileData = z.infer<typeof registerProfileSchema>;

// WHAT: Complete registration payload combining all steps
export type RegistrationPayload = RegisterDetailsData & RegisterProfileData;
