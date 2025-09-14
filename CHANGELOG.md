# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-09-14

### Added
- Joi Design System foundations with consistent branding and typography
- Complete profile system with components and API routes
- Object UI enhancements with image gallery and improved hierarchy display
- GitHub bug report issue template
- Item categorization by primary local class
- Chakai photo upload functionality for authenticated attendees
- Dedicated new item route with admin navigation
- User-friendly error messages for member creation
- Complete database schema & profile system

### Fixed
- Member creation bug with proper error handling and redirect
- ObjectImageGallery navigation and image consistency
- Schema drift issues - removed non-existent tags column references
- Allow owners and admins to view draft items on individual pages
- Media display for standalone media not linked to chakai
- Browser extension requests handler for /api-proxy/api/logs
- Use API endpoint instead of raw storage path for media images
- Link chakai photos to dedicated media pages instead of raw files
- Navigation header download dialog bug

### Changed
- Removed tags handling from Notion ingestion script
- Removed bulk actions section from media list page
- Organized development SQL files into temp-sql directory
- Complete profile system UI integration
- Enhanced item & chakai management workflow

### Documentation
- Added schema drift troubleshooting to Supabase workflow
- Archived completed chakai photo upload spec
- Added feature roadmap for 2025-09-08
- Updated spec with task creation completion

## [0.5.1] - Previous Release

### Added
- Initial tea ceremony (chanoyu) collections management
- Supabase integration with PostgreSQL 17.4
- Next.js App Router with TypeScript
- Image handling and storage via Supabase Storage
- Bilingual support (EN/JA)
- Object management for tea utensils
- Basic chakai (tea gathering) events system

### Features
- Stable HTTPS IDs with token-based routing
- JSON-LD (Linked Art) export
- AAT/Wikidata classification integration
- Notion and Google Sheets ingestion pipelines
- Role-based access control with Supabase RLS
- Public and private object visibility