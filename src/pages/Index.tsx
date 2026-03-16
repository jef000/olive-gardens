import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import heroImage from "@/assets/hero-garden.jpg";
import weddingImage from "@/assets/gallery-wedding.jpg";
import retreatImage from "@/assets/gallery-retreat.jpg";
import diningImage from "@/assets/gallery-dining.jpg";
import { ArrowDown, Star, ChevronRight } from "lucide-react";

const services = [
  {
    title: "Weddings & Celebrations",
    description: "Breathtaking ceremonies surrounded by olive groves and mountain views. Our main arena seats up to 500 guests.",
    image: weddingImage,
  },
  {
    title: "Retreats & Training",
    description: "Intimate spaces for workshops, corporate retreats, and spiritual renewal. Multiple halls and breakout rooms available.",
    image: retreatImage,
  },
  {
    title: "Dining & Catering",
    description: "Farm-to-table catering with locally sourced ingredients. Indoor and outdoor dining setups for every occasion.",
    image: diningImage,
  },
];

const testimonials = [
  {
    quote: "The grounds took our breath away. Our wedding felt like something from a dream — the olive trees, the mountains, the warmth of the staff.",
    author: "Sarah & James M.",
    event: "Wedding, June 2025",
  },
  {
    quote: "We held our annual leadership retreat here and the setting transformed our conversations. There's a rare stillness that opens the mind.",
    author: "Dr. Wanjiku K.",
    event: "Corporate Retreat, March 2025",
  },
];

const stats = [
  { value: "500+", label: "Events hosted" },
  { value: "50", label: "Acres of grounds" },
  { value: "98%", label: "Client satisfaction" },
  { value: "12", label: "Years of service" },
];

