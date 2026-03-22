import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Calendar, Wallet, HeartHandshake, MapPin, Tent, TrendingUp, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import type { ApiResponse } from '@/types';
import { cn } from '@/lib/utils';

interface DashboardMetrics {
  current_month: {
    bookings: number;
    revenue: number;
    inquiries: number;
  };
  last_month: {
    bookings: number;
    revenue: number;
    inquiries: number;
  };
  growth: {
    bookings: number;
    revenue: number;
    inquiries: number;
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
      value: dashboardData?.current_month.inquiries.toString() || '0',
      icon: Users,
      change: `${(dashboardData?.growth.inquiries || 0) > 0 ? '+' : ''}${(dashboardData?.growth.inquiries || 0).toFixed(1)}%`,
      changeType: (dashboardData?.growth.inquiries || 0) >= 0 ? 'positive' : 'negative',
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
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-serif text-gray-900 tracking-tight">Overview</h1>
        <p className="text-gray-500 mt-1.5 font-medium">Track your venue reservations and operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className="w-8 h-8 rounded-full bg-[#8b9172]/10 flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-[#8b9172]" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-serif text-gray-900 tracking-tight">{stat.value}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                      stat.changeType === 'positive' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-rose-50 text-rose-600'
                    )}>
                      {stat.changeType === 'positive' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{stat.description}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-gray-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="font-serif text-xl text-gray-900">Upcoming Reservations</CardTitle>
            <CardDescription className="text-gray-500 font-medium">Your next scheduled events and bookings</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingBookings ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#8b9172]" />
              </div>
            ) : !recentBookingsData || recentBookingsData.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-medium">
                No upcoming reservations found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentBookingsData.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex gap-4 items-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#8b9172]/10 text-[#8b9172] flex flex-col items-center justify-center font-medium shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider">{format(new Date(booking.event_date), 'MMM')}</span>
                        <span className="text-xl font-serif font-bold leading-none mt-0.5">{format(new Date(booking.event_date), 'dd')}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-base">{booking.event_name || booking.client_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium text-gray-500">{booking.venue}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-sm font-medium text-gray-500">{booking.event_type}</span>
                        </div>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-full border shadow-sm",
                      booking.status === 'confirmed' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : booking.status === 'completed'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : booking.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="font-serif text-xl text-gray-900">Space Utilization</CardTitle>
            <CardDescription className="text-gray-500 font-medium">Popularity across venues</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingTrends ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#8b9172]" />
              </div>
            ) : (
              <div className="space-y-6">
                {venueStats.map((space) => (
                  <div key={space.name} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-gray-100 text-gray-600">
                          <space.icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-sm text-gray-900">{space.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{space.utilization}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#8b9172] to-[#a3a989] rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${space.utilization}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-gray-400 text-right">Capacity: {space.capacity}</p>
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
