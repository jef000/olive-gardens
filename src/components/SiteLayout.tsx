import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Gallery", path: "/gallery" },
  { label: "Contact", path: "/contact" },
];

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Fixed Book Now CTA - top right */}
      <div className="fixed top-4 right-4 z-50">
        <Link to="/book" className="cta-primary shadow-lg">
          Book Now
        </Link>
      </div>

      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <Link to="/" className="font-heading text-xl font-semibold text-foreground">
          Olive Retreat
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-foreground p-2 mr-24"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-background/98 backdrop-blur-sm pt-20 px-8">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`nav-link text-2xl ${
                  location.pathname === item.path ? "nav-link-active" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop vertical navigation — book table of contents style */}
      <aside className="hidden lg:flex flex-col justify-between w-64 xl:w-72 border-r border-border bg-background fixed top-0 left-0 h-screen px-8 py-10">
        <div>
          <Link to="/" className="block mb-12">
            <h2 className="font-heading text-2xl font-semibold text-foreground leading-tight">
              Olive Retreat
            </h2>
            <p className="font-heading text-sm italic text-muted-foreground mt-1">
              Gardens · Meru
            </p>
          </Link>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ? "nav-link-active" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="text-xs text-muted-foreground font-body">
          <p>Meru, Kenya</p>
          <p className="mt-1">+254 700 000 000</p>
          <p className="mt-1">info@oliveretreat.co.ke</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 xl:ml-72">
        {children}
      </main>
    </div>
  );
}
