import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Calendar,
  RotateCcw,
  Eye,
  FileDown,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Payment } from '../types/index.js';
import { formatCurrency, formatCurrencyExact, formatDate, formatDateTime, getStatusBadgeClass } from '../utils/formatters.js';
import { ReceiptModal } from '../components/common/ReceiptModal.js';
import { exportToExcel, exportToCSV } from '../utils/excelExport.js';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCollected, setTotalCollected] = useState<number>(0);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [financeType, setFinanceType] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [reversingPayment, setReversingPayment] = useState<Payment | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');
  const [reversalSubmitting, setReversalSubmitting] = useState<boolean>(false);
  const [reversalError, setReversalError] = useState<string>('');

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await api.getPayments({
        search,
        financeType,
        paymentMethod,
        startDate,
        endDate,
      });
      if (res.success) {
        setPayments(res.payments || []);
        setTotalCollected(res.totalCollected || 0);
      }
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [financeType, paymentMethod, startDate, endDate, search]);

  const handleReversePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingPayment || !reversalReason.trim()) {
      setReversalError('A valid audit reason is required for reversal.');
      return;
    }

    setReversalSubmitting(true);
    setReversalError('');

    try {
      const res = await api.reversePayment(reversingPayment._id, reversalReason);
      if (res.success) {
        setReversingPayment(null);
        setReversalReason('');
        loadPayments();
      } else {
        setReversalError(res.message || 'Error reversing transaction.');
      }
    } catch (err: any) {
      setReversalError(err.message || 'Server error reversing transaction.');
    } finally {
      setReversalSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const exportRows = payments.map((p) => ({
      'Receipt No': p.receiptNumber,
      'Transaction ID': p.transactionId,
      'Customer Name': p.customerId?.name || 'Customer',
      'Phone': p.customerId?.phone || '-',
      'Segment': p.financeType.toUpperCase(),
      'Payment Date': formatDateTime(p.paymentDate),
      'Payment Method': p.paymentMethod.toUpperCase(),
      'Amount (INR)': p.amount,
      'Reference / UTR': p.transactionReference || '',
      'Status': p.isReversed ? 'REVERSED' : p.paymentStatus.toUpperCase(),
      'Recorded By': p.recordedBy || 'Admin',
    }));
    exportToExcel(exportRows, `Payments_Ledger_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCSV = () => {
    const exportRows = payments.map((p) => ({
      'Receipt No': p.receiptNumber,
      'Transaction ID': p.transactionId,
      'Customer Name': p.customerId?.name || 'Customer',
      'Phone': p.customerId?.phone || '-',
      'Segment': p.financeType.toUpperCase(),
      'Payment Date': formatDateTime(p.paymentDate),
      'Payment Method': p.paymentMethod.toUpperCase(),
      'Amount (INR)': p.amount,
      'Reference / UTR': p.transactionReference || '',
      'Status': p.isReversed ? 'REVERSED' : p.paymentStatus.toUpperCase(),
    }));
    exportToCSV(exportRows, `Payments_Ledger_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments & Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized transaction registry, receipts, audit history, and reversals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Txn ID, Receipt, Customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Finance Segment */}
          <div>
            <select
              value={financeType}
              onChange={(e) => setFinanceType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="all">All Segments</option>
              <option value="daily">Daily Finance</option>
              <option value="weekly">Weekly Finance</option>
              <option value="chitti">Chitti (Chit Fund)</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="all">All Modes</option>
              <option value="cash">Cash Only</option>
              <option value="gpay">Google Pay (UPI)</option>
              <option value="phonepe">PhonePe (UPI)</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          {/* Date from */}
          <div className="flex gap-2">
            <input
              type="date"
              placeholder="From"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300"
            />
          </div>
        </div>

        {/* Totals Banner */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{payments.length}</strong> recorded transactions
          </span>
          <span className="text-xs font-semibold text-slate-700">
            Total Net Inflow:{' '}
            <strong className="text-base font-black text-emerald-600">{formatCurrencyExact(totalCollected)}</strong>
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                <th className="py-3 px-4">Receipt / Txn ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Segment</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading payments ledger...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr
                    key={p._id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      p.isReversed ? 'bg-rose-50/30 line-through text-slate-400' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div>{p.receiptNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{p.transactionId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.customerId?.name || 'Customer'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.customerId?.phone}</p>
                    </td>
                    <td className="py-3 px-4 capitalize font-medium text-slate-700">
                      {p.financeType}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDateTime(p.paymentDate)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-700 uppercase">
                        {p.paymentMethod}
                      </span>
                      {p.transactionReference && (
                        <span className="block font-mono text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                          {p.transactionReference}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-emerald-700 text-sm">
                      {formatCurrencyExact(p.amount)}
                    </td>
                    <td className="py-3 px-4">
                      {p.isReversed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          Reversed
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadgeClass(p.paymentStatus)}`}>
                          {p.paymentStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Digital Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        {!p.isReversed && (
                          <button
                            onClick={() => {
                              setReversalError('');
                              setReversalReason('');
                              setReversingPayment(p);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Reverse Transaction (Audit Protected)"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reverse Payment Modal */}
      {reversingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
                <h2 className="text-base font-bold text-white">Reverse Payment Transaction</h2>
              </div>
              <button
                onClick={() => setReversingPayment(null)}
                className="p-1.5 rounded-lg text-rose-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReversePayment} className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 leading-relaxed">
                <p className="font-bold mb-1">Audit Protection Notice:</p>
                <p>
                  Reversing transaction <strong className="font-mono">{reversingPayment.transactionId}</strong> will
                  re-open the customer's installment and restore their loan balance by{' '}
                  <strong>{formatCurrencyExact(reversingPayment.amount)}</strong>.
                </p>
              </div>

              {reversalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {reversalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Reversal (Required for Audit Trail) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Bounced cheque, wrong customer account selected, duplicate entry..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReversingPayment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reversalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {reversalSubmitting ? 'Reversing...' : 'Confirm Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal payment={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  );
};

