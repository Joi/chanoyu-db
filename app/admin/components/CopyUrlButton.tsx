'use client'
import { useState } from 'react';

export default function CopyUrlButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    try {
      const origin = window.location.origin;
      await navigator.clipboard.writeText(`${origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  return (
    <button className="text-xs underline" onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy URL'}
    </button>
  );
}


