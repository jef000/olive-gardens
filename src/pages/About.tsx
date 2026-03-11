import { Link } from "react-router-dom";
import retreatImage from "@/assets/gallery-retreat.jpg";

const About = () => {
  return (
    <div>
      {/* Hero */}
      <section className="px-8 lg:px-16 py-20 lg:py-28 max-w-5xl">
        <h1 className="section-heading mb-6">Our Story</h1>
        <div className="w-16 h-px bg-primary mb-8" />
        <p className="font-heading text-xl lg:text-2xl italic text-foreground/80 leading-relaxed max-w-3xl">
          Olive Retreat Gardens was born from a shared calling — to create a place where community, healing, and celebration converge in the beauty of God's creation.
        </p>
      </section>

      {/* Image */}
      <section className="px-8 lg:px-16 pb-8">
        <div className="max-w-5xl overflow-hidden rounded-sm">
          <img
            src={retreatImage}
            alt="Interior of the retreat center — warm wooden furnishings, garden views"
            className="w-full h-64 md:h-96 object-cover"
          />
        </div>
      </section>

      {/* Mission */}
      <section className="px-8 lg:px-16 py-16 max-w-4xl">
        <h2 className="font-heading text-2xl font-semibold mb-6">Our Mission</h2>
        <p className="section-subheading mb-6">
          We provide a tranquil, well-managed venue that serves as a sanctuary for life's most meaningful moments — from joyful celebrations to quiet, restorative sessions. Rooted in faith, hospitality, and academic excellence, we strive to make every guest feel at home.
        </p>
        <p className="section-subheading">
          Our counselling and training programs reflect our founders' deep commitment to holistic wellbeing, offering professional guidance in a setting that nurtures both mind and spirit.
        </p>
      </section>

      {/* Founders */}
      <section className="px-8 lg:px-16 py-16 bg-olive-cream">
        <div className="max-w-4xl">
          <h2 className="font-heading text-2xl font-semibold mb-8">The Founders</h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-heading text-lg font-semibold mb-2">Rev. Prof. Gitonga</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                A revered theologian and educator, Rev. Prof. Gitonga has dedicated decades to ministry and community development. His vision for Olive Retreat Gardens blends spiritual purpose with practical hospitality, creating a venue that serves both sacred and social gatherings.
              </p>
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold mb-2">Dr. Monica Gitonga</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                An accomplished academic and counselling professional, Dr. Monica brings warmth, structure, and therapeutic expertise to the retreat's programs. Her work ensures that every counselling and training session at Olive Retreat is conducted with the highest professional and ethical standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact info */}
      <section className="px-8 lg:px-16 py-16 max-w-4xl">
        <h2 className="font-heading text-2xl font-semibold mb-6">Visit Us</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-body text-sm font-semibold uppercase tracking-wide mb-2">Location</h4>
            <p className="font-body text-sm text-muted-foreground">
              Olive Retreat Gardens<br />
              Along the Meru–Nanyuki Highway<br />
              Meru County, Kenya
            </p>
          </div>
          <div>
            <h4 className="font-body text-sm font-semibold uppercase tracking-wide mb-2">Get in Touch</h4>
            <p className="font-body text-sm text-muted-foreground">
              Phone: +254 700 000 000<br />
              Email: info@oliveretreat.co.ke<br />
              WhatsApp: +254 700 000 000
            </p>
          </div>
        </div>
        <div className="mt-8">
          <Link to="/contact" className="cta-outline">
            Send us a message
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
