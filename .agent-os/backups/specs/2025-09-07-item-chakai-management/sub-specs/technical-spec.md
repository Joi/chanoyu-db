# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-07-item-chakai-management/spec.md

## Technical Requirements

- Modify `/app/admin/items/page.tsx` to group items by `primary_local_class_id` similar to chakai detail page implementation
- Add category headers and visual separators for each local class grouping in the items list
- Create new route `/app/admin/items/new/page.tsx` with item creation form (move from generic `/app/admin/new/`)
- Update navigation and internal links to point to new items creation route
- Implement photo upload functionality for chakai attendees using existing `chakai_media_links` table
- Add attendee verification logic to ensure only logged-in attendees can upload to specific chakai
- Integrate with existing Supabase Storage system for consistent media handling
- Add file upload UI components to chakai detail pages for authenticated attendees
- Implement proper error handling for file uploads (size limits, file types, permissions)
- Ensure uploaded photos appear in chakai media galleries with proper RLS policies
- Test categorization performance with large item datasets
- Verify upload permissions work correctly across different user roles and chakai attendance status