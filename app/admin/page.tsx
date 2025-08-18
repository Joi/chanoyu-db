import { requireAdmin, requireOwner, logout } from '@/lib/auth';
import Link from 'next/link';

async function signOut() {
  'use server';
  await logout();
}

export default async function AdminHome() {
  const ok = await requireAdmin();
  if (!ok) {
    return (
      <main style={{ maxWidth: 640, margin: '80px auto', padding: 24 }}>
        <p>You are not signed in. <a className="underline" href="/login">Go to login</a>.</p>
      </main>
    );
  }
  const isOwner = await requireOwner();

  return (
    <main style={{ maxWidth: 640, margin: '40px auto', padding: 24 }}>
      <h1 className="text-xl font-semibold mb-4">Admin</h1>
      <ul className="list-disc pl-5 space-y-2">
        <li><Link href="/admin/items" className="underline">Items</Link> <span className="text-xs text-gray-600">(lightweight)</span></li>
        <li><Link href="/admin/items-and-images" className="underline">Items and Images</Link></li>
        <li><Link href="/admin/classifications" className="underline">Classifications</Link></li>
        <li><Link href="/admin/media" className="underline">Media</Link></li>
        <li><Link href="/admin/new" className="underline">Create object</Link></li>
        <li><Link href="/lookup" className="underline">Category Lookup (AAT + Wikidata)</Link></li>
        {/* Accounts merged into Members */}
        <li><Link href="/admin/members" className="underline">Members</Link></li>
      </ul>
      <form action={signOut} className="mt-6">
        <button className="text-sm underline" type="submit">Sign out</button>
      </form>
    </main>
  );
}
