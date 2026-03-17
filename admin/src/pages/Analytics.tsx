import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Wallet, Calendar, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
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

interface RevenueData {
  month: string;
  revenue: number;
}

interface BookingTrends {
  bookings_by_event_type: { event_type: string; count: number }[];
  bookings_by_venue: { venue: string; count: number }[];
}

export default function Analytics() {
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DashboardMetrics>>('/analytics/dashboard');
      return response.data.data;
    },
  });

  const { data: revenueDataRaw, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ revenue_by_month: RevenueData[] }>>('/analytics/revenue');
      return response.data.data.revenue_by_month;
    },
  });

  const { data: trendsData, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['analytics', 'trends'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<BookingTrends>>('/analytics/bookings/trends');
      return response.data.data;
    },
  });

  const formatCurrency = (value: number) => {
    return `KES ${(value / 1000000).toFixed(1)}M`;
  };

  const metrics = [
    {
      title: 'Monthly Revenue',
      value: `KES ${((dashboardData?.current_month.revenue || 0) / 1000000).toFixed(1)}M`,
      change: `${(dashboardData?.growth.revenue || 0) > 0 ? '+' : ''}${(dashboardData?.growth.revenue || 0).toFixed(1)}%`,
      trend: (dashboardData?.growth.revenue || 0) >= 0 ? 'up' : 'down',
      icon: Wallet,
    },
    {
      title: 'Monthly Bookings',
      value: dashboardData?.current_month.bookings || 0,
      change: `${(dashboardData?.growth.bookings || 0) > 0 ? '+' : ''}${(dashboardData?.growth.bookings || 0).toFixed(1)}%`,
      trend: (dashboardData?.growth.bookings || 0) >= 0 ? 'up' : 'down',
      icon: Calendar,
    },
    {
      title: 'Upcoming Events',
      value: dashboardData?.upcoming_bookings || 0,
      change: 'Active',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Pending Approvals',
      value: dashboardData?.pending_bookings || 0,
      change: 'Action needed',
      trend: dashboardData?.pending_bookings ? 'down' : 'up',
      icon: TrendingUp,
    },
  ];

  // Map backend revenue data to chart format
  const revenueChartData = revenueDataRaw || [
    { month: 'Jan', revenue: 0 },
    { month: 'Feb', revenue: 0 },
    { month: 'Mar', revenue: 0 }
  ];

  // Transform event types into pivot format for BarChart
  // Realistically, backend returns: [{event_type: 'Wedding', count: 5}, ...]
  // We'll create a single "This Month" object for the stacked bar
  const bookingChartData = [{
    month: 'Recent',
    weddings: trendsData?.bookings_by_event_type.find(e => e.event_type === 'Wedding')?.count || 0,
    corporate: trendsData?.bookings_by_event_type.find(e => e.event_type === 'Corporate')?.count || 0,
    workshops: trendsData?.bookings_by_event_type.find(e => e.event_type === 'Workshop')?.count || 0,
    other: trendsData?.bookings_by_event_type.filter(e => !['Wedding', 'Corporate', 'Workshop'].includes(e.event_type)).reduce((acc, curr) => acc + curr.count, 0) || 0,
  }];

  const VENUE_COLORS: Record<string, string> = {
    'Main Arena': '#8b9172',
    'Garden Hall': '#a6ac8e',
    'Therapy Room': '#c1c7ab',
    'Conference Room': '#d6dabc',
  };

  const venuePerformance = (trendsData?.bookings_by_venue || []).map(v => ({
    name: v.venue,
    value: v.count,
    color: VENUE_COLORS[v.venue] || '#e2e5d6',
  }));

  const totalVenueBookings = venuePerformance.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-2 font-light">Track performance and insights across your venues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                {metric.title}
              </CardTitle>
              <metric.icon className="w-4 h-4 text-[#8b9172]" />
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <>
                  <div className="text-2xl font-bold font-serif">{metric.value}</div>
                  <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {metric.change} <span className="text-gray-500 font-normal">vs last month</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full flex items-center justify-center">
              {isLoadingRevenue ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#8b9172]" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b9172" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b9172" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <Tooltip 
                      formatter={(value: number) => [new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumSignificantDigits: 3 }).format(value), 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#8b9172" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Recent Bookings by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full flex items-center justify-center">
              {isLoadingTrends ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#8b9172]" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#f3f4f6'}}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="weddings" name="Weddings" stackId="a" fill="#8b9172" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="corporate" name="Corporate" stackId="a" fill="#a6ac8e" />
                    <Bar dataKey="workshops" name="Workshops" stackId="a" fill="#c1c7ab" />
                    <Bar dataKey="other" name="Other Events" stackId="a" fill="#e2e5d6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Bookings by Space</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full flex items-center justify-center">
              {isLoadingTrends ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#8b9172]" />
              ) : venuePerformance.length === 0 ? (
                <p className="text-gray-500 font-light">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={venuePerformance}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {venuePerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} bookings`, 'Total']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Top Performing Venues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingTrends ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-[#8b9172]" />
                </div>
              ) : venuePerformance.length === 0 ? (
                <p className="text-center py-8 text-gray-500 font-light">No data available</p>
              ) : (
                venuePerformance.map((venue, index) => {
                  const utilization = totalVenueBookings > 0 ? Math.round((venue.value / totalVenueBookings) * 100) : 0;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50/50 border border-border/50 rounded-xl transition-colors hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{venue.name}</p>
                        <p className="text-sm text-gray-500">{venue.value} total bookings</p>
                      </div>
                      <div className="flex-1 text-center hidden md:block">
                        <div className="w-full max-w-[120px] mx-auto h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ width: `${utilization}%`, backgroundColor: venue.color }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{utilization}% of total</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
