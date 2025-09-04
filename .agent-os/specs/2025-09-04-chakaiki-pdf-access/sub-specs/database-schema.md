# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-09-04-chakaiki-pdf-access/spec.md

> Created: 2025-09-04
> Version: 1.0.0

## Schema Changes

### Existing Tables to Modify

#### 1. Update Media Tables (objects_media, locations_media, chakai_media)

Add visibility column to existing media tables:

```sql
-- Add visibility column to objects_media
ALTER TABLE objects_media 
ADD COLUMN visibility VARCHAR(10) NOT NULL DEFAULT 'public' 
CHECK (visibility IN ('public', 'private'));

-- Add visibility column to locations_media  
ALTER TABLE locations_media 
ADD COLUMN visibility VARCHAR(10) NOT NULL DEFAULT 'public' 
CHECK (visibility IN ('public', 'private'));

-- Add visibility column to chakai_media
ALTER TABLE chakai_media 
ADD COLUMN visibility VARCHAR(10) NOT NULL DEFAULT 'public' 
CHECK (visibility IN ('public', 'private'));

-- Add file_type column to support PDFs alongside images
ALTER TABLE objects_media 
ADD COLUMN file_type VARCHAR(20) NOT NULL DEFAULT 'image' 
CHECK (file_type IN ('image', 'pdf'));

ALTER TABLE locations_media 
ADD COLUMN file_type VARCHAR(20) NOT NULL DEFAULT 'image' 
CHECK (file_type IN ('image', 'pdf'));

ALTER TABLE chakai_media 
ADD COLUMN file_type VARCHAR(20) NOT NULL DEFAULT 'image' 
CHECK (file_type IN ('image', 'pdf'));

-- Add file_size column for storage management
ALTER TABLE objects_media ADD COLUMN file_size INTEGER;
ALTER TABLE locations_media ADD COLUMN file_size INTEGER;
ALTER TABLE chakai_media ADD COLUMN file_size INTEGER;

-- Add original_filename column for user reference
ALTER TABLE objects_media ADD COLUMN original_filename VARCHAR(255);
ALTER TABLE locations_media ADD COLUMN original_filename VARCHAR(255);
ALTER TABLE chakai_media ADD COLUMN original_filename VARCHAR(255);
```

### Indexes for Performance

```sql
-- Create indexes for visibility-based queries
CREATE INDEX idx_objects_media_visibility ON objects_media(visibility);
CREATE INDEX idx_locations_media_visibility ON locations_media(visibility);
CREATE INDEX idx_chakai_media_visibility ON chakai_media(visibility);

-- Create composite indexes for file type and visibility
CREATE INDEX idx_objects_media_type_visibility ON objects_media(file_type, visibility);
CREATE INDEX idx_locations_media_type_visibility ON locations_media(file_type, visibility);
CREATE INDEX idx_chakai_media_type_visibility ON chakai_media(file_type, visibility);

-- Create indexes for efficient chakai media queries
CREATE INDEX idx_chakai_media_chakai_id ON chakai_media(chakai_id);
CREATE INDEX idx_chakai_media_chakai_visibility ON chakai_media(chakai_id, visibility);
```

### Updated Table Structures

#### objects_media (Extended)
```sql
CREATE TABLE objects_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255), -- NEW
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (file_type IN ('image', 'pdf')), -- NEW
    file_size INTEGER, -- NEW
    visibility VARCHAR(10) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')), -- NEW
    alt_text TEXT,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### locations_media (Extended)
```sql
CREATE TABLE locations_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255), -- NEW
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (file_type IN ('image', 'pdf')), -- NEW
    file_size INTEGER, -- NEW
    visibility VARCHAR(10) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')), -- NEW
    alt_text TEXT,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### chakai_media (Extended)
```sql
CREATE TABLE chakai_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chakai_id UUID NOT NULL REFERENCES chakai(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255), -- NEW
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (file_type IN ('image', 'pdf')), -- NEW
    file_size INTEGER, -- NEW
    visibility VARCHAR(10) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')), -- NEW
    alt_text TEXT,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Row Level Security (RLS) Policy Updates

#### Objects Media RLS Policies
```sql
-- Public media access for everyone
CREATE POLICY "Public objects media viewable by all" ON objects_media
    FOR SELECT USING (visibility = 'public');

-- Private media access for authenticated users only
CREATE POLICY "Private objects media viewable by authenticated users" ON objects_media
    FOR SELECT USING (
        visibility = 'private' 
        AND auth.role() = 'authenticated'
    );

-- Media upload restricted to authenticated users
CREATE POLICY "Objects media uploadable by authenticated users" ON objects_media
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Media updates restricted to authenticated users
CREATE POLICY "Objects media updatable by authenticated users" ON objects_media
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Media deletion restricted to authenticated users
CREATE POLICY "Objects media deletable by authenticated users" ON objects_media
    FOR DELETE USING (auth.role() = 'authenticated');
```

#### Locations Media RLS Policies
```sql
-- Public media access for everyone
CREATE POLICY "Public locations media viewable by all" ON locations_media
    FOR SELECT USING (visibility = 'public');

-- Private media access for authenticated users only
CREATE POLICY "Private locations media viewable by authenticated users" ON locations_media
    FOR SELECT USING (
        visibility = 'private' 
        AND auth.role() = 'authenticated'
    );

