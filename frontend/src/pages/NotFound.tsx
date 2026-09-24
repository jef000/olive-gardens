import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { SITE_CONTACT } from "@/lib/siteInfo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="bg-white text-foreground min-h-screen">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex min-h-screen flex-col items-center justify-center px-8 lg:px-16"
      >
        <div className="relative max-w-4xl text-center">
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-br from-primary/40 via-transparent to-secondary/30" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" as const }}
            className="relative rounded-3xl border border-border/40 bg-olive-cream/20 p-10 shadow-2xl"
          >
            <p className="text-sm uppercase tracking-[0.4em] text-primary mb-4">Page missing</p>
            <h1 className="text-6xl md:text-7xl font-serif font-light text-foreground mb-6">404</h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8">
              We couldn’t locate {location.pathname}. Let us guide you back to peace and purpose at Olive Retreat Gardens.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-full bg-black px-8 py-3 text-base font-medium text-white transition hover:bg-primary"
              >
                Return Home
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center rounded-full border border-border px-8 py-3 text-base font-medium text-foreground transition hover:border-foreground"
              >
                View Services
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-10 text-sm text-muted-foreground"
          >
            <p>Need immediate help? Call us at {SITE_CONTACT.phoneDisplay} and we’ll walk you through your next steps.</p>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default NotFound;
