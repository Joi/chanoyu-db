# Spec Requirements Document

> Spec: Chakaiki PDF Access Control
> Created: 2025-09-04
> Status: Planning

## Overview

This spec introduces comprehensive PDF file attachment capabilities to chakai records with granular visibility controls. The feature enables chakai owners and administrators to upload and attach PDF documents (such as chakaiki, programs, or reference materials) to tea ceremony events while providing flexible access controls that distinguish between public and private materials.

The implementation extends the existing media system to support PDF files and introduces visibility controls across all media types, ensuring appropriate access based on user roles and attendance status.

## User Stories

### As a chakai owner/admin, I want to:
- Upload PDF files to my chakai records so that I can share ceremony programs, notes, and reference materials
- Set visibility controls on PDF files (public/private) so that I can control who can access sensitive materials
- Manage all media attachments (images and PDFs) from a single interface
- Edit visibility settings for existing media files to adjust access as needed

### As a chakai attendee, I want to:
- Access private PDF materials for events I'm attending so that I can prepare properly for the ceremony
- Download or view PDF files directly in the browser for convenience
- See only the materials I'm authorized to access based on my attendance status

### As a public user, I want to:
- View public PDF materials for chakai events to learn about tea ceremony practices
- Browse publicly available ceremony programs and educational materials
- Understand what materials are available without needing to log in

### As a system administrator, I want to:
- Have full access to all PDF materials for moderation purposes
- Monitor file uploads and storage usage
- Maintain consistent access control policies across all media types

## Spec Scope

### In Scope:
- PDF file upload and attachment to chakai records
- Visibility controls (public/private) for all media files including existing images
- Access control enforcement based on user roles (owner/admin/attendee/public)
- Media management interface updates to handle PDF files and visibility settings
- Item view page updates to respect visibility controls for non-logged users
- File storage and retrieval through Supabase Storage
- Integration with existing chakai attendee system for access control
- Database schema updates to support visibility controls on media

### Media Types Supported:
- PDF documents (new)
- Images (existing, enhanced with visibility controls)

### User Role Permissions:
- **Owners/Admins**: Upload PDFs, edit chakai, set visibility on all media
- **Attendees**: View private media for events they're attending
- **Public Users**: View only public media, no upload capabilities
- **System Admins**: Full access to all materials

## Out of Scope

### File Types Not Supported:
- Audio files (WAV, MP3, etc.)
- Video files (MP4, MOV, etc.)
- Office documents (Word, Excel, PowerPoint)
- Archive files (ZIP, RAR, etc.)

### Features Not Included:
- PDF editing or annotation capabilities
- Version control for uploaded files
- File conversion or processing
- Bulk upload functionality
- Advanced file metadata extraction
- File sharing via external links
- Integration with external document management systems
- Automatic PDF thumbnail generation

### Access Control Not Covered:
- Time-based access controls (temporary access)
- Role-based permissions beyond owner/admin/attendee/public
- Integration with external authentication systems
- Advanced audit logging for file access

## Expected Deliverable

A fully functional PDF attachment system for chakai records that includes:

1. **File Upload System**: Secure PDF upload functionality integrated with Supabase Storage
2. **Visibility Controls**: Public/private settings for all media files with appropriate UI controls
3. **Access Enforcement**: Backend and frontend logic that enforces visibility rules based on user authentication and attendee status
4. **Media Management Interface**: Updated admin interface for managing both images and PDFs with visibility settings
5. **Public View Updates**: Modified item view pages that respect visibility controls for non-authenticated users
6. **Database Schema**: Extended media tables with visibility controls and proper foreign key relationships
7. **API Endpoints**: RESTful endpoints for PDF upload, retrieval, and visibility management

## Spec Documentation

- Tasks: @.agent-os/specs/2025-09-04-chakaiki-pdf-access/tasks.md
- Technical Specification: @.agent-os/specs/2025-09-04-chakaiki-pdf-access/sub-specs/technical-spec.md
- Database Schema: @.agent-os/specs/2025-09-04-chakaiki-pdf-access/sub-specs/database-schema.md
- API Specification: @.agent-os/specs/2025-09-04-chakaiki-pdf-access/sub-specs/api-spec.md