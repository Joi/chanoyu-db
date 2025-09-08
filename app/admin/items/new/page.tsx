import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mintToken } from '@/lib/id';
import { requireAdmin } from '@/lib/auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SubmitButton from '@/app/components/SubmitButton';

async function createObject(formData: FormData): Promise<void> {
  'use server';
  
  // Require admin access
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');
  
  const title = String(formData.get('title') || '').trim();
  const title_ja = String(formData.get('title_ja') || '').trim() || null;
  const local_number = String(formData.get('local_number') || '').trim() || null;

  if (!title) {
    // Redirect back with error if title is missing
    return redirect('/admin/items/new?error=title-required');
  }

  const token = mintToken(12);
  const db = supabaseAdmin();
  
  const { error } = await db.from('objects').insert({
    token,
    title,
    title_ja,
    local_number,
    visibility: 'public',
  });
  
  if (error) {
    console.error('[createObject] database error:', error);
    return redirect('/admin/items/new?error=database');
  }
  
  revalidatePath(`/id/${token}`);
  revalidatePath('/admin/items');
  redirect(`/admin/${token}`);
}

export default async function NewItemPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');

  const error = typeof searchParams?.error === 'string' ? searchParams.error : undefined;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">New Item</h1>
        <a href="/admin/items" className="text-sm underline">← Back to Items</a>
      </div>

      {error ? (
        <div className="card mb-4" style={{ background: '#fff1f2', borderColor: '#fecdd3' }}>
          <div>Error: {error === 'title-required' ? 'Title is required' : error === 'database' ? 'Database error occurred' : error}</div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Create New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createObject} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title (EN) *</Label>
              <Input id="title" name="title" required placeholder="Enter item title" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title_ja">Title (JA)</Label>
              <Input id="title_ja" name="title_ja" placeholder="アイテムタイトル" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="local_number">Local Number</Label>
              <Input id="local_number" name="local_number" placeholder="Optional local identifier" />
            </div>

            <div className="pt-2">
              <SubmitButton label="Create Item" pendingLabel="Creating..." />
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}