import { useState } from "react";
import { Link } from "react-router-dom";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      {/* Header */}
      <section className="px-8 lg:px-16 py-20 lg:py-28 max-w-5xl">
        <h1 className="section-heading mb-6">Get in Touch</h1>
        <div className="w-16 h-px bg-primary mb-8" />
        <p className="section-subheading">
          We'd love to hear from you. Whether you're planning an event, seeking counselling, or simply curious — reach out.
        </p>
      </section>

      <section className="px-8 lg:px-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 max-w-5xl">
          {/* Contact form */}
          <div>
            {submitted ? (
              <div className="bg-accent/10 border border-accent/30 rounded-sm p-8">
                <h3 className="font-heading text-xl font-semibold text-accent mb-2">Message sent</h3>
                <p className="font-body text-sm text-muted-foreground">
                  Thank you for reaching out. We'll respond within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="font-body text-sm font-medium block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium block mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium block mb-1.5">Phone (optional)</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                    placeholder="+254 700 000 000"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium block mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow resize-none"
                    placeholder="Tell us about your event, inquiry, or how we can help…"
                  />
                </div>
                <button type="submit" className="cta-primary">
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Contact details */}
          <div className="space-y-8">
            <div>
              <h3 className="font-body text-sm font-semibold uppercase tracking-wide mb-2">Location</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                Olive Retreat Gardens<br />
                Along the Meru–Nanyuki Highway<br />
                Meru County, Kenya
              </p>
            </div>
            <div>
              <h3 className="font-body text-sm font-semibold uppercase tracking-wide mb-2">Phone & WhatsApp</h3>
              <p className="font-body text-sm text-muted-foreground">+254 700 000 000</p>
            </div>
            <div>
              <h3 className="font-body text-sm font-semibold uppercase tracking-wide mb-2">Email</h3>
              <p className="font-body text-sm text-muted-foreground">info@oliveretreat.co.ke</p>
            </div>
            <div>
              <h3 className="font-body text-sm font-semibold uppercase tracking-wide mb-2">Office Hours</h3>
              <p className="font-body text-sm text-muted-foreground">
                Monday – Saturday: 8:00 AM – 6:00 PM<br />
                Sunday: By appointment
              </p>
            </div>
            <div>
              <a
                href="https://wa.me/254700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-outline inline-block"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
