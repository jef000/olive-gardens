import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";

interface GalleryImage {
  id: string;
  title: string;
  alt_text?: string;
  description?: string;
  url: string;
  album: string;
}

interface GalleryResponse {
  success: boolean;
  data?: {
    images?: GalleryImage[];
    total?: number;
  };
}

const resolveImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const apiBase = api.defaults.baseURL?.replace(/\/api$/, "") || "http://localhost:5000";
  return `${apiBase}${url}`;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const withResponse = error as { response?: { data?: { message?: string } } };
    return withResponse.response?.data?.message;
  }
  return undefined;
};

const Gallery = () => {
  const [activeAlbum, setActiveAlbum] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<GalleryResponse>("/gallery", { params: { limit: 100 } });
        const apiImages = response.data?.data?.images;
        setImages(Array.isArray(apiImages) ? apiImages : []);
      } catch (err: unknown) {
        setError(getErrorMessage(err) || "Failed to load gallery images.");
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, []);

  const gardenSubAlbums = [
    "Gardens",
    "Garden of Eden",
    "Mount Sinai Prayer Area",
    "Picnic Grounds",
    "Camping Grounds"
  ];

  const isGardenAlbum = (album: string) => gardenSubAlbums.includes(album) || album.toLowerCase().includes("garden") || album.toLowerCase().includes("picnic") || album.toLowerCase().includes("camp") || album.toLowerCase().includes("sinai");

  const albums = [
    { label: "All", key: "all" },
    { label: "Gardens", key: "gardens" },
    ...Array.from(new Set(images.map((image) => image.album)))
      .filter((album) => !isGardenAlbum(album))
      .map((album) => ({
        label: album,
        key: album,
      })),
  ];

  const filtered = activeAlbum === "all"
    ? images
    : activeAlbum === "gardens"
      ? images.filter((image) => isGardenAlbum(image.album))
      : images.filter((image) => image.album === activeAlbum);

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const openLightbox = (index: number) => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setLightboxIndex(index);
    requestAnimationFrame(() => setLightboxVisible(true));
  };

  const closeLightbox = () => {
    setLightboxVisible(false);
    setTimeout(() => {
      setLightboxIndex(null);
      lastFocusedRef.current?.focus();
    }, 300);
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
    if (lightboxIndex === null || filtered.length === 0) return;
    lightboxRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Tab") {
        const container = lightboxRef.current;
        if (!container) return;
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
        );
        const list = focusables.length ? focusables : [container];
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [lightboxIndex, goNext, goPrev, filtered.length]);

  useEffect(() => {
    if (lightboxIndex !== null && lightboxIndex >= filtered.length) {
      setLightboxIndex(filtered.length > 0 ? 0 : null);
    }
  }, [filtered.length, lightboxIndex]);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-8 lg:px-16 overflow-hidden bg-olive-cream/30">
        <div className="absolute top-0 right-0 w-[60%] h-[100%] rounded-full bg-primary/5 blur-3xl -z-10 translate-x-1/3" />
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span variants={fadeIn} className="text-primary font-medium tracking-widest uppercase text-sm mb-6 block">
              Portfolio
            </motion.span>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-serif font-light mb-8">
              Moments <span className="italic text-primary/80">Captured</span>
            </motion.h1>
            <motion.div variants={fadeIn} className="w-24 h-px bg-primary mx-auto mb-10" />
            <motion.p variants={fadeIn} className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
              A glimpse into the atmosphere, beauty, and warmth of Olive Retreat Gardens.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Album filters */}
      <section className="px-8 lg:px-16 py-12 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 md:gap-4"
        >
          {albums.map((album) => (
            <button
              key={album.key}
              onClick={() => setActiveAlbum(album.key)}
              aria-pressed={activeAlbum === album.key}
              className={`font-medium text-sm md:text-base tracking-wide px-6 py-3 rounded-full transition-all duration-300 ${
                activeAlbum === album.key
                  ? "bg-black text-white shadow-lg scale-105"
                  : "bg-white text-muted-foreground border border-border hover:border-black/20 hover:text-black hover:bg-black/5"
              }`}
            >
              {album.label}
            </button>
          ))}
        </motion.div>
      </section>

      {/* Photo grid */}
      <section className="px-8 lg:px-16 pb-32 max-w-7xl mx-auto">
        {isLoading && (
          <div className="text-center py-16 text-muted-foreground">Loading gallery...</div>
        )}

        {error && (
          <div className="text-center py-16 text-red-600">{error}</div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No gallery images available yet.
          </div>
        )}

        <motion.div 
          layout
          className="columns-1 sm:columns-2 lg:columns-3 gap-6 md:gap-8"
        >
          <AnimatePresence>
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="mb-6 md:mb-8 break-inside-avoid overflow-hidden rounded-2xl group cursor-pointer relative shadow-sm hover:shadow-2xl transition-shadow duration-500"
                onClick={() => openLightbox(i)}
              >
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 flex items-center justify-center">
                  <span className="text-white bg-black/40 backdrop-blur-sm px-6 py-2 rounded-full text-sm font-medium tracking-widest uppercase transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    View
                  </span>
                </div>
                <img
                  src={resolveImageUrl(photo.url)}
                  alt={photo.alt_text || photo.title}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/900x600?text=Image+Not+Found";
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${filtered[lightboxIndex].title} image viewer`}
          tabIndex={-1}
          className={`fixed inset-0 z-50 flex items-center justify-center outline-none transition-all duration-300 ${
            lightboxVisible ? "bg-foreground/90 backdrop-blur-sm" : "bg-foreground/0"
          }`}
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            aria-label="Close image viewer"
            className="absolute top-6 right-6 text-background/70 hover:text-background transition-colors z-10"
          >
            <X className="h-7 w-7" />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous image"
            className="absolute left-4 md:left-8 text-background/60 hover:text-background transition-colors z-10"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>

          {/* Image */}
          <img
            src={resolveImageUrl(filtered[lightboxIndex].url)}
            alt={filtered[lightboxIndex].alt_text || filtered[lightboxIndex].title}
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[85vh] max-w-[90vw] object-contain rounded-sm shadow-2xl transition-all duration-300 ${
              lightboxVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          />

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next image"
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
            <p className="mb-1">{filtered[lightboxIndex].description || filtered[lightboxIndex].title}</p>
            <p className="text-background/50">{lightboxIndex + 1} / {filtered.length}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
