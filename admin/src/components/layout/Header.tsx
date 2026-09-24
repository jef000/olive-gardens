import NotificationBell from '../NotificationBell';
import DarkModeToggle from '../DarkModeToggle';
import { useLocation } from 'react-router-dom';
import { ChevronRight, Menu } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const pathName = location.pathname.substring(1);
  const title = pathName
    ? pathName.split('/').pop()!.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
    : 'Dashboard';
  const descriptions: Record<string, string> = {
    Dashboard: 'A live view of venue activity and priorities',
    Users: 'Manage team access, roles, and client accounts',
    Bookings: 'Review reservations and upcoming events',
    Inquiries: 'Stay on top of guest messages and requests',
    Analytics: 'Understand performance across your venues',
    Gallery: 'Manage venue imagery and event showcases',
    Notifications: 'Review alerts and operational updates',
    Settings: 'Manage your account and security preferences',
  };

  return (
    <header role="banner" className="glass-strong fixed left-0 right-0 top-0 z-10 h-20 border-b border-gray-200/70 shadow-sm transition-all duration-200 md:left-64 dark:border-white/10">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Open navigation" className="rounded-xl p-2 text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 md:hidden" onClick={() => window.dispatchEvent(new Event('sidebar-toggle'))}><Menu className="h-5 w-5" aria-hidden="true" /></button>
          <div>
            <div className="mb-0.5 hidden items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 sm:flex">
              <span>Admin portal</span>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <span className="text-brand-600 dark:text-brand-300">{title}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold tracking-tight text-gray-900 dark:text-white">{title}</h2>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{descriptions[title] || 'Manage your portal workspace'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <DarkModeToggle />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
