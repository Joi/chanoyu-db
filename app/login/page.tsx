import { redirect } from 'next/navigation';
import { login, requireAdmin } from '@/lib/auth';

async function signIn(formData: FormData) {
  'use server';
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const ok = await login(email, password);
  if (ok) redirect('/admin');
}

export default async function LoginPage() {
  if (await requireAdmin()) redirect('/admin');
  return (
    <main style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1>Sign in</h1>
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
