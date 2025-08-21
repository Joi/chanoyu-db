import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import type { LocalClass, Classification, LocalClassHierarchy, ObjectItem } from '@/lib/types/admin';
import { 
  updateLocalClassAction,
  addChildServerAction,
  detachChildServerAction,
  attachExistingChildServerAction,
  deleteLocalClassServerAction,
  addExistingExternalLinkAction,
  addExternalLinkAction,
  removeExternalLinkAction,
  setPreferredExternalAction,
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
    .select('id, token, local_number, label_en, label_ja, description, parent_id, preferred_classification_id')
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
  // Items directly in this class
  const { data: classItems } = await db
    .from('objects')
    .select('id, token, local_number, title, title_ja')
    .eq('primary_local_class_id', cid)
    .order('local_number', { ascending: true })
    .limit(500);
  // Load options for parent/attach pulldowns
  const { data: allClasses } = await db
    .from('local_classes')
    .select('id, label_en, label_ja, local_number')
    .order('local_number')
    .limit(1000);
  const optionTitle = (r: LocalClass) => String(r.label_ja || r.label_en || r.local_number || r.id);

  // External links (AAT / Wikidata)
  const { data: extLinks } = await db
    .from('local_class_links')
    .select('classification:classifications(id, scheme, uri, label, label_ja)')
    .eq('local_class_id', cid);
  const links = (extLinks || []).map((r: any) => r.classification).filter(Boolean);
  // For attach-existing pulldown
  const { data: allExt } = await db
    .from('classifications')
    .select('id, scheme, uri, label, label_ja')
    .in('scheme', ['aat','wikidata'])
    .order('scheme')
    .order('label');


  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="text-sm text-gray-600 mb-2">
        <Link className="underline" href="/admin/local-classes">Local Classes</Link>
        {ordered.length ? (
          <> / {ordered.map((a: any, i: number) => (<span key={String(a.id)}>{i ? ' / ' : ''}<Link className="underline" href={`/admin/local-classes/${a.id}`}>{String(a.label_ja || a.label_en || a.local_number || a.id)}</Link></span>))}</>
        ) : null}
      </div>
      <h1 className="text-xl font-semibold">{String(cls.label_ja || cls.label_en || cls.local_number || cls.token || cls.id)}</h1>
      <div className="text-xs text-gray-600">{cls.local_number || cls.token}</div>

      <div className="mt-4 grid gap-2">
        <div className="card text-sm">
          <div><strong>Direct objects:</strong> {direct}</div>
          <div><strong>Total (incl. descendants):</strong> {total}</div>
        </div>
        <div className="card text-sm">
          <div className="mb-1"><strong>Description</strong></div>
          <div>{cls.description || <span className="text-gray-500">(none)</span>}</div>
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold mb-2">Edit</h2>
          <form action={updateLocalClassAction} className="grid gap-2">
            <input type="hidden" name="class_id" value={cid} />
            <label className="label">Label (EN)</label>
            <input name="label_en" className="input" defaultValue={cls.label_en || ''} />
            <label className="label">Label (JA)</label>
            <input name="label_ja" className="input" defaultValue={cls.label_ja || ''} />
            <label className="label">Description</label>
            <textarea name="description" className="textarea" defaultValue={cls.description || ''} />
            <label className="label">Parent</label>
            <select name="parent_local_class_id" className="input" defaultValue={String(cls.parent_id || '')}>
              <option value="">(none)</option>
              {(allClasses || []).filter((r: any) => String(r.id) !== cid).map((r: any) => (
                <option key={String(r.id)} value={String(r.id)}>
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
          <h2 className="text-sm font-semibold mb-2">External Links (AAT / Wikidata)</h2>
          {links.length ? (
            <ul className="grid gap-1 mb-2">
              {links.map((c: any) => {
                const isPref = String(cls.preferred_classification_id || '') === String(c.id);
                return (
                  <li key={String(c.id)} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{String(c.label_ja || c.label || c.uri)}</div>
                      <div className="text-xs text-gray-600">{c.scheme} · <a className="underline" href={c.uri} target="_blank" rel="noreferrer">{c.uri}</a></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPref ? (
                        <span className="text-xs">Preferred</span>
                      ) : (
                        <form action={setPreferredExternalAction}>
                          <input type="hidden" name="class_id" value={cid} />
                          <input type="hidden" name="classification_id" value={String(c.id)} />
                          <button className="text-xs underline" type="submit">Set preferred</button>
                        </form>
                      )}
                      <form action={removeExternalLinkAction}>
                        <input type="hidden" name="class_id" value={cid} />
                        <input type="hidden" name="classification_id" value={String(c.id)} />
                        <button className="text-xs underline text-red-600" type="submit">Remove</button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-xs text-gray-600 mb-2">No external links yet.</div>
          )}
          <div className="grid gap-2 mb-2">
            <form action={addExistingExternalLinkAction} className="grid gap-2">
              <input type="hidden" name="class_id" value={cid} />
              <label className="label">Attach existing</label>
              <select name="classification_id" className="input">
                <option value="">(select AAT/Wikidata)</option>
                {(allExt || []).map((c: any) => (
                  <option key={String(c.id)} value={String(c.id)}>{`${c.scheme}: ${String(c.label_ja || c.label || c.uri)}`}</option>
                ))}
              </select>
              <button className="button" type="submit">Attach</button>
            </form>
          </div>
          <AddExternalLinkForm classId={cid} />
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold mb-2">Danger zone</h2>
          <DeleteLocalClass cid={cid} disable={direct > 0} />
          {direct > 0 ? <div className="text-xs text-gray-600 mt-1">Cannot delete: class has directly assigned objects.</div> : null}
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold mb-2">Items in this class</h2>
          {direct > 0 ? (
            <div className="text-xs text-gray-600 mb-2">{direct} direct item{direct === 1 ? '' : 's'}</div>
          ) : null}
          {(classItems || []).length ? (
            <ul className="grid gap-1">
              {(classItems || []).map((o: any) => (
                <li key={String(o.id)} className="text-sm">
                  <a className="underline" href={`/admin/${String(o.token || o.id)}`}>
                    {String(o.title_ja || o.title || o.local_number || o.id)}
                  </a>
                  {o.local_number ? <span className="text-xs text-gray-600"> · {o.local_number}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-gray-600">No items directly assigned to this class.</div>
          )}
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

function AddExternalLinkForm({ classId }: { classId: string }) {
  return (
    <form action={addExternalLinkAction} className="grid gap-2">
      <input type="hidden" name="class_id" value={classId} />
      <div className="grid grid-cols-3 gap-2">
        <select name="scheme" className="input">
          <option value="aat">aat</option>
          <option value="wikidata">wikidata</option>
        </select>
        <input name="uri" className="input" placeholder="http://vocab.getty.edu/aat/300266745 or https://www.wikidata.org/entity/Qxxx" />
        <input name="label" className="input" placeholder="Label (EN)" />
      </div>
      <input name="label_ja" className="input" placeholder="Label (JA)" />
      <button className="button" type="submit">Add link</button>
    </form>
  );
}
