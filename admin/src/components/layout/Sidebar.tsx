import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BarChart3, 
  Image,
  Bell,
  Settings,
  Tag,
  LogOut,
  Leaf,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

interface SidebarMetrics {
  pending_bookings: number;
  new_inquiries: number;
}

const navigation = [
  {
    label: 'Workspace',
    items: [{ name: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Users', href: '/users', icon: Users },
      { name: 'Bookings', href: '/bookings', icon: Calendar, badgeKey: 'pending_bookings' },
      { name: 'Inquiries', href: '/inquiries', icon: MessageSquare, badgeKey: 'new_inquiries' },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Gallery', href: '/gallery', icon: Image },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Pricing', href: '/pricing', icon: Tag },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen((value) => !value);
    const close = () => setOpen(false);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('sidebar-toggle', toggle);
    window.addEventListener('sidebar-close', close);
    window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('sidebar-toggle', toggle); window.removeEventListener('sidebar-close', close); window.removeEventListener('keydown', escape); };
  }, []);
  
  const { data: metrics } = useQuery({
    queryKey: ['sidebar', 'metrics'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<SidebarMetrics>>('/analytics/sidebar');
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const getBadgeCount = (key?: string) => {
    if (!key || !metrics) return null;
    const count = metrics[key as keyof SidebarMetrics];
    return count > 0 ? count : null;
  };

  return (
    <>
      {open && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
    <aside id="main-navigation" role="navigation" aria-label="Main navigation" className={cn('flex flex-col w-64 h-screen fixed left-0 top-0 z-30 border-r border-white/10 bg-[#1c241c] text-gray-300 shadow-2xl shadow-black/30 transition-transform duration-200 md:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex items-center gap-3 h-20 px-6 border-b border-white/10">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-gold-500 text-white shadow-lg shadow-brand-900/40">
          <Leaf className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-serif font-bold tracking-tight text-white">Olive Garden</h1>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300/70">Operations portal</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
        <nav className="space-y-7" aria-label="Portal sections">
          {navigation.map((section) => (
            <div key={section.label} role="group" aria-label={section.label}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{section.label}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  const badgeCount = getBadgeCount(item.badgeKey);

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group relative flex min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-brand-500/25 to-brand-400/5 font-semibold text-white shadow-inner'
                          : 'text-white/55 hover:bg-white/5 hover:text-white'
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-300 to-gold-400" aria-hidden="true" />}
                      <span className="flex items-center gap-3">
                        <item.icon className={cn(
                          'h-[18px] w-[18px] transition-colors',
                          isActive ? 'text-gold-300' : 'text-white/40 group-hover:text-white/80'
                        )} aria-hidden="true" />
                        <span>{item.name}</span>
                      </span>
                      {badgeCount ? (
                        <span className={cn(
                          'min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold',
                          isActive
                            ? 'bg-gold-400 text-brand-950'
                            : 'bg-amber-400/20 text-amber-300'
                        )}>
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 bg-black/20 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-md">
            {user?.email ? user.email.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user?.email ? user.email.split('@')[0] : 'Admin'}</p>
            <p className="mt-0.5 text-[11px] font-medium capitalize text-brand-300/70">{user?.role || 'Admin'} account</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
