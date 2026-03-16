import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
              Connect With Us
            </motion.span>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-serif font-light mb-8">
              Start a <span className="italic text-primary/80">Conversation</span>
            </motion.h1>
            <motion.div variants={fadeIn} className="w-24 h-px bg-primary mx-auto mb-10" />
            <motion.p variants={fadeIn} className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
              We'd love to hear from you. Whether you're planning an event, seeking counselling, or simply curious — reach out.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="px-8 lg:px-16 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 max-w-7xl mx-auto items-start">
          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-white p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50"
          >
            {submitted ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send size={32} />
                </div>
                <h3 className="text-3xl font-serif mb-4">Message Received</h3>
                <p className="text-muted-foreground text-lg">
                  Thank you for reaching out to Olive Retreat Gardens. We will respond to your inquiry within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-3xl font-serif mb-8">Send an Inquiry</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">First Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                      placeholder="Jane"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Last Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                    placeholder="+254 700 000 000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Your Message</label>
                  <textarea
                    required
                    rows={6}
                    className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none"
                    placeholder="Tell us about your event, preferred dates, or specific requirements..."
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-4 bg-black text-white rounded-full font-medium hover:bg-primary transition-colors duration-300 flex items-center justify-center gap-2 mt-4"
                >
                  Send Message
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-12 lg:pl-12"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-serif mb-6">Contact Information</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-10">
                Prefer to speak with us directly? You can reach our team via phone, email, or visit our grounds during office hours.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-olive-cream flex items-center justify-center text-primary shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">Location</h3>
                  <p className="text-lg text-foreground leading-relaxed">
                    Olive Retreat Gardens<br />
                    Along the Meru–Nanyuki Highway<br />
                    Meru County, Kenya
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-olive-cream flex items-center justify-center text-primary shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">Phone & WhatsApp</h3>
                  <p className="text-lg text-foreground">+254 700 000 000</p>
                  <a
                    href="https://wa.me/254700000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Chat on WhatsApp →
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-olive-cream flex items-center justify-center text-primary shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">Email</h3>
                  <p className="text-lg text-foreground">info@oliveretreat.co.ke</p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-olive-cream flex items-center justify-center text-primary shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">Office Hours</h3>
                  <p className="text-lg text-foreground leading-relaxed">
                    Monday – Saturday: 8:00 AM – 6:00 PM<br />
                    Sunday: By appointment
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
