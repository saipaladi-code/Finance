import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  Coins,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api.js';
import { formatCurrency, formatCurrencyExact, formatDate, formatDateTime } from '../utils/formatters.js';
import { exportReportPDF } from '../utils/pdfGenerator.js';
import { exportToExcel, exportToCSV } from '../utils/excelExport.js';

export const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState<boolean>(true);

  // Filter params
  const [dailyDate, setDailyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weeklyStart, setWeeklyStart] = useState<string>('');
  const [weeklyEnd, setWeeklyEnd] = useState<string>('');
  const [monthlyMonth, setMonthlyMonth] = useState<number>(new Date().getMonth() + 1);
  const [monthlyYear, setMonthlyYear] = useState<number>(new Date().getFullYear());

  // Report data holders
  const [dailyData, setDailyData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      if (activeReportTab === 'daily') {
        const res = await api.getDailyReport(dailyDate);
        if (res.success) setDailyData(res);
      } else if (activeReportTab === 'weekly') {
        const res = await api.getWeeklyReport({ startDate: weeklyStart, endDate: weeklyEnd });
        if (res.success) setWeeklyData(res);
      } else {
        const res = await api.getMonthlyReport({ month: monthlyMonth, year: monthlyYear });
        if (res.success) setMonthlyData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReportTab, dailyDate, weeklyStart, weeklyEnd, monthlyMonth, monthlyYear]);

  // Export handlers
  const handleExportPDF = () => {
    if (activeReportTab === 'daily' && dailyData) {
      const headers = ['Receipt #', 'Txn ID', 'Customer', 'Type', 'Method', 'Amount'];
      const rows = (dailyData.transactions || []).map((t: any) => [
        t.receiptNumber,
        t.transactionId,
        t.customerId?.name || 'Customer',
        t.financeType.toUpperCase(),
        t.paymentMethod.toUpperCase(),
        formatCurrencyExact(t.amount),
      ]);
      exportReportPDF(`Daily Financial Report - ${dailyDate}`, headers, rows, `Daily_Report_${dailyDate}.pdf`);
    } else if (activeReportTab === 'weekly' && weeklyData) {
      const headers = ['Date', 'Txn ID', 'Customer', 'Type', 'Method', 'Amount'];
      const rows = (weeklyData.payments || []).map((t: any) => [
        formatDate(t.paymentDate),
        t.transactionId,
        t.customerId?.name || 'Customer',
        t.financeType.toUpperCase(),
        t.paymentMethod.toUpperCase(),
        formatCurrencyExact(t.amount),
      ]);
      exportReportPDF(`Weekly Collections Report`, headers, rows, `Weekly_Report.pdf`);
    } else if (activeReportTab === 'monthly' && monthlyData) {
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Total Money Distributed', formatCurrencyExact(monthlyData.summary.totalMoneyDistributed)],
        ['Total Amount Collected', formatCurrencyExact(monthlyData.summary.totalAmountCollected)],
        ['Total Interest Earned', formatCurrencyExact(monthlyData.summary.totalInterestCollected)],
        ['Chitti Contributions', formatCurrencyExact(monthlyData.summary.chittiContributions)],
        ['Chit Auction Payouts', formatCurrencyExact(monthlyData.summary.auctionPayouts)],
        ['Total Outstanding Balance', formatCurrencyExact(monthlyData.summary.totalOutstanding)],
      ];
      exportReportPDF(`Monthly Financial Summary - ${monthlyMonth}/${monthlyYear}`, headers, rows, `Monthly_Report_${monthlyMonth}_${monthlyYear}.pdf`);
    }
  };

  const handleExportExcel = () => {
    if (activeReportTab === 'daily' && dailyData) {
      const exportRows = (dailyData.transactions || []).map((t: any) => ({
        'Receipt No': t.receiptNumber,
        'Transaction ID': t.transactionId,
        'Customer Name': t.customerId?.name || 'Customer',
        'Finance Type': t.financeType.toUpperCase(),
        'Payment Method': t.paymentMethod.toUpperCase(),
        'Amount': t.amount,
      }));
      exportToExcel(exportRows, `Daily_Report_${dailyDate}`);
    } else if (activeReportTab === 'weekly' && weeklyData) {
      const exportRows = (weeklyData.payments || []).map((t: any) => ({
        'Date': formatDate(t.paymentDate),
        'Transaction ID': t.transactionId,
        'Customer Name': t.customerId?.name || 'Customer',
        'Finance Type': t.financeType.toUpperCase(),
        'Payment Method': t.paymentMethod.toUpperCase(),
        'Amount': t.amount,
      }));
      exportToExcel(exportRows, `Weekly_Report_${weeklyStart}_to_${weeklyEnd}`);
    } else if (activeReportTab === 'monthly' && monthlyData) {
      const exportRows = [
        { Metric: 'Total Money Distributed', Value: monthlyData.summary.totalMoneyDistributed },
        { Metric: 'Total Amount Collected', Value: monthlyData.summary.totalAmountCollected },
        { Metric: 'Total Interest Collected', Value: monthlyData.summary.totalInterestCollected },
        { Metric: 'Chitti Contributions', Value: monthlyData.summary.chittiContributions },
        { Metric: 'Chit Auction Payouts', Value: monthlyData.summary.auctionPayouts },
        { Metric: 'Total Outstanding Balance', Value: monthlyData.summary.totalOutstanding },
      ];
      exportToExcel(exportRows, `Monthly_Report_${monthlyMonth}_${monthlyYear}`);
    }
  };

  const handleExportCSV = () => {
    if (activeReportTab === 'daily' && dailyData) {
      const exportRows = (dailyData.transactions || []).map((t: any) => ({
        'Receipt No': t.receiptNumber,
        'Transaction ID': t.transactionId,
        'Customer Name': t.customerId?.name || 'Customer',
        'Finance Type': t.financeType.toUpperCase(),
        'Payment Method': t.paymentMethod.toUpperCase(),
        'Amount': t.amount,
      }));
      exportToCSV(exportRows, `Daily_Report_${dailyDate}`);
    } else if (activeReportTab === 'weekly' && weeklyData) {
      const exportRows = (weeklyData.payments || []).map((t: any) => ({
        'Date': formatDate(t.paymentDate),
        'Transaction ID': t.transactionId,
        'Customer Name': t.customerId?.name || 'Customer',
        'Finance Type': t.financeType.toUpperCase(),
        'Payment Method': t.paymentMethod.toUpperCase(),
        'Amount': t.amount,
      }));
      exportToCSV(exportRows, `Weekly_Report_${weeklyStart}_to_${weeklyEnd}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A] tracking-tight">
            {t('reports.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t('reports.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex rounded-2xl bg-slate-100 p-1 text-xs sm:text-sm font-bold text-slate-600 max-w-md">
        <button
          onClick={() => setActiveReportTab('daily')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeReportTab === 'daily'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          {t('reports.dailyReport')}
        </button>
        <button
          onClick={() => setActiveReportTab('weekly')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeReportTab === 'weekly'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          {t('reports.weeklyReport')}
        </button>
        <button
          onClick={() => setActiveReportTab('monthly')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeReportTab === 'monthly'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          Monthly Summary
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-4">
        {activeReportTab === 'daily' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{t('common.date')}:</span>
            <input
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className="px-3.5 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-300 font-medium"
            />
          </div>
        )}

        {activeReportTab === 'weekly' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">{t('reports.startDate')}:</span>
              <input
                type="date"
                value={weeklyStart}
                onChange={(e) => setWeeklyStart(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">{t('reports.endDate')}:</span>
              <input
                type="date"
                value={weeklyEnd}
                onChange={(e) => setWeeklyEnd(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>
        )}

        {activeReportTab === 'monthly' && (
          <div className="flex items-center gap-3">
            <select
              value={monthlyMonth}
              onChange={(e) => setMonthlyMonth(Number(e.target.value))}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  Month {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="2020"
              max="2035"
              value={monthlyYear}
              onChange={(e) => setMonthlyYear(Number(e.target.value))}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 w-24 font-medium"
            />
          </div>
        )}
      </div>

      {/* Report Summary Cards */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          {t('common.loading')}
        </div>
      ) : activeReportTab === 'daily' && dailyData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('dashboard.todaysCollection')}</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrencyExact(dailyData.summary?.totalCollected)}
              </p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('nav.dailyFinance')}</span>
              <p className="text-2xl font-black text-blue-600 mt-1">
                {formatCurrencyExact(dailyData.summary?.dailyCollection)}
              </p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('nav.weeklyFinance')}</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                {formatCurrencyExact(dailyData.summary?.weeklyCollection)}
              </p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('nav.chitti')}</span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {formatCurrencyExact(dailyData.summary?.chittiCollection)}
              </p>
            </div>
          </div>

          {/* Daily Transactions */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 bg-[#F5F7FB] border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-bold text-sm text-slate-900">
                {t('dashboard.recentTransactions')} ({dailyData.transactions?.length || 0})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{t('payments.receiptNo')}</th>
                    <th className="py-3 px-4">{t('dashboard.customer')}</th>
                    <th className="py-3 px-4">{t('payments.financeType')}</th>
                    <th className="py-3 px-4">{t('dashboard.paymentMethod')}</th>
                    <th className="py-3 px-4">{t('dashboard.amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyData.transactions?.map((t: any) => (
                    <tr key={t._id}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{t.receiptNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{t.customerId?.name}</td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-700">{t.financeType}</td>
                      <td className="py-3 px-4 uppercase">{t.paymentMethod}</td>
                      <td className="py-3 px-4 font-black text-emerald-600">{formatCurrencyExact(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeReportTab === 'weekly' && weeklyData ? (
        <div className="space-y-6">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('reports.totalCollected')}</span>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              {formatCurrencyExact(weeklyData.totalCollected)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F5F7FB] text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{t('common.date')}</th>
                    <th className="py-3 px-4">{t('dashboard.transactionId')}</th>
                    <th className="py-3 px-4">{t('dashboard.customer')}</th>
                    <th className="py-3 px-4">{t('payments.financeType')}</th>
                    <th className="py-3 px-4">{t('dashboard.amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weeklyData.payments?.map((p: any) => (
                    <tr key={p._id}>
                      <td className="py-3 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.transactionId}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.customerId?.name}</td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-700">{p.financeType}</td>
                      <td className="py-3 px-4 font-black text-emerald-600">{formatCurrencyExact(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeReportTab === 'monthly' && monthlyData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('reports.totalDisbursed')}</span>
            <p className="text-2xl font-black text-indigo-700 mt-1">
              {formatCurrencyExact(monthlyData.summary?.totalMoneyDistributed)}
            </p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('reports.totalCollected')}</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {formatCurrencyExact(monthlyData.summary?.totalAmountCollected)}
            </p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('reports.netOutstanding')}</span>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {formatCurrencyExact(monthlyData.summary?.totalOutstanding)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
