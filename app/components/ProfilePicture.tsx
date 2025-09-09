'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, User, X } from 'lucide-react';
import Image from 'next/image';

interface ProfilePictureProps {
  currentPictureUrl?: string | null;
  onUploadSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  canEdit?: boolean;
}

export default function ProfilePicture({ 
  currentPictureUrl,
  onUploadSuccess, 
  onError,
  canEdit = true
}: ProfilePictureProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onError?.('File type not supported. Please use JPEG, PNG, or WebP images.');
      return;
    }

    // Validate file size (2MB max)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 2) {
      onError?.('File too large. Maximum size is 2MB.');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, [onError]);

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/profile/picture', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      onUploadSuccess?.(result);
      setSelectedFile(null);
      setPreviewUrl(null);
      
    } catch (error) {
      console.error('Profile picture upload error:', error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeProfilePicture = async () => {
    try {
      const response = await fetch('/api/profile/picture', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove profile picture');
      }

      onUploadSuccess?.(result);
      
    } catch (error) {
      console.error('Profile picture removal error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to remove profile picture');
    }
  };

  const cancelSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canEdit) return;
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!canEdit) return;
    handleFiles(e.dataTransfer.files);
  };

  const displayUrl = previewUrl || currentPictureUrl;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Picture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Picture Display */}
        <div className="flex justify-center">
          <div className="relative">
            {displayUrl ? (
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                <Image
                  src={displayUrl}
                  alt="Profile picture"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}
            
            {/* Remove button for current picture */}
            {currentPictureUrl && !previewUrl && canEdit && (
              <button
                onClick={removeProfilePicture}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title="Remove profile picture"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {canEdit && (
          <>
            {/* File Selection Area */}
            {!selectedFile && (
              <>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drop an image here or use the button below
                  </p>
                  <p className="text-xs text-gray-500">
                    JPEG, PNG, or WebP • Max 2MB
                  </p>
                </div>
                <div className="mt-2">
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      Select Image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleFiles(e.target.files)}
                        className="sr-only"
                      />
                    </label>
                  </Button>
                </div>
              </>
            )}

            {/* Upload Actions */}
            {selectedFile && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={uploadFile}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? 'Uploading...' : 'Upload Picture'}
                  </Button>
                  <Button
                    onClick={cancelSelection}
                    variant="outline"
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}