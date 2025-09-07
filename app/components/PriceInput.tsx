"use client";

import { useMemo, useState } from 'react';

type Props = {
  name?: string;
  defaultValue?: number | string | null;
  className?: string;
  inputClassName?: string;
  canEdit?: boolean; // When true, auto-unmask on focus for authorized users
};

function formatJPY(value: number | string | null | undefined): string {
  if (value == null || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const grouped = Math.round(n).toLocaleString('en-US');
  return `JPY ${grouped}`;
}

export default function PriceInput({ name = 'price', defaultValue, className, inputClassName, canEdit = false }: Props) {
  const [hidden, setHidden] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [val, setVal] = useState<string>(
    defaultValue == null ? '' : String(defaultValue)
  );
  const preview = useMemo(() => formatJPY(val), [val]);
  
  // Auto-unmask when canEdit is true and field is focused
  const shouldShowValue = !hidden || (canEdit && isFocused);

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        name={name}
        type={shouldShowValue ? 'text' : 'password'}
        inputMode="numeric"
        pattern="[0-9]*"
        className={inputClassName || 'input'}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <span className="text-xs text-gray-600" title={shouldShowValue ? '' : canEdit ? 'Focus input to reveal price' : 'Click Show to reveal price'}>
        {shouldShowValue ? (preview || '—') : '••••••'}
      </span>
      <button
        type="button"
        aria-label={hidden ? 'Show price' : 'Hide price'}
        onClick={() => setHidden((v) => !v)}
        className="button secondary"
        style={{ padding: '2px 8px' }}
      >
        {hidden ? 'Show' : 'Hide'}
      </button>
    </div>
  );
}


