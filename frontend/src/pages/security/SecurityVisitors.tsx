import { useEffect, useState } from 'react';
import {
  UserCheck, Plus, Search, Filter, Key,
  LogIn, LogOut, CheckCircle2, Clock, X, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, Pagination } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function SecurityVisitors() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Walk-in modal
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorType: 'DELIVERY',
    purpose: '',
    vehicleNumber: '',
    apartmentId: '',
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

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const apt = apartments.find((a) => a.id === walkInForm.apartmentId);
    const residentProfileId = apt?.residentProfiles?.[0]?.id;

    if (!residentProfileId) {
      toast.error('The selected unit does not have an active resident');
      return;
    }

    try {
      setSubmittingWalkIn(true);
      const res = await api.post('/visitors', {
        ...walkInForm,
        residentProfileId,
        expectedDate: new Date().toISOString(),
      });

      const passCode = res.data.data.passCode;
      toast.success(`Walk-in visitor pass generated: ${passCode}`);
      setShowWalkInModal(false);
      setWalkInForm({
        visitorName: '',
        visitorPhone: '',
        visitorType: 'DELIVERY',
        purpose: '',
        vehicleNumber: '',
        apartmentId: '',
      });
      fetchVisitors(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to log walk-in visitor');
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gate Passes & Visitor Directory"
        description="Verify entry pass codes, record walk-in delivery personnel, and maintain security logs"
        action={
          <button
            onClick={() => setShowWalkInModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Log Walk-in Entry
          </button>
        }
      />

      {/* Filter and Search */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search visitor name or pass code..."
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
              <option value="APPROVED">Approved Passes</option>
              <option value="CHECKED_IN">Inside Campus</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="PENDING">Pending Approval</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading visitor entries..." />
        ) : visitors.length === 0 ? (
          <EmptyState
            icon={<UserCheck className="w-12 h-12" />}
            title="No visitor passes found"
            description="All gate entries and passes will appear here."
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
                  <th>Status</th>
                  <th>Entry Time</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div>
                        <p className="font-semibold text-gray-900">{v.visitorName}</p>
                        <p className="text-xs text-gray-500">{v.visitorPhone || 'No phone'}</p>
                        {v.vehicleNumber && (
                          <span className="text-[11px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                            {v.vehicleNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono font-bold text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-md border border-brand-100">
                        {v.passCode}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-gray-900">
                        {v.apartment ? `${v.apartment.building} - ${v.apartment.unitNumber}` : 'N/A'}
                      </p>
                      {v.residentProfile?.user && (
                        <p className="text-xs text-gray-500">Host: {v.residentProfile.user.firstName}</p>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-gray text-xs">{v.visitorType}</span>
                      <p className="text-xs text-gray-600 mt-0.5 max-w-xs truncate">{v.purpose}</p>
                    </td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                    <td>
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={pagination} onPageChange={(p) => fetchVisitors(p)} />
      </div>

      {/* Log Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setShowWalkInModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Log Walk-In Entry</h2>
            <p className="text-xs text-gray-500 mb-4">Create visitor pass directly at the security gate</p>

            <form onSubmit={handleCreateWalkIn} className="space-y-4">
              <div>
                <label className="label">Visitor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy Delivery / Amit"
                  className="input text-sm"
                  value={walkInForm.visitorName}
                  onChange={(e) => setWalkInForm({ ...walkInForm, visitorName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    className="input text-sm"
                    value={walkInForm.visitorPhone}
                    onChange={(e) => setWalkInForm({ ...walkInForm, visitorPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select
                    className="select text-sm"
                    value={walkInForm.visitorType}
                    onChange={(e) => setWalkInForm({ ...walkInForm, visitorType: e.target.value })}
                  >
                    <option value="DELIVERY">Delivery</option>
                    <option value="SERVICE">Service / Repair</option>
                    <option value="GUEST">Guest</option>
                    <option value="CAB">Cab / Taxi</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Destination Unit *</label>
                <select
                  required
                  className="select text-sm"
                  value={walkInForm.apartmentId}
                  onChange={(e) => setWalkInForm({ ...walkInForm, apartmentId: e.target.value })}
                >
                  <option value="">Select Apartment Unit</option>
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
                  <label className="label">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="input font-mono text-sm uppercase"
                    value={walkInForm.vehicleNumber}
                    onChange={(e) => setWalkInForm({ ...walkInForm, vehicleNumber: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="label">Purpose *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Food Delivery"
                    className="input text-sm"
                    value={walkInForm.purpose}
                    onChange={(e) => setWalkInForm({ ...walkInForm, purpose: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWalkIn}
                  className="btn-primary"
                >
                  {submittingWalkIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register & Authorize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
