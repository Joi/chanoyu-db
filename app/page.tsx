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
      <section className="prose">
        <h1>Chanoyu Collections</h1>
        <h2 lang="ja">茶道の記録と共有</h2>

        <p>
          Preserve and share tea ceremony knowledge. Browse public information or sign in to manage private
          records. 茶会（茶会／chakai）、茶室、道具、メディアを相互に関連付けて記録します。
        </p>

        <h3>Explore</h3>
        <ul>
          <li><a href="/lookup">Browse Lookup</a></li>
          <li><a href="/login">Log in</a></li>
        </ul>
      </section>
    </main>
  );
}
