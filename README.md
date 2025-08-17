# Ito Collection — ARK-ready, AAT/Wikidata-aware Collection Site

A standards-friendly stack for publishing a collection of Japanese tea utensils (and related artifacts) with persistent IDs, interoperable metadata, and a simple category lookup.

- **Frontend/API:** Next.js (App Router, TypeScript) on Vercel
- **Data:** Supabase (Postgres + RLS, Storage for images)
- **Identifiers:** Stable HTTPS IDs today (`/id/{token}`), ARK-ready (`/ark:/NAAN/{name}`)
- **Interoperability:** Linked Art JSON-LD; categories via Getty AAT and Wikidata QIDs
- **Ingest:** Notion (images/fields) + Google Sheets (valuations) → mirrored into Supabase

---

## Why this exists

Museums and aggregators interoperate through stable web IDs + shared vocabularies. This project ships those from day one:
- A permanent, resolvable URL per object (later upgradable to ARK without breaking links)
- Machine-readable JSON-LD (Linked Art) for each object
- Category tagging against AAT (museum standard) and Wikidata (great JA labels, cross-links)

---

## Architecture

    Notion DB ─┐
               ├── /scripts/ingest-notion.ts ─┐
    Google Sheets ─ /scripts/ingest-sheets.ts ├─▶ Supabase (Postgres + Storage)
                                               │
                                               ▼
                                       Next.js on Vercel
                                   /id/{token}  (HTML + JSON-LD)
                                   /api/lookup  (AAT + Wikidata search)
                                   /ark:/NAAN/{name} (ARK landing + JSON-LD, later)

---

## Identifier strategy

- Today (no NAAN yet): canonical ID = `https://collection.ito.com/id/{token}`
- Token: opaque 10–12 chars (Crockford base32, e.g., `k7m9q2w3tz`) to avoid embedding meaning
- Later (with NAAN): add `https://collection.ito.com/ark:/NAAN/{name}` and 301 `/id/{token}` → `/ark:/NAAN/{name}`
- ARK inflections: support `?` (brief metadata) and `??` (persistence/policy) at the ARK path

Example token minter (Crockford base32, no vowels):

    // lib/id.ts
    import { customAlphabet } from "nanoid";
    const alphabet = "0123456789bcdfghjkmnpqrstvwxz";
    export const mintToken = customAlphabet(alphabet, 11);

---

## Data model (Supabase)

**Tables (abridged):**
- `objects` — one row per physical item  
  Fields: `id, token (unique), ark_name (null for now), local_number, title, title_ja, summary, summary_ja, visibility, created_at, updated_at`
- `classifications` — authority terms (AAT / Wikidata / TGN, etc.)  
  Fields: `label, label_ja, kind, scheme, uri`
- `object_classifications` — join (`role` = 'primary type' | 'material' | 'technique' | 'ware' | 'place')
- `media` — images/docs/manifests (`uri`, `license`, `sort_order`)
- `valuations` — time-stamped valuations (usually private)
- `redirects` — permanent old→new path map for link longevity

**RLS policies**
- Public can read only `visibility = 'public'` objects (and their public relations)  
- Service role has full access (used by server routes and ingest scripts)

**Storage**
- Public bucket `media` for published images; service role can write/update

> SQL for schema + RLS lives in `/supabase/sql/init.sql` (or equivalent migration). Run once when setting up the project.

---

## Interoperability

- JSON-LD (Linked Art flavor): every object page embeds machine data and serves it via content negotiation  
- AAT & Wikidata: stored per object; AAT URIs emitted first, QIDs included for extra connectivity  
- Bilingual fields: `title_ja`, `summary_ja` for Japanese rendering and labels

