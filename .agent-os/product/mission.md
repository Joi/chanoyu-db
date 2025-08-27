# Product Mission

## Pitch

Chanoyu DB is a bilingual (EN/JA) collections system for Japanese tea ceremony that helps collectors, researchers, and practitioners manage utensils, people, tea ceremony events, and places, while publishing canonical, interoperable identifiers and Linked Art JSON‑LD to integrate with the wider cultural heritage ecosystem.

## Users

### Primary Customers

- Collectors and tea schools: Manage private/public collections and tea ceremony records with fine‑grained access control.
- Researchers, curators, and registrars: Discover canonical links and export interoperable data for aggregation and citation.

### User Personas

**Tea School Registrar**
- Role: Administrator of a tea school collection
- Context: Maintains inventory, assigns categories, controls member access
- Pain Points: Fragmented records, inconsistent identifiers, bilingual metadata
- Goals: Single source of truth, durable links, controlled visibility per item/event

**Independent Researcher**
- Role: Studies utensils, lineages, and tea events
- Context: Needs canonical references and machine‑readable data
- Pain Points: Unstable URLs, heterogeneous vocabularies, limited export
- Goals: Stable IDs, JSON‑LD for Linked Art, authority classifications (AAT/Wikidata)

## The Problem

### Fragmented identifiers and vocabularies
Collections and event records use ad‑hoc IDs and labels, making linking and aggregation difficult across institutions. This slows research and reduces findability.

**Our Solution:** Issue durable web IDs (ARK‑ready) and publish JSON‑LD with AAT/Wikidata alignments.

### Limited access control for mixed audiences
Most systems are binary (public/private), but tea communities need nuanced access for members, attendees, and admins.

**Our Solution:** Role‑ and context‑aware visibility (public, members, closed) enforced via RLS and JWT.

### Bilingual description gaps
Labels and descriptions are often monolingual, limiting usability in EN/JA contexts.

**Our Solution:** First‑class bilingual fields with UI that surfaces both consistently.

## Differentiators

### Canonical, ARK‑ready identifiers with Linked Art
Unlike generic CMS tools, Chanoyu DB emits Linked Art JSON‑LD per object and supports ARK migration without breaking links, enabling harvesting and scholarly reuse.

### Local Classes bridged to AAT/Wikidata
Unlike systems that rely solely on external schemes, Local Classes provide curatorial control while maintaining authority links for interoperability.

### Fine‑grained visibility with enforced RLS
Unlike front‑end only visibility toggles, server‑side RLS ensures policy is enforced across all access paths.

## Key Features

### Core Features
- **Canonical IDs**: Stable `/id/{token}` today, ARK path readiness for persistence.
- **Linked Data Export**: JSON‑LD (Linked Art flavor) for each object and ARK endpoint.
- **Local Classes + Authorities**: Curated tree with AAT/Wikidata links and preferred labels.
- **Bilingual Metadata**: `*_ja` fields and UI rendering for EN/JA.
- **Media Management**: Supabase storage, thumbnails, public bucket, license hints.
- **Chakai Records**: Events with attendees, items used, venues, and visibility levels.
- **Tea Rooms (Locations)**: Reusable venues with coordinates and map links.

### Collaboration & Access
- **Access Control**: JWT‑backed roles (owner/admin/member) with RLS policies.
- **Search & Lookup**: AAT/Wikidata lookup; admin searches for items, locations, people.
- **Ingestion**: Notion + Google Sheets ingestion and valuation sync.

