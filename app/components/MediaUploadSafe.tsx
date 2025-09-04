'use client';

import { useState, useCallback } from 'react';
import { Upload, File, Image } from 'lucide-react';

// Minimal MediaUpload component without external UI dependencies for debugging

interface MediaUploadProps {
  entityType: 'chakai' | 'object' | 'location';
  entityId: string;
  onUploadSuccess?: (media: any) => void;
  onError?: (error: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  title?: string;
}

export default function MediaUploadSafe({ 
  entityType, 
  entityId, 
  onUploadSuccess, 
  onError,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp'],
  maxSize = 10,
  title = 'Add Media Attachment'
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.some(type => type.toLowerCase() === fileExtension)) {
      onError?.(`File type not supported. Accepted types: ${acceptedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      onError?.(`File too large. Maximum size: ${maxSize}MB`);
      return;
    }

    setSelectedFile(file);
  }, [acceptedTypes, maxSize, onError]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedFile) {
      onError?.('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('file', selectedFile);
      uploadData.append('entityType', entityType);
      uploadData.append('entityId', entityId);
      uploadData.append('visibility', visibility);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: uploadData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      onUploadSuccess?.(result.media);
      
      // Reset form
      setSelectedFile(null);
      setVisibility('public');
      e.currentTarget.reset();
      
    } catch (error) {
      console.error('[MediaUpload] Error:', error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 font-medium text-gray-900">
          <Upload className="h-4 w-4" />
          {title}
        </h3>
      </div>
      
      <form onSubmit={handleUpload} className="space-y-4">
        {/* Drag and drop area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : selectedFile
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="sr-only"
            accept={acceptedTypes.join(',')}
            onChange={handleInputChange}
            disabled={uploading}
          />
          
          {selectedFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                {selectedFile.type === 'application/pdf' ? (
                  <File className="h-8 w-8 text-red-500" aria-label="PDF file" />
                ) : (
                  <Image className="h-8 w-8 text-blue-500" aria-label="Image file" />
                )}
              </div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-600">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <button
                type="button"
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <div>
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer font-medium text-blue-600 hover:text-blue-500"
                >
                  Click to upload
                </label>
                <p className="text-sm text-gray-500">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                {acceptedTypes.join(', ')} (max {maxSize}MB)
              </p>
            </div>
          )}
        </div>

        {/* Visibility selector */}
        <div className="space-y-2">
          <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
            Visibility
          </label>
          <select 
            id="visibility"
            value={visibility} 
            onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={uploading}
          >
            <option value="public">Public - visible to everyone</option>
            <option value="private">
              Private - {entityType === 'chakai' ? 'attendees only' : 'restricted access'}
            </option>
          </select>
        </div>

        {/* Upload button */}
        <button 
          type="submit" 
          disabled={!selectedFile || uploading}
          className={`w-full py-2 px-4 rounded-md font-medium ${
            !selectedFile || uploading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>
    </div>
  );
}