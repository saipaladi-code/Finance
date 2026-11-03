import React, { useState, useEffect } from 'react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Today's Collections Sheet</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rapid collection workflow for field agents and counter cashiers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold">
            Pending Due: <span className="font-extrabold text-sm">{formatCurrency(totalDuePending)}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Module Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'daily' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Daily Collections ({dailyAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'weekly' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Weekly Collections ({weeklyAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Combined View
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600 shrink-0">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'pending' ? 'bg-white text-rose-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'paid' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Collections Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading collection sheet...
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            🎉 No pending collections matching this criteria!
          </div>
        ) : (
          filteredAccounts.map((acc: any) => {
            const isPaid = acc.todayPaid >= acc.installmentAmount;
            return (
              <div
                key={acc._id}
                className={`bg-white rounded-3xl p-5 border shadow-xs transition-all flex flex-col justify-between ${
                  isPaid ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {acc.accountNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isPaid ? 'Paid Today ✓' : 'Due Today'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{acc.customer.name}</h3>
                  <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" /> {acc.customer.phone}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Installment</span>
                      <span className="font-bold text-blue-700 text-sm">
                        {formatCurrencyExact(acc.installmentAmount)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Balance</span>
                      <span className="font-bold text-rose-600 text-sm">
                        {formatCurrencyExact(acc.remainingBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setQrAccount(acc)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    title="Show UPI QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCollectAccount(acc)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <BadgeIndianRupee className="w-3.5 h-3.5" />
                    <span>Collect {formatCurrency(acc.installmentAmount)}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

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

      {/* QR Modal */}
      {qrAccount && (
        <QrPaymentModal
          amount={qrAccount.installmentAmount}
          customerName={qrAccount.customer?.name}
          accountReference={qrAccount.accountNumber}
          onClose={() => setQrAccount(null)}
          onConfirmReference={(ref, method) => {
            setQrAccount(null);
            setCollectAccount(qrAccount);
          }}
        />
      )}
    </div>
  );
};

