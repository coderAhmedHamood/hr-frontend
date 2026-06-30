'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';

type VerificationCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  id?: string;
};

const LENGTH = 6;

export function VerificationCodeInput({
  value,
  onChange,
  disabled = false,
  error = false,
  id = 'verification-code',
}: VerificationCodeInputProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = React.useMemo(() => {
    const chars = value.replace(/\D/g, '').slice(0, LENGTH).split('');
    while (chars.length < LENGTH) chars.push('');
    return chars;
  }, [value]);

  const focusIndex = (index: number) => {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  };

  const commitDigits = (nextDigits: string[]) => {
    onChange(nextDigits.join('').replace(/\D/g, '').slice(0, LENGTH));
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    const next = [...digits];
    if (cleaned.length <= 1) {
      next[index] = cleaned;
      commitDigits(next);
      if (cleaned && index < LENGTH - 1) focusIndex(index + 1);
      return;
    }
    const pasted = cleaned.slice(0, LENGTH - index);
    for (let i = 0; i < pasted.length; i += 1) {
      next[index + i] = pasted[i] ?? '';
    }
    commitDigits(next);
    focusIndex(Math.min(index + pasted.length, LENGTH - 1));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusIndex(index - 1);
    }
    if (e.key === 'ArrowLeft' && index < LENGTH - 1) focusIndex(index + 1);
    if (e.key === 'ArrowRight' && index > 0) focusIndex(index - 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!pasted) return;
    onChange(pasted);
    focusIndex(Math.min(pasted.length, LENGTH) - 1);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5" dir="ltr">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputsRef.current[index] = el; }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={LENGTH}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-12 w-10 rounded-xl border bg-background text-center text-lg font-semibold tabular-nums shadow-soft transition-colors sm:h-14 sm:w-12 sm:text-xl',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : 'border-border',
            disabled && 'opacity-60',
          )}
          aria-label={`رقم ${index + 1}`}
        />
      ))}
    </div>
  );
}

export function isVerificationCodeComplete(code: string): boolean {
  return /^\d{6}$/.test(code);
}
