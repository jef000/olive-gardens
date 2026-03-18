import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-garden.jpg";
import weddingImage from "@/assets/gallery-wedding.jpg";
import retreatImage from "@/assets/gallery-retreat.jpg";
import diningImage from "@/assets/gallery-dining.jpg";
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
  price: string;
  image: string;
  subSpaces: SubSpace[];
}

const packages = [
  {
    category: "Venue Hire",
    items: [
      {
        id: "main-arena",
        title: "Main Arena",
        capacity: "Up to 500 guests",
        description: "Our signature open-air canopied arena, set among olive trees with panoramic mountain views. Ideal for weddings, conferences, and large celebrations.",
        includes: ["Setup & teardown", "Basic sound system", "Parking for 100 vehicles", "Security"],
        price: "From KES 150,000",
        image: weddingImage,
        subSpaces: [],
      },
      {
        id: "garden-hall",
        title: "Gardens",
        capacity: "Multiple outdoor spaces",
        description: "Our gardens include curated spaces for prayer, picnics, intimate gatherings, and overnight outdoor experiences.",
        includes: [
          "Garden of Eden (Up to 150 guests)",
          "Mount Sinai Prayer Area (Up to 80 guests)",
          "Picnic Grounds (Up to 100 guests)",
          "Camping Grounds (Up to 60 guests)",
        ],
        price: "",
        image: retreatImage,
        subSpaces: [
          {
            title: "Garden of Eden",
            capacity: "Up to 150 guests",
            description: "A lush tropical paradise with flowering paths, stone pathways, and a gentle water feature. Ideal for intimate weddings, photo shoots, and garden parties. The dappled light here is unforgettable.",
            image: heroImage,
          },
          {
            title: "Mount Sinai Prayer Area",
            capacity: "Up to 80 guests",
            description: "A hilltop space designed for reflection, prayer, and spiritual gatherings. Stone seating circles overlook misty valleys and olive groves. Perfect for religious retreats and meditation groups.",
            image: retreatImage,
          },
          {
            title: "Picnic Grounds",
            capacity: "Up to 100 guests",
            description: "Rolling lawns shaded by ancient olive trees, set up with blankets and baskets. Ideal for family reunions, school trips, birthday celebrations, and casual team outings.",
            image: diningImage,
          },
          {
            title: "Camping Grounds",
            capacity: "Up to 60 guests",
            description: "Safari-style tents and a campfire circle under the stars. Our camping grounds offer a unique overnight experience with highland air, stargazing, and morning birdsong.",
            image: weddingImage,
          },
        ],
      },
    ],
  },
  {
    category: "Counselling & Training",
    items: [
      {
        id: "therapy-room",
        title: "Individual Counselling",
        capacity: "1-on-1 sessions",
        description: "Professional counselling with certified therapists in a private, serene setting. Confidential intake and secure record keeping.",
        includes: ["50-minute sessions", "Private therapy room", "Intake assessment", "Follow-up notes"],
        price: "KES 5,000 per session",
        image: retreatImage,
        subSpaces: [],
      },
      {
        id: "garden-hall",
        title: "Group Workshops",
        capacity: "10–30 participants",
        description: "Facilitated workshops on leadership, wellness, conflict resolution, and personal development. Multi-day retreats available.",
        includes: ["Facilitator", "Materials", "Tea breaks", "Certificate of attendance"],
        price: "From KES 3,000 per person",
        image: diningImage,
        subSpaces: [],
      },
    ],
  },
  {
    category: "Catering",
    items: [
      {
        id: "main-arena",
        title: "Full Catering Package",
        capacity: "50–500 guests",
        description: "Farm-to-table dining with locally sourced ingredients. Menus customized to your event — from elegant plated dinners to buffet-style celebrations.",
        includes: ["Menu consultation", "Service staff", "Table settings", "Cleanup"],
        price: "From KES 2,500 per person",
        image: diningImage,
        subSpaces: [],
      },
    ],
  },
];

const Services = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

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
                  className="group bg-white rounded-3xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full cursor-pointer"
                  onClick={() => setSelectedService(item)}
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
                            <div className="text-xs font-medium text-primary mb-3 flex items-center gap-1">
                              {space.capacity}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {space.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-6 border-t border-border/50">
                  <button 
                    onClick={() => {
                      setSelectedService(null);
                      navigate(`/book?space=${selectedService.id}`);
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
