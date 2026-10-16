import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserCheck, BookOpen, Users, LogOut, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const navItems = [
  { to: '/security/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/security/visitors', icon: UserCheck, label: 'Visitors' },
  { to: '/security/current-visitors', icon: Users, label: 'Inside Now' },
  { to: '/security/gate-log', icon: BookOpen, label: 'Gate Log' },
];

export default function SecurityLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Nivasa</p>
          <p className="text-xs text-gray-500">Security Portal</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
            className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}>
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <div className="px-2 py-2 mb-1">
          <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-gray-500">Security Staff</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full">
          <LogOut className="w-4 h-4" />Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200"><SidebarContent /></aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-56 h-full bg-white border-r">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4"><X className="w-5 h-5" /></button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-blue-700">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            </div>
            <span className="badge badge-info text-xs">Security</span>
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
