import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Inquiry } from '../types';
import { useToast } from '../hooks/use-toast';
import { confirm } from '../lib/confirm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Trash2, Eye, Mail, Phone, Calendar, Search, Loader2, FilterX, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { format } from 'date-fns';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import InquiryReplyPanel from '../components/InquiryReplyPanel';
import { TableSkeleton } from '../components/ui/skeleton';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';
import PageIntro from '../components/PageIntro';
import {
  buildInquiryParams,
  hasActiveInquiryFilters,
  inquiryYearOptions,
  type InquiryListPayload,
  type InquiryQueryState,
} from '../lib/inquiryQuery';

const PAGE_SIZE = 20;

const fetchInquiries = async (query: InquiryQueryState): Promise<InquiryListPayload> => {
  const response = await api.get('/inquiries', { params: buildInquiryParams(query) });
  return response.data.data as InquiryListPayload;
};

export default function Inquiries() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryState: InquiryQueryState = {
    status: statusFilter,
    search: debouncedSearch,
    year: yearFilter,
    from,
    to,
    page,
    limit: PAGE_SIZE,
  };
  const queryKey = ['inquiries', statusFilter, debouncedSearch, yearFilter, from, to, page] as const;

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchInquiries(queryState),
  });

  const inquiries = data?.inquiries ?? [];
  const pagination = data?.pagination;
  const years = inquiryYearOptions(data?.years ?? []);
  const filtersActive = hasActiveInquiryFilters({ status: statusFilter, search, year: yearFilter, from, to });
  const rangeInvalid = Boolean(from && to && from > to);

  const updateStatusMutation = useOptimisticUpdate<Inquiry[], { id: string; status: string }>({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/inquiries/${id}/status`, { status });
      return response.data;
    },
    queryKey,
    update: (current, variables) => current?.map((inquiry) => inquiry.id === variables.id ? { ...inquiry, status: variables.status as Inquiry['status'] } : inquiry),
    successMessage: 'Inquiry status updated',
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/inquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      toast({
        title: 'Inquiry Deleted',
        description: 'The inquiry has been successfully deleted.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete the inquiry.',
      });
    },
  });

  const clearFilters = () => {
    setStatusFilter('all');
    setSearch('');
    setDebouncedSearch('');
    setYearFilter('all');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      new: 'destructive',
      read: 'secondary',
      replied: 'default',
      archived: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Guest communication"
        title="Inquiries"
        description="Manage customer messages and contact requests."
      />

      <div className="glass overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 p-4">
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <Label htmlFor="inquiry-search">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <Input
                id="inquiry-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, phone, or message"
                className="pl-9"
              />
            </div>
          </div>

          <div className="w-full space-y-1.5 sm:w-40">
            <Label htmlFor="inquiry-status">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger id="inquiry-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5 sm:w-36">
            <Label htmlFor="inquiry-year">Year</Label>
            <Select value={yearFilter} onValueChange={(value) => { setYearFilter(value); setFrom(''); setTo(''); setPage(1); }}>
              <SelectTrigger id="inquiry-year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inquiry-from">From</Label>
            <Input id="inquiry-from" type="date" value={from} max={to || undefined} onChange={(event) => { setFrom(event.target.value); setYearFilter('all'); setPage(1); }} className="w-full sm:w-40" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inquiry-to">To</Label>
            <Input id="inquiry-to" type="date" value={to} min={from || undefined} onChange={(event) => { setTo(event.target.value); setYearFilter('all'); setPage(1); }} className="w-full sm:w-40" />
          </div>

          <Button type="button" variant="ghost" onClick={clearFilters} disabled={!filtersActive} className="h-11">
            <FilterX className="mr-2 h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        </div>

        {rangeInvalid && (
          <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700" role="alert">
            The start date must be on or before the end date.
          </p>
        )}

        <div className="flex items-center justify-between gap-3 px-4 pt-3 text-xs text-gray-500">
          <span aria-live="polite">
            {pagination ? `${pagination.total} ${pagination.total === 1 ? 'inquiry' : 'inquiries'}` : 'Loading inquiries…'}
          </span>
          {isFetching && !isLoading && (
            <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Updating…</span>
          )}
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : inquiries.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No inquiries found"
              description={filtersActive ? 'No messages match the current search and filters.' : 'There are no customer messages yet.'}
              actionLabel={filtersActive ? 'Clear filters' : undefined}
              onAction={filtersActive ? clearFilters : undefined}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-medium">
                    {format(new Date(inquiry.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={`${inquiry.first_name} ${inquiry.last_name}`} size="sm" />
                      <span className="font-medium text-gray-900 dark:text-white">{inquiry.first_name} {inquiry.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      <div>{inquiry.email}</div>
                      {inquiry.phone && <div className="text-xs">{inquiry.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={inquiry.status}
                      onValueChange={(value) => 
                        updateStatusMutation.mutate({ id: inquiry.id, status: value })
                      }
                    >
                      <SelectTrigger className="w-32 h-8 border-0 shadow-none p-0 focus:ring-0">
                        {getStatusBadge(inquiry.status)}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (inquiry.status === 'new') {
                              updateStatusMutation.mutate({ id: inquiry.id, status: 'read' });
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 text-gray-500 hover:text-brand-600" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Inquiry Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 mt-4">
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-500">From</p>
                              <p className="text-base">{inquiry.first_name} {inquiry.last_name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Date Received</p>
                              <p className="text-base flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(inquiry.created_at), 'PPP at p')}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Email</p>
                              <p className="text-base flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <a href={`mailto:${inquiry.email}`} className="text-brand-600 hover:underline">
                                  {inquiry.email}
                                </a>
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Phone</p>
                              <p className="text-base flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {inquiry.phone ? (
                                  <a href={`tel:${inquiry.phone}`} className="text-brand-600 hover:underline">
                                    {inquiry.phone}
                                  </a>
                                ) : 'Not provided'}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-2">Message</p>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 min-h-[150px] whitespace-pre-wrap text-gray-700">
                              {inquiry.message}
                            </div>
                          </div>

                          <InquiryReplyPanel inquiry={inquiry} />

                          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                const approved = await confirm({
                                  title: 'Delete this inquiry?',
                                  undoable: false,
                                  confirmLabel: 'Delete',
                                });
                                if (approved) {
                                  deleteMutation.mutate(inquiry.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Inquiry
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                Previous
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={page >= pagination.totalPages || isFetching} onClick={() => setPage((current) => current + 1)}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
