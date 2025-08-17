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
    <main style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1>Sign in</h1>
      {error ? (
        <div className="card" style={{ marginTop: 12, background: '#fff1f2', borderColor: '#fecdd3' }}>
          <p className="text-sm">Invalid email or password. Please try again.</p>
        </div>
      ) : null}
      <form action={signIn} className="card" style={{ marginTop: 16 }}>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" required />
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="label">Password</label>
          <input name="password" type="password" className="input" required />
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="button" type="submit">Log in</button>
        </div>
      </form>
    </main>
  );
}
