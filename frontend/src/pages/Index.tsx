import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import heroImage from "@/assets/hero-garden.jpg";
import weddingImage from "@/assets/gallery-wedding.jpg";
import retreatImage from "@/assets/gallery-retreat.jpg";
import diningImage from "@/assets/gallery-dining.jpg";
import { ArrowDown, Star, ChevronRight, HeartHandshake, Leaf, Users, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  {
    title: "Weddings & Celebrations",
    description: "Breathtaking ceremonies surrounded by olive groves and mountain views. Our gardens offer the perfect country setting for your special day.",
    image: weddingImage,
    icon: Calendar,
  },
  {
    title: "Olive Counselling & Training",
    description: "Registered by KCPA since 2005, OCTC provides professional therapy and rehabilitation supported by medical doctors and social workers.",
    image: retreatImage,
    icon: HeartHandshake,
  },
  {
    title: "Corporate Retreats",
    description: "Intimate spaces for workshops and spiritual renewal. Find tranquility that opens the mind in the heart of Meru.",
    image: diningImage,
    icon: Users,
  },
];

const testimonials = [
  {
    quote: "The gardens' ambiance and tranquility greets you at the entrance. Our wedding felt like something from a dream.",
    author: "Sarah & James M.",
    event: "Wedding Celebration",
  },
  {
    quote: "OCTC changed my life. The professional counselling team provided a safe, serene space for my healing journey.",
    author: "David K.",
    event: "Counselling Client",
  },
];

const stats = [
  { value: "2005", label: "Established" },
  { value: "500+", label: "Events Hosted" },
  { value: "10k+", label: "Lives Touched" },
  { value: "100%", label: "Serenity" },
];

