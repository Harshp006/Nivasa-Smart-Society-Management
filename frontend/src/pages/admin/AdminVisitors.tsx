import { useEffect, useState } from 'react';
import {
  UserCheck, Plus, Search, Filter, CheckCircle, XCircle,
  Clock, ShieldAlert, Key, X, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, Pagination } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminVisitors() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Pre-register visitor modal
  const [apartments, setApartments] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorType: 'GUEST',
    purpose: '',
    vehicleNumber: '',
    apartmentId: '',
    expectedDate: new Date().toISOString().split('T')[0],
  });

  const fetchVisitors = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/visitors', { params });
      setVisitors(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  };

  const fetchApartments = async () => {
    try {
      const res = await api.get('/apartments?limit=100');
      setApartments(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVisitors(1);
    fetchApartments();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVisitors(1);
  };

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/visitors/${id}/approve`, { decision });
      toast.success(`Visitor ${decision.toLowerCase()} successfully`);
      fetchVisitors(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update visitor status');
    }
  };

  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    const apt = apartments.find((a) => a.id === formData.apartmentId);
    const residentProfileId = apt?.residentProfiles?.[0]?.id;

    if (!residentProfileId) {
      toast.error('The selected apartment does not have an active resident profile');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/visitors', {
        ...formData,
        residentProfileId,
      });
      toast.success('Visitor pre-registered successfully');
      setShowAddModal(false);
      setFormData({
        visitorName: '',
        visitorPhone: '',
        visitorType: 'GUEST',
        purpose: '',
        vehicleNumber: '',
        apartmentId: '',
        expectedDate: new Date().toISOString().split('T')[0],
      });
      fetchVisitors(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to register visitor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitor Management"
        description="Monitor society entries, visitor approvals, and security passes"
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Pre-register Guest
          </button>
        }
      />

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search visitor name, pass code, or phone..."
                className="input pl-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-secondary btn-sm">Search</button>
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="select text-sm w-full md:w-44"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="CHECKED_IN">Inside Campus</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading visitor records..." />
        ) : visitors.length === 0 ? (
          <EmptyState
            icon={<UserCheck className="w-12 h-12" />}
            title="No visitor records found"
            description="Guest approvals and logs will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Pass Code</th>
                  <th>Destination Unit</th>
                  <th>Type & Purpose</th>
                  <th>Expected Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div>
                        <p className="font-semibold text-gray-900">{v.visitorName}</p>
                        <p className="text-xs text-gray-500">{v.visitorPhone || 'No contact'}</p>
                        {v.vehicleNumber && (
                          <span className="text-[11px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                            {v.vehicleNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="inline-flex items-center gap-1.5 font-mono font-bold text-xs bg-indigo-50 text-brand-700 px-2 py-1 rounded-md border border-brand-100">
                        <Key className="w-3 h-3" />
                        {v.passCode}
                      </div>
                    </td>
                    <td>
                      <p className="font-medium text-gray-900">
                        {v.apartment ? `${v.apartment.building} - ${v.apartment.unitNumber}` : 'N/A'}
                      </p>
                      {v.residentProfile?.user && (
                        <p className="text-xs text-gray-500">
                          Host: {v.residentProfile.user.firstName}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-gray text-xs">{v.visitorType}</span>
                      <p className="text-xs text-gray-600 mt-0.5 max-w-xs truncate">{v.purpose}</p>
                    </td>
                    <td>
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(v.expectedDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="text-right">
                      {v.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDecision(v.id, 'APPROVED')}
                            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 text-xs px-2.5 py-1"
                            title="Approve visitor"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleDecision(v.id, 'REJECTED')}
                            className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 text-xs px-2.5 py-1"
                            title="Reject visitor"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No action needed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={pagination} onPageChange={(p) => fetchVisitors(p)} />
      </div>

      {/* Add Visitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Pre-Register Guest</h2>
            <p className="text-xs text-gray-500 mb-4">Generate an entry gate pass code</p>

            <form onSubmit={handleCreateVisitor} className="space-y-4">
              <div>
                <label className="label">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Sharma"
                  className="input"
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    className="input"
                    value={formData.visitorPhone}
                    onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Visitor Type</label>
                  <select
                    className="select"
                    value={formData.visitorType}
                    onChange={(e) => setFormData({ ...formData, visitorType: e.target.value })}
                  >
                    <option value="GUEST">Guest</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="SERVICE">Service</option>
                    <option value="CONTRACTOR">Contractor</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Destination Apartment *</label>
                <select
                  required
                  className="select"
                  value={formData.apartmentId}
                  onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                >
                  <option value="">Select Apartment</option>
                  {apartments
                    .filter((a) => a.residentProfiles?.length > 0)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.building} - Unit {a.unitNumber} ({a.residentProfiles[0].user.firstName} {a.residentProfiles[0].user.lastName})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Expected Date</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="KA-01-AB-1234"
                    className="input font-mono text-sm"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Purpose of Visit *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Family gathering, Amazon delivery"
                  className="input"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
