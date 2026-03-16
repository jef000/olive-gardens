import { useState } from 'react';
import { Calendar, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Booking {
  id: string;
  venue: string;
  date: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  customer: string;
  amount: number;
}

const mockBookings: Booking[] = [
  {
    id: '1',
    venue: 'Main Arena',
    date: '2024-03-25',
    guests: 150,
    status: 'pending',
    customer: 'john@example.com',
    amount: 5000,
  },
  {
    id: '2',
    venue: 'Garden Space',
    date: '2024-03-28',
    guests: 80,
    status: 'confirmed',
    customer: 'sarah@example.com',
    amount: 3500,
  },
  {
    id: '3',
    venue: 'VIP Lounge',
    date: '2024-03-20',
    guests: 50,
    status: 'completed',
    customer: 'mike@example.com',
    amount: 2500,
  },
];

export default function Bookings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredBookings = mockBookings.filter((booking) => {
    const matchesSearch =
      booking.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    { label: 'Total Bookings', value: mockBookings.length, color: 'text-blue-600' },
    {
      label: 'Pending',
      value: mockBookings.filter((b) => b.status === 'pending').length,
      color: 'text-yellow-600',
    },
    {
      label: 'Confirmed',
      value: mockBookings.filter((b) => b.status === 'confirmed').length,
      color: 'text-green-600',
    },
    {
      label: 'Revenue',
      value: `$${mockBookings.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}`,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
        <p className="text-gray-600 mt-2">Manage venue bookings and reservations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className={`text-sm ${stat.color}`}>{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">#{booking.id}</TableCell>
                  <TableCell>{booking.venue}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(booking.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{booking.customer}</TableCell>
                  <TableCell>{booking.guests}</TableCell>
                  <TableCell>${booking.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
