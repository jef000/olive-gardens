// Mock availability data — replace with API calls when backend is ready

export interface VenueSpace {
  id: string;
  name: string;
  capacity: number;
  description: string;
}

export const venueSpaces: VenueSpace[] = [
  { id: "main-arena", name: "Main Arena", capacity: 500, description: "Grand open-air venue for weddings & large events" },
  { id: "garden-hall", name: "Garden Hall", capacity: 120, description: "Intimate indoor hall surrounded by olive groves" },
  { id: "therapy-room", name: "Therapy Room", capacity: 6, description: "Private space for counselling & small sessions" },
];

export type BookingStatus = "booked" | "tentative";

export interface BookedSlot {
  date: string; // YYYY-MM-DD
  spaceId: string;
  status: BookingStatus;
  label?: string;
}

// Generate some mock bookings for the next 3 months
function generateMockBookings(): BookedSlot[] {
  const bookings: BookedSlot[] = [];
  const now = new Date();

  const addBooking = (daysFromNow: number, spaceId: string, status: BookingStatus, label?: string) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysFromNow);
    bookings.push({
      date: d.toISOString().split("T")[0],
      spaceId,
      status,
      label,
    });
  };

  // Main Arena bookings
  addBooking(3, "main-arena", "booked", "Njiru Wedding");
  addBooking(4, "main-arena", "booked", "Njiru Wedding");
  addBooking(10, "main-arena", "tentative", "Corporate Event");
  addBooking(11, "main-arena", "tentative", "Corporate Event");
  addBooking(18, "main-arena", "booked", "Community Gathering");
  addBooking(25, "main-arena", "booked", "Mwangi Celebration");
  addBooking(26, "main-arena", "booked", "Mwangi Celebration");
  addBooking(40, "main-arena", "tentative", "Retreat Booking");
  addBooking(55, "main-arena", "booked", "Annual Gala");
  addBooking(56, "main-arena", "booked", "Annual Gala");

  // Garden Hall bookings
  addBooking(2, "garden-hall", "booked", "Training Workshop");
  addBooking(7, "garden-hall", "booked", "Birthday Party");
  addBooking(14, "garden-hall", "tentative", "Team Retreat");
  addBooking(15, "garden-hall", "tentative", "Team Retreat");
  addBooking(22, "garden-hall", "booked", "Engagement Party");
  addBooking(35, "garden-hall", "booked", "Leadership Summit");
  addBooking(36, "garden-hall", "booked", "Leadership Summit");
  addBooking(50, "garden-hall", "tentative", "Private Dinner");

  // Therapy Room bookings
  addBooking(1, "therapy-room", "booked", "Session");
  addBooking(3, "therapy-room", "booked", "Session");
  addBooking(5, "therapy-room", "booked", "Session");
  addBooking(8, "therapy-room", "booked", "Group Session");
  addBooking(10, "therapy-room", "tentative", "Intake");
  addBooking(12, "therapy-room", "booked", "Session");
  addBooking(15, "therapy-room", "booked", "Session");
  addBooking(19, "therapy-room", "booked", "Session");
  addBooking(22, "therapy-room", "tentative", "Workshop");
  addBooking(26, "therapy-room", "booked", "Session");
  addBooking(30, "therapy-room", "booked", "Session");
  addBooking(45, "therapy-room", "booked", "Session");

  return bookings;
}

export const mockBookings = generateMockBookings();

export function getBookingsForSpace(spaceId: string): BookedSlot[] {
  return mockBookings.filter((b) => b.spaceId === spaceId);
}

export function getBookingForDate(spaceId: string, date: string): BookedSlot | undefined {
  return mockBookings.find((b) => b.spaceId === spaceId && b.date === date);
}
