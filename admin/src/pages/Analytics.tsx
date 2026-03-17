import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Wallet, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

export default function Analytics() {
  const metrics = [
    {
      title: 'Total Revenue',
      value: 'KES 4.2M',
      change: '+12.5%',
      trend: 'up',
      icon: Wallet,
    },
    {
      title: 'Total Bookings',
      value: '234',
      change: '+8.2%',
      trend: 'up',
      icon: Calendar,
    },
    {
      title: 'New Inquiries',
      value: '142',
      change: '+15.3%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Avg. Booking Value',
      value: 'KES 85K',
      change: '-3.1%',
      trend: 'down',
      icon: TrendingUp,
    },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 2800000 },
    { month: 'Feb', revenue: 3100000 },
    { month: 'Mar', revenue: 3500000 },
    { month: 'Apr', revenue: 3200000 },
    { month: 'May', revenue: 4100000 },
    { month: 'Jun', revenue: 4200000 },
  ];

  const bookingData = [
    { month: 'Jan', weddings: 12, corporate: 8, workshops: 15 },
    { month: 'Feb', weddings: 14, corporate: 10, workshops: 12 },
    { month: 'Mar', weddings: 18, corporate: 15, workshops: 20 },
    { month: 'Apr', weddings: 15, corporate: 12, workshops: 18 },
    { month: 'May', weddings: 22, corporate: 20, workshops: 25 },
    { month: 'Jun', weddings: 25, corporate: 18, workshops: 22 },
  ];

  const venuePerformance = [
    { name: 'Main Arena', value: 55, color: '#8b9172' },
    { name: 'Garden Hall', value: 30, color: '#a6ac8e' },
    { name: 'Therapy Room', value: 15, color: '#c1c7ab' },
  ];

  const formatCurrency = (value: number) => {
    return `KES ${(value / 1000000).toFixed(1)}M`;
  };

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
              <div className="text-2xl font-bold font-serif">{metric.value}</div>
              <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {metric.change} <span className="text-gray-500 font-normal">vs last month</span>
              </p>
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
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Bookings by Event Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="weddings" name="Weddings" stackId="a" fill="#8b9172" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="corporate" name="Corporate Events" stackId="a" fill="#b9c099" />
                  <Bar dataKey="workshops" name="Workshops & Retreats" stackId="a" fill="#e2e5d6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Revenue by Space</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
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
                    formatter={(value: number) => [`${value}%`, 'Share']}
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
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Top Performing Venues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Main Arena', bookings: 124, revenue: 'KES 2.8M', utilization: 78 },
                { name: 'Garden Hall', bookings: 68, revenue: 'KES 950K', utilization: 65 },
                { name: 'Therapy Room', bookings: 42, revenue: 'KES 450K', utilization: 92 },
              ].map((venue, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50/50 border border-border/50 rounded-xl transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{venue.name}</p>
                    <p className="text-sm text-gray-500">{venue.bookings} total bookings</p>
                  </div>
                  <div className="flex-1 text-center hidden md:block">
                    <div className="w-full max-w-[120px] mx-auto h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#8b9172] rounded-full" 
                        style={{ width: `${venue.utilization}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{venue.utilization}% utilization</p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-bold text-[#8b9172]">{venue.revenue}</p>
                    <p className="text-xs text-gray-500">Total revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
