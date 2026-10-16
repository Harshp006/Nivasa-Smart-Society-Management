import { useEffect, useState } from 'react';
import {
  Megaphone, Plus, Pin, Trash2, Calendar,
  AlertCircle, X, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, ConfirmDialog, Pagination } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Create notice modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    status: 'PUBLISHED',
    isPinned: false,
  });

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAnnouncements = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (categoryFilter) params.category = categoryFilter;

      const res = await api.get('/announcements', { params });
      setAnnouncements(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(1);
  }, [categoryFilter]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const apts = await api.get('/apartments?limit=1');
      const societyId = apts.data.data?.[0]?.societyId || 'default-society';

      await api.post('/announcements', {
        ...formData,
        societyId,
        publishedAt: new Date().toISOString(),
      });

      toast.success('Notice published to residents');
      setShowAddModal(false);
      setFormData({
        title: '',
        content: '',
        category: 'GENERAL',
        status: 'PUBLISHED',
        isPinned: false,
      });
      fetchAnnouncements(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/announcements/${deleteId}`);
      toast.success('Announcement removed');
      setDeleteId(null);
      fetchAnnouncements(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete announcement');
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'EMERGENCY': return 'badge-danger';
      case 'MAINTENANCE': return 'badge-warning';
      case 'SECURITY': return 'badge-purple';
      case 'EVENT': return 'badge-success';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notice Board & Broadcasts"
        description="Publish circulars, maintenance alerts, and security bulletins for residents"
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Publish Notice
          </button>
        }
      />

      {/* Filter */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category:</label>
          <select
            className="select text-sm w-44"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="GENERAL">General</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="SECURITY">Security</option>
            <option value="EVENT">Event</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="POLICY">Policy</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <Loading text="Loading notices..." />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-12 h-12" />}
          title="No notices published"
          description="Click Publish Notice to broadcast an update to all residents."
          action={
            <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
              Publish Notice
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`card hover:shadow-md transition-shadow relative overflow-hidden ${
                a.isPinned ? 'border-brand-300 ring-1 ring-brand-100 bg-brand-50/20' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold flex-shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base">{a.title}</h3>
                      {a.isPinned && (
                        <span className="badge badge-purple text-[10px] flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                      <span className={`badge ${getCategoryColor(a.category)} text-[10px]`}>
                        {a.category}
                      </span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Published {new Date(a.publishedAt || a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setDeleteId(a.id)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 self-end sm:self-auto"
                  title="Delete notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line pl-13">
                {a.content}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination meta={pagination} onPageChange={(p) => fetchAnnouncements(p)} />

      {/* Add Announcement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Publish Notice</h2>
            <p className="text-xs text-gray-500 mb-4">Post a circular on the resident notice board</p>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="label">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Water Tank Cleaning"
                  className="input font-medium"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select
                    className="select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="GENERAL">General</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="SECURITY">Security</option>
                    <option value="EVENT">Community Event</option>
                    <option value="EMERGENCY">Emergency Alert</option>
                    <option value="POLICY">Society Policy</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    />
                    Pin to Top of Notice Board
                  </label>
                </div>
              </div>

              <div>
                <label className="label">Content / Notice Details *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write notice body here..."
                  className="input text-sm"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish to Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Announcement"
        message="Are you sure you want to permanently delete this announcement? It will be removed from all resident feeds."
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
