import { useEffect, useState } from 'react';
import {
  Users, LogOut, Clock, Key, Search,
  Shield, CheckCircle, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

export default function SecurityCurrentVisitors() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOutCode, setCheckingOutCode] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchCurrent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gate/current');
      setVisitors(res.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load active visitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrent();
  }, []);

  const handleCheckOut = async (passCode: string) => {
    try {
      setCheckingOutCode(passCode);
      await api.post('/gate/checkout', { passCode });
      toast.success('Visitor checked out successfully');
      fetchCurrent();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to check out visitor');
    } finally {
      setCheckingOutCode(null);
    }
  };

  const filteredVisitors = visitors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.visitorName.toLowerCase().includes(q) ||
      v.passCode.toLowerCase().includes(q) ||
      v.apartment?.unitNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Campus Visitors"
        description="Real-time head-count of all external visitors, contractors, and guests currently on premises"
        action={
          <button onClick={fetchCurrent} className="btn-secondary btn-sm">
            Refresh List ({visitors.length})
          </button>
        }
      />

      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by visitor name, pass code, or unit..."
            className="input pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Loading text="Loading active campus visitors..." />
      ) : filteredVisitors.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No visitors inside campus"
          description="All checked-in guests have exited or no entries have been logged."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisitors.map((v) => {
            const checkInTime = v.entryLogs?.[0]?.checkInAt
              ? new Date(v.entryLogs[0].checkInAt)
              : new Date(v.updatedAt);
            const minutesInside = Math.max(
              0,
              Math.floor((Date.now() - checkInTime.getTime()) / (1000 * 60))
            );

            return (
              <div key={v.id} className="card flex flex-col justify-between hover:shadow-md transition-shadow border-emerald-200">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{v.visitorName}</h3>
                      <p className="text-xs text-gray-500">{v.visitorPhone || 'No contact provided'}</p>
                    </div>
                    <span className="badge badge-info text-[10px] font-mono">{v.passCode}</span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-600 space-y-1 my-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Visiting Unit:</span>
                      <span className="font-bold text-gray-900">
                        {v.apartment?.building} - {v.apartment?.unitNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Visitor Category:</span>
                      <span className="font-medium text-gray-800">{v.visitorType}</span>
                    </div>
                    {v.vehicleNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vehicle Plate:</span>
                        <span className="font-mono font-bold text-gray-900">{v.vehicleNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-gray-200 text-emerald-700 font-medium">
                      <span>Time on premises:</span>
                      <span>{minutesInside} minutes</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 mt-2">
                  <button
                    onClick={() => handleCheckOut(v.passCode)}
                    disabled={checkingOutCode === v.passCode}
                    className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white w-full flex items-center justify-center gap-1.5 text-xs py-2"
                  >
                    {checkingOutCode === v.passCode ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" /> Check Out at Gate
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
