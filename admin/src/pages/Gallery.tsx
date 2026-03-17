import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Upload, Image as ImageIcon, Trash2, FolderPlus, MapPin, Grid, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ApiResponse } from '@/types';

export interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  url: string;
  album: string;
  file_size?: number;
}

export default function Gallery() {
  const queryClient = useQueryClient();
  const [albumFilter, setAlbumFilter] = useState('all');
  
  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultForm = {
    title: '',
    description: '',
    url: '',
    album: 'Main Arena',
  };
  const [formData, setFormData] = useState(defaultForm);

  const { data: galleryData, isLoading: isLoadingGallery } = useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ images: GalleryImage[]; total: number }>>('/gallery');
      return response.data.data;
    },
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['gallery', 'stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>('/gallery/stats/summary');
      return response.data.data;
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gallery/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['gallery', 'stats'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete image');
    }
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/gallery', formData);
      setIsUploadOpen(false);
      setFormData(defaultForm);
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['gallery', 'stats'] });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedImages = Array.isArray(galleryData?.images) ? galleryData.images : [];

  const filteredImages = normalizedImages.filter(
    (img) => albumFilter === 'all' || img.album === albumFilter
  );

  const albums = ['Main Arena', 'Garden Hall', 'Therapy Room', 'Events', 'Facilities', 'Other'];
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Gallery Management</h1>
          <p className="text-gray-600 mt-2 font-light">Manage venue photos, event showcases, and albums</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button onClick={() => setIsUploadOpen(true)} className="w-full sm:w-auto bg-[#8b9172] hover:bg-[#6a7051] text-white">
            <Upload className="w-4 h-4 mr-2" />
            Upload Photos
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Grid className="w-5 h-5 text-[#8b9172]" />
              Image Library
            </CardTitle>
            <Select value={albumFilter} onValueChange={setAlbumFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter by space" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Spaces & Albums</SelectItem>
                {albums.map((album) => (
                  <SelectItem key={album} value={album}>
                    {album}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingGallery ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#8b9172] mb-4" />
              <p className="text-gray-500 font-light">Loading gallery...</p>
            </div>
          ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative bg-white rounded-xl border border-border/50 overflow-hidden hover:shadow-md transition-all duration-300 hover:border-[#8b9172]/30"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted/30">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 bg-white">
                  <p className="font-medium text-sm text-gray-900 truncate">{image.title}</p>
                  <p className="text-xs text-[#8b9172] font-medium mt-1 uppercase tracking-wider">{image.album}</p>
                </div>
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="h-9 px-3"
                    onClick={() => {
                      if (confirm('Delete this image permanently?')) {
                        deleteImageMutation.mutate(image.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-xl mt-4">
              <div className="w-16 h-16 bg-[#8b9172]/10 text-[#8b9172] rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">No images found</p>
              <p className="text-gray-500 font-light">Try selecting a different album or upload new photos.</p>
            </div>
          )}
          </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="font-serif text-xl">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-600 font-medium">Used Space</span>
                  <span className="font-medium text-gray-900">
                    {isLoadingStats ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : formatBytes(statsData?.total_storage_bytes || 0)} 
                    <span className="text-gray-400 font-normal"> / 10 GB</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-[#8b9172] h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, ((statsData?.total_storage_bytes || 0) / (10 * 1024 * 1024 * 1024)) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 font-light">Total Media Files</p>
                  <p className="text-2xl font-serif font-medium mt-1">
                    {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : statsData?.total_images || 0}
                  </p>
                </div>
                <Button variant="outline" className="text-xs h-8 border-border/50">Upgrade Plan</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="font-serif text-xl">Albums Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {albums.map((album) => {
                // Fallback to manual count if statsData missing
                const statsAlbum = statsData?.album_breakdown?.find((a: any) => a.album === album);
                const count = statsAlbum ? parseInt(statsAlbum.count) : normalizedImages.filter((img) => img.album === album).length;
                return (
                  <div
                    key={album}
                    className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-border/50 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => setAlbumFilter(album)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-border/50 flex items-center justify-center group-hover:border-[#8b9172]/30 transition-colors">
                        <FolderPlus className="w-5 h-5 text-[#8b9172]" />
                      </div>
                      <span className="font-medium text-gray-900">{album}</span>
                    </div>
                    <span className="text-xs font-medium bg-white px-2.5 py-1 rounded-full border border-border/50 text-gray-600">
                      {count} items
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isUploadOpen} onOpenChange={(open) => {
        if (!isSubmitting) setIsUploadOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Upload Photo</DialogTitle>
            <DialogDescription className="font-light">
              Add a new photo to the venue gallery.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url">Image URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title / Caption</Label>
                <Input
                  id="title"
                  placeholder="Beautiful wedding setup..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Additional details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="album">Album</Label>
                <Select
                  value={formData.album}
                  onValueChange={(val) => setFormData({ ...formData, album: val })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="album">
                    <SelectValue placeholder="Select an album" />
                  </SelectTrigger>
                  <SelectContent>
                    {albums.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#8b9172] hover:bg-[#6a7051] text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Image'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
