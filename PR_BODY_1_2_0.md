Release 1.2.0 – Tea Room photos and structural UX updates

Overview
This PR brings dev up-to-date with main and introduces a focused set of improvements around Tea Rooms, Google Maps integration, and Chakai UX. The release also includes minor structural and quality fixes.

Highlights
1) Tea Rooms – media and display polish
- Public and admin pages now surface more contextual information (bilingual labels, contained-in fields, visibility).
- JA-first presentation for names across admin list and public detail pages, with EN as secondary.
- Google Map link is shown when provided; small embedded map renders when lat/lng exist.

2) Chakai pages – Tea Room and Items UX
- Admin edit: simplified Tea Room selection via dropdown; added link to create a new tea room; shows a compact info card (address, visibility, small map) for the selected room.
- Public view: Tea Room name links to its Tea Room page; JA-first naming; small embedded map (from lat/lng or parsed from saved Google Maps URL).
- Items used (admin + view): show a thumbnail (primary media), JA/EN title, local ID, and links to the item page.

3) Google Maps picker – reliability and UX
- Embedded SearchBox; explicit “Save map selection” committing lat/lng/place_id/maps URL to form; Saved/Not saved indicator; “Zoom to building” shortcut.
- More robust script loading for preview environments; fallback to classic Marker (no Map ID needed).
- Diagnostics: visible console messages plus non-blocking beacon to /api/log.
- Minor memoization for computed Maps URLs.

4) Search/SQL/Policy
- Secured /api/search/locations to admin-only (baseline protection; can be adjusted later for member usage + rate limiting).
- SQL remains idempotent; location columns and policies safe to re-run on existing DBs.

Commits since main
- tea room detail: JA-first names; bilingual address/contained-in; show Google Map link; map zoom set to 18.
- admin tea rooms list: JA-first title with EN secondary.
- admin chakai edit: tea room dropdown + add-room link; selected tea room card with small map.
- chakai view: tea room JA-first, link to tea room page; embed map (lat/lng or maps URL).
- chakai items (admin/view): thumbnails + JA/EN titles + local IDs; links to item pages.
- maps UX: save/zoom/copy link, Enter key handling, preview hardening, classic Marker, memoized URL, error beacons.
- search security: admin-only guard on locations search.
- chore: bump versions to 1.1.0 then 1.2.0.

Security & Perf Notes
- Use referrer-restricted browser keys (separate dev/prod) for Maps; monitor quotas.
- Search endpoint now admin-only; future step: rate limit or broaden to logged-in members safely.
- Consider adding FTS indexes for locations if the dataset grows.

Test/Follow-ups
- Add tests for Tea Room components and picker, and integration tests for search.
- Tighten TypeScript types (remove remaining any casts in form data paths).

