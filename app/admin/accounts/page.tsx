import { redirect } from 'next/navigation';

export default function AccountsRedirect() {
  redirect('/admin/members');
}
