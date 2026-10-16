import { useEffect, useState } from 'react';
import {
  Dumbbell, Plus, Clock, Users, ShieldAlert,
  Edit2, Trash2, X, Loader2, MapPin
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, ConfirmDialog } from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminAmenities() {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    capacity: 20,
    openingTime: '06:00',
    closingTime: '22:00',
    slotDuration: 60,
    requiresApproval: false,
    rules: '',
  });

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/amenities');
      setAmenities(res.data.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load amenities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      location: '',
      capacity: 20,
      openingTime: '06:00',
      closingTime: '22:00',
      slotDuration: 60,
      requiresApproval: false,
      rules: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (a: any) => {
    setEditingId(a.id);
    setFormData({
      name: a.name,
      description: a.description || '',
      location: a.location || '',
      capacity: a.capacity || 20,
      openingTime: a.openingTime,
      closingTime: a.closingTime,
      slotDuration: a.slotDuration,
      requiresApproval: a.requiresApproval,
      rules: a.rules || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        await api.patch(`/amenities/${editingId}`, {
          ...formData,
          capacity: Number(formData.capacity),
          slotDuration: Number(formData.slotDuration),
        });
        toast.success('Amenity updated successfully');
      } else {
        const apts = await api.get('/apartments?limit=1');
        const societyId = apts.data.data?.[0]?.societyId || 'default-society';

        await api.post('/amenities', {
          ...formData,
          societyId,
          capacity: Number(formData.capacity),
          slotDuration: Number(formData.slotDuration),
        });
        toast.success('Amenity created successfully');
      }

      setShowModal(false);
      fetchAmenities();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save amenity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/amenities/${deleteId}`);
      toast.success('Amenity removed');
      setDeleteId(null);
      fetchAmenities();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove amenity');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clubhouse & Amenities"
        description="Manage shared facilities, availability rules, and capacity limits"
        action={
          <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Facility
          </button>
        }
      />

      {loading ? (
        <Loading text="Loading amenities..." />
      ) : amenities.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="w-12 h-12" />}
          title="No amenities configured"
          description="Create facilities like Swimming Pool, Clubhouse, or Gym for resident booking."
          action={
            <button onClick={handleOpenCreate} className="btn-primary btn-sm">
              Create First Facility
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {amenities.map((a) => (
            <div key={a.id} className="card flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{a.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {a.location || 'Society Clubhouse'}
                      </p>
                    </div>
                  </div>
                  {a.requiresApproval && (
                    <span className="badge badge-warning text-[10px]">Needs Approval</span>
                  )}
                </div>

                {a.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 my-2.5">{a.description}</p>
                )}

                <div className="bg-gray-50 rounded-lg p-2.5 grid grid-cols-2 gap-2 text-xs text-gray-600 my-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{a.openingTime} - {a.closingTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>Max {a.capacity || 'N/A'} persons</span>
                  </div>
                </div>

                {a.rules && (
                  <p className="text-[11px] text-gray-400 italic line-clamp-2">
                    Rules: {a.rules}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2 text-xs">
                <span className="text-gray-400">{a._count?.bookings || 0} total bookings</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEdit(a)}
                    className="p-1.5 text-gray-500 hover:text-brand-600 rounded-lg hover:bg-gray-100"
                    title="Edit facility"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(a.id)}
                    className="p-1.5 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    title="Delete facility"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {editingId ? 'Edit Amenity' : 'Add New Amenity'}
            </h2>
            <p className="text-xs text-gray-500 mb-4">Set operational timings and booking constraints</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Facility Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swimming Pool"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Location / Wing</label>
                  <input
                    type="text"
                    placeholder="e.g. Block B, Ground Floor"
                    className="input"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details about the amenity..."
                  className="input text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Opens At *</label>
                  <input
                    type="time"
                    required
                    className="input"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Closes At *</label>
                  <input
                    type="time"
                    required
                    className="input"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Max Capacity</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Slot Duration (Minutes)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    className="input"
                    value={formData.slotDuration}
                    onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                      checked={formData.requiresApproval}
                      onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                    />
                    Requires Admin Approval
                  </label>
                </div>
              </div>

              <div>
                <label className="label">Usage Rules & Guidelines</label>
                <input
                  type="text"
                  placeholder="e.g. Proper swimwear mandatory, no outside food"
                  className="input text-sm"
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update Facility' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Remove Amenity"
        message="Are you sure you want to deactivate this facility? Existing future bookings might be affected."
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