-- Standard CUD policies for authenticated users
CREATE POLICY "Locations media uploadable by authenticated users" ON locations_media
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Locations media updatable by authenticated users" ON locations_media
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Locations media deletable by authenticated users" ON locations_media
    FOR DELETE USING (auth.role() = 'authenticated');
```

#### Chakai Media RLS Policies (Enhanced)
```sql
-- Public chakai media viewable by everyone
CREATE POLICY "Public chakai media viewable by all" ON chakai_media
    FOR SELECT USING (visibility = 'public');

-- Private chakai media viewable by attendees and owners/admins
CREATE POLICY "Private chakai media viewable by attendees" ON chakai_media
    FOR SELECT USING (
        visibility = 'private' 
        AND (
            -- User is authenticated and is an attendee of this chakai
            (auth.role() = 'authenticated' AND EXISTS (
                SELECT 1 FROM chakai_attendees ca 
                WHERE ca.chakai_id = chakai_media.chakai_id 
                AND ca.user_id = auth.uid()
            ))
            OR 
            -- User is the chakai owner
            (auth.role() = 'authenticated' AND EXISTS (
                SELECT 1 FROM chakai c 
                WHERE c.id = chakai_media.chakai_id 
                AND c.created_by = auth.uid()
            ))
            OR
            -- User is an admin (service role)
            auth.role() = 'service_role'
        )
    );

-- Media upload restricted to chakai owners/admins
CREATE POLICY "Chakai media uploadable by owners/admins" ON chakai_media
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM chakai c 
            WHERE c.id = chakai_media.chakai_id 
            AND c.created_by = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

-- Media updates restricted to chakai owners/admins
CREATE POLICY "Chakai media updatable by owners/admins" ON chakai_media
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM chakai c 
            WHERE c.id = chakai_media.chakai_id 
            AND c.created_by = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

-- Media deletion restricted to chakai owners/admins
CREATE POLICY "Chakai media deletable by owners/admins" ON chakai_media
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM chakai c 
            WHERE c.id = chakai_media.chakai_id 
            AND c.created_by = auth.uid()
        )
        OR auth.role() = 'service_role'
    );
```

## Migrations

### Migration Script: Add Visibility Controls
```sql
-- Migration: 20250904_add_media_visibility_controls.sql

BEGIN;

-- Add columns to existing media tables
ALTER TABLE objects_media 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(10) NOT NULL DEFAULT 'public' 
CHECK (visibility IN ('public', 'private')),
ADD COLUMN IF NOT EXISTS file_type VARCHAR(20) NOT NULL DEFAULT 'image' 
CHECK (file_type IN ('image', 'pdf')),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);

ALTER TABLE locations_media 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(10) NOT NULL DEFAULT 'public' 
CHECK (visibility IN ('public', 'private')),
ADD COLUMN IF NOT EXISTS file_type VARCHAR(20) NOT NULL DEFAULT 'image' 
CHECK (file_type IN ('image', 'pdf')),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);

ALTER TABLE chakai_media 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(10) NOT NULL DEFAULT 'public' 
CHECK (visibility IN ('public', 'private')),
ADD COLUMN IF NOT EXISTS file_type VARCHAR(20) NOT NULL DEFAULT 'image' 
CHECK (file_type IN ('image', 'pdf')),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_objects_media_visibility ON objects_media(visibility);
CREATE INDEX IF NOT EXISTS idx_locations_media_visibility ON locations_media(visibility);
CREATE INDEX IF NOT EXISTS idx_chakai_media_visibility ON chakai_media(visibility);

CREATE INDEX IF NOT EXISTS idx_objects_media_type_visibility ON objects_media(file_type, visibility);
CREATE INDEX IF NOT EXISTS idx_locations_media_type_visibility ON locations_media(file_type, visibility);
CREATE INDEX IF NOT EXISTS idx_chakai_media_type_visibility ON chakai_media(file_type, visibility);

CREATE INDEX IF NOT EXISTS idx_chakai_media_chakai_id ON chakai_media(chakai_id);
CREATE INDEX IF NOT EXISTS idx_chakai_media_chakai_visibility ON chakai_media(chakai_id, visibility);

-- Update RLS policies (drop existing and recreate)
-- [Include all RLS policy creation statements from above]

COMMIT;
```

### Data Migration
```sql
-- Set default values for existing records
UPDATE objects_media SET 
    visibility = 'public',
    file_type = 'image'
WHERE visibility IS NULL OR file_type IS NULL;

UPDATE locations_media SET 
    visibility = 'public',
    file_type = 'image'
WHERE visibility IS NULL OR file_type IS NULL;

UPDATE chakai_media SET 
    visibility = 'public',
    file_type = 'image'
WHERE visibility IS NULL OR file_type IS NULL;

-- Extract original filename from existing file_path if needed
UPDATE objects_media SET 
    original_filename = regexp_replace(filename, '^.*/', '')
WHERE original_filename IS NULL AND filename IS NOT NULL;

UPDATE locations_media SET 
    original_filename = regexp_replace(filename, '^.*/', '')
WHERE original_filename IS NULL AND filename IS NOT NULL;

UPDATE chakai_media SET 
    original_filename = regexp_replace(filename, '^.*/', '')
WHERE original_filename IS NULL AND filename IS NOT NULL;
```