import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Wallet, HeartHandshake, MapPin, Tent, TrendingUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { ApiResponse } from '@/types';

interface DashboardMetrics {
  current_month: {
    bookings: number;
    revenue: number;
  };
  last_month: {
    bookings: number;
    revenue: number;
  };
  growth: {
    bookings: number;
    revenue: number;
  };
  upcoming_bookings: number;
  pending_bookings: number;
}

interface Booking {
  id: string;
  booking_reference: string;
  client_name: string;
  event_name: string;
  event_type: string;
  venue: string;
  event_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

interface BookingTrends {
  bookings_by_venue: { venue: string; count: number }[];
}

export default function Dashboard() {
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DashboardMetrics>>('/analytics/dashboard');
      return response.data.data;
    },
  });

  const { data: recentBookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['dashboard', 'recent-bookings'],
    queryFn: async () => {
      // Fetch upcoming bookings
      const response = await api.get<ApiResponse<{ bookings: Booking[] }>>('/bookings', {
        params: {
          start_date: new Date().toISOString(),
          limit: 5,
          sort_by: 'event_date',
          sort_order: 'asc'
        }
      });
      return response.data.data.bookings;
    },
  });

  const { data: trendsData, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<BookingTrends>>('/analytics/bookings/trends');
      return response.data.data;
    },
  });

  const stats = [
    {
      title: 'Total Inquiries',
      value: dashboardData?.current_month.bookings.toString() || '0',
      icon: Users,
      change: `${(dashboardData?.growth.bookings || 0) > 0 ? '+' : ''}${(dashboardData?.growth.bookings || 0).toFixed(1)}%`,
      changeType: (dashboardData?.growth.bookings || 0) >= 0 ? 'positive' : 'negative',
      description: 'from last month',
    },
    {
      title: 'Upcoming Events',
      value: dashboardData?.upcoming_bookings.toString() || '0',
      icon: Calendar,
      change: 'Active',
      changeType: 'positive',
      description: 'scheduled',
    },
    {
      title: 'Monthly Revenue',
      value: `KES ${((dashboardData?.current_month.revenue || 0) / 1000000).toFixed(1)}M`,
      icon: Wallet,
      change: `${(dashboardData?.growth.revenue || 0) > 0 ? '+' : ''}${(dashboardData?.growth.revenue || 0).toFixed(1)}%`,
      changeType: (dashboardData?.growth.revenue || 0) >= 0 ? 'positive' : 'negative',
      description: 'from last month',
    },
    {
      title: 'Pending Approvals',
      value: dashboardData?.pending_bookings.toString() || '0',
      icon: TrendingUp,
      change: 'Action needed',
      changeType: dashboardData?.pending_bookings ? 'negative' : 'positive',
      description: 'waiting review',
    },
  ];

  const venueConfig = [
    { name: 'Main Arena', icon: Tent, capacity: 500 },
    { name: 'Garden Hall', icon: MapPin, capacity: 120 },
    { name: 'Therapy Room', icon: HeartHandshake, capacity: 6 },
    { name: 'Conference Room', icon: Users, capacity: 30 },
  ];

  const totalVenueBookings = trendsData?.bookings_by_venue.reduce((acc, curr) => acc + curr.count, 0) || 1;

  const venueStats = venueConfig.map(config => {
    const venueData = trendsData?.bookings_by_venue.find(v => v.venue === config.name);
    const count = venueData?.count || 0;
    const utilization = totalVenueBookings > 0 ? Math.round((count / totalVenueBookings) * 100) : 0;
    
    return {
      name: config.name,
      capacity: config.capacity,
      utilization,
      icon: config.icon
    };
  }).filter(v => v.utilization > 0 || v.name === 'Main Arena' || v.name === 'Garden Hall' || v.name === 'Therapy Room');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-gray-900">Welcome to Olive Garden</h1>
        <p className="text-gray-600 mt-2 font-light">Overview of your venue reservations and operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-[#8b9172]" />
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <>
                  <div className="text-2xl font-bold font-serif">{stat.value}</div>
                  <p className={`text-xs mt-1 font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} <span className="text-gray-500 font-normal">{stat.description}</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="font-serif text-xl">Upcoming Reservations</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingBookings ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#8b9172]" />
              </div>
            ) : !recentBookingsData || recentBookingsData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No upcoming reservations found.
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookingsData.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 last:pb-0">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-xl bg-[#8b9172]/10 text-[#8b9172] flex flex-col items-center justify-center font-medium">
                        <span className="text-xs uppercase leading-none">{format(new Date(booking.event_date), 'MMM')}</span>
                        <span className="text-lg leading-none mt-1">{format(new Date(booking.event_date), 'dd')}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{booking.event_name || booking.client_name}</p>
                        <p className="text-sm text-gray-500">{booking.venue} • {booking.event_type}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      booking.status === 'confirmed' 
                        ? 'bg-[#8b9172]/15 text-[#8b9172]' 
                        : booking.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="font-serif text-xl">Space Popularity</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingTrends ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#8b9172]" />
              </div>
            ) : (
              <div className="space-y-6">
                {venueStats.map((space) => (
                  <div key={space.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <space.icon className="w-4 h-4 text-[#8b9172]" />
                        <span className="font-medium text-sm text-gray-900">{space.name}</span>
                      </div>
                      <span className="text-sm font-medium">{space.utilization}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#8b9172] rounded-full transition-all duration-500" 
                        style={{ width: `${space.utilization}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-right">Capacity: {space.capacity}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
