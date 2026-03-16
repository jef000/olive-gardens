import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import retreatImage from "@/assets/gallery-retreat.jpg";
import { ChevronRight, Heart, Users, MapPin, Phone } from "lucide-react";

const About = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-8 lg:px-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-olive-cream/30 -z-10" />
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-3xl -z-10" />
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-5xl mx-auto text-center"
        >
          <motion.span variants={fadeIn} className="text-primary font-medium tracking-widest uppercase text-sm mb-6 block">
            Our Heritage
          </motion.span>
          <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-serif font-light mb-8">
            Cultivating <span className="italic text-primary/80">Peace</span> & Connection
          </motion.h1>
          <motion.div variants={fadeIn} className="w-24 h-px bg-primary mx-auto mb-10" />
          <motion.p variants={fadeIn} className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
            Olive Retreat Gardens was born from a shared calling — to create a place where community, healing, and celebration converge in the beauty of nature.
          </motion.p>
        </motion.div>
      </section>

      {/* Image Block */}
      <section className="px-8 lg:px-16 -mt-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="max-w-6xl mx-auto overflow-hidden rounded-3xl shadow-2xl"
        >
          <img
            src={retreatImage}
            alt="Interior of the retreat center — warm wooden furnishings, garden views"
            className="w-full h-[400px] md:h-[600px] object-cover hover:scale-105 transition-transform duration-[2s] ease-out"
          />
        </motion.div>
      </section>

      {/* Mission & Vision */}
      <section className="px-8 lg:px-16 py-24 lg:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Heart size={24} />
                </div>
                <h2 className="text-3xl md:text-4xl font-serif">Our Mission</h2>
              </div>
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  We provide a tranquil, well-managed venue that serves as a sanctuary for life's most meaningful moments — from joyful celebrations to quiet, restorative sessions. 
                </p>
                <p>
                  Rooted in faith, hospitality, and academic excellence, we strive to make every guest feel at home, ensuring their experience is seamless and memorable.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Users size={24} />
                </div>
                <h2 className="text-3xl md:text-4xl font-serif">Holistic Care</h2>
              </div>
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Our counselling and training programs reflect our founders' deep commitment to holistic wellbeing, offering professional guidance in a setting that nurtures both mind and spirit.
                </p>
                <p>
                  Whether you are seeking personal restoration or team building, our grounds provide the perfect canvas for growth and renewal.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="px-8 lg:px-16 py-24 lg:py-32 bg-olive-cream/50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-medium tracking-widest uppercase text-sm mb-4 block">Leadership</span>
            <h2 className="text-4xl md:text-5xl font-serif font-light mb-6">The Founders</h2>
            <div className="w-16 h-px bg-primary mx-auto" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-border"
            >
              <h3 className="text-2xl font-serif font-medium mb-4 text-foreground">Rev. Prof. Gitonga</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                A revered theologian and educator, Rev. Prof. Gitonga has dedicated decades to ministry and community development. His vision for Olive Retreat Gardens blends spiritual purpose with practical hospitality, creating a venue that serves both sacred and social gatherings.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-border"
            >
              <h3 className="text-2xl font-serif font-medium mb-4 text-foreground">Dr. Monica Gitonga</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                An accomplished academic and counselling professional, Dr. Monica brings warmth, structure, and therapeutic expertise to the retreat's programs. Her work ensures that every counselling and training session at Olive Retreat is conducted with the highest professional and ethical standards.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact info / CTA */}
      <section className="px-8 lg:px-16 py-24 lg:py-32 max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="bg-primary text-white rounded-3xl p-10 md:p-16 overflow-hidden relative"
        >
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          
          <div className="relative z-10 grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif font-light mb-6">Plan Your Visit</h2>
              <p className="text-white/80 text-lg mb-10 leading-relaxed max-w-md">
                We invite you to experience the tranquility and beauty of Olive Retreat Gardens firsthand.
              </p>
              
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-black hover:text-white transition-colors duration-300"
              >
                Get in Touch <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-8 border-l border-white/20 pl-8 md:pl-12">
              <div className="flex items-start gap-4">
                <MapPin className="text-white/60 mt-1 shrink-0" size={24} />
                <div>
                  <h4 className="font-medium uppercase tracking-widest text-sm text-white/60 mb-2">Location</h4>
                  <p className="text-lg">
                    Along the Meru–Nanyuki Highway<br />
                    Meru County, Kenya
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Phone className="text-white/60 mt-1 shrink-0" size={24} />
                <div>
                  <h4 className="font-medium uppercase tracking-widest text-sm text-white/60 mb-2">Contact</h4>
                  <p className="text-lg">
                    +254 700 000 000<br />
                    info@oliveretreat.co.ke
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default About;
