"use client";

import { useState } from 'react';

type Props = {
  price: number | null | undefined;
  className?: string;
  buttonClassName?: string;
};

function formatJPY(value: number): string {
  // Comma-separated groups with explicit JPY prefix
  const grouped = Number.isFinite(value) ? Math.round(value).toLocaleString('en-US') : String(value);
  return `JPY ${grouped}`;
}

export default function RevealPrice({ price, className, buttonClassName }: Props) {
  const [revealed, setRevealed] = useState(false);
  if (price == null) return <span className={className}>—</span>;
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span>{revealed ? formatJPY(Number(price)) : '••••••'}</span>
      <button
        type="button"
        aria-label={revealed ? 'Hide price' : 'Reveal price'}
        onClick={() => setRevealed((v) => !v)}
        className={buttonClassName}
        style={{
          border: '1px solid #ddd',
          borderRadius: 4,
          padding: '0 6px',
          lineHeight: '18px',
          fontSize: 12,
          background: '#fafafa',
        }}
      >
        {revealed ? 'Hide' : 'Show'}
      </button>
    </span>
  );
}


