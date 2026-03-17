import { useState } from 'react';
import { Upload, Image as ImageIcon, Trash2, FolderPlus, MapPin, Grid } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GalleryImage {
  id: string;
  url: string;
  album: string;
  caption: string;
}

const mockImages: GalleryImage[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1519167758481-83f29da1a3a0?w=800',
    album: 'Main Arena',
    caption: 'Wedding Setup under the Canopy',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
    album: 'Garden Hall',
    caption: 'Indoor Workshop Setup',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800',
    album: 'Corporate Events',
    caption: 'Evening Gala Lighting',
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
    album: 'Main Arena',
    caption: 'Open Air Reception',
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
    album: 'Corporate Events',
    caption: 'Conference Seating',
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    album: 'Therapy Room',
    caption: 'Private Counselling Space',
  },
];

export default function Gallery() {
  const [albumFilter, setAlbumFilter] = useState('all');

  const filteredImages = mockImages.filter(
    (img) => albumFilter === 'all' || img.album === albumFilter
  );

  const albums = ['Main Arena', 'Garden Hall', 'Therapy Room', 'Corporate Events', 'Weddings'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Gallery Management</h1>
          <p className="text-gray-600 mt-2 font-light">Manage venue photos, event showcases, and albums</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto border-border/50 text-[#8b9172] hover:bg-[#8b9172]/5">
            <FolderPlus className="w-4 h-4 mr-2" />
            New Album
          </Button>
          <Button className="w-full sm:w-auto bg-[#8b9172] hover:bg-[#6a7051] text-white">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative bg-white rounded-xl border border-border/50 overflow-hidden hover:shadow-md transition-all duration-300 hover:border-[#8b9172]/30"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted/30">
                  <img
                    src={image.url}
                    alt={image.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 bg-white">
                  <p className="font-medium text-sm text-gray-900 truncate">{image.caption}</p>
                  <p className="text-xs text-[#8b9172] font-medium mt-1 uppercase tracking-wider">{image.album}</p>
                </div>
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  <Button variant="secondary" size="sm" className="bg-white hover:bg-gray-100 text-gray-900 h-9">
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" className="h-9 px-3">
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
                  <span className="font-medium text-gray-900">2.4 GB <span className="text-gray-400 font-normal">/ 10 GB</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-[#8b9172] h-full rounded-full transition-all duration-1000" style={{ width: '24%' }}></div>
                </div>
              </div>
              <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 font-light">Total Media Files</p>
                  <p className="text-2xl font-serif font-medium mt-1">{mockImages.length}</p>
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
                const count = mockImages.filter((img) => img.album === album).length;
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
    </div>
  );
}
