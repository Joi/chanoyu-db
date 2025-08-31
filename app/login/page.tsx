import { redirect } from 'next/navigation';
import { login, currentUserEmail, currentUserEmailUnsafe, getCurrentRole, defaultPathForRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateNextPath } from '@/lib/translate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function signIn(formData: FormData) {
  'use server';
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const nextRaw = String(formData.get('next') || '');
  const nextPath = validateNextPath(nextRaw);
  const ok = await login(email, password);
  if (ok) {
    if (nextPath) return redirect(nextPath);
    const { role } = await getCurrentRole();
    return redirect(defaultPathForRole(role));
  }
  redirect('/login?error=invalid');
}

export default async function LoginPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  // Check quickly via unsafe decode first to avoid fail-closed UI when verification fails locally
  const email = (currentUserEmailUnsafe() || (await currentUserEmail()));
  if (email) {
    const db = supabaseAdmin();
    const { data: acct } = await db
      .from('accounts')
      .select('full_name_en, full_name_ja, email')
      .eq('email', email)
      .maybeSingle();
    const displayName = (acct as any)?.full_name_en || (acct as any)?.full_name_ja || email;

    return (
      <main className="max-w-sm mx-auto my-10">
        <h1 className="text-xl font-semibold">Logged in</h1>
        <div className="mt-3 border border-borderGray bg-white rounded-lg p-4">
          <p className="text-sm">Logged in as <strong>{String(displayName)}</strong>.</p>
          <form action="/logout" method="post" className="mt-3">
            <button className="button" type="submit">Sign out</button>
          </form>
          <p className="mt-2 text-xs text-gray-500">If you are logged in and having difficulty seeing protected items, try signing out and logging in again to clear the cookie.</p>
        </div>
      </main>
    );
  }

  const error = typeof searchParams?.error === 'string' ? searchParams!.error : undefined;
  const nextParam = typeof searchParams?.next === 'string' ? searchParams!.next : undefined;
  const nextSafe = validateNextPath(nextParam || undefined) || '';
  const signedOut = searchParams?.signedout === '1';
  return (
    <main className="max-w-sm mx-auto my-10">
      <h1 className="text-xl font-semibold">Sign in</h1>
      {signedOut ? (
        <div className="mt-3 border border-emerald-200 bg-emerald-50 rounded-lg p-3">
          <p className="text-sm">You have been signed out.</p>
        </div>
      ) : null}
      {error ? (
        <div className="mt-3 border border-rose-200 bg-rose-50 rounded-lg p-3">
          <p className="text-sm">Invalid email or password. Please try again.</p>
        </div>
      ) : null}
      <form action={signIn} className="mt-4 border border-borderGray rounded-lg p-4 bg-white space-y-3">
        {nextSafe ? <input type="hidden" name="next" value={nextSafe} /> : null}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Email</label>
          <input name="email" type="email" className="w-full border border-borderGray rounded-md px-3 py-2" required />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Password</label>
          <input name="password" type="password" className="w-full border border-borderGray rounded-md px-3 py-2" required />
        </div>
        <div className="pt-1">
          <button className="button" type="submit">Sign in</button>
        </div>
      </form>
    </main>
  );
}
