import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { venueSpaces, getBookingsForSpace, getBookingForDate, type BookedSlot } from "@/data/mockAvailability";
import { format } from "date-fns";
import { CalendarIcon, Users, Info } from "lucide-react";

export function AvailabilityCalendar() {
  const [selectedSpaceId, setSelectedSpaceId] = useState(venueSpaces[0].id);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const spaceBookings = useMemo(() => getBookingsForSpace(selectedSpaceId), [selectedSpaceId]);

  const bookedDates = useMemo(() => {
    return spaceBookings
      .filter((b) => b.status === "booked")
      .map((b) => new Date(b.date + "T00:00:00"));
  }, [spaceBookings]);

  const tentativeDates = useMemo(() => {
    return spaceBookings
      .filter((b) => b.status === "tentative")
      .map((b) => new Date(b.date + "T00:00:00"));
  }, [spaceBookings]);

  const selectedSpace = venueSpaces.find((s) => s.id === selectedSpaceId)!;

  const selectedDateStr = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null;

  const selectedBooking: BookedSlot | undefined = selectedDateStr
    ? getBookingForDate(selectedSpaceId, selectedDateStr)
    : undefined;

  return (
    <div className="space-y-8">
      {/* Space selector tabs */}
      <div className="flex flex-wrap gap-3">
        {venueSpaces.map((space) => (
          <button
            key={space.id}
            onClick={() => {
              setSelectedSpaceId(space.id);
              setSelectedDate(undefined);
            }}
            className={cn(
              "px-5 py-3 rounded-sm border text-left transition-all duration-300",
              selectedSpaceId === space.id
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border hover:border-primary/40 hover:bg-muted/50"
            )}
          >
            <span className="font-heading text-sm font-semibold block">{space.name}</span>
            <span className="font-body text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Users size={12} /> Up to {space.capacity}
            </span>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-[auto_1fr] gap-8">
        {/* Calendar */}
        <div className="card-garden p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className={cn("p-3 pointer-events-auto")}
            fromDate={new Date()}
            modifiers={{
              booked: bookedDates,
              tentative: tentativeDates,
            }}
            modifiersClassNames={{
              booked: "!bg-destructive/20 !text-destructive font-semibold",
              tentative: "!bg-primary/20 !text-primary font-semibold",
            }}
          />

          {/* Legend */}
          <div className="flex flex-wrap gap-4 px-3 pt-2 pb-1 border-t border-border mt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive/30" />
              <span className="font-body text-xs text-muted-foreground">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary/30" />
              <span className="font-body text-xs text-muted-foreground">Tentative</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent/30" />
              <span className="font-body text-xs text-muted-foreground">Available</span>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          {/* Space info */}
          <div className="card-garden p-6">
            <h3 className="font-heading text-xl font-semibold mb-1">{selectedSpace.name}</h3>
            <p className="font-body text-sm text-muted-foreground">{selectedSpace.description}</p>
            <p className="font-body text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Users size={14} /> Capacity: {selectedSpace.capacity} guests
            </p>
          </div>

          {/* Selected date info */}
          {selectedDate && (
            <div className={cn(
              "card-garden p-6 border-l-4",
              selectedBooking?.status === "booked"
                ? "border-l-destructive"
                : selectedBooking?.status === "tentative"
                ? "border-l-primary"
                : "border-l-accent"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon size={16} className="text-muted-foreground" />
                <span className="font-heading text-base font-semibold">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </span>
              </div>

              {selectedBooking ? (
                <div className="space-y-2">
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded text-xs font-body font-medium uppercase tracking-wide",
                    selectedBooking.status === "booked"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-primary/15 text-primary"
                  )}>
                    {selectedBooking.status === "booked" ? "Booked" : "Tentative"}
                  </span>
                  {selectedBooking.label && (
                    <p className="font-body text-sm text-muted-foreground">
                      {selectedBooking.label}
                    </p>
                  )}
                  {selectedBooking.status === "tentative" && (
                    <p className="font-body text-xs text-muted-foreground flex items-center gap-1 mt-2">
                      <Info size={12} />
                      This date has a pending reservation. Contact us for availability.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-body font-medium uppercase tracking-wide bg-accent/15 text-accent">
                    Available
                  </span>
                  <p className="font-body text-sm text-muted-foreground">
                    This date is open for booking at {selectedSpace.name}.
                  </p>
                  <a href="/book" className="cta-primary inline-block text-center">
                    Book This Date
                  </a>
                </div>
              )}
            </div>
          )}

          {!selectedDate && (
            <div className="card-garden p-6 border-l-4 border-l-muted">
              <p className="font-body text-sm text-muted-foreground italic flex items-center gap-2">
                <CalendarIcon size={16} />
                Select a date to check availability
              </p>
            </div>
          )}

          {/* Upcoming bookings summary */}
          <div className="card-garden p-6">
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wide mb-3">
              Upcoming at {selectedSpace.name}
            </h4>
            <div className="space-y-2">
              {spaceBookings.slice(0, 5).map((b, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="font-body text-sm">
                    {format(new Date(b.date + "T00:00:00"), "MMM d")}
                  </span>
                  <span className={cn(
                    "text-xs font-body px-2 py-0.5 rounded",
                    b.status === "booked"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary"
                  )}>
                    {b.status === "booked" ? "Booked" : "Tentative"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
