import { useState } from "react";
import heroImage from "@/assets/hero-garden.jpg";
import weddingImage from "@/assets/gallery-wedding.jpg";
import retreatImage from "@/assets/gallery-retreat.jpg";
import diningImage from "@/assets/gallery-dining.jpg";

const albums = [
  { label: "All", key: "all" },
  { label: "Grounds", key: "grounds" },
  { label: "Weddings", key: "weddings" },
  { label: "Retreats", key: "retreats" },
  { label: "Dining", key: "dining" },
];

const photos = [
  { src: heroImage, alt: "Aerial view of Olive Retreat Gardens", album: "grounds", aspect: "landscape" },
  { src: weddingImage, alt: "Wedding ceremony setup", album: "weddings", aspect: "square" },
  { src: retreatImage, alt: "Retreat training room", album: "retreats", aspect: "square" },
  { src: diningImage, alt: "Outdoor dining event", album: "dining", aspect: "landscape" },
  { src: heroImage, alt: "Garden pathways at golden hour", album: "grounds", aspect: "square" },
  { src: weddingImage, alt: "Floral arch and seating", album: "weddings", aspect: "landscape" },
  { src: retreatImage, alt: "Peaceful interior space", album: "retreats", aspect: "landscape" },
  { src: diningImage, alt: "Evening table setting under lights", album: "dining", aspect: "square" },
];

const Gallery = () => {
  const [activeAlbum, setActiveAlbum] = useState("all");

  const filtered = activeAlbum === "all" ? photos : photos.filter((p) => p.album === activeAlbum);

  return (
    <div>
      {/* Header */}
      <section className="px-8 lg:px-16 py-20 lg:py-28 max-w-5xl">
        <h1 className="section-heading mb-6">Gallery</h1>
        <div className="w-16 h-px bg-primary mb-8" />
        <p className="section-subheading">
          A glimpse into the atmosphere, beauty, and warmth of Olive Retreat Gardens.
        </p>
      </section>

      {/* Album filters */}
      <section className="px-8 lg:px-16 pb-8">
        <div className="flex flex-wrap gap-3">
          {albums.map((album) => (
            <button
              key={album.key}
              onClick={() => setActiveAlbum(album.key)}
              className={`font-body text-sm uppercase tracking-wide px-4 py-2 rounded-sm transition-colors duration-300 ${
                activeAlbum === album.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {album.label}
            </button>
          ))}
        </div>
      </section>

      {/* Photo grid */}
      <section className="px-8 lg:px-16 pb-20">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 max-w-6xl">
          {filtered.map((photo, i) => (
            <div key={i} className="mb-4 break-inside-avoid overflow-hidden rounded-sm group">
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Gallery;
