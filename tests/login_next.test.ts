import { describe, it, expect } from 'vitest';
import { validateNextPath } from '../lib/translate';
import { defaultPathForRole } from '../lib/roles';

describe('validateNextPath', () => {
  it('accepts simple paths', () => {
    expect(validateNextPath('/admin')).toBe('/admin');
    expect(validateNextPath('/members?x=1#y')).toBe('/members?x=1#y');
  });
  it('rejects external urls', () => {
    expect(validateNextPath('https://evil.com/attack')).toBeNull();
  });
  it('rejects protocol-relative', () => {
    expect(validateNextPath('//evil.com/path')).toBeNull();
  });
  it('rejects non-root paths', () => {
    expect(validateNextPath('admin')).toBeNull();
  });
});

describe('defaultPathForRole', () => {
  it('maps roles to default paths', () => {
    expect(defaultPathForRole('owner')).toBe('/admin');
    expect(defaultPathForRole('admin')).toBe('/admin');
    expect(defaultPathForRole('member')).toBe('/members');
    expect(defaultPathForRole('visitor')).toBe('/');
  });
});


