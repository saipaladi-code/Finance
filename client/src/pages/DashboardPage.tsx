import React, { useState, useEffect } from 'react';
import {
  Users,
  BadgeIndianRupee,
  Coins,
  TrendingUp,
  AlertTriangle,
  Clock,
  Calendar,
  CalendarDays,
  FileText,
  ArrowUpRight,
  RefreshCw,
  Receipt,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../services/api.js';
import { DashboardStats, Payment, FinanceAccount } from '../types/index.js';
import { formatCurrency, formatCurrencyExact, formatDate, formatDateTime, getStatusBadgeClass } from '../utils/formatters.js';
import { StatCard } from '../components/common/StatCard.js';
import { ReceiptModal } from '../components/common/ReceiptModal.js';
import { CollectPaymentModal } from '../components/common/CollectPaymentModal.js';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [collectAccount, setCollectAccount] = useState<FinanceAccount | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleQuickCollect = async (accountId: string, financeType: 'daily' | 'weekly') => {
    try {
      let res;
      if (financeType === 'daily') {
        res = await api.getDailyAccountById(accountId);
      } else {
        res = await api.getWeeklyAccountById(accountId);
      }
      if (res.success && res.account) {
        setCollectAccount(res.account);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewReceipt = async (transactionId: string) => {
    try {
      const res = await api.getPaymentById(transactionId);
      if (res.success && res.payment) {
        setSelectedReceipt(res.payment);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading live dashboard metrics...</p>
        </div>
      </div>
    );
  }

  const cards = data?.cards;
  const charts = data?.charts;
  const sections = data?.sections;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Main Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial status, daily/weekly collections & chit groups tracking
          </p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* 10 Dashboard Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Customers"
          value={cards?.totalCustomers || 0}
          subtitle="Registered borrowers & members"
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Money Distributed"
          value={formatCurrency(cards?.totalMoneyDistributed)}
          subtitle="Loans + Chit payouts"
          icon={TrendingUp}
          colorScheme="indigo"
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(cards?.totalAmountCollected)}
          subtitle="Cumulative verified inflows"
          icon={BadgeIndianRupee}
          colorScheme="emerald"
        />
        <StatCard
          title="Today's Collection"
          value={formatCurrency(cards?.todayCollection)}
          subtitle="Received today"
          icon={Coins}
          colorScheme="emerald"
        />
        <StatCard
          title="Total Outstanding"
          value={formatCurrency(cards?.totalOutstandingAmount)}
          subtitle="Active uncollected balance"
          icon={Clock}
          colorScheme="rose"
        />
        <StatCard
          title="Today's Due Count"
          value={cards?.todayPendingPaymentsCount || 0}
          subtitle={`Expected: ${formatCurrency(cards?.todayExpectedAmount)}`}
          icon={Calendar}
          colorScheme="amber"
        />
        <StatCard
          title="Overdue Accounts"
          value={cards?.overdueCustomersCount || 0}
          subtitle="Past scheduled due date"
          icon={AlertTriangle}
          colorScheme="rose"
        />
        <StatCard
          title="Active Daily Loans"
          value={cards?.activeDailyAccounts || 0}
          subtitle="Daily installment accounts"
          icon={Calendar}
          colorScheme="blue"
        />
        <StatCard
          title="Active Weekly Loans"
          value={cards?.activeWeeklyAccounts || 0}
          subtitle="Weekly installment accounts"
          icon={CalendarDays}
          colorScheme="indigo"
        />
        <StatCard
          title="Active Chit Groups"
          value={cards?.activeChittiGroups || 0}
          subtitle="Ongoing chit circles"
          icon={Coins}
          colorScheme="amber"
        />
      </div>

      {/* 5 Financial Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Daily Collection Trend (7 Days) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daily Collections Breakdown (Past 7 Days)</h2>
              <p className="text-[11px] text-slate-500">Breakdown across Daily, Weekly, and Chitti remittances</p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
              Live Flow
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.dailyCollection || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="daily" name="Daily Finance" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDaily)" strokeWidth={2} />
                <Area type="monotone" dataKey="weekly" name="Weekly Finance" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorWeekly)" strokeWidth={2} />
                <Area type="monotone" dataKey="chitti" name="Chitti (Chits)" stroke="#f59e0b" fill="#f59e0b" strokeWidth={2} fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Total Collection vs Outstanding (Donut) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Collection vs Outstanding</h2>
            <p className="text-[11px] text-slate-500">Recovery ratio of distributed funds</p>
          </div>
          <div className="h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.collectionVsOutstanding || []}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts?.collectionVsOutstanding || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <span className="block text-[10px] text-emerald-600 font-medium">Total Collected</span>
              <span className="font-bold">{formatCurrency(cards?.totalAmountCollected)}</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-800">
              <span className="block text-[10px] text-rose-600 font-medium">Total Outstanding</span>
              <span className="font-bold">{formatCurrency(cards?.totalOutstandingAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Monthly Collection Performance */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Monthly Revenue Inflows (Last 6 Months)</h2>
              <p className="text-[11px] text-slate-500">Aggregated collections across all business segments</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.monthlyCollection || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="collection" name="Collections" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Finance Distribution */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Portfolio Distribution by Segment</h2>
              <p className="text-[11px] text-slate-500">Capital allocation between Daily, Weekly & Chits</p>
            </div>
          </div>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.financeDistribution || []}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {(charts?.financeDistribution || []).map((entry, index) => (
                    <Cell key={`dist-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3 Dashboard Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Today's Scheduled Payments */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today's Scheduled Collections</h2>
              <p className="text-[11px] text-slate-500">Customers scheduled to pay installments today</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {sections?.todayPayments.length || 0} scheduled
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Expected</th>
                  <th className="py-2.5 px-3">Paid</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sections?.todayPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No payments scheduled due for today.
                    </td>
                  </tr>
                ) : (
                  sections?.todayPayments.map((row: any) => (
                    <tr key={row._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{row.customerName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{row.phoneNumber}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize font-medium text-slate-700">{row.financeType}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {formatCurrencyExact(row.expectedAmount)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-600">
                        {formatCurrencyExact(row.paidAmount)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${getStatusBadgeClass(row.paymentStatus)}`}>
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {row.paymentStatus !== 'paid' ? (
                          <button
                            onClick={() => handleQuickCollect(row.accountNumber, row.financeType)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
                          >
                            Collect
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">Done ✓</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Overdue Follow-up List */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Overdue Defaulters</h2>
              <p className="text-[11px] text-slate-500">Customers with missed due dates</p>
            </div>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-700 rounded-full">
              {sections?.overdueCustomers.length || 0}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-96 space-y-3">
            {sections?.overdueCustomers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                🎉 No overdue customers! All installments on time.
              </div>
            ) : (
              sections?.overdueCustomers.map((cust: any) => (
                <div
                  key={cust.customerId}
                  className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between gap-3 hover:bg-rose-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{cust.customerName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{cust.phoneNumber}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                      {cust.pendingInstallmentsCount} pending dues
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-rose-600">{formatCurrencyExact(cust.pendingAmount)}</p>
                    <p className="text-[10px] text-slate-400">Due since {formatDate(cust.oldestDueDate)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Recent 10 Transactions Table */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-[11px] text-slate-500">Live verified payments recorded into ledger</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                <th className="py-2.5 px-3">Receipt / Txn ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Segment</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sections?.recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                sections?.recentTransactions.map((tx: any) => (
                  <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-900">
                      <div>{tx.receiptNumber}</div>
                      <div className="text-[10px] text-slate-400">{tx.transactionId}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">{tx.customerName}</td>
                    <td className="py-3 px-3 capitalize text-slate-600">{tx.financeType}</td>
                    <td className="py-3 px-3 text-slate-600">{formatDateTime(tx.paymentDate)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 text-slate-700 uppercase">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-700">
                      {formatCurrencyExact(tx.amount)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleViewReceipt(tx._id)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View & Print Official Receipt"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal payment={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}

      {/* Collect Payment Modal */}
      {collectAccount && (
        <CollectPaymentModal
          account={collectAccount}
          onClose={() => setCollectAccount(null)}
          onSuccess={() => {
            setCollectAccount(null);
            loadDashboard();
          }}
        />
      )}
    </div>
  );
};
