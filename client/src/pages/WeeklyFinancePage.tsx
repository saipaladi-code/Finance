import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Search,
  Plus,
  Phone,
  CheckCircle,
  Eye,
  X,
  CreditCard,
  FileDown,
  Loader2,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api.js';
import { FinanceAccount, Customer, Payment, Installment } from '../types/index.js';
import { formatCurrency, formatCurrencyExact, formatDate, formatDateTime, getStatusBadgeClass } from '../utils/formatters.js';
import { CollectPaymentModal } from '../components/common/CollectPaymentModal.js';
import { ReceiptModal } from '../components/common/ReceiptModal.js';

export const WeeklyFinancePage: React.FC = () => {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [collectAccount, setCollectAccount] = useState<FinanceAccount | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [viewAccountDetails, setViewAccountDetails] = useState<{
    account: FinanceAccount;
    installments: Installment[];
    payments: Payment[];
  } | null>(null);

  // New Loan Form State
  const [newLoan, setNewLoan] = useState({
    customerId: '',
    principal: 10000,
    interestType: 'flat',
    interestRate: 20,
    interestAmount: 2000,
    documentCharges: 0,
    totalRepaymentAmount: 12000,
    installmentAmount: 1000,
    totalInstallments: 12,
    startDate: new Date().toISOString().split('T')[0],
    collectionDay: 'Monday',
    collectionAgent: 'R. Venkatesh',
    notes: '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [accRes, custRes] = await Promise.all([
        api.getWeeklyAccounts({ search, status: statusFilter, collectionDay: dayFilter }),
        api.getCustomers(),
      ]);
      if (accRes.success) setAccounts(accRes.accounts || []);
      if (custRes.success) setCustomers(custRes.customers || []);
    } catch (err) {
      console.error('Failed to load weekly finance data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, dayFilter]);

  const handlePrincipalChange = (val: number) => {
    const p = Math.max(0, val);
    let intAmt = newLoan.interestAmount;
    if (newLoan.interestType === 'percentage') {
      intAmt = (p * (newLoan.interestRate || 0)) / 100;
    }
    const totalRepay = p + intAmt + (newLoan.documentCharges || 0);
    const weeklyAmt = newLoan.totalInstallments > 0 ? Math.round(totalRepay / newLoan.totalInstallments) : 1000;
    setNewLoan({
      ...newLoan,
      principal: p,
      interestAmount: intAmt,
      totalRepaymentAmount: totalRepay,
      installmentAmount: weeklyAmt,
    });
  };

  const handleInterestAmountChange = (val: number) => {
    const intAmt = Math.max(0, val);
    const totalRepay = newLoan.principal + intAmt + (newLoan.documentCharges || 0);
    const weeklyAmt = newLoan.totalInstallments > 0 ? Math.round(totalRepay / newLoan.totalInstallments) : 1000;
    setNewLoan({
      ...newLoan,
      interestAmount: intAmt,
      totalRepaymentAmount: totalRepay,
      installmentAmount: weeklyAmt,
    });
  };

  const handleCreateWeeklyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoan.customerId) {
      setFormError('Please select a customer.');
      return;
    }
    setSubmitting(true);
    setFormError('');

    try {
      const res = await api.createWeeklyAccount(newLoan);
      if (res.success) {
        setShowAddModal(false);
        loadData();
      } else {
        setFormError(res.message || 'Error creating weekly loan.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Server error creating weekly loan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const res = await api.getWeeklyAccountById(id);
      if (res.success) {
        setViewAccountDetails(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Weekly Finance Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Explicit interest loan accounting, scheduled weekly collection days, and ledger
          </p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Issue Weekly Loan
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer name, phone, account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Collection Day Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Day:</span>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="all">All Days</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="all">All ({accounts.length})</option>
              <option value="active">Active Only</option>
              <option value="closed">Closed</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Weekly Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                <th className="py-3 px-4">Account No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Principal Loan</th>
                <th className="py-3 px-4">Explicit Interest</th>
                <th className="py-3 px-4">Weekly Installment</th>
                <th className="py-3 px-4">Total Paid (Weeks)</th>
                <th className="py-3 px-4">Remaining Balance</th>
                <th className="py-3 px-4">Collection Day</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading weekly accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No weekly finance accounts found.
                  </td>
                </tr>
              ) : (
                accounts.map((acc: any) => (
                  <tr key={acc._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {acc.accountNumber}
                      <span className="block text-[10px] text-slate-400 font-sans">
                        {acc.totalInstallments} weeks
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
                    </td>
                    <td className="py-3 px-4 font-semibold text-indigo-600">
                      {formatCurrency(acc.interestAmount)}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Total Repay: {formatCurrency(acc.totalRepaymentAmount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-700">
                      {formatCurrencyExact(acc.installmentAmount)}/week
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">
                      {formatCurrencyExact(acc.totalPaid)}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {acc.paidWeeks}/{acc.totalInstallments} weeks settled
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-rose-600">
                      {formatCurrencyExact(acc.remainingBalance)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700">
                        {acc.collectionDay || 'Monday'}
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
                          title="View Weekly Schedule & History"
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

      {/* Issue Weekly Loan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#0f172a] text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Issue Weekly Finance Loan</h2>
                <p className="text-xs text-slate-300">
                  e.g. ₹10,000 principal + ₹2,000 interest = ₹12,000 in 12 weeks
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWeeklyLoan} className="p-6 space-y-4">
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

              {/* Principal & Explicit Interest */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Principal (₹) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={newLoan.principal}
                    onChange={(e) => handlePrincipalChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Explicit Interest (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={newLoan.interestAmount}
                    onChange={(e) => handleInterestAmountChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-bold text-indigo-700 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Weekly Installment & Weeks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Installment (₹)</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={newLoan.installmentAmount}
                    onChange={(e) => {
                      const weekly = Number(e.target.value);
                      const w = weekly > 0 ? Math.ceil(newLoan.totalRepaymentAmount / weekly) : 12;
                      setNewLoan({
                        ...newLoan,
                        installmentAmount: weekly,
                        totalInstallments: w,
                      });
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold text-blue-700 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Weeks</label>
                  <input
                    type="number"
                    min="1"
                    max="104"
                    required
                    value={newLoan.totalInstallments}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      const weekly = w > 0 ? Math.round(newLoan.totalRepaymentAmount / w) : 1000;
                      setNewLoan({
                        ...newLoan,
                        totalInstallments: w,
                        installmentAmount: weekly,
                      });
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Calculation Summary Card */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Total Repayment:</span>
                  <p className="text-base font-extrabold text-indigo-900 mt-0.5">
                    {formatCurrency(newLoan.totalRepaymentAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-medium">Weekly Schedule:</span>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {newLoan.totalInstallments} weeks × {formatCurrency(newLoan.installmentAmount)}
                  </p>
                </div>
              </div>

              {/* Collection Day & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Collection Day</label>
                  <select
                    value={newLoan.collectionDay}
                    onChange={(e) => setNewLoan({ ...newLoan, collectionDay: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Monday">Every Monday</option>
                    <option value="Tuesday">Every Tuesday</option>
                    <option value="Wednesday">Every Wednesday</option>
                    <option value="Thursday">Every Thursday</option>
                    <option value="Friday">Every Friday</option>
                    <option value="Saturday">Every Saturday</option>
                    <option value="Sunday">Every Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Starting Date</label>
                  <input
                    type="date"
                    required
                    value={newLoan.startDate}
                    onChange={(e) => setNewLoan({ ...newLoan, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
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
                  Create Weekly Loan
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

      {/* Weekly Account Details Modal */}
      {viewAccountDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-[#0f172a] text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Weekly Loan: {viewAccountDetails.account.accountNumber}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                    {viewAccountDetails.account.status.toUpperCase()}
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Customer: {(viewAccountDetails.account.customerId as any)?.name} • Collection Day: {viewAccountDetails.account.collectionDay}
                </p>
              </div>
              <button
                onClick={() => setViewAccountDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 p-5 bg-slate-50 border-b border-slate-200 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Principal Loan</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {formatCurrency(viewAccountDetails.account.principal)}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Explicit Interest</span>
                <p className="text-base font-bold text-indigo-600 mt-0.5">
                  {formatCurrency(viewAccountDetails.account.interestAmount)}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Weekly Due</span>
                <p className="text-base font-bold text-blue-600 mt-0.5">
                  {formatCurrency(viewAccountDetails.account.installmentAmount)}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Remaining Balance</span>
                <p className="text-base font-bold text-rose-600 mt-0.5">
                  {formatCurrency(viewAccountDetails.account.remainingBalance)}
                </p>
              </div>
            </div>

            <div className="p-6 max-h-[55vh] overflow-y-auto space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Week-by-Week Installment Schedule ({viewAccountDetails.installments.length} Weeks)
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="p-2.5">Week #</th>
                        <th className="p-2.5">Due Date</th>
                        <th className="p-2.5">Expected</th>
                        <th className="p-2.5">Paid</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Settled Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewAccountDetails.installments.map((inst) => (
                        <tr key={inst._id}>
                          <td className="p-2.5 font-bold text-slate-800">Week {inst.installmentNumber}</td>
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
                        <th className="p-2.5">Method</th>
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

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewAccountDetails(null)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReceipt && (
        <ReceiptModal payment={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  );
};

