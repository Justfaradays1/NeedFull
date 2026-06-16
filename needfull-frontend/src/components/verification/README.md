# Student Verification Components

## Overview

Comprehensive verification system for NeedFull users. Manages three verification types (Email, Phone, Student ID) with trust score integration.

## Components

### EmailVerificationCard

Shows email verification status with resend functionality.

```tsx
import { EmailVerificationCard } from "@/components/verification";

<EmailVerificationCard
  verified={true}
  verifiedAt="2026-06-05T10:30:00Z"
  onResend={() => console.log("Resend")}
  isLoading={false}
/>;
```

**Props:**

- `verified: boolean` - Whether email is verified
- `verifiedAt?: string` - ISO timestamp of verification
- `onResend: () => void | Promise<void>` - Callback when resend is clicked
- `isLoading?: boolean` - Loading state while sending

**Status Display:**

- ✓ **Verified**: Green badge, timestamp shown
- **Pending**: "Resend Verification Email" button active

---

### PhoneVerificationCard

Shows phone verification status with OTP flow (SMS).

```tsx
import { PhoneVerificationCard } from "@/components/verification";

<PhoneVerificationCard
  verified={false}
  onSendOtp={(phone) => console.log("Send OTP to", phone)}
  onVerifyOtp={(otp) => console.log("Verify OTP", otp)}
  isLoading={false}
/>;
```

**Props:**

- `verified: boolean` - Whether phone is verified
- `verifiedAt?: string` - ISO timestamp of verification
- `phone?: string` - Phone number if verified
- `onSendOtp: (phoneNumber: string) => void | Promise<void>` - Callback when OTP requested
- `onVerifyOtp: (otp: string) => void | Promise<void>` - Callback when OTP submitted
- `isLoading?: boolean` - Loading state

**Flow:**

1. User enters phone number → Click "Send OTP via SMS"
2. OTP sent to phone number
3. User enters 6-digit OTP
4. OTP verified, phone marked as verified

**FUTURE:** WhatsApp fallback if SMS fails

---

### StudentIDVerificationCard

Shows student ID verification with document upload and matric number.

```tsx
import { StudentIDVerificationCard } from "@/components/verification";

<StudentIDVerificationCard
  status="not_submitted"
  onSubmit={(file, matricNumber) => console.log(file, matricNumber)}
  isLoading={false}
/>;
```

**Props:**

- `status: 'not_submitted' | 'pending' | 'approved' | 'rejected'` - Verification status
- `submittedAt?: string` - ISO timestamp of submission
- `approvedAt?: string` - ISO timestamp of approval
- `rejectionReason?: string` - Reason if rejected
- `matricNumber?: string` - Student matric number if submitted
- `documentUrl?: string` - URL to uploaded document
- `onSubmit: (file: File, matricNumber: string) => void | Promise<void>` - Callback on submit
- `isLoading?: boolean` - Loading state

**Status Displays:**

- **Not Submitted**: Upload form with file picker and matric number input
- **Pending**: "Under review — we'll notify you within 24 hours"
- **Approved**: Green badge "Verified Student", shows matric number
- **Rejected**: Rejection reason + resubmit button

**Upload Features:**

- Camera button for direct capture
- File picker for gallery
- Image preview before submit
- Matric number input (auto-uppercase)
- File size limit: 5MB
- Image format only

---

## Full Page Example

```tsx
import VerificationPage from "@/app/settings/verification/page";

// Page automatically handles:
// - Fetching verification status
// - Managing verification flows
// - Displaying trust score impact
// - Updating trust breakdown on successful verifications
```

## Hook: useVerification

```tsx
const {
  status, // VerificationStatus object
  trustBreakdown, // TrustScoreBreakdown with points
  loading, // Loading state for initial fetch
  error, // Error message if any
  resendEmailVerification, // () => Promise<void>
  sendPhoneOtp, // (phone: string) => Promise<void>
  verifyPhoneOtp, // (otp: string) => Promise<void>
  submitStudentId, // (file: File, matric: string) => Promise<void>
} = useVerification();
```

## Trust Score Impact

| Verification | Points | Backend Event      |
| ------------ | ------ | ------------------ |
| Email        | +5     | `email_verified`   |
| Phone        | +4     | `phone_verified`   |
| Student ID   | +6     | `student_verified` |

All events are fire-and-forget with `onTrustEvent()`.

## Backend Integration Points

### Endpoints Needed

1. **GET /users/verification-status**
   - Response: `VerificationStatus`
   - Shows current verification state

2. **GET /users/trust-breakdown**
   - Response: `TrustScoreBreakdown`
   - Shows verification points earned

3. **POST /auth/resend-email-verification**
   - Resends email OTP

4. **POST /users/send-phone-otp**
   - Body: `{ phoneNumber: string }`
   - Sends SMS OTP

5. **POST /users/verify-phone-otp**
   - Body: `{ otp: string }`
   - Verifies OTP, triggers `phone_verified` event

6. **POST /users/submit-student-id**
   - Multipart form: `{ document: File, matricNumber: string }`
   - Stores for admin review, triggers `student_verified` event on approval

## Styling

- Uses Tailwind CSS
- Lucide icons for consistency
- Responsive grid layout
- Color-coded by verification type:
  - Email: Green (trust)
  - Phone: Blue (connection)
  - Student ID: Purple (official)

## State Management

Uses React hooks with local state for:

- File preview
- OTP input
- Loading states
- Error messages

Trust score updates handled by `useVerification` hook callback.

## FUTURE Enhancements

- [ ] SMS OTP via Termii/AfricasTalking integration
- [ ] WhatsApp OTP fallback
- [ ] AI-based student ID verification
- [ ] Auto-extract matric number from document
- [ ] Verify against university databases
- [ ] Verification progress analytics
- [ ] Email reminders for incomplete verifications
- [ ] Verification badges on user profile
- [ ] Biometric verification for sensitive operations
