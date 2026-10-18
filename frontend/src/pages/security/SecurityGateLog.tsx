import { useEffect, useState } from 'react';
import {
  BookOpen, Clock, Calendar, CheckCircle, LogOut,
  LogIn, Search, Filter
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, Pagination } from '../../components/ui';
import toast from 'react-hot-toast';

export default function SecurityGateLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (dateFilter) params.date = dateFilter;

      const res = await api.get('/gate/logs', { params });
      setLogs(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error('Failed to load gate log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [dateFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gate Entry & Exit Ledger"
        description="Immutable physical gate log recording barrier check-ins and check-outs"
      />

      {/* Date Filter Bar */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Date:
          </label>
          <input
            type="date"
            className="input text-xs w-44"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-brand-600 hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading barrier access records..." />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12" />}
            title="No gate logs recorded"
            description="Barrier activations and check-in / check-out timestamps will be displayed here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Pass Code</th>
                  <th>Destination Unit</th>
                  <th>Check-In Time</th>
                  <th>Check-Out Time</th>
                  <th>Security Remarks</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div>
                        <p className="font-semibold text-gray-900">{log.visitor?.visitorName}</p>
                        <p className="text-xs text-gray-500">{log.visitor?.visitorType}</p>
                        {log.visitor?.vehicleNumber && (
                          <span className="font-mono text-[11px] text-gray-600">
                            Plate: {log.visitor.vehicleNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {log.visitor?.passCode}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-gray-900 text-xs">
                        {log.visitor?.apartment
                          ? `Unit ${log.visitor.apartment.building} - ${log.visitor.apartment.unitNumber}`
                          : 'General Area'}
                      </p>
                    </td>
                    <td>
                      <div className="text-xs font-mono text-emerald-700 flex items-center gap-1">
                        <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                        {log.checkInAt ? new Date(log.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {log.checkInAt ? new Date(log.checkInAt).toLocaleDateString() : ''}
                      </p>
                    </td>
                    <td>
                      {log.checkOutAt ? (
                        <>
                          <div className="text-xs font-mono text-rose-700 flex items-center gap-1">
                            <LogOut className="w-3.5 h-3.5 text-rose-500" />
                            {new Date(log.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <p className="text-[10px] text-gray-400">
                            {new Date(log.checkOutAt).toLocaleDateString()}
                          </p>
                        </>
                      ) : (
                        <span className="badge badge-info text-[10px]">STILL INSIDE</span>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-gray-500 italic">
                        {log.securityNotes || 'Normal pass entry'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={pagination} onPageChange={(p) => fetchLogs(p)} />
      </div>
    </div>
  );
}
