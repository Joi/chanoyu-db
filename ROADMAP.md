## Roadmap

- Authentication/Authorization
  - Migrate user auth to Supabase Auth with email magic links, OAuth, and Passkeys (WebAuthn)
  - Add optional TOTP 2FA for admins/owner
  - Map Supabase Auth JWT claims to RLS policies for row-level enforcement (price visibility, accounts)

- Accounts & Roles
  - Owner UI to promote/demote roles; audit log of changes
  - Admins: guest management only; guests: read-only where appropriate

- Media & Rights
  - Batch upload to Supabase Storage with automatic license assignment
  - IIIF Presentation v3 generation for images (Mirador/UV support)

- Interop & IDs
  - Acquire NAAN and expose ARK as canonical with 301 from /id/{token}
  - JSON-LD enhancements: enrich language tags and language maps

- Ingest & Sync
  - Replace Python merge with Next.js/Vercel cron jobs for Notion + Sheets
  - Incremental sync; image caching with durable URLs

- Admin UX
  - Object edit form (inline fields, validation)
  - Classification attach via search, drag order, delete

- Ops & Security
  - Idempotent SQL migrations; schema registry
  - Backups and env secret rotation procedures
