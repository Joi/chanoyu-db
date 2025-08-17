import { describe, it, expect } from 'vitest';

function extractToken(v: string): string {
  const s = (v || '').trim();
  if (!s) return '';
  const m = s.match(/\/id\/([A-Za-z0-9_-]+)$/);
  if (m) return m[1];
  const m2 = s.match(/^[a-z0-9]{8,32}$/);
  return m2 ? s : '';
}

describe('extractToken', () => {
  it('handles canonical URL', () => {
    expect(extractToken('https://example.com/id/abc123')).toBe('abc123');
  });
  it('handles bare token', () => {
    expect(extractToken('k7m9q2w3tz')).toBe('k7m9q2w3tz');
  });
  it('rejects invalid', () => {
    expect(extractToken('https://example.com/not/abc')).toBe('');
  });
});


