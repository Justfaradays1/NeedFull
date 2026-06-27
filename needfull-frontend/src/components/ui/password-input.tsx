'use client';

import { useState, forwardRef, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  autoCorrect?: string;
  autoCapitalize?: string;
  spellCheck?: boolean;
  hint?: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      id,
      name,
      placeholder = 'Enter your password',
      disabled = false,
      required = false,
      minLength,
      value,
      onChange,
      autoComplete = 'off',
      autoCorrect = 'off',
      autoCapitalize = 'off',
      spellCheck = false,
      hint,
      className = '',
      wrapperClassName = '',
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(false);

    const toggle = useCallback(() => setVisible((v) => !v), []);

    return (
      <div className={wrapperClassName}>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            name={name}
            type={visible ? 'text' : 'password'}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            minLength={minLength}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
            autoCapitalize={autoCapitalize}
            spellCheck={spellCheck}
            className={`block w-full rounded-[10px] border border-gray-300 px-4 py-2.5 pr-12 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50 ${className}`}
          />
          <button
            type="button"
            onClick={toggle}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
            aria-label={visible ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {hint && <div className="mt-1.5 text-[11px] text-gray-500">{hint}</div>}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
