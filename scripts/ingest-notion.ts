import { config as dotenvConfig } from 'dotenv';
// Load .env.local first, then .env
dotenvConfig({ path: '.env.local' });
dotenvConfig();
import { Client } from '@notionhq/client';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { supabaseAdmin } from '../lib/supabase/server';
import { mintToken } from '../lib/id';

/*
Env required:
- NOTION_TOKEN
- NOTION_DB_ID
Optional:
- NOTION_TOKEN_PROP (plain token field; rich_text/title recommended) e.g., 'Collection Token'
- NOTION_URL_PROP (canonical URL field; url recommended) e.g., 'Collection URL'
- NOTION_TITLE_JA_PROP (if JA title is a separate prop)
- NOTION_SUMMARY_EN_PROP / NOTION_SUMMARY_JA_PROP (if summaries are separate)
- NOTION_LIMIT (number of items to import, default 3)
- NOTION_OVERWRITE_TOKENS=1 to force rewriting token/url fields in Notion
*/

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const NOTION_DB_ID_RAW = (process.env.NOTION_DB_ID || process.env.NOTION_DATABASE_ID || '').trim();
const NOTION_DB_ID = NOTION_DB_ID_RAW.replace(/\?.*$/, '');
const BASE_URL = (process.env.COLLECTION_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const TOKEN_PROP = process.env.NOTION_TOKEN_PROP || 'Collection Token';
const URL_PROP = process.env.NOTION_URL_PROP || 'Collection URL';
const TITLE_JA_PROP = process.env.NOTION_TITLE_JA_PROP || 'Title JA';
const SUMMARY_EN_PROP = process.env.NOTION_SUMMARY_EN_PROP || 'Summary';
const SUMMARY_JA_PROP = process.env.NOTION_SUMMARY_JA_PROP || 'Summary JA';
const IMPORT_LIMIT = Number(process.env.NOTION_LIMIT || process.argv[2] || 3);

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

async function writeTokenAndUrlToNotion(pageId: string, token: string, props: any) {
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

function sha256Hex(buf: ArrayBuffer): string {
  const nodeBuf = Buffer.from(buf);
  const hash = crypto.createHash('sha256');
  hash.update(nodeBuf);
  return hash.digest('hex');
}

async function uploadImageFromUrl(db: ReturnType<typeof supabaseAdmin>, objectId: string, url: string) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`fetch ${url} -> ${r.status}`);
    const contentType = r.headers.get('content-type') || 'application/octet-stream';
    const ab = await r.arrayBuffer();
    const hash = sha256Hex(ab).slice(0, 16);
    const extFromType = contentType.split('/')[1]?.split(';')[0] || (url.split('?')[0].split('.').pop() || 'bin');
    const fileName = `${objectId}-${hash}.${extFromType}`;
    const path = `media/${objectId}/${fileName}`;
    // Upload original
    // @ts-ignore
    const up = await (db as any).storage.from('media').upload(path, Buffer.from(ab), { contentType, upsert: false });
    if (up.error && !String(up.error?.message || '').toLowerCase().includes('already exists')) {
      throw up.error;
    }
    // Generate 400px longest-edge variant
    try {
      const resized = await sharp(Buffer.from(ab)).resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true }).toBuffer();
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

async function firstImageUrlsForPage(pageId: string, props: any): Promise<string[]> {
  const urls: string[] = [];
  // files-type properties
  for (const key of Object.keys(props)) {
    const p = props[key];
    if (p?.type === 'files' && Array.isArray(p.files)) {
      for (const f of p.files) {
        const u = f?.file?.url || f?.external?.url;
        if (u) urls.push(u);
      }
    }
  }
  // scan blocks for first few images
  try {
    let cursor: string | undefined = undefined;
    while (urls.length < 3) {
      const resp = await notion.blocks.children.list({ block_id: pageId, start_cursor: cursor });
      for (const b of resp.results as any[]) {
        if (b?.type === 'image') {
          const u = b.image?.file?.url || b.image?.external?.url;
          if (u) urls.push(u);
        }
      }
      if (!resp.has_more) break;
      cursor = resp.next_cursor || undefined;
    }
  } catch {}
  return Array.from(new Set(urls)).slice(0, 3);
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
    } as any);
    pages.push(...resp.results);
    if (!resp.has_more) break;
    cursor = resp.next_cursor || undefined;
  }

  const slice = pages; // already limited above
  await ensureBucket(db, 'media');

  for (const page of slice) {
    const id = page.id as string;
    const props = page.properties || {};

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

    const local_number = propText(getProp(props, ['Local Number', 'Local number', '番号', 'No.', 'ID']) || {});
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
    if (!token) {
      // Try to reuse an existing object by local_number to avoid duplicates
      if (local_number) {
        const { data: byLocal } = await db
          .from('objects')
          .select('id, token')
          .eq('local_number', local_number)
          .maybeSingle();
        if (byLocal?.token) token = byLocal.token;
      }
    }
    if (!token) token = mintToken(12);

    // Upsert object by token or local_number
    const upsert = {
      token,
      title: title || '(untitled)'
    } as any;
    if (title_ja) upsert.title_ja = title_ja;
    if (local_number) upsert.local_number = local_number;
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

    const { data: objRows, error } = await db
      .from('objects')
      .upsert(upsert, { onConflict: 'token' })
      .select('id, token');
    const objRow = Array.isArray(objRows) ? objRows.find((r: any) => r.token === token) : objRows as any;
    if (error) throw error;

    // Decide whether to write back link to Notion
    const link = `${BASE_URL}/id/${token}`;
    const force = String(process.env.NOTION_OVERWRITE_TOKENS || '').trim() === '1';
    const isUrlProp = tokenProp?.type === 'url';
    const currentUrlVal = isUrlProp ? (tokenProp?.url || '') : '';
    const shouldWriteBack = force
      || !existingTokenRaw
      || (isUrlProp && currentUrlVal !== link)
      || (!isUrlProp && extractToken(existingTokenRaw) === token); // bare token present, upgrade
    if (shouldWriteBack) await writeTokenAndUrlToNotion(id, token, props);

    // Mirror images
    try {
      const urls = await firstImageUrlsForPage(id, props);
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
          await db
            .from('media')
            .insert({ object_id: objRow.id, uri: finalUri, kind: 'image', sort_order: 999, bucket: publicUrl ? 'media' : null, storage_path: storagePath || null, visibility: 'public' });
        }
      }
    } catch (e) {
      console.warn('image mirror failed', e);
    }
  }

  console.log(`Processed ${slice.length} Notion pages.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
