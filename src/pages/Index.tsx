import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-garden.jpg";
import weddingImage from "@/assets/gallery-wedding.jpg";
import retreatImage from "@/assets/gallery-retreat.jpg";
import diningImage from "@/assets/gallery-dining.jpg";

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

const Index = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[85vh] lg:h-screen overflow-hidden">
        <img
          src={heroImage}
          alt="Olive Retreat Gardens — lush grounds with olive trees, pathways, and event canopy in the Meru highlands"
          className="absolute inset-0 w-full h-full object-cover animate-fade-in-slow"
        />
        <div className="absolute inset-0 bg-foreground/30" />
        <div className="relative z-10 flex flex-col justify-end h-full px-8 lg:px-16 pb-16 lg:pb-24 max-w-4xl">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-primary-foreground leading-tight mb-6 animate-fade-in">
            A sanctuary for gathering, healing, and celebration
          </h1>
          <p className="font-body text-lg text-primary-foreground/80 max-w-xl mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Nestled in the highlands of Meru, Olive Retreat Gardens offers grounds of extraordinary beauty for weddings, retreats, counselling, and community events.
          </p>
          <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <Link to="/availability" className="cta-primary">
              Check Availability
            </Link>
            <Link to="/services" className="cta-outline border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
              View Packages
            </Link>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="px-8 lg:px-16 py-20 lg:py-28 max-w-5xl">
        <p className="font-heading text-2xl md:text-3xl lg:text-4xl text-foreground leading-relaxed font-normal italic">
          "A place where the earth meets intention — where every path leads somewhere worth arriving."
        </p>
        <div className="mt-8 w-16 h-px bg-primary" />
        <p className="mt-8 section-subheading">
          Founded by Rev. Prof. Gitonga and Dr. Monica Gitonga, Olive Retreat Gardens was born from a vision of creating sacred space — for families, for communities, for those seeking restoration. Our grounds span acres of manicured gardens, olive groves, and purpose-built venues in the serene Meru highlands.
        </p>
        <Link to="/about" className="inline-block mt-8 font-body text-sm tracking-wide uppercase text-primary hover:text-foreground transition-colors">
          Read our story →
        </Link>
      </section>

      {/* Services Preview */}
      <section className="px-8 lg:px-16 py-16 lg:py-24 bg-olive-cream">
        <h2 className="section-heading mb-4">What we offer</h2>
        <p className="section-subheading mb-12">
          From grand celebrations to intimate healing sessions, our spaces adapt to your needs.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.title} className="card-garden group">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="font-heading text-xl font-semibold mb-2">{service.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link to="/services" className="cta-outline">
            Explore all packages
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-8 lg:px-16 py-20 lg:py-28 max-w-4xl">
        <h2 className="section-heading mb-12">What people say</h2>
        <div className="space-y-12">
          {testimonials.map((t, i) => (
            <blockquote key={i} className="border-l-2 border-primary pl-6">
              <p className="font-heading text-lg lg:text-xl italic text-foreground/90 leading-relaxed">
                "{t.quote}"
              </p>
              <footer className="mt-4 font-body text-sm text-muted-foreground">
                <strong className="text-foreground">{t.author}</strong> — {t.event}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* CTA Band */}
      <section className="px-8 lg:px-16 py-16 bg-foreground">
        <div className="max-w-3xl">
          <h2 className="font-heading text-3xl md:text-4xl text-primary-foreground font-semibold mb-4">
            Begin planning your gathering
          </h2>
          <p className="font-body text-primary-foreground/70 mb-8 max-w-xl">
            Whether it's a wedding, retreat, training workshop, or counselling session — we're here to make it extraordinary.
          </p>
          <Link to="/book" className="cta-primary">
            Check Availability
          </Link>
        </div>
      </section>

      {/* Footer */}
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
