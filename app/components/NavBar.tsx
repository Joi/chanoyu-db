import NavBarClient from './NavBarClient';
import { currentUserEmailUnsafe } from '@/lib/auth';

export default function NavBar() {
  const email = currentUserEmailUnsafe();
  const isLoggedIn = !!email;
  return <NavBarClient isLoggedIn={isLoggedIn} />;
}


