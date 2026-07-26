// WHAT: Verification status hook — fetches verification state and handles all verification flows
// WHY: Centralize verification logic (email, phone, student ID) and API calls
// FUTURE: Add phone verification with SMS/WhatsApp, add student ID auto-verification with ML

'use client';

import { useState, useCallback, useEffect } from 'react';
import apiClient from '@/lib/apiClient';

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

export interface TrustScoreBreakdown {
  rating: number;
  completion: number;
  verification: number;
  reports: number;
  tenure: number;
  total: number;
}

export function useVerification() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [trustBreakdown, setTrustBreakdown] = useState<TrustScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerificationStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusRes, trustRes] = await Promise.all([
        apiClient.get('/users/me/verification-status'),
        apiClient.get('/users/me/trust-breakdown'),
      ]);

      const sd = statusRes.data?.data;
      const td = trustRes.data?.data;

      if (sd) {
        setStatus({
          email: { verified: sd.email?.verified ?? false, verifiedAt: sd.email?.verifiedAt },
          phone: { verified: sd.phone?.verified ?? false, phone: sd.phone?.phone },
          studentId: {
            status: sd.studentId?.status ?? 'not_submitted',
            submittedAt: sd.studentId?.submittedAt,
            rejectionReason: sd.studentId?.rejectionReason,
            documentUrl: sd.studentId?.documentUrl,
          },
        });
      }

      if (td) {
        setTrustBreakdown({
          rating: td.rating ?? 0, completion: td.completion ?? 0,
          verification: td.verification ?? 0, reports: td.reports ?? 0,
          tenure: td.tenure ?? 0, total: td.total ?? 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch verification status');
    } finally {
      setLoading(false);
    }
  }, []);

  const resendEmailVerification = useCallback(async () => {
    try {
      setError(null);
      await apiClient.post('/auth/resend-email-verification');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to resend verification';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const sendPhoneOtp = useCallback(async (phoneNumber: string) => {
    try {
      setError(null);
      await apiClient.post('/users/send-phone-otp', { phoneNumber });
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
      return false;
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (otp: string) => {
    try {
      setError(null);
      await apiClient.post('/users/verify-phone-otp', { otp });
      await fetchVerificationStatus();
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to verify OTP');
      return false;
    }
  }, [fetchVerificationStatus]);

  const submitStudentId = useCallback(async (documentFile: File, _matricNumber: string) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('idCard', documentFile);

      await apiClient.post('/users/me/verify-student', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchVerificationStatus();
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit student ID');
      return false;
    }
  }, [fetchVerificationStatus]);

  useEffect(() => {
    fetchVerificationStatus();
  }, [fetchVerificationStatus]);

  return {
    status, trustBreakdown, loading, error,
    fetchVerificationStatus, resendEmailVerification,
    sendPhoneOtp, verifyPhoneOtp, submitStudentId,
  };
}
