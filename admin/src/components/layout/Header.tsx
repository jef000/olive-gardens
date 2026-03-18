import NotificationBell from '../NotificationBell';
import { useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const pathName = location.pathname.substring(1);
  const title = pathName ? pathName.charAt(0).toUpperCase() + pathName.slice(1) : 'Dashboard';

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 fixed top-0 right-0 left-64 z-10 shadow-sm transition-all duration-200">
      <div className="h-full px-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage your {title.toLowerCase()} and settings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
