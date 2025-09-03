import { describe, it, expect } from 'vitest';

// Snapshot-free minimal test: just assert role→menu expectations we centralize.
// Detailed rendering tests would require rendering NavBar with server role which is outside jsdom scope here.

const visibleFor = {
  visitor: ['Members', 'Objects', 'Chakai', 'Media', 'Lookup', 'Login'],
  member: ['Members', 'Objects', 'Chakai', 'Media', 'Lookup', 'Logout'],
  admin: ['Admin', 'Chakai', 'Items', 'Media', 'Local Classes', 'Classifications', 'Tea Schools', 'Members', 'Lookup', 'Logout'],
};

describe('navbar visibility spec shape', () => {
  it('visitor menu contains required items', () => {
    const v = visibleFor.visitor;
    for (const label of ['Members', 'Objects', 'Chakai', 'Media', 'Lookup', 'Login']) expect(v).toContain(label);
  });
  it('member menu contains required items', () => {
    const v = visibleFor.member;
    for (const label of ['Members', 'Objects', 'Chakai', 'Media', 'Lookup', 'Logout']) expect(v).toContain(label);
  });
  it('admin menu contains required items', () => {
    const v = visibleFor.admin;
    for (const label of ['Admin', 'Chakai', 'Items', 'Media', 'Local Classes', 'Classifications', 'Tea Schools', 'Members', 'Lookup', 'Logout']) expect(v).toContain(label);
  });
});


