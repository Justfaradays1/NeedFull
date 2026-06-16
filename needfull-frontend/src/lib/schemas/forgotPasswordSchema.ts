// WHAT: Zod schema for forgot password form validation
// WHY: Validates email format before submission to prevent invalid requests
// FUTURE: Add rate limiting hints based on submission history

import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
