import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import { SITE_CONTACT } from "@/lib/siteInfo";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await api.post("/inquiries/public", {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });
      setSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err: unknown) {
      const errorMsg = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(errorMsg || "Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
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
                {error && (
                  <div role="alert" className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
                    {error}
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="contact-first-name" className="text-sm font-medium uppercase tracking-widest text-muted-foreground">First Name</label>
                    <input
                      id="contact-first-name"
                      type="text"
                      required
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                      placeholder="Jane"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-last-name" className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Last Name</label>
                    <input
                      id="contact-last-name"
                      type="text"
                      required
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact-email" className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact-phone" className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Phone Number (Optional)</label>
                  <input
                    id="contact-phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                    placeholder={SITE_CONTACT.phoneDisplay}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact-message" className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Your Message</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none"
                    placeholder="Tell us about your event, preferred dates, or specific requirements..."
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-black text-white rounded-full font-medium hover:bg-primary transition-colors duration-300 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
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
                    {SITE_CONTACT.addressLines.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                    {SITE_CONTACT.postal}
                  </p>
                </div>
              </div>

              {/* Map with the facility pin */}
              <div className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
                <iframe
                  title="Google map showing the location of Olive Retreat Gardens, Meru"
                  src={SITE_CONTACT.mapsEmbedUrl}
                  className="h-64 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 px-4 py-3">
                  <span className="text-xs text-muted-foreground">{SITE_CONTACT.addressLines[0]}</span>
                  <a
                    href={SITE_CONTACT.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Open in Google Maps <ExternalLink size={13} />
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-olive-cream flex items-center justify-center text-primary shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">Phone & WhatsApp</h3>
                  <p className="text-lg text-foreground">{SITE_CONTACT.phoneDisplay}</p>
                  <p className="text-base text-muted-foreground">{SITE_CONTACT.phoneAltDisplay}</p>
                  <a
                    href={SITE_CONTACT.whatsappUrl}
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
                  <p className="text-lg text-foreground">{SITE_CONTACT.email}</p>
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
