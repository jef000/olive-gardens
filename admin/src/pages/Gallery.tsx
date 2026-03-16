import { useState } from 'react';
import { Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
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
    url: 'https://images.unsplash.com/photo-1519167758481-83f29da1a3a0?w=400',
    album: 'Main Arena',
    caption: 'Main Arena Setup',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400',
    album: 'Garden Space',
    caption: 'Garden View',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400',
    album: 'VIP Lounge',
    caption: 'VIP Interior',
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
    album: 'Main Arena',
    caption: 'Event Setup',
  },
];

export default function Gallery() {
  const [albumFilter, setAlbumFilter] = useState('all');

  const filteredImages = mockImages.filter(
    (img) => albumFilter === 'all' || img.album === albumFilter
  );

  const albums = ['Main Arena', 'Garden Space', 'VIP Lounge', 'Events'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gallery Management</h1>
          <p className="text-gray-600 mt-2">Manage venue images and albums</p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload Images
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Image Gallery</CardTitle>
            <Select value={albumFilter} onValueChange={setAlbumFilter}>
              <SelectTrigger className="w-[200px]">
                <ImageIcon className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by album" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Albums</SelectItem>
                {albums.map((album) => (
                  <SelectItem key={album} value={album}>
                    {album}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <p className="font-medium text-sm truncate">{image.caption}</p>
                  <p className="text-xs text-gray-600 mt-1">{image.album}</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No images found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Used Storage</span>
                  <span className="font-medium">2.4 GB / 10 GB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Total Images: <span className="font-medium">{mockImages.length}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Albums</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {albums.map((album) => {
                const count = mockImages.filter((img) => img.album === album).length;
                return (
                  <div
                    key={album}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">{album}</span>
                    </div>
                    <span className="text-sm text-gray-600">{count} images</span>
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
