import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BadgeIndianRupee,
  Search,
  CheckCircle,
  Clock,
  Phone,
  QrCode,
  Filter,
  Calendar,
  AlertTriangle,
  Receipt,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api.js';
import { FinanceAccount, Payment } from '../types/index.js';
import { formatCurrency, formatCurrencyExact, formatDate } from '../utils/formatters.js';
import { CollectPaymentModal } from '../components/common/CollectPaymentModal.js';
import { QrPaymentModal } from '../components/common/QrPaymentModal.js';
import { ReceiptModal } from '../components/common/ReceiptModal.js';

export const CollectionsPage: React.FC = () => {
  const { t } = useTranslation();
  const [dailyAccounts, setDailyAccounts] = useState<FinanceAccount[]>([]);
  const [weeklyAccounts, setWeeklyAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'all'>('daily');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('pending');

  const [collectAccount, setCollectAccount] = useState<FinanceAccount | null>(null);
  const [qrAccount, setQrAccount] = useState<FinanceAccount | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dRes, wRes] = await Promise.all([
        api.getDailyAccounts({ status: 'active' }),
        api.getWeeklyAccounts({ status: 'active' }),
      ]);
      if (dRes.success) setDailyAccounts(dRes.accounts || []);
      if (wRes.success) setWeeklyAccounts(wRes.accounts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const combinedAccounts = [
    ...(activeTab === 'weekly' ? [] : dailyAccounts),
    ...(activeTab === 'daily' ? [] : weeklyAccounts),
  ];

  const filteredAccounts = combinedAccounts.filter((acc: any) => {
    const custName = acc.customer?.name?.toLowerCase() || '';
    const phone = acc.customer?.phone?.toLowerCase() || '';
    const accNo = acc.accountNumber?.toLowerCase() || '';
    const matchesSearch =
      custName.includes(search.toLowerCase()) ||
      phone.includes(search.toLowerCase()) ||
      accNo.includes(search.toLowerCase());

    const isPaidToday = acc.todayPaid >= acc.installmentAmount;
    if (statusFilter === 'pending') {
      return matchesSearch && !isPaidToday;
    }
    if (statusFilter === 'paid') {
      return matchesSearch && isPaidToday;
    }
    return matchesSearch;
  });

  const totalDuePending = filteredAccounts.reduce(
    (sum, a) => sum + (a.installmentAmount || 0),
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A] tracking-tight">
            {t('collections.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t('collections.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs sm:text-sm font-semibold">
            {t('collections.pendingToday')}: <span className="font-black text-sm sm:text-base">{formatCurrency(totalDuePending)}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Loan Segment Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs sm:text-sm font-bold text-slate-600 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'daily'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            {t('nav.dailyFinance')} ({dailyAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'weekly'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            {t('nav.weeklyFinance')} ({weeklyAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            {t('common.all')} ({dailyAccounts.length + weeklyAccounts.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('common.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#F5F7FB] focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            {t('common.pending')}
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            {t('common.paid')}
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            {t('common.all')}
          </button>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-[#F5F7FB]">
                <th className="py-3 px-4">{t('customers.name')} & {t('customers.mobile')}</th>
                <th className="py-3 px-4">{t('receiptModal.accountNo')}</th>
                <th className="py-3 px-4">{t('dailyFinance.dailyInstallment')}</th>
                <th className="py-3 px-4">{t('customers.totalRepaid')}</th>
                <th className="py-3 px-4">{t('customers.outstandingBalance')}</th>
                <th className="py-3 px-4">{t('dashboard.paymentStatus')}</th>
                <th className="py-3 px-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    {t('common.loading')}
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {t('dashboard.noPaymentsToday')}
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc: any) => {
                  const isPaid = acc.todayPaid >= acc.installmentAmount;
                  return (
                    <tr key={acc._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{acc.customer?.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {acc.customer?.phone}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {acc.accountNumber}
                        <span className="block text-[10px] text-slate-400 font-sans uppercase">
                          {acc.financeType === 'daily' ? t('nav.dailyFinance') : t('nav.weeklyFinance')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-700">
                        {formatCurrencyExact(acc.installmentAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        {formatCurrencyExact(acc.totalPaid)}
                      </td>
                      <td className="py-3.5 px-4 font-black text-rose-600">
                        {formatCurrencyExact(acc.remainingBalance)}
                      </td>
                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {t('common.paid')} ✓
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {t('common.pending')}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setQrAccount(acc)}
                            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                            title="UPI QR Code"
                          >
                            <QrCode className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => setCollectAccount(acc)}
                            className="px-3.5 py-1.5 bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            {t('collections.quickCollect')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Modal */}
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

      {/* QR Modal */}
      {qrAccount && (
        <QrPaymentModal
          amount={qrAccount.installmentAmount || 100}
          customerName={qrAccount.customer?.name}
          accountNumber={qrAccount.accountNumber}
          onClose={() => setQrAccount(null)}
        />
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal payment={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  );
};
