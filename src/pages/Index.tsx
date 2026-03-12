import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import heroImage from "@/assets/hero-garden.jpg";
import weddingImage from "@/assets/gallery-wedding.jpg";
import retreatImage from "@/assets/gallery-retreat.jpg";
import diningImage from "@/assets/gallery-dining.jpg";
import { ArrowDown, Star } from "lucide-react";

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

/* Reusable scroll-reveal wrapper */
function Reveal({
  children,
  animation = "animate-slide-up",
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  animation?: string;
  delay?: number;
  className?: string;
}) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? animation : "opacity-0"}`}
      style={isVisible && delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

const Index = () => {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  /* Parallax for hero */
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Scroll-reveal refs for major sections */
  const [introRef, introVisible] = useScrollReveal<HTMLElement>();
  const [statsRef, statsVisible] = useScrollReveal<HTMLElement>();
  const [servicesRef, servicesVisible] = useScrollReveal<HTMLElement>();
  const [testimonialRef, testimonialVisible] = useScrollReveal<HTMLElement>();
  const [ctaRef, ctaVisible] = useScrollReveal<HTMLElement>();

  return (
    <div className="overflow-x-hidden">
      {/* ═══ Hero Section ═══ */}
      <section className="relative h-[100vh] overflow-hidden">
        {/* Parallax background with Ken Burns */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateY(${scrollY * 0.35}px)` }}
        >
          <img
            src={heroImage}
            alt="Olive Retreat Gardens — lush grounds with olive trees, pathways, and event canopy in the Meru highlands"
            className={`absolute inset-0 w-full h-[120%] object-cover transition-opacity duration-1000 ${
              heroLoaded ? "opacity-100 animate-ken-burns" : "opacity-0"
            }`}
            onLoad={() => setHeroLoaded(true)}
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end h-full px-8 lg:px-16 pb-20 lg:pb-28 max-w-4xl">
          <div
            className={`transition-all duration-1000 ${
              heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="font-body text-sm uppercase tracking-[0.3em] text-primary-foreground/60 mb-4">
              Meru Highlands · Kenya
            </p>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-primary-foreground leading-[1.1] mb-6">
              A sanctuary for
              <br />
              <span className="italic text-primary">gathering</span>,{" "}
              <span className="italic text-primary">healing</span>,
              <br />
              and <span className="italic text-primary">celebration</span>
            </h1>
          </div>

          <p
            className={`font-body text-lg text-primary-foreground/80 max-w-xl mb-10 transition-all duration-1000 delay-300 ${
              heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Nestled in the highlands of Meru, Olive Retreat Gardens offers grounds of extraordinary beauty for weddings, retreats, counselling, and community events.
          </p>

          <div
            className={`flex flex-wrap gap-4 transition-all duration-1000 delay-500 ${
              heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <Link to="/availability" className="cta-primary group">
              Check Availability
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1 ml-1">→</span>
            </Link>
            <Link
              to="/services"
              className="cta-outline border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm"
            >
              View Packages
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-float transition-opacity duration-1000 delay-1000 ${
            heroLoaded ? "opacity-60" : "opacity-0"
          }`}
        >
          <ArrowDown size={20} className="text-primary-foreground" />
        </div>
      </section>

      {/* ═══ Introduction ═══ */}
      <section
        ref={introRef}
        className="px-8 lg:px-16 py-24 lg:py-32 max-w-5xl"
      >
        <p
          className={`font-heading text-2xl md:text-3xl lg:text-4xl text-foreground leading-relaxed font-normal italic transition-all duration-1000 ${
            introVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          "A place where the earth meets intention — where every path leads somewhere worth arriving."
        </p>
        <div
          className={`mt-8 h-px bg-primary ${
            introVisible ? "animate-grow-width" : "w-0"
          }`}
        />
        <p
          className={`mt-8 section-subheading transition-all duration-1000 delay-300 ${
            introVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          Founded by Rev. Prof. Gitonga and Dr. Monica Gitonga, Olive Retreat Gardens was born from a vision of creating sacred space — for families, for communities, for those seeking restoration. Our grounds span acres of manicured gardens, olive groves, and purpose-built venues in the serene Meru highlands.
        </p>
        <Link
          to="/about"
          className={`inline-block mt-8 font-body text-sm tracking-wide uppercase text-primary hover:text-foreground transition-all duration-500 delay-500 ${
            introVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
          }`}
        >
          Read our story →
        </Link>
      </section>

      {/* ═══ Stats Counter ═══ */}
      <section
        ref={statsRef}
        className="px-8 lg:px-16 py-16 border-y border-border bg-muted/30"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`transition-all duration-700 ${
                statsVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: statsVisible ? `${i * 0.15}s` : "0s" }}
            >
              <p className="font-heading text-3xl md:text-4xl font-semibold text-primary">
                {stat.value}
              </p>
              <p className="font-body text-sm text-muted-foreground mt-1 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Services Preview ═══ */}
      <section
        ref={servicesRef}
        className="px-8 lg:px-16 py-20 lg:py-28 bg-olive-cream"
      >
        <div
          className={`transition-all duration-800 ${
            servicesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="section-heading mb-4">What we offer</h2>
          <p className="section-subheading mb-14">
            From grand celebrations to intimate healing sessions, our spaces adapt to your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <Reveal
              key={service.title}
              animation="animate-scale-in"
              delay={i * 0.15}
            >
              <div className="card-garden group cursor-pointer overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 transition-colors duration-300 group-hover:bg-primary/5">
                  <h3 className="font-heading text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                  <span className="inline-block mt-4 font-body text-xs uppercase tracking-wide text-primary opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Learn more →
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12">
          <Link to="/services" className="cta-outline group">
            Explore all packages
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1 ml-1">→</span>
          </Link>
        </Reveal>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section
        ref={testimonialRef}
        className="px-8 lg:px-16 py-24 lg:py-32 max-w-4xl"
      >
        <div
          className={`transition-all duration-700 ${
            testimonialVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center gap-2 mb-12">
            <h2 className="section-heading">What people say</h2>
            <Star size={20} className="text-primary animate-float" />
          </div>
        </div>

        <div className="space-y-14">
          {testimonials.map((t, i) => (
            <Reveal key={i} animation="animate-slide-in-left" delay={i * 0.2}>
              <blockquote className="border-l-2 border-primary pl-8 group hover:border-l-4 transition-all duration-300">
                <p className="font-heading text-lg lg:text-xl italic text-foreground/90 leading-relaxed">
                  "{t.quote}"
                </p>
                <footer className="mt-4 font-body text-sm text-muted-foreground">
                  <strong className="text-foreground">{t.author}</strong> — {t.event}
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ CTA Band ═══ */}
      <section
        ref={ctaRef}
        className="px-8 lg:px-16 py-20 bg-foreground relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-accent blur-3xl" />
        </div>

        <div
          className={`relative z-10 max-w-3xl transition-all duration-1000 ${
            ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl text-primary-foreground font-semibold mb-4 leading-tight">
            Begin planning your
            <br />
            <span className="italic text-primary">gathering</span>
          </h2>
          <p className="font-body text-primary-foreground/60 mb-10 max-w-xl text-lg">
            Whether it's a wedding, retreat, training workshop, or counselling session — we're here to make it extraordinary.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/availability" className="cta-primary group">
              Check Availability
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1 ml-1">→</span>
            </Link>
            <Link
              to="/contact"
              className="cta-outline border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Get in Touch
            </Link>
          </div>
        </div>
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
