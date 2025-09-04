# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-04-chakaiki-pdf-access/spec.md

> Created: 2025-09-04
> Version: 1.0.0

## Endpoints

### PDF Upload and Management

#### POST /api/media/upload
Upload PDF or image files to chakai, objects, or locations.

**Request:**
```typescript
// Form Data
{
  file: File; // PDF or image file (max 10MB for PDF)
  entityType: 'chakai' | 'objects' | 'locations';
  entityId: string; // UUID of chakai, object, or location
  visibility: 'public' | 'private';
  caption?: string;
  alt_text?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    id: string;
    filename: string;
    original_filename: string;
    file_path: string;
    file_type: 'image' | 'pdf';
    file_size: number;
    visibility: 'public' | 'private';
    caption?: string;
    alt_text?: string;
    created_at: string;
  };
  error?: string;
}
```

**Error Codes:**
- 400: Invalid file type or size exceeded
- 401: User not authenticated
- 403: User not authorized to upload to this entity
- 413: File size too large
- 500: Server error during upload

#### GET /api/media/[entityType]/[entityId]
Retrieve all media files for a specific entity with visibility filtering.

**Parameters:**
- `entityType`: 'chakai' | 'objects' | 'locations'
- `entityId`: UUID of the entity

**Query Parameters:**
- `file_type`: Optional filter for 'image' or 'pdf'
- `visibility`: Optional filter for 'public' or 'private' (requires auth for private)

**Response:**
```typescript
{
  success: boolean;
  data?: Array<{
    id: string;
    filename: string;
    original_filename: string;
    file_path: string;
    file_type: 'image' | 'pdf';
    file_size: number;
    visibility: 'public' | 'private';
    caption?: string;
    alt_text?: string;
    sort_order: number;
    created_at: string;
  }>;
  error?: string;
}
```

#### GET /api/media/file/[id]
Download or view a specific media file with access control.

**Parameters:**
- `id`: UUID of the media file

**Query Parameters:**
- `download`: 'true' to force download, otherwise inline display

**Response:**
- File content with appropriate MIME type
- For PDFs: `application/pdf`
- For images: `image/jpeg`, `image/png`, etc.

**Error Codes:**
- 401: User not authenticated (for private files)
- 403: User not authorized to access this file
- 404: File not found
- 500: Server error retrieving file

#### PATCH /api/media/[id]
Update media file metadata including visibility settings.

**Parameters:**
- `id`: UUID of the media file

**Request Body:**
```typescript
{
  visibility?: 'public' | 'private';
  caption?: string;
  alt_text?: string;
  sort_order?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    id: string;
    visibility: 'public' | 'private';
    caption?: string;
    alt_text?: string;
    sort_order: number;
    updated_at: string;
  };
  error?: string;
}
```

#### DELETE /api/media/[id]
Delete a media file (owners/admins only).

**Parameters:**
- `id`: UUID of the media file

**Response:**
```typescript
{
  success: boolean;
  message?: string;
  error?: string;
}
```

### Chakai-Specific Endpoints

#### GET /api/chakai/[id]/media
Get all media for a specific chakai with attendee-based access control.

**Parameters:**
- `id`: UUID of the chakai

**Query Parameters:**
- `file_type`: Optional filter for 'image' or 'pdf'

**Response:**
```typescript
{
  success: boolean;
  data?: {
    public_media: MediaFile[];
    private_media: MediaFile[]; // Only if user is owner/admin/attendee
    user_access: {
      can_view_private: boolean;
      can_upload: boolean;
      can_edit: boolean;
    };
  };
  error?: string;
}
```

#### POST /api/chakai/[id]/media/bulk-visibility
Batch update visibility for multiple media files (owners/admins only).

**Parameters:**
- `id`: UUID of the chakai

**Request Body:**
```typescript
{
  media_ids: string[];
  visibility: 'public' | 'private';
}
```

**Response:**
```typescript
{
  success: boolean;
  updated_count: number;
  error?: string;
}
```

### Access Control Validation

#### GET /api/media/access-check/[id]
Check user's access permissions for a specific media file.

**Parameters:**
- `id`: UUID of the media file

**Response:**
```typescript
{
  success: boolean;
  data?: {
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
    visibility: 'public' | 'private';
    access_reason: 'public' | 'owner' | 'attendee' | 'admin';
  };
  error?: string;
}
```

## Controllers

### MediaController

#### File Upload Handler
```typescript
export class MediaController {
  async uploadFile(req: NextRequest): Promise<NextResponse> {
    // 1. Validate user authentication
    // 2. Parse form data and validate file
    // 3. Check upload permissions for entity
    // 4. Validate file type and size
    // 5. Generate unique filename
    // 6. Upload to Supabase Storage
    // 7. Create database record
    // 8. Return response
  }

  async getEntityMedia(
    entityType: string, 
    entityId: string, 
    userId?: string
  ): Promise<MediaFile[]> {
    // 1. Validate entity exists
    // 2. Check user's access level
    // 3. Filter media based on visibility and permissions
    // 4. Return sorted media list
  }

  async getMediaFile(id: string, userId?: string): Promise<Response> {
    // 1. Fetch media record
    // 2. Check access permissions
    // 3. Generate signed URL for private content
    // 4. Return file or redirect to signed URL
  }

  async updateMediaMetadata(
    id: string, 
    updates: MediaUpdate, 
    userId: string
  ): Promise<MediaFile> {
    // 1. Verify media exists and user has edit permission
    // 2. Validate update data
    // 3. Update database record
    // 4. Return updated media
  }

  async deleteMedia(id: string, userId: string): Promise<void> {
    // 1. Verify media exists and user has delete permission
    // 2. Delete file from storage
    // 3. Delete database record
    // 4. Clean up any references
  }
}
```

