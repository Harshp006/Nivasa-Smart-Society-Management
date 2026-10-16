import { useEffect, useState } from 'react';
import {
  Users, Plus, Search, Filter, Mail, Phone, Home,
  Calendar, Trash2, Eye, X, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, ConfirmDialog, Pagination } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminResidents() {
  const [residents, setResidents] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [residentTypeFilter, setResidentTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Add resident modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'Password@123',
    phone: '',
    apartmentId: '',
    residentType: 'OWNER',
    moveInDate: new Date().toISOString().split('T')[0],
    emergencyContact: '',
    emergencyPhone: '',
  });

  // Details modal
  const [selectedResident, setSelectedResident] = useState<any | null>(null);

  // Delete modal
  const [deleteResidentId, setDeleteResidentId] = useState<string | null>(null);

  const fetchResidents = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (residentTypeFilter) params.residentType = residentTypeFilter;

      const res = await api.get('/residents', { params });
      setResidents(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load residents');
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
    fetchResidents(1);
    fetchApartments();
  }, [residentTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResidents(1);
  };

  const handleCreateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.apartmentId) {
      toast.error('Please select an apartment');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/residents', formData);
      toast.success('Resident added successfully');
      setShowAddModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: 'Password@123',
        phone: '',
        apartmentId: '',
        residentType: 'OWNER',
        moveInDate: new Date().toISOString().split('T')[0],
        emergencyContact: '',
        emergencyPhone: '',
      });
      fetchResidents(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create resident');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResident = async () => {
    if (!deleteResidentId) return;
    try {
      await api.delete(`/residents/${deleteResidentId}`);
      toast.success('Resident removed successfully');
      setDeleteResidentId(null);
      fetchResidents(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove resident');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resident Directory"
        description="Manage apartment owners, tenants, and occupancy records"
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Resident
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, or unit..."
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
              value={residentTypeFilter}
              onChange={(e) => setResidentTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="OWNER">Owners Only</option>
              <option value="TENANT">Tenants Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Residents Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading resident roster..." />
        ) : residents.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title="No residents found"
            description="Start by registering a resident to an apartment unit."
            action={
              <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                Add Resident
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Unit</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Move-in Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {residents.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                          {r.user.firstName?.[0]}{r.user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{r.user.firstName} {r.user.lastName}</p>
                          <p className="text-xs text-gray-500">{r.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-gray-900">
                        {r.apartment ? `${r.apartment.building} - ${r.apartment.unitNumber}` : 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.residentType === 'OWNER' ? 'badge-purple' : 'badge-info'}`}>
                        {r.residentType}
                      </span>
                    </td>
                    <td>
                      <p className="text-xs text-gray-700">{r.user.phone || 'No phone'}</p>
                    </td>
                    <td>
                      <span className="text-xs text-gray-500">
                        {r.moveInDate ? new Date(r.moveInDate).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedResident(r)}
                          className="p-1.5 text-gray-500 hover:text-brand-600 rounded-lg hover:bg-gray-100"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteResidentId(r.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                          title="Remove Resident"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={pagination} onPageChange={(p) => fetchResidents(p)} />
      </div>

      {/* Add Resident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl p-6 relative my-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Add New Resident</h2>
            <p className="text-xs text-gray-500 mb-5">
              Create resident profile and associate with an apartment unit.
            </p>

            <form onSubmit={handleCreateResident} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Default Password *</label>
                  <input
                    type="text"
                    required
                    className="input font-mono text-sm"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Apartment Unit *</label>
                  <select
                    required
                    className="select"
                    value={formData.apartmentId}
                    onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                  >
                    <option value="">Select Apartment</option>
                    {apartments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.building} - Unit {a.unitNumber} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Residency Type</label>
                  <select
                    className="select"
                    value={formData.residentType}
                    onChange={(e) => setFormData({ ...formData, residentType: e.target.value })}
                  >
                    <option value="OWNER">Owner</option>
                    <option value="TENANT">Tenant</option>
                  </select>
                </div>
                <div>
                  <label className="label">Move-in Date</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.moveInDate}
                    onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Emergency Contact Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+91 98765 43210"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedResident(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xl">
                {selectedResident.user.firstName?.[0]}{selectedResident.user.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedResident.user.firstName} {selectedResident.user.lastName}
                </h2>
                <p className="text-xs text-gray-500">{selectedResident.residentType} • Resident Profile</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 rounded-xl p-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Home className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">Unit:</span> {selectedResident.apartment?.building} - {selectedResident.apartment?.unitNumber} ({selectedResident.apartment?.type})
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">Email:</span> {selectedResident.user.email}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">Phone:</span> {selectedResident.user.phone || 'Not provided'}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">Move In:</span> {new Date(selectedResident.moveInDate).toLocaleDateString()}
              </div>
              {selectedResident.emergencyContact && (
                <div className="border-t border-gray-200 pt-2 text-xs text-gray-600">
                  <span className="font-semibold">Emergency:</span> {selectedResident.emergencyContact} ({selectedResident.emergencyPhone})
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedResident(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteResidentId)}
        title="Remove Resident"
        message="Are you sure you want to deactivate and remove this resident record? The linked apartment will be marked as VACANT."
        confirmLabel="Remove Resident"
        danger
        onCancel={() => setDeleteResidentId(null)}
        onConfirm={handleDeleteResident}
      />
    </div>
  );
}
