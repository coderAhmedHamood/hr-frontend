'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { toWesternDigits } from '@/shared/utils';

interface AmountInputProps {
  value: number;
  onChange: (next: number) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Numeric field for accounting forms. Uses a text input so the value always renders
 * with Western digits (`type="number"` inherits the Arabic locale and renders ١٢٣),
 * while keeping partial input such as `12.` typeable.
 */
export function AmountInput({ value, onChange, className, disabled }: AmountInputProps) {
  const [text, setText] = React.useState(() => String(value));
  const isEditing = React.useRef(false);

  React.useEffect(() => {
    if (!isEditing.current) setText(String(value));
  }, [value]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      dir="ltr"
      autoComplete="off"
      disabled={disabled}
      value={text}
      className={className}
      onFocus={() => {
        isEditing.current = true;
      }}
      onBlur={() => {
        isEditing.current = false;
        setText(String(value));
      }}
      onChange={(event) => {
        const raw = toWesternDigits(event.target.value).replace(/[^\d.]/g, '');
        setText(raw);
        const parsed = Number.parseFloat(raw);
        onChange(Number.isFinite(parsed) ? parsed : 0);
      }}
    />
  );
}
