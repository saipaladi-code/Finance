import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  BadgeIndianRupee,
  Coins,
  TrendingUp,
  AlertTriangle,
  Clock,
  Calendar,
  CalendarDays,
  RefreshCw,
  Receipt,
  CheckCircle2,
  ArrowUpRight,
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
  const { t } = useTranslation();
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
          <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const cards = data?.cards;
  const charts = data?.charts;
  const sections = data?.sections;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A] tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs hover:shadow transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? t('dashboard.refreshing') : t('dashboard.refresh')}</span>
        </button>
      </div>

      {/* 6 Primary Financial Summary Cards + 4 Additional Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. Total Customers */}
        <StatCard
          title={t('dashboard.totalCustomers')}
          value={cards?.totalCustomers || 0}
          subtitle={t('dashboard.registered')}
          icon={Users}
          colorScheme="blue"
          indicator={`${cards?.totalCustomers || 0}`}
        />
        {/* 2. Total Money Distributed */}
        <StatCard
          title={t('dashboard.totalDistributed')}
          value={formatCurrency(cards?.totalMoneyDistributed)}
          subtitle={t('dashboard.loansDisbursed')}
          icon={TrendingUp}
          colorScheme="indigo"
          indicator="Outflow"
        />
        {/* 3. Total Amount Collected */}
        <StatCard
          title={t('dashboard.totalCollected')}
          value={formatCurrency(cards?.totalAmountCollected)}
          subtitle={t('dashboard.collectedSoFar')}
          icon={BadgeIndianRupee}
          colorScheme="emerald"
          indicator="Inflow"
        />
        {/* 4. Today's Collection */}
        <StatCard
          title={t('dashboard.todaysCollection')}
          value={formatCurrency(cards?.todayCollection)}
          subtitle={t('common.today')}
          icon={Coins}
          colorScheme="emerald"
          indicator="Live"
        />
        {/* 5. Total Outstanding */}
        <StatCard
          title={t('dashboard.totalOutstanding')}
          value={formatCurrency(cards?.totalOutstandingAmount)}
          subtitle={t('dashboard.unpaidDue')}
          icon={Clock}
          colorScheme="rose"
          indicator="Due"
        />
        {/* 6. Today's Pending Payments */}
        <StatCard
          title={t('dashboard.pendingPayments')}
          value={cards?.todayPendingPaymentsCount || 0}
          subtitle={`${t('dashboard.dueToday')}: ${formatCurrency(cards?.todayExpectedAmount)}`}
          icon={Calendar}
          colorScheme="amber"
        />
        {/* Additional: Overdue Accounts */}
        <StatCard
          title={t('dashboard.overdueCustomers')}
          value={cards?.overdueCustomersCount || 0}
          subtitle={t('common.overdue')}
          icon={AlertTriangle}
          colorScheme="rose"
        />
        {/* Additional: Active Daily Finance */}
        <StatCard
          title={t('dashboard.activeDailyFinance')}
          value={cards?.activeDailyAccounts || 0}
          subtitle={t('nav.dailyFinance')}
          icon={Calendar}
          colorScheme="blue"
        />
        {/* Additional: Active Weekly Finance */}
        <StatCard
          title={t('dashboard.activeWeeklyFinance')}
          value={cards?.activeWeeklyAccounts || 0}
          subtitle={t('nav.weeklyFinance')}
          icon={CalendarDays}
          colorScheme="indigo"
        />
        {/* Additional: Active Chitti Groups */}
        <StatCard
          title={t('dashboard.activeChittiGroups')}
          value={cards?.activeChittiGroups || 0}
          subtitle={t('nav.chitti')}
          icon={Coins}
          colorScheme="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Daily Collection Trend (7 Days) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#142B4A]">
                {t('dashboard.dailyCollectionOverview')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t('dashboard.dailyCollectionOverview')} (Daily, Weekly & Chitti)
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Live
            </span>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.dailyCollection || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="daily" name={t('nav.dailyFinance')} stroke="#2563EB" fillOpacity={1} fill="url(#colorDaily)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="weekly" name={t('nav.weeklyFinance')} stroke="#16A34A" fillOpacity={1} fill="url(#colorWeekly)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="chitti" name={t('nav.chitti')} stroke="#F59E0B" fill="#F59E0B" strokeWidth={2} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Total Collection vs Outstanding (Donut) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#142B4A]">
              {t('dashboard.collectionVsOutstanding')}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Recovery vs Unpaid Portfolio
            </p>
          </div>
          <div className="h-56 relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.collectionVsOutstanding || []}
                  innerRadius={60}
                  outerRadius={85}
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
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-100">
              <span className="block text-[11px] text-emerald-700 font-medium">{t('dashboard.totalCollected')}</span>
              <span className="font-bold text-sm">{formatCurrency(cards?.totalAmountCollected)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-900 border border-rose-100">
              <span className="block text-[11px] text-rose-700 font-medium">{t('dashboard.totalOutstanding')}</span>
              <span className="font-bold text-sm">{formatCurrency(cards?.totalOutstandingAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Monthly Collection Performance */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#142B4A]">
                {t('dashboard.monthlyCollectionOverview')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Aggregated cash collection inflows (Last 6 Months)
              </p>
            </div>
          </div>
          <div className="h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.monthlyCollection || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="collection" name={t('nav.collections')} fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Finance Distribution */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#142B4A]">
                {t('dashboard.financeDistribution')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Capital distribution across Daily, Weekly & Chits
              </p>
            </div>
          </div>
          <div className="h-60 sm:h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.financeDistribution || []}
                  innerRadius={55}
                  outerRadius={80}
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

      {/* Today's Payments & Overdue Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Today's Collection Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#142B4A]">
                {t('dashboard.todaysPayments')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Installments scheduled for collection today
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              {sections?.todayPayments.length || 0} {t('common.pending')}
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-[#F5F7FB]">
                  <th className="py-3 px-3.5">{t('dashboard.customer')}</th>
                  <th className="py-3 px-3.5">{t('payments.financeType')}</th>
                  <th className="py-3 px-3.5">{t('dashboard.expectedAmount')}</th>
                  <th className="py-3 px-3.5">{t('dashboard.paidAmount')}</th>
                  <th className="py-3 px-3.5">{t('dashboard.paymentStatus')}</th>
                  <th className="py-3 px-3.5 text-right">{t('dashboard.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {sections?.todayPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      {t('dashboard.noPaymentsToday')}
                    </td>
                  </tr>
                ) : (
                  sections?.todayPayments.map((row: any) => (
                    <tr key={row._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3.5">
                        <p className="font-bold text-slate-900">{row.customerName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{row.phoneNumber}</p>
                      </td>
                      <td className="py-3.5 px-3.5">
                        <span className="capitalize font-semibold text-slate-700">
                          {row.financeType === 'daily' ? t('nav.dailyFinance') : t('nav.weeklyFinance')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3.5 font-bold text-slate-900">
                        {formatCurrencyExact(row.expectedAmount)}
                      </td>
                      <td className="py-3.5 px-3.5 font-bold text-emerald-600">
                        {formatCurrencyExact(row.paidAmount)}
                      </td>
                      <td className="py-3.5 px-3.5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${getStatusBadgeClass(row.paymentStatus)}`}>
                          {row.paymentStatus === 'paid' ? t('common.paid') : t('common.pending')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3.5 text-right">
                        {row.paymentStatus !== 'paid' ? (
                          <button
                            onClick={() => handleQuickCollect(row.accountNumber, row.financeType)}
                            className="px-3.5 py-1.5 bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            {t('dashboard.collect')}
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {t('common.completed')}
                          </span>
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
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#142B4A]">
                {t('dashboard.overdueCustomers')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Accounts with missed due dates
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-full">
              {sections?.overdueCustomers.length || 0}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-96 space-y-3 scrollbar-thin">
            {sections?.overdueCustomers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                🎉 {t('dashboard.noPaymentsToday')}
              </div>
            ) : (
              sections?.overdueCustomers.map((cust: any) => (
                <div
                  key={cust.customerId}
                  className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between gap-3 hover:bg-rose-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{cust.customerName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{cust.phoneNumber}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                      {cust.pendingInstallmentsCount} {t('common.pending')}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-rose-600">{formatCurrencyExact(cust.pendingAmount)}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(cust.oldestDueDate)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Recent Transactions Table */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#142B4A]">
              {t('dashboard.recentTransactions')}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live verified collections recorded into the financial ledger
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-[#F5F7FB]">
                <th className="py-3 px-3.5">{t('payments.receiptNo')}</th>
                <th className="py-3 px-3.5">{t('dashboard.customer')}</th>
                <th className="py-3 px-3.5">{t('payments.financeType')}</th>
                <th className="py-3 px-3.5">{t('dashboard.paymentDate')}</th>
                <th className="py-3 px-3.5">{t('dashboard.paymentMethod')}</th>
                <th className="py-3 px-3.5">{t('dashboard.amount')}</th>
                <th className="py-3 px-3.5 text-right">{t('dashboard.receipt')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {sections?.recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {t('dashboard.noTransactions')}
                  </td>
                </tr>
              ) : (
                sections?.recentTransactions.map((tx: any) => (
                  <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3.5 font-mono font-semibold text-slate-900">
                      <div>{tx.receiptNumber}</div>
                      <div className="text-[10px] text-slate-400">{tx.transactionId}</div>
                    </td>
                    <td className="py-3.5 px-3.5 font-bold text-slate-900">{tx.customerName}</td>
                    <td className="py-3.5 px-3.5 capitalize font-medium text-slate-700">{tx.financeType}</td>
                    <td className="py-3.5 px-3.5 text-slate-600 font-mono text-xs">{formatDateTime(tx.paymentDate)}</td>
                    <td className="py-3.5 px-3.5">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-800 uppercase">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 font-black text-emerald-600 text-sm">
                      {formatCurrencyExact(tx.amount)}
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <button
                        onClick={() => handleViewReceipt(tx._id)}
                        className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                        title={t('common.downloadReceipt')}
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
