import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, UserCheck, Wrench, MessageSquare,
  CalendarDays, TrendingUp, AlertTriangle, Plus, Megaphone
} from 'lucide-react';
import api from '../../services/api';
import { StatCard, Loading, ErrorState } from '../../components/ui';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';

interface DashboardStats {
  apartments: { total: number; occupied: number; vacant: number };
  residents: number;
  visitors: { pending: number; currentlyInside: number };
  complaints: { open: number };
  bookings: { upcoming: number };
  maintenance: { totalBilled: number; totalCollected: number; outstanding: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, visitorsRes, complaintsRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/visitors?limit=5'),
        api.get('/complaints?limit=5'),
      ]);

      setStats(statsRes.data.data);
      setRecentVisitors(visitorsRes.data.data || []);
      setRecentComplaints(complaintsRes.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <Loading fullPage text="Loading dashboard metrics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboardData} />;

  const occupancyRate = stats?.apartments.total
    ? Math.round((stats.apartments.occupied / stats.apartments.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-brand-700 to-indigo-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Society Operations Overview</h1>
          <p className="text-brand-100 text-sm mt-1">
            Real-time status of apartments, visitors, complaints, and collections.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link to="/admin/announcements" className="btn bg-white/10 hover:bg-white/20 text-white text-sm backdrop-blur-sm border border-white/20">
            <Megaphone className="w-4 h-4 mr-1.5" /> Post Notice
          </Link>
          <Link to="/admin/residents" className="btn bg-white text-brand-900 hover:bg-brand-50 text-sm font-semibold shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" /> New Resident
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Occupancy"
          value={`${occupancyRate}%`}
          change={`${stats?.apartments.occupied} / ${stats?.apartments.total} units`}
          changeType="neutral"
          icon={<Building2 className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Active Residents"
          value={stats?.residents || 0}
          change="Registered"
          changeType="up"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Inside Campus"
          value={stats?.visitors.currentlyInside || 0}
          change={`${stats?.visitors.pending || 0} pending gate`}
          changeType="neutral"
          icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Open Complaints"
          value={stats?.complaints.open || 0}
          change={stats?.complaints.open ? 'Requires attention' : 'All clear'}
          changeType={stats?.complaints.open ? 'down' : 'up'}
          icon={<MessageSquare className="w-5 h-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Upcoming Bookings"
          value={stats?.bookings.upcoming || 0}
          change="Amenity slots"
          changeType="neutral"
          icon={<CalendarDays className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50"
        />
        <StatCard
          title="Outstanding Due"
          value={`₹${(stats?.maintenance.outstanding || 0).toLocaleString()}`}
          change={`₹${(stats?.maintenance.totalCollected || 0).toLocaleString()} collected`}
          changeType="down"
          icon={<Wrench className="w-5 h-5 text-rose-600" />}
          iconBg="bg-rose-50"
        />
      </div>

      {/* Grid: Recent Visitors & Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visitors */}
        <div className="card">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Gate Entries</h2>
              <p className="text-xs text-gray-500">Live visitor flow log</p>
            </div>
            <Link to="/admin/visitors" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              View All &rarr;
            </Link>
          </div>
          <div className="divide-y divide-gray-100 mt-2">
            {recentVisitors.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No recent visitors logged</p>
            ) : (
              recentVisitors.map((v) => {
                const displayName = v.visitorName || v.name || 'Visitor';
                return (
                  <div key={v.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-600">
                        {displayName[0]?.toUpperCase() || 'V'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500">
                          To Apt {v.apartment?.unitNumber || 'N/A'} • {v.visitorType}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={v.status} />
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="card">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Complaints</h2>
              <p className="text-xs text-gray-500">Resident reported tickets</p>
            </div>
            <Link to="/admin/complaints" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              View All &rarr;
            </Link>
          </div>
          <div className="divide-y divide-gray-100 mt-2">
            {recentComplaints.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No open complaints found</p>
            ) : (
              recentComplaints.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{c.title}</p>
                      <p className="text-xs text-gray-500">
                        {c.category} • Apt {c.residentProfile?.apartment?.unitNumber || c.apartment?.unitNumber || 'Common Area'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Summary Bar */}
      <div className="card bg-gray-50 border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Annual Maintenance Collection Rate
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Collected ₹{(stats?.maintenance.totalCollected || 0).toLocaleString()} out of ₹{(stats?.maintenance.totalBilled || 0).toLocaleString()} billed this year.
            </p>
          </div>
          <Link to="/admin/maintenance" className="btn-primary text-xs self-start md:self-auto">
            Manage Maintenance &rarr;
          </Link>
        </div>
        {stats && stats.maintenance.totalBilled > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((stats.maintenance.totalCollected / stats.maintenance.totalBilled) * 100)
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1.5 font-medium">
              <span>{Math.round((stats.maintenance.totalCollected / stats.maintenance.totalBilled) * 100)}% Collected</span>
              <span className="text-rose-600">Pending: ₹{stats.maintenance.outstanding.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
