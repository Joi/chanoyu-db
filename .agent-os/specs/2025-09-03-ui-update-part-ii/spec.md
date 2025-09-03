# Spec Requirements Document

> Spec: ui-update-20250903 Part II
> Created: 2025-09-03

## Overview
Continue UI polish focusing on item admin screens, chakaiki ordering, and local class management.

## Spec Scope
1. Button: "Back to item list" from Edit Item.
2. Item admin: add "Featured image" flag for view page.
3. Remove redundant "Change Local Class" from item admin page.
4. Remove "Create Object" at /admin/new and its link from admin page.
5. Local classes: add "order" field and use it for pulldown menu listing.
6. Chakaiki view: list items grouped by local class in the defined order.
7. Allow admin and owner to drag local classes up/down in list view to reorder.

## Out of Scope
- New APIs beyond minimal schema addition for local class "order".
- Auth/RLS changes beyond existing role checks.

## Expected Deliverable
1. Visible "Back to item list" button on Edit Item that navigates correctly.
2. Featured image selection persists and displays on item view.
3. "Change Local Class" removed from item admin UI.
4. "Create Object" action and link removed.
5. Pulldown menus list local classes by the new "order" field.
6. Chakaiki view groups and orders items by local class order.
7. Drag-and-drop ordering for local classes works for admin/owner and persists.
