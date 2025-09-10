# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-09-object-ui-enhancement/spec.md

> Created: 2025-09-09
> Version: 1.0.0

## Endpoints

### GET /id/[token] (Object View Page)

**Purpose:** Existing endpoint that already fetches media and class data
**Current Data:** Returns object with media array and classification information
**Required Enhancement:** Ensure all object media is included in response (currently implemented)
**Response:** No changes needed - existing response includes full media array and class hierarchy data

### Database Queries Used

**Media Query:** 
- Table: `media` 
- Filters: `object_id`, `visibility = 'public'`
- Ordering: `sort_order ASC`

**Class Hierarchy Query:**
- Table: `local_class_hierarchy` (closure table)
- Joins: `local_classes` for class details
- Purpose: Generate breadcrumb trail from root to assigned class

**Notes:** All required data is already available through existing queries. No new API endpoints or database changes needed.

## Controllers

### Object View Controller
**Location:** `/app/id/[token]/page.tsx`
**Current Implementation:** Fetches object with media and classification data
**Required Changes:** 
- Replace single image display with ObjectImageGallery component
- Add class hierarchy breadcrumb display
- Pass complete media array to gallery component

### Admin Object Controller  
**Location:** Admin object pages (to be identified)
**Required Changes:**
- Add same class hierarchy breadcrumb display as public pages
- Ensure consistent classification information presentation
- Maintain existing admin functionality while adding hierarchy display