import { useEffect, useState } from 'react';
import {
  MessageSquare, Search, Filter, AlertTriangle, CheckCircle,
  Clock, User, X, Loader2, ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, Pagination } from '../../components/ui';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Update status / resolution modal
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: 'IN_PROGRESS',
    assignedTo: '',
    priority: 'MEDIUM',
    resolutionNotes: '',
  });

  const fetchComplaints = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await api.get('/complaints', { params });
      setComplaints(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(1);
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints(1);
  };

  const handleOpenUpdate = (complaint: any) => {
    setSelectedComplaint(complaint);
    setUpdateForm({
      status: complaint.status,
      assignedTo: complaint.assignedTo || '',
      priority: complaint.priority,
      resolutionNotes: complaint.resolutionNotes || '',
    });
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setUpdating(true);
      await api.patch(`/complaints/${selectedComplaint.id}`, updateForm);
      toast.success('Complaint status updated successfully');
      setSelectedComplaint(null);
      fetchComplaints(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Helpdesk & Complaints"
        description="Review tickets raised by residents, assign service technicians, and log resolutions"
      />

      {/* Filter and Search Bar */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket title or description..."
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
              <option value="SUBMITTED">Submitted</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select
              className="select text-sm w-full md:w-32"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading complaint tickets..." />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-12 h-12" />}
            title="No complaint tickets found"
            description="Resident tickets and service requests will be shown here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Resident & Unit</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Assigned Staff</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td className="max-w-xs">
                      <p className="font-semibold text-gray-900 line-clamp-1">{c.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{c.description}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(c.createdAt).toLocaleDateString()} at{' '}
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td>
                      <p className="font-medium text-gray-900 text-xs">
                        {c.residentProfile?.user ? `${c.residentProfile.user.firstName} ${c.residentProfile.user.lastName}` : 'Unknown'}
                      </p>
                      <p className="text-xs text-brand-600 font-semibold">
                        Apt {c.residentProfile?.apartment?.building} - {c.residentProfile?.apartment?.unitNumber}
                      </p>
                    </td>
                    <td>
                      <span className="badge badge-gray text-xs">{c.category}</span>
                    </td>
                    <td>
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td>
                      <p className="text-xs text-gray-700">
                        {c.assignedTo || <span className="text-gray-400 italic">Unassigned</span>}
                      </p>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenUpdate(c)}
                        className="btn-secondary btn-sm text-xs px-2.5 py-1"
                      >
                        Manage Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={pagination} onPageChange={(p) => fetchComplaints(p)} />
      </div>

      {/* Update / Resolve Complaint Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedComplaint(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Manage Support Ticket</h2>
            <p className="text-xs text-gray-500 mb-4">
              Ticket #{selectedComplaint.id.slice(-6).toUpperCase()} • {selectedComplaint.category}
            </p>

            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-700 space-y-1">
              <p className="font-semibold text-gray-900 text-sm">{selectedComplaint.title}</p>
              <p className="text-gray-600">{selectedComplaint.description}</p>
              <p className="text-gray-400 pt-1 border-t border-gray-200">
                Reported by {selectedComplaint.residentProfile?.user?.firstName} (Unit {selectedComplaint.residentProfile?.apartment?.unitNumber})
              </p>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ticket Status *</label>
                  <select
                    className="select"
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority Level</label>
                  <select
                    className="select"
                    value={updateForm.priority}
                    onChange={(e) => setUpdateForm({ ...updateForm, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Assign Technician / Staff</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh (Society Electrician)"
                  className="input text-sm"
                  value={updateForm.assignedTo}
                  onChange={(e) => setUpdateForm({ ...updateForm, assignedTo: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Resolution / Internal Notes</label>
                <textarea
                  rows={3}
                  placeholder="Detail the work done or instructions for the resident..."
                  className="input text-sm"
                  value={updateForm.resolutionNotes}
                  onChange={(e) => setUpdateForm({ ...updateForm, resolutionNotes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
