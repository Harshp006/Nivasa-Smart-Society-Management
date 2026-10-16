import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, Users, Car, UserCheck, CreditCard,
  MessageSquare, Dumbbell, CalendarDays, Megaphone, Bell, LogOut, Menu, X, Home
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const navItems = [
  { to: '/resident/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resident/profile', icon: User, label: 'My Profile' },
  { to: '/resident/family', icon: Users, label: 'Family' },
  { to: '/resident/vehicles', icon: Car, label: 'Vehicles' },
  { to: '/resident/visitors', icon: UserCheck, label: 'Visitors' },
  { to: '/resident/maintenance', icon: CreditCard, label: 'Maintenance' },
  { to: '/resident/complaints', icon: MessageSquare, label: 'Complaints' },
  { to: '/resident/amenities', icon: Dumbbell, label: 'Amenities' },
  { to: '/resident/bookings', icon: CalendarDays, label: 'My Bookings' },
  { to: '/resident/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/resident/notifications', icon: Bell, label: 'Notifications' },
];

export default function ResidentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
          <Home className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Nivasa</p>
          <p className="text-xs text-gray-500">Resident Portal</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <div className="px-2 py-2 mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-gray-500 truncate">{user?.residentProfile?.apartment ? `${user.residentProfile.apartment.building} - ${user.residentProfile.apartment.unitNumber}` : user?.email}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-200">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-white border-r border-gray-200">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-700">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.firstName} {user?.lastName}</span>
            <span className="badge badge-success text-xs">Resident</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
