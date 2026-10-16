import { useEffect, useState } from 'react';
import {
  CreditCard, Calendar, CheckCircle2, Clock,
  DollarSign, Receipt, AlertCircle, X, Loader2, ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loading, EmptyState, Pagination } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function ResidentMaintenance() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Payment Modal
  const [payingBill, setPayingBill] = useState<any | null>(null);
  const [payMethod, setPayMethod] = useState<'DEMO_PAYMENT' | 'UPI' | 'BANK_TRANSFER'>('DEMO_PAYMENT');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const fetchBills = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/maintenance', { params: { page, limit: 10 } });
      setBills(res.data.data || []);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load maintenance bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(1);
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;

    const remaining = Number(payingBill.amount) - Number(payingBill.paidAmount);

    try {
      setSubmittingPayment(true);
      await api.post('/payments', {
        billId: payingBill.id,
        amount: remaining,
        paymentMethod: payMethod,
        notes: `Online portal payment (${payMethod})`,
      });

      toast.success('Payment completed successfully!');
      setPayingBill(null);
      fetchBills(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Payment processing failed');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Bills & Dues"
        description="View society service charges, pay monthly invoices, and download receipts"
      />

      <div className="card overflow-hidden p-0">
        {loading ? (
          <Loading text="Loading maintenance invoices..." />
        ) : bills.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-12 h-12" />}
            title="No maintenance invoices"
            description="You currently have no pending or past maintenance bills."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Cycle Period</th>
                  <th>Amount</th>
                  <th>Paid</th>
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
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">
                            {b.billingMonth}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {monthNames[b.billingMonth - 1]} {b.billingYear}
                            </p>
                            <p className="text-[11px] text-gray-400">Regular Society Maintenance</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-bold text-gray-900 text-sm">₹{Number(b.amount).toLocaleString()}</span>
                      </td>
                      <td>
                        <span className="font-semibold text-emerald-700 text-xs">₹{Number(b.paidAmount).toLocaleString()}</span>
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
                        <div className="flex items-center justify-end gap-2">
                          {b.status !== 'PAID' && (
                            <button
                              onClick={() => setPayingBill(b)}
                              className="btn btn-sm bg-brand-600 hover:bg-brand-700 text-white text-xs px-3"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" />
                              Pay ₹{remaining.toLocaleString()}
                            </button>
                          )}
                          {b.payments?.length > 0 && (
                            <button
                              onClick={() => setSelectedReceipt(b.payments[0])}
                              className="btn-secondary btn-sm text-xs px-2.5"
                              title="View receipt"
                            >
                              <Receipt className="w-3.5 h-3.5 mr-1" />
                              Receipt
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

      {/* Pay Bill Modal */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setPayingBill(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Pay Maintenance Due</h2>
            <p className="text-xs text-gray-500 mb-4">
              Invoice for {monthNames[payingBill.billingMonth - 1]} {payingBill.billingYear}
            </p>

            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-4 text-center">
              <p className="text-xs text-brand-600 font-medium">Payable Balance</p>
              <p className="text-2xl font-bold text-brand-900 mt-0.5">
                ₹{(Number(payingBill.amount) - Number(payingBill.paidAmount)).toLocaleString()}
              </p>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="label">Select Payment Method</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="DEMO_PAYMENT"
                      checked={payMethod === 'DEMO_PAYMENT'}
                      onChange={() => setPayMethod('DEMO_PAYMENT')}
                      className="text-brand-600"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-gray-900">Instant Demo Gateway</p>
                      <p className="text-gray-500">Simulate successful online debit / credit card payment</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="UPI"
                      checked={payMethod === 'UPI'}
                      onChange={() => setPayMethod('UPI')}
                      className="text-brand-600"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-gray-900">UPI / QR Code</p>
                      <p className="text-gray-500">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={payMethod === 'BANK_TRANSFER'}
                      onChange={() => setPayMethod('BANK_TRANSFER')}
                      className="text-brand-600"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-gray-900">Net Banking / NEFT</p>
                      <p className="text-gray-500">Direct account transfer</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPayingBill(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="btn-primary"
                >
                  {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Payment Receipt</h3>
              <p className="text-xs text-gray-500 font-mono">
                {selectedReceipt.receipt?.receiptNumber || selectedReceipt.referenceNumber}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 space-y-2 text-xs text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount Paid:</span>
                <span className="font-bold text-gray-900 text-sm">₹{Number(selectedReceipt.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Mode:</span>
                <span className="font-medium text-gray-800">{selectedReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date & Time:</span>
                <span>{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="badge badge-success text-[10px]">SUCCESSFUL</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="btn-primary w-full text-xs"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