const Index = () => {
  const [heroLoaded, setHeroLoaded] = useState(false);
  
  // Framer Motion scroll effects for parallax
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  return (
    <div className="overflow-x-hidden">
      {/* ═══ Hero Section ═══ */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Parallax background */}
        <motion.div 
          className="absolute inset-0 w-full h-[120%] z-0"
          style={{ y }}
        >
          <div className="absolute inset-0 bg-black/40 z-10" /> {/* Dark overlay for better text readability */}
          <img
            src={heroImage}
            alt="Olive Retreat Gardens"
            className={`w-full h-full object-cover transition-transform duration-[10s] ease-out ${
              heroLoaded ? "scale-105" : "scale-100"
            }`}
            onLoad={() => setHeroLoaded(true)}
          />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-6 text-center text-white pt-20">
          <motion.div
            initial="hidden"
            animate={heroLoaded ? "visible" : "hidden"}
            variants={staggerContainer}
            className="max-w-4xl mx-auto flex flex-col items-center"
          >
            <motion.span 
              variants={fadeIn}
              className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium tracking-[0.2em] uppercase mb-8"
            >
              Meru Highlands, Kenya
            </motion.span>
            
            <motion.h1 
              variants={fadeIn}
              className="text-5xl md:text-7xl lg:text-8xl font-serif font-light leading-tight mb-6"
            >
              Where Nature <br/> Meets <span className="italic text-white/90">Elegance</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeIn}
              className="text-lg md:text-xl font-light max-w-2xl text-white/80 mb-10 leading-relaxed"
            >
              Discover a sanctuary of extraordinary beauty for your weddings, retreats, and celebrations amidst acres of lush manicured gardens.
            </motion.p>
            
            <motion.div 
              variants={fadeIn}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <Link 
                to="/services" 
                className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-medium transition-all hover:bg-black hover:text-white hover:scale-105 duration-300 flex items-center justify-center gap-2"
              >
                Explore Venues
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/contact" 
                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/30 text-white rounded-full font-medium transition-all hover:bg-white/10 duration-300"
              >
                Plan Your Event
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          style={{ opacity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest text-white/60">Scroll</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ArrowDown className="w-4 h-4 text-white/80" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ Introduction ═══ */}
      <section className="px-8 lg:px-16 py-24 lg:py-32 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl relative z-10">
              <img 
                src={weddingImage} 
                alt="Beautiful wedding setup at Olive Retreat Gardens" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative background element */}
            <div className="absolute -top-8 -left-8 w-64 h-64 bg-olive-cream rounded-full -z-10 blur-2xl opacity-70" />
            <div className="absolute -bottom-12 -right-12 w-full h-full border border-primary/20 rounded-2xl -z-10" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <span className="text-primary font-medium tracking-widest uppercase text-sm mb-6 block">Our Story</span>
            
            <p className="text-3xl md:text-4xl lg:text-5xl text-foreground/90 leading-tight font-serif italic mb-10">
              "A place where the earth meets intention — where every path leads somewhere worth arriving."
            </p>
            
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Founded by Rev. Prof. Gitonga and Dr. Monica Gitonga, Olive Retreat Gardens was born from a vision of creating sacred space — for families, for communities, for those seeking restoration. 
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our grounds span acres of manicured gardens, olive groves, and purpose-built venues in the serene Meru highlands, meticulously designed to elevate every moment of your gathering.
              </p>
            </div>
            
            <div className="mt-12">
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all duration-300 hover:shadow-lg"
              >
                Discover Our Heritage <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Stats Counter ═══ */}
      <section className="px-8 lg:px-16 py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-6xl mx-auto text-center relative z-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="flex flex-col items-center justify-center space-y-3"
            >
              <span className="font-serif text-5xl md:text-6xl lg:text-7xl font-light">
                {stat.value}
              </span>
              <span className="font-medium text-sm md:text-base tracking-widest uppercase text-white/80">
                {stat.label}
              </span>
              <div className="w-12 h-px bg-white/30 mt-4" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ Services Preview ═══ */}
      <section
        className="px-8 lg:px-16 py-24 lg:py-32 bg-olive-cream/50"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-medium tracking-widest uppercase text-sm mb-4 block">Our Spaces</span>
            <h2 className="text-4xl md:text-5xl font-serif font-light mb-6">Designed for Every Occasion</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              From grand celebrations to intimate healing sessions, our spaces adapt to your unique vision.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white"
              >
                <div className="aspect-[4/5] overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-2xl font-serif text-white mb-2">
                      {service.title}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      {service.description}
                    </p>
                    <div className="mt-6 flex items-center text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                      Explore Venue <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <Link 
              to="/services" 
              className="inline-flex items-center gap-2 px-8 py-4 border border-black text-black rounded-full font-medium hover:bg-black hover:text-white transition-colors duration-300"
            >
              View All Packages
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══ Visual Marquee / Gallery Preview ═══ */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 lg:px-16 mb-16 text-center">
          <span className="text-primary font-medium tracking-widest uppercase text-sm mb-4 block">Gallery</span>
          <h2 className="text-4xl md:text-5xl font-serif font-light mb-6">Moments Captured</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Glimpses of beauty, joy, and peace across our expansive grounds.</p>
        </div>

        <div className="relative w-full flex overflow-x-hidden">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 30,
              ease: "linear",
              repeat: Infinity,
            }}
            className="flex gap-6 px-6 whitespace-nowrap"
          >
            {/* Duplicate array for seamless infinite scrolling */}
            {[...services, ...services].map((item, idx) => (
              <div 
                key={`${item.title}-${idx}`}
                className="relative w-[300px] md:w-[400px] h-[400px] md:h-[500px] rounded-2xl overflow-hidden shrink-0 group cursor-pointer"
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500 z-10" />
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              </div>
            ))}
          </motion.div>
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 px-8 py-4 border border-black text-black rounded-full font-medium hover:bg-black hover:text-white transition-colors duration-300"
          >
            View Full Gallery <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section className="px-8 lg:px-16 py-24 lg:py-32 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center mb-16 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
              <Star size={24} className="text-primary" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-serif font-light">Words of Grace</h2>
          </div>
          <p className="text-lg text-muted-foreground">Stories from those who have experienced the magic of Olive Retreat.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              className="relative p-8 rounded-3xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="absolute top-8 left-8 text-6xl text-primary/10 font-serif leading-none">"</div>
              <p className="relative z-10 font-serif text-xl lg:text-2xl italic text-foreground/90 leading-relaxed mb-8 pt-6">
                {t.quote}
              </p>
              <footer className="flex flex-col">
                <strong className="text-foreground font-medium uppercase tracking-wide text-sm">{t.author}</strong>
                <span className="text-muted-foreground text-sm mt-1">{t.event}</span>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </section>

      {/* ═══ CTA Band ═══ */}
      <section className="px-8 lg:px-16 py-32 bg-black relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3] 
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2] 
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/10 blur-[100px]" 
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <span className="text-white/60 font-medium tracking-widest uppercase text-sm mb-6 block">Take the First Step</span>
          <h2 className="text-5xl md:text-6xl lg:text-7xl text-white font-serif font-light mb-8 leading-tight">
            Begin Planning Your <br />
            <span className="italic text-white/90">Masterpiece</span>
          </h2>
          <p className="text-white/70 mb-12 max-w-2xl mx-auto text-lg md:text-xl font-light">
            Whether it's a wedding, retreat, training workshop, or counselling session — we're here to make it extraordinary.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              to="/availability" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-medium transition-all hover:bg-primary hover:text-white hover:scale-105 duration-300 flex items-center justify-center gap-2"
            >
              Check Availability
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/30 text-white rounded-full font-medium transition-all hover:bg-white/10 duration-300"
            >
              Get in Touch
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="px-8 lg:px-16 py-12 border-t border-border">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading text-lg font-semibold mb-3">Olive Retreat Gardens</h3>
            <p className="font-body text-sm text-muted-foreground">
              Meru, Kenya<br />
              Along the Meru–Nanyuki Highway
            </p>
          </div>
          <div>
            <h4 className="font-body text-sm font-semibold uppercase tracking-wide mb-3">Contact</h4>
            <p className="font-body text-sm text-muted-foreground">
              +254 700 000 000<br />
              info@oliveretreat.co.ke
            </p>
          </div>
          <div>
            <h4 className="font-body text-sm font-semibold uppercase tracking-wide mb-3">Quick Links</h4>
            <div className="flex flex-col gap-1">
              <Link to="/services" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Services & Packages</Link>
              <Link to="/gallery" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Gallery</Link>
              <Link to="/availability" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Availability</Link>
              <Link to="/book" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Book Now</Link>
              <Link to="/contact" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground font-body">
          © 2025 Olive Retreat Gardens. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
