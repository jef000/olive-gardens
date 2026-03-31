import { Link } from "react-router-dom";
import { useState } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import heroImage from "@/assets/hero-garden.jpg";
import weddingImage from "@/assets/gallery-wedding.jpg";
import retreatImage from "@/assets/gallery-retreat.jpg";
import diningImage from "@/assets/gallery-dining.jpg";
import {
  ArrowDown, Star, ChevronRight, HeartHandshake, Leaf, Users, Calendar,
  MapPin, Award, CheckCircle2, Facebook, Instagram, Twitter, Phone, Mail,
  ClipboardList, Smile
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const heroWords = ["Tranquility", "&", "Restoration"];

const features = [
  { icon: MapPin, title: "Meru Highlands", desc: "Nestled along the serene Meru–Nanyuki Highway" },
  { icon: Leaf, title: "Lush Natural Grounds", desc: "Acres of manicured gardens and olive groves" },
  { icon: Award, title: "KCPA Registered", desc: "Professional counselling certified since 2005" },
  { icon: Calendar, title: "500+ Events Hosted", desc: "Weddings, retreats, trainings & celebrations" },
];

const services = [
  {
    title: "Weddings & Celebrations",
    description: "Breathtaking ceremonies surrounded by olive groves and mountain views. Our gardens offer the perfect country setting for your special day.",
    image: weddingImage,
    icon: Calendar,
    link: "/services",
  },
  {
    title: "Olive Counselling & Training",
    description: "Registered by KCPA since 2005, OCTC provides professional therapy and rehabilitation supported by medical doctors and social workers.",
    image: retreatImage,
    icon: HeartHandshake,
    link: "/contact",
  },
  {
    title: "Corporate Retreats",
    description: "Intimate spaces for workshops and spiritual renewal. Find tranquility that opens the mind in the heart of Meru.",
    image: diningImage,
    icon: Users,
    link: "/services",
  },
];

const galleryItems = [weddingImage, retreatImage, diningImage, weddingImage, retreatImage, diningImage];

const processSteps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Choose Your Date",
    desc: "Check our availability calendar and select the perfect date for your event or session.",
  },
  {
    number: "02",
    icon: Leaf,
    title: "Select Your Space",
    desc: "Browse our venues — from the Main Arena to the Garden Hall — and choose what fits your vision.",
  },
  {
    number: "03",
    icon: Smile,
    title: "Confirm & Celebrate",
    desc: "Complete your booking, and leave the rest to us. Arrive to a space prepared just for you.",
  },
];

const testimonials = [
  {
    quote: "The gardens' ambiance and tranquility greet you at the entrance. Our wedding felt like something from a dream — the olive trees, the mountains, the warmth of every staff member.",
    author: "Sarah & James M.",
    event: "Wedding Celebration",
    stars: 5,
  },
  {
    quote: "OCTC changed my life. The professional counselling team provided a safe, serene space for my healing journey. I left a different person.",
    author: "David K.",
    event: "Counselling Client",
    stars: 5,
  },
  {
    quote: "We held our leadership retreat here and the setting transformed every conversation. There's a rare stillness at Olive that opens the mind.",
    author: "Dr. Wanjiku N.",
    event: "Corporate Retreat",
    stars: 5,
  },
];

const stats = [
  { value: "2005", label: "Established" },
  { value: "500+", label: "Events Hosted" },
  { value: "10k+", label: "Lives Touched" },
  { value: "100%", label: "Natural Serenity" },
];

