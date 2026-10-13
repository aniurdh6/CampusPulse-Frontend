import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { api } from './lib/api.js';
import { useRoute } from './lib/router.js';
import { useLoad } from './lib/useLoad.js';
import Sidebar from './components/Sidebar.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Book from './pages/Book.jsx';
import Recommend from './pages/Recommend.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Analytics from './pages/Analytics.jsx';
import Notifications from './pages/Notifications.jsx';
import ManageResources from './pages/ManageResources.jsx';
import Users from './pages/Users.jsx';
import Activity from './pages/Activity.jsx';
import Approvals from './pages/Approvals.jsx';

const ROUTES = [
  { path: '/', label: 'Dashboard', page: Dashboard },
  { path: '/book', label: 'Book a resource', page: Book },
  { path: '/recommend', label: 'Find a match', page: Recommend },
  { path: '/bookings', label: 'Bookings', page: MyBookings },
  { path: '/maintenance', label: 'Maintenance', page: Maintenance },
  { path: '/analytics', label: 'Analytics', page: Analytics, roles: ['FACULTY', 'ADMIN'] },
  { path: '/notifications', label: 'Notifications', page: Notifications },
  { path: '/admin/approvals', label: 'Booking requests', page: Approvals, roles: ['ADMIN'], admin: true },
  { path: '/admin/resources', label: 'Resources', page: ManageResources, roles: ['ADMIN'], admin: true },
  { path: '/admin/users', label: 'Users', page: Users, roles: ['ADMIN'], admin: true },
  { path: '/admin/activity', label: 'Activity log', page: Activity, roles: ['ADMIN'], admin: true },
];

function Shell() {
  const { user, logout } = useAuth();
  const route = useRoute();

  const allowed = ROUTES.filter((r) => !r.roles || r.roles.includes(user.role));
  const current = allowed.find((r) => r.path === route.path) || allowed[0];
  const Page = current.page;

  const unread = useLoad(() => api.notifications.unreadCount(), [route.path]);
  const pending = useLoad(
    () => (user.role === 'ADMIN' ? api.bookings.pending() : Promise.resolve([])),
    [route.path, user.role]
  );
  useEffect(() => {
    const timer = setInterval(() => { unread.reload(); pending.reload(); }, 30000);
    return () => clearInterval(timer);
  }, [unread.reload, pending.reload]);

  return (
    <div className="shell">
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <Sidebar
        routes={allowed}
        currentPath={current.path}
        user={user}
        unread={unread.data?.count || 0}
        pending={pending.data?.length || 0}
        onLogout={logout}
      />
      <main id="main" className="main" tabIndex={-1}>
        <Page key={current.path} route={route} refreshUnread={unread.reload} refreshPending={pending.reload} />
      </main>
    </div>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return <p className="boot" role="status">Loading CampusPulse...</p>;
  return user ? <Shell /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Gate />
      </ToastProvider>
    </AuthProvider>
  );
}
