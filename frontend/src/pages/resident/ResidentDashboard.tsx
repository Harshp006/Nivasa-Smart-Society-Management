import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, Users, Car, UserCheck, CreditCard, MessageSquare,
  CalendarDays, Megaphone, Bell, CheckCircle2, XCircle, Clock,
  ArrowRight, ShieldCheck, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Loading, ErrorState, StatCard } from '../../components/ui';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [pendingVisitors, setPendingVisitors] = useState<any[]>([]);
  const [unpaidBills, setUnpaidBills] = useState<any[]>([]);
  const [activeComplaints, setActiveComplaints] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profRes, visRes, billsRes, compRes, annRes] = await Promise.all([
        api.get('/residents/me'),
        api.get('/visitors?status=PENDING&limit=5'),
        api.get('/maintenance?limit=5'),
        api.get('/complaints?limit=5'),
        api.get('/announcements?limit=3'),
      ]);

      setProfile(profRes.data.data);
      setPendingVisitors(visRes.data.data || []);
      const bills = billsRes.data.data || [];
      setUnpaidBills(bills.filter((b: any) => b.status !== 'PAID'));
      setActiveComplaints((compRes.data.data || []).filter((c: any) => c.status !== 'CLOSED'));
      setAnnouncements(annRes.data.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleVisitorDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/visitors/${id}/approve`, { decision });
      toast.success(`Visitor ${decision.toLowerCase()}`);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update visitor');
    }
  };

  if (loading) return <Loading fullPage text="Loading your resident portal..." />;

  const totalOutstanding = unpaidBills.reduce(
    (acc, b) => acc + (Number(b.amount) - Number(b.paidAmount)),
    0
  );

  return (
    <div className="space-y-6">
      {/* Resident Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge bg-white/20 text-white font-medium text-xs">
              {profile?.residentType || 'Resident'}
            </span>
            <span className="text-emerald-200 text-xs font-medium">
              Unit {profile?.apartment?.building} - {profile?.apartment?.unitNumber}
            </span>
          </div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-emerald-100 text-xs mt-1">
            Society community & home management hub
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link to="/resident/visitors" className="btn bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-semibold shadow-sm">
            <UserCheck className="w-4 h-4 mr-1.5" /> Pre-Invite Guest
          </Link>
          <Link to="/resident/complaints" className="btn bg-white/10 hover:bg-white/20 text-white text-xs border border-white/20">
            <MessageSquare className="w-4 h-4 mr-1.5" /> Report Issue
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gate Approvals"
          value={pendingVisitors.length}
          change={pendingVisitors.length > 0 ? 'Action required' : 'No guests waiting'}
          changeType={pendingVisitors.length > 0 ? 'down' : 'neutral'}
          icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Maintenance Due"
          value={`₹${totalOutstanding.toLocaleString()}`}
          change={totalOutstanding > 0 ? 'Pending invoice' : 'All clear'}
          changeType={totalOutstanding > 0 ? 'down' : 'up'}
          icon={<CreditCard className="w-5 h-5 text-rose-600" />}
          iconBg="bg-rose-50"
        />
        <StatCard
          title="Active Tickets"
          value={activeComplaints.length}
          change="Open complaints"
          changeType="neutral"
          icon={<MessageSquare className="w-5 h-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Family & Vehicles"
          value={`${profile?.familyMembers?.length || 0} / ${profile?.vehicles?.length || 0}`}
          change="Registered"
          changeType="neutral"
          icon={<Users className="w-5 h-5 text-teal-600" />}
          iconBg="bg-teal-50"
        />
      </div>

      {/* Pending Visitors Action Needed */}
      {pendingVisitors.length > 0 && (
        <div className="card border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Guests Awaiting Gate Clearance
          </div>
          <div className="divide-y divide-amber-200/60">
            {pendingVisitors.map((v) => (
              <div key={v.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{v.visitorName}</p>
                  <p className="text-xs text-gray-600">
                    {v.visitorType} • {v.purpose} • Pass: <span className="font-mono font-bold">{v.passCode}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVisitorDecision(v.id, 'APPROVED')}
                    className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                  </button>
                  <button
                    onClick={() => handleVisitorDecision(v.id, 'REJECTED')}
                    className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white text-xs px-3"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Deny Entry
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Maintenance Due & Notice Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outstanding Bills */}
        <div className="card">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Maintenance Bills</h2>
              <p className="text-xs text-gray-500">Invoices for your apartment unit</p>
            </div>
            <Link to="/resident/maintenance" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
              View All &rarr;
            </Link>
          </div>

          {unpaidBills.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All maintenance payments are up to date!
            </div>
          ) : (
            <div className="space-y-3">
              {unpaidBills.map((b) => (
                <div key={b.id} className="border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Cycle: Month {b.billingMonth}, {b.billingYear}
                    </p>
                    <p className="text-xs text-gray-500">
                      Due by {new Date(b.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-600">
                      ₹{(Number(b.amount) - Number(b.paidAmount)).toLocaleString()}
                    </p>
                    <Link to="/resident/maintenance" className="text-xs text-brand-600 underline mt-0.5 inline-block">
                      Pay Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="card">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Notice Board</h2>
              <p className="text-xs text-gray-500">Latest society circulars</p>
            </div>
            <Link to="/resident/announcements" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
              All Notices &rarr;
            </Link>
          </div>

          {announcements.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No current circulars</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="border-l-2 border-brand-500 pl-3 py-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-xs">{a.title}</h3>
                    <span className="text-[10px] text-gray-400">
                      {new Date(a.publishedAt || a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
