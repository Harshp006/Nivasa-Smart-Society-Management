import { useEffect, useState } from 'react';
import {
  BarChart3, TrendingUp, Users, MessageSquare,
  UserCheck, Calendar, ArrowUpRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, StatCard } from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [maintenanceReport, setMaintenanceReport] = useState<any | null>(null);
  const [complaintReport, setComplaintReport] = useState<any | null>(null);
  const [visitorReport, setVisitorReport] = useState<any | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [mRes, cRes, vRes] = await Promise.all([
        api.get(`/reports/maintenance?year=${selectedYear}`),
        api.get('/reports/complaints'),
        api.get('/reports/visitors'),
      ]);

      setMaintenanceReport(mRes.data.data);
      setComplaintReport(cRes.data.data);
      setVisitorReport(vRes.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedYear]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) return <Loading fullPage text="Compiling financial and operations reports..." />;

  const totalBilled = Number(maintenanceReport?.summary?._sum?.amount || 0);
  const totalPaid = Number(maintenanceReport?.summary?._sum?.paidAmount || 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Intelligence"
        description="Comprehensive audit reports across finance, security, and facility maintenance"
        action={
          <div className="flex items-center gap-2">
            <label htmlFor="report-year" className="text-xs font-semibold text-gray-500">Year:</label>
            <select
              id="report-year"
              className="select text-sm w-32"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Maintenance Collection Efficiency"
          value={`${collectionRate}%`}
          change={`₹${totalPaid.toLocaleString()} of ₹${totalBilled.toLocaleString()}`}
          changeType={collectionRate > 80 ? 'up' : 'neutral'}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Total Visitors Logged"
          value={visitorReport?.total || 0}
          change="Gate interactions"
          changeType="neutral"
          icon={<UserCheck className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Tickets Resolved"
          value={
            complaintReport?.byStatus?.find((s: any) => s.status === 'RESOLVED')?._count || 0
          }
          change="Complaints handled"
          changeType="up"
          icon={<CheckCircle2 className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50"
        />
      </div>

      {/* Financial Section */}
      <div className="card">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Annual Financial Invoicing Breakdown ({selectedYear})</h2>
            <p className="text-xs text-gray-500">Monthly invoice aggregation and collection status</p>
          </div>
        </div>

        {maintenanceReport?.bills?.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No invoices recorded for {selectedYear}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table text-xs">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Status</th>
                  <th>Invoiced Count</th>
                  <th>Billed Amount</th>
                  <th>Paid Amount</th>
                  <th>Recovery Rate</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceReport?.bills?.map((b: any, idx: number) => {
                  const amt = Number(b._sum?.amount || 0);
                  const paid = Number(b._sum?.paidAmount || 0);
                  const rate = amt > 0 ? Math.round((paid / amt) * 100) : 0;
                  return (
                    <tr key={idx}>
                      <td className="font-semibold text-gray-800">
                        {monthNames[b.billingMonth - 1] || `Month ${b.billingMonth}`}
                      </td>
                      <td>
                        <span className="badge badge-gray text-[10px]">{b.status}</span>
                      </td>
                      <td>{b._count} bills</td>
                      <td className="font-medium text-gray-900">₹{amt.toLocaleString()}</td>
                      <td className="font-semibold text-emerald-700">₹{paid.toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, rate)}%` }} />
                          </div>
                          <span className="font-mono text-[11px]">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid: Complaints and Visitors Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Complaints Analytics */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-1">Complaints by Category</h2>
          <p className="text-xs text-gray-500 mb-4">Issues reported by residents</p>

          <div className="space-y-3">
            {complaintReport?.byCategory?.map((cat: any) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">{cat.category}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{cat._count} tickets</span>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-2">By Priority</h3>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {complaintReport?.byPriority?.map((p: any) => (
              <div key={p.priority} className="bg-gray-50 p-2 rounded-lg">
                <p className="font-bold text-gray-900">{p._count}</p>
                <p className="text-[10px] text-gray-500 uppercase">{p.priority}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Visitors Demographics */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-1">Visitor Types & Inflow</h2>
          <p className="text-xs text-gray-500 mb-4">Breakdown of gate pass categories</p>

          <div className="space-y-3">
            {visitorReport?.byType?.map((t: any) => (
              <div key={t.visitorType} className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">{t.visitorType}</span>
                <span className="font-bold text-gray-900">{t._count} entries</span>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-2">Status Distribution</h3>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {visitorReport?.byStatus?.map((s: any) => (
              <div key={s.status} className="bg-gray-50 p-2 rounded-lg">
                <p className="font-bold text-gray-900">{s._count}</p>
                <p className="text-[10px] text-gray-500 uppercase">{s.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
