'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { File, Image, Eye, Download, Settings, Trash2, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface MediaItem {
  id: string;
  uri: string;
  kind: string;
  file_type: string;
  file_size: number;
  original_filename: string;
  visibility: 'public' | 'private';
  signedUrl?: string;
  created_at: string;
}

interface MediaListProps {
  entityType: 'chakai' | 'object' | 'location';
  entityId: string;
  canManage?: boolean;
  title?: string;
  onMediaChange?: () => void;
}

export default function MediaList({ 
  entityType, 
  entityId, 
  canManage = false,
  title = 'Media Attachments',
  onMediaChange
}: MediaListProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]); // fetchMedia is stable and doesn't need to be in deps

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        entityType,
        entityId
      });
      const response = await fetch(`/api/media/list?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch media');
      }

      setMedia(result.media || []);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch media:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch media');
    } finally {
      setLoading(false);
    }
  };

  const updateVisibility = async (mediaId: string, visibility: 'public' | 'private') => {
    try {
      const response = await fetch(`/api/media/manage/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update visibility');
      }

      // Update local state
      setMedia(prev => prev.map(item => 
        item.id === mediaId ? { ...item, visibility } : item
      ));
      
      toast.success('Visibility updated successfully');
      onMediaChange?.();
    } catch (error) {
      console.error('Failed to update visibility:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update visibility');
    }
  };

  const deleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/media/manage/${mediaId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete media');
      }

      // Remove from local state
      setMedia(prev => prev.filter(item => item.id !== mediaId));
      
      toast.success('File deleted successfully');
      onMediaChange?.();
    } catch (error) {
      console.error('Failed to delete media:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  const downloadFile = async (item: MediaItem) => {
    try {
      const response = await fetch(`/api/media/access/${item.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to access file');
      }

      if (result.media.signedUrl) {
        window.open(result.media.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to access file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to access file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading media...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error}</p>
          <Button 
            variant="outline" 
            onClick={fetchMedia}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="secondary">{media.length} files</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {media.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No media attachments yet.
          </p>
        ) : (
          <div className="space-y-3">
            {media.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {item.file_type === 'application/pdf' ? (
                    <File className="h-8 w-8 text-red-500" aria-label="PDF file" />
                  ) : (
                    <Image className="h-8 w-8 text-blue-500" aria-label="Image file" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.original_filename}</span>
                      {item.visibility === 'public' ? (
                        <Globe className="h-4 w-4 text-green-600" />
                      ) : (
                        <Lock className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(item.file_size)} • {formatDate(item.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(item)}
                  >
                    {item.file_type === 'application/pdf' ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>

                  {canManage && (
                    <>
                      <Select
                        value={item.visibility}
                        onValueChange={(value: 'public' | 'private') => 
                          updateVisibility(item.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMedia(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}