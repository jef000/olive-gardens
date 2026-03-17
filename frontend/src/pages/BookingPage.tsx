import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { Check, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import api from "@/lib/api";

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
  const [selectedSpace, setSelectedSpace] = useState(prefilledSpace || spaces[0].id);
  const [selectedDate, setSelectedDate] = useState(prefilledDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    headcount: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const spaceObj = spaces.find(s => s.id === selectedSpace);
      
      const payload = {
        client_name: formData.name,
        client_email: formData.email,
        client_phone: formData.phone,
        event_name: `${spaceObj?.name} Booking - ${formData.name}`,
        event_type: "Other",
        venue: spaceObj?.name,
        event_date: selectedDate,
        guest_count: parseInt(formData.headcount) || 0,
        total_amount: 0, // This would be calculated or set by admin later
        deposit_amount: 0,
        special_requests: formData.notes
      };

      await api.post('/bookings/public', payload);
      setStep(3);
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit booking request. Please try again.');
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
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 px-8 lg:px-16 overflow-hidden bg-olive-cream/30">
        <div className="absolute top-0 right-0 w-[60%] h-[100%] rounded-full bg-primary/5 blur-3xl -z-10 translate-x-1/3" />
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span variants={fadeIn} className="text-primary font-medium tracking-widest uppercase text-sm mb-6 block">
              Reservation
            </motion.span>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-serif font-light mb-8">
              Book a <span className="italic text-primary/80">Space</span>
            </motion.h1>
            <motion.div variants={fadeIn} className="w-24 h-px bg-primary mx-auto mb-8" />
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light">
              Choose your venue, pick your date, and let us handle the rest.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Progress */}
      <section className="px-8 lg:px-16 py-12 border-b border-border/50 bg-white sticky top-[72px] z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-border -z-10" />
          
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center gap-3 relative z-10 bg-white px-4">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: step >= s ? "#000" : "#fff",
                  borderColor: step >= s ? "#000" : "#e5e7eb",
                  color: step >= s ? "#fff" : "#6b7280",
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm border-2 transition-colors duration-500`}
              >
                {step > s ? <Check size={16} /> : s}
              </motion.div>
              <span className={`text-xs uppercase tracking-widest font-medium ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s === 1 ? "Select Date" : s === 2 ? "Your Details" : "Confirmation"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-8 lg:px-16 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-serif mb-4">Availability & Selection</h3>
                  <p className="text-muted-foreground text-lg">Select your preferred venue and available date from the calendar below.</p>
                </div>
                
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 p-6 md:p-10">
                  <AvailabilityCalendar
                    initialSpaceId={selectedSpace}
                    onSelectBooking={(spaceId, date) => {
                      setSelectedSpace(spaceId);
                      setSelectedDate(date);
                      setStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                onSubmit={handleSubmit} 
                className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 p-8 md:p-12"
              >
                <div className="mb-10 pb-8 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-3xl font-serif mb-2">Guest Details</h3>
                    <p className="text-muted-foreground">Please provide your information to complete the booking request.</p>
                  </div>
                  <div className="bg-olive-cream/50 px-6 py-4 rounded-xl text-right">
                    <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Selected</span>
                    <span className="block font-medium">{spaces.find((s) => s.id === selectedSpace)?.name}</span>
                    <span className="block text-sm text-primary">{new Date(selectedDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}</span>
                  </div>
                </div>

                <div className="space-y-8">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm mb-6 border border-red-200">
                      {error}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                        placeholder="jane@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                        placeholder="+254 700 000 000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Expected Headcount</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={spaces.find((s) => s.id === selectedSpace)?.capacity}
                        value={formData.headcount}
                        onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
                        className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                        placeholder="e.g. 50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Special Requests (Optional)</label>
                    <textarea
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none"
                      placeholder="Any specific setup needs, dietary requirements, or questions..."
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-border/50">
                  <button 
                    type="button" 
                    onClick={() => {
                      setStep(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="w-full sm:w-auto px-6 py-4 rounded-full font-medium hover:bg-muted transition-colors duration-300 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={16} /> Back to Calendar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-10 py-4 bg-black text-white rounded-full font-medium hover:bg-primary transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Submit Booking Request <ChevronRight size={16} />
                      </span>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 p-10 md:p-16 text-center max-w-2xl mx-auto"
              >
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8">
                  <Check size={40} strokeWidth={3} />
                </div>
                
                <h3 className="text-4xl font-serif mb-4">Request Received!</h3>
                
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed mb-10">
                  <p>
                    Thank you, <strong className="text-foreground font-medium">{formData.name}</strong>. We've successfully received your booking request for the{" "}
                    <strong className="text-foreground font-medium">{spaces.find((s) => s.id === selectedSpace)?.name}</strong> on{" "}
                    <strong className="text-foreground font-medium">{new Date(selectedDate).toLocaleDateString("en-KE", { dateStyle: "long" })}</strong>.
                  </p>
                  <p>
                    Our team will review your request, confirm availability, and send detailed payment instructions to <strong className="text-foreground font-medium">{formData.email}</strong> within 24 hours.
                  </p>
                </div>
                
                <Link 
                  to="/" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-primary transition-colors duration-300"
                >
                  Return to Homepage
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default BookingPage;
