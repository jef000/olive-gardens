import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import weddingImage from "@/assets/gallery-wedding.jpg";
import retreatImage from "@/assets/gallery-retreat.jpg";
import diningImage from "@/assets/gallery-dining.jpg";
import { Check, ChevronRight } from "lucide-react";

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
      },
      {
        id: "garden-hall",
        title: "Garden Hall",
        capacity: "Up to 120 guests",
        description: "An intimate indoor-outdoor space with floor-to-ceiling windows overlooking the gardens. Perfect for workshops, retreats, and smaller celebrations.",
        includes: ["Climate control", "Projector & screen", "Wi-Fi", "Tea/coffee station"],
        price: "From KES 50,000",
        image: retreatImage,
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
      },
      {
        id: "garden-hall",
        title: "Group Workshops",
        capacity: "10–30 participants",
        description: "Facilitated workshops on leadership, wellness, conflict resolution, and personal development. Multi-day retreats available.",
        includes: ["Facilitator", "Materials", "Tea breaks", "Certificate of attendance"],
        price: "From KES 3,000 per person",
        image: diningImage,
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
      },
    ],
  },
];

const Services = () => {
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
                  className="group bg-white rounded-3xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full"
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
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border mt-auto">
                      <div className="flex flex-col">
                        <span className="text-sm uppercase tracking-widest text-muted-foreground mb-1">Starting from</span>
                        <span className="text-xl font-serif text-foreground">{item.price}</span>
                      </div>
                      <Link 
                        to={`/book?space=${item.id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-full text-sm font-medium hover:bg-primary transition-colors duration-300"
                      >
                        Book Now <ChevronRight size={16} />
                      </Link>
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
    </div>
  );
};

export default Services;
