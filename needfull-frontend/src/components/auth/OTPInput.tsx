// WHAT: 6-digit OTP input component with auto-focus and auto-submit
// WHY: Provides smooth UX for email verification, auto-submits when complete
// FUTURE: Add copy-paste support, add resend timer, add audio/haptic feedback

'use client';

import { useEffect, useRef, useState } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  disabled?: boolean;
}

export function OTPInput({
  value,
  onChange,
  onComplete,
  disabled = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState<string[]>(value.split('').slice(0, 6));

  // WHAT: Update local state when value prop changes
  useEffect(() => {
    setOtp(value.split('').slice(0, 6));
  }, [value]);

  // WHAT: Handle digit input in any box
  // WHY: Auto-focus next box, prevent non-digit input, auto-submit when full
  function handleInput(index: number, inputValue: string) {
    // WHAT: Only allow single digit 0-9
    const digit = inputValue.replace(/\D/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    const otpString = newOtp.join('');
    onChange(otpString);

    // WHAT: Auto-focus next box if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // WHAT: Auto-submit when all 6 digits filled
    if (otpString.length === 6 && onComplete) {
      setTimeout(() => {
        onComplete();
      }, 100);
    }
  }

  // WHAT: Handle backspace to delete and focus previous
  // WHY: Improves UX for corrections
  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();

      const newOtp = [...otp];
      if (otp[index]) {
        // WHAT: If current box has value, clear it
        newOtp[index] = '';
      } else if (index > 0) {
        // WHAT: If empty, go back and clear previous
        newOtp[index - 1] = '';
        inputRefs.current[index - 1]?.focus();
      }

      setOtp(newOtp);
      onChange(newOtp.join(''));
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  return (
    <div className="space-y-4">
      {/* WHAT: 6 OTP input boxes */}
      <div className="flex justify-center gap-2 sm:gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otp[index] || ''}
            onChange={(e) => handleInput(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={disabled}
            className="tap-target h-12 w-12 rounded-lg border-2 border-gray-300 text-center text-xl font-bold focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-100 disabled:text-gray-400 sm:h-14 sm:w-14"
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>

      {/* WHAT: Helper text */}
      <p className="text-center text-sm text-gray-600">
        Auto-submits when all 6 digits entered
      </p>
    </div>
  );
}
