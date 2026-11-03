import React, { useState, useEffect } from 'react';
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
      const rows = (dailyData.transactions || []).map((t: any) => ({
        ReceiptNumber: t.receiptNumber,
        TransactionID: t.transactionId,
        Customer: t.customerId?.name,
        Segment: t.financeType,
        Method: t.paymentMethod,
        Amount: t.amount,
      }));
      exportToExcel(rows, `Daily_Report_${dailyDate}`);
    } else if (activeReportTab === 'weekly' && weeklyData) {
      const rows = (weeklyData.payments || []).map((t: any) => ({
        Date: formatDate(t.paymentDate),
        TransactionID: t.transactionId,
        Customer: t.customerId?.name,
        Segment: t.financeType,
        Method: t.paymentMethod,
        Amount: t.amount,
      }));
      exportToExcel(rows, `Weekly_Report`);
    } else if (activeReportTab === 'monthly' && monthlyData) {
      const rows = [
        { Metric: 'Total Money Distributed', Value: monthlyData.summary.totalMoneyDistributed },
        { Metric: 'Total Amount Collected', Value: monthlyData.summary.totalAmountCollected },
        { Metric: 'Total Interest Earned', Value: monthlyData.summary.totalInterestCollected },
        { Metric: 'Chitti Contributions', Value: monthlyData.summary.chittiContributions },
        { Metric: 'Auction Payouts', Value: monthlyData.summary.auctionPayouts },
        { Metric: 'Outstanding Balance', Value: monthlyData.summary.totalOutstanding },
      ];
      exportToExcel(rows, `Monthly_Report_${monthlyMonth}_${monthlyYear}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Reports & Statements</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade daily, weekly, and monthly ledgers with instant PDF and Excel exports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
      </div>

      {/* Report Frequency Tabs & Date Filters */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600 w-full md:w-auto">
          <button
            onClick={() => setActiveReportTab('daily')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeReportTab === 'daily' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Daily Reports
          </button>
          <button
            onClick={() => setActiveReportTab('weekly')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeReportTab === 'weekly' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Weekly Reports
          </button>
          <button
            onClick={() => setActiveReportTab('monthly')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeReportTab === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Monthly Reports
          </button>
        </div>

        {/* Date Selector depending on active tab */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {activeReportTab === 'daily' && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500">Report Date:</span>
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-medium"
              />
            </div>
          )}

          {activeReportTab === 'monthly' && (
            <div className="flex items-center gap-2">
              <select
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2026, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={monthlyYear}
                onChange={(e) => setMonthlyYear(Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Daily Report View */}
      {activeReportTab === 'daily' && (
        <div className="space-y-6">
          {loading || !dailyData ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Generating daily statement...
            </div>
          ) : (
            <>
              {/* Daily Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-[11px] font-semibold uppercase">Total Collected</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {formatCurrencyExact(dailyData.summary.totalCollected)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Across all segments</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-[11px] font-semibold uppercase">Daily Finance Dues</span>
                  <p className="text-2xl font-black text-blue-700 mt-1">
                    {formatCurrencyExact(dailyData.summary.dailyCollections)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Micro-loan remittances</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-[11px] font-semibold uppercase">Weekly Dues</span>
                  <p className="text-2xl font-black text-indigo-700 mt-1">
                    {formatCurrencyExact(dailyData.summary.weeklyCollections)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Weekly collections</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-[11px] font-semibold uppercase">Chitti Collections</span>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {formatCurrencyExact(dailyData.summary.chittiCollections)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Chit contributions</p>
                </div>
              </div>

              {/* Transactions Table for the Day */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Transactions Recorded on {formatDate(dailyDate)} ({dailyData.transactions.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="p-2.5">Receipt #</th>
                        <th className="p-2.5">Customer</th>
                        <th className="p-2.5">Segment</th>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5">Reference</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dailyData.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            No collections recorded on this date.
                          </td>
                        </tr>
                      ) : (
                        dailyData.transactions.map((t: any) => (
                          <tr key={t._id}>
                            <td className="p-2.5 font-bold text-blue-700">{t.receiptNumber}</td>
                            <td className="p-2.5 font-bold text-slate-900">{t.customerId?.name}</td>
                            <td className="p-2.5 capitalize">{t.financeType}</td>
                            <td className="p-2.5 uppercase">{t.paymentMethod}</td>
                            <td className="p-2.5 font-mono text-slate-400">{t.transactionReference || '-'}</td>
                            <td className="p-2.5 text-right font-black text-emerald-600">
                              {formatCurrencyExact(t.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Weekly Report View */}
      {activeReportTab === 'weekly' && (
        <div className="space-y-6">
          {loading || !weeklyData ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Generating weekly statement...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-[11px] font-semibold uppercase">Week Total Inflow</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {formatCurrencyExact(weeklyData.summary.totalCollected)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-[11px] font-semibold uppercase">Customers Paid</span>
                  <p className="text-2xl font-black text-blue-700 mt-1">
                    {weeklyData.summary.customersPaidCount}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-[11px] font-semibold uppercase">Active Accounts</span>
                  <p className="text-2xl font-black text-indigo-700 mt-1">
                    {weeklyData.summary.activeAccountsCount}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-[11px] font-semibold uppercase">Total Outstanding</span>
                  <p className="text-2xl font-black text-rose-600 mt-1">
                    {formatCurrencyExact(weeklyData.summary.totalOutstanding)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Monthly Report View */}
      {activeReportTab === 'monthly' && (
        <div className="space-y-6">
          {loading || !monthlyData ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Compiling monthly ledger...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Capital Disbursed</span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {formatCurrencyExact(monthlyData.summary.totalMoneyDistributed)}
                </p>
                <p className="text-xs text-slate-400 mt-1">New loans issued this month</p>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Gross Monthly Inflows</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {formatCurrencyExact(monthlyData.summary.totalAmountCollected)}
                </p>
                <p className="text-xs text-slate-400 mt-1">All verified payments</p>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Interest Earned</span>
                <p className="text-2xl font-black text-indigo-600 mt-1">
                  {formatCurrencyExact(monthlyData.summary.totalInterestCollected)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Revenue margin from financing</p>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Chit Funds Contributed</span>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {formatCurrencyExact(monthlyData.summary.chittiContributions)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Member monthly installments</p>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Auction Net Payouts</span>
                <p className="text-2xl font-black text-blue-700 mt-1">
                  {formatCurrencyExact(monthlyData.summary.auctionPayouts)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Settled to prize winners</p>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Active Portfolio Outstanding</span>
                <p className="text-2xl font-black text-rose-600 mt-1">
                  {formatCurrencyExact(monthlyData.summary.totalOutstanding)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Remaining balance in market</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

