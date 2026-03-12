import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

const spaces = [
  { id: "main-arena", name: "Main Arena", capacity: 500 },
  { id: "garden-hall", name: "Garden Hall", capacity: 120 },
  { id: "therapy-room", name: "Therapy Room", capacity: 6 },
];

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const prefilledSpace = searchParams.get("space") || "";
  const prefilledDate = searchParams.get("date") || "";

  const hasPreselection = prefilledSpace && prefilledDate && spaces.some(s => s.id === prefilledSpace);

  const [step, setStep] = useState(hasPreselection ? 2 : 1);
  const [selectedSpace, setSelectedSpace] = useState(hasPreselection ? prefilledSpace : "");
  const [selectedDate, setSelectedDate] = useState(prefilledDate);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    headcount: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  return (
    <div>
      {/* Header */}
      <section className="px-8 lg:px-16 py-20 lg:py-28 max-w-5xl">
        <h1 className="section-heading mb-6">Book a Space</h1>
        <div className="w-16 h-px bg-primary mb-8" />
        <p className="section-subheading">
          Choose your venue, pick your date, and let us handle the rest.
        </p>
      </section>

      {/* Progress */}
      <section className="px-8 lg:px-16 pb-8">
        <div className="flex items-center gap-4 max-w-md">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-body text-sm ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              <span className="font-body text-xs uppercase tracking-wide text-muted-foreground hidden sm:block">
                {s === 1 ? "Select" : s === 2 ? "Details" : "Confirm"}
              </span>
              {s < 3 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>
      </section>

      <section className="px-8 lg:px-16 pb-20">
        <div className="max-w-3xl">
          {step === 1 && (
            <div className="space-y-8">
              {/* Space selection */}
              <div>
                <h3 className="font-heading text-lg font-semibold mb-4">Choose a space</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {spaces.map((space) => (
                    <button
                      key={space.id}
                      onClick={() => setSelectedSpace(space.id)}
                      className={`p-4 rounded-sm border text-left transition-colors ${
                        selectedSpace === space.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <h4 className="font-heading text-base font-semibold">{space.name}</h4>
                      <p className="font-body text-xs text-muted-foreground mt-1">
                        Up to {space.capacity} guests
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date selection */}
              <div>
                <h3 className="font-heading text-lg font-semibold mb-4">Preferred date</h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-3 bg-background border border-border rounded-sm font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <button
                onClick={() => selectedSpace && selectedDate && setStep(2)}
                disabled={!selectedSpace || !selectedDate}
                className="cta-primary disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="font-heading text-lg font-semibold mb-2">Your details</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="font-body text-sm font-medium block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium block mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium block mb-1.5">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium block mb-1.5">Expected Headcount</label>
                  <input
                    type="number"
                    required
                    value={formData.headcount}
                    onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="font-body text-sm font-medium block mb-1.5">Special Requests (optional)</label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(1)} className="cta-outline">
                  Back
                </button>
                <button type="submit" className="cta-primary">
                  Submit Booking
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="bg-accent/10 border border-accent/30 rounded-sm p-8 max-w-lg">
              <h3 className="font-heading text-2xl font-semibold text-accent mb-3">Booking Submitted!</h3>
              <p className="font-body text-sm text-muted-foreground mb-4">
                Thank you, {formData.name}. We've received your booking request for{" "}
                <strong className="text-foreground">{spaces.find((s) => s.id === selectedSpace)?.name}</strong> on{" "}
                <strong className="text-foreground">{new Date(selectedDate).toLocaleDateString("en-KE", { dateStyle: "long" })}</strong>.
              </p>
              <p className="font-body text-sm text-muted-foreground mb-6">
                We'll confirm availability and send payment details to <strong className="text-foreground">{formData.email}</strong> within 24 hours.
              </p>
              <Link to="/" className="cta-outline">
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BookingPage;
