import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Coins,
  Search,
  Plus,
  Users,
  Award,
  Calendar,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  X,
  CheckCircle,
  Receipt,
  Eye,
  Loader2,
  DollarSign,
  Info,
} from 'lucide-react';
import { api } from '../services/api.js';
import { ChitGroup, ChitMember, ChitAuction, Customer, Payment } from '../types/index.js';
import { formatCurrency, formatCurrencyExact, formatDate, formatDateTime, getStatusBadgeClass } from '../utils/formatters.js';
import { ReceiptModal } from '../components/common/ReceiptModal.js';

export const ChittiPage: React.FC = () => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<ChitGroup[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disclaimer, setDisclaimer] = useState<string>('');

  // Selected Group Details State
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<{
    group: ChitGroup;
    stats: any;
    members: ChitMember[];
    auctions: ChitAuction[];
    payments: Payment[];
  } | null>(null);
  const [groupDetailsLoading, setGroupDetailsLoading] = useState<boolean>(false);

  // Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [showAuctionModal, setShowAuctionModal] = useState<boolean>(false);
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [selectedMemberForPay, setSelectedMemberForPay] = useState<ChitMember | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Forms
  const [newGroup, setNewGroup] = useState({
    groupName: '',
    groupCode: '',
    chitValue: 100000,
    totalMembers: 20,
    durationMonths: 20,
    monthlyContribution: 5000,
    startDate: new Date().toISOString().split('T')[0],
    monthlyDueDate: 10,
    foremanCommissionPercent: 5,
    groupDescription: '',
  });

  const [newMember, setNewMember] = useState({
    customerId: '',
    ticketNumber: '',
    nomineeName: '',
    nomineeRelation: 'Spouse',
    nomineePhone: '',
  });

  const [auctionForm, setAuctionForm] = useState({
    winningMemberId: '',
    bidAmount: 20000,
    auctionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 5000,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    transactionReference: '',
    notes: '',
  });

  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [grpRes, custRes] = await Promise.all([
        api.getChitGroups({ status: statusFilter }),
        api.getCustomers(),
      ]);
      if (grpRes.success) {
        setGroups(grpRes.groups || []);
        if (grpRes.disclaimer) setDisclaimer(grpRes.disclaimer);
      }
      if (custRes.success) {
        setCustomers(custRes.customers || []);
      }
    } catch (err) {
      console.error('Failed to load chit groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadGroupDetails = async (id: string) => {
    setSelectedGroupId(id);
    setGroupDetailsLoading(true);
    try {
      const res = await api.getChitGroupById(id);
      if (res.success) {
        setGroupDetails(res);
        if (res.group.nextMonthNetPayable) {
          setPaymentForm((prev) => ({ ...prev, amount: res.group.nextMonthNetPayable }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGroupDetailsLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError('');
    try {
      const res = await api.createChitGroup(newGroup);
      if (res.success) {
        setShowCreateGroupModal(false);
        loadData();
      } else {
        setModalError(res.message || 'Error creating chit group.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Server error creating chit group.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleEnrollMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !newMember.customerId) {
      setModalError('Please select a customer.');
      return;
    }
    setModalSubmitting(true);
    setModalError('');
    try {
      const res = await api.addChitMember(selectedGroupId, newMember);
      if (res.success) {
        setShowAddMemberModal(false);
        loadGroupDetails(selectedGroupId);
        loadData();
      } else {
        setModalError(res.message || 'Error enrolling member.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Server error adding member.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleConductAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !auctionForm.winningMemberId) {
      setModalError('Please select winning bidder.');
      return;
    }
    setModalSubmitting(true);
    setModalError('');
    try {
      const res = await api.conductAuction(selectedGroupId, auctionForm);
      if (res.success) {
        setShowAuctionModal(false);
        loadGroupDetails(selectedGroupId);
        loadData();
      } else {
        setModalError(res.message || 'Error conducting auction.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Server error conducting auction.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleRecordChitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !selectedMemberForPay) return;
    setModalSubmitting(true);
    setModalError('');
    try {
      const res = await api.recordChitPayment(selectedGroupId, {
        memberId: selectedMemberForPay._id,
        ...paymentForm,
      });
      if (res.success && res.payment) {
        setShowPayModal(false);
        setSelectedReceipt({
          ...res.payment,
          customerId: selectedMemberForPay.customerId,
          chitGroupId: groupDetails?.group,
        });
        loadGroupDetails(selectedGroupId);
        loadData();
      } else {
        setModalError(res.message || 'Error recording contribution.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Server error recording payment.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Live Auction Calculation preview
  const previewForemanCommission = groupDetails?.group
    ? Math.round((groupDetails.group.chitValue * (groupDetails.group.foremanCommissionPercent || 5)) / 100)
    : 5000;
  const previewTotalDividend = Math.max(0, auctionForm.bidAmount - previewForemanCommission);
  const previewDividendPerMember = groupDetails?.group
    ? Math.round(previewTotalDividend / groupDetails.group.totalMembers)
    : 0;
  const previewNetPayout = groupDetails?.group
    ? Math.max(0, groupDetails.group.chitValue - auctionForm.bidAmount)
    : 0;
  const previewNextPayable = groupDetails?.group
    ? Math.max(0, groupDetails.group.monthlyContribution - previewDividendPerMember)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Statutory Legal Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold uppercase tracking-wider text-amber-900 text-[11px] mb-0.5">
            Bookkeeping & Management System Notice
          </p>
          <p className="text-amber-800">
            {disclaimer ||
              'This software serves strictly as an operational record-keeping and ledger calculation tool. It does not replace applicable regulatory approvals, legal registrations, or compliance under the Chit Funds Act or jurisdictional authorities.'}
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A] tracking-tight">
            {t('chitti.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t('chitti.subtitle')}
          </p>
        </div>
        <button
          onClick={() => {
            setModalError('');
            setShowCreateGroupModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> {t('chitti.addNewGroup')}
        </button>
      </div>

      {/* Chit Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            {t('common.loading')}
          </div>
        ) : groups.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            {t('chitti.emptyChitti')}
          </div>
        ) : (
          groups.map((grp) => (
            <div
              key={grp._id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                    {grp.groupCode}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${getStatusBadgeClass(grp.status)}`}>
                    {grp.status === 'active' ? t('common.active') : grp.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2.5 line-clamp-1">{grp.groupName}</h3>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {formatCurrency(grp.chitValue)}
                  <span className="text-xs font-normal text-slate-400 ml-1">{t('chitti.totalChitValue')}</span>
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-2.5 bg-[#F5F7FB] rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block font-medium">{t('chitti.monthlyContribution')}</span>
                    <span className="font-bold text-slate-800">{formatCurrency(grp.monthlyContribution)}</span>
                  </div>
                  <div className="p-2.5 bg-[#F5F7FB] rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block font-medium">Due Date</span>
                    <span className="font-bold text-slate-800">{grp.monthlyDueDate}th</span>
                  </div>
                  <div className="p-2.5 bg-[#F5F7FB] rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block font-medium">{t('chitti.members')}</span>
                    <span className="font-bold text-slate-800">
                      {grp.enrolledMembers || 0} / {grp.totalMembers}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F5F7FB] rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block font-medium">{t('chitti.auction')}</span>
                    <span className="font-bold text-indigo-700">
                      {grp.auctionsConducted || 0} / {grp.durationMonths}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                    <span>{t('chitti.members')}</span>
                    <span>{Math.round(((grp.enrolledMembers || 0) / grp.totalMembers) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((grp.enrolledMembers || 0) / grp.totalMembers) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => loadGroupDetails(grp._id)}
                className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#142B4A] hover:bg-blue-600 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>{t('chitti.members')} & {t('chitti.auction')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Selected Group Management View (Modal) */}
      {selectedGroupId && groupDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 bg-[#142B4A] text-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {groupDetails.group.groupName}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                    {groupDetails.group.groupCode}
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {t('chitti.totalChitValue')}: {formatCurrency(groupDetails.group.chitValue)} • {t('chitti.monthlyContribution')}: {formatCurrency(groupDetails.group.monthlyContribution)} • {groupDetails.group.durationMonths} {t('chitti.totalMonths')}
                </p>
              </div>
              <button
                onClick={() => setSelectedGroupId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B375E] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Header Actions & Metrics */}
            <div className="p-5 bg-[#F5F7FB] border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setModalError('');
                    setShowAddMemberModal(true);
                  }}
                  disabled={groupDetails.members.length >= groupDetails.group.totalMembers}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('chitti.addMember')} ({groupDetails.members.length}/{groupDetails.group.totalMembers})
                </button>
                <button
                  onClick={() => {
                    setModalError('');
                    setShowAuctionModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Award className="w-3.5 h-3.5" /> {t('chitti.auction')} (#{groupDetails.stats.nextAuctionNumber})
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div>
                  <span className="text-slate-400 block text-[10px]">{t('dashboard.totalCollected')}</span>
                  <span className="text-emerald-700 text-sm font-bold">
                    {formatCurrency(groupDetails.stats.totalCollected)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{t('chitti.winnerPayout')}</span>
                  <span className="text-blue-700 text-sm font-bold">
                    {formatCurrency(groupDetails.stats.totalDistributed)}
                  </span>
                </div>
              </div>
            </div>

            {/* Body: Members Table & Auction History */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Members List */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>{t('chitti.members')} ({groupDetails.members.length})</span>
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F7FB] border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-2.5">Ticket #</th>
                        <th className="p-2.5">{t('customers.name')}</th>
                        <th className="p-2.5">{t('customers.mobile')}</th>
                        <th className="p-2.5">{t('customers.totalRepaid')}</th>
                        <th className="p-2.5">{t('chitti.status')}</th>
                        <th className="p-2.5 text-right">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupDetails.members.map((m) => (
                        <tr key={m._id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-blue-700 font-mono">#{m.ticketNumber}</td>
                          <td className="p-2.5 font-bold text-slate-900">{m.customerId?.name || 'Customer'}</td>
                          <td className="p-2.5 font-mono text-slate-600">{m.customerId?.phone}</td>
                          <td className="p-2.5 font-bold text-emerald-600">{formatCurrencyExact(m.totalPaid)}</td>
                          <td className="p-2.5">
                            {m.hasWonAuction ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                {t('chitti.winningMember')} (#{m.wonAuctionNumber}) 🏆
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                {t('common.active')}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedMemberForPay(m);
                                setModalError('');
                                setShowPayModal(true);
                              }}
                              className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold"
                            >
                              {t('common.collectPayment')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Auction History */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  {t('chitti.auctionHistory')} ({groupDetails.auctions.length})
                </h3>
                {groupDetails.auctions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No auctions conducted yet for this group.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F5F7FB] border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="p-2.5">Auction #</th>
                          <th className="p-2.5">{t('common.date')}</th>
                          <th className="p-2.5">{t('chitti.winningMember')}</th>
                          <th className="p-2.5">{t('chitti.bidAmount')}</th>
                          <th className="p-2.5">{t('chitti.foremanCommission')}</th>
                          <th className="p-2.5">{t('chitti.dividendPerMember')}</th>
                          <th className="p-2.5">{t('chitti.nextMonthPayable')}</th>
                          <th className="p-2.5 text-right">{t('chitti.winnerPayout')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groupDetails.auctions.map((auc) => (
                          <tr key={auc._id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold text-slate-800">#{auc.auctionNumber}</td>
                            <td className="p-2.5 text-slate-600">{formatDate(auc.auctionDate)}</td>
                            <td className="p-2.5 font-bold text-slate-900">
                              {auc.winningCustomerId?.name} (#{auc.winningMemberId?.ticketNumber})
                            </td>
                            <td className="p-2.5 font-semibold text-rose-600">{formatCurrency(auc.bidAmount)}</td>
                            <td className="p-2.5 text-slate-600">{formatCurrency(auc.foremanCommission)}</td>
                            <td className="p-2.5 font-bold text-emerald-600">{formatCurrency(auc.dividendPerMember)}</td>
                            <td className="p-2.5 font-semibold text-blue-700">{formatCurrency(auc.nextMonthNetPayable)}</td>
                            <td className="p-2.5 text-right font-black text-slate-900">
                              {formatCurrencyExact(auc.netPayoutAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#F5F7FB] border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedGroupId(null)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Chit Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#142B4A] text-white flex items-center justify-between">
              <h2 className="text-base font-bold text-white">{t('chitti.addNewGroup')}</h2>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('chitti.groupName')} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Lakshmi Premium Chit - ₹1 Lakh"
                  value={newGroup.groupName}
                  onChange={(e) => setNewGroup({ ...newGroup, groupName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('chitti.totalChitValue')} *</label>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    required
                    value={newGroup.chitValue}
                    onChange={(e) => {
                      const cVal = Number(e.target.value);
                      const mContrib = Math.round(cVal / (newGroup.durationMonths || 20));
                      setNewGroup({ ...newGroup, chitValue: cVal, monthlyContribution: mContrib });
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('chitti.members')} *</label>
                  <input
                    type="number"
                    min="2"
                    max="100"
                    required
                    value={newGroup.totalMembers}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setNewGroup({
                        ...newGroup,
                        totalMembers: m,
                        durationMonths: m,
                        monthlyContribution: Math.round(newGroup.chitValue / m),
                      });
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('chitti.monthlyContribution')}</label>
                  <input
                    type="number"
                    required
                    value={newGroup.monthlyContribution}
                    onChange={(e) => setNewGroup({ ...newGroup, monthlyContribution: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs font-bold text-blue-700 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('chitti.commissionPercentage')}</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    required
                    value={newGroup.foremanCommissionPercent}
                    onChange={(e) => setNewGroup({ ...newGroup, foremanCommissionPercent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {modalSubmitting ? t('common.loading') : t('common.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#142B4A] text-white flex items-center justify-between">
              <h2 className="text-base font-bold text-white">{t('chitti.addMember')}</h2>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollMember} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('customers.name')} *</label>
                <select
                  required
                  value={newMember.customerId}
                  onChange={(e) => {
                    const cust = customers.find((c) => c._id === e.target.value);
                    setNewMember({
                      ...newMember,
                      customerId: e.target.value,
                      nomineeName: cust?.guarantorName || '',
                      nomineePhone: cust?.guarantorPhone || cust?.phone || '',
                    });
                  }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Choose registered customer --</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.customerId}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ticket Number (Leave empty for auto-assign)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={newMember.ticketNumber}
                  onChange={(e) => setNewMember({ ...newMember, ticketNumber: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {modalSubmitting ? t('common.loading') : t('common.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conduct Auction Modal with Live Calculation Preview */}
      {showAuctionModal && groupDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#142B4A] text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  {t('chitti.auction')} #{groupDetails.stats.nextAuctionNumber}
                </h2>
                <p className="text-xs text-slate-300">
                  {t('chitti.totalChitValue')}: {formatCurrency(groupDetails.group.chitValue)}
                </p>
              </div>
              <button
                onClick={() => setShowAuctionModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConductAuction} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('chitti.winningMember')} *
                </label>
                <select
                  required
                  value={auctionForm.winningMemberId}
                  onChange={(e) => setAuctionForm({ ...auctionForm, winningMemberId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="">-- {t('chitti.winningMember')} --</option>
                  {groupDetails.members
                    .filter((m) => !m.hasWonAuction)
                    .map((m) => (
                      <option key={m._id} value={m._id}>
                        Ticket #{m.ticketNumber}: {m.customerId?.name} ({m.customerId?.phone})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('chitti.bidAmount')} *
                </label>
                <input
                  type="number"
                  min={previewForemanCommission}
                  max={groupDetails.group.chitValue}
                  step="500"
                  required
                  value={auctionForm.bidAmount}
                  onChange={(e) => setAuctionForm({ ...auctionForm, bidAmount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-sm font-bold text-rose-600 rounded-xl border border-slate-300"
                />
              </div>

              {/* Transparent Calculation Breakdown */}
              <div className="p-4 rounded-2xl bg-[#F5F7FB] border border-slate-200 space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                  Auction Calculation Preview
                </p>
                <div className="flex justify-between text-slate-600">
                  <span>{t('chitti.foremanCommission')}:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(previewForemanCommission)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t('chitti.dividend')}:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(previewTotalDividend)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t('chitti.dividendPerMember')}:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(previewDividendPerMember)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t('chitti.nextMonthPayable')}:</span>
                  <span className="font-bold text-blue-700">{formatCurrency(previewNextPayable)}</span>
                </div>
                <div className="flex justify-between text-slate-800 pt-2 border-t border-slate-200 font-bold">
                  <span>{t('chitti.winnerPayout')}:</span>
                  <span className="text-base text-blue-800 font-black">{formatCurrencyExact(previewNetPayout)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAuctionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {modalSubmitting ? t('common.loading') : t('common.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Chit Monthly Contribution Modal */}
      {showPayModal && selectedMemberForPay && groupDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#142B4A] text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">{t('chitti.monthlyContribution')}</h2>
                <p className="text-xs text-slate-300">
                  Ticket #{selectedMemberForPay.ticketNumber} • {selectedMemberForPay.customerId?.name}
                </p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordChitPayment} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('paymentModal.amountPaying')} *</label>
                <input
                  type="number"
                  min="100"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-base font-bold text-slate-900 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {modalSubmitting ? t('common.loading') : t('common.save')}
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
