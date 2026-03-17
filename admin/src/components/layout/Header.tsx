import NotificationBell from '../NotificationBell';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Welcome to Admin Dashboard
        </h2>
        <div className="flex items-center gap-4">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
