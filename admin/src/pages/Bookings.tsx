import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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
import { Calendar, Filter, Search, MoreHorizontal, Check, X, Clock, Mail, Phone, Loader2, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import type { ApiResponse } from '@/types';

export interface Booking {
  id: string;
  booking_reference: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_name: string;
  event_type: 'Wedding' | 'Corporate' | 'Workshop' | 'Session' | 'Conference' | 'Party' | 'Other';
  venue: 'Main Arena' | 'Garden Hall' | 'Therapy Room' | 'Conference Room';
  event_date: string;
  start_time?: string;
  end_time?: string;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  guest_count?: number;
  special_requests?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface BookingStats {
  total_bookings: number;
  total_revenue: number;
  pending_bookings: number;
  confirmed_bookings: number;
  status_breakdown: { status: string; count: string }[];
  venue_breakdown: { venue: string; count: string }[];
  event_type_breakdown: { event_type: string; count: string }[];
  payment_status_breakdown: { payment_status: string; count: string }[];
}

export default function Bookings() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');

  // Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultForm = {
    client_name: '', client_email: '', client_phone: '',
    event_name: '', event_type: 'Wedding', venue: 'Main Arena',
    event_date: '', guest_count: 0, total_amount: 0, deposit_amount: 0
  };
  const [formData, setFormData] = useState<any>(defaultForm);

  const handleCreateClick = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setIsDialogOpen(true);
  };

  const handleEditClick = (booking: Booking) => {
    setEditingId(booking.id);
    setFormData({
      client_name: booking.client_name,
      client_email: booking.client_email,
      client_phone: booking.client_phone || '',
      event_name: booking.event_name,
      event_type: booking.event_type,
      venue: booking.venue,
      event_date: booking.event_date ? format(new Date(booking.event_date), 'yyyy-MM-dd') : '',
      guest_count: booking.guest_count || 0,
      total_amount: booking.total_amount || 0,
      deposit_amount: booking.deposit_amount || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        guest_count: Number(formData.guest_count),
        total_amount: Number(formData.total_amount),
        deposit_amount: Number(formData.deposit_amount),
      };

      if (editingId) {
        await api.put(`/bookings/${editingId}`, payload);
      } else {
        await api.post('/bookings', payload);
      }
      
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'stats'] });
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData(defaultForm);
    } catch (error: any) {
      alert(error.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} booking`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ bookings: Booking[]; total: number }>>('/bookings');
      return response.data.data;
    },
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['bookings', 'stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<BookingStats>>('/bookings/stats/summary');
      return response.data.data;
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/bookings/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'stats'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update booking status');
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bookings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'stats'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete booking');
    }
  });

  const normalizedBookings = Array.isArray(bookingsData?.bookings) ? bookingsData.bookings : [];

  const filteredBookings = normalizedBookings.filter((booking) => {
    const matchesSearch =
      booking.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase());
      
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
    { label: 'Total Reservations', value: statsData?.total_bookings || 0, color: 'text-gray-900' },
    {
      label: 'Pending Approval',
      value: statsData?.pending_bookings || 0,
      color: 'text-amber-600',
    },
    {
      label: 'Confirmed Events',
      value: statsData?.confirmed_bookings || 0,
      color: 'text-[#8b9172]',
    },
    {
      label: 'Total Value',
      value: `KES ${((statsData?.total_revenue || 0) / 1000).toFixed(1)}K`,
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
        <Button onClick={handleCreateClick} className="bg-[#8b9172] hover:bg-[#6a7051] text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Reservation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className={`text-3xl font-bold font-serif mb-1 ${stat.color}`}>{
                isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : stat.value
              }</div>
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
          {isLoadingBookings ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#8b9172] mb-4" />
              <p className="text-gray-500 font-light">Loading reservations...</p>
            </div>
          ) : (
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
                        {booking.booking_reference}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{booking.event_name}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                          {booking.event_type} • {booking.guest_count || 0} guests
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{booking.client_name}</div>
                        <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                          <span className="flex items-center gap-1"><Mail size={10} /> {booking.client_email}</span>
                          {booking.client_phone && <span className="flex items-center gap-1"><Phone size={10} /> {booking.client_phone}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#8b9172]" />
                          {format(new Date(booking.event_date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {booking.venue}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900">
                        {formatCurrency(booking.total_amount)}
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
                            <DropdownMenuItem onClick={() => handleEditClick(booking)}>Edit reservation</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this booking?')) {
                                  deleteBookingMutation.mutate(booking.id);
                                }
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              Delete reservation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {booking.status === 'pending' && (
                              <DropdownMenuItem 
                                className="text-[#8b9172]"
                                onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'confirmed' })}
                              >
                                Confirm booking
                              </DropdownMenuItem>
                            )}
                            {booking.status === 'confirmed' && (
                              <DropdownMenuItem 
                                className="text-emerald-600"
                                onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'completed' })}
                              >
                                Mark completed
                              </DropdownMenuItem>
                            )}
                            {booking.status !== 'cancelled' && (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'cancelled' })}
                              >
                                Cancel booking
                              </DropdownMenuItem>
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!isSubmitting) setIsDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editingId ? 'Edit Reservation' : 'New Reservation'}</DialogTitle>
            <DialogDescription className="font-light">
              {editingId ? 'Update the details for this reservation.' : 'Enter the details to create a new reservation.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_email">Client Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_phone">Client Phone</Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_name">Event Name</Label>
                <Input
                  id="event_name"
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(val) => setFormData({ ...formData, event_type: val })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="event_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wedding">Wedding</SelectItem>
                    <SelectItem value="Corporate">Corporate</SelectItem>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Session">Session</SelectItem>
                    <SelectItem value="Conference">Conference</SelectItem>
                    <SelectItem value="Party">Party</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Select
                  value={formData.venue}
                  onValueChange={(val) => setFormData({ ...formData, venue: val })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="venue">
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Arena">Main Arena</SelectItem>
                    <SelectItem value="Garden Hall">Garden Hall</SelectItem>
                    <SelectItem value="Therapy Room">Therapy Room</SelectItem>
                    <SelectItem value="Conference Room">Conference Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_date">Event Date</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest_count">Guest Count</Label>
                <Input
                  id="guest_count"
                  type="number"
                  min="1"
                  value={formData.guest_count}
                  onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_amount">Total Amount (KES)</Label>
                <Input
                  id="total_amount"
                  type="number"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Deposit Amount (KES)</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  min="0"
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#8b9172] hover:bg-[#6a7051] text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Reservation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
