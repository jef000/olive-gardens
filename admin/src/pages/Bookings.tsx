import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Filter, Search, MoreHorizontal, Check, X, Clock, Mail, Phone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

interface Booking {
  id: string;
  eventName: string;
  venue: string;
  eventType: string;
  date: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
}

const mockBookings: Booking[] = [
  {
    id: 'BK-1001',
    eventName: 'Njiru Wedding Reception',
    venue: 'Main Arena',
    eventType: 'Wedding',
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    guests: 350,
    status: 'confirmed',
    customer: {
      name: 'Sarah Njiru',
      email: 'sarah.n@example.com',
      phone: '+254 712 345 678'
    },
    amount: 185000,
  },
  {
    id: 'BK-1002',
    eventName: 'Tech Innovators Summit',
    venue: 'Main Arena',
    eventType: 'Corporate',
    date: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString(),
    guests: 450,
    status: 'pending',
    customer: {
      name: 'James Kamau',
      email: 'j.kamau@techcorp.co.ke',
      phone: '+254 722 111 222'
    },
    amount: 250000,
  },
  {
    id: 'BK-1003',
    eventName: 'Leadership Retreat',
    venue: 'Garden Hall',
    eventType: 'Workshop',
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    guests: 45,
    status: 'confirmed',
    customer: {
      name: 'Grace Wambui',
      email: 'grace@leadership.org',
      phone: '+254 733 444 555'
    },
    amount: 65000,
  },
  {
    id: 'BK-1004',
    eventName: 'Individual Counseling',
    venue: 'Therapy Room',
    eventType: 'Session',
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    guests: 2,
    status: 'completed',
    customer: {
      name: 'Private Client',
      email: 'client@private.com',
      phone: '+254 700 123 456'
    },
    amount: 5000,
  },
  {
    id: 'BK-1005',
    eventName: 'Odinga Family Reunion',
    venue: 'Garden Hall',
    eventType: 'Social',
    date: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(),
    guests: 100,
    status: 'cancelled',
    customer: {
      name: 'Peter Odinga',
      email: 'p.odinga@example.com',
      phone: '+254 799 888 777'
    },
    amount: 45000,
  },
];

export default function Bookings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');

  const filteredBookings = mockBookings.filter((booking) => {
    const matchesSearch =
      booking.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesVenue = venueFilter === 'all' || booking.venue.toLowerCase().includes(venueFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesVenue;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={12} /> Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-[#8b9172]/20 text-[#6a7051] border border-[#8b9172]/30">
            <Check size={12} /> Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Check size={12} /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <X size={12} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">
            Unknown
          </span>
        );
    }
  };

  const stats = [
    { label: 'Total Reservations', value: mockBookings.length, color: 'text-gray-900' },
    {
      label: 'Pending Approval',
      value: mockBookings.filter((b) => b.status === 'pending').length,
      color: 'text-amber-600',
    },
    {
      label: 'Confirmed Events',
      value: mockBookings.filter((b) => b.status === 'confirmed').length,
      color: 'text-[#8b9172]',
    },
    {
      label: 'Total Value',
      value: `KES ${(mockBookings.reduce((sum, b) => sum + b.amount, 0) / 1000).toFixed(1)}K`,
      color: 'text-gray-900',
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Reservations</h1>
          <p className="text-gray-600 mt-2 font-light">Manage venue bookings and client requests</p>
        </div>
        <Button className="bg-[#8b9172] hover:bg-[#6a7051] text-white">
          + New Reservation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className={`text-3xl font-bold font-serif mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="font-serif text-xl">All Reservations</CardTitle>
          <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by ID, event name, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Select value={venueFilter} onValueChange={setVenueFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Spaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Spaces</SelectItem>
                  <SelectItem value="arena">Main Arena</SelectItem>
                  <SelectItem value="hall">Garden Hall</SelectItem>
                  <SelectItem value="therapy">Therapy Room</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="w-4 h-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[100px] pl-6">ID</TableHead>
                  <TableHead>Event Details</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date & Space</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                      No reservations found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-gray-50/30 cursor-default">
                      <TableCell className="font-medium text-xs text-gray-500 pl-6">
                        {booking.id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{booking.eventName}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                          {booking.eventType} • {booking.guests} guests
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{booking.customer.name}</div>
                        <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                          <span className="flex items-center gap-1"><Mail size={10} /> {booking.customer.email}</span>
                          <span className="flex items-center gap-1"><Phone size={10} /> {booking.customer.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#8b9172]" />
                          {format(new Date(booking.date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {booking.venue}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900">
                        {formatCurrency(booking.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {getStatusBadge(booking.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Edit reservation</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {booking.status === 'pending' && (
                              <DropdownMenuItem className="text-[#8b9172]">Confirm booking</DropdownMenuItem>
                            )}
                            {booking.status !== 'cancelled' && (
                              <DropdownMenuItem className="text-red-600">Cancel booking</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
