# Spec Requirements Document

> Spec: Item & Chakai Management Updates
> Created: 2025-09-07

## Overview

Improve item organization and chakai functionality by categorizing the item list, adding proper routing for new item creation, and enabling attendees to upload photos to chakai events. These enhancements will streamline content management and increase user engagement with events.

## User Stories

### Categorized Item List

As an admin browsing items, I want to see items grouped by their categories, so that I can quickly find and manage items of specific types without scrolling through an unsorted list.

The items page should group items by their primary_local_class_id, similar to how the chakai detail page displays items, making it easier to navigate large collections and understand the organization structure.

### New Item Creation Route

As a user, I want an intuitive URL structure for creating new items, so that I can easily bookmark and navigate to the creation page.

Instead of the generic `/app/admin/new/` route that redirects to items, there should be a dedicated `/app/admin/items/new` route that directly shows the item creation form, following standard REST conventions.

### Chakai Photo Uploads

As a chakai attendee, I want to upload photos from the event, so that I can share memories and contribute to the event documentation.

When I'm logged in and attending a chakai, I should be able to upload photos directly to that chakai's page. The system should verify I'm an attendee before allowing uploads, and photos should be stored using the existing media system for consistency.

## Spec Scope

1. **Item List Categorization** - Modify existing items page to group items by their primary local class categories
2. **New Item Route Structure** - Create dedicated `/app/admin/items/new` route for item creation following REST conventions
3. **Chakai Photo Upload System** - Enable authenticated attendees to upload photos to specific chakai events with proper permission checking

## Out of Scope

- Database schema changes for profiles or friends system
- Tag field removal from database
- Profile picture functionality
- Advanced photo tagging or people identification
- Bulk photo upload functionality
- Photo editing or filtering capabilities

## Expected Deliverable

1. Items page displays items grouped by category with clear visual separation and category headers
2. New item creation accessible via `/app/admin/items/new` with proper form functionality
3. Chakai attendees can successfully upload photos that appear in the chakai's media gallery with proper access controls