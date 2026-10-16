import { useEffect, useState } from 'react';
import {
  CalendarDays, Filter, CheckCircle, XCircle, Clock,
  MapPin, X, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, Pagination } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [amenityFilter, setAmenityFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Rejection modal
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (amenityFilter) params.amenityId = amenityFilter;

      const res = await api.get('/bookings', { params });
      setBookings(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAmenities = async () => {
    try {
      const res = await api.get('/amenities');
      setAmenities(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings(1);
    fetchAmenities();
  }, [statusFilter, amenityFilter]);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/bookings/${id}/approve`, { decision: 'CONFIRMED' });
      toast.success('Booking confirmed');
      fetchBookings(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to confirm booking');
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      setRejecting(true);
      await api.patch(`/bookings/${rejectId}/approve`, { decision: 'REJECTED' });
      toast.success('Booking rejected');
      setRejectId(null);
      fetchBookings(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject booking');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Amenity Reservations"
        description="Monitor facility bookings, handle approval requests, and view schedules"
      />

      {/* Filters Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="select text-sm w-full sm:w-44"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              className="select text-sm w-full sm:w-48"
              value={amenityFilter}
              onChange={(e) => setAmenityFilter(e.target.value)}
            >
              <option value="">All Amenities</option>
              {amenities.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading bookings..." />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-12 h-12" />}
            title="No bookings recorded"
            description="Resident bookings will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Amenity</th>
                  <th>Reserved By</th>
                  <th>Date</th>
                  <th>Slot Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
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
                      <p className="font-medium text-gray-900 text-sm">
                        {b.booker?.firstName} {b.booker?.lastName}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs text-gray-700 font-medium">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(b.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs font-semibold text-brand-700">
                        <Clock className="w-3.5 h-3.5 text-brand-500" />
                        {b.startTime} - {b.endTime}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-gray-600 line-clamp-1">
                        {b.purpose || <span className="text-gray-400 italic">None specified</span>}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="text-right">
                      {b.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(b.id)}
                            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                          </button>
                          <button
                            onClick={() => setRejectId(b.id)}
                            className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white text-xs px-2.5 py-1"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No action</span>
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

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-gray-900 mb-2">Reject Reservation</h3>
            <p className="text-xs text-gray-500 mb-4">
              Are you sure you want to reject this amenity booking request?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setRejectId(null)} className="btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="btn-danger btn-sm"
              >
                {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
