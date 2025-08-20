Release 1.1.0

Summary
- Tea Rooms: admin/public pages; visibility (public/private) + RLS; bilingual fields (name/address EN/JA) and contained_in EN/JA; JA-first display.
- Google Maps: embedded picker with SearchBox; explicit "Save map selection" (lat/lng/place_id/maps URL); small embeds on pages; diagnostics for missing keys.
- Admin navigation: Tea Rooms link.
- Chakai admin: tea room selection simplified to dropdown + link to add; shows selected room card with address, visibility, and small map.
- Chakai public: tea room JA-first with link to its page; small map (lat/lng or parsed from saved URL).
- Items used (admin/public): thumbnails + JA/EN title + local ID; links to item pages.
- SQL init: idempotent policies and locations columns (safe to re-run on existing DBs).
- Localization: JA-first display for tea rooms across admin/public views.

Notes
- Ensure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set (separate dev/prod keys recommended) and referrer restrictions configured.
- After deploying, run the idempotent SQL if columns are missing in existing environments.