const Index = () => {
  const [heroLoaded, setHeroLoaded] = useState(false);

  // Framer Motion scroll effects for parallax
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 400]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  return (
    <div className="overflow-x-hidden bg-background">
      {/* ▬▬▬ Hero Section ▬▬▬ */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0 w-full h-[120%] z-0" style={{ y }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-10" />
          <img
            src={heroImage}
            alt="Olive Retreat Gardens"
            className={`w-full h-full object-cover transition-transform duration-[10s] ease-out ${heroLoaded ? "scale-105" : "scale-100"}`}
            onLoad={() => setHeroLoaded(true)}
          />
        </motion.div>

        <div className="relative z-20 container mx-auto px-6 text-center text-white pt-20">
          <motion.div initial="hidden" animate={heroLoaded ? "visible" : "hidden"} variants={staggerContainer} className="max-w-4xl mx-auto flex flex-col items-center">
            <motion.div variants={fadeIn} className="flex items-center gap-3 mb-8">
              <span className="h-[1px] w-12 bg-primary"></span>
              <span className="text-sm font-medium tracking-[0.2em] uppercase text-primary-foreground">Meru, Kenya</span>
              <span className="h-[1px] w-12 bg-primary"></span>
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl lg:text-8xl font-serif font-light leading-[1.1] mb-6 drop-shadow-lg">
              Tranquility & <br />
              <span className="italic text-primary-foreground/90">Restoration</span>
            </motion.h1>

            <motion.p variants={fadeIn} className="text-lg md:text-xl font-light max-w-2xl text-white/90 mb-10 leading-relaxed drop-shadow">
              Home to Olive Retreat Gardens and the renowned Olive Counselling & Training Center. Discover a sanctuary for healing, learning, and unforgettable celebrations.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link to="/book" className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium transition-all hover:bg-primary/90 hover:scale-105 duration-300 flex items-center justify-center gap-2 shadow-lg">
                Book a Space
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/contact" className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-full font-medium transition-all hover:bg-white/20 duration-300">
                Contact OCTC
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <motion.div style={{ opacity }} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-white/60">Discover</span>
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <ArrowDown className="w-4 h-4 text-white/80" />
          </motion.div>
        </motion.div>
      </section>

      {/* ▬▬▬ Infinite Marquee ▬▬▬ */}
      <div className="bg-primary text-primary-foreground py-4 overflow-hidden flex whitespace-nowrap">
        <motion.div
          className="flex gap-16 items-center text-sm tracking-widest uppercase font-medium"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-16 items-center">
              <span>Weddings & Gardens</span>
              <Leaf size={16} className="text-primary-foreground/50" />
              <span>Counselling & Therapy</span>
              <Leaf size={16} className="text-primary-foreground/50" />
              <span>Corporate Retreats</span>
              <Leaf size={16} className="text-primary-foreground/50" />
              <span>Team Building</span>
              <Leaf size={16} className="text-primary-foreground/50" />
            </div>
          ))}
        </motion.div>
      </div>

      {/* ▬▬▬ Introduction ▬▬▬ */}
      <section className="px-8 lg:px-16 py-24 lg:py-32 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }} className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl relative z-10">
              <img src={retreatImage} alt="Olive Retreat Gardens Ambiance" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -top-8 -left-8 w-64 h-64 bg-primary/20 rounded-full -z-10 blur-3xl opacity-70" />
            <div className="absolute -bottom-12 -right-12 w-full h-full border-2 border-primary/20 rounded-2xl -z-10" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1, delay: 0.2 }} className="flex flex-col justify-center">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Our Heritage</span>
            <h2 className="text-4xl lg:text-5xl text-foreground font-serif leading-tight mb-8">
              A Legacy of Healing & Celebration
            </h2>

            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                Founded by Rev. Prof. Gitonga and Dr. Monica Gitonga, Olive Retreat Gardens is more than just a beautiful venue in the Meru highlands. It is a sanctuary designed for restoration.
              </p>
              <p>
                Since 2005, we have been the proud home of the <strong>Olive Counselling & Training Center (OCTC)</strong>. Registered by the Kenya Counselling and Psychological Association (KCPA), our professional team of medical doctors and social workers provides unparalleled mental health and rehabilitation support.
              </p>
              <p>
                Whether you are joining us for a picturesque garden wedding, a corporate team-building retreat, or seeking professional counseling, our grounds offer the perfect country setting to reconnect and renew.
              </p>
            </div>

            <div className="mt-10">
              <Link to="/about" className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full font-medium transition-all duration-300">
                Learn More About Us <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ▬▬▬ Services ▬▬▬ */}
      <section className="px-8 lg:px-16 py-24 lg:py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">What We Offer</span>
            <h2 className="text-4xl md:text-5xl font-serif mb-6 text-foreground">Services & Spaces</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              A harmonious blend of professional psychological services and breathtaking event venues.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div key={service.title} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: i * 0.2 }}>
                <Card className="group h-full overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-500 bg-card">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                    <img src={service.image} alt={service.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    <div className="absolute top-4 right-4 z-20 bg-background/90 backdrop-blur p-3 rounded-full text-primary shadow-sm">
                      <service.icon size={24} />
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-serif text-foreground mb-3">{service.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{service.description}</p>
                    <Link to="/services" className="inline-flex items-center text-primary font-medium group-hover:underline underline-offset-4">
                      Discover More <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ▬▬▬ Stats Counter ▬▬▬ */}
      <section className="px-8 lg:px-16 py-20 bg-foreground text-background relative overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-6xl mx-auto text-center relative z-10">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="flex flex-col items-center justify-center space-y-2">
              <span className="font-serif text-5xl md:text-6xl text-primary">{stat.value}</span>
              <span className="font-medium text-sm md:text-base tracking-widest uppercase text-background/80">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ▬▬▬ Testimonials ▬▬▬ */}
      <section className="px-8 lg:px-16 py-24 lg:py-32 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className="flex flex-col items-center mb-16 text-center">
          <Star size={32} className="text-primary mb-6" />
          <h2 className="text-4xl md:text-5xl font-serif text-foreground">Impact & Grace</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {testimonials.map((t, i) => (
            <motion.blockquote key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, delay: i * 0.2 }} className="relative p-10 rounded-3xl bg-card border border-border shadow-sm">
              <div className="absolute top-6 left-6 text-6xl text-primary/20 font-serif leading-none">"</div>
              <p className="relative z-10 font-serif text-xl italic text-foreground/90 leading-relaxed mb-8 pt-4">
                {t.quote}
              </p>
              <footer className="flex flex-col border-t border-border pt-4 mt-auto">
                <strong className="text-foreground font-medium">{t.author}</strong>
                <span className="text-primary text-sm mt-1 font-medium">{t.event}</span>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </section>

      {/* ▬▬▬ CTA Band ▬▬▬ */}
      <section className="px-8 lg:px-16 py-32 bg-primary relative overflow-hidden text-primary-foreground text-center">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:24px_24px]"></div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-serif mb-6 drop-shadow-sm">Ready to Find Your Peace?</h2>
          <p className="text-lg md:text-xl font-light mb-10 text-primary-foreground/90">
            Reach out to Olive Counselling & Training Center for professional support, or book our stunning gardens for your next major event.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/book" className="px-8 py-4 bg-background text-foreground rounded-full font-semibold transition-all hover:bg-white hover:scale-105 duration-300">
              Book a Venue
            </Link>
            <Link to="/contact" className="px-8 py-4 bg-transparent border border-primary-foreground text-primary-foreground rounded-full font-medium transition-all hover:bg-primary-foreground/10 duration-300">
              Contact Us
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ▬▬▬ Footer ▬▬▬ */}
      <footer className="px-8 lg:px-16 py-12 border-t border-border bg-card">
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div>
            <h3 className="font-serif text-xl font-semibold mb-3 text-foreground">Olive Retreat Gardens</h3>
            <p className="font-body text-sm text-muted-foreground">
              Home of OCTC
              <br />
              Meru, Kenya
              <br />
              Along the Meru–Nanyuki Highway
            </p>
          </div>
          <div>
            <h4 className="font-body text-sm font-bold uppercase tracking-widest text-primary mb-4">Contact</h4>
            <p className="font-body text-sm text-muted-foreground">
              +254 700 000 000
              <br />
              info@oliveretreat.co.ke
            </p>
          </div>
          <div>
            <h4 className="font-body text-sm font-bold uppercase tracking-widest text-primary mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link to="/services" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">Services & Packages</Link>
              <Link to="/gallery" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">Gallery</Link>
              <Link to="/book" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">Book a Venue</Link>
              <Link to="/contact" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">Contact OCTC</Link>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground font-body max-w-7xl mx-auto">
          &copy; {new Date().getFullYear()} Olive Retreat Gardens & OCTC. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
