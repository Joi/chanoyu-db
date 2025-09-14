# Chanoyu DB — Unified database for tea utensils, 茶会, and locations

Unified database to manage tea utensil items linking them to Wikilinks and Getty AAT classifications, people, 茶会/chakai, tea room locations — providing publicly accessible canonical links as well as access-controlled pages for 茶会/chakai and items.

- **Version:** 1.4.0 (see [CHANGELOG.md](CHANGELOG.md) for details)
- **Frontend/API:** Next.js (App Router, TypeScript) on Vercel
- **Data:** Supabase (Postgres + RLS, Storage for images)
- **Identifiers:** Stable HTTPS IDs today (`/id/{token}`), ARK-ready (`/ark:/NAAN/{name}`)
- **Interoperability:** Linked Art JSON-LD; categories via Local Classes (mapped to AAT/Wikidata)
- **Ingest:** Notion (images/fields) + Google Sheets (valuations) → mirrored into Supabase

> This software powers the public site for Ito Chanoyu: `https://chanoyu.ito.com/` (Ito Chanoyu DB). While built for our use, it is open source and designed to be portable so others can run their own instance. Please comment, open PRs, and contribute.

Branding (env-driven):

    # Example local branding overrides
    NEXT_PUBLIC_APP_NAME="Ito Chanoyu DB"
    NEXT_PUBLIC_APP_DESCRIPTION="Unified database for tea utensils, 茶会, and locations"

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
 - `chakai` — tea gatherings (茶会) with attendance and items used  
   Fields: `id, local_number (ITO-K-YYYY-MMDDH), name_en, name_ja, event_date (date), start_time (time), location_id → locations(id), visibility ('open'|'members'|'closed'), notes, created_at, updated_at`
 - `chakai_attendees` — join table of attendees  
   Fields: `chakai_id → chakai(id), account_id → accounts(id)`
 - `chakai_items` — items used in a gathering  
   Fields: `chakai_id → chakai(id), object_id → objects(id)`
 - `locations` — reusable venues  
   Fields: `id, local_number (ITO-L-YYYY-NNNNN), name, address, url, created_at, updated_at`
- `classifications` — authority terms (AAT / Wikidata / TGN, etc.)  
  Fields: `label, label_ja, kind, scheme, uri`
- `object_classifications` — join (`role` = 'primary type' | 'material' | 'technique' | 'ware' | 'place')
- `media` — images/docs/manifests (`uri`, `license`, `sort_order`)
- `valuations` — time-stamped valuations (usually private)
- `redirects` — permanent old→new path map for link longevity

**RLS policies**
- Public can read only `visibility = 'public'` objects (and their public relations)  
- Service role has full access (used by server routes and ingest scripts)
 - Chakai RLS:
   - `open`: anyone can read
   - `members`: only attendees (by account email in JWT) and admin/owner
   - `closed`: only admin/owner

**Storage**
- Public bucket `media` for published images; service role can write/update

> SQL for schema + RLS lives in `/supabase/sql/init.sql` (or equivalent migration). Run once when setting up the project.

For new Chakai/Locations tables and generators, see the migration snippet in the PR description or apply the SQL you used in Supabase. Local numbers:
- Chakai: `ITO-K-YYYY-MMDDH` (date + hour from `start_time`, `00` if null)
- Locations: `ITO-L-YYYY-NNNNN` (yearly counter)

---

## Interoperability

- JSON-LD (Linked Art flavor): every object page embeds machine data and serves it via content negotiation  
- AAT & Wikidata: stored per object; AAT URIs emitted first, QIDs included for extra connectivity  
- Bilingual fields: `title_ja`, `notes_ja` for Japanese rendering and labels

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
      ]
    }

---

## Environment
### Ops workflow cheat sheet

See `docs/WORKFLOW.md` for a concise reference covering:
- Branching (descriptive feature branches from `main` → automatic Preview, `main` → Production)
- Vercel domain mapping and automatic preview deployments
- Daily loop (local dev with Docker Supabase → push feature branch → Preview → PR to `main`)
- Database development with `docs/SUPABASE_WORKFLOW.md`
- Shortcut deploys with `vercel` / `vercel --prebuilt` / `vercel --prod`


Create `.env.local` and set the same in Vercel → Project Settings → Environment Variables:

    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...        # server-only
    AUTH_SECRET=...                      # 32+ chars; e.g., `openssl rand -base64 32`
    AAT_RECONCILE_URL=https://refine.getty.edu/reconcile/aat

    # existing envs for Notion/Sheets remain (if ingest runs here)
    NOTION_TOKEN=...
    NOTION_DB_ID=...
    GOOGLE_APPLICATION_CREDENTIALS=./.secrets/gsa.json
    GOOGLE_SHEETS_ID=...                 # can be a bare ID or a full Google Sheets URL
    EXPORT_WORKSHEET_TITLE=...           # optional; defaults to 'Merged YYYY-MM-DD HH:MM'
    # OAuth token defaults to ~/.googleauth/chanoyu-db/authorized_user.json if unset
    # GOOGLE_OAUTH_TOKEN_PATH=~/.googleauth/chanoyu-db/authorized_user.json

---

## Local development

Install:

    pnpm i
    # or npm i

Run:

    pnpm dev
    # open http://localhost:3000

### Minimal UI Polish

This feature adds minimal design tokens, fonts via `next/font` (Inter, EB Garamond, Noto Sans/Serif JP), UI primitives (`Container`, `Title`, `Muted`, `Separator`, `Button`), a public Objects grid at `/objects`, a redesigned object detail page at `/id/{token}`, and a mobile sheet navigation with integrated object search.

Admin pages:
- `/admin/chakai` — list, add via `/admin/chakai/new`, edit via `/admin/chakai/[id]`
  - Add attendees and items via searchable selectors
  - Location is required (search existing or create inline)
Public pages:
- `/chakai` — list of gatherings user can see (respects visibility)
- `/chakai/[id]` — detail page (EN/JA names, date/time, location, attendees, items)

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

TypeScript utilities for data ingestion:
- `scripts/ingest-notion.ts` — imports pages, mirrors images (HEIC→JPEG), writes Collection Token back to Notion
- `scripts/convert-heic-existing.ts` — converts existing HEIC media rows to JPEG in Supabase Storage and updates URIs
- `scripts/ingest-sheets.ts` — imports valuations from Google Sheets

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
2) Assign a Local Class on the item admin page (top shows current class with breadcrumb and external links; change via pulldown at bottom)  
3) Optionally add authority links (AAT/Wikidata) to the Local Class itself; keep any extra per‑item `object_classifications` with a specific `role` as needed  
4) Publish (ensure `visibility = 'public'`), confirm JSON-LD looks right

Conventions
- `role = "primary type"` → the object’s main category (legacy; prefer Local Class)  
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




