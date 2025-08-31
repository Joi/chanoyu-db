export type UserRole = 'owner' | 'admin' | 'member' | 'visitor';

export function defaultPathForRole(role: UserRole): string {
  if (role === 'owner' || role === 'admin') return '/admin';
  if (role === 'member') return '/members';
  return '/';
}


