import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        <motion.div 
          layout
          className="columns-1 sm:columns-2 lg:columns-3 gap-6 md:gap-8"
        >
          <AnimatePresence>
            {filtered.map((photo, i) => (
              <motion.div
                key={`${photo.src}-${i}`}
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
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
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
