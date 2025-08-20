import { config as dotenvConfig } from 'dotenv';
// Load .env.local first, then .env
dotenvConfig({ path: '.env.local' });
dotenvConfig();
import { Client } from '@notionhq/client';
import crypto from 'node:crypto';
import sharp from 'sharp';
import heicConvert from 'heic-convert';
import { supabaseAdmin } from '../lib/supabase/server';
import { mintToken } from '../lib/id';

/*
Env required:
- NOTION_TOKEN
- NOTION_DB_ID
Optional:
- NOTION_TOKEN_PROP (plain token field; rich_text/title recommended) e.g., 'Collection Token'
- NOTION_URL_PROP (canonical URL field; url recommended) e.g., 'Collection URL'
- NOTION_IN_COLLECTION_PROP (checkbox to include item) e.g., 'In Collection' (default)
- NOTION_TITLE_JA_PROP (if JA title is a separate prop)
- NOTION_SUMMARY_EN_PROP / NOTION_SUMMARY_JA_PROP (if summaries are separate)
- NOTION_LIMIT (number of items to import; default: ALL)
- NOTION_OVERWRITE_TOKENS=1 to force rewriting token/url fields in Notion
- NOTION_FETCH_IMAGES=0 to skip mirroring images to Supabase Storage (default: 1)
- NOTION_IMAGES_ONLY=1 to mirror images only (do not insert/update object fields, no Notion writebacks)
- NOTION_MAX_IMAGES_PER_ITEM (number; default: ALL)
*/

