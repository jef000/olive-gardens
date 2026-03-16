import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, Clock } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      icon: Users,
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Total Bookings',
      value: '456',
      icon: Calendar,
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Revenue',
      value: '$45,678',
      icon: DollarSign,
      change: '+15%',
      changeType: 'positive' as const,
    },
    {
      title: 'Pending',
      value: '23',
      icon: Clock,
      change: '-5%',
      changeType: 'negative' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your admin panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs mt-1 ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">Booking #{i}234</p>
                    <p className="text-sm text-gray-600">Main Arena - 2024-03-{20 + i}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b last:border-0">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium">U{i}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">user{i}@example.com</p>
                    <p className="text-sm text-gray-600">Joined 2024-03-{20 + i}</p>
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
