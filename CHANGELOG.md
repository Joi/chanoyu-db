# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2025-10-24

### Added
- Professional test infrastructure with vitest configuration
- Test setup with global mocks for Supabase, auth, and next/navigation
- Test helpers utilities (renderWithProviders, mockSupabaseQuery, mockAuth)
- Test fixtures with data builders for objects, localClasses, accounts, media, chakai
- Comprehensive tests/README.md with patterns and examples
- Test directory structure (tests/unit/ and tests/integration/)
- New test commands (pnpm test, pnpm test:watch, pnpm test:coverage)
- Example tests demonstrating helper usage and component testing patterns

### Changed
- Test philosophy: Strategic testing over complete coverage
- Focus on business logic, security, and complex interactions
- 40 tests passing with coverage of critical paths

### Documentation
- Added tests/README.md with comprehensive testing guidelines
- Documented mocking strategy for Supabase and auth
- Created reusable patterns for contributors to follow

## [1.6.1] - 2025-10-24

### Documentation
- Updated documentation for amplifier workflow and collaboration
- Improved guidance on AI-powered development tools
- Enhanced workflow documentation

## [1.6.0] - 2025-10-24

### Added
- FormCard component with independent save capability per section
- BilingualLabel component for consistent EN/JA labels
- Comprehensive tests for FormCard (12 test cases)
- Comprehensive tests for BilingualLabel (8 test cases)
- Click-outside detection for mobile menu
- Escape key support for accessibility

### Changed
- Restructured object edit page into logical card-based sections:
  - Identity Card (title, local number, identifiers)
  - Description Card (bilingual notes and summaries)
  - Media Card (image gallery management)
  - Classification Card (Local Class selection with hierarchy)
  - Provenance Card (craftsman, dates, location)
  - Valuation Card (price management, owner only)
- Navbar menus now auto-close on link click
- Responsive 3-column grid layout (2/3 main, 1/3 sidebar)
- Applied tea ceremony design system throughout (shibui, wabi, yugen, matcha)
- Used ma-based spacing for breathing room

### Fixed
- Menu persistence issue - menus now auto-close properly
- Desktop dropdown close-on-navigate behavior
- Long-standing navbar UX issues

## [1.5.0] - 2025-10-24

### Added
- Tea ceremony aesthetic colors (shibui, wabi, yugen, matcha)
- Ma-based spacing system (間 - negative space philosophy)
- Bilingual typography support with :lang() selectors
- Reusable Card component with hover effects
- Design test page showcasing the system
- Amplifier tools directory with AI-powered development utilities
- Test generator tool using Claude Code SDK
- Makefile commands (tools-setup, generate-test)
- Prompt templates for reusable AI tasks

### Changed
- Unified design language replacing 3 competing color systems
- Admin dashboard migrated to new Card component
- Applied ma spacing (pa-lg for contemplative padding)
- Improved responsive grid layout

### Documentation
- Added TEA_CEREMONY_DESIGN_SYSTEM.md - Complete design philosophy guide
- Added DESIGN_SYSTEM_MIGRATION.md - Migration notes and examples
- Added tools/WORKFLOW.md - How to use amplifier with agent-os
- Added tools/README.md, tools/SETUP.md, tools/STRUCTURE.md

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