import { useEffect, useState } from 'react';
import {
  Building2, Plus, Search, Filter, Home, Users,
  CheckCircle2, XCircle, Trash2, X, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, ConfirmDialog, Pagination, StatCard } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminApartments() {
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Add apartment modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    building: 'Tower A',
    floor: 1,
    unitNumber: '',
    type: '2BHK',
    areaSqFt: 1200,
    maintenanceAmt: 4500,
    notes: '',
  });

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchApartments = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 12 };
      if (search) params.search = search;
      if (buildingFilter) params.building = buildingFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/apartments', { params });
      setApartments(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load apartments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments(1);
  }, [buildingFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApartments(1);
  };

  const handleCreateApartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Backend apartments route requires societyId or defaults
      await api.post('/apartments', {
        ...formData,
        floor: Number(formData.floor),
        areaSqFt: Number(formData.areaSqFt),
        maintenanceAmt: Number(formData.maintenanceAmt),
      });
      toast.success('Apartment added successfully');
      setShowAddModal(false);
      setFormData({
        building: 'Tower A',
        floor: 1,
        unitNumber: '',
        type: '2BHK',
        areaSqFt: 1200,
        maintenanceAmt: 4500,
        notes: '',
      });
      fetchApartments(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create apartment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApartment = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/apartments/${deleteId}`);
      toast.success('Apartment deleted');
      setDeleteId(null);
      fetchApartments(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete apartment');
    }
  };

  const occupiedCount = apartments.filter(a => a.occupancyStatus === 'OCCUPIED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Apartments & Units"
        description="Manage society blocks, apartment inventories, and occupancy"
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Apartment
          </button>
        }
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Units"
          value={pagination.total}
          icon={<Building2 className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Occupied"
          value={occupiedCount}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Vacant"
          value={Math.max(0, pagination.total - occupiedCount)}
          icon={<XCircle className="w-5 h-5 text-gray-500" />}
          iconBg="bg-gray-100"
        />
      </div>

      {/* Filter and Search */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search unit number, building, or type..."
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
              className="select text-sm w-full md:w-36"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="VACANT">Vacant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Apartments Grid / Cards */}
      {loading ? (
        <Loading text="Loading apartments..." />
      ) : apartments.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-12 h-12" />}
          title="No apartments registered"
          description="Create units to allocate residents."
          action={
            <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
              Add First Unit
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {apartments.map((apt) => {
            const primaryResident = apt.residentProfiles?.[0];
            return (
              <div key={apt.id} className="card hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{apt.building} - {apt.unitNumber}</h3>
                        <p className="text-xs text-gray-500">Floor {apt.floor} • {apt.type}</p>
                      </div>
                    </div>
                    <StatusBadge status={apt.occupancyStatus} />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-xs text-gray-600 mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Area:</span>
                      <span className="font-medium text-gray-800">{apt.areaSqFt ? `${apt.areaSqFt} sq ft` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Maintenance:</span>
                      <span className="font-medium text-gray-800">₹{apt.maintenanceAmt?.toLocaleString() || '0'}/mo</span>
                    </div>
                    {primaryResident ? (
                      <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                        <span className="text-gray-400">Resident:</span>
                        <span className="font-semibold text-brand-700 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {primaryResident.user.firstName} {primaryResident.user.lastName}
                        </span>
                      </div>
                    ) : (
                      <div className="pt-1 border-t border-gray-200 text-gray-400 italic">
                        No current resident
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setDeleteId(apt.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete unit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination meta={pagination} onPageChange={(p) => fetchApartments(p)} />

      {/* Add Apartment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Add Apartment Unit</h2>
            <p className="text-xs text-gray-500 mb-4">Create a new unit profile in the system</p>

            <form onSubmit={handleCreateApartment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Building / Tower *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Unit Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101, 402"
                    className="input"
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Floor *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="input"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="label">Unit Type *</label>
                  <select
                    className="select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                    <option value="4BHK">4 BHK</option>
                    <option value="PENTHOUSE">Penthouse</option>
                    <option value="STUDIO">Studio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Area (sq ft)</label>
                  <input
                    type="number"
                    min={100}
                    className="input"
                    value={formData.areaSqFt}
                    onChange={(e) => setFormData({ ...formData, areaSqFt: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="label">Monthly Maint. (₹)</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={formData.maintenanceAmt}
                    onChange={(e) => setFormData({ ...formData, maintenanceAmt: parseInt(e.target.value) || 0 })}
                  />
                </div>
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Apartment"
        message="Are you sure you want to delete this unit? Any associated bills or historical logs may be affected."
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteApartment}
      />
    </div>
  );
}