const notion = new Client({ auth: process.env.NOTION_TOKEN });
function normalizeNotionId(raw: string): string {
  const input = String(raw || '').trim();
  if (!input) return '';
  // If a full URL is provided, extract the 32-hex ID segment
  const hexMatch = input.match(/[0-9a-fA-F]{32}/);
  const compact = (hexMatch ? hexMatch[0] : input.replace(/-/g, ''));
  if (/^[0-9a-fA-F]{32}$/.test(compact)) {
    return compact
      .toLowerCase()
      .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
  }
  // Fallback: strip query string only (for backwards compatibility)
  return input.replace(/\?.*$/, '');
}
const NOTION_DB_ID_RAW = (process.env.NOTION_DB_ID || process.env.NOTION_DATABASE_ID || '').trim();
const NOTION_DB_ID = normalizeNotionId(NOTION_DB_ID_RAW);
const BASE_URL = (process.env.COLLECTION_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const TOKEN_PROP = process.env.NOTION_TOKEN_PROP || 'Collection Token';
const URL_PROP = process.env.NOTION_URL_PROP || 'Collection URL';
const COLLECTION_ID_PROP = process.env.NOTION_COLLECTION_ID_PROP || 'Collection ID';
const IN_COLLECTION_PROP = process.env.NOTION_IN_COLLECTION_PROP || 'In Collection';
const TITLE_JA_PROP = process.env.NOTION_TITLE_JA_PROP || 'Title JA';
const SUMMARY_EN_PROP = process.env.NOTION_SUMMARY_EN_PROP || 'Summary';
const SUMMARY_JA_PROP = process.env.NOTION_SUMMARY_JA_PROP || 'Summary JA';
// Import all items by default; override via NOTION_LIMIT or argv[2]
function parseImportLimit(): number {
  const envLimit = process.env.NOTION_LIMIT;
  if (envLimit != null && envLimit !== '') {
    const n = Number(envLimit);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const arg = process.argv[2];
  if (arg != null && arg !== '') {
    const n = Number(arg);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return Number.POSITIVE_INFINITY;
}
const IMPORT_LIMIT = parseImportLimit();
// Control whether to mirror images from Notion into Supabase Storage
const FETCH_IMAGES = String(process.env.NOTION_FETCH_IMAGES || '1').trim() !== '0';
const IMAGES_ONLY = String(process.env.NOTION_IMAGES_ONLY || '0').trim() === '1';
function parseMaxImages(): number {
  const raw = process.env.NOTION_MAX_IMAGES_PER_ITEM;
  if (raw != null && raw !== '') {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return Number.POSITIVE_INFINITY;
}
const MAX_IMAGES_PER_ITEM = parseMaxImages();

function propText(p: any): string {
  if (!p) return '';
  const type = p.type;
  if (type === 'title') return (p.title || []).map((t: any) => t.plain_text).join('').trim();
  if (type === 'rich_text') return (p.rich_text || []).map((t: any) => t.plain_text).join('').trim();
  if (type === 'plain_text') return (p.plain_text || '').trim();
  if (type === 'url') return p.url || '';
  if (type === 'select') return (p.select?.name || '').trim();
  if (type === 'multi_select') return (Array.isArray(p.multi_select) ? p.multi_select.map((x: any) => x?.name || '').filter(Boolean) : []).join(',').trim();
  if (type === 'status') return (p.status?.name || '').trim();
  return '';
}

async function writeTokenAndUrlToNotion(pageId: string, token: string, collectionId: string | null, props: any) {
  try {
    const link = `${BASE_URL}/id/${token}`;
    const patch: any = {};

    // Write plain token (prefer rich_text/title); if token prop exists but is URL type, skip writing token there
    const tokenProp = props[TOKEN_PROP];
    if (tokenProp) {
      if (tokenProp.type === 'rich_text') {
        patch[TOKEN_PROP] = { rich_text: [{ type: 'text', text: { content: token } }] };
      } else if (tokenProp.type === 'title') {
        patch[TOKEN_PROP] = { title: [{ type: 'text', text: { content: token } }] } as any;
      } else if (tokenProp.type !== 'url') {
        // best-effort fallback to rich_text shape
        patch[TOKEN_PROP] = { rich_text: [{ type: 'text', text: { content: token } }] };
      }
    }

    // Write canonical URL
    const urlProp = props[URL_PROP];
    if (urlProp) {
      if (urlProp.type === 'url') {
        patch[URL_PROP] = { url: link };
      } else {
        patch[URL_PROP] = { rich_text: [{ type: 'text', text: { content: link } }] };
      }
    } else if (!tokenProp || tokenProp.type === 'url') {
      // If there is no dedicated URL prop, and token prop is URL type, write URL there as last resort
      if (tokenProp && tokenProp.type === 'url') {
        patch[TOKEN_PROP] = { url: link };
      }
    }

    // Write Collection ID if provided
    if (collectionId) {
      const idProp = props[COLLECTION_ID_PROP];
      if (idProp) {
        if (idProp.type === 'rich_text') {
          patch[COLLECTION_ID_PROP] = { rich_text: [{ type: 'text', text: { content: collectionId } }] };
        } else if (idProp.type === 'title') {
          patch[COLLECTION_ID_PROP] = { title: [{ type: 'text', text: { content: collectionId } }] } as any;
        } else if (idProp.type === 'url') {
          patch[COLLECTION_ID_PROP] = { url: collectionId };
        } else {
          patch[COLLECTION_ID_PROP] = { rich_text: [{ type: 'text', text: { content: collectionId } }] };
        }
      }
    }

    if (Object.keys(patch).length) {
      await notion.pages.update({ page_id: pageId, properties: patch });
    }
  } catch (e) {
    console.warn('Failed to write token to Notion', e);
  }
}

function getProp(props: Record<string, any>, names: string[]): any | undefined {
  for (const n of names) {
    if (Object.prototype.hasOwnProperty.call(props, n)) return props[n];
  }
  return undefined;
}

function propBool(p: any): boolean {
  try {
    if (!p) return false;
    if (p.type === 'checkbox') return !!p.checkbox;
    if (p.type === 'status') return String(p.status?.name || '').toLowerCase() === 'in collection';
    if (p.type === 'rich_text') return (p.rich_text || []).map((t: any) => String(t.plain_text || '').toLowerCase()).join('').includes('true');
    if (p.type === 'url') return /true|yes|1/i.test(String(p.url || ''));
    return false;
  } catch {
    return false;
  }
}

async function nextCollectionId(db: ReturnType<typeof supabaseAdmin>, kind: 'I'|'M', year?: number): Promise<string> {
  const y = year || new Date().getFullYear();
  const prefix = `ITO-${y}-${kind}-`;
  const table = kind === 'I' ? 'objects' : 'media';
  const { data } = await db.from(table).select('local_number').ilike('local_number', `${prefix}%`).order('local_number', { ascending: false }).limit(2000);
  let max = 0;
  for (const row of data || []) {
    const m = String((row as any).local_number || '').match(/(\d{5})$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const next = String(max + 1).padStart(5, '0');
  return `${prefix}${next}`;
}

function guessLanguage(text: string): 'ja' | 'en' {
  const hasCJK = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(text);
  return hasCJK ? 'ja' : 'en';
}

async function ensureBucket(db: ReturnType<typeof supabaseAdmin>, bucket = 'media') {
  // @ts-ignore
  const exists = await (db as any).storage.getBucket(bucket);
  if (!exists || exists.error || exists.data == null) {
    // @ts-ignore
    await (db as any).storage.createBucket(bucket, { public: true });
  }
}

function sha256Hex(buf: ArrayBuffer | Buffer): string {
  const nodeBuf = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  const hash = crypto.createHash('sha256');
  hash.update(nodeBuf);
  return hash.digest('hex');
}

async function uploadImageFromUrl(db: ReturnType<typeof supabaseAdmin>, objectId: string, url: string) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`fetch ${url} -> ${r.status}`);
    let contentType = r.headers.get('content-type') || 'application/octet-stream';
    const ab = await r.arrayBuffer();
    let originalBuffer = Buffer.from(ab);
    if (/image\/(heic|heif)/i.test(contentType) || /\.(heic|heif)(?:$|\?)/i.test(url)) {
      try {
        const out = await heicConvert({ buffer: originalBuffer, format: 'JPEG', quality: 0.9 });
        originalBuffer = Buffer.from(out);
        contentType = 'image/jpeg';
      } catch (e) {
        console.warn('heic convert failed, keeping original', e);
      }
    }
    const hash = sha256Hex(originalBuffer).slice(0, 16);
    const extFromType = contentType.split('/')[1]?.split(';')[0] || (url.split('?')[0].split('.').pop() || 'bin');
    const fileName = `${objectId}-${hash}.${extFromType}`;
    const path = `media/${objectId}/${fileName}`;
    // Upload original
    // @ts-ignore
    const up = await (db as any).storage.from('media').upload(path, originalBuffer, { contentType, upsert: false });
    if (up.error && !String(up.error?.message || '').toLowerCase().includes('already exists')) {
      throw up.error;
    }
    // Generate 400px longest-edge variant
    try {
      const resized = await sharp(originalBuffer).resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true }).toBuffer();
      const thumbPath = `media/${objectId}/thumb_${fileName}`;
      // @ts-ignore
      const up2 = await (db as any).storage.from('media').upload(thumbPath, resized, { contentType, upsert: true });
      if (up2.error && !String(up2.error?.message || '').toLowerCase().includes('already exists')) {
        console.warn('thumb upload error', up2.error);
      }
    } catch (e) {
      console.warn('thumb resize error', e);
    }
    // @ts-ignore
    const pub = (db as any).storage.from('media').getPublicUrl(path);
    const publicUrl = pub?.data?.publicUrl as string | undefined;
    return { publicUrl, storagePath: path };
  } catch (e) {
    console.warn('uploadImageFromUrl error', e);
    return { publicUrl: undefined, storagePath: undefined };
  }
}

async function firstImageUrlsForPage(pageId: string, props: any, maxImages: number): Promise<string[]> {
  const urls: string[] = [];
  // files-type properties
  for (const key of Object.keys(props)) {
    const p = props[key];
    if (p?.type === 'files' && Array.isArray(p.files)) {
      for (const f of p.files) {
        const u = f?.file?.url || f?.external?.url;
        if (u) {
          urls.push(u);
          if (urls.length >= maxImages) return Array.from(new Set(urls)).slice(0, maxImages === Number.POSITIVE_INFINITY ? undefined : maxImages);
        }
      }
    }
  }
  // scan blocks for first few images
  try {
    let cursor: string | undefined = undefined;
    while (urls.length < maxImages) {
      const resp = await notion.blocks.children.list({ block_id: pageId, start_cursor: cursor });
      for (const b of resp.results as any[]) {
        if (b?.type === 'image') {
          const u = b.image?.file?.url || b.image?.external?.url;
          if (u) {
            urls.push(u);
            if (urls.length >= maxImages) break;
          }
        }
      }
      if (!resp.has_more) break;
      cursor = resp.next_cursor || undefined;
    }
  } catch {}
  return Array.from(new Set(urls)).slice(0, maxImages === Number.POSITIVE_INFINITY ? undefined : maxImages);
}

async function run() {
  if (!process.env.NOTION_TOKEN || !NOTION_DB_ID) throw new Error('Missing NOTION_TOKEN and NOTION_DB_ID (or NOTION_DATABASE_ID)');
  const db = supabaseAdmin();

  let cursor: string | undefined = undefined;
  const pages: any[] = [];
  while (pages.length < IMPORT_LIMIT) {
    const resp = await notion.databases.query({
      database_id: NOTION_DB_ID,
      start_cursor: cursor,
      page_size: Math.min(IMPORT_LIMIT - pages.length, 100),
      filter: {
        property: IN_COLLECTION_PROP,
        checkbox: { equals: true },
      } as any,
      sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    } as any);
    pages.push(...resp.results);
    if (!resp.has_more) break;
    cursor = resp.next_cursor || undefined;
  }

  const slice = pages; // already limited above
  await ensureBucket(db, 'media');
  const total = slice.length;
  let processed = 0;
  if (total > 0) {
    console.log(`Starting Notion ingest: ${total} page(s) to process...`);
  }

  for (const page of slice) {
    const id = page.id as string;
    const props = page.properties || {};

    // Already filtered by checkbox at query level; extra guard:
    if (!propBool(props[IN_COLLECTION_PROP])) continue;

    const titlePropName = Object.keys(props).find((k) => props[k]?.type === 'title');
    const titleRaw = titlePropName ? propText(props[titlePropName]) : '';
    const titleJaExplicit = propText(props[TITLE_JA_PROP]);
    let title = '';
    let title_ja = '';
    if (titleJaExplicit) {
      title_ja = titleJaExplicit;
      title = titleRaw;
    } else if (titleRaw) {
      const lang = guessLanguage(titleRaw);
      if (lang === 'ja') title_ja = titleRaw; else title = titleRaw;
    }

    // Prefer Collection ID field for local number
    let local_number = propText(props[COLLECTION_ID_PROP]);
    if (!local_number) local_number = propText(getProp(props, ['Local Number', 'Local number', '番号', 'No.', 'ID']) || {});
    const summaryEnExplicit = propText(props[SUMMARY_EN_PROP]);
    const summaryJaExplicit = propText(props[SUMMARY_JA_PROP]);
    let summary = '';
    let summary_ja = '';
    if (summaryEnExplicit || summaryJaExplicit) {
      summary = summaryEnExplicit;
      summary_ja = summaryJaExplicit;
    } else {
      const genericSummary = propText(props['Summary'] || props['Description'] || props['Notes']);
      if (genericSummary) {
        const lang = guessLanguage(genericSummary);
        if (lang === 'ja') summary_ja = genericSummary; else summary = genericSummary;
      }
    }
    const craftsmanRaw = propText(getProp(props, ['Craftsman', 'Maker', 'Artist', '作者', '作家']) || {});
    let craftsman: string | null = null;
    let craftsman_ja: string | null = null;
    if (craftsmanRaw) {
      const l = guessLanguage(craftsmanRaw);
      if (l === 'ja') craftsman_ja = craftsmanRaw; else craftsman = craftsmanRaw;
    }
    const storeRaw = propText(getProp(props, ['Store', 'Dealer', '店舗', '店']) || {});
    let store: string | null = null, store_ja: string | null = null;
    if (storeRaw) { const l = guessLanguage(storeRaw); if (l === 'ja') store_ja = storeRaw; else store = storeRaw; }
    const locationRaw = propText(getProp(props, ['Location', 'Place', '場所', '所在地']) || {});
    let location: string | null = null, location_ja: string | null = null;
    if (locationRaw) { const l = guessLanguage(locationRaw); if (l === 'ja') location_ja = locationRaw; else location = locationRaw; }
    const notesRaw = propText(getProp(props, ['Notes', 'Note', '備考']) || {});
    let notes: string | null = null, notes_ja: string | null = null;
    if (notesRaw) { const l = guessLanguage(notesRaw); if (l === 'ja') notes_ja = notesRaw; else notes = notesRaw; }
    const url = propText(getProp(props, ['URL', 'Url']) || {});
    const tagsCsv = propText(getProp(props, ['Tags', 'タグ']) || {});
    const tags = tagsCsv ? tagsCsv.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const tokenProp = props[TOKEN_PROP];
    const urlProp = props[URL_PROP];
    const existingTokenRaw = propText(tokenProp) || propText(urlProp);
    const extractToken = (v: string): string => {
      const s = (v || '').trim();
      if (!s) return '';
      const m = s.match(/\/id\/([A-Za-z0-9_-]+)$/);
      if (m) return m[1];
      const m2 = s.match(/^[a-z0-9]{8,32}$/);
      return m2 ? s : '';
    };
    let token = extractToken(existingTokenRaw);
    if (!token && local_number) {
      const { data: byLocal } = await db
        .from('objects')
        .select('id, token')
        .eq('local_number', local_number)
        .maybeSingle();
      if (byLocal?.token) token = byLocal.token;
    }
    if (!token) token = mintToken(12);

    // Upsert/update object by token/local_number (unless IMAGES_ONLY)
    let objRow: any = null;
    if (IMAGES_ONLY) {
      // Look up existing object; do not insert/update
      const { data: existingByToken } = await db.from('objects').select('id, token').eq('token', token).maybeSingle();
      if (existingByToken?.id) {
        objRow = existingByToken;
      } else if (local_number) {
        const { data: existingByLocal } = await db.from('objects').select('id, token').eq('local_number', local_number).maybeSingle();
        if (existingByLocal?.id) objRow = existingByLocal;
      }
      if (!objRow) {
        console.warn(`Skipping images for Notion page ${id}: object not found for token/local_number`);
      }
    } else {
      const upsert = {
        token,
        title: '' as string
      } as any;
      if (title_ja) upsert.title_ja = title_ja;
      // Assign Collection ID if missing
      if (!local_number) {
        const year = (typeof (page.properties?.['Date']?.date?.start) === 'string' && page.properties['Date'].date.start)
          ? new Date(page.properties['Date'].date.start).getFullYear()
          : new Date().getFullYear();
        local_number = await nextCollectionId(db, 'I', year);
      }
      if (local_number) upsert.local_number = local_number;
      // Resolve title last so it can fall back to Collection ID if needed
      upsert.title = title || local_number || '(untitled)';
      if (summary) upsert.summary = summary;
      if (summary_ja) upsert.summary_ja = summary_ja;
      if (craftsman) upsert.craftsman = craftsman;
      if (craftsman_ja) upsert.craftsman_ja = craftsman_ja;
      if (store) upsert.store = store;
      if (store_ja) upsert.store_ja = store_ja;
      if (location) upsert.location = location;
      if (location_ja) upsert.location_ja = location_ja;
      if (notes) upsert.notes = notes;
      if (notes_ja) upsert.notes_ja = notes_ja;
      if (url) upsert.url = url;
      if (tags && tags.length) upsert.tags = tags;

      const { data: existingByToken } = await db.from('objects').select('id, token').eq('token', token).maybeSingle();
      if (existingByToken?.id) {
        const { data: upd, error: eUp } = await db.from('objects').update(upsert).eq('id', existingByToken.id).select('id, token').single();
        if (eUp) throw eUp; objRow = upd;
      } else if (local_number) {
        const { data: existingByLocal } = await db.from('objects').select('id, token').eq('local_number', local_number).maybeSingle();
        if (existingByLocal?.id) {
          const { data: upd, error: eUp2 } = await db.from('objects').update({ ...upsert, token: existingByLocal.token }).eq('id', existingByLocal.id).select('id, token').single();
          if (eUp2) throw eUp2; objRow = upd;
        }
      }
      if (!objRow) {
        const { data: ins, error: eIns } = await db.from('objects').insert(upsert).select('id, token').single();
        if (eIns) throw eIns; objRow = ins;
      }
    }

    // Decide whether to write back link to Notion
    if (!IMAGES_ONLY) {
      const link = `${BASE_URL}/id/${token}`;
      const force = String(process.env.NOTION_OVERWRITE_TOKENS || '').trim() === '1';
      const isUrlProp = tokenProp?.type === 'url';
      const currentUrlVal = isUrlProp ? (tokenProp?.url || '') : '';
      const shouldWriteBack = force
        || !existingTokenRaw
        || (isUrlProp && currentUrlVal !== link)
        || (!isUrlProp && extractToken(existingTokenRaw) === token); // bare token present, upgrade
      if (shouldWriteBack) await writeTokenAndUrlToNotion(id, token, local_number || null, props);
    }

    // Mirror images (optional)
    if (FETCH_IMAGES && objRow?.id) {
      try {
        const urls = await firstImageUrlsForPage(id, props, MAX_IMAGES_PER_ITEM);
        if (urls.length && objRow?.id) {
          const seen = new Set<string>();
          for (const u of urls) {
            if (seen.has(u)) continue;
            seen.add(u);
            const { publicUrl, storagePath } = await uploadImageFromUrl(db, objRow.id, u);
            const finalUri = publicUrl || u;
            // Check for existing media by storage_path or uri
            const [byPath, byUri] = await Promise.all([
              storagePath
                ? db.from('media').select('id').eq('object_id', objRow.id).eq('storage_path', storagePath).maybeSingle()
                : Promise.resolve({ data: null } as any),
              db.from('media').select('id').eq('object_id', objRow.id).eq('uri', finalUri).maybeSingle(),
            ]);
            const exists = Boolean(byPath?.data?.id || byUri?.data?.id);
            if (exists) continue;
            const storagePathRel = storagePath ? storagePath.replace(/^media\//, '') : null;
            // Assign media local_number if missing later
            const { data: ins, error: eIns } = await db
              .from('media')
              .insert({ object_id: objRow.id, uri: finalUri, kind: 'image', sort_order: 999, bucket: publicUrl ? 'media' : null, storage_path: storagePathRel, visibility: 'public' })
              .select('id, local_number')
              .single();
            if (eIns) throw eIns;
            if (ins && !ins.local_number) {
              const mId = await nextCollectionId(db, 'M');
              await db.from('media').update({ local_number: mId }).eq('id', ins.id);
            }
          }
        }
      } catch (e) {
        console.warn('image mirror failed', e);
      }
    }
    processed++;
    if (processed % 10 === 0 || processed === total) {
      console.log(`Progress: ${processed}/${total}`);
    }
  }

  console.log(`Processed ${slice.length} Notion pages.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
