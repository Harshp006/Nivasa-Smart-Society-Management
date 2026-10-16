import { useEffect, useState } from 'react';
import {
  CalendarDays, Clock, MapPin, Trash2, X,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, ConfirmDialog, Pagination } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function ResidentBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Cancel booking modal
  const [cancelId, setCancelId] = useState<string | null>(null);

  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/bookings', { params: { page, limit: 10 } });
      setBookings(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1);
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelId) return;
    try {
      await api.delete(`/bookings/${cancelId}`);
      toast.success('Booking cancelled');
      setCancelId(null);
      fetchBookings(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Facility Reservations"
        description="View your reserved slots for clubhouse, sports facilities, and function areas"
      />

      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading your reservations..." />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-12 h-12" />}
            title="No bookings made yet"
            description="Reserve sports courts or banquet halls under the Amenities tab."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Date</th>
                  <th>Time Window</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <p className="font-semibold text-gray-900">{b.amenity?.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {b.amenity?.location || 'Clubhouse'}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(b.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                        <Clock className="w-3.5 h-3.5 text-brand-500" />
                        {b.startTime} - {b.endTime}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-gray-600 line-clamp-1">
                        {b.purpose || <span className="text-gray-400 italic">Personal</span>}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="text-right">
                      {['PENDING', 'CONFIRMED'].includes(b.status) && (
                        <button
                          onClick={() => setCancelId(b.id)}
                          className="btn btn-sm bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs px-2.5"
                        >
                          Cancel Slot
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={pagination} onPageChange={(p) => fetchBookings(p)} />
      </div>

      {/* Cancel dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelId)}
        title="Cancel Booking"
        message="Are you sure you want to cancel this reservation slot? The time window will be made available to other residents."
        danger
        onCancel={() => setCancelId(null)}
        onConfirm={handleCancelBooking}
      />
    </div>
  );
}
