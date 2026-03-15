import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);

  const filtered = activeAlbum === "all" ? photos : photos.filter((p) => p.album === activeAlbum);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    requestAnimationFrame(() => setLightboxVisible(true));
  };

  const closeLightbox = () => {
    setLightboxVisible(false);
    setTimeout(() => setLightboxIndex(null), 300);
  };

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filtered.length);
  }, [lightboxIndex, filtered.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filtered.length) % filtered.length);
  }, [lightboxIndex, filtered.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [lightboxIndex, goNext, goPrev]);

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
            <div
              key={i}
              className="mb-4 break-inside-avoid overflow-hidden rounded-sm group cursor-pointer"
              onClick={() => openLightbox(i)}
            >
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

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
            lightboxVisible ? "bg-foreground/90 backdrop-blur-sm" : "bg-foreground/0"
          }`}
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-background/70 hover:text-background transition-colors z-10"
          >
            <X className="h-7 w-7" />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 md:left-8 text-background/60 hover:text-background transition-colors z-10"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>

          {/* Image */}
          <img
            src={filtered[lightboxIndex].src}
            alt={filtered[lightboxIndex].alt}
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[85vh] max-w-[90vw] object-contain rounded-sm shadow-2xl transition-all duration-300 ${
              lightboxVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          />

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 md:right-8 text-background/60 hover:text-background transition-colors z-10"
          >
            <ChevronRight className="h-10 w-10" />
          </button>

          {/* Caption & counter */}
          <div
            className={`absolute bottom-8 text-center text-background/80 font-body text-sm tracking-wide transition-all duration-300 ${
              lightboxVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="mb-1">{filtered[lightboxIndex].alt}</p>
            <p className="text-background/50">{lightboxIndex + 1} / {filtered.length}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
