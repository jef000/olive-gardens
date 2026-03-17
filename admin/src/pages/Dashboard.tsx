import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Wallet, HeartHandshake, MapPin, Tent } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const stats = [
    {
      title: 'Total Inquiries',
      value: '142',
      icon: Users,
      change: '+12%',
      changeType: 'positive' as const,
      description: 'from last month',
    },
    {
      title: 'Confirmed Bookings',
      value: '48',
      icon: Calendar,
      change: '+8%',
      changeType: 'positive' as const,
      description: 'from last month',
    },
    {
      title: 'Revenue (Est.)',
      value: 'KES 4.2M',
      icon: Wallet,
      change: '+15%',
      changeType: 'positive' as const,
      description: 'from last month',
    },
    {
      title: 'Counselling Sessions',
      value: '36',
      icon: HeartHandshake,
      change: '-2%',
      changeType: 'negative' as const,
      description: 'from last month',
    },
  ];

  const recentBookings = [
    { id: '1', name: 'Njiru Wedding', space: 'Main Arena', date: new Date(new Date().setDate(new Date().getDate() + 3)), status: 'booked', type: 'Wedding' },
    { id: '2', name: 'Corporate Event', space: 'Main Arena', date: new Date(new Date().setDate(new Date().getDate() + 10)), status: 'tentative', type: 'Corporate' },
    { id: '3', name: 'Training Workshop', space: 'Garden Hall', date: new Date(new Date().setDate(new Date().getDate() + 2)), status: 'booked', type: 'Workshop' },
    { id: '4', name: 'Session', space: 'Therapy Room', date: new Date(new Date().setDate(new Date().getDate() + 1)), status: 'booked', type: 'Counselling' },
  ];

  const venueStats = [
    { name: 'Main Arena', capacity: 500, utilization: 78, icon: Tent },
    { name: 'Garden Hall', capacity: 120, utilization: 65, icon: MapPin },
    { name: 'Therapy Room', capacity: 6, utilization: 92, icon: HeartHandshake },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-gray-900">Welcome to Olive Garden</h1>
        <p className="text-gray-600 mt-2 font-light">Overview of your venue reservations and operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-[#8b9172]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">{stat.value}</div>
              <p className={`text-xs mt-1 font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change} <span className="text-gray-500 font-normal">{stat.description}</span>
              </p>
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
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-[#8b9172]/10 text-[#8b9172] flex flex-col items-center justify-center font-medium">
                      <span className="text-xs uppercase leading-none">{format(booking.date, 'MMM')}</span>
                      <span className="text-lg leading-none mt-1">{format(booking.date, 'dd')}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{booking.name}</p>
                      <p className="text-sm text-gray-500">{booking.space} • {booking.type}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    booking.status === 'booked' 
                      ? 'bg-[#8b9172]/15 text-[#8b9172]' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status === 'booked' ? 'Confirmed' : 'Tentative'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="font-serif text-xl">Space Utilization</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
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
                      className="h-full bg-[#8b9172] rounded-full" 
                      style={{ width: `${space.utilization}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-right">Capacity: {space.capacity}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
