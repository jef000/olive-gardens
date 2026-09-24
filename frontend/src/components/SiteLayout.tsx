import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, Leaf } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";

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
  const [scrolled, setScrolled] = useState(false);

  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // On non-home pages always show solid navbar
  const solid = !isHome || scrolled;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar */}
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-[60] rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only">
        Skip to content
      </a>

      <header
        aria-label="Primary navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          solid
            ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Leaf
              size={18}
              className={`transition-colors duration-500 ${solid ? "text-primary" : "text-white"}`}
            />
            <div className="flex flex-col">
              <span
                className={`font-heading text-base font-semibold leading-tight transition-colors duration-500 ${
                  solid ? "text-foreground" : "text-white"
                }`}
              >
                Olive Retreat
              </span>
              <span
                className={`font-heading text-[10px] italic leading-none transition-colors duration-500 ${
                  solid ? "text-muted-foreground" : "text-white/70"
                }`}
              >
                Gardens · Meru
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-heading text-sm tracking-wide transition-colors duration-300 ${
                  location.pathname === item.path
                    ? solid ? "text-foreground font-semibold" : "text-white font-semibold"
                    : solid ? "text-foreground/65 hover:text-foreground" : "text-white/75 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/book"
              className={`hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                solid
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white/15 backdrop-blur border border-white/30 text-white hover:bg-white/25"
              }`}
            >
              Book Now
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 transition-colors duration-300 ${solid ? "text-foreground" : "text-white"}`}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <div id="mobile-navigation" className="md:hidden border-t border-border bg-background/98 backdrop-blur-md px-6 py-4 shadow-lg">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`nav-link text-base ${
                    location.pathname === item.path ? "nav-link-active" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/book"
                onClick={() => setMobileOpen(false)}
                className="cta-primary text-center mt-3 sm:hidden"
              >
                Book Now
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main content — no top padding on home (hero is full-screen) */}
      <main id="main-content" tabIndex={-1} className={`flex-1 outline-none ${isHome ? "" : "pt-[73px]"}`}>{children}</main>
      <SiteFooter />
    </div>
  );
}
