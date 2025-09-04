'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, File, Image } from 'lucide-react';

// Generic MediaUpload component for PDF and image attachments

interface MediaUploadProps {
  entityType: 'chakai' | 'object' | 'location';
  entityId: string;
  onUploadSuccess?: (media: any) => void;
  onError?: (error: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  title?: string;
}

export default function MediaUpload({ 
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          {/* Drag and drop area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
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
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                >
                  Choose different file
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div>
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer font-medium text-primary hover:text-primary/80"
                  >
                    Click to upload
                  </Label>
                  <p className="text-sm text-muted-foreground">or drag and drop</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {acceptedTypes.join(', ')} (max {maxSize}MB)
                </p>
              </div>
            )}
          </div>

          {/* Visibility selector */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={(value: 'public' | 'private') => setVisibility(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - visible to everyone</SelectItem>
                <SelectItem value="private">
                  Private - {entityType === 'chakai' ? 'attendees only' : 'restricted access'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload button */}
          <Button 
            type="submit" 
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}