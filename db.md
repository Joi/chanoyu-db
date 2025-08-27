# Ito Collection — ARK-ready, AAT/Wikidata-aware Collection Site

A tiny, standards-friendly stack for publishing a personal/foundation collection of **Japanese tea utensils** (and related artifacts) with **persistent IDs**, **interoperable metadata**, and a simple **category lookup**.

- **Frontend/API:** Next.js (App Router, TypeScript) on Vercel  
- **Data:** Supabase (Postgres + RLS, Storage for images)  
- **Identifiers:** Stable HTTPS IDs today (`/id/{token}`), **ARK-ready** for later (`/ark:/NAAN/{name}`)  
- **Interoperability:** Linked Art JSON-LD; categories via **Getty AAT** and **Wikidata QIDs**  
- **Ingest:** Notion (images/fields) + Google Sheets (valuations) → mirrored into Supabase

---

## Why this exists

Museums and aggregators interoperate through **stable web IDs** + **shared vocabularies**. This project ships those from day one:
- A permanent, resolvable URL per object (later upgradable to **ARK** without breaking links)
- Machine-readable **JSON-LD (Linked Art)** for each object
- Category tagging against **AAT** (museum standard) and **Wikidata** (great JA labels, cross-links)

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

- **Today (no NAAN yet):** canonical ID = `https://collection.ito.com/id/{token}`
- **Token:** opaque 10–12 chars (Crockford base32, e.g., `k7m9q2w3tz`) to avoid embedding meaning
- **Later (with NAAN):** add `https://collection.ito.com/ark:/NAAN/{name}` and **301** `/id/{token}` → `/ark:/NAAN/{name}`
- **ARK inflections:** support `?` (brief metadata) and `??` (persistence/policy) at the ARK path

Example token minter (Crockford base32, no vowels):

    // lib/id.ts
    import { customAlphabet } from "nanoid";
    const alphabet = "0123456789bcdfghjkmnpqrstvwxz";
    export const mintToken = customAlphabet(alphabet, 11);

---

## Data model (Supabase)

**Tables (abridged):**
- `objects` — one row per physical item  
  Fields: `id, token (unique), ark_name (null for now), local_number, title, title_ja, visibility, created_at, updated_at`
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

> SQL for schema + RLS lives in `/supabase/sql/init.sql` (run once when setting up the project).

---

## Interoperability

- **JSON-LD (Linked Art flavor):** every object page embeds machine data and serves it via content negotiation  
- **AAT & Wikidata:** stored per object; **AAT URIs** emitted first, **QIDs** included for extra connectivity  
- **Bilingual fields:** `title_ja`, `notes_ja` for Japanese rendering and labels

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

- **Human page** — `GET /id/{token}` → HTML page (title, images, notes, identifiers)
- **Machine data** — `GET /id/{token}` with `Accept: application/ld+json`, or `GET /id/{token}.jsonld` → JSON-LD
- **Lookup** — `GET /api/lookup?q=…` → normalized list of AAT and Wikidata hits (EN/JA labels where available)
- **ARK (placeholder until NAAN):**  
  `GET /ark:/{NAAN}/{name}` → ARK landing page  
  `GET /ark:/{NAAN}/{name}?` → brief JSON metadata (ARK “?”)  
  `GET /ark:/{NAAN}/{name}??` → JSON policy (“??”)  
  `Accept: application/ld+json` → JSON-LD at the ARK path

Curl examples:

    curl -H "Accept: application/ld+json" https://collection.ito.com/id/k7m9q2w3tz
    curl "https://collection.ito.com/api/lookup?q=chawan"

---

## Environment

Create `.env.local` (and set the same in Vercel → Project Settings → Environment Variables):

    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...        # server-only
    AAT_RECONCILE_URL=https://refine.getty.edu/reconcile/aat

    # existing envs for Notion/Sheets remain
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

## Ingest pipelines

