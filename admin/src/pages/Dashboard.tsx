import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Calendar, Wallet, HeartHandshake, MapPin, Tent, TrendingUp, Loader2, ArrowUpRight, ArrowDownRight, ArrowRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ApiResponse } from '@/types';
import { cn } from '@/lib/utils';
import { toRevenueSeries } from '@/lib/revenueSeries';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

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
  const { user } = useAuth();
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

  const { data: revenueSeries, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ revenue_by_month: { month: string; revenue: number }[] }>>('/analytics/revenue');
      return toRevenueSeries(response.data.data.revenue_by_month);
    },
  });

  const formatCurrencyShort = (value: number) => `KES ${(value / 1000000).toFixed(1)}M`;

  const stats = [
    {
      title: 'Total Inquiries',
      value: dashboardData?.current_month.inquiries.toString() || '0',
      icon: Users,
      tone: 'from-emerald-400 to-teal-500',
      change: `${(dashboardData?.growth.inquiries || 0) > 0 ? '+' : ''}${(dashboardData?.growth.inquiries || 0).toFixed(1)}%`,
      changeType: (dashboardData?.growth.inquiries || 0) >= 0 ? 'positive' : 'negative',
      description: 'from last month',
    },
    {
      title: 'Upcoming Events',
      value: dashboardData?.upcoming_bookings.toString() || '0',
      icon: Calendar,
      tone: 'from-sky-400 to-indigo-500',
      change: 'Active',
      changeType: 'positive',
      description: 'scheduled',
    },
    {
      title: 'Monthly Revenue',
      value: `KES ${((dashboardData?.current_month.revenue || 0) / 1000000).toFixed(1)}M`,
      icon: Wallet,
      tone: 'from-brand-400 to-gold-500',
      change: `${(dashboardData?.growth.revenue || 0) > 0 ? '+' : ''}${(dashboardData?.growth.revenue || 0).toFixed(1)}%`,
      changeType: (dashboardData?.growth.revenue || 0) >= 0 ? 'positive' : 'negative',
      description: 'from last month',
    },
    {
      title: 'Pending Approvals',
      value: dashboardData?.pending_bookings.toString() || '0',
      icon: TrendingUp,
      tone: 'from-amber-400 to-orange-500',
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
    <div className="space-y-7 pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 text-white shadow-brand-lg sm:p-9">
        <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-300">Operations overview</p>
            <h1 className="text-3xl font-serif font-bold tracking-tight sm:text-4xl">
              Good to see you, {user?.email ? user.email.split('@')[0] : 'admin'}
            </h1>
            <p className="mt-2 max-w-xl font-medium text-white/75">Track venue reservations, guest requests, and the health of your operations from one place.</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white/90 backdrop-blur-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Live overview</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/bookings" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 shadow-lg transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New reservation
            </Link>
            <Link to="/analytics" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800">
              View analytics
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className={cn('card-hover glass group overflow-hidden', stat.title === 'Pending Approvals' && 'border-amber-200/80')}>
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform group-hover:scale-110', stat.tone)}>
                <stat.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent className="pb-5">
              {isLoadingDashboard ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-serif text-gray-900 tracking-tight dark:text-white">{stat.value}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                      stat.changeType === 'positive'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300'
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

      <Card className="glass">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="font-serif text-xl text-gray-900 dark:text-white">Revenue trend</CardTitle>
          <CardDescription className="text-gray-500 font-medium">Monthly revenue for this year</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoadingRevenue ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b9172" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b9172" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={8} />
                  <YAxis tickFormatter={formatCurrencyShort} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} width={70} />
                  <Tooltip
                    formatter={(value: number) => [new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumSignificantDigits: 3 }).format(value), 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8b9172" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="glass lg:col-span-2">
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
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8b9172]/10 text-[#8b9172]"><Calendar className="h-5 w-5" aria-hidden="true" /></div>
                <p className="font-semibold text-gray-700">No upcoming reservations</p>
                <p className="mt-1 text-sm text-gray-400">New bookings will appear here once they are scheduled.</p>
                <Link to="/bookings" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#8b9172] hover:text-[#6f774e]">Open bookings <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
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

        <Card className="glass">
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
