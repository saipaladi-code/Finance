import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A] tracking-tight">
            {t('payments.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t('payments.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
          >
            <FileDown className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <FileDown className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('common.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#F5F7FB] focus:bg-white transition-all"
            />
          </div>

          {/* Finance Segment */}
          <div>
            <select
              value={financeType}
              onChange={(e) => setFinanceType(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="all">{t('collections.allTypes')}</option>
              <option value="daily">{t('nav.dailyFinance')}</option>
              <option value="weekly">{t('nav.weeklyFinance')}</option>
              <option value="chitti">{t('nav.chitti')}</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="all">{t('payments.paymentMethod')}: {t('common.all')}</option>
              <option value="cash">{t('payments.cash')}</option>
              <option value="gpay">{t('payments.gpay')} (UPI)</option>
              <option value="phonepe">{t('payments.phonepe')} (UPI)</option>
              <option value="bank_transfer">{t('payments.bankTransfer')}</option>
            </select>
          </div>

          {/* Date from */}
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300"
            />
          </div>
        </div>

        {/* Aggregate Banner */}
        <div className="flex items-center justify-between p-3.5 bg-[#F5F7FB] rounded-xl border border-slate-200 text-xs sm:text-sm">
          <span className="font-semibold text-slate-600">
            {t('payments.title')} ({payments.length})
          </span>
          <span className="font-bold text-slate-800">
            {t('dashboard.totalCollected')}: <strong className="font-black text-emerald-700 text-base">{formatCurrencyExact(totalCollected)}</strong>
          </span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-[#F5F7FB]">
                <th className="py-3 px-4">{t('payments.receiptNo')}</th>
                <th className="py-3 px-4">{t('dashboard.customer')}</th>
                <th className="py-3 px-4">{t('payments.financeType')}</th>
                <th className="py-3 px-4">{t('dashboard.paymentDate')}</th>
                <th className="py-3 px-4">{t('dashboard.paymentMethod')}</th>
                <th className="py-3 px-4">{t('dashboard.amount')}</th>
                <th className="py-3 px-4">{t('common.status')}</th>
                <th className="py-3 px-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    {t('common.loading')}
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {t('payments.emptyPayments')}
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <div>{p.receiptNumber}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{p.transactionId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {p.customerId?.name || 'Customer'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 capitalize">
                      {p.financeType}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {formatDateTime(p.paymentDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-800 uppercase">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600">
                      {formatCurrencyExact(p.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.isReversed ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 uppercase">
                          Reversed
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 uppercase border border-emerald-200">
                          {t('common.paid')} ✓
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Official Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        {!p.isReversed && (
                          <button
                            onClick={() => {
                              setReversingPayment(p);
                              setReversalReason('');
                              setReversalError('');
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Reverse Payment Transaction"
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

      {/* Reversal Modal */}
      {reversingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-rose-950 text-white flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" /> Reverse Payment
              </h2>
              <button
                onClick={() => setReversingPayment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReversePayment} className="p-6 space-y-4">
              {reversalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {reversalError}
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p>
                  <strong>Receipt #:</strong> {reversingPayment.receiptNumber}
                </p>
                <p>
                  <strong>Amount:</strong> {formatCurrencyExact(reversingPayment.amount)}
                </p>
                <p>
                  <strong>Customer:</strong> {reversingPayment.customerId?.name}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Transaction Reversal *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Bounced cheque, duplicated cash entry, wrong customer..."
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
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={reversalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {reversalSubmitting ? t('common.loading') : 'Confirm Reversal'}
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
