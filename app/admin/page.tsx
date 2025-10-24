import { requireAdmin, requireOwner, logout } from '@/lib/auth';
import Card from '@/app/components/Card';

async function signOut() {
  'use server';
  await logout();
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
    <main className="max-w-5xl mx-auto pa-lg">
      {/* Header with ma-md spacing (natural breath) */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-yugen mb-3">
          <span lang="en">Admin</span>
          {' — '}
          <span lang="ja">管理</span>
        </h1>

        <div className="space-y-2 text-muted-foreground text-sm">
          <p lang="en">
            Local Class (ローカル分類) is our project&apos;s category. Each item selects one primary Local Class.
            It may link to a preferred external Classification (AAT/Wikidata). Classifications (分類) are
            canonical external authorities; Items inherit via Local Classes.
          </p>
          <p lang="ja">
            Local Classes（ローカル分類）は本プロジェクトの分類体系です。各アイテムは一つの主要ローカル分類を選びます。
            Classifications（分類; AAT/Wikidata）は外部の権威データで、ローカル分類から代表リンクとして参照します。
          </p>
        </div>
      </header>

      {/* Card grid with ma-md gap (natural breath between cards) */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card href="/members" title="Members" subtitle="会員 — Social directory and connections" />
        <Card href="/admin/members" title="Manage Members" subtitle="会員管理 — Add, edit, and manage user accounts" />
        <Card href="/admin/chakai" title="Chakai" subtitle="茶会 — Oversee gatherings" />
        <Card href="/admin/tea-rooms" title="Tea Rooms" subtitle="茶室 — Rooms and places" />
        <Card href="/admin/items" title="Items" subtitle="道具 — Inventory and details" />
        <Card href="/admin/items/new" title="New Item" subtitle="新アイテム — Create new item" />
        <Card href="/admin/media" title="Media" subtitle="メディア — Library and linking" />
        <Card href="/admin/local-classes" title="Local Classes" subtitle="ローカル分類 — Project taxonomy (preferred external link)" />
        <Card href="/admin/classifications" title="Classifications" subtitle="分類 — AAT/Wikidata authorities" />
        <Card href="/admin/tea-schools" title="Tea Schools" subtitle="流派 — Lineages and schools" />
        <Card href="/lookup" title="Lookup" subtitle="用語検索 — Category lookup" />
      </section>

      {/* Sign out button with shibui color (subtle elegance) */}
      <form action={signOut} className="mt-8">
        <button className="text-sm text-shibui hover:text-shibui/80 underline underline-offset-4" type="submit">
          Sign out
        </button>
      </form>
    </main>
  );
}
