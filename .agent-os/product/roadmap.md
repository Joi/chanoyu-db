# Product Roadmap

## Phase 1: Core MVP

**Goal:** Canonical IDs, public viewing, basic admin, and JSON-LD export
**Success Criteria:** Public objects viewable with JSON-LD; admin can CRUD core entities

### Features
- [ ] Public object, tea room, and chakai detail pages `[M]`
- [ ] Linked Art JSON-LD for objects and ARK path placeholder `[S]`
- [ ] Admin CRUD for objects, chakai, locations, media `[M]`
- [ ] AAT/Wikidata lookup and admin search selectors `[S]`
- [ ] Bilingual fields surfaced consistently `[S]`

### Dependencies
- Supabase schema + RLS, Vercel + envs

## Phase 2: Interoperability & Access Control

**Goal:** Strengthen interoperability and nuanced access controls
**Success Criteria:** Members-only content enforced via RLS and selectively visible

### Foundation Work (Completed)
- [x] **Database schema for media visibility controls** - *Completed 2025-09-04 (Issue #67, PR #72)*
  - Media visibility enum types (public/private) implemented
  - TypeScript interfaces for type safety established
  - Foundation ready for PDF upload and access control features

### Features
- [ ] Local Classes end-to-end with preferred authority links `[M]`
- [ ] Members-only visibility for chakai attendees `[S]` - *Database foundation ready*
- [ ] Robust search across objects/chakai/locations `[M]`
- [ ] JSON-LD enhancements (authorities from Local Class) `[S]`

### Dependencies
- JWT + role validation, closure table for classes

## Phase 3: Scale & Federation

**Goal:** Persistence and ecosystem integrations
**Success Criteria:** ARK live, IIIF manifests, export endpoints

### Features
- [ ] Obtain NAAN and switch canonical path to ARK `[L]`
- [ ] IIIF Presentation v3 manifests for media `[M]`
- [ ] OAI-PMH/LIDO export endpoint `[M]`
- [ ] Provenance modeling and timeline UI `[M]`
- [ ] Bulk import for chakai and objects `[S]`

### Dependencies
- External NAAN registration, image manifest generation