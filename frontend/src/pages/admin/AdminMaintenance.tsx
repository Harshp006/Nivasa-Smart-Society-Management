import { useEffect, useState } from 'react';
import {
  Wrench, Plus, Search, Filter, Calendar, CreditCard,
  CheckCircle2, Clock, DollarSign, X, Loader2, Receipt
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, Pagination, StatCard } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminMaintenance() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Generate bulk bills modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    billingMonth: new Date().getMonth() + 1,
    billingYear: new Date().getFullYear(),
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Record payment modal
  const [selectedBillForPay, setSelectedBillForPay] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI'>('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);

  // View receipt modal
  const [receiptBill, setReceiptBill] = useState<any | null>(null);

  const fetchBills = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/maintenance', { params });
      setBills(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch maintenance bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(1);
  }, [statusFilter]);

  const handleGenerateBills = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Fetch society ID first from apartments or default
      const apts = await api.get('/apartments?limit=1');
      const societyId = apts.data.data?.[0]?.societyId;

      await api.post('/maintenance/generate', {
        societyId: societyId || 'default-society',
        billingMonth: Number(generateForm.billingMonth),
        billingYear: Number(generateForm.billingYear),
        dueDate: generateForm.dueDate,
      });

      toast.success('Maintenance bills generated for occupied apartments');
      setShowGenerateModal(false);
      fetchBills(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate bills');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForPay) return;

    try {
      setPaying(true);
      await api.post('/payments', {
        billId: selectedBillForPay.id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        notes: payNotes,
      });

      toast.success('Payment recorded successfully');
      setSelectedBillForPay(null);
      fetchBills(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaying(false);
    }
  };

  const totalBilled = bills.reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const totalPaid = bills.reduce((acc, b) => acc + Number(b.paidAmount || 0), 0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance & Billing"
        description="Generate recurring society charges, track dues, and manage collections"
        action={
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Monthly Bills
          </button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Current Page Invoiced"
          value={`₹${totalBilled.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Collected"
          value={`₹${totalPaid.toLocaleString()}`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Outstanding Due"
          value={`₹${Math.max(0, totalBilled - totalPaid).toLocaleString()}`}
          icon={<Clock className="w-5 h-5 text-rose-600" />}
          iconBg="bg-rose-50"
        />
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="select text-sm w-full sm:w-44"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Payment Statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading maintenance invoices..." />
        ) : bills.length === 0 ? (
          <EmptyState
            icon={<Wrench className="w-12 h-12" />}
            title="No maintenance bills generated"
            description="Use the button above to generate monthly invoices."
            action={
              <button onClick={() => setShowGenerateModal(true)} className="btn-primary btn-sm">
                Generate Invoices
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Billing Cycle</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => {
                  const remaining = Number(b.amount) - Number(b.paidAmount);
                  return (
                    <tr key={b.id}>
                      <td>
                        <span className="font-semibold text-gray-900">
                          {b.apartment?.building} - {b.apartment?.unitNumber}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {monthNames[b.billingMonth - 1]} {b.billingYear}
                        </div>
                      </td>
                      <td>
                        <span className="font-bold text-gray-900">₹{Number(b.amount).toLocaleString()}</span>
                      </td>
                      <td>
                        <span className="text-emerald-700 font-semibold text-xs">
                          ₹{Number(b.paidAmount).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-500">
                          {new Date(b.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.status !== 'PAID' && (
                            <button
                              onClick={() => {
                                setSelectedBillForPay(b);
                                setPayAmount(remaining);
                              }}
                              className="btn btn-sm bg-brand-600 hover:bg-brand-700 text-white text-xs px-2.5 py-1"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" />
                              Record Pay
                            </button>
                          )}
                          {b.payments && b.payments.length > 0 && (
                            <button
                              onClick={() => setReceiptBill(b)}
                              className="btn-secondary btn-sm text-xs px-2.5 py-1"
                              title="View Receipts"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={pagination} onPageChange={(p) => fetchBills(p)} />
      </div>

      {/* Generate Bulk Bills Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setShowGenerateModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Generate Monthly Bills</h2>
            <p className="text-xs text-gray-500 mb-4">
              Issues bills to all occupied apartments using their standard monthly rates.
            </p>

            <form onSubmit={handleGenerateBills} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Billing Month</label>
                  <select
                    className="select"
                    value={generateForm.billingMonth}
                    onChange={(e) => setGenerateForm({ ...generateForm, billingMonth: parseInt(e.target.value) })}
                  >
                    {monthNames.map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Billing Year</label>
                  <input
                    type="number"
                    required
                    min={2024}
                    className="input"
                    value={generateForm.billingYear}
                    onChange={(e) => setGenerateForm({ ...generateForm, billingYear: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Due Date *</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={generateForm.dueDate}
                  onChange={(e) => setGenerateForm({ ...generateForm, dueDate: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Invoices'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {selectedBillForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedBillForPay(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Record Payment</h2>
            <p className="text-xs text-gray-500 mb-4">
              Apt {selectedBillForPay.apartment?.building} - {selectedBillForPay.apartment?.unitNumber} • {monthNames[selectedBillForPay.billingMonth - 1]} {selectedBillForPay.billingYear}
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="label">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  max={Number(selectedBillForPay.amount) - Number(selectedBillForPay.paidAmount)}
                  min={1}
                  className="input font-semibold text-lg"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Remaining balance: ₹{(Number(selectedBillForPay.amount) - Number(selectedBillForPay.paidAmount)).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="label">Payment Mode</label>
                <select
                  className="select"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / GPay</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="label">Reference / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Cheque #492812 or NEFT ref"
                  className="input"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedBillForPay(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="btn-primary"
                >
                  {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipts Drawer */}
      {receiptBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setReceiptBill(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Payment Receipts</h2>
            <p className="text-xs text-gray-500 mb-4">
              Invoices for Unit {receiptBill.apartment?.building} - {receiptBill.apartment?.unitNumber}
            </p>

            <div className="space-y-3">
              {receiptBill.payments?.map((p: any) => (
                <div key={p.id} className="border border-gray-200 rounded-xl p-3.5 bg-gray-50 text-xs space-y-1">
                  <div className="flex justify-between items-center font-bold text-gray-900">
                    <span>Receipt: {p.receipt?.receiptNumber || p.referenceNumber}</span>
                    <span className="text-emerald-700 font-bold">₹{Number(p.amount).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-500 flex justify-between">
                    <span>Method: {p.paymentMethod}</span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  {p.notes && <p className="text-gray-400 italic">Note: {p.notes}</p>}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setReceiptBill(null)} className="btn-secondary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
