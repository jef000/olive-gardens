import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth';
import { useAuth } from './lib/auth';
import { queryClient } from './lib/queryClient';
import { refreshSession } from './lib/api';
import { sessionManager } from './lib/sessionManager';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Toaster from './components/ui/toaster';
import ConfirmDialogHost from './components/ConfirmDialogHost';
import ErrorBoundary from './components/ErrorBoundary';
import SkipLinks from './components/layout/SkipLinks';
import SessionTimeoutWarning from './components/auth/SessionTimeoutWarning';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import CommandPalette from './components/CommandPalette';
import { registerKeyboardShortcuts } from './lib/keyboardShortcuts';
import { useNavigate } from 'react-router-dom';
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Inquiries = lazy(() => import('./pages/Inquiries'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Settings = lazy(() => import('./pages/Settings'));

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main id="main-content" className="min-h-screen px-4 pb-10 pt-28 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

function SessionGuard() {
  const { user, logout } = useAuth();
  const [warningMs, setWarningMs] = useState<number | null>(null);
  useEffect(() => {
    if (!user) { sessionManager.stop(); return; }
    sessionManager.start({ onWarning: setWarningMs, onTimeout: logout, extend: refreshSession });
    return () => sessionManager.stop();
  }, [user, logout]);
  if (!warningMs) return null;
  return <SessionTimeoutWarning remainingMs={warningMs} onExtend={() => { void sessionManager.extendSession().then(() => setWarningMs(null)); }} onLogout={logout} />;
}

function KeyboardShortcutGuard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => registerKeyboardShortcuts([
    { key: 'b', label: 'Bookings', ctrlOrMeta: true, action: () => navigate('/bookings') },
    { key: 'u', label: 'Users', ctrlOrMeta: true, action: () => navigate('/users') },
    { key: '?', label: 'Shortcuts', action: () => setOpen(true) },
  ]), [navigate]);
  return <KeyboardShortcutsHelp open={open} onOpenChange={setOpen} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SkipLinks />
          <SessionGuard />
          <KeyboardShortcutGuard />
          <Toaster />
          <ConfirmDialogHost />
          <ErrorBoundary>
          <Suspense fallback={<div className="grid min-h-screen place-items-center text-gray-500" role="status">Loading…</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Users />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Bookings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gallery"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Gallery />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Notifications />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inquiries"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Inquiries />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Pricing />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
