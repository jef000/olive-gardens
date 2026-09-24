import { Link } from "react-router-dom";
import { ArrowUpRight, Leaf, Mail, MapPin, Phone } from "lucide-react";
import { SITE_CONTACT } from "@/lib/siteInfo";

const footerLinks = [
  { label: "About us", path: "/about" },
  { label: "Services & spaces", path: "/services" },
  { label: "Gallery", path: "/gallery" },
  { label: "Availability", path: "/availability" },
];

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:px-8 lg:grid-cols-[1.3fr_0.8fr_1fr] lg:px-16 lg:py-20">
        <div className="max-w-sm">
          <Link to="/" className="mb-5 inline-flex items-center gap-3" aria-label="Olive Retreat Gardens home">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block font-heading text-xl font-semibold leading-tight">Olive Retreat</span>
              <span className="block font-heading text-xs italic text-primary-foreground/60">Gardens · Meru</span>
            </span>
          </Link>
          <p className="text-sm leading-7 text-primary-foreground/65">
            A quiet place for meaningful celebrations, professional care, and time to reconnect with what matters.
          </p>
          <Link
            to="/book"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 hover:bg-primary/90"
          >
            Plan your visit <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div>
          <p className="eyebrow mb-5 text-primary">Explore</p>
          <nav aria-label="Footer navigation" className="grid gap-3">
            {footerLinks.map((link) => (
              <Link key={link.path} to={link.path} className="w-fit text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                {link.label}
              </Link>
            ))}
            <Link to="/contact" className="w-fit text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
              Contact our team
            </Link>
          </nav>
        </div>

        <div>
          <p className="eyebrow mb-5 text-primary">Visit us</p>
          <div className="space-y-4 text-sm leading-6 text-primary-foreground/70">
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 shrink-0 text-primary" size={17} aria-hidden="true" />
              <span>{SITE_CONTACT.addressLines[0]}<br />{SITE_CONTACT.addressLines[1]}<br />{SITE_CONTACT.postal}</span>
            </p>
            <a href={SITE_CONTACT.phoneHref} className="flex items-center gap-3 transition-colors hover:text-primary-foreground">
              <Phone className="shrink-0 text-primary" size={17} aria-hidden="true" />
              <span>{SITE_CONTACT.phoneDisplay}</span>
            </a>
            <a href={`mailto:${SITE_CONTACT.email}`} className="flex items-center gap-3 transition-colors hover:text-primary-foreground">
              <Mail className="shrink-0 text-primary" size={17} aria-hidden="true" />
              <span>{SITE_CONTACT.email}</span>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-primary-foreground/45 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-16">
          <span>© {new Date().getFullYear()} Olive Retreat Gardens. All rights reserved.</span>
          <span>Rooted in hospitality · Growing space for people</span>
        </div>
      </div>
    </footer>
  );
}