Example JSON-LD (served at `/id/{token}` with `Accept: application/ld+json`):

    {
      "@context": "https://linked.art/ns/v1/linked-art.json",
      "id": "https://collection.ito.com/id/k7m9q2w3tz",
      "type": "HumanMadeObject",
      "identified_by": [
        { "type": "Name", "content": "Black Raku chawan" },
        { "type": "Identifier", "content": "ITO-2025-001" }
      ],
      "classified_as": [
        { "type": "Type", "id": "http://vocab.getty.edu/aat/300193015", "_label": "tea bowls" },
        { "type": "Type", "id": "https://www.wikidata.org/entity/Q798625", "_label": "chawan" }
      ],
      "referred_to_by": [
        { "type": "LinguisticObject", "content": "…EN summary…" },
        { "type": "LinguisticObject", "content": "…JA summary…", "language": { "id": "ja" } }
      ]
    }

---

## API & routes

- Human page — `GET /id/{token}` → HTML page (title, images, summaries, identifiers)
- Machine data — `GET /id/{token}` with `Accept: application/ld+json`, or `GET /id/{token}.jsonld` → JSON-LD
- Lookup — `GET /api/lookup?q=…` → normalized list of AAT and Wikidata hits (EN/JA labels where available)
- ARK (placeholder until NAAN):  
  `GET /ark:/{NAAN}/{name}` → ARK landing page  
  `GET /ark:/{NAAN}/{name}?` → brief JSON metadata (ARK “?”)  
  `GET /ark:/{NAAN}/{name}??` → JSON policy (“??”)  
  `Accept: application/ld+json` → JSON-LD at the ARK path

Curl examples:

    curl -H "Accept: application/ld+json" https://collection.ito.com/id/k7m9q2w3tz
    curl "https://collection.ito.com/api/lookup?q=chawan"

---

## Environment

Create `.env.local` and set the same in Vercel → Project Settings → Environment Variables:

    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...        # server-only
    AAT_RECONCILE_URL=https://refine.getty.edu/reconcile/aat

    # existing envs for Notion/Sheets remain (if ingest runs here)
    NOTION_TOKEN=...
    NOTION_DB_ID=...
    GOOGLE_APPLICATION_CREDENTIALS=./.secrets/gsa.json
    SHEET_ID=...

---

## Local development

Install:

    pnpm i
    # or npm i

Run:

    pnpm dev
    # open http://localhost:3000

---

## Seeding & smoke test

Create one demo object:

    pnpm ts-node scripts/seed-object.ts
    # logs: https://collection.ito.com/id/<token>

Verify:
- Visit `/id/<token>` (HTML)
- `curl -H "Accept: application/ld+json" /id/<token>` (JSON-LD)
- `curl "/api/lookup?q=chawan"` (AAT + Wikidata results)

---

## Ingest pipelines (Notion + Google Sheets)

This repo also includes a Python utility to merge Notion items with a Google Sheet and export to Sheets:

- Read a Notion database (names, properties, photos)
- Read a Google Sheets worksheet (prices)
- Merge the two datasets locally by item name
- Write JSON outputs to `data/` for inspection
- Export a new worksheet tab with merged rows; images render via `=IMAGE("url")`

Setup (Python):

    brew install python git jq
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -U pip
    pip install -r requirements.txt

Configure `.env` (examples in `.env.example`) and run:

    python main.py --dump
    EXPORT_WORKSHEET_TITLE="Merged + Images" python scripts/export_to_sheet.py

Notes:
- Notion file URLs are temporary; the provided TypeScript ingest mirrors images into Supabase Storage and stores durable public URLs.
- The Next.js ingest scripts:
  - `scripts/ingest-notion.ts` — imports first N pages (default 3), guesses EN/JA, maps fields, mirrors images, and writes a `Collection Token` back to Notion (URL or rich_text). Configure via:

        NOTION_TOKEN=...               # internal integration token
        NOTION_DB_ID=...               # or NOTION_DATABASE_ID
        NOTION_TOKEN_PROP=Collection Token
        NOTION_LIMIT=3
        COLLECTION_BASE_URL=https://collection.ito.com  # optional for token links

      Run:

        npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/ingest-notion.ts

  - `scripts/ingest-sheets.ts` — imports valuations from Google Sheets (TBD example)

