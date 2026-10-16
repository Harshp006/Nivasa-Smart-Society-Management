import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ui';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import ResidentLayout from './components/layout/ResidentLayout';
import SecurityLayout from './components/layout/SecurityLayout';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminResidents from './pages/admin/AdminResidents';
import AdminApartments from './pages/admin/AdminApartments';
import AdminVisitors from './pages/admin/AdminVisitors';
import AdminMaintenance from './pages/admin/AdminMaintenance';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminAmenities from './pages/admin/AdminAmenities';
import AdminBookings from './pages/admin/AdminBookings';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminReports from './pages/admin/AdminReports';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

// Resident pages
import ResidentDashboard from './pages/resident/ResidentDashboard';
import ResidentProfile from './pages/resident/ResidentProfile';
import ResidentFamily from './pages/resident/ResidentFamily';
import ResidentVehicles from './pages/resident/ResidentVehicles';
import ResidentVisitors from './pages/resident/ResidentVisitors';
import ResidentMaintenance from './pages/resident/ResidentMaintenance';
import ResidentComplaints from './pages/resident/ResidentComplaints';
import ResidentAmenities from './pages/resident/ResidentAmenities';
import ResidentBookings from './pages/resident/ResidentBookings';
import ResidentAnnouncements from './pages/resident/ResidentAnnouncements';
import ResidentNotifications from './pages/resident/ResidentNotifications';

// Security pages
import SecurityDashboard from './pages/security/SecurityDashboard';
import SecurityVisitors from './pages/security/SecurityVisitors';
import SecurityGateLog from './pages/security/SecurityGateLog';
import SecurityCurrentVisitors from './pages/security/SecurityCurrentVisitors';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={getDashboardPath(user.role)} replace />;

  return <>{children}</>;
}

function getDashboardPath(role: string) {
  switch (role) {
    case 'ADMIN': return '/admin/dashboard';
    case 'RESIDENT': return '/resident/dashboard';
    case 'SECURITY': return '/security/dashboard';
    default: return '/login';
  }
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardPath(user.role)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="residents" element={<AdminResidents />} />
              <Route path="apartments" element={<AdminApartments />} />
              <Route path="visitors" element={<AdminVisitors />} />
              <Route path="maintenance" element={<AdminMaintenance />} />
              <Route path="complaints" element={<AdminComplaints />} />
              <Route path="amenities" element={<AdminAmenities />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>

            {/* Resident Routes */}
            <Route path="/resident" element={
              <ProtectedRoute allowedRoles={['RESIDENT']}>
                <ResidentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ResidentDashboard />} />
              <Route path="profile" element={<ResidentProfile />} />
              <Route path="family" element={<ResidentFamily />} />
              <Route path="vehicles" element={<ResidentVehicles />} />
              <Route path="visitors" element={<ResidentVisitors />} />
              <Route path="maintenance" element={<ResidentMaintenance />} />
              <Route path="complaints" element={<ResidentComplaints />} />
              <Route path="amenities" element={<ResidentAmenities />} />
              <Route path="bookings" element={<ResidentBookings />} />
              <Route path="announcements" element={<ResidentAnnouncements />} />
              <Route path="notifications" element={<ResidentNotifications />} />
            </Route>

            {/* Security Routes */}
            <Route path="/security" element={
              <ProtectedRoute allowedRoles={['SECURITY']}>
                <SecurityLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SecurityDashboard />} />
              <Route path="visitors" element={<SecurityVisitors />} />
              <Route path="gate-log" element={<SecurityGateLog />} />
              <Route path="current-visitors" element={<SecurityCurrentVisitors />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
