import { useEffect, useState } from 'react';
import {
  Dumbbell, Calendar, Clock, Users, MapPin,
  CheckCircle, AlertCircle, X, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

export default function ResidentAmenities() {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking modal state
  const [selectedAmenity, setSelectedAmenity] = useState<any | null>(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    purpose: '',
  });

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

  const handleOpenBooking = (amenity: any) => {
    setSelectedAmenity(amenity);
    setBookingForm({
      date: new Date().toISOString().split('T')[0],
      startTime: amenity.openingTime || '09:00',
      endTime: '10:00',
      purpose: '',
    });
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmenity) return;

    try {
      setSubmittingBooking(true);
      await api.post('/bookings', {
        amenityId: selectedAmenity.id,
        ...bookingForm,
      });

      toast.success(
        selectedAmenity.requiresApproval
          ? 'Booking request submitted! Waiting for admin approval.'
          : 'Amenity booked successfully!'
      );
      setSelectedAmenity(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Slot unavailable or booking failed');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Society Amenities & Clubhouse"
        description="Explore community facilities and book time slots for leisure or private functions"
      />

      {loading ? (
        <Loading text="Loading amenities..." />
      ) : amenities.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="w-12 h-12" />}
          title="No amenities available"
          description="Society clubhouse facilities will be listed here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {amenities.map((a) => (
            <div key={a.id} className="card flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{a.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {a.location || 'Clubhouse'}
                      </p>
                    </div>
                  </div>
                  {a.requiresApproval && (
                    <span className="badge badge-warning text-[10px]">Approval Req.</span>
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
                    Guidelines: {a.rules}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 mt-3">
                <button
                  onClick={() => handleOpenBooking(a)}
                  className="btn-primary w-full text-xs py-2"
                >
                  Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Slot Modal */}
      {selectedAmenity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedAmenity(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Book {selectedAmenity.name}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Timings: {selectedAmenity.openingTime} to {selectedAmenity.closingTime}
            </p>

            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="label">Reservation Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="input text-sm"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Time *</label>
                  <input
                    type="time"
                    required
                    className="input text-sm"
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">End Time *</label>
                  <input
                    type="time"
                    required
                    className="input text-sm"
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Purpose / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Birthday gathering, evening badminton"
                  className="input text-sm"
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedAmenity(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="btn-primary"
                >
                  {submittingBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
