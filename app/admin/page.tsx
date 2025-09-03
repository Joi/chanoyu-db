import { requireAdmin, requireOwner, logout } from '@/lib/auth';
import Link from 'next/link';

async function signOut() {
  'use server';
  await logout();
}

function Card({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link href={href} className="card hover:shadow-sm transition-shadow" style={{ display: 'block' }}>
      <div className="font-medium">{title}</div>
      <div className="text-sm text-gray-700" lang="ja">{subtitle}</div>
    </Link>
  );
}

export default async function AdminHome() {
  const ok = await requireAdmin();
  if (!ok) {
    return (
      <main className="max-w-2xl mx-auto my-20 px-6">
        <p>You are not signed in. <a className="underline" href="/login">Go to login</a>.</p>
      </main>
    );
  }
  const isOwner = await requireOwner();

  return (
    <main className="max-w-5xl mx-auto my-10 px-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Admin — 管理</h1>
        <p className="text-sm text-gray-700 mt-1" lang="en">
          Local Class (ローカル分類) is our project’s category. Each item selects one primary Local Class. It may link to a preferred external Classification (AAT/Wikidata). Classifications (分類) are canonical external authorities; Items inherit via Local Classes.
        </p>
        <p className="text-sm text-gray-700 mt-1" lang="ja">
          Local Classes（ローカル分類）は本プロジェクトの分類体系です。各アイテムは一つの主要ローカル分類を選びます。
          Classifications（分類; AAT/Wikidata）は外部の権威データで、ローカル分類から代表リンクとして参照します。
        </p>
      </header>
      <section className="grid" style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <Card href="/admin/members" title="Members" subtitle="会員 — People and profiles" />
        <Card href="/admin/chakai" title="Chakai" subtitle="茶会 — Oversee gatherings" />
        <Card href="/admin/tea-rooms" title="Tea Rooms" subtitle="茶室 — Rooms and places" />
        <Card href="/admin/items" title="Items" subtitle="道具 — Inventory and details" />
        <Card href="/admin/media" title="Media" subtitle="メディア — Library and linking" />
        <Card href="/admin/local-classes" title="Local Classes" subtitle="ローカル分類 — Project taxonomy (preferred external link)" />
        <Card href="/admin/classifications" title="Classifications" subtitle="分類 — AAT/Wikidata authorities" />
        <Card href="/admin/tea-schools" title="Tea Schools" subtitle="流派 — Lineages and schools" />
        <Card href="/lookup" title="Lookup" subtitle="用語検索 — Category lookup" />
        {/* Removed direct create object shortcut; use Items page */}
      </section>
      <form action={signOut} className="mt-6">
        <button className="text-sm underline" type="submit">Sign out</button>
      </form>
    </main>
  );
}
