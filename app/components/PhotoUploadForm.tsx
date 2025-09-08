'use client'

import { useState, useRef } from 'react'

interface PhotoUploadFormProps {
  chakaiId: string
  onUploadSuccess: (mediaId: string) => void
  canUpload: boolean
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function PhotoUploadForm({ 
  chakaiId, 
  onUploadSuccess, 
  canUpload 
}: PhotoUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!canUpload) {
    return null
  }

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, or HEIC)'
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB'
    }
    
    return null
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setError(null)
    
    if (!file) {
      setSelectedFile(null)
      return
    }

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`/api/chakai/${chakaiId}/upload`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Reset form
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      onUploadSuccess(result.media_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="font-medium mb-3">Upload Photo</h3>
      
      <div className="space-y-3">
        <div>
          <label htmlFor="photo-upload" className="block text-sm font-medium text-gray-700 mb-1">
            Choose photo file
          </label>
          <input
            ref={fileInputRef}
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/png,image/heic"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:file:bg-gray-100 disabled:file:text-gray-500"
          />
          {!selectedFile && (
            <p className="mt-1 text-xs text-gray-500">
              Select a JPEG, PNG, or HEIC image (max 10MB)
            </p>
          )}
        </div>

        {selectedFile && (
          <div className="text-sm text-gray-600">
            Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {selectedFile && !error && (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md 
              hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </button>
        )}

        {!selectedFile && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-md 
              hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            Select Photo
          </button>
        )}
      </div>
    </div>
  )
}