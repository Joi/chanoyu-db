'use client';

import { useState } from 'react';

interface MediaUploadProps {
  chakaiId: string;
  onUploadSuccess?: (media: any) => void;
  onError?: (error: string) => void;
}

export default function MediaUpload({ chakaiId, onUploadSuccess, onError }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    
    if (!file) {
      onError?.('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('visibility', visibility);

      const response = await fetch(`/api/chakai/${chakaiId}/media`, {
        method: 'POST',
        body: uploadData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      onUploadSuccess?.(result.media);
      
      // Reset form
      e.currentTarget.reset();
      setVisibility('public');
      
    } catch (error) {
      console.error('[MediaUpload] Error:', error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="border rounded p-4 bg-gray-50">
      <div className="grid gap-3">
        <h3 className="font-medium">Add Media Attachment</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1">File</label>
          <input 
            type="file" 
            name="file" 
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,application/pdf,image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
            disabled={uploading}
          />
          <div className="text-xs text-gray-600 mt-1">
            Supported: PDF, JPEG, PNG, GIF, WebP (max 50MB)
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Visibility</label>
          <select 
            value={visibility} 
            onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
            className="input w-full"
            disabled={uploading}
          >
            <option value="public">Public - visible to everyone</option>
            <option value="private">Private - attendees only</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          className={`button ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </form>
  );
}