---

## Deploying to Vercel (Production)

1) Link the repo
- `vercel link` (or use Vercel dashboard to import the GitHub repo)

2) Environment variables (Vercel → Project Settings → Environment Variables)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Production + Preview; never expose client-side)
- `AAT_RECONCILE_URL` (e.g., `https://refine.getty.edu/reconcile/aat`)
- Any ingest-related secrets if running scheduled jobs (Notion, Sheets)

3) Next.js config
- Ensure `next.config.js` includes:
  - Rewrites: `{ source: '/ark:/:naan/:name*', destination: '/api/ark/:naan/:name*' }`
  - Images `remotePatterns` to allow Supabase storage URLs (e.g., `*.supabase.co`)

4) Supabase setup
- Create tables (`objects`, `media`, `classifications`, `object_classifications`, `valuations`, `redirects`)
- Enable RLS; add policies so only `visibility='public'` rows are readable anonymously
- Create a public bucket `media` for images

5) Smoke test
- Deploy (`git push` triggers Vercel build)
- Visit `/lookup` and search “chawan”
- Seed one object (locally) with `ts-node scripts/seed-object.ts` and confirm `/id/{token}` works in Production
- `curl -H "Accept: application/ld+json" https://<domain>/id/{token}` returns JSON-LD
- `https://<domain>/ark:/<NAAN>/<name>?` returns brief JSON (placeholder)

---

## Editorial workflow

1) Create/ingest an object (gets a stable `/id/{token}`)  
2) Open **/lookup** → search for categories (“chawan”, “Raku”, “kintsugi”, etc.)  
3) Save chosen **AAT** (primary) and **Wikidata** (secondary) entries to `classifications` and link via `object_classifications` with an appropriate `role`  
4) Publish (ensure `visibility = 'public'`), confirm JSON-LD looks right

Conventions
- `role = "primary type"` → the object’s main category (e.g., tea bowl)  
- `role = "material"` → clay/wood/lacquer/gold, etc.  
- `role = "technique"` → raku firing, kintsugi, maki-e, etc.  
- `role = "ware"` → Raku ware / Hagi ware / Oribe ware

---

## Internationalization (EN/JA)

- Use `title` + `title_ja`, `summary` + `summary_ja`
- The JSON-LD includes both; UI can offer a simple language toggle

---

## Metadata & media policy

- Metadata license: recommend CC0 (public domain) for maximum reuse  
- Images: set per-item license (`media.license`) — some public, some all-rights-reserved  
- Persistence statement: ARK “??” endpoint should state contact, scope of persistence, and redirect policy

---

## Security

- Service role key is used only in server routes/scripts (never shipped to the client)
- RLS ensures public readers only see public data
- Use Vercel project secrets for all tokens and keys

---

## Roadmap

- Apply for NAAN (foundation name) → map N2T resolver → switch canonical IDs to ARK (keep `/id/*` as 301s)
- IIIF Presentation v3 manifests for images → Mirador/Universal Viewer support
- OAI-PMH (LIDO) export endpoint for harvesting by aggregators
- Minimal admin UI to attach authorities, edit bilingual text, manage visibility
- Provenance modeling and timeline rendering

---

## Glossary

- ARK — Archival Resource Key, a persistent identifier for physical/digital things  
- NAAN — ARK namespace number (issued free to qualifying orgs)  
- AAT — Getty Art & Architecture Thesaurus (controlled vocabulary)  
- Wikidata QID — Stable entity identifiers with multilingual labels  
- Linked Art — JSON-LD profile implementing CIDOC-CRM for art/heritage  
- IIIF — Interoperable image framework (manifests and tiling/viewers)  
- LIDO — Lightweight Information Describing Objects (XML for harvesting)

---

## License

- Code: MIT (suggested)  
- Metadata: CC0 (suggested)  
- Images: per-item license as declared in `media.license`