**Notion → Supabase (`scripts/ingest-notion.ts`)**
- Reads pages, copies images into Supabase Storage (`media`), upserts object + media rows  
- If a Notion field `Object URL` or `Local Number` exists, use it as the match key

**Google Sheets → Supabase (`scripts/ingest-sheets.ts`)**
- Reads `Prices` sheet → upserts `valuations` (default `visibility = 'private'`)

> These scripts run locally or as Vercel scheduled jobs (cron). Keep service credentials in project secrets.

### Notion ingest runbook (two common workflows)

- **New “In Collection” items (no token yet)**
  1) Metadata only (mint token, create object, write back URL to Notion; skip images):

     ```bash
     NOTION_FETCH_IMAGES=0 NOTION_LIMIT=20 npm run ingest:notion
     ```

  2) Then mirror images only (dedup, optional per-item cap):

     ```bash
     NOTION_IMAGES_ONLY=1 NOTION_FETCH_IMAGES=1 NOTION_MAX_IMAGES_PER_ITEM=5 NOTION_LIMIT=20 npm run ingest:notion
     ```

- **Existing “In Collection” items with new images**
  - Images only (no object updates; matches by token or `Collection ID` written previously):

    ```bash
    NOTION_IMAGES_ONLY=1 NOTION_FETCH_IMAGES=1 NOTION_MAX_IMAGES_PER_ITEM=20 NOTION_LIMIT=20 npm run ingest:notion
    ```

- **Tips for efficiency**
  - Results are sorted by Notion `last_edited_time`, so keeping `NOTION_LIMIT` small and running the images-only job frequently picks up recent image additions first.
  - Image inserts are deduped by storage path/URI; re-running is safe.
  - For a single page, make a tiny edit in Notion (e.g., add/remove a space) to bubble it to the top, then run with `NOTION_LIMIT=1`.

---

## Editorial workflow

1) Create/ingest an object (gets a stable `/id/{token}`)  
2) Open **/lookup** → search for categories (“chawan”, “Raku”, “kintsugi”, etc.)  
3) Save chosen **AAT** (primary) and **Wikidata** (secondary) entries to `classifications` and link via `object_classifications` with an appropriate `role`  
4) Publish (ensure `visibility = 'public'`), confirm JSON-LD looks right

**Conventions**
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

- **Metadata license:** recommend CC0 (public domain) for maximum reuse  
- **Images:** set per-item license (`media.license`) — some public, some all-rights-reserved  
- **Persistence statement:** ARK “??” endpoint should state contact, scope of persistence, and redirect policy

---

## Security

- **Service role key** is used **only** in server routes/scripts (never shipped to the client)  
- RLS ensures public readers only see public data  
- Use Vercel project secrets for all tokens and keys

---

## Roadmap

- Apply for **NAAN** (foundation name) → map N2T resolver → switch canonical IDs to ARK (keep `/id/*` as 301s)  
- **IIIF Presentation v3** manifests for images → Mirador/Universal Viewer support  
- **OAI-PMH (LIDO)** export endpoint for harvesting by aggregators  
- Minimal **admin UI** to attach authorities, edit bilingual text, manage visibility  
- **Provenance** modeling and timeline rendering

---

## Glossary

- **ARK** — Archival Resource Key, a persistent identifier for physical/digital things  
- **NAAN** — ARK namespace number (issued free to qualifying orgs)  
- **AAT** — Getty Art & Architecture Thesaurus (controlled vocabulary)  
- **Wikidata QID** — Stable entity identifiers with multilingual labels  
- **Linked Art** — JSON-LD profile implementing CIDOC-CRM for art/heritage  
- **IIIF** — Interoperable image framework (manifests and tiling/viewers)  
- **LIDO** — Lightweight Information Describing Objects (XML for harvesting)

---

## License

- Code: MIT (suggested)  
- Metadata: CC0 (suggested)  
- Images: per-item license as declared in `media.license`