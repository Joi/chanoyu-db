import NavBarClient from './NavBarClient';
import { getCurrentRole } from '@/lib/auth';

export default async function NavBar() {
  const { role } = await getCurrentRole();
  const isLoggedIn = role !== 'visitor';
  const isAdmin = role === 'owner' || role === 'admin';
  return <NavBarClient isLoggedIn={isLoggedIn} isAdmin={isAdmin} />;
}


