import { Link } from "react-router-dom";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";

const AvailabilityPage = () => {
  return (
    <div>
      <section className="px-8 lg:px-16 py-20 lg:py-28 max-w-5xl">
        <h1 className="section-heading mb-6">Check Availability</h1>
        <div className="w-16 h-px bg-primary mb-8" />
        <p className="section-subheading">
          Browse our venue calendar to find open dates. Select a space and click any date to see its status.
        </p>
      </section>

      <section className="px-8 lg:px-16 pb-20">
        <AvailabilityCalendar />
      </section>

      <section className="px-8 lg:px-16 py-12 bg-foreground">
        <div className="max-w-2xl">
          <h2 className="font-heading text-2xl text-primary-foreground font-semibold mb-3">
            Found your date?
          </h2>
          <p className="font-body text-primary-foreground/70 mb-6">
            Secure your booking now — popular dates fill up quickly.
          </p>
          <Link to="/book" className="cta-primary">
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AvailabilityPage;