const Index = () => {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [email, setEmail] = useState("");

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 400]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  const wordVariant = {
    hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
    visible: (i: number) => ({
      opacity: 1, y: 0, filter: "blur(0px)",
      transition: { duration: 0.7, delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.18, delayChildren: 0.05 } },
  };

  return (
    <div className="overflow-x-hidden bg-background">

      {/* ═══ HERO ═══ */}
      <section className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0 w-full h-[120%] z-0" style={{ y }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75 z-10" />
          <img
            src={heroImage}
            alt="Olive Retreat Gardens"
            className={`w-full h-full object-cover transition-transform duration-[12s] ease-out ${heroLoaded ? "scale-110" : "scale-100"}`}
            onLoad={() => setHeroLoaded(true)}
          />
        </motion.div>

        {/* Floating credibility badge — bottom left */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={heroLoaded ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 1.4, duration: 0.7, ease: "easeOut" }}
          className="absolute bottom-16 left-8 z-20 hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3"
        >
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Award size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold leading-tight">20+ Years of Serenity</p>
            <p className="text-white/60 text-[11px]">Est. 2005 · KCPA Certified</p>
          </div>
        </motion.div>

        <div className="relative z-20 container mx-auto px-6 text-center text-white">
          <motion.div
            initial="hidden"
            animate={heroLoaded ? "visible" : "hidden"}
            variants={stagger}
            className="max-w-4xl mx-auto flex flex-col items-center"
          >
            {/* Location pill */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-10">
              <span className="h-px w-10 bg-primary/80" />
              <span className="text-xs font-medium tracking-[0.25em] uppercase text-white/80">Meru, Kenya</span>
              <span className="h-px w-10 bg-primary/80" />
            </motion.div>

            {/* Word-by-word reveal headline */}
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif font-light leading-[1.08] mb-8 drop-shadow-xl">
              {heroWords.map((word, i) => (
                <motion.span
                  key={word + i}
                  custom={i}
                  variants={wordVariant}
                  initial="hidden"
                  animate={heroLoaded ? "visible" : "hidden"}
                  className={`inline-block mr-4 last:mr-0 ${word === "&" ? "text-primary" : i === heroWords.length - 1 ? "italic" : ""}`}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl font-light max-w-2xl text-white/85 mb-12 leading-relaxed drop-shadow">
              Home to Olive Retreat Gardens and the renowned Olive Counselling & Training Center. A sanctuary for healing, learning, and unforgettable celebrations.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/book"
                className="group px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium transition-all hover:bg-primary/90 hover:scale-105 duration-300 flex items-center gap-2 shadow-xl shadow-black/30"
              >
                Book a Space
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/25 text-white rounded-full font-medium transition-all hover:bg-white/20 duration-300"
              >
                Contact OCTC
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div style={{ opacity }} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">Discover</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
            <ArrowDown className="w-4 h-4 text-white/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <div className="bg-primary text-primary-foreground py-3.5 overflow-hidden">
        <motion.div
          className="flex gap-14 items-center whitespace-nowrap text-xs tracking-[0.22em] uppercase font-semibold"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, ease: "linear", repeat: Infinity }}
        >
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-14 items-center flex-shrink-0">
              <span>Weddings & Gardens</span>
              <Leaf size={14} className="text-primary-foreground/40 flex-shrink-0" />
              <span>KCPA Counselling</span>
              <Leaf size={14} className="text-primary-foreground/40 flex-shrink-0" />
              <span>Corporate Retreats</span>
              <Leaf size={14} className="text-primary-foreground/40 flex-shrink-0" />
              <span>Team Building</span>
              <Leaf size={14} className="text-primary-foreground/40 flex-shrink-0" />
            </div>
          ))}
        </motion.div>
      </div>

      {/* ═══ WHY CHOOSE US ═══ */}
      <section className="py-16 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="px-8 py-8 flex flex-col items-center text-center group hover:bg-primary/5 transition-colors duration-300 first:pl-0 last:pr-0"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <f.icon size={22} className="text-primary" />
                </div>
                <h4 className="font-serif text-base font-semibold text-foreground mb-1">{f.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HERITAGE / INTRO ═══ */}
      <section className="px-8 lg:px-16 py-24 lg:py-32 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          {/* Image column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl relative z-10">
              <img src={retreatImage} alt="Olive Retreat Gardens" className="w-full h-full object-cover" />
              {/* Floating accent badges */}
              <div className="absolute bottom-6 left-6 z-20 bg-white/95 backdrop-blur rounded-xl px-4 py-3 shadow-lg flex items-center gap-2">
                <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                <span className="text-xs font-semibold text-foreground">KCPA Certified</span>
              </div>
              <div className="absolute top-6 right-6 z-20 bg-primary text-primary-foreground rounded-xl px-4 py-3 shadow-lg">
                <span className="text-xs font-bold tracking-wide">Est. 2005</span>
              </div>
            </div>
            <div className="absolute -top-6 -left-6 w-56 h-56 bg-primary/15 rounded-full -z-10 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-full h-full border-2 border-primary/15 rounded-3xl -z-10" />
          </motion.div>

          {/* Text column */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, delay: 0.15, ease: "easeOut" }}
            className="flex flex-col justify-center"
          >
            <span className="text-primary font-bold tracking-widest uppercase text-xs mb-4 block">Our Heritage</span>
            <h2 className="text-4xl lg:text-5xl text-foreground font-serif leading-tight mb-8">
              A Legacy of Healing<br />& Celebration
            </h2>

            {/* Pull-quote callout */}
            <div className="border-l-4 border-primary pl-5 mb-8 py-1">
              <p className="font-serif text-xl italic text-foreground/80 leading-relaxed">
                "A place where every path leads somewhere worth arriving — and every heart finds what it came for."
              </p>
            </div>

            <div className="space-y-5 text-base text-muted-foreground leading-relaxed">
              <p>
                Founded by <strong className="text-foreground">Rev. Prof. Gitonga and Dr. Monica Gitonga</strong>, Olive Retreat Gardens is more than a beautiful venue — it is a sanctuary designed for restoration in the serene Meru highlands.
              </p>
              <p>
                We are the proud home of the <strong className="text-foreground">Olive Counselling & Training Center (OCTC)</strong>, registered by the Kenya Counselling and Psychological Association (KCPA). Our team of doctors and social workers provides professional mental health and rehabilitation support.
              </p>
            </div>

            <div className="mt-10">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full font-medium text-sm transition-all duration-300"
              >
                Learn More About Us <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section className="px-8 lg:px-16 py-24 lg:py-32 bg-secondary/25">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-bold tracking-widest uppercase text-xs mb-3 block">What We Offer</span>
            <h2 className="text-4xl md:text-5xl font-serif mb-5 text-foreground">Services & Spaces</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">
              A harmonious blend of professional psychological services and breathtaking event venues.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-7">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="group"
              >
                <Card className="h-full overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-500 bg-card">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-colors duration-500 z-10" />
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4 z-20 bg-background/90 backdrop-blur-sm p-3 rounded-full text-primary shadow-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <service.icon size={20} />
                    </div>
                  </div>
                  <CardContent className="p-7">
                    <h3 className="text-xl font-serif text-foreground mb-3">{service.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-5">{service.description}</p>
                    <Link
                      to={service.link}
                      className="inline-flex items-center text-primary text-sm font-semibold hover:gap-2 gap-1 transition-all duration-200"
                    >
                      Discover More <ChevronRight className="w-4 h-4" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ GALLERY GRID ═══ */}
      <section className="px-8 lg:px-16 py-24 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
          >
            <div>
              <span className="text-primary font-bold tracking-widest uppercase text-xs mb-3 block">Our Spaces</span>
              <h2 className="text-4xl md:text-5xl font-serif text-foreground">Moments Captured</h2>
            </div>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4 self-start md:self-auto"
            >
              View Full Gallery <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryItems.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className={`group relative overflow-hidden rounded-2xl bg-secondary ${
                  i === 0 ? "md:col-span-2 md:row-span-2 aspect-square" : "aspect-[4/3]"
                }`}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500 z-10" />
                <img
                  src={img}
                  alt={`Gallery ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW TO BOOK ═══ */}
      <section className="px-8 lg:px-16 py-24 bg-secondary/25">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-bold tracking-widest uppercase text-xs mb-3 block">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-serif text-foreground">How to Book</h2>
          </motion.div>

          <div className="relative grid md:grid-cols-3 gap-10">
            {/* Connector line on desktop */}
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-border z-0" />

            {processSteps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.18 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center mb-6 shadow-md">
                  <step.icon size={28} className="text-primary" />
                </div>
                <span className="text-4xl font-serif text-primary/20 font-bold absolute -top-3 left-1/2 -translate-x-1/2 select-none">{step.number}</span>
                <h3 className="font-serif text-xl text-foreground mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-14"
          >
            <Link
              to="/availability"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Check Availability <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-20 bg-foreground">
        <div className="grid grid-cols-2 md:grid-cols-4 max-w-6xl mx-auto px-8 lg:px-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.88 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center justify-center py-10 border-r border-white/10 last:border-r-0 text-center"
            >
              <span className="font-serif text-5xl md:text-6xl text-primary mb-2">{stat.value}</span>
              <span className="text-xs md:text-sm font-medium tracking-widest uppercase text-white/60">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="px-8 lg:px-16 py-24 lg:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <div className="flex justify-center gap-1 mb-5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="text-primary fill-primary" />
              ))}
            </div>
            <h2 className="text-4xl md:text-5xl font-serif text-foreground">What People Say</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-7">
            {testimonials.map((t, i) => (
              <motion.blockquote
                key={i}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.65, delay: i * 0.15 }}
                className={`relative flex flex-col p-8 rounded-3xl border border-border shadow-sm ${
                  i === 1 ? "bg-primary text-primary-foreground md:-translate-y-4 md:shadow-xl" : "bg-card"
                }`}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(t.stars)].map((_, si) => (
                    <Star
                      key={si}
                      size={14}
                      className={i === 1 ? "text-white fill-white" : "text-primary fill-primary"}
                    />
                  ))}
                </div>

                <div className={`text-5xl font-serif leading-none mb-3 ${i === 1 ? "text-white/20" : "text-primary/15"}`}>"</div>

                <p className={`font-serif text-base italic leading-relaxed flex-1 mb-7 ${
                  i === 1 ? "text-primary-foreground/90" : "text-foreground/85"
                }`}>
                  {t.quote}
                </p>

                <footer className={`flex flex-col border-t pt-4 ${
                  i === 1 ? "border-white/20" : "border-border"
                }`}>
                  <strong className={`text-sm font-semibold ${i === 1 ? "text-white" : "text-foreground"}`}>{t.author}</strong>
                  <span className={`text-xs mt-0.5 font-medium ${i === 1 ? "text-primary-foreground/60" : "text-primary"}`}>{t.event}</span>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BAND ═══ */}
      <section className="relative py-32 overflow-hidden bg-foreground text-center">
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:28px_28px]" />
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-0"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px] -z-0"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl mx-auto px-8"
        >
          <h2 className="text-5xl md:text-6xl font-serif text-white mb-6 leading-tight">
            Ready to Find<br />Your Peace?
          </h2>
          <p className="text-lg font-light text-white/75 mb-10 max-w-xl mx-auto leading-relaxed">
            Whether it's a wedding, corporate retreat, or a counselling session — we're here to make it extraordinary.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              to="/book"
              className="group px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              Book a Venue
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 bg-transparent border border-white/25 text-white rounded-full font-medium hover:bg-white/10 transition-all duration-300"
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-8 lg:px-16 pt-16 pb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Leaf size={16} className="text-primary" />
                <h3 className="font-serif text-lg font-semibold text-foreground">Olive Retreat Gardens</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Home of OCTC. A sanctuary for healing, learning, and celebration in the heart of Meru.
              </p>
              {/* Social Icons */}
              <div className="flex gap-3">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Instagram, label: "Instagram" },
                  { icon: Twitter, label: "Twitter" },
                ].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-5">Contact</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <MapPin size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Along Meru–Nanyuki Highway, Meru, Kenya</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone size={14} className="text-primary flex-shrink-0" />
                  <a href="tel:+254700000000" className="hover:text-primary transition-colors">+254 700 000 000</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail size={14} className="text-primary flex-shrink-0" />
                  <a href="mailto:info@oliveretreat.co.ke" className="hover:text-primary transition-colors">info@oliveretreat.co.ke</a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-5">Quick Links</h4>
              <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                {[
                  { label: "Services & Packages", to: "/services" },
                  { label: "Gallery", to: "/gallery" },
                  { label: "Check Availability", to: "/availability" },
                  { label: "Book a Venue", to: "/book" },
                  { label: "Contact OCTC", to: "/contact" },
                ].map((l) => (
                  <Link key={l.to} to={l.to} className="hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <ChevronRight size={12} className="text-primary/40 group-hover:text-primary transition-colors" />
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-5">Stay Connected</h4>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Get updates on upcoming events and availability right to your inbox.
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); setEmail(""); }}
                className="flex flex-col gap-2"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full px-4 py-2.5 text-sm rounded-full border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} Olive Retreat Gardens & OCTC. All rights reserved.</span>
            <span className="italic text-muted-foreground/60">A sanctuary where every path leads somewhere worth arriving.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
