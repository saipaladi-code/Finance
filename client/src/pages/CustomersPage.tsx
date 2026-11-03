import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  FileText,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
  CreditCard,
  History,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Customer } from '../types/index.js';
import { formatCurrency, formatCurrencyExact, formatDate, formatDateTime, getStatusBadgeClass } from '../utils/formatters.js';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    idProofType: 'Aadhaar',
    idProofNumber: '',
    guarantorName: '',
    guarantorPhone: '',
    notes: '',
    status: 'active',
  });
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({ search, status: statusFilter });
      if (res.success) {
        setCustomers(res.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      idProofType: 'Aadhaar',
      idProofNumber: '',
      guarantorName: '',
      guarantorPhone: '',
      notes: '',
      status: 'active',
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || '',
      idProofType: c.idProofType || 'Aadhaar',
      idProofNumber: c.idProofNumber || '',
      guarantorName: c.guarantorName || '',
      guarantorPhone: c.guarantorPhone || '',
      notes: c.notes || '',
      status: c.status || 'active',
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer._id, formData);
      } else {
        await api.createCustomer(formData);
      }
      setShowAddModal(false);
      loadCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Error saving customer details.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (c: Customer) => {
    if (
      window.confirm(
        `Are you sure you want to delete customer ${c.name} (${c.customerId})? This action cannot be undone.`
      )
    ) {
      try {
        await api.deleteCustomer(c._id);
        loadCustomers();
      } catch (err: any) {
        alert(err.message || 'Error deleting customer.');
      }
    }
  };

  const handleViewProfile = async (id: string) => {
    setSelectedProfileId(id);
    setProfileLoading(true);
    try {
      const res = await api.getCustomerById(id);
      if (res.success) {
        setProfileData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized database of borrowers, chit members, repayment metrics & balances
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Register New Customer
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, ID, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses ({customers.length})</option>
            <option value="active">Active Only</option>
            <option value="defaulter">Defaulters</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Name & Phone</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Active Accounts</th>
                <th className="py-3 px-4">Total Borrowed</th>
                <th className="py-3 px-4">Total Paid</th>
                <th className="py-3 px-4">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{c.customerId}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={c.address}>
                      {c.address}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.dailyAccountsCount ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                            Daily: {c.dailyAccountsCount}
                          </span>
                        ) : null}
                        {c.weeklyAccountsCount ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                            Weekly: {c.weeklyAccountsCount}
                          </span>
                        ) : null}
                        {c.chittiMembershipCount ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 rounded-md border border-amber-100">
                            Chits: {c.chittiMembershipCount}
                          </span>
                        ) : null}
                        {!c.dailyAccountsCount && !c.weeklyAccountsCount && !c.chittiMembershipCount && (
                          <span className="text-[10px] text-slate-400 italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {formatCurrency(c.totalBorrowed)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">
                      {formatCurrency(c.totalPaid)}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-rose-600">
                      {formatCurrency(c.totalOutstanding)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${getStatusBadgeClass(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewProfile(c._id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Complete Financial Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Edit Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#0f172a] text-white flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {editingCustomer ? 'Edit Customer' : 'Register New Customer'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9840012345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Complete Address *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Street, locality, landmarks..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ID Proof Type</label>
                  <select
                    value={formData.idProofType}
                    onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Driving License">Driving License</option>
                    <option value="GST">GST Registration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ID Proof Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 1234 5678 9012"
                    value={formData.idProofNumber}
                    onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guarantor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. K. Ramesh"
                    value={formData.guarantorName}
                    onChange={(e) => setFormData({ ...formData, guarantorName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guarantor Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9840054321"
                    value={formData.guarantorPhone}
                    onChange={(e) => setFormData({ ...formData, guarantorPhone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="suresh@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="defaulter">Defaulter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Wholesale merchant, reliable payment history"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  disabled={formSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> Save Customer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile Detailed Modal */}
      {selectedProfileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {profileLoading || !profileData ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                Loading complete customer portfolio...
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="px-6 py-5 bg-[#0f172a] text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-md">
                      {profileData.customer.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {profileData.customer.name}
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                          {profileData.customer.customerId}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-300">
                        {profileData.customer.phone} • {profileData.customer.address}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProfileId(null)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Portfolio Summary Metrics */}
                <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-200">
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Borrowed</span>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      {formatCurrencyExact(profileData.summary.totalBorrowed)}
                    </p>
                  </div>
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Amount Paid</span>
                    <p className="text-xl font-bold text-emerald-600 mt-1">
                      {formatCurrencyExact(profileData.summary.totalPaid)}
                    </p>
                  </div>
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Outstanding</span>
                    <p className="text-xl font-bold text-rose-600 mt-1">
                      {formatCurrencyExact(profileData.summary.totalOutstanding)}
                    </p>
                  </div>
                </div>

                {/* Accounts and Chits Lists */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                  {/* Daily & Weekly Accounts */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" /> Active Finance Loans ({profileData.accounts.length})
                    </h3>
                    {profileData.accounts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No loans recorded for this customer.</p>
                    ) : (
                      <div className="space-y-2">
                        {profileData.accounts.map((acc: any) => (
                          <div
                            key={acc._id}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-slate-900 font-mono text-xs">{acc.accountNumber}</span>
                              <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-blue-100 text-blue-800">
                                {acc.financeType}
                              </span>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Principal: {formatCurrency(acc.principal)} • Installment: {formatCurrency(acc.installmentAmount)}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-slate-400 block">Remaining</span>
                              <span className="text-sm font-bold text-rose-600">{formatCurrencyExact(acc.remainingBalance)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chitti Memberships */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-600" /> Chit Fund Groups ({profileData.chitMemberships.length})
                    </h3>
                    {profileData.chitMemberships.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No chit group memberships.</p>
                    ) : (
                      <div className="space-y-2">
                        {profileData.chitMemberships.map((cm: any) => (
                          <div
                            key={cm._id}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-amber-50/30 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-slate-900 text-xs">
                                {cm.chitGroupId?.groupName} (Ticket #{cm.ticketNumber})
                              </span>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Chit Value: {formatCurrency(cm.chitGroupId?.chitValue)} • Monthly: {formatCurrency(cm.chitGroupId?.monthlyContribution)}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-slate-400 block">Total Contributed</span>
                              <span className="text-sm font-bold text-emerald-600">{formatCurrencyExact(cm.totalPaid)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lifetime Payments */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-600" /> Payment Ledger ({profileData.payments.length})
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Txn ID</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Method</th>
                            <th className="p-2.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {profileData.payments.map((p: any) => (
                            <tr key={p._id}>
                              <td className="p-2.5 text-slate-600">{formatDate(p.paymentDate)}</td>
                              <td className="p-2.5 font-mono text-slate-800">{p.transactionId}</td>
                              <td className="p-2.5 capitalize">{p.financeType}</td>
                              <td className="p-2.5 uppercase">{p.paymentMethod}</td>
                              <td className="p-2.5 text-right font-bold text-emerald-600">{formatCurrencyExact(p.amount)}</td>
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
                    onClick={() => setSelectedProfileId(null)}
                    className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-colors"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

