import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

export default function Analytics() {
  const metrics = [
    {
      title: 'Total Revenue',
      value: '$45,678',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Total Bookings',
      value: '234',
      change: '+8.2%',
      trend: 'up',
      icon: Calendar,
    },
    {
      title: 'New Users',
      value: '1,234',
      change: '+15.3%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Avg. Booking Value',
      value: '$195',
      change: '+3.1%',
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-2">Track performance and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <metric.icon className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-green-600 mt-1">
                {metric.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart placeholder - Install Recharts to display</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart placeholder - Install Recharts to display</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Venues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Main Arena', bookings: 45, revenue: '$15,000' },
              { name: 'Garden Space', bookings: 38, revenue: '$12,500' },
              { name: 'VIP Lounge', bookings: 32, revenue: '$10,200' },
            ].map((venue, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{venue.name}</p>
                  <p className="text-sm text-gray-600">{venue.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{venue.revenue}</p>
                  <p className="text-xs text-gray-600">Total revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
