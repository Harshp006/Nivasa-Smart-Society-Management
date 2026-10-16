import { useEffect, useState } from 'react';
import {
  Users, Plus, Trash2, Phone, Heart,
  ShieldCheck, X, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, ConfirmDialog } from '../../components/ui';
import toast from 'react-hot-toast';

export default function ResidentFamily() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    relation: 'SPOUSE',
    age: 30,
    phone: '',
    isEmergencyContact: false,
  });

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/family-members');
      setMembers(res.data.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/family-members', {
        ...formData,
        age: Number(formData.age),
      });
      toast.success('Family member added');
      setShowAddModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        relation: 'SPOUSE',
        age: 30,
        phone: '',
        isEmergencyContact: false,
      });
      fetchMembers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add family member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/family-members/${deleteId}`);
      toast.success('Family member removed');
      setDeleteId(null);
      fetchMembers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family Members"
        description="Register family members residing in your unit for security clearance and gate access"
        action={
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Family Member
          </button>
        }
      />

      {loading ? (
        <Loading text="Loading family records..." />
      ) : members.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No family members listed"
          description="Add your family members living with you in this unit."
          action={
            <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
              Add First Member
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <div key={m.id} className="card relative flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {m.firstName} {m.lastName}
                      </h3>
                      <p className="text-xs text-gray-500">{m.relation} • Age: {m.age || 'N/A'}</p>
                    </div>
                  </div>
                  {m.isEmergencyContact && (
                    <span className="badge badge-success text-[10px] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> SOS Contact
                    </span>
                  )}
                </div>

                {m.phone && (
                  <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {m.phone}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 mt-4 flex justify-end">
                <button
                  onClick={() => setDeleteId(m.id)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Remove member"
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

            <h2 className="text-lg font-bold text-gray-900 mb-1">Add Family Member</h2>
            <p className="text-xs text-gray-500 mb-4">Register someone living with you in this unit</p>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    type="text"
                    required
                    className="input text-sm"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    type="text"
                    required
                    className="input text-sm"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Relation *</label>
                  <select
                    className="select text-sm"
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                  >
                    <option value="SPOUSE">Spouse</option>
                    <option value="CHILD">Child</option>
                    <option value="PARENT">Parent</option>
                    <option value="SIBLING">Sibling</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Age</label>
                  <input
                    type="number"
                    min={1}
                    className="input text-sm"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91..."
                  className="input text-sm"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                    checked={formData.isEmergencyContact}
                    onChange={(e) => setFormData({ ...formData, isEmergencyContact: e.target.checked })}
                  />
                  Mark as Emergency Contact
                </label>
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Remove Member"
        message="Are you sure you want to remove this family member from your apartment roster?"
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
