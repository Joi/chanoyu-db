import { redirect } from 'next/navigation';
import { getCurrentRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const { role } = await getCurrentRole();
  if (role === 'owner' || role === 'admin') {
    redirect('/admin');
  }
  if (role === 'member') {
    redirect('/members');
  }

  return (
    <main>
      <section className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold">Chanoyu Collections</h1>
        <h2 className="text-base text-muted-foreground" lang="ja">茶道の記録と共有</h2>

        <p className="mt-4 text-base leading-relaxed">
          Preserve and share tea ceremony knowledge. Browse public information or sign in to manage private records.
        </p>
        <p className="text-base leading-relaxed">
          茶会（茶会／chakai）、茶室、道具、メディアを相互に関連付けて記録します。
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/lookup" className="btn btn-primary" role="button">Browse Lookup</a>
          <a href="/login" className="btn btn-outline" role="button">Log in</a>
        </div>
      </section>
    </main>
  );
}
