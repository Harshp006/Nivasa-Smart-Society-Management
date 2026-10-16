import { useEffect, useState } from 'react';
import {
  MessageSquare, Plus, AlertCircle, Clock,
  CheckCircle2, X, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, Pagination } from '../../components/ui';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function ResidentComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Create complaint modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'PLUMBING',
    priority: 'MEDIUM',
    description: '',
  });

  const fetchComplaints = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/complaints', { params: { page, limit: 10 } });
      setComplaints(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(1);
  }, []);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.description.length < 10) {
      toast.error('Description must be at least 10 characters long');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/complaints', formData);
      toast.success('Complaint ticket raised successfully');
      setShowAddModal(false);
      setFormData({
        title: '',
        category: 'PLUMBING',
        priority: 'MEDIUM',
        description: '',
      });
      fetchComplaints(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to raise complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Helpdesk & Service Tickets"
        description="Raise maintenance requests, report society defects, and track technician progress"
        action={
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Raise Ticket
          </button>
        }
      />

      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading your service requests..." />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-12 h-12" />}
            title="No complaints logged"
            description="Have an electrical, plumbing, or common area issue? Raise a ticket."
            action={
              <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                Raise Ticket
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {complaints.map((c) => (
              <div key={c.id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base">{c.title}</h3>
                      <span className="badge badge-gray text-xs">{c.category}</span>
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Raised on {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mt-2 whitespace-pre-line leading-relaxed">
                  {c.description}
                </p>

                {c.resolutionNotes && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mt-3 text-xs text-emerald-800">
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Resolution Updates by Society Staff
                    </p>
                    <p className="text-emerald-700">{c.resolutionNotes}</p>
                    {c.assignedTo && (
                      <p className="text-emerald-600 mt-1 italic font-medium">Technician: {c.assignedTo}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Pagination meta={pagination} onPageChange={(p) => fetchComplaints(p)} />
      </div>

      {/* Raise Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Raise Service Request</h2>
            <p className="text-xs text-gray-500 mb-4">
              Describe the problem so society maintenance can dispatch a specialist
            </p>

            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div>
                <label className="label">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master bathroom tap dripping constantly"
                  className="input font-medium"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category *</label>
                  <select
                    className="select text-sm"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="CARPENTRY">Carpentry</option>
                    <option value="LIFT">Elevator / Lift</option>
                    <option value="SECURITY">Security</option>
                    <option value="CLEANLINESS">Cleanliness / Waste</option>
                    <option value="NOISE">Noise Disturbance</option>
                    <option value="COMMON_AREA">Common Area Defect</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Urgency / Priority</label>
                  <select
                    className="select text-sm"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="LOW">Low (Can wait few days)</option>
                    <option value="MEDIUM">Medium (Normal)</option>
                    <option value="HIGH">High (Needs fast fix)</option>
                    <option value="URGENT">Urgent (Immediate attention)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Description & Specifics *</label>
                <textarea
                  rows={4}
                  required
                  minLength={10}
                  placeholder="Explain exactly what is wrong, when it started, and any access instructions..."
                  className="input text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
