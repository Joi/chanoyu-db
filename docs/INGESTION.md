# Data Ingestion Documentation

This directory contains documentation for data ingestion from Notion to the Supabase database. The actual ingestion scripts are TypeScript-based and located in `/scripts/`.

- **Main script**: `/scripts/ingest-notion.ts` - Syncs items from Notion to Supabase
- **Scope**: One-off and scheduled local runs, not long-running services
- **Security**: Uses local `.env` credentials; never commit secrets

## Project Structure

- **Web app**: `app/`, `lib/`, `components/` - deploys to Vercel
- **Database**: `supabase/` - migrations and RLS policies
- **Scripts**: `scripts/` - TypeScript ingestion and utility scripts
- **Documentation**: `ingestion/` - this ingestion guide

Changes that affect both ingestion and web should be coordinated in a single PR.

## Notion Ingestion (TypeScript)

The Notion ingestion script (`/scripts/ingest-notion.ts`) syncs items from your Notion database to Supabase. It identifies items tagged as "in collection" and imports them with their metadata and images.

### How It Works

1. **Queries Notion** for all items with the "In Collection" checkbox checked
2. **Extracts data** including titles (EN/JA), metadata, and images
3. **Generates unique tokens** for each item (12-character IDs)
4. **Upserts to Supabase** maintaining existing records by token or collection ID
5. **Mirrors images** to Supabase Storage with thumbnails
6. **Writes back** collection tokens and URLs to Notion for bidirectional linking

### Step-by-Step Setup

#### 1. Get Notion API Access

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration with read/write capabilities
3. Copy the Internal Integration Token
4. In your Notion database, click "..." → "Add connections" → Select your integration

#### 2. Find Your Database ID

The database ID is in your Notion database URL:
```
https://www.notion.so/myworkspace/[DATABASE_ID]?v=...
```
Copy the 32-character hex string (with or without dashes).

#### 3. Configure Environment Variables

Add to your `.env` file in the repo root:

```bash
# Required - Notion Access
NOTION_TOKEN=secret_abc123...           # Your integration token
NOTION_DB_ID=a1b2c3d4-e5f6-...         # Your database ID

# Required - Supabase Access  
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...    # Service role key (admin access)

# Optional - Site Configuration
COLLECTION_BASE_URL=https://collection.ito.com  # For generating URLs (default: localhost:3000)

# Optional - Notion Field Names (defaults shown)
NOTION_IN_COLLECTION_PROP=In Collection        # Checkbox field to filter items
NOTION_TOKEN_PROP=Collection Token             # Field to write token back to
NOTION_URL_PROP=Collection URL                 # Field to write URL back to
NOTION_COLLECTION_ID_PROP=Collection ID        # Field for inventory numbers
NOTION_TITLE_JA_PROP=Title JA                 # Japanese title field
NOTION_SUMMARY_EN_PROP=Summary                # English summary field
NOTION_SUMMARY_JA_PROP=Summary JA             # Japanese summary field

# Optional - Processing Control
NOTION_LIMIT=50                               # Max items to process (default: all)
NOTION_FETCH_IMAGES=1                         # Mirror images to Supabase (0 to disable)
NOTION_IMAGES_ONLY=0                          # Only process images, skip metadata (1 to enable)
NOTION_MAX_IMAGES_PER_ITEM=10                 # Max images per item (default: all)
NOTION_OVERWRITE_TOKENS=0                     # Force rewrite tokens in Notion (1 to enable)
```

#### 4. Prepare Your Notion Database

Your Notion database should have these properties:

**Required:**
- `In Collection` - Checkbox to mark items for import
- A title property (any name) - Item name/title

**Recommended:**
- `Collection Token` - Text field for the unique ID
- `Collection URL` - URL field for the item link  
- `Collection ID` - Text field for inventory number (e.g., ITO-2024-I-00001)
- `Title JA` - Japanese title (if bilingual)
- Images - Files property or embedded in page content

