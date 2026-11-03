import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Phone,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Eye,
  X,
  CreditCard,
  FileDown,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { api } from '../services/api.js';
import { FinanceAccount, Customer, Payment, Installment } from '../types/index.js';
import { formatCurrency, formatCurrencyExact, formatDate, formatDateTime, getStatusBadgeClass } from '../utils/formatters.js';
import { CollectPaymentModal } from '../components/common/CollectPaymentModal.js';
import { ReceiptModal } from '../components/common/ReceiptModal.js';
import { generatePaymentReceiptPDF } from '../utils/pdfGenerator.js';
import { useAuth } from '../context/AuthContext.js';

export const DailyFinancePage: React.FC = () => {
  const { businessSettings } = useAuth();
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [collectAccount, setCollectAccount] = useState<FinanceAccount | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [viewAccountDetails, setViewAccountDetails] = useState<{
    account: FinanceAccount;
    installments: Installment[];
    payments: Payment[];
  } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  // New Loan Form State
  const [newLoan, setNewLoan] = useState({
    customerId: '',
    principal: 10000,
    interestType: 'flat',
    interestRate: 0,
    interestAmount: 0,
    documentCharges: 0,
    totalRepaymentAmount: 10000,
    installmentAmount: 100,
    totalInstallments: 100,
    startDate: new Date().toISOString().split('T')[0],
    collectionAgent: 'R. Venkatesh',
    notes: '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [accRes, custRes] = await Promise.all([
        api.getDailyAccounts({ search, status: statusFilter }),
        api.getCustomers(),
      ]);
      if (accRes.success) setAccounts(accRes.accounts || []);
      if (custRes.success) setCustomers(custRes.customers || []);
    } catch (err) {
      console.error('Failed to load daily finance data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  // Recalculate totals automatically when principal / interest / installments change
  const handlePrincipalChange = (val: number) => {
    const p = Math.max(0, val);
    let intAmt = newLoan.interestAmount;
    if (newLoan.interestType === 'percentage') {
      intAmt = (p * (newLoan.interestRate || 0)) / 100;
    }
    const totalRepay = p + intAmt + (newLoan.documentCharges || 0);
    const instAmt = newLoan.totalInstallments > 0 ? Math.round(totalRepay / newLoan.totalInstallments) : 100;
    setNewLoan({
      ...newLoan,
      principal: p,
      interestAmount: intAmt,
      totalRepaymentAmount: totalRepay,
      installmentAmount: instAmt,
    });
  };

  const handleInstallmentAmountChange = (instAmt: number) => {
    const days = instAmt > 0 ? Math.ceil(newLoan.totalRepaymentAmount / instAmt) : 100;
    setNewLoan({
      ...newLoan,
      installmentAmount: instAmt,
      totalInstallments: days,
    });
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoan.customerId) {
      setFormError('Please select a customer.');
      return;
    }
    setSubmitting(true);
    setFormError('');

    try {
      const res = await api.createDailyAccount(newLoan);
      if (res.success) {
        setShowAddModal(false);
        loadData();
      } else {
        setFormError(res.message || 'Error creating daily finance account.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Server error creating loan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetails = async (id: string) => {
    setDetailsLoading(true);
    try {
      const res = await api.getDailyAccountById(id);
      if (res.success) {
        setViewAccountDetails(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daily Finance Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage micro-loans, daily installment collections, schedules, and live balances
          </p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Issue Daily Loan
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer name, phone, account no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Accounts ({accounts.length})</option>
            <option value="active">Active Only</option>
            <option value="closed">Closed / Fully Settled</option>
            <option value="defaulted">Defaulted</option>
          </select>
        </div>
      </div>

      {/* Daily Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                <th className="py-3 px-4">Account No</th>
                <th className="py-3 px-4">Customer Name & Phone</th>
                <th className="py-3 px-4">Principal Loan</th>
                <th className="py-3 px-4">Daily Due</th>
                <th className="py-3 px-4">Total Paid</th>
                <th className="py-3 px-4">Remaining Balance</th>
                <th className="py-3 px-4">Today's Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading daily accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No daily finance accounts found.
                  </td>
                </tr>
              ) : (
                accounts.map((acc: any) => (
                  <tr key={acc._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {acc.accountNumber}
                      <span className="block text-[10px] text-slate-400 font-sans">
                        {acc.totalInstallments} days duration
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{acc.customer.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {acc.customer.phone}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {formatCurrency(acc.principal)}
                      {acc.interestAmount > 0 && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          +{formatCurrency(acc.interestAmount)} interest
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-600">
                      {formatCurrencyExact(acc.installmentAmount)}/day
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">
                      {formatCurrencyExact(acc.totalPaid)}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {acc.completedInstallments}/{acc.totalInstallments} paid
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-rose-600">
                      {formatCurrencyExact(acc.remainingBalance)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${getStatusBadgeClass(acc.todayStatus)}`}>
                        {acc.todayStatus === 'paid'
                          ? 'Paid Today ✓'
                          : acc.todayStatus === 'partially_paid'
                          ? 'Partial Today'
                          : acc.todayStatus === 'overdue'
                          ? 'Overdue ⚠️'
                          : 'Pending Today'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {acc.status === 'active' && acc.remainingBalance > 0 && (
                          <button
                            onClick={() => setCollectAccount(acc)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
                          >
                            Collect
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDetails(acc._id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View 100-Day Schedule & Ledger"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Daily Loan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#0f172a] text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Issue Daily Finance Loan</h2>
                <p className="text-xs text-slate-300">e.g. ₹10,000 for 100 days @ ₹100/day</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer *</label>
                <select
                  required
                  value={newLoan.customerId}
                  onChange={(e) => setNewLoan({ ...newLoan, customerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                >
                  <option value="">-- Choose registered customer --</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.customerId}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Configuration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Principal (₹) *</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    required
                    value={newLoan.principal}
                    onChange={(e) => handlePrincipalChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Interest Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newLoan.interestAmount}
                    onChange={(e) => {
                      const intAmt = Number(e.target.value);
                      const total = newLoan.principal + intAmt + newLoan.documentCharges;
                      setNewLoan({
                        ...newLoan,
                        interestAmount: intAmt,
                        totalRepaymentAmount: total,
                        installmentAmount: Math.round(total / newLoan.totalInstallments),
                      });
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Installment (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newLoan.installmentAmount}
                    onChange={(e) => handleInstallmentAmountChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-bold text-blue-700 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newLoan.totalInstallments}
                    onChange={(e) => {
                      const days = Number(e.target.value);
                      const inst = days > 0 ? Math.round(newLoan.totalRepaymentAmount / days) : 100;
                      setNewLoan({
                        ...newLoan,
                        totalInstallments: days,
                        installmentAmount: inst,
                      });
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Automatic Calculation Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Total Repayment Amount:</span>
                  <p className="text-base font-extrabold text-blue-800 mt-0.5">
                    {formatCurrency(newLoan.totalRepaymentAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-medium">Daily Schedule:</span>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {newLoan.totalInstallments} days × {formatCurrency(newLoan.installmentAmount)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLoan.startDate}
                    onChange={(e) => setNewLoan({ ...newLoan, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Collection Agent</label>
                  <input
                    type="text"
                    value={newLoan.collectionAgent}
                    onChange={(e) => setNewLoan({ ...newLoan, collectionAgent: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Daily market collection at 5 PM"
                  value={newLoan.notes}
                  onChange={(e) => setNewLoan({ ...newLoan, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Create Loan & Generate Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {collectAccount && (
        <CollectPaymentModal
          account={collectAccount}
          onClose={() => setCollectAccount(null)}
          onSuccess={() => {
            setCollectAccount(null);
            loadData();
          }}
        />
      )}

      {/* Loan Details Modal (100-Day Schedule + Ledger) */}
      {viewAccountDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-[#0f172a] text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Daily Loan Details: {viewAccountDetails.account.accountNumber}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                    {viewAccountDetails.account.status.toUpperCase()}
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Customer: {(viewAccountDetails.account.customerId as any)?.name} ({(viewAccountDetails.account.customerId as any)?.phone})
                </p>
              </div>
              <button
                onClick={() => setViewAccountDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-3 p-5 bg-slate-50 border-b border-slate-200 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Principal Loan</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {formatCurrency(viewAccountDetails.account.principal)}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Daily Installment</span>
                <p className="text-base font-bold text-blue-600 mt-0.5">
                  {formatCurrency(viewAccountDetails.account.installmentAmount)}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Total Paid</span>
                <p className="text-base font-bold text-emerald-600 mt-0.5">
                  {formatCurrency(viewAccountDetails.account.totalPaid)}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Remaining Balance</span>
                <p className="text-base font-bold text-rose-600 mt-0.5">
                  {formatCurrency(viewAccountDetails.account.remainingBalance)}
                </p>
              </div>
            </div>

            {/* Installments Table */}
            <div className="p-6 max-h-[55vh] overflow-y-auto space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Day-by-Day Installment Schedule ({viewAccountDetails.installments.length} Days)
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="p-2.5">Day #</th>
                        <th className="p-2.5">Due Date</th>
                        <th className="p-2.5">Expected</th>
                        <th className="p-2.5">Amount Paid</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Settled Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewAccountDetails.installments.map((inst) => (
                        <tr key={inst._id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-800">Day {inst.installmentNumber}</td>
                          <td className="p-2.5 text-slate-600">{formatDate(inst.dueDate)}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{formatCurrencyExact(inst.expectedAmount)}</td>
                          <td className="p-2.5 font-semibold text-emerald-600">{formatCurrencyExact(inst.paidAmount)}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${getStatusBadgeClass(inst.status)}`}>
                              {inst.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right text-slate-500">
                            {inst.paidDate ? formatDate(inst.paidDate) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments Ledger */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Payments Received ({viewAccountDetails.payments.length})
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="p-2.5">Receipt #</th>
                        <th className="p-2.5">Txn ID</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Mode</th>
                        <th className="p-2.5 text-right">Amount</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewAccountDetails.payments.map((p) => (
                        <tr key={p._id}>
                          <td className="p-2.5 font-bold text-blue-700">{p.receiptNumber}</td>
                          <td className="p-2.5 font-mono text-slate-600">{p.transactionId}</td>
                          <td className="p-2.5 text-slate-600">{formatDateTime(p.paymentDate)}</td>
                          <td className="p-2.5 uppercase">{p.paymentMethod}</td>
                          <td className="p-2.5 text-right font-extrabold text-emerald-600">
                            {formatCurrencyExact(p.amount)}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => setSelectedReceipt(p)}
                              className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                            >
                              Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewAccountDetails(null)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-colors"
              >
                Close Details
              </button>
            </div>
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
