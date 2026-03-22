import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Inquiry } from '../types';
import { useToast } from '../hooks/use-toast';
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
import { Trash2, Eye, Mail, Phone, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { format } from 'date-fns';

const fetchInquiries = async (status?: string) => {
  const params = status && status !== 'all' ? { status } : {};
  const response = await api.get('/inquiries', { params });
  return response.data.data.inquiries as Inquiry[];
};

export default function Inquiries() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['inquiries', statusFilter],
    queryFn: () => fetchInquiries(statusFilter),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/inquiries/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      toast({
        title: 'Status Updated',
        description: 'The inquiry status has been successfully updated.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update inquiry status.',
      });
    },
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
      setSelectedInquiry(null);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete the inquiry.',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      new: 'destructive',
      read: 'secondary',
      replied: 'default',
      archived: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inquiries</h1>
          <p className="text-gray-500 mt-2">Manage customer messages and contact requests.</p>
        </div>
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Inquiries</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
            {inquiries?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No inquiries found matching the current filter.
                </TableCell>
              </TableRow>
            ) : (
              inquiries?.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-medium">
                    {format(new Date(inquiry.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {inquiry.first_name} {inquiry.last_name}
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

                          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Inquiry
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this inquiry.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => deleteMutation.mutate(inquiry.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
