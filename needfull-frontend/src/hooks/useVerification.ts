// WHAT: Verification status hook — fetches verification state and handles all verification flows
// WHY: Centralize verification logic (email, phone, student ID) and API calls
// FUTURE: Add phone verification with SMS/WhatsApp, add student ID auto-verification with ML

'use client';

import { useState, useCallback, useEffect } from 'react';
import apiClient from '@/lib/apiClient';

// WHAT: Verification status types
export interface VerificationStatus {
  email: {
    verified: boolean;
    verifiedAt?: string;
  };
  phone: {
    verified: boolean;
    verifiedAt?: string;
    phone?: string;
  };
  studentId: {
    status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
    submittedAt?: string;
    approvedAt?: string;
    rejectionReason?: string;
    matricNumber?: string;
    documentUrl?: string;
  };
}

// WHAT: Trust score breakdown returned from backend
export interface TrustScoreBreakdown {
  rating: number;
  completion: number;
  verification: number;
  reports: number;
  tenure: number;
  total: number;
}

// WHAT: Hook for verification management
export function useVerification() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [trustBreakdown, setTrustBreakdown] = useState<TrustScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WHAT: Fetch current verification status and trust breakdown
  // WHY: Show user's current verification state and trust impact
  const fetchVerificationStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual endpoints once backend is ready
      // const [statusRes, trustRes] = await Promise.all([
      //   apiClient.get('/users/verification-status'),
      //   apiClient.get('/users/trust-breakdown'),
      // ]);
      
      // Mock data for now
      setStatus({
        email: {
          verified: true,
          verifiedAt: new Date().toISOString(),
        },
        phone: {
          verified: false,
        },
        studentId: {
          status: 'not_submitted',
        },
      });

      setTrustBreakdown({
        rating: 0,
        completion: 0,
        verification: 5, // Only email verified
        reports: 0,
        tenure: 0,
        total: 5,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch verification status');
    } finally {
      setLoading(false);
    }
  }, []);

  // WHAT: Resend email verification OTP
  // WHY: User might not receive original or OTP expired
  const resendEmailVerification = useCallback(async () => {
    try {
      setError(null);
      // TODO: Call backend endpoint
      // await apiClient.post('/auth/resend-email-verification');
      alert('Verification email sent! Check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification');
    }
  }, []);

  // WHAT: Send phone verification OTP via SMS
  // WHY: Start phone verification flow
  const sendPhoneOtp = useCallback(async (phoneNumber: string) => {
    try {
      setError(null);
      // TODO: Call backend endpoint
      // await apiClient.post('/users/send-phone-otp', { phoneNumber });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
      return false;
    }
  }, []);

  // WHAT: Verify phone with OTP
  // WHY: Complete phone verification flow
  const verifyPhoneOtp = useCallback(async (otp: string) => {
    try {
      setError(null);
      // TODO: Call backend endpoint
      // await apiClient.post('/users/verify-phone-otp', { otp });
      
      // Update local state
      setStatus(prev => prev ? {
        ...prev,
        phone: {
          ...prev.phone,
          verified: true,
          verifiedAt: new Date().toISOString(),
        },
      } : null);

      // Update trust breakdown
      setTrustBreakdown(prev => prev ? {
        ...prev,
        verification: prev.verification + 4, // +4 for phone
        total: prev.total + 4,
      } : null);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
      return false;
    }
  }, []);

  // WHAT: Submit student ID for verification
  // WHY: Start student ID verification process
  const submitStudentId = useCallback(async (
    documentFile: File,
    matricNumber: string
  ) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('document', documentFile);
      formData.append('matricNumber', matricNumber);

      // TODO: Call backend endpoint
      // await apiClient.post('/users/submit-student-id', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' },
      // });

      // Update local state
      setStatus(prev => prev ? {
        ...prev,
        studentId: {
          ...prev.studentId,
          status: 'pending',
          submittedAt: new Date().toISOString(),
          matricNumber,
        },
      } : null);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit student ID');
      return false;
    }
  }, []);

  // WHAT: Fetch verification status on mount
  useEffect(() => {
    fetchVerificationStatus();
  }, [fetchVerificationStatus]);

  return {
    status,
    trustBreakdown,
    loading,
    error,
    fetchVerificationStatus,
    resendEmailVerification,
    sendPhoneOtp,
    verifyPhoneOtp,
    submitStudentId,
  };
}
