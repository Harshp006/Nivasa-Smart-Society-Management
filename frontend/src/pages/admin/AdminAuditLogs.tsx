import { useEffect, useState } from 'react';
import {
  Shield, Clock, User, FileText, Search,
  ChevronDown, ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, Pagination } from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/reports/audit-logs', { params: { page, limit: 15 } });
      setLogs(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const getActionBadge = (action: string) => {
    if (action.includes('CREATED') || action.includes('APPROVED')) return 'badge-success';
    if (action.includes('REJECTED') || action.includes('DELETE')) return 'badge-danger';
    if (action.includes('CHECKIN') || action.includes('CHECKOUT')) return 'badge-info';
    return 'badge-gray';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Security & Audit Trail"
        description="Immutable chronological activity logs of administrative and gate operations"
      />

      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading system audit records..." />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<Shield className="w-12 h-12" />}
            title="No audit entries"
            description="Operational actions will be tracked here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target Entity</th>
                  <th>IP / Source</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <>
                      <tr
                        key={log.id}
                        className="cursor-pointer hover:bg-gray-50/80 transition-colors"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <td>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                        <td>
                          <div className="text-xs text-gray-600 flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getActionBadge(log.action)} font-mono text-[10px]`}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <p className="text-xs font-semibold text-gray-900">
                            {log.actor?.firstName} {log.actor?.lastName || 'System'}
                          </p>
                          <p className="text-[11px] text-gray-400">{log.actor?.email}</p>
                        </td>
                        <td>
                          <span className="text-xs font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                            {log.entityType}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-gray-400 font-mono">
                            {log.ipAddress || 'Internal'}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && log.details && (
                        <tr key={`${log.id}-details`} className="bg-gray-50/50">
                          <td colSpan={6} className="px-6 py-3">
                            <div className="text-xs">
                              <p className="font-semibold text-gray-600 mb-1">Payload / Details:</p>
                              <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto font-mono text-[11px]">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={pagination} onPageChange={(p) => fetchLogs(p)} />
      </div>
    </div>
  );
}
