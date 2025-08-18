"use client";

import { useMemo, useState } from 'react';

type Props = {
  name?: string;
  defaultValue?: number | string | null;
  className?: string;
  inputClassName?: string;
};

function formatJPY(value: number | string | null | undefined): string {
  if (value == null || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const grouped = Math.round(n).toLocaleString('en-US');
  return `JPY ${grouped}`;
}

export default function PriceInput({ name = 'price', defaultValue, className, inputClassName }: Props) {
  const [hidden, setHidden] = useState(true);
  const [val, setVal] = useState<string>(
    defaultValue == null ? '' : String(defaultValue)
  );
  const preview = useMemo(() => formatJPY(val), [val]);

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        name={name}
        type={hidden ? 'password' : 'text'}
        inputMode="numeric"
        pattern="[0-9]*"
        className={inputClassName || 'input'}
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      {preview ? (
        <span className="text-xs text-gray-600" title={hidden ? 'Click Show to reveal price' : ''}>
          {hidden ? '••••••' : preview}
        </span>
      ) : null}
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


