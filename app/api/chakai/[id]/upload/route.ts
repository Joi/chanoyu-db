import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { currentUserEmail, requireAdmin } from '@/lib/auth'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB for photos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/heic'
] as const

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const email = await currentUserEmail()
    const isPrivileged = await requireAdmin()
    
    // Authentication required
    if (!email && !isPrivileged) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const chakaiId = params.id
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, and HEIC images are allowed.' 
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File size must be less than 10MB' 
      }, { status: 400 })
    }

    const db = supabaseAdmin()

    // Get chakai details
    const { data: chakai, error: chakaiError } = await db
      .from('chakai')
      .select('id, visibility')
      .eq('id', chakaiId)
      .maybeSingle()

    if (chakaiError) {
      console.error('[chakai upload] chakai query error', chakaiError.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!chakai) {
      return NextResponse.json({ error: 'Chakai not found' }, { status: 404 })
    }

    // Check if user is authorized to upload
    if (!isPrivileged) {
      // Non-privileged users must be attendees
      const { data: attendeeRows } = await db
        .from('chakai_attendees')
        .select('chakai_id, accounts!inner(email)')
        .eq('chakai_id', chakaiId)
        .eq('accounts.email', email!)

      if (!attendeeRows || !attendeeRows.length) {
        return NextResponse.json({ 
          error: 'Only chakai attendees can upload photos' 
        }, { status: 403 })
      }
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const uniqueId = nanoid()
    const fileName = `chakai/${chakaiId}/${uniqueId}.${fileExtension}`

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await db.storage
      .from('media')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Create media record
    const { data: mediaRecord, error: mediaError } = await db
      .from('media')
      .insert({
        uri: uploadData.path,
        kind: 'image',
        bucket: 'media',
        storage_path: uploadData.path,
        visibility: 'public', // Photos uploaded by attendees are public by default
        file_type: file.type,
        file_size: file.size,
        original_filename: file.name,
        sort_order: 0
      })
      .select()
      .single()

    if (mediaError) {
      // Cleanup uploaded file
      await db.storage.from('media').remove([uploadData.path])
      console.error('Media record error:', mediaError)
      return NextResponse.json({ 
        error: 'Failed to create media record' 
      }, { status: 500 })
    }

    // Create chakai media link
    const { error: linkError } = await db
      .from('chakai_media_links')
      .insert({
        chakai_id: chakaiId,
        media_id: mediaRecord.id,
        role: 'photo' // Different role to distinguish from admin attachments
      })

    if (linkError) {
      // Cleanup media record and file
      await db.from('media').delete().eq('id', mediaRecord.id)
      await db.storage.from('media').remove([uploadData.path])
      console.error('Link creation error:', linkError)
      return NextResponse.json({ error: 'Failed to create media link' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      media_id: mediaRecord.id,
      filename: file.name,
      file_type: file.type,
      file_size: file.size
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}