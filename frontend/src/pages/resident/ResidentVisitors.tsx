import { useEffect, useState } from 'react';
import {
  UserCheck, Plus, Clock, Key, CheckCircle2,
  XCircle, Copy, Check, X, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, Pagination } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function ResidentVisitors() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorType: 'GUEST',
    purpose: '',
    vehicleNumber: '',
    expectedDate: new Date().toISOString().split('T')[0],
  });

  // Copied state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchVisitors = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/visitors', { params: { page, limit: 10 } });
      setVisitors(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors(1);
  }, []);

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/visitors/${id}/approve`, { decision });
      toast.success(`Visitor ${decision.toLowerCase()}`);
      fetchVisitors(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update visitor');
    }
  };

  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/visitors', formData);
      toast.success('Guest pass created successfully!');
      setShowAddModal(false);
      setFormData({
        visitorName: '',
        visitorPhone: '',
        visitorType: 'GUEST',
        purpose: '',
        vehicleNumber: '',
        expectedDate: new Date().toISOString().split('T')[0],
      });
      fetchVisitors(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create pass');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Pass code copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitor Passes & Gate Clearance"
        description="Pre-approve friends, family, and deliveries or approve entries at the security gate"
        action={
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Pre-Invite Guest
          </button>
        }
      />

      {/* Visitors List */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading visitor logs..." />
        ) : visitors.length === 0 ? (
          <EmptyState
            icon={<UserCheck className="w-12 h-12" />}
            title="No visitor passes created"
            description="Pre-invite a guest to generate a digital entry gate code."
            action={
              <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                Pre-Invite Guest
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Pass Code</th>
                  <th>Type & Purpose</th>
                  <th>Expected Date</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div>
                        <p className="font-semibold text-gray-900">{v.visitorName}</p>
                        <p className="text-xs text-gray-500">{v.visitorPhone || 'No phone'}</p>
                        {v.vehicleNumber && (
                          <span className="text-[11px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                            {v.vehicleNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-md border border-brand-100 flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          {v.passCode}
                        </span>
                        <button
                          onClick={() => copyToClipboard(v.passCode)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="Copy pass code"
                        >
                          {copiedCode === v.passCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray text-xs">{v.visitorType}</span>
                      <p className="text-xs text-gray-600 mt-0.5 max-w-xs truncate">{v.purpose}</p>
                    </td>
                    <td>
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(v.expectedDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="text-right">
                      {v.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDecision(v.id, 'APPROVED')}
                            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                          </button>
                          <button
                            onClick={() => handleDecision(v.id, 'REJECTED')}
                            className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white text-xs px-2.5 py-1"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Deny
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

        <Pagination meta={pagination} onPageChange={(p) => fetchVisitors(p)} />
      </div>

      {/* Pre-invite Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Pre-Invite Guest</h2>
            <p className="text-xs text-gray-500 mb-4">
              Security will verify the visitor using the generated pass code.
            </p>

            <form onSubmit={handleCreateVisitor} className="space-y-4">
              <div>
                <label className="label">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  className="input text-sm"
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    className="input text-sm"
                    value={formData.visitorPhone}
                    onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Visitor Type</label>
                  <select
                    className="select text-sm"
                    value={formData.visitorType}
                    onChange={(e) => setFormData({ ...formData, visitorType: e.target.value })}
                  >
                    <option value="GUEST">Guest / Friend</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="SERVICE">Service</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Expected Date *</label>
                  <input
                    type="date"
                    required
                    className="input text-sm"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="input font-mono text-sm uppercase"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Purpose of Visit *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend dinner, Courier delivery"
                  className="input text-sm"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
