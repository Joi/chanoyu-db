import Image from 'next/image'
import Link from 'next/link'
import Container from '@/app/components/Container'
import Title from '@/app/components/Title'
import Separator from '@/app/components/Separator'
import { supabaseAdmin } from '@/lib/supabase/server'

type ObjectRow = {
  id: string
  token: string
  title: string | null
  title_ja: string | null
  local_number: string | null
}

type MediaRow = {
  id: string
  uri: string
  sort_order: number | null
  object_id: string
}

export const revalidate = 60
export const dynamic = 'force-dynamic'

export default async function ObjectsIndexPage() {
  const db = supabaseAdmin()
  const { data: objs, error } = await db
    .from('objects')
    .select('id, token, title, title_ja, local_number, visibility')
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false })
    .limit(48)
  if (error) {
    console.error('[objects index] query error', error.message)
  }
  const rawObjects = Array.isArray(objs) ? (objs as unknown[]) : []
  const objectList: ObjectRow[] = rawObjects
    .map((o): ObjectRow | null => {
      if (o && typeof o === 'object') {
        const row = o as Record<string, unknown>
        const id = String(row.id ?? '')
        const token = String(row.token ?? '')
        if (!id || !token) return null
        return {
          id,
          token,
          title: (row.title ?? null) as string | null,
          title_ja: (row.title_ja ?? null) as string | null,
          local_number: (row.local_number ?? null) as string | null,
        }
      }
      return null
    })
    .filter((r): r is ObjectRow => r !== null)

  const ids = objectList.map((o) => o.id)
  let mediaByObject: Record<string, MediaRow[]> = {}
  if (ids.length) {
    const { data: mediaRows, error: eMed } = await db
      .from('media')
      .select('id, uri, sort_order, object_id')
      .in('object_id', ids)
    if (eMed) console.error('[objects index] media query error', eMed.message)
    const mediaRaw = Array.isArray(mediaRows) ? (mediaRows as unknown[]) : []
    for (const m of mediaRaw) {
      if (m && typeof m === 'object') {
        const rec = m as Record<string, unknown>
        const row: MediaRow = {
          id: String(rec.id ?? ''),
          uri: String(rec.uri ?? ''),
          sort_order: typeof rec.sort_order === 'number' ? rec.sort_order : rec.sort_order == null ? null : Number(rec.sort_order as number),
          object_id: String(rec.object_id ?? ''),
        }
        if (!row.id || !row.object_id) continue
        if (!mediaByObject[row.object_id]) mediaByObject[row.object_id] = []
        mediaByObject[row.object_id].push(row)
      }
    }
  }

  return (
    <main>
      <Container>
        <section className="py-6">
          <Title level={1}>Objects</Title>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {objectList.map((o) => {
              const mediaSorted = (mediaByObject[o.id] || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              const primary = mediaSorted[0]
              const alt = o.title || o.title_ja || o.local_number || o.token
              return (
                <article key={o.id} className="border border-border rounded-lg overflow-hidden bg-card">
                  <Link href={`/id/${o.token}`} aria-label={alt ?? undefined} className="group block">
                    <div className="relative w-full aspect-[4/3] bg-background">
                      {primary?.uri ? (
                        <Image
                          src={primary.uri}
                          alt={alt || ''}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          className="object-cover"
                          priority={false}
                        />
                      ) : null}
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-sm leading-snug line-clamp-2 text-foreground">{alt}</p>
                    </div>
                  </Link>
                </article>
              )
            })}
          </div>
        </section>
      </Container>
    </main>
  )
}


