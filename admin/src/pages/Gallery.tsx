import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Upload, Image as ImageIcon, Trash2, FolderPlus, MapPin, Grid, Loader2, X } from 'lucide-react';
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
import LazyImage from '@/components/LazyImage';
import DragDropUpload from '@/components/DragDropUpload';
import BulkActionBar from '@/components/BulkActionBar';
import ExportDialog from '@/components/ExportDialog';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useBulkDelete } from '@/hooks/useBulkDelete';
import { useOperationRunner } from '@/hooks/useOperationRunner';
import { confirm } from '@/lib/confirm';
import { createEntityListCache } from '@/lib/entityListCache';
import ProgressModal from '@/components/ProgressModal';
import PageIntro from '@/components/PageIntro';

export interface GalleryImage {
  id: string;
  title: string;
  alt_text?: string;
  description?: string;
  url: string;
  album: string;
  file_size?: number;
}

export default function Gallery() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [albumFilter, setAlbumFilter] = useState('all');
  
  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const defaultForm = {
    title: '',
    alt_text: '',
    description: '',
    album: 'Main Arena',
  };
  const [formData, setFormData] = useState(defaultForm);

  const { data: galleryData, isLoading: isLoadingGallery, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['gallery'],
    queryFn: async ({ pageParam }) => {
      const response = await api.get<ApiResponse<{ images: GalleryImage[]; total: number; page: number; has_more: boolean }>>('/gallery', { params: { page: pageParam, limit: 25 } });
      return response.data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.page + 1 : undefined,
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['gallery', 'stats'],
    queryFn: async (): Promise<{ total_storage_bytes: number; total_images: number; album_breakdown: { album: string; count: string }[] }> => {
      const response = await api.get('/gallery/stats/summary');
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
    onError: (error: unknown) => {
      const errorMsg = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      alert(errorMsg || 'Failed to delete image');
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size exceeds 5MB limit');
        return;
      }
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Auto-fill title if empty
      if (!formData.title) {
        const titleWithoutExt = file.name.split('.').slice(0, -1).join('.');
        setFormData(prev => ({ ...prev, title: titleWithoutExt }));
      }
    }
  };

  const handleDroppedFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    if (!formData.title) {
      const titleWithoutExt = file.name.split('.').slice(0, -1).join('.');
      setFormData((prev) => ({ ...prev, title: titleWithoutExt }));
    }
  };

  const resetUploadState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData(defaultForm);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select an image file to upload');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('image', selectedFile);
      submitData.append('title', formData.title);
      submitData.append('alt_text', formData.alt_text);
      submitData.append('description', formData.description);
      submitData.append('album', formData.album);

      // We need to set the Content-Type to multipart/form-data for file uploads
      await api.post('/gallery/upload', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => setUploadProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
      });

      setIsUploadOpen(false);
      setUploadProgress(0);
      resetUploadState();
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['gallery', 'stats'] });
    } catch (error: unknown) {
      const errorMsg = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      alert(errorMsg || 'Failed to upload image');
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedImages = galleryData?.pages.flatMap((page) => page.images) || [];
  
  const albumStructure = [
    { value: 'Main Arena', label: 'Main Arena', parent: null },
    { value: 'Gardens', label: 'Gardens', parent: null },
    { value: 'Garden of Eden', label: '  ↳ Garden of Eden', parent: 'Gardens' },
    { value: 'Mount Sinai Prayer Area', label: '  ↳ Mount Sinai Prayer Area', parent: 'Gardens' },
    { value: 'Picnic Grounds', label: '  ↳ Picnic Grounds', parent: 'Gardens' },
    { value: 'Camping Grounds', label: '  ↳ Camping Grounds', parent: 'Gardens' },
    { value: 'Therapy Room', label: 'Therapy Room', parent: null },
    { value: 'Events', label: 'Events', parent: null },
    { value: 'Facilities', label: 'Facilities', parent: null },
    { value: 'Other', label: 'Other', parent: null },
  ];

  const gardenSubAlbums = ['Garden of Eden', 'Mount Sinai Prayer Area', 'Picnic Grounds', 'Camping Grounds'];
  
  const getFilteredImagesForAlbum = (album: string) => {
    if (album === 'all') return normalizedImages;
    if (album === 'Gardens') {
      return normalizedImages.filter(img => img.album === 'Gardens' || gardenSubAlbums.includes(img.album));
    }
    return normalizedImages.filter(img => img.album === album);
  };

  const filteredImages = getFilteredImagesForAlbum(albumFilter);
  const bulk = useBulkSelection(filteredImages);
  const { sentinelRef } = useInfiniteScroll(() => { void fetchNextPage(); }, Boolean(hasNextPage), isFetchingNextPage);
  const [exportOpen, setExportOpen] = useState(false);
  const zipRunner = useOperationRunner();

  const invalidateGallery = () => {
    void queryClient.invalidateQueries({ queryKey: ['gallery'] });
    void queryClient.invalidateQueries({ queryKey: ['gallery', 'stats'] });
  };

  interface GalleryListPage {
    images: GalleryImage[];
    total: number;
    page?: number;
    has_more?: boolean;
  }

  const galleryListCache = useMemo(
    () =>
      createEntityListCache<GalleryListPage, GalleryImage>({
        queryClient,
        queryKey: ['gallery'],
        getItems: (page) => page.images,
        setItems: (page, images) => ({ ...page, images }),
      }),
    [queryClient]
  );

  const bulkDelete = useBulkDelete({
    noun: 'images',
    list: galleryListCache,
    deleteOne: (id) => api.delete(`/gallery/${id}`),
    refetch: invalidateGallery,
  });

  const resolveImageUrl = (image: GalleryImage) => {
    if (image.url.startsWith('http')) return image.url;
    const base = api.defaults.baseURL?.replace(/\/api$/, '') ?? window.location.origin;
    return `${base}${image.url}`;
  };

  const downloadSelectedAsZip = async () => {
    const items = bulk.selectedItems;
    if (!items.length) return;
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const folder = zip.folder('gallery');
      if (!folder) throw new Error('Could not create zip folder');

      const collected = await zipRunner.run({
        label: 'Preparing ZIP download…',
        items,
        task: async (image) => {
          const response = await fetch(resolveImageUrl(image), { credentials: 'include' });
          if (!response.ok) return;
          const blob = await response.blob();
          const extension = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
          const safeTitle = (image.title || `image-${image.id}`).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || `image-${image.id}`;
          folder.file(`${safeTitle}-${image.id}.${extension}`, blob);
        },
      });
      if (collected.cancelled) return;

      let content: Blob | null = null;
      await zipRunner.run({
        label: 'Compressing ZIP download…',
        items: [zip],
        task: async () => {
          content = await zip.generateAsync({ type: 'blob' });
        },
      });
      if (!content) return;

      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'olive-garden-gallery.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to build ZIP download');
    }
  };

  const exportRows = filteredImages.map((image) => ({ title: image.title, album: image.album, url: image.url, size: image.file_size || 0 }));
  const deleteSelected = async () => {
    if (await bulkDelete.run(new Set(bulk.selectedIds))) {
      bulk.clearSelection();
    }
  };
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Content library"
        title="Gallery Management"
        description="Manage venue photos, event showcases, and albums."
        actions={<Button
            onClick={() => {
              resetUploadState();
              setIsUploadOpen(true);
            }} 
            className="w-full bg-[#8b9172] text-white hover:bg-[#6a7051] sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Photos
          </Button>}
      />

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
                {albumStructure.map((album) => (
                  <SelectItem key={album.value} value={album.value}>
                    {album.label}
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
                <input type="checkbox" aria-label={`Select image ${image.title}`} checked={bulk.isSelected(image.id)} onChange={() => bulk.toggleSelection(image.id)} className="absolute left-3 top-3 z-10 h-4 w-4" />
                <div className="aspect-[4/3] overflow-hidden bg-muted/30">
                  <LazyImage
                    src={image.url.startsWith('http') ? image.url : `${api.defaults.baseURL?.replace(/\/api$/, '')}${image.url}`}
                    alt={image.alt_text || image.title || 'Gallery image'}
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="h-full w-full group-hover:scale-105 transition-transform duration-500"
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
                    onClick={async () => {
                      const approved = await confirm({
                        title: 'Delete this image permanently?',
                        undoable: false,
                        confirmLabel: 'Delete',
                        variant: 'destructive',
                      });
                      if (approved) {
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
          <div ref={sentinelRef} className="h-8" aria-hidden="true" />
          {isFetchingNextPage && <p className="py-3 text-center text-sm text-gray-500" role="status">Loading more images…</p>}
          {!hasNextPage && normalizedImages.length > 0 && <p className="py-3 text-center text-sm text-gray-400">No more images</p>}
          </>
          )}
        </CardContent>
      </Card>

      <BulkActionBar count={bulk.selectedCount} onDownload={() => void downloadSelectedAsZip()} downloadLabel="Download ZIP" onExport={() => setExportOpen(true)} onDelete={() => void deleteSelected()} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} rows={exportRows} filename="olive-garden-gallery.csv" />
      <ProgressModal open={zipRunner.progress?.open ?? false} progress={zipRunner.progress?.progress ?? 0} label={zipRunner.progress?.label ?? ''} onCancel={zipRunner.cancel} />
      <ProgressModal open={bulkDelete.progress?.open ?? false} progress={bulkDelete.progress?.progress ?? 0} label={bulkDelete.progress?.label ?? ''} onCancel={bulkDelete.cancel} />

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
              {albumStructure.map((album) => {
                // Calculate count including sub-albums for Gardens
                let count = 0;
                if (album.value === 'Gardens') {
                  const gardensImages = getFilteredImagesForAlbum('Gardens');
                  count = gardensImages.length;
                } else {
                  const statsAlbum = statsData?.album_breakdown?.find((a: { album: string; count: string }) => a.album === album.value);
                  count = statsAlbum ? parseInt(statsAlbum.count) : normalizedImages.filter((img) => img.album === album.value).length;
                }
                
                return (
                  <div
                    key={album.value}
                    className={`flex items-center justify-between p-3.5 bg-gray-50/50 border border-border/50 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group ${
                      album.parent ? 'ml-6 bg-white' : ''
                    }`}
                    onClick={() => setAlbumFilter(album.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-border/50 flex items-center justify-center group-hover:border-[#8b9172]/30 transition-colors">
                        <FolderPlus className="w-5 h-5 text-[#8b9172]" />
                      </div>
                      <span className={`font-medium text-gray-900 ${
                        album.parent ? 'text-sm' : ''
                      }`}>{album.parent ? album.label : album.value}</span>
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
        if (!isSubmitting) {
          setIsUploadOpen(open);
          if (!open) resetUploadState();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Upload Photo</DialogTitle>
            <DialogDescription className="font-light">
              Add a new photo to the venue gallery from your computer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit}>
            <div className="space-y-4 py-4">
              
              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>Image File</Label>
                <DragDropUpload onFiles={handleDroppedFiles} multiple={false} />
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    previewUrl ? 'border-[#8b9172]/50 bg-[#8b9172]/5' : 'border-gray-300 hover:border-[#8b9172] bg-gray-50 hover:bg-gray-50/80'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    disabled={isSubmitting}
                  />
                  
                  {previewUrl ? (
                    <div className="relative w-full h-40">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-contain rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetUploadState();
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
                      <div className="p-3 bg-white rounded-full shadow-sm">
                        <Upload className="w-6 h-6 text-[#8b9172]" />
                      </div>
                      <div className="text-sm font-medium">Click to select an image</div>
                      <div className="text-xs font-light">PNG, JPG, WEBP up to 5MB</div>
                    </div>
                  )}
                </div>
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
                <Label htmlFor="alt-text">Alternative text</Label>
                <Input id="alt-text" maxLength={125} placeholder="Describe this image for screen readers" value={formData.alt_text} onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })} disabled={isSubmitting} />
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
                    {albumStructure.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUploadOpen(false);
                  resetUploadState();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedFile} 
                className="bg-[#8b9172] hover:bg-[#6a7051] text-white"
              >
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
      <ProgressModal open={isSubmitting && uploadProgress > 0} progress={uploadProgress} label="Uploading image" />
    </div>
  );
}
