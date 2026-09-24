import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Avatar from '@/components/Avatar';
import { useToast } from '@/hooks/use-toast';
import { confirm } from '@/lib/confirm';
import bookingService from '@/services/booking.service';
import type { Booking, BookingStatus, CreateBookingDTO, EventType, Venue } from '@/types/booking';
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
import BulkActionBar from '@/components/BulkActionBar';
import EmptyState from '@/components/EmptyState';
import BookingsReportDialog from '@/components/BookingsReportDialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { highlightText } from '@/lib/highlighter';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useBulkDelete } from '@/hooks/useBulkDelete';
import { createEntityListCache } from '@/lib/entityListCache';
import { scheduleUndoableOperation } from '@/lib/undoableOperations';
import InfiniteScrollFooter from '@/components/InfiniteScrollFooter';
import ProgressModal from '@/components/ProgressModal';
import PageIntro from '@/components/PageIntro';

export default function Bookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [reportOpen, setReportOpen] = useState(false);

  // Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  interface FormData {
    client_name: string;
    client_email: string;
    client_phone: string;
    event_name: string;
    event_type: string;
    venue: string;
    event_date: string;
    guest_count: number | string;
    total_amount: number | string;
    deposit_amount: number | string;
  }

  const defaultForm: FormData = {
    client_name: '', client_email: '', client_phone: '',
    event_name: '', event_type: 'Wedding', venue: 'Main Arena',
    event_date: '', guest_count: 0, total_amount: 0, deposit_amount: 0
  };
  const [formData, setFormData] = useState<FormData>(defaultForm);

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
      event_type: booking.event_type as string,
      venue: booking.venue as string,
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
      const payload: CreateBookingDTO = {
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone || undefined,
        event_name: formData.event_name,
        event_type: formData.event_type as EventType,
        venue: formData.venue as Venue,
        event_date: formData.event_date,
        guest_count: Number(formData.guest_count),
        total_amount: Number(formData.total_amount),
        deposit_amount: Number(formData.deposit_amount),
      };

      if (editingId) {
        await bookingService.updateBooking(editingId, payload);
        toast({
          title: 'Booking Updated',
          description: 'The booking has been updated successfully.',
          variant: 'success',
        });
      } else {
        await bookingService.createBooking(payload);
        toast({
          title: 'Booking Created',
          description: 'New booking has been created successfully.',
          variant: 'success',
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'stats'] });
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData(defaultForm);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : undefined;
      toast({
        title: 'Error',
        description: message || `Failed to ${editingId ? 'update' : 'create'} booking`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { data: bookingsData, isLoading: isLoadingBookings, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['bookings'],
    queryFn: ({ pageParam }) => bookingService.getBookings({ page: pageParam, limit: 25 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.has_more ? (lastPage.page || 1) + 1 : undefined,
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['bookings', 'stats'],
    queryFn: () => bookingService.getStats(),
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      return bookingService.updateStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'stats'] });
      toast({
        title: 'Status Updated',
        description: 'Booking status has been updated successfully.',
        variant: 'success',
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : undefined;
      toast({
        title: 'Error',
        description: message || 'Failed to update booking status',
        variant: 'destructive',
      });
    }
  });

  const normalizedBookings = bookingsData?.pages.flatMap((page) => page.bookings) || [];

  const invalidateBookings = () => {
    void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    void queryClient.invalidateQueries({ queryKey: ['bookings', 'stats'] });
  };

  interface BookingListPage {
    bookings: Booking[];
    total: number;
    page?: number;
    has_more?: boolean;
  }

  const bookingListCache = useMemo(
    () =>
      createEntityListCache<BookingListPage, Booking>({
        queryClient,
        queryKey: ['bookings'],
        getItems: (page) => page.bookings,
        setItems: (page, bookings) => ({ ...page, bookings }),
      }),
    [queryClient]
  );

  const requestBookingDelete = (booking: Booking) => {
    bookingListCache.remove(new Set([booking.id]));
    scheduleUndoableOperation({
      label: 'Booking deleted',
      cancel: invalidateBookings,
      commit: async () => {
        try {
          await bookingService.deleteBooking(booking.id);
        } finally {
          // Always reconcile the cache: on failure the optimistic removal must
          // be rolled back by the refetch, not left as a ghost row.
          invalidateBookings();
        }
      },
    });
  };

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
  const bulk = useBulkSelection(filteredBookings);
  const { sentinelRef } = useInfiniteScroll(() => { void fetchNextPage(); }, Boolean(hasNextPage), isFetchingNextPage);
  const bulkDelete = useBulkDelete({
    noun: 'bookings',
    deleteOne: (id) => bookingService.deleteBooking(id),
    list: bookingListCache,
    refetch: invalidateBookings,
  });

  const deleteSelected = async () => {
    if (await bulkDelete.run(new Set(bulk.selectedIds))) {
      bulk.clearSelection();
    }
  };

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
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-700 border border-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-700/50">
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
      <PageIntro
        eyebrow="Operations"
        title="Reservations"
        description="Manage venue bookings, client requests, and upcoming events."
        actions={<>
          <Button variant="outline" onClick={() => setReportOpen(true)}>Report</Button>
          <Button onClick={handleCreateClick} className="bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-brand transition hover:shadow-brand-lg hover:brightness-105"><Plus className="mr-2 h-4 w-4" />New Reservation</Button>
        </>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="glass card-hover relative overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-gold-400" aria-hidden="true" />
            <CardContent className="pt-7">
              <div className={`text-3xl font-bold font-serif mb-1 ${stat.color}`}>{
                isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : stat.value
              }</div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wider dark:text-gray-400">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass overflow-hidden">
        <CardHeader className="border-b border-gray-200/60 pb-4 dark:border-white/10">
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
            <TableSkeleton rows={6} columns={7} />
          ) : (
          <div className="overflow-x-auto">
            <div className="sr-only" aria-live="polite">{filteredBookings.length} reservations found</div>
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-10 pl-6"><input type="checkbox" aria-label="Select all reservations" checked={bulk.allSelected} onChange={bulk.toggleAll} /></TableHead>
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
                  <TableCell colSpan={8} className="py-10"><EmptyState title="No reservations found" description={searchTerm || statusFilter !== 'all' || venueFilter !== 'all' ? 'Try clearing a filter or changing your search.' : 'Create your first reservation to get started.'} actionLabel={searchTerm || statusFilter !== 'all' || venueFilter !== 'all' ? 'Clear filters' : 'New reservation'} onAction={() => { if (searchTerm || statusFilter !== 'all' || venueFilter !== 'all') { setSearchTerm(''); setStatusFilter('all'); setVenueFilter('all'); } else handleCreateClick(); }} /></TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-gray-50/30 cursor-default">
                      <TableCell className="pl-6"><input type="checkbox" aria-label={`Select reservation ${booking.booking_reference}`} checked={bulk.isSelected(booking.id)} onChange={() => bulk.toggleSelection(booking.id)} /></TableCell>
                      <TableCell className="font-medium text-xs text-gray-500 pl-6">
                        <span dangerouslySetInnerHTML={{ __html: highlightText(booking.booking_reference, searchTerm) }} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: highlightText(booking.event_name, searchTerm) }} />
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                          {booking.event_type} • {booking.guest_count || 0} guests
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={booking.client_name || booking.client_email} size="sm" />
                          <div>
                            <div className="font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: highlightText(booking.client_name, searchTerm) }} />
                            <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                              <span className="flex items-center gap-1"><Mail size={10} /> <span dangerouslySetInnerHTML={{ __html: highlightText(booking.client_email, searchTerm) }} /></span>
                              {booking.client_phone && <span className="flex items-center gap-1"><Phone size={10} /> {booking.client_phone}</span>}
                            </div>
                          </div>
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
                              onClick={async () => {
                                const approved = await confirm({
                                  title: 'Delete this reservation?',
                                  description: `${booking.client_name}'s booking will be removed after a short undo window.`,
                                  undoable: true,
                                  confirmLabel: 'Delete',
                                  variant: 'destructive',
                                });
                                if (approved) {
                                  requestBookingDelete(booking);
                                }
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              Delete reservation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {booking.status === 'pending' && (
                              <DropdownMenuItem 
                                className="text-brand-600 dark:text-brand-300"
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
            <InfiniteScrollFooter sentinelRef={sentinelRef} isFetchingNextPage={isFetchingNextPage} hasNextPage={Boolean(hasNextPage)} hasItems={normalizedBookings.length > 0} loadingLabel="Loading more reservations…" endLabel="No more reservations" />
          </div>
          )}
        </CardContent>
      </Card>

      <BulkActionBar count={bulk.selectedCount} onDelete={() => void deleteSelected()} onExport={() => setReportOpen(true)} />
      <BookingsReportDialog open={reportOpen} onOpenChange={setReportOpen} />
      <ProgressModal open={bulkDelete.progress?.open ?? false} progress={bulkDelete.progress?.progress ?? 0} label={bulkDelete.progress?.label ?? ''} onCancel={bulkDelete.cancel} />

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
