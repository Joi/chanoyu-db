import { redirect } from 'next/navigation';
import { getCurrentRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MembersLanding() {
  const { role } = await getCurrentRole();
  if (role === 'visitor') return redirect('/login?next=/members');
  return (
    <main className="max-w-2xl mx-auto my-10 px-6">
      <h1 className="text-xl font-semibold">Members — 会員</h1>
      <section className="mt-4 space-y-2">
        <p>Quick actions</p>
        <ul className="list-disc pl-5">
          <li><a className="underline" href="/chakai">Start a Chakai</a></li>
          <li><a className="underline" href="/admin/items">Add Item</a></li>
          <li><a className="underline" href="/admin/media">Upload Media</a></li>
          <li><a className="underline" href="/tea-rooms">Create Tea Room</a></li>
        </ul>
      </section>
      <section className="mt-6">
        <h2 className="font-medium">Learn the model</h2>
        <p className="mt-2 text-sm">
          Chakai (茶会) happen in Tea Rooms (茶室) and use Items (道具). Link Media (メディア) to document. Describe Items with
          Local Classes (ローカル分類). External types are resolved via the Local Class preferred Classification (分類).
        </p>
      </section>
    </main>
  );
}


