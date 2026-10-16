import { useEffect, useState } from 'react';
import {
  Car, Plus, Trash2, ShieldCheck, ParkingCircle,
  X, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, ConfirmDialog } from '../../components/ui';
import toast from 'react-hot-toast';

export default function ResidentVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    registrationNo: '',
    make: '',
    model: '',
    color: '',
    type: 'FOUR_WHEELER',
    parkingSlot: '',
  });

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicles');
      setVehicles(res.data.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/vehicles', formData);
      toast.success('Vehicle registered successfully');
      setShowAddModal(false);
      setFormData({
        registrationNo: '',
        make: '',
        model: '',
        color: '',
        type: 'FOUR_WHEELER',
        parkingSlot: '',
      });
      fetchVehicles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to register vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/vehicles/${deleteId}`);
      toast.success('Vehicle removed');
      setDeleteId(null);
      fetchVehicles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove vehicle');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Registry & Parking"
        description="Register your personal vehicles for automated barrier opening and security clearance"
        action={
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        }
      />

      {loading ? (
        <Loading text="Loading vehicle records..." />
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={<Car className="w-12 h-12" />}
          title="No vehicles registered"
          description="Add your car, bike, or EV for entry boom barrier gate access."
          action={
            <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
              Add Vehicle
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="card relative flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-brand-700 font-bold flex items-center justify-center">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm font-mono tracking-wider">
                        {v.registrationNo}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {v.make} {v.model} ({v.color})
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-gray text-[10px]">{v.type}</span>
                </div>

                <div className="bg-gray-50 rounded-lg p-2.5 flex items-center justify-between text-xs text-gray-600 mt-2">
                  <span className="text-gray-400">Assigned Bay:</span>
                  <span className="font-bold text-gray-900">{v.parkingSlot || 'Open Parking'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 mt-3 flex justify-end">
                <button
                  onClick={() => setDeleteId(v.id)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Remove vehicle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Register Vehicle</h2>
            <p className="text-xs text-gray-500 mb-4">Enter vehicle details for gate security identification</p>

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="label">License / Number Plate *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-02-CB-1234"
                  className="input font-mono uppercase text-sm"
                  value={formData.registrationNo}
                  onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Vehicle Type</label>
                  <select
                    className="select text-sm"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="FOUR_WHEELER">Car (4-Wheeler)</option>
                    <option value="TWO_WHEELER">Bike / Scooter</option>
                    <option value="EV">Electric Vehicle (EV)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Color *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Silver, White"
                    className="input text-sm"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Make (Brand) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyundai, Honda"
                    className="input text-sm"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Creta, Activa"
                    className="input text-sm"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Designated Parking Slot</label>
                <input
                  type="text"
                  placeholder="e.g. B-102 (Basement 1)"
                  className="input text-sm"
                  value={formData.parkingSlot}
                  onChange={(e) => setFormData({ ...formData, parkingSlot: e.target.value })}
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Remove Vehicle"
        message="Are you sure you want to remove this vehicle? Security will not automatically recognize it at the gate."
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