### ChakaiMediaController

#### Chakai-Specific Media Management
```typescript
export class ChakaiMediaController {
  async getChakaiMedia(
    chakaiId: string, 
    userId?: string
  ): Promise<ChakaiMediaResponse> {
    // 1. Verify chakai exists
    // 2. Check user's relationship to chakai (owner/attendee)
    // 3. Fetch public media for all users
    // 4. Fetch private media based on access level
    // 5. Return structured response with access info
  }

  async bulkUpdateVisibility(
    chakaiId: string,
    mediaIds: string[],
    visibility: string,
    userId: string
  ): Promise<number> {
    // 1. Verify user is chakai owner/admin
    // 2. Validate all media belongs to this chakai
    // 3. Update visibility for all specified media
    // 4. Return count of updated records
  }

  async checkAttendeeAccess(
    chakaiId: string, 
    userId: string
  ): Promise<AccessLevel> {
    // 1. Check if user is chakai owner
    // 2. Check if user is in attendees list
    // 3. Return appropriate access level
  }
}
```

### AccessControlService

#### Permission Validation
```typescript
export class AccessControlService {
  async canViewMedia(mediaId: string, userId?: string): Promise<boolean> {
    // 1. Fetch media with entity info
    // 2. If public, return true
    // 3. If private, check user authentication and permissions
    // 4. For chakai media, verify attendee status
  }

  async canUploadToEntity(
    entityType: string, 
    entityId: string, 
    userId: string
  ): Promise<boolean> {
    // 1. Check user authentication
    // 2. For chakai: verify user is owner/admin
    // 3. For objects/locations: verify general upload permissions
  }

  async canEditMedia(mediaId: string, userId: string): Promise<boolean> {
    // 1. Fetch media with entity relationship
    // 2. Check if user owns the parent entity
    // 3. Check admin permissions
  }

  async generateSignedUrl(
    filePath: string, 
    expiresIn: number = 3600
  ): Promise<string> {
    // 1. Generate temporary signed URL for private content
    // 2. Set appropriate expiration time
    // 3. Return URL for direct access
  }
}
```

### FileValidationService

#### File Processing and Validation
```typescript
export class FileValidationService {
  validateFile(file: File): ValidationResult {
    // 1. Check file type (PDF or supported image formats)
    // 2. Validate file size (10MB max for PDFs, 5MB for images)
    // 3. Basic file header validation
    // 4. Return validation status and any errors
  }

  generateUniqueFilename(
    originalName: string, 
    entityType: string, 
    entityId: string
  ): string {
    // 1. Extract file extension
    // 2. Generate UUID-based filename
    // 3. Create full path: entityType/entityId/filename
  }

  async uploadToStorage(
    file: File, 
    filePath: string
  ): Promise<StorageResult> {
    // 1. Upload file to Supabase Storage
    // 2. Set appropriate bucket and permissions
    // 3. Return storage info and public URL
  }

  async deleteFromStorage(filePath: string): Promise<void> {
    // 1. Delete file from Supabase Storage
    // 2. Handle any cleanup tasks
  }
}
```

### Database Integration

#### Media Repository Methods
```typescript
export class MediaRepository {
  async createMediaRecord(data: CreateMediaData): Promise<MediaFile> {
    // Insert new media record with all metadata
  }

  async getMediaByEntity(
    entityType: string, 
    entityId: string, 
    visibility?: string
  ): Promise<MediaFile[]> {
    // Fetch media with visibility filtering
  }

  async getMediaById(id: string): Promise<MediaFile | null> {
    // Fetch single media record with entity info
  }

  async updateMedia(id: string, updates: MediaUpdate): Promise<MediaFile> {
    // Update media metadata
  }

  async deleteMedia(id: string): Promise<void> {
    // Delete media record
  }

  async bulkUpdateVisibility(
    ids: string[], 
    visibility: string
  ): Promise<number> {
    // Batch update visibility for multiple records
  }
}
```

## Request/Response Types

### Core Types
```typescript
interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_type: 'image' | 'pdf';
  file_size: number;
  visibility: 'public' | 'private';
  caption?: string;
  alt_text?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ChakaiMediaResponse {
  public_media: MediaFile[];
  private_media: MediaFile[];
  user_access: {
    can_view_private: boolean;
    can_upload: boolean;
    can_edit: boolean;
  };
}

interface AccessLevel {
  level: 'owner' | 'attendee' | 'public';
  can_view_private: boolean;
  can_upload: boolean;
  can_edit: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  file_type?: string;
  file_size?: number;
}

interface StorageResult {
  file_path: string;
  public_url?: string;
  file_size: number;
}
```