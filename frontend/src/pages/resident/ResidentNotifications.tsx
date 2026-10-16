import { useEffect, useState } from 'react';
import {
  Bell, Check, CheckCheck, Clock, ShieldAlert,
  Info, CreditCard, MessageSquare, Calendar
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, Pagination } from '../../components/ui';
import toast from 'react-hot-toast';

export default function ResidentNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (unreadOnly) params.unread = 'true';

      const res = await api.get('/notifications', { params });
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, [unreadOnly]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications(pagination.page);
    } catch (err: any) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      toast.success('All notifications marked as read');
      fetchNotifications(1);
    } catch (err: any) {
      toast.error('Failed to mark all as read');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT': return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'COMPLAINT_UPDATE': return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'BOOKING_CONFIRMED': return <Calendar className="w-4 h-4 text-brand-600" />;
      case 'VISITOR_ARRIVAL': return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Alerts"
        description="Real-time society alerts, payment confirmations, and visitor entry pings"
        action={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="btn-secondary btn-sm flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              Mark All Read ({unreadCount})
            </button>
          ) : undefined
        }
      />

      {/* Filter tab */}
      <div className="flex gap-2">
        <button
          onClick={() => setUnreadOnly(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            !unreadOnly ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          All Alerts
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            unreadOnly ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          Unread Only {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading alerts..." />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-12 h-12" />}
            title="No notifications"
            description="You are completely caught up!"
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  !n.isRead ? 'bg-brand-50/30' : 'hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm">{n.title}</p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-white"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <Pagination meta={pagination} onPageChange={(p) => fetchNotifications(p)} />
      </div>
    </div>
  );
}
