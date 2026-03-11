import { Link } from "react-router-dom";
import weddingImage from "@/assets/gallery-wedding.jpg";
import retreatImage from "@/assets/gallery-retreat.jpg";
import diningImage from "@/assets/gallery-dining.jpg";

const packages = [
  {
    category: "Venue Hire",
    items: [
      {
        title: "Main Arena",
        capacity: "Up to 500 guests",
        description: "Our signature open-air canopied arena, set among olive trees with panoramic mountain views. Ideal for weddings, conferences, and large celebrations.",
        includes: ["Setup & teardown", "Basic sound system", "Parking for 100 vehicles", "Security"],
        price: "From KES 150,000",
        image: weddingImage,
      },
      {
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
        title: "Individual Counselling",
        capacity: "1-on-1 sessions",
        description: "Professional counselling with certified therapists in a private, serene setting. Confidential intake and secure record keeping.",
        includes: ["50-minute sessions", "Private therapy room", "Intake assessment", "Follow-up notes"],
        price: "KES 5,000 per session",
        image: retreatImage,
      },
      {
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
  return (
    <div>
      {/* Header */}
      <section className="px-8 lg:px-16 py-20 lg:py-28 max-w-5xl">
        <h1 className="section-heading mb-6">Services & Packages</h1>
        <div className="w-16 h-px bg-primary mb-8" />
        <p className="section-subheading">
          From grand weddings to restorative counselling — our spaces and services are designed to meet you where you are.
        </p>
      </section>

      {/* Packages */}
      {packages.map((category) => (
        <section key={category.category} className="px-8 lg:px-16 py-12">
          <h2 className="font-heading text-2xl font-semibold mb-8 pb-3 border-b border-border max-w-5xl">
            {category.category}
          </h2>
          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl">
            {category.items.map((item) => (
              <div key={item.title} className="card-garden">
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-heading text-xl font-semibold">{item.title}</h3>
                    <span className="font-body text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                      {item.capacity}
                    </span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">
                    {item.description}
                  </p>
                  <div className="mb-4">
                    <h4 className="font-body text-xs uppercase tracking-wide font-semibold mb-2">Includes</h4>
                    <ul className="grid grid-cols-2 gap-1">
                      {item.includes.map((inc) => (
                        <li key={inc} className="font-body text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                          {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="font-heading text-lg font-semibold text-primary">{item.price}</span>
                    <Link to="/book" className="font-body text-sm text-primary hover:text-foreground transition-colors uppercase tracking-wide">
                      Book →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="px-8 lg:px-16 py-16 mt-8 bg-olive-cream">
        <div className="max-w-3xl">
          <h2 className="font-heading text-2xl font-semibold mb-4">Need a custom package?</h2>
          <p className="section-subheading mb-6">
            We're happy to create bespoke arrangements for your event. Reach out and let's plan something beautiful together.
          </p>
          <Link to="/contact" className="cta-outline">
            Get in touch
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Services;
