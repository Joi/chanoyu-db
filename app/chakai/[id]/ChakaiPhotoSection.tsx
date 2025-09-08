'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import PhotoUploadForm from '@/app/components/PhotoUploadForm'

interface ChakaiPhotoSectionProps {
  chakai: {
    id: string
    visibility: string
  }
  media: any[]
  canShowPrivateMedia: boolean
  userEmail: string | null
  isPrivileged: boolean
}

export default function ChakaiPhotoSection({
  chakai,
  media,
  canShowPrivateMedia,
  userEmail,
  isPrivileged
}: ChakaiPhotoSectionProps) {
  const router = useRouter()
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  // Determine if user can upload photos
  // For now, we'll use the same logic as canShowPrivateMedia
  // In a full implementation, we'd check attendee status specifically
  const canUpload = Boolean(userEmail) && (canShowPrivateMedia || isPrivileged)

  const handleUploadSuccess = (mediaId: string) => {
    setUploadSuccess('Photo uploaded successfully!')
    
    // Clear success message after 3 seconds
    setTimeout(() => setUploadSuccess(null), 3000)
    
    // Refresh the page to show the new photo
    router.refresh()
  }

  const photos = media.filter((m: any) => 
    m.file_type?.startsWith('image/') || 
    m.uri?.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i)
  )
  
  const documents = media.filter((m: any) => 
    !photos.includes(m)
  )

  return (
    <section className="mb-6">
      <h2 className="font-medium">Photos & Attachments <span className="text-sm text-gray-700" lang="ja">/ 写真・添付ファイル</span></h2>
      
      {uploadSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          {uploadSuccess}
        </div>
      )}

      {canUpload && (
        <div className="mb-4">
          <PhotoUploadForm 
            chakaiId={chakai.id}
            onUploadSuccess={handleUploadSuccess}
            canUpload={canUpload}
          />
        </div>
      )}

      {photos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo: any) => {
              const filename = photo.original_filename || photo.uri.split('/').pop() || 'Photo'
              const isPrivate = photo.visibility === 'private'
              
              return (
                <div key={photo.id} className="relative group">
                  <div className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                    <a 
                      href={`/api/media/${photo.id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="block w-full h-full"
                    >
                      <Image 
                        src={`/api/media/${photo.id}`}
                        alt={filename}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </a>
                    {isPrivate && (
                      <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                        🔒
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-600 truncate">
                    {filename}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Documents</h3>
          <div className="grid gap-3">
            {documents.map((media: any) => {
              const isPDF = media.file_type === 'application/pdf' || media.uri.toLowerCase().endsWith('.pdf')
              const filename = media.original_filename || media.uri.split('/').pop() || 'Download'
              const isPrivate = media.visibility === 'private'
              
              return (
                <div key={media.id} className="flex items-center gap-3 p-3 border rounded">
                  <div className="flex-shrink-0">
                    {isPDF ? (
                      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                        <span className="text-red-600 text-xs font-medium">PDF</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-gray-600 text-xs font-medium">FILE</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="text-sm font-medium">{filename}</div>
                    {isPrivate && (
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <span>🔒</span>
                        <span>Private - attendees only</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {isPDF ? (
                      <div className="flex gap-2">
                        <a 
                          href={`/api/media/${media.id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs underline text-blue-600"
                        >
                          View
                        </a>
                        <a 
                          href={`/api/media/${media.id}?download=true`} 
                          download={filename}
                          className="text-xs underline text-blue-600"
                        >
                          Download
                        </a>
                      </div>
                    ) : (
                      <a 
                        href={`/api/media/${media.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs underline text-blue-600"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {media.length === 0 && !canUpload && (
        <div className="text-sm">—</div>
      )}

      {!canShowPrivateMedia && (
        <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded mt-3">
          <span>💡</span> Some attachments may be restricted to event attendees only.
        </div>
      )}
    </section>
  )
}