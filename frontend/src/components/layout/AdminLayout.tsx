import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, UserCheck, Wrench, MessageSquare,
  Dumbbell, CalendarDays, Megaphone, BarChart3, Shield, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Home
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/residents', icon: Users, label: 'Residents' },
  { to: '/admin/apartments', icon: Building2, label: 'Apartments' },
  { to: '/admin/visitors', icon: UserCheck, label: 'Visitors' },
  { to: '/admin/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/admin/complaints', icon: MessageSquare, label: 'Complaints' },
  { to: '/admin/amenities', icon: Dumbbell, label: 'Amenities' },
  { to: '/admin/bookings', icon: CalendarDays, label: 'Bookings' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/audit-logs', icon: Shield, label: 'Audit Logs' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 px-4 py-5 border-b border-gray-100', collapsed && 'justify-center')}>
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Home className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-gray-900">Nivasa</p>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx('sidebar-link', isActive && 'active', collapsed && 'justify-center px-2')
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className={clsx('border-t border-gray-100 p-3', collapsed && 'flex flex-col items-center')}>
        {!collapsed && (
          <div className="px-2 py-2 mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={clsx(
        'hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-full top-20 -ml-3 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-gray-600" /> : <ChevronLeft className="w-3 h-3 text-gray-600" />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-white border-r border-gray-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-brand-700">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="badge badge-purple text-xs">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
