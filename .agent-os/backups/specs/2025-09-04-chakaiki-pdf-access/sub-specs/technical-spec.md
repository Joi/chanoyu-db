# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-04-chakaiki-pdf-access/spec.md

> Created: 2025-09-04
> Version: 1.0.0

## Technical Requirements

### Frontend Components (Next.js 14)

#### File Upload Interface
- React component for PDF file selection and upload with drag-and-drop support
- File validation: PDF format only, maximum size 10MB
- Progress indicator during upload process
- Integration with existing media management UI patterns

#### Visibility Control UI
- Toggle/radio button component for public/private visibility selection
- Batch visibility update capabilities for existing media
- Visual indicators showing visibility status in media lists
- Consistent UI patterns matching existing admin interfaces

#### Access-Controlled Media Display
- Conditional rendering based on user authentication status and attendee role
- PDF viewer integration (browser native or embedded viewer)
- Download functionality with proper access controls
- Responsive design for mobile and desktop viewing

### Backend Implementation (Next.js API Routes)

#### Authentication & Authorization
- Middleware for validating user roles (owner/admin/attendee/public)
- Session-based access control integrated with existing Supabase auth
- Attendee status verification against chakai_attendees table
- Role-based permission checks for upload and visibility management

#### File Processing
- Server-side PDF validation and sanitization
- Supabase Storage integration for secure file upload
- Unique file naming strategy to prevent conflicts
- Metadata extraction (file size, upload timestamp)

#### Access Control Logic
- Dynamic content filtering based on user permissions
- Visibility rule enforcement at API level
- Integration with existing RLS (Row Level Security) policies
- Caching strategy for frequently accessed public media

### Database Integration (Supabase/PostgreSQL)

#### Schema Extensions
- Add `visibility` column to existing media tables
- Maintain foreign key relationships with chakai records
- Support for PDF-specific metadata fields
- Indexing strategy for efficient visibility-based queries

#### RLS Policy Updates
- Extend existing Row Level Security policies for visibility controls
- Separate policies for public vs private content access
- Integration with chakai attendee verification
- Admin override policies for system administration

### Storage Architecture (Supabase Storage)

#### File Organization
- Bucket structure: `chakai-media/{chakai_id}/{file_type}/`
- Consistent naming convention for PDFs and images
- Storage policies aligned with database visibility controls
- CDN integration for public media delivery

#### Security Measures
- Signed URLs for private content access
- Time-limited access tokens for sensitive materials
- File type validation at storage level
- Size limits and quota management

## Approach

### Implementation Strategy

1. **Database First**: Extend existing media schema with visibility controls
2. **Backend API**: Implement upload and access control endpoints
3. **Frontend Components**: Build reusable UI components for file management
4. **Integration**: Connect with existing chakai and attendee systems
5. **Testing**: Comprehensive testing across all user roles and scenarios

### Migration Strategy

#### Existing Data
- Add default visibility settings to existing media records
- Batch update existing images to 'public' visibility as safe default
- Preserve existing file paths and storage locations
- Maintain backward compatibility with current media display logic

#### Rollout Plan
- Phase 1: Database schema updates and backend API
- Phase 2: Admin interface for media management
- Phase 3: Public-facing visibility controls
- Phase 4: Full integration testing and deployment

### Performance Considerations

#### Optimization Strategies
- Lazy loading for media-heavy chakai pages
- Efficient database queries with proper indexing
- CDN caching for public media content
- Progressive loading for PDF preview functionality

#### Scalability
- Storage bucket organization for future growth
- Database query optimization for large media collections
- Caching strategies for frequently accessed content
- Monitoring and alerting for storage usage

## External Dependencies

### Required Libraries
- `@supabase/supabase-js` (existing) - Database and storage client
- `react-dropzone` (new) - File upload UI component
- `pdfjs-dist` (new) - PDF viewing capabilities in browser
- `mime-types` (new) - File type validation

### Supabase Services
- **Supabase Storage**: File upload and retrieval
- **Supabase Database**: PostgreSQL with RLS policies
- **Supabase Auth**: User authentication and session management

### Browser APIs
- File API for client-side file handling
- Blob API for PDF download functionality
- URL.createObjectURL for PDF preview
- Fetch API for file upload progress tracking

### Infrastructure Requirements
- Vercel deployment with adequate storage limits
- CDN configuration for media delivery optimization
- Environment variables for Supabase configuration
- Monitoring and logging for file access patterns