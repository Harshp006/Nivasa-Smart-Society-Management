import { useEffect, useState } from 'react';
import {
  Megaphone, Pin, Calendar, Filter, Clock
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, Pagination } from '../../components/ui';

export default function ResidentAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(1);
  }, [categoryFilter]);

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
        title="Notice Board & Circulars"
        description="Official updates, maintenance schedules, and security advisories from management"
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

      {loading ? (
        <Loading text="Loading notices..." />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-12 h-12" />}
          title="No notices found"
          description="There are currently no circulars matching your selection."
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
              <div className="flex items-start gap-3 mb-3">
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
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Posted {new Date(a.publishedAt || a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line pl-13">
                {a.content}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination meta={pagination} onPageChange={(p) => fetchAnnouncements(p)} />
    </div>
  );
}
