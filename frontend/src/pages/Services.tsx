import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import heroImage from "@/assets/venue/hero-garden.jpg";
import weddingImage from "@/assets/venue/venue-garden-of-eden.jpg";
import diningImage from "@/assets/venue/venue-lounge.jpg";
import arenaImage from "@/assets/venue/venue-main-arena.jpg";
import chapelImage from "@/assets/venue/venue-chapel-garden.jpg";
import prayerImage from "@/assets/venue/venue-prayer-sign.jpg";
import apiaryImage from "@/assets/venue/venue-apiary.jpg";
import octcBuildingImage from "@/assets/venue/octc-building.jpg";
import { Check, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface SubSpace {
  title: string;
  capacity: string;
  description: string;
  image: string;
}

interface ServiceItem {
  id: string;
  title: string;
  capacity: string;
  description: string;
  includes: string[];
  image: string;
  /** Space id passed to the booking flow (ids are unique per service). */
  bookingSpaceId: string;
  subSpaces: SubSpace[];
}

const packages = [
  {
    category: "Venue Hire",
    items: [
      {
        id: "main-arena",
        title: "Main Arena",
        capacity: "Up to 1,000 guests",
        description: "The largest open ground in the gardens — used for wedding receptions, music video productions and large events, with room for every kind of celebration.",
        includes: ["Outdoor arena ground", "Wedding receptions", "Music video productions", "Large group events"],
        image: arenaImage,
        bookingSpaceId: "main-arena",
        subSpaces: [],
      },
      {
        id: "gardens",
        title: "Gardens",
        capacity: "Multiple outdoor spaces",
        description: "Named garden spaces for prayer, team building, picnics and overnight outdoor experiences — each with its own character.",
        includes: [
          "Garden of Eden (Up to 100 guests)",
          "Mount Sinai Prayer Area (Up to 50 guests)",
          "Chapel Garden (12-seat chapel)",
          "Synergy Garden (Up to 100 guests)",
        ],
        image: heroImage,
        bookingSpaceId: "gardens",
        subSpaces: [
          {
            title: "Garden of Eden",
            capacity: "Up to 100 guests",
            description: "A lush garden with flowering paths and the famous Miracle Tree at its centre. Ideal for couples, family get-togethers, graduation parties and small retreats.",
            image: weddingImage,
          },
          {
            title: "Mount Sinai Prayer Area",
            capacity: "Up to 50 guests",
            description: "Sitting on the highest part of the gardens, Mount Sinai is a peaceful, private space dedicated to prayer — for one person or up to fifty.",
            image: prayerImage,
          },
          {
            title: "Chapel Garden",
            capacity: "12-seat chapel",
            description: "A small, cosy chapel by the indigenous forest and River Ngaciuma, where clergy solemnise and bless weddings and offer services of worship.",
            image: chapelImage,
          },
          {
            title: "Synergy Garden",
            capacity: "Up to 100 guests",
            description: "Built for corporate and institutional team building, with the apiary set within it — a living lesson in working together.",
            image: apiaryImage,
          },
        ],
      },
    ],
  },
  {
    category: "Counselling & Training",
    items: [
      {
        id: "individual-counselling",
        title: "Individual & Family Counselling",
        capacity: "1-on-1, couples & family sessions",
        description: "Professional therapy with certified counsellors and clinical psychologists in private, serene rooms. Confidential intake and secure record keeping.",
        includes: ["One-on-one sessions", "Private therapy rooms", "Couples & family therapy", "Psychometric assessments"],
        image: octcBuildingImage,
        bookingSpaceId: "therapy-room",
        subSpaces: [],
      },
      {
        id: "group-workshops",
        title: "Trainings & Workshops",
        capacity: "10–30 participants",
        description: "Facilitated workshops and trainings for corporate clients, institutions, church groups, government agencies and NGOs — plus internships and supervision for counsellors in training.",
        includes: ["Facilitator", "Materials", "Tea breaks", "Certificate of attendance"],
        image: diningImage,
        bookingSpaceId: "gardens",
        subSpaces: [],
      },
    ],
  },
];

const Services = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});

  // Admin-managed price labels; falls back to "Rates on request" when absent
  // or when the API is unreachable.
  useEffect(() => {
    let cancelled = false;

    api
      .get<{ data?: { prices?: Array<{ service_id: string; price: string }> } }>("/pricing")
      .then((response) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const row of response.data?.data?.prices ?? []) {
          next[row.service_id] = row.price;
        }
        setPrices(next);
      })
      .catch(() => {
        /* Keep "Rates on request" fallback */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <div className="bg-white">
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
              Offerings
            </motion.span>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-serif font-light mb-8">
              Services & <span className="italic text-primary/80">Packages</span>
            </motion.h1>
            <motion.div variants={fadeIn} className="w-24 h-px bg-primary mx-auto mb-10" />
            <motion.p variants={fadeIn} className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
              From grand weddings to restorative counselling — our spaces and services are meticulously designed to meet you where you are.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Packages */}
      <div className="max-w-7xl mx-auto px-8 lg:px-16 py-24">
        {packages.map((category, categoryIndex) => (
          <section key={category.category} className="mb-24 last:mb-0">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-6 mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-light whitespace-nowrap">
                {category.category}
              </h2>
              <div className="h-px bg-border flex-grow" />
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-10">
              {category.items.map((item, i) => (
                <motion.div 
                  key={item.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="group bg-white rounded-3xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedService(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedService(item);
                    }
                  }}
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                      <span className="text-xs font-medium uppercase tracking-widest text-primary">
                        {item.capacity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8 md:p-10 flex flex-col flex-grow">
                    <h3 className="text-2xl font-serif mb-4 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-8 flex-grow">
                      {item.description}
                    </p>
                    
                    <div className="mb-10 bg-olive-cream/50 rounded-2xl p-6">
                      <h4 className="text-sm font-medium uppercase tracking-widest text-foreground mb-4">What's Included</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                        {item.includes.map((inc) => (
                          <li key={inc} className="text-sm text-muted-foreground flex items-start gap-2.5">
                            <Check className="text-primary mt-0.5 shrink-0" size={16} />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
                      <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:underline">
                        View Details <ChevronRight size={16} />
                      </span>
                      {prices[item.id] ? (
                        <span className="text-sm font-semibold text-foreground">{prices[item.id]}</span>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">Rates on request</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="max-w-4xl mx-auto px-8 lg:px-16 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-white mb-6">
              Need a <span className="italic text-white/90">Bespoke</span> Package?
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-12 font-light leading-relaxed max-w-2xl mx-auto">
              We are happy to create customized arrangements tailored perfectly to your unique event. Reach out and let's plan something beautiful together.
            </p>
            <Link 
              to="/contact" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-medium hover:scale-105 transition-transform duration-300 shadow-xl"
            >
              Contact Our Planners <ChevronRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Service Details Modal */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col rounded-3xl [&>button]:hidden">
          {selectedService && (
            <>
              <div className="relative h-64 sm:h-80 shrink-0">
                <img 
                  src={selectedService.image} 
                  alt={selectedService.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="text-sm font-medium uppercase tracking-widest text-white/80 mb-2">
                    {selectedService.capacity}
                  </div>
                  <DialogTitle className="text-3xl md:text-4xl font-serif text-white m-0">
                    {selectedService.title}
                  </DialogTitle>
                </div>
                <button 
                  onClick={() => setSelectedService(null)}
                  aria-label="Close service details"
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white rounded-full transition-colors z-50"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 md:p-10 overflow-y-auto">
                <DialogDescription className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8">
                  {selectedService.description}
                </DialogDescription>

                <div className="mb-10">
                  <h4 className="text-sm font-medium uppercase tracking-widest text-foreground mb-4 border-b border-border/50 pb-2">
                    What's Included
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                    {selectedService.includes.map((inc: string) => (
                      <li key={inc} className="text-sm text-muted-foreground flex items-start gap-2.5">
                        <Check className="text-primary mt-0.5 shrink-0" size={16} />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedService.subSpaces?.length > 0 && (
                  <div className="mb-10">
                    <h4 className="text-sm font-medium uppercase tracking-widest text-foreground mb-6 border-b border-border/50 pb-2">
                      Available Spaces
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-6">
                      {selectedService.subSpaces.map((space: SubSpace, idx: number) => (
                        <div key={idx} className="bg-muted/30 rounded-2xl overflow-hidden border border-border/50">
                          <div className="h-48 overflow-hidden">
                            <img 
                              src={space.image} 
                              alt={space.title} 
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <h5 className="font-serif text-lg text-foreground leading-tight">{space.title}</h5>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-xs font-medium text-primary flex items-center gap-1">
                                {space.capacity}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                              {space.description}
                            </p>
                            <button
                              onClick={() => {
                                setSelectedService(null);
                                navigate(`/book?space=${selectedService.bookingSpaceId}&notes=Interested in ${space.title}`);
                              }}
                              className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                            >
                              Book this space <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 pt-6 border-t border-border/50">
                  <span className="text-sm font-medium text-muted-foreground">
                    {prices[selectedService.id] || "Rates on request"}
                  </span>
                  <button 
                    onClick={() => {
                      setSelectedService(null);
                      navigate(`/book?space=${selectedService.bookingSpaceId}`);
                    }}
                    className="px-8 py-4 bg-black text-white rounded-full text-sm font-medium hover:bg-primary transition-colors duration-300 flex items-center gap-2"
                  >
                    Book {selectedService.title} <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
