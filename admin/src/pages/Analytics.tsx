import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Wallet, Calendar, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import type { ApiResponse } from '@/types';
import ExportDialog from '@/components/ExportDialog';
import DateRangePicker from '@/components/DateRangePicker';
import { CardSkeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/EmptyState';
import PageIntro from '@/components/PageIntro';
import { ALL_TIME, formatRangeLabel, rangeParams, rangeSlug, startOfMonthInput, toInputDate, type DateRange } from '@/lib/dateRange';
import type { ExportSummaryItem } from '@/lib/ooxml';

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

interface RangeOverview {
  total_bookings: number;
  total_revenue: number;
  total_users: number;
  total_events: number;
}

export default function Analytics() {
  const [exportOpen, setExportOpen] = useState(false);
  const [drillDown, setDrillDown] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>(() => ({ from: startOfMonthInput(), to: toInputDate(new Date()) }));
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DashboardMetrics>>('/analytics/dashboard');
      return response.data.data;
    },
  });

  const { data: revenueDataRaw, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['analytics', 'revenue', range.from, range.to],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ revenue_by_month: RevenueData[] }>>('/analytics/revenue', { params: rangeParams(range) });
      return response.data.data.revenue_by_month;
    },
  });

  const { data: trendsData, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['analytics', 'trends', range.from, range.to],
    queryFn: async () => {
      const response = await api.get<ApiResponse<BookingTrends>>('/analytics/bookings/trends', { params: rangeParams(range) });
      return response.data.data;
    },
  });

  const { data: overviewData } = useQuery({
    queryKey: ['analytics', 'overview', range.from, range.to],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RangeOverview>>('/analytics/overview', { params: rangeParams(range) });
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
  const revenueChartData = revenueDataRaw ?? [];
  const rangeLabel = formatRangeLabel(range);
  const hasRevenueData = revenueChartData.length > 0;
  const rangeHasNoActivity = overviewData !== undefined && overviewData.total_bookings === 0 && overviewData.total_revenue === 0;

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
  const hasTypeData = bookingChartData.some((row) => row.weddings + row.corporate + row.workshops + row.other > 0);

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
  const exportRows = revenueChartData.map((item) => ({ month: item.month, revenue: item.revenue }));
  const exportTitle = `Olive Garden Analytics (${formatRangeLabel(range)})`;
  const exportSummary: ExportSummaryItem[] = [
    { label: 'Period', value: formatRangeLabel(range) },
    { label: 'Total bookings', value: String(overviewData?.total_bookings ?? 0) },
    { label: 'Total revenue', value: `KES ${(overviewData?.total_revenue ?? 0).toLocaleString('en-KE')}` },
    { label: 'New users', value: String(overviewData?.total_users ?? 0) },
    { label: 'Tracked events', value: String(overviewData?.total_events ?? 0) },
    { label: 'Months in chart', value: String(revenueChartData.length) },
  ];

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Performance"
        title="Analytics & Reports"
        description="Track performance and insights across your venues."
        actions={<button type="button" className="rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50" onClick={() => setExportOpen(true)}>Export report</button>}
      />

      <Card className="glass">
        <CardContent className="space-y-3 pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Report period</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatRangeLabel(range)} · charts and exports follow this range; the cards above reflect the current month.
            </p>
          </div>
          <DateRangePicker value={range} onChange={setRange} idPrefix="analytics-range" />
          {rangeHasNoActivity && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700" role="status">
              No bookings or revenue were recorded {range === ALL_TIME ? 'in the default window' : `between ${rangeLabel}`}. The charts below will be empty.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wider dark:text-gray-400">
                {metric.title}
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-gold-500 text-white shadow-md">
                <metric.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? (
                <CardSkeleton count={1} />
              ) : (
                <>
                  <div className="text-2xl font-bold font-serif dark:text-white">{metric.value}</div>
                  <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${
                    metric.trend === 'up' ? 'text-green-600 dark:text-emerald-300' : 'text-red-600 dark:text-rose-300'
                  }`}>
                    {metric.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {metric.change} <span className="text-gray-500 dark:text-gray-400 font-normal">vs last month</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full flex items-center justify-center">
              {isLoadingRevenue ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#8b9172]" />
              ) : !hasRevenueData ? (
                <EmptyState
                  title="No revenue in this period"
                  description={`No non-cancelled bookings fall inside ${range === ALL_TIME ? 'the default window' : rangeLabel}. Try a wider period.`}
                  actionLabel="Show all time"
                  onAction={() => setRange(ALL_TIME)}
                />
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

        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Recent Bookings by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full flex items-center justify-center">
              {isLoadingTrends ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#8b9172]" />
              ) : !hasTypeData ? (
                <EmptyState
                  title="No bookings by type in this period"
                  description={`No reservations fall inside ${range === ALL_TIME ? 'the default window' : rangeLabel}. Try a wider period.`}
                  actionLabel="Show all time"
                  onAction={() => setRange(ALL_TIME)}
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={(state) => { if (state.activeLabel) setDrillDown(state.activeLabel); }}>
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
        <Card className="glass lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Bookings by Space</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full flex items-center justify-center">
              {isLoadingTrends ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#8b9172]" />
              ) : venuePerformance.length === 0 ? (
                <EmptyState title="No bookings by space in this period" description={`No reservations fall inside ${range === ALL_TIME ? 'the default window' : rangeLabel}.`} actionLabel="Show all time" onAction={() => setRange(ALL_TIME)} />
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
                      onClick={(entry) => setDrillDown(String(entry.name || 'Venue'))}
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

        <Card className="glass lg:col-span-2">
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
                <EmptyState title="No space performance in this period" description={`No reservations fall inside ${range === ALL_TIME ? 'the default window' : rangeLabel}.`} actionLabel="Show all time" onAction={() => setRange(ALL_TIME)} />
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
      {drillDown && <div className="rounded-xl border border-[#8b9172]/30 bg-[#8b9172]/5 p-4" role="status"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Selected chart segment</p><p className="font-semibold text-gray-900">{drillDown}</p></div><button type="button" className="text-sm underline" onClick={() => setDrillDown(null)}>Back to overview</button></div></div>}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        rows={exportRows}
        filename={`olive-garden-analytics-${rangeSlug(range)}.csv`}
        title={exportTitle}
        summary={exportSummary}
      />
    </div>
  );
}
