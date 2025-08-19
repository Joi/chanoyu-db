import { redirect } from 'next/navigation';
import { login, requireAdmin } from '@/lib/auth';

async function signIn(formData: FormData) {
  'use server';
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const ok = await login(email, password);
  if (ok) redirect('/admin');
  redirect('/login?error=invalid');
}

export default async function LoginPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  if (await requireAdmin()) redirect('/admin');
  const error = typeof searchParams?.error === 'string' ? searchParams!.error : undefined;
  return (
    <main className="max-w-sm mx-auto my-10">
      <h1 className="text-xl font-semibold">Sign in</h1>
      {error ? (
        <div className="mt-3 border border-rose-200 bg-rose-50 rounded-lg p-3">
          <p className="text-sm">Invalid email or password. Please try again.</p>
        </div>
      ) : null}
      <form action={signIn} className="mt-4 border border-borderGray rounded-lg p-4 bg-white space-y-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Email</label>
          <input name="email" type="email" className="w-full border border-borderGray rounded-md px-3 py-2" required />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Password</label>
          <input name="password" type="password" className="w-full border border-borderGray rounded-md px-3 py-2" required />
        </div>
        <div className="pt-1">
          <button className="inline-flex items-center justify-center bg-primaryBlue hover:bg-hoverBlue text-white rounded-md px-4 py-2" type="submit">Log in</button>
        </div>
      </form>
    </main>
  );
}
