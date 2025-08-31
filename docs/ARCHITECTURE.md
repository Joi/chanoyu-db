# Architecture Overview

## Simple System Diagram

```
User Browser
     ↓
Vercel (Next.js)
     ↓
Supabase (Database + Storage)
     ↑
Ingestion Scripts (Notion + Google Sheets)
```

## Key Components

### 1. Frontend (Next.js on Vercel)
- **Public Pages**: `/id/[token]` - View objects
- **Admin Pages**: `/admin/*` - Manage content
- **API Routes**: `/api/*` - Data operations

### 2. Database (Supabase Postgres)
Main tables:
- `objects` - Tea utensils and items
- `chakai` - Tea gatherings
- `locations` - Venues
- `media` - Images and documents
- `classifications` - Authority concepts (AAT/Wikidata)
- `local_classes` - Local-first category tree with optional links to authorities
- `local_class_links` - Join between `local_classes` and `classifications`
- `local_class_hierarchy` - Closure table for tree/breadcrumb

#### Classification Model (v2)
- Objects do not write to `object_classifications` directly.
- Each object references a single `primary_local_class_id`.
- External authority types for JSON-LD are resolved from the Local Class’s `preferred_classification_id` (via `local_class_links`).
- The legacy `object_classifications` table remains read-only for transition and analytics.

### 3. Storage (Supabase Storage)
- Public bucket: `media`
- Stores object images
- Automatic HEIC→JPEG conversion

### 4. Data Flow

#### Viewing an Object:
1. User visits `/id/abc123`
2. Next.js fetches from Supabase
3. Checks visibility permissions
4. Resolves Local Class breadcrumb; derives authority label(s) only from the Local Class preferred link (if set)
5. Renders page with images

#### Adding via Notion:
1. Run `scripts/ingest-notion.ts`
2. Fetches Notion pages
3. Creates objects in Supabase
4. Mirrors images to storage
5. Updates Notion with URLs

## Environment Setup

### Local Development
```
localhost:3000 → local Next.js → Supabase Cloud
```

### Preview (dev branch)
```
dev.chanoyu.ito.com → Vercel Preview → Supabase Cloud
```

### Production (main branch)
```
chanoyu.ito.com → Vercel Production → Supabase Cloud
```

## Security Model

### Public Access
- Only `visibility = 'public'` objects
- Anonymous users via RLS policies

### Admin Access
- Service role key for server-side
- Never exposed to client
- Used in API routes and scripts

### Chakai Visibility
- `open` - Anyone can view
- `members` - Only attendees
- `closed` - Admin only

## File Organization

```
/app              - Next.js pages and API
  /api            - Server endpoints
  /admin          - Protected pages
  /chakai         - Event pages
  /id             - Object pages
/lib              - Shared code
  /supabase.ts    - Database client
  /types.ts       - TypeScript types
/scripts          - Data ingestion
/public           - Static assets
```

## Quick Debugging

### Check if issue is:

1. **Database**: Test query in Supabase dashboard
2. **Permissions**: Check RLS policies
3. **Frontend**: Check browser console
4. **API**: Check Vercel function logs
5. **Images**: Verify Supabase Storage

## Common Patterns

### Fetching Data
```typescript
// Client-side (public data)
const { data } = await supabase
  .from('objects')
  .select('*')
  .eq('visibility', 'public')

// Server-side (all data)
const { data } = await supabaseAdmin
  .from('objects')
  .select('*')
```

### Image URLs
```typescript
// Storage URL pattern
https://[project].supabase.co/storage/v1/object/public/media/[filename]
```

### Error Handling
```typescript
const { data, error } = await supabase.from('table').select()
if (error) {
  console.error('Database error:', error)
  return null
}
```

## Deployment Pipeline

1. **Local Development**
   - Edit code
   - Test with `npm run dev`

2. **Preview Deploy**
   - Push to `dev` branch
   - Auto-deploys to dev.collection.ito.com

3. **Production Deploy**
   - PR from `dev` to `main`
   - Auto-deploys to collection.ito.com

## Monitoring

- **Errors**: Vercel Functions logs
- **Database**: Supabase dashboard
- **Performance**: Vercel Analytics
- **Storage**: Supabase Storage metrics