**Optional fields (auto-detected):**
- `Craftsman` / `Maker` / `Artist` / `作者`
- `Store` / `Dealer` / `店舗` 
- `Location` / `Place` / `場所`
- `Notes` / `備考`
- `Tags` / `タグ`
- `URL` - External reference URL

#### 5. Run the Ingestion

```bash
# From the repo root
pnpm ingest:notion

# Or with a limit
NOTION_LIMIT=10 pnpm ingest:notion

# Or process only new images for existing items
NOTION_IMAGES_ONLY=1 pnpm ingest:notion
```

### What Gets Imported

For each item marked "In Collection":

**Object Record:**
- `token` - Unique 12-character identifier
- `local_number` - Collection ID (auto-generated as ITO-YYYY-I-##### if missing)
- `title` / `title_ja` - Item names
- `craftsman` / `craftsman_ja` - Maker information
- `store` / `store_ja` - Store/dealer information  
- `location` / `location_ja` - Physical location
- `notes` / `notes_ja` - Additional notes
- `tags` - Array of tags (comma-separated in Notion)
- `url` - External reference URL
- `visibility` - Set to 'public' by default

**Media Records (if images present):**
- Downloads and stores images in Supabase Storage
- Converts HEIC/HEIF to JPEG automatically
- Creates 400px thumbnails
- Each image gets a Collection ID (ITO-YYYY-M-#####)
- Storage path: `media/{object_id}/{filename}`

### What Gets Written Back to Notion

After successful import:
- `Collection Token` - The unique token (e.g., `abc123def456`)
- `Collection URL` - Link to view item (e.g., `https://collection.ito.com/id/abc123def456`)
- `Collection ID` - The inventory number (e.g., `ITO-2024-I-00001`)

### Processing Modes

**Normal Mode (default):**
```bash
pnpm ingest:notion
```
- Imports/updates all metadata
- Mirrors images
- Writes back to Notion

**Images Only Mode:**
```bash
NOTION_IMAGES_ONLY=1 pnpm ingest:notion
```
- Skips metadata updates
- Only processes images for existing objects
- No Notion writeback

**Skip Images Mode:**
```bash
NOTION_FETCH_IMAGES=0 pnpm ingest:notion
```
- Imports/updates metadata only
- Skips image downloads
- Still writes back to Notion

### Troubleshooting

**"Missing NOTION_TOKEN and NOTION_DB_ID"**
- Ensure your `.env` file exists in the repo root
- Check that the environment variables are set correctly

**"Failed to write token to Notion"**
- Verify your integration has write access
- Check that the field names match your Notion properties
- Ensure the field types are compatible (text/rich_text for tokens)

**Images not uploading:**
- Check `NOTION_FETCH_IMAGES=1` is set (default)
- Verify Supabase Storage bucket exists (`media`)
- Check service role key has admin access

**Duplicate items:**
- The script deduplicates by `token` and `local_number`
- If you see duplicates, check these fields are unique in Notion

**Rate limits:**
- Notion API has rate limits (3 requests/second)
- The script handles this automatically but large imports may be slow

## Available Scripts

### Data Ingestion
```bash
# Sync items from Notion to Supabase
pnpm ingest:notion

# Other utility scripts
pnpm seed:licenses        # Seed license data
pnpm backfill:tokens      # Backfill missing tokens
pnpm clone:data          # Clone Supabase data locally
```

### Google Sheets Integration
Currently, Google Sheets integration is not implemented in TypeScript. If you need this functionality, consider:
1. Using the Notion database as the primary data source
2. Exporting from Supabase to Sheets for reporting
3. Implementing a TypeScript-based Sheets integration

## Coordination with the Web App

- Keep ingestion changes and DB migrations in the same PR when coupled
- Test locally with `pnpm dev` before deploying
- Migrations in `supabase/` define the shared schema
