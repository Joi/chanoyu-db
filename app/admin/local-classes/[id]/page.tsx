import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { 
  updateLocalClassAction, 
  detachChildServerAction, 
  attachExistingChildServerAction, 
  deleteLocalClassServerAction 
} from './actions';
// Using simple <select> pulldowns to avoid accidental creation; search widget remains available on the New page

export const dynamic = 'force-dynamic';

export default async function LocalClassDetail({ params }: { params: { id: string } }) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const db = supabaseAdmin();
  const cid = params.id;

  const { data: cls } = await db
    .from('local_classes')
    .select('id, token, local_number, label_en, label_ja, description, parent_id')
    .eq('id', cid)
    .maybeSingle();
  if (!cls) return redirect('/admin/local-classes');

  // Breadcrumb via closure
  const { data: closure } = await db
    .from('local_class_hierarchy')
    .select('ancestor_id, descendant_id, depth')
    .eq('descendant_id', cid);
  const ancestorIds = Array.from(new Set(((closure || []) as any[]).map((r: any) => String(r.ancestor_id)).filter((x) => x !== cid)));
  let ancestors: any[] = [];
  if (ancestorIds.length) {
    const { data: rows } = await db
      .from('local_classes')
      .select('id, local_number, label_en, label_ja')
      .in('id', ancestorIds);
    ancestors = rows || [];
  }
  const byId: Record<string, any> = Object.create(null);
  for (const a of ancestors) byId[String(a.id)] = a;
  const ordered = ((closure || []) as any[])
    .filter((r: any) => String(r.ancestor_id) !== cid)
    .sort((a: any, b: any) => a.depth - b.depth)
    .map((r: any) => byId[String(r.ancestor_id)])
    .filter(Boolean);

  // Counts
  const [{ data: directC }, { data: totalC }] = await Promise.all([
    db.from('local_class_object_counts_direct').select('local_class_id, object_count').eq('local_class_id', cid),
    db.from('local_class_object_counts_total').select('local_class_id, object_count').eq('local_class_id', cid),
  ]);
  const direct = Number((directC?.[0]?.object_count ?? 0) as any);
  const total = Number((totalC?.[0]?.object_count ?? 0) as any);
  // Load options for parent/attach pulldowns
  const { data: allClasses } = await db
    .from('local_classes')
    .select('id, label_en, label_ja, local_number')
    .order('local_number')
    .limit(1000);
  const optionTitle = (r: any) => String(r.label_ja || r.label_en || r.local_number || r.id);


  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="text-sm text-gray-600 mb-2">
        <Link className="underline" href="/admin/local-classes">Local Classes</Link>
        {ordered.length ? (
          <> / {ordered.map((a: any, i: number) => (<span key={String(a.id)}>{i ? ' / ' : ''}<Link className="underline" href={`/admin/local-classes/${a.id}`}>{String(a.label_ja || a.label_en || a.local_number || a.id)}</Link></span>))}</>
        ) : null}
      </div>
      <h1 className="text-xl font-semibold">{String((cls as any).label_ja || (cls as any).label_en || (cls as any).local_number || (cls as any).token || (cls as any).id)}</h1>
      <div className="text-xs text-gray-600">{(cls as any).local_number || (cls as any).token}</div>

      <div className="mt-4 grid gap-2">
        <div className="card text-sm">
          <div><strong>Direct objects:</strong> {direct}</div>
          <div><strong>Total (incl. descendants):</strong> {total}</div>
        </div>
        <div className="card text-sm">
          <div className="mb-1"><strong>Description</strong></div>
          <div>{(cls as any).description || <span className="text-gray-500">(none)</span>}</div>
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold mb-2">Edit</h2>
          <form action={updateLocalClassAction} className="grid gap-2">
            <input type="hidden" name="class_id" value={cid} />
            <label className="label">Label (EN)</label>
            <input name="label_en" className="input" defaultValue={(cls as any).label_en || ''} />
            <label className="label">Label (JA)</label>
            <input name="label_ja" className="input" defaultValue={(cls as any).label_ja || ''} />
            <label className="label">Description</label>
            <textarea name="description" className="textarea" defaultValue={(cls as any).description || ''} />
            <label className="label">Parent</label>
            <select name="parent_local_class_id" className="input">
              <option value="">(none)</option>
              {(allClasses || []).filter((r: any) => String(r.id) !== cid).map((r: any) => (
                <option key={String(r.id)} value={String(r.id)} selected={String((cls as any).parent_id || '') === String(r.id)}>
                  {optionTitle(r)}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <button className="button" type="submit">Save</button>
              <form action={updateLocalClassAction}>
                <input type="hidden" name="class_id" value={cid} />
                <input type="hidden" name="parent_local_class_id" value="" />
                <button className="text-xs underline" type="submit">Clear parent</button>
              </form>
            </div>
          </form>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold mb-2">Children</h2>
          <AttachExistingChild parentId={cid} options={(allClasses || []).filter((r: any) => String(r.id) !== cid)} />
          <ChildList parentId={cid} />
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold mb-2">Danger zone</h2>
          <DeleteLocalClass cid={cid} disable={direct > 0} />
          {direct > 0 ? <div className="text-xs text-gray-600 mt-1">Cannot delete: class has directly assigned objects.</div> : null}
        </div>
      </div>
    </main>
  );
}

async function ChildList({ parentId }: { parentId: string }) {
  const db = supabaseAdmin();
  const { data: kids } = await db
    .from('local_classes')
    .select('id, local_number, label_en, label_ja')
    .eq('parent_id', parentId)
    .order('local_number');
  const list = kids || [];
  if (!list.length) return <div className="text-xs text-gray-600">No children</div>;
  return (
    <ul className="grid gap-1">
      {list.map((c: any) => (
        <li key={c.id} className="flex items-center justify-between">
          <Link className="underline" href={`/admin/local-classes/${c.id}`}>{String(c.label_ja || c.label_en || c.local_number || c.id)}</Link>
          <form action={detachChildServerAction}>
            <input type="hidden" name="parent_id" value={parentId} />
            <input type="hidden" name="child_id" value={String(c.id)} />
            <button className="text-xs underline text-red-600" type="submit">Detach</button>
          </form>
        </li>
      ))}
    </ul>
  );
}

async function AttachExistingChild({ parentId, options }: { parentId: string; options: any[] }) {
  return (
    <form action={attachExistingChildServerAction} className="grid gap-2 mb-3">
      <input type="hidden" name="parent_id" value={parentId} />
      <div className="text-xs text-gray-600">Attach existing child</div>
      <select name="attach_child_ids" className="input">
        <option value="">(select class)</option>
        {options.map((r: any) => (
          <option key={String(r.id)} value={String(r.id)}>{String(r.label_ja || r.label_en || r.local_number || r.id)}</option>
        ))}
      </select>
      <button className="button" type="submit">Attach</button>
    </form>
  );
}

function DeleteLocalClass({ cid, disable }: { cid: string; disable: boolean }) {
  return (
    <form action={deleteLocalClassServerAction}>
      <input type="hidden" name="class_id" value={cid} />
      <button className={`button ${disable ? 'opacity-50 cursor-not-allowed' : ''}`} type="submit" disabled={disable}>Delete class</button>
    </form>
  );
}